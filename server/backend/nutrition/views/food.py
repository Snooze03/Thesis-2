from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from ..fatsecret_service import FatSecretService
from ..models import Food
from ..serializers import (
    FoodSerializer,
    FoodWithServingsSerializer,
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
                "token_preview": token[:10] + "..." if token else None,
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

            # Extract food info from the nested structure
            food_info = food_details.get("food", {})

            # Handle servings - ensure it's always a list with proper serving_id
            servings_data = food_info.get("servings", {})
            if isinstance(servings_data, dict):
                serving = servings_data.get("serving", [])
                if not isinstance(serving, list):
                    serving = [serving] if serving else []
            else:
                serving = servings_data if isinstance(servings_data, list) else []

            # Process servings and ensure each has a serving_id
            processed_servings = []
            for i, serv in enumerate(serving):
                if isinstance(serv, dict):
                    # Use the serving_id from FatSecret if available, otherwise use index
                    if "serving_id" not in serv:
                        serv["serving_id"] = str(i)
                    processed_servings.append(serv)

            # Create Food object from FatSecret data
            food_data = {
                "food_id": food_id,
                "food_name": food_info.get(
                    "food_name", request.data.get("food_name", "Unknown Food")
                ),
                "brand_name": food_info.get(
                    "brand_name", request.data.get("brand_name", "")
                ),
                "food_type": food_info.get(
                    "food_type", request.data.get("food_type", "Generic")
                ),
                "food_description": food_info.get(
                    "food_description", request.data.get("food_description", "")
                ),
                "fatsecret_servings": processed_servings,
            }

            # Debug logging
            logger.info(f"Processing food import for ID: {food_id}")
            logger.info(f"FatSecret response structure: {food_details}")
            logger.info(f"Extracted food data: {food_data}")
            logger.info(f"Processed servings count: {len(processed_servings)}")

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
            # Log the full response for debugging
            logger.error(
                f"FatSecret response: {food_details if 'food_details' in locals() else 'Not available'}"
            )
            return Response(
                {"error": f"Failed to import food: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
