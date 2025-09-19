from django.urls import path
from . import views

urlpatterns = [
    path("test-token/", views.test_fatsecret_token, name="test_fatsecret_token"),
    path("foods/search/", views.search_foods, name="search_foods"),
    path("foods/<int:food_id>/", views.get_food_details, name="food_details"),
]
