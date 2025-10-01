from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    NutritionProfileViewSet,
    FoodViewSet,
    DailyEntryViewSet,
    FoodEntryViewSet,
    # Fatsecret
    test_fatsecret_token,
    search_foods,
    get_food_details,
)

router = DefaultRouter()

# Register ViewSets with the router
router.register(r"profiles", NutritionProfileViewSet, basename="nutrition-profile")
router.register(r"foods-db", FoodViewSet, basename="food")
router.register(r"daily-entries", DailyEntryViewSet, basename="daily-entry")
router.register(r"food-entries", FoodEntryViewSet, basename="food-entry")

urlpatterns = [
    # Fatsecret search and token test endpoints
    path("test-token/", test_fatsecret_token, name="test-fatsecret"),
    path("foods/search/", search_foods, name="search-foods"),
    path("foods/<str:food_id>/", get_food_details, name="food-details"),
    # Include the router URLs
    path("", include(router.urls)),
]
