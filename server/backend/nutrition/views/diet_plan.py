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
    DietPlanDetailSerializer,  # Add this import
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
        elif self.action in ["retrieve", "with_foods_detail"]:
            return DietPlanDetailSerializer
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
            serializer.data,  # Match daily_entry pattern
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

        return Response(serializer.data)  # Match daily_entry pattern

    def destroy(self, request, *args, **kwargs):
        """Delete a diet plan"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

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
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific diet plan with full details"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def alternatives(self, request):
        """Get all alternative diet plans"""
        queryset = self.get_queryset().filter(is_alternative=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def main_plans(self, request):
        """Get all main (non-alternative) diet plans"""
        queryset = self.get_queryset().filter(is_alternative=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def with_foods_detail(self, request, pk=None):
        """Get diet plan with detailed food information - similar to daily_entry pattern"""
        diet_plan = self.get_object()
        serializer = DietPlanDetailSerializer(diet_plan)
        return Response({"data": serializer.data})

    @action(detail=True, methods=["post"])
    def add_food(self, request, pk=None):
        """Add a food to an existing diet plan - similar to daily_entry add_food_entry"""
        diet_plan = self.get_object()

        # Add diet_plan to request data
        data = request.data.copy()
        data["diet_plan"] = diet_plan.id

        serializer = DietPlanFoodCreateSerializer(
            data=data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        diet_plan_food = serializer.save()

        # Return the created food entry with full details
        response_serializer = DietPlanFoodSerializer(diet_plan_food)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def recalculate_totals(self, request, pk=None):
        """Recalculate nutrition totals for the diet plan - similar to daily_entry"""
        diet_plan = self.get_object()
        totals = diet_plan.calculate_totals()

        return Response(
            {"message": "Totals recalculated successfully", "totals": totals}
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

        serializer = DietPlanDetailSerializer(new_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def toggle_alternative(self, request, pk=None):
        """Toggle alternative status of a diet plan"""
        diet_plan = self.get_object()
        diet_plan.is_alternative = not diet_plan.is_alternative
        diet_plan.save()

        serializer = self.get_serializer(diet_plan)
        return Response(serializer.data)

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
        return Response(serializer.data)

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
            diet_plan_food.delete()

            # Return updated diet plan
            serializer = self.get_serializer(diet_plan)
            return Response(serializer.data)

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

        return Response(choices)

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

        return Response(stats)

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

        return Response(analysis)


class DietPlanFoodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing foods within diet plans
    Similar to FoodEntryViewSet in daily_entry
    """

    serializer_class = DietPlanFoodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter foods by authenticated user's diet plans"""
        return (
            DietPlanFood.objects.filter(diet_plan__user_id=self.request.user)
            .select_related("food", "diet_plan")
            .order_by("meal_type", "order", "created_at")
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ["create", "update", "partial_update"]:
            return DietPlanFoodCreateSerializer
        return DietPlanFoodSerializer

    def create(self, request, *args, **kwargs):
        """Create a new diet plan food - match FoodEntryViewSet pattern"""
        diet_plan_id = request.data.get("diet_plan")

        # Verify the diet plan belongs to the authenticated user
        try:
            diet_plan = get_object_or_404(
                DietPlan, id=diet_plan_id, user_id=request.user
            )
        except DietPlan.DoesNotExist:
            return Response(
                {"error": "Diet plan not found or access denied"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        diet_plan_food = serializer.save()

        # Return full serialized data
        response_serializer = DietPlanFoodSerializer(diet_plan_food)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a diet plan food - match FoodEntryViewSet pattern"""
        response = super().update(request, *args, **kwargs)

        # Return full serialized data
        if response.status_code == 200:
            food_entry = self.get_object()
            response_serializer = DietPlanFoodSerializer(food_entry)
            return Response(response_serializer.data)

        return response

    def destroy(self, request, *args, **kwargs):
        """Remove a food from a diet plan - match FoodEntryViewSet pattern"""
        response = super().destroy(request, *args, **kwargs)
        # The model's delete method will automatically recalculate totals
        return response

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
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_diet_plan(self, request):
        """Get foods grouped by diet plan"""
        diet_plan_id = request.query_params.get("diet_plan")
        if not diet_plan_id:
            return Response(
                {"error": "diet_plan parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(diet_plan_id=diet_plan_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_meal_type(self, request):
        """Get foods grouped by meal type - similar to daily_entry pattern"""
        meal_type = request.query_params.get("meal_type")
        diet_plan_id = request.query_params.get("diet_plan")

        if not meal_type:
            return Response(
                {"error": "meal_type parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(meal_type=meal_type)

        if diet_plan_id:
            queryset = queryset.filter(diet_plan_id=diet_plan_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """Duplicate a diet plan food to another diet plan"""
        original_food = self.get_object()
        target_diet_plan_id = request.data.get("target_diet_plan")

        if not target_diet_plan_id:
            return Response(
                {"error": "target_diet_plan is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_diet_plan = get_object_or_404(
                DietPlan, id=target_diet_plan_id, user_id=request.user
            )
        except DietPlan.DoesNotExist:
            return Response(
                {"error": "Target diet plan not found or access denied"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Create duplicate
        duplicated_food = DietPlanFood.objects.create(
            diet_plan=target_diet_plan,
            food=original_food.food,
            meal_type=request.data.get("meal_type", original_food.meal_type),
            serving_type=original_food.serving_type,
            fatsecret_serving_id=original_food.fatsecret_serving_id,
            custom_serving_unit=original_food.custom_serving_unit,
            custom_serving_amount=original_food.custom_serving_amount,
            quantity=original_food.quantity,
            order=original_food.order,
        )

        serializer = DietPlanFoodSerializer(duplicated_food)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def quick_add(self, request):
        """Quickly add a food with minimal information - similar to daily_entry"""
        required_fields = ["diet_plan", "food", "meal_type"]
        for field in required_fields:
            if field not in request.data:
                return Response(
                    {"error": f"{field} is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Use default serving and quantity if not provided
        data = request.data.copy()
        if "serving_type" not in data:
            data["serving_type"] = "fatsecret"
        if "quantity" not in data:
            data["quantity"] = 1.0

        serializer = DietPlanFoodCreateSerializer(
            data=data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        diet_plan_food = serializer.save()

        response_serializer = DietPlanFoodSerializer(diet_plan_food)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
