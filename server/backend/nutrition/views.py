from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .fatsecret_service import FatSecretService
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
