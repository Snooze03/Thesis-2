from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Register ViewSets with the router
router.register(
    r"profiles", views.NutritionProfileViewSet, basename="nutrition-profile"
)
router.register(r"foods-db", views.FoodViewSet, basename="food")
router.register(r"daily-entries", views.DailyEntryViewSet, basename="daily-entry")
router.register(r"food-entries", views.FoodEntryViewSet, basename="food-entry")

urlpatterns = [
    # FatSecret API endpoints
    path("test-token/", views.test_fatsecret_token, name="test_fatsecret_token"),
    path("foods/search/", views.search_foods, name="search_foods"),
    path("foods/<int:food_id>/", views.get_food_details, name="food_details"),
    # Include router URLs
    path("", include(router.urls)),
]
