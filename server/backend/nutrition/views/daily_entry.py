from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from datetime import date
from ..models import DailyEntry, FoodEntry, Food
from ..serializers import (
    DailyEntrySerializer,
    DailyEntryDetailSerializer,
    FoodEntrySerializer,
    FoodEntryCreateSerializer,
    QuickAddFoodEntrySerializer,
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
        ).prefetch_related("food_entries__food")

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ["retrieve", "with_meals_detail"]:
            return DailyEntryDetailSerializer
        return DailyEntrySerializer

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

    @action(detail=True, methods=["get"])
    def with_meals_detail(self, request, pk=None):
        """
        Get daily entry with detailed meal breakdown.

        Returns expanded meal information with individual entries.
        """
        daily_entry = self.get_object()
        serializer = DailyEntryDetailSerializer(daily_entry)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_food_entry(self, request, pk=None):
        """
        Add a food entry directly to this daily entry.

        Requires: food_id, meal_type, serving info, quantity
        """
        daily_entry = self.get_object()

        # Add daily_entry to request data
        data = request.data.copy()
        data["daily_entry"] = daily_entry.id

        serializer = FoodEntryCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        food_entry = serializer.save()

        # Return the created entry with full details
        response_serializer = FoodEntrySerializer(food_entry)
        return Response(
            {
                "message": "Food entry added successfully",
                "food_entry": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class FoodEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing individual food entries.

    Handles adding, updating, and removing foods from daily entries
    with automatic daily total recalculation.
    """

    serializer_class = FoodEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["daily_entry", "food", "meal_type", "serving_type"]
    ordering_fields = ["created_at", "meal_type"]
    ordering = ["meal_type", "created_at"]

    def get_queryset(self):
        """Return food entries for the authenticated user's daily entries"""
        return FoodEntry.objects.filter(
            daily_entry__nutrition_profile__account=self.request.user
        ).select_related("food", "daily_entry")

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ["create", "update", "partial_update"]:
            return FoodEntryCreateSerializer
        return FoodEntrySerializer

    def create(self, request, *args, **kwargs):
        """
        Add a food item to a daily entry.

        Automatically triggers daily total recalculation.
        """
        daily_entry_id = request.data.get("daily_entry")

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
        food_entry = serializer.save()

        # Return full serialized data
        response_serializer = FoodEntrySerializer(food_entry)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        Update a food entry (usually quantity or serving changes).

        Triggers automatic recalculation of daily totals.
        """
        response = super().update(request, *args, **kwargs)

        # Return full serialized data
        if response.status_code == 200:
            instance = self.get_object()
            full_serializer = FoodEntrySerializer(instance)
            response.data = full_serializer.data

        return response

    def destroy(self, request, *args, **kwargs):
        """
        Remove a food entry from a daily entry.

        Triggers automatic recalculation of daily totals.
        """
        response = super().destroy(request, *args, **kwargs)

        # The signal will automatically recalculate totals
        return response

    @action(detail=False, methods=["get"])
    def by_meal_type(self, request):
        """
        Get all food entries for a specific meal type and date.

        Query parameters: meal_type, date (optional)
        """
        meal_type = request.query_params.get("meal_type")
        date_param = request.query_params.get("date")

        if not meal_type:
            return Response(
                {"error": "meal_type parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        food_entries = self.get_queryset().filter(meal_type=meal_type)

        if date_param:
            food_entries = food_entries.filter(daily_entry__date=date_param)

        serializer = self.get_serializer(food_entries, many=True)

        return Response(
            {
                "meal_type": meal_type,
                "date": date_param,
                "food_entries": serializer.data,
                "total_entries": len(serializer.data),
            }
        )

    @action(detail=False, methods=["get"])
    def by_daily_entry(self, request):
        """
        Get all food entries for a specific daily entry, grouped by meal type.

        Query parameter: daily_entry_id
        """
        daily_entry_id = request.query_params.get("daily_entry_id")

        if not daily_entry_id:
            return Response(
                {"error": "daily_entry_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        food_entries = self.get_queryset().filter(daily_entry_id=daily_entry_id)
        serializer = self.get_serializer(food_entries, many=True)

        # Group by meal type
        grouped_entries = {}
        for entry_data in serializer.data:
            meal_type = entry_data["meal_type"]
            if meal_type not in grouped_entries:
                grouped_entries[meal_type] = []
            grouped_entries[meal_type].append(entry_data)

        return Response(
            {
                "daily_entry_id": daily_entry_id,
                "entries_by_meal": grouped_entries,
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
        new_meal_type = request.data.get("meal_type", original_entry.meal_type)

        # Create duplicate with new parameters
        duplicate_data = {
            "daily_entry": original_entry.daily_entry,
            "food": original_entry.food,
            "meal_type": new_meal_type,
            "serving_type": original_entry.serving_type,
            "fatsecret_serving_id": original_entry.fatsecret_serving_id,
            "custom_serving_unit": original_entry.custom_serving_unit,
            "custom_serving_amount": original_entry.custom_serving_amount,
            "quantity": new_quantity,
        }

        duplicate_entry = FoodEntry.objects.create(**duplicate_data)

        serializer = self.get_serializer(duplicate_entry)
        return Response(
            {
                "message": "Food entry duplicated successfully",
                "original_entry_id": original_entry.id,
                "duplicate_entry": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"])
    def quick_add(self, request):
        """
        Quickly add a food entry using simplified data.

        Uses QuickAddFoodEntrySerializer for streamlined food addition.
        """
        serializer = QuickAddFoodEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the daily entry and food
        try:
            daily_entry = DailyEntry.objects.get(
                id=serializer.validated_data["daily_entry_id"],
                nutrition_profile__account=request.user,
            )
        except DailyEntry.DoesNotExist:
            return Response(
                {"error": "Daily entry not found or access denied"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            food = Food.objects.get(id=serializer.validated_data["food_id"])
        except Food.DoesNotExist:
            return Response(
                {"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Create the food entry
        entry_data = {
            "daily_entry": daily_entry,
            "food": food,
            "meal_type": serializer.validated_data["meal_type"],
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

        food_entry = FoodEntry.objects.create(**entry_data)

        # Return the created entry
        entry_serializer = FoodEntrySerializer(food_entry)
        return Response(
            {
                "message": "Food entry added successfully",
                "food_entry": entry_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )
