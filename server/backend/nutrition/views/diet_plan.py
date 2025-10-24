from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone

from ..models import Food, DietPlan, DietPlanFood
from ..serializers.diet_plan import (
    DietPlanSerializer,
    DietPlanListSerializer,
    DietPlanFoodSerializer,
    DietPlanFoodCreateSerializer,
)


class DietPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing diet plans
    Provides CRUD operations and custom actions for diet plans
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter diet plans by authenticated user"""
        return (
            DietPlan.objects.filter(user_id=self.request.user)
            .prefetch_related("diet_plan_foods__food")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return DietPlanListSerializer
        return DietPlanSerializer

    def perform_create(self, serializer):
        """Set the user_id to the authenticated user when creating a diet plan"""
        serializer.save(user_id=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create a new diet plan with foods"""
        # Remove user_id from request data if present
        data = request.data.copy()
        data.pop("user_id", None)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "Diet plan created successfully", "data": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        """Update an existing diet plan"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Remove user_id from request data
        data = request.data.copy()
        data.pop("user_id", None)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(
            {"message": "Diet plan updated successfully", "data": serializer.data}
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a diet plan"""
        instance = self.get_object()
        title = instance.title
        self.perform_destroy(instance)
        return Response(
            {"message": f'Diet plan "{title}" deleted successfully'},
            status=status.HTTP_204_NO_CONTENT,
        )

    def list(self, request, *args, **kwargs):
        """List all diet plans for the authenticated user with filtering"""
        queryset = self.filter_queryset(self.get_queryset())

        # Filtering options
        is_alternative = request.query_params.get("is_alternative")
        if is_alternative is not None:
            is_alternative_bool = is_alternative.lower() == "true"
            queryset = queryset.filter(is_alternative=is_alternative_bool)

        # Search functionality
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(diet_plan_foods__food__food_name__icontains=search)
            ).distinct()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(
                {
                    "message": "Diet plans retrieved successfully",
                    "data": serializer.data,
                }
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {"message": "Diet plans retrieved successfully", "data": serializer.data}
        )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific diet plan with full details"""
        instance = self.get_object()
        serializer = DietPlanSerializer(instance)
        return Response(
            {"message": "Diet plan retrieved successfully", "data": serializer.data}
        )

    @action(detail=False, methods=["get"])
    def alternatives(self, request):
        """Get all alternative diet plans"""
        queryset = self.get_queryset().filter(is_alternative=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                "message": "Alternative diet plans retrieved successfully",
                "data": serializer.data,
            }
        )

    @action(detail=False, methods=["get"])
    def main_plans(self, request):
        """Get all main (non-alternative) diet plans"""
        queryset = self.get_queryset().filter(is_alternative=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                "message": "Main diet plans retrieved successfully",
                "data": serializer.data,
            }
        )

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """Duplicate a diet plan"""
        original_plan = self.get_object()

        # Create new diet plan
        new_plan = DietPlan.objects.create(
            user_id=original_plan.user_id,
            is_alternative=request.data.get("is_alternative", True),
        )

        # Copy foods
        for diet_plan_food in original_plan.diet_plan_foods.all():
            DietPlanFood.objects.create(
                diet_plan=new_plan,
                food=diet_plan_food.food,
                meal_type=diet_plan_food.meal_type,
                serving_type=diet_plan_food.serving_type,
                fatsecret_serving_id=diet_plan_food.fatsecret_serving_id,
                custom_serving_unit=diet_plan_food.custom_serving_unit,
                custom_serving_amount=diet_plan_food.custom_serving_amount,
                quantity=diet_plan_food.quantity,
                order=diet_plan_food.order,
            )

        serializer = DietPlanSerializer(new_plan)
        return Response(
            {
                "message": "Diet plan duplicated successfully",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def toggle_alternative(self, request, pk=None):
        """Toggle alternative status of a diet plan"""
        diet_plan = self.get_object()
        diet_plan.is_alternative = not diet_plan.is_alternative
        diet_plan.save()

        status_text = "alternative" if diet_plan.is_alternative else "main"
        serializer = DietPlanSerializer(diet_plan)
        return Response(
            {
                "message": f"Diet plan marked as {status_text} successfully",
                "data": serializer.data,
            }
        )

    @action(detail=True, methods=["get"])
    def foods(self, request, pk=None):
        """Get all foods for a specific diet plan"""
        diet_plan = self.get_object()
        foods = diet_plan.diet_plan_foods.all()

        # Optional filtering by meal type
        meal_type = request.query_params.get("meal_type")
        if meal_type:
            foods = foods.filter(meal_type=meal_type)

        serializer = DietPlanFoodSerializer(foods, many=True)
        return Response(
            {
                "message": "Diet plan foods retrieved successfully",
                "data": serializer.data,
            }
        )

    @action(detail=True, methods=["post"])
    def add_food(self, request, pk=None):
        """Add a food to an existing diet plan"""
        diet_plan = self.get_object()

        # Add diet_plan to request data
        data = request.data.copy()
        data["diet_plan"] = diet_plan.id

        serializer = DietPlanFoodCreateSerializer(
            data=data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        diet_plan_food = serializer.save()

        # Return updated diet plan
        plan_serializer = DietPlanSerializer(diet_plan)
        return Response(
            {"message": "Food added successfully", "data": plan_serializer.data}
        )

    @action(detail=True, methods=["delete"])
    def remove_food(self, request, pk=None):
        """Remove a food from a diet plan"""
        diet_plan = self.get_object()
        food_id = request.data.get("food_id")

        if not food_id:
            return Response(
                {"error": "food_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            diet_plan_food = get_object_or_404(
                DietPlanFood, id=food_id, diet_plan=diet_plan
            )
            food_name = diet_plan_food.food.food_name
            diet_plan_food.delete()

            # Return updated diet plan
            serializer = DietPlanSerializer(diet_plan)
            return Response(
                {
                    "message": f'Food "{food_name}" removed successfully',
                    "data": serializer.data,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to remove food: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"])
    def choices(self, request):
        """Get available choices for diet plan fields"""
        choices = {
            "meal_types": [
                {"value": choice[0], "label": choice[1]}
                for choice in DietPlanFood.MEAL_TYPE_CHOICES
            ],
            "serving_types": [
                {"value": choice[0], "label": choice[1]}
                for choice in DietPlanFood.SERVING_TYPE_CHOICES
            ],
        }

        return Response(
            {"message": "Diet plan choices retrieved successfully", "data": choices}
        )

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get diet plan statistics for the user"""
        queryset = self.get_queryset()

        stats = {
            "overview": {
                "total_plans": queryset.count(),
                "main_plans": queryset.filter(is_alternative=False).count(),
                "alternative_plans": queryset.filter(is_alternative=True).count(),
            },
            "recent_activity": {
                "created_this_week": queryset.filter(
                    created_at__gte=timezone.now() - timezone.timedelta(days=7)
                ).count(),
                "updated_today": queryset.filter(
                    updated_at__date=timezone.now().date()
                ).count(),
            },
        }

        return Response(
            {"message": "Diet plan statistics retrieved successfully", "data": stats}
        )

    @action(detail=True, methods=["get"])
    def nutrition_analysis(self, request, pk=None):
        """Get detailed nutrition analysis for a diet plan"""
        diet_plan = self.get_object()

        # Get meals breakdown
        meals_breakdown = diet_plan.get_meals_breakdown()

        # Calculate nutrition percentages (assuming 2000 calorie diet)
        total_calories = diet_plan.total_calories
        daily_target = 2000

        analysis = {
            "nutrition_totals": {
                "calories": diet_plan.total_calories,
                "protein": diet_plan.total_protein,
                "carbs": diet_plan.total_carbs,
                "fat": diet_plan.total_fat,
            },
            "daily_percentage": {
                "calories": (
                    round((total_calories / daily_target) * 100, 1)
                    if daily_target > 0
                    else 0
                )
            },
            "meals_breakdown": meals_breakdown,
            "meal_distribution": {},
        }

        # Calculate meal distribution percentages
        if total_calories > 0:
            for meal_type, meal_data in meals_breakdown.items():
                meal_calories = meal_data["totals"]["calories"]
                analysis["meal_distribution"][meal_type] = {
                    "calories": meal_calories,
                    "percentage": round((meal_calories / total_calories) * 100, 1),
                }

        return Response(
            {"message": "Nutrition analysis retrieved successfully", "data": analysis}
        )


class DietPlanFoodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing foods within diet plans
    Similar to food entries but for diet plans
    """

    serializer_class = DietPlanFoodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter foods by authenticated user's diet plans"""
        return (
            DietPlanFood.objects.filter(diet_plan__user_id=self.request.user)
            .select_related("food", "diet_plan")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ["create", "update", "partial_update"]:
            return DietPlanFoodCreateSerializer
        return DietPlanFoodSerializer

    def create(self, request, *args, **kwargs):
        """Create a new diet plan food"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        diet_plan_food = serializer.save()

        # Return the created food with full details
        response_serializer = DietPlanFoodSerializer(diet_plan_food)
        return Response(
            {
                "message": "Food added to diet plan successfully",
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """Update a diet plan food"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Remove diet_plan from update data (shouldn't be changed)
        data = request.data.copy()
        data.pop("diet_plan", None)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Return updated food with full details
        response_serializer = DietPlanFoodSerializer(instance)
        return Response(
            {
                "message": "Diet plan food updated successfully",
                "data": response_serializer.data,
            }
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Diet plan deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )

    def list(self, request, *args, **kwargs):
        """List diet plan foods with filtering options"""
        queryset = self.filter_queryset(self.get_queryset())

        # Filter by diet plan
        diet_plan_id = request.query_params.get("diet_plan")
        if diet_plan_id:
            queryset = queryset.filter(diet_plan_id=diet_plan_id)

        # Filter by meal type
        meal_type = request.query_params.get("meal_type")
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(
                {
                    "message": "Diet plan foods retrieved successfully",
                    "data": serializer.data,
                }
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                "message": "Diet plan foods retrieved successfully",
                "data": serializer.data,
            }
        )

    @action(detail=False, methods=["get"])
    def by_diet_plan(self, request):
        """Get foods grouped by diet plan"""
        queryset = self.get_queryset()

        # Group by diet plan
        diet_plans = DietPlan.objects.filter(user_id=request.user)
        grouped_foods = {}

        for diet_plan in diet_plans:
            foods = queryset.filter(diet_plan=diet_plan)
            serializer = self.get_serializer(foods, many=True)
            grouped_foods[diet_plan.id] = {
                "diet_plan": {
                    "id": diet_plan.id,
                    "is_alternative": diet_plan.is_alternative,
                },
                "foods": serializer.data,
                "count": foods.count(),
            }

        return Response(
            {
                "message": "Foods grouped by diet plan retrieved successfully",
                "data": grouped_foods,
            }
        )

    @action(detail=False, methods=["get"])
    def by_meal_type(self, request):
        """Get foods grouped by meal type"""
        queryset = self.get_queryset()

        # Optional filter by diet plan
        diet_plan_id = request.query_params.get("diet_plan")
        if diet_plan_id:
            queryset = queryset.filter(diet_plan_id=diet_plan_id)

        grouped_foods = {}
        for meal_type, meal_name in DietPlanFood.MEAL_TYPE_CHOICES:
            foods = queryset.filter(meal_type=meal_type)
            serializer = self.get_serializer(foods, many=True)
            grouped_foods[meal_type] = {
                "name": meal_name,
                "foods": serializer.data,
                "count": foods.count(),
            }

        return Response(
            {
                "message": "Foods grouped by meal type retrieved successfully",
                "data": grouped_foods,
            }
        )
