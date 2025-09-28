from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import date, timedelta
from .fatsecret_service import FatSecretService
from .models import NutritionProfile, Food, DailyEntry, Meal, MealFoodEntry
from .serializers import (
    NutritionProfileSerializer,
    FoodSerializer,
    FoodWithServingsSerializer,
    DailyEntrySerializer,
    MealSerializer,
    MealFoodEntrySerializer,
    MealCreateSerializer,
    MealFoodEntryCreateSerializer,
    QuickAddFoodEntrySerializer,
)
import logging

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def test_fatsecret_token(request):
    """Test FatSecret token acquisition"""
    try:
        fatsecret_service = FatSecretService()
        token = fatsecret_service._get_access_token()
        return Response(
            {
                "success": True,
                "token_preview": token[:20] + "..." if token else None,
                "token_length": len(token) if token else 0,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"FatSecret token test error: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_foods(request):
    """Search foods using FatSecret API"""
    search_term = request.GET.get("q", "")
    page = int(request.GET.get("page", 0))

    if not search_term:
        return Response(
            {"error": "Search term is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        fatsecret_service = FatSecretService()
        results = fatsecret_service.search_foods(search_term, page)
        return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"FatSecret search error: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_food_details(request, food_id):
    """Get detailed nutrition information for a food"""
    try:
        fatsecret_service = FatSecretService()
        food_details = fatsecret_service.get_food_details(food_id)
        return Response(food_details, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"FatSecret food details error: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NutritionProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user nutrition profiles.

    Provides CRUD operations for nutrition profiles and custom actions
    for recalculating macros and retrieving profile statistics.
    """

    serializer_class = NutritionProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return nutrition profile for the authenticated user only"""
        return NutritionProfile.objects.filter(account=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Create nutrition profile - usually auto-created via signals,
        but allow manual creation if needed
        """
        # Check if user already has a nutrition profile
        if hasattr(request.user, "nutrition_profile"):
            return Response(
                {"error": "User already has a nutrition profile"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(account=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def recalculate_macros(self, request, pk=None):
        """
        Recalculate macro goals based on current user profile data.

        This action triggers macro recalculation using the user's current
        weight, activity level, and body goals from their profile.
        """
        nutrition_profile = self.get_object()

        # Trigger macro recalculation
        nutrition_profile.update_macros()

        serializer = self.get_serializer(nutrition_profile)
        return Response(
            {"message": "Macros recalculated successfully", "data": serializer.data}
        )

    @action(detail=True, methods=["get"])
    def weekly_summary(self, request, pk=None):
        """
        Get weekly nutrition summary for the user.

        Returns average daily intake vs goals for the past 7 days.
        """
        nutrition_profile = self.get_object()
        end_date = date.today()
        start_date = end_date - timedelta(days=6)

        # Get daily entries for the past week
        daily_entries = nutrition_profile.daily_entries.filter(
            date__range=[start_date, end_date]
        )

        if not daily_entries.exists():
            return Response(
                {
                    "message": "No nutrition data available for the past week",
                    "data": None,
                }
            )

        # Calculate averages
        total_days = daily_entries.count()
        avg_calories = sum(entry.total_calories for entry in daily_entries) / total_days
        avg_protein = sum(entry.total_protein for entry in daily_entries) / total_days
        avg_carbs = sum(entry.total_carbs for entry in daily_entries) / total_days
        avg_fat = sum(entry.total_fat for entry in daily_entries) / total_days

        summary_data = {
            "period": f"{start_date} to {end_date}",
            "days_tracked": total_days,
            "averages": {
                "calories": round(avg_calories, 1),
                "protein": round(avg_protein, 1),
                "carbs": round(avg_carbs, 1),
                "fat": round(avg_fat, 1),
            },
            "goals": {
                "calories": nutrition_profile.daily_calories_goal,
                "protein": nutrition_profile.daily_protein_goal,
                "carbs": nutrition_profile.daily_carbs_goal,
                "fat": nutrition_profile.daily_fat_goal,
            },
            "progress": {
                "calories": round(
                    (avg_calories / nutrition_profile.daily_calories_goal) * 100, 1
                ),
                "protein": round(
                    (avg_protein / nutrition_profile.daily_protein_goal) * 100, 1
                ),
                "carbs": round(
                    (avg_carbs / nutrition_profile.daily_carbs_goal) * 100, 1
                ),
                "fat": round((avg_fat / nutrition_profile.daily_fat_goal) * 100, 1),
            },
        }

        return Response(summary_data)

    @action(detail=False, methods=["post"])
    def create_for_current_user(self, request):
        """
        Create nutrition profile for the current user if they don't have one.

        This handles existing accounts that don't have nutrition profiles.
        """
        # Check if user already has a nutrition profile
        if hasattr(request.user, "nutrition_profile"):
            return Response(
                {
                    "error": "User already has a nutrition profile",
                    "profile": NutritionProfileSerializer(
                        request.user.nutrition_profile
                    ).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create nutrition profile
        nutrition_profile = NutritionProfile.objects.create(account=request.user)

        serializer = self.get_serializer(nutrition_profile)
        return Response(
            {
                "message": "Nutrition profile created successfully",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class FoodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing food items from FatSecret API.

    Provides CRUD operations for foods and search functionality
    for finding foods by name or brand. This works with locally stored
    foods that have been imported from FatSecret API.
    """

    queryset = Food.objects.all()
    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["food_name", "brand_name", "food_type"]
    filterset_fields = ["food_type", "brand_name"]
    ordering_fields = ["food_name", "created_at"]
    ordering = ["food_name"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ["retrieve", "with_servings"]:
            return FoodWithServingsSerializer
        return FoodSerializer

    @action(detail=False, methods=["get"])
    def search_foods(self, request):
        """
        Advanced food search within locally stored foods.

        Supports searching by name, brand, and food type with fuzzy matching.
        This searches the local database, not the FatSecret API.
        """
        query = request.query_params.get("q", "")
        food_type = request.query_params.get("type", "")
        brand = request.query_params.get("brand", "")

        if not query and not food_type and not brand:
            return Response(
                {
                    "error": "Please provide at least one search parameter (q, type, or brand)"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        foods = self.get_queryset()

        # Apply filters
        if query:
            foods = foods.filter(
                Q(food_name__icontains=query)
                | Q(brand_name__icontains=query)
                | Q(food_description__icontains=query)
            )

        if food_type:
            foods = foods.filter(food_type__icontains=food_type)

        if brand:
            foods = foods.filter(brand_name__icontains=brand)

        # Limit results to prevent overwhelming the client
        foods = foods[:50]

        serializer = self.get_serializer(foods, many=True)
        return Response({"count": len(serializer.data), "results": serializer.data})

    @action(detail=False, methods=["get"])
    def check_duplicates(self, request):
        """
        Check for potential duplicate foods before importing.

        Query parameter: q (search term)
        """
        query = request.query_params.get("q", "")

        if not query:
            return Response(
                {"error": "q parameter is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Search for similar foods
        similar_foods = self.get_queryset().filter(
            Q(food_name__icontains=query) | Q(brand_name__icontains=query)
        )[
            :10
        ]  # Limit to top 10 matches

        serializer = self.get_serializer(similar_foods, many=True)

        return Response(
            {
                "query": query,
                "similar_foods": serializer.data,
                "count": len(serializer.data),
            }
        )

    @action(detail=True, methods=["get"])
    def with_servings(self, request, pk=None):
        """
        Get food details with parsed serving options.
        """
        food = self.get_object()
        serializer = FoodWithServingsSerializer(food)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def import_from_fatsecret(self, request):
        """
        Import a food item from FatSecret API and save it locally.
        Prevents duplicates by checking existing foods first.
        """
        food_id = request.data.get("food_id")
        if not food_id:
            return Response(
                {"error": "food_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Check if food already exists by FatSecret ID
            existing_food = Food.objects.filter(food_id=food_id).first()
            if existing_food:
                return Response(
                    {
                        "message": "Food already exists in database",
                        "food": FoodSerializer(existing_food).data,
                        "created": False,
                    },
                    status=status.HTTP_200_OK,
                )

            # Get food details from FatSecret API
            fatsecret_service = FatSecretService()
            food_details = fatsecret_service.get_food_details(food_id)

            # Create Food object from FatSecret data
            food_data = {
                "food_id": food_id,
                "food_name": food_details.get("food_name", ""),
                "brand_name": food_details.get("brand_name", ""),
                "food_type": food_details.get("food_type", ""),
                "food_description": food_details.get("food_description", ""),
                "calories": food_details.get("calories", 0.0),
                "protein": food_details.get("protein", 0.0),
                "carbs": food_details.get("carbs", 0.0),
                "fat": food_details.get("fat", 0.0),
                "fatsecret_servings": food_details.get("servings", []),
            }

            serializer = self.get_serializer(data=food_data)
            serializer.is_valid(raise_exception=True)
            food = serializer.save()

            return Response(
                {
                    "message": "Food imported successfully",
                    "food": serializer.data,
                    "created": True,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Food import error: {str(e)}")
            return Response(
                {"error": f"Failed to import food: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DailyEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing daily nutrition entries.

    Handles daily nutrition tracking with automatic total calculations
    and provides various filtering and summary options.
    """

    serializer_class = DailyEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["date"]
    ordering_fields = ["date"]
    ordering = ["-date"]

    def get_queryset(self):
        """Return daily entries for the authenticated user's nutrition profile"""
        return DailyEntry.objects.filter(
            nutrition_profile__account=self.request.user
        ).prefetch_related("meals__food_entries__food")

    def create(self, request, *args, **kwargs):
        """
        Create a new daily entry for the authenticated user.

        Automatically assigns the user's nutrition profile.
        """
        # Get user's nutrition profile
        nutrition_profile = getattr(request.user, "nutrition_profile", None)
        if not nutrition_profile:
            return Response(
                {"error": "User does not have a nutrition profile"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(nutrition_profile=nutrition_profile)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def today(self, request):
        """
        Get or create today's daily entry for the authenticated user.

        If no entry exists for today, creates a new one with zero totals.
        """
        today = date.today()
        nutrition_profile = request.user.nutrition_profile

        daily_entry, created = DailyEntry.objects.get_or_create(
            nutrition_profile=nutrition_profile, date=today
        )

        serializer = self.get_serializer(daily_entry)
        return Response({"created": created, "data": serializer.data})

    @action(detail=False, methods=["get"])
    def date_range(self, request):
        """
        Get daily entries within a specific date range.

        Query parameters: start_date, end_date (YYYY-MM-DD format)
        """
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if not start_date or not end_date:
            return Response(
                {"error": "Both start_date and end_date parameters are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            entries = self.get_queryset().filter(date__range=[start_date, end_date])

            serializer = self.get_serializer(entries, many=True)
            return Response({"count": entries.count(), "results": serializer.data})

        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"])
    def recalculate_totals(self, request, pk=None):
        """
        Manually recalculate daily totals for this entry.

        Useful if something seems off with the calculations.
        """
        daily_entry = self.get_object()
        totals = daily_entry.calculate_totals()

        serializer = self.get_serializer(daily_entry)
        return Response(
            {
                "message": "Daily totals recalculated successfully",
                "totals": totals,
                "data": serializer.data,
            }
        )


class MealViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing meals within daily entries.

    Provides CRUD operations for meals and handles automatic
    daily total recalculation when meals are modified.
    """

    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["meal_type", "daily_entry__date"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        """Return meals for the authenticated user's daily entries"""
        return Meal.objects.filter(
            daily_entry__nutrition_profile__account=self.request.user
        ).prefetch_related("food_entries__food")

    def get_serializer_class(self):
        """
        Return appropriate serializer based on the action.

        Use MealCreateSerializer for create actions to handle nested food entries.
        """
        if self.action == "create":
            return MealCreateSerializer
        return MealSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a new meal within a daily entry.

        Requires daily_entry_id in the request data.
        """
        daily_entry_id = request.data.get("daily_entry")

        if not daily_entry_id:
            return Response(
                {"error": "daily_entry is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the daily entry belongs to the authenticated user
        try:
            daily_entry = DailyEntry.objects.get(
                id=daily_entry_id, nutrition_profile__account=request.user
            )
        except DailyEntry.DoesNotExist:
            return Response(
                {"error": "Daily entry not found or access denied"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        meal = serializer.save(daily_entry=daily_entry)

        # Return the created meal with full details
        response_serializer = MealSerializer(meal)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def by_date(self, request):
        """
        Get all meals for a specific date.

        Query parameter: date (YYYY-MM-DD format)
        """
        date_param = request.query_params.get("date")

        if not date_param:
            return Response(
                {"error": "date parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        meals = self.get_queryset().filter(daily_entry__date=date_param)
        serializer = self.get_serializer(meals, many=True)

        # Group meals by type for better organization
        grouped_meals = {}
        for meal_data in serializer.data:
            meal_type = meal_data["meal_type"]
            if meal_type not in grouped_meals:
                grouped_meals[meal_type] = []
            grouped_meals[meal_type].append(meal_data)

        return Response(
            {
                "date": date_param,
                "meals_by_type": grouped_meals,
                "total_meals": len(serializer.data),
            }
        )

    @action(detail=True, methods=["post"])
    def quick_add_food(self, request, pk=None):
        """
        Quickly add a food item to this meal.

        Uses QuickAddFoodEntrySerializer for simplified food addition.
        """
        meal = self.get_object()

        serializer = QuickAddFoodEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the food
        try:
            food = Food.objects.get(id=serializer.validated_data["food_id"])
        except Food.DoesNotExist:
            return Response(
                {"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Create the meal food entry
        entry_data = {
            "meal": meal,
            "food": food,
            "serving_type": serializer.validated_data["serving_type"],
            "quantity": serializer.validated_data["quantity"],
        }

        if serializer.validated_data["serving_type"] == "fatsecret":
            entry_data["fatsecret_serving_id"] = serializer.validated_data[
                "fatsecret_serving_id"
            ]
        else:
            entry_data["custom_serving_unit"] = serializer.validated_data[
                "custom_serving_unit"
            ]
            entry_data["custom_serving_amount"] = serializer.validated_data[
                "custom_serving_amount"
            ]

        food_entry = MealFoodEntry.objects.create(**entry_data)

        # Return the created entry
        entry_serializer = MealFoodEntrySerializer(food_entry)
        return Response(
            {
                "message": "Food added to meal successfully",
                "food_entry": entry_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class MealFoodEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing individual food entries within meals.

    Handles adding, updating, and removing foods from meals
    with automatic meal and daily total recalculation.
    """

    serializer_class = MealFoodEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["meal", "food"]

    def get_queryset(self):
        """Return meal food entries for the authenticated user's meals"""
        return MealFoodEntry.objects.filter(
            meal__daily_entry__nutrition_profile__account=self.request.user
        ).select_related("food", "meal")

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "create":
            return MealFoodEntryCreateSerializer
        return MealFoodEntrySerializer

    def create(self, request, *args, **kwargs):
        """
        Add a food item to a meal.

        Automatically triggers meal and daily total recalculation.
        """
        meal_id = request.data.get("meal")

        # Verify the meal belongs to the authenticated user
        try:
            meal = Meal.objects.get(
                id=meal_id, daily_entry__nutrition_profile__account=request.user
            )
        except Meal.DoesNotExist:
            return Response(
                {"error": "Meal not found or access denied"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        food_entry = serializer.save(meal=meal)

        # Return full serialized data
        response_serializer = MealFoodEntrySerializer(food_entry)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        Update a food entry (usually quantity changes).

        Triggers automatic recalculation of meal and daily totals.
        """
        # Use create serializer for updates to allow serving type changes
        if self.action == "update":
            self.serializer_class = MealFoodEntryCreateSerializer
        elif self.action == "partial_update":
            self.serializer_class = MealFoodEntryCreateSerializer

        response = super().update(request, *args, **kwargs)

        # Return full serialized data
        if response.status_code == 200:
            instance = self.get_object()
            full_serializer = MealFoodEntrySerializer(instance)
            response.data = full_serializer.data

        return response

    def destroy(self, request, *args, **kwargs):
        """
        Remove a food entry from a meal.

        Triggers automatic recalculation of meal and daily totals.
        """
        response = super().destroy(request, *args, **kwargs)

        # The signal will automatically recalculate totals
        return response

    @action(detail=False, methods=["get"])
    def by_meal(self, request):
        """
        Get all food entries for a specific meal.

        Query parameter: meal_id
        """
        meal_id = request.query_params.get("meal_id")

        if not meal_id:
            return Response(
                {"error": "meal_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        food_entries = self.get_queryset().filter(meal_id=meal_id)
        serializer = self.get_serializer(food_entries, many=True)

        return Response(
            {
                "meal_id": meal_id,
                "food_entries": serializer.data,
                "total_entries": len(serializer.data),
            }
        )

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """
        Duplicate this food entry (useful for adding same food with different quantity).
        """
        original_entry = self.get_object()

        # Get new quantity from request, default to original quantity
        new_quantity = request.data.get("quantity", original_entry.quantity)

        # Create duplicate with new quantity
        duplicate_data = {
            "meal": original_entry.meal,
            "food": original_entry.food,
            "serving_type": original_entry.serving_type,
            "fatsecret_serving_id": original_entry.fatsecret_serving_id,
            "custom_serving_unit": original_entry.custom_serving_unit,
            "custom_serving_amount": original_entry.custom_serving_amount,
            "quantity": new_quantity,
        }

        duplicate_entry = MealFoodEntry.objects.create(**duplicate_data)

        serializer = self.get_serializer(duplicate_entry)
        return Response(
            {
                "message": "Food entry duplicated successfully",
                "original_entry_id": original_entry.id,
                "duplicate_entry": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )
