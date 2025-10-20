from ..models import Profile
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..serializers import (
    ProfileSerializer,
    ProfileCreateUpdateSerializer,
)


class ProfileViewSet(viewsets.ModelViewSet):
    """CRUD operations for user profiles."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(account=self.request.user)

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProfileCreateUpdateSerializer
        return ProfileSerializer

    def create(self, request):
        """Create profile for authenticated user - POST /accounts/profiles/"""
        # Check if profile already exists
        if hasattr(request.user, "profile"):
            return Response(
                {
                    "success": False,
                    "message": "Profile already exists. Use PUT/PATCH to update.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProfileCreateUpdateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            profile = serializer.save()
            response_serializer = ProfileSerializer(profile)
            return Response(
                {
                    "success": True,
                    "message": "Profile created successfully",
                    "data": response_serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, pk=None, partial=False):  # Add partial=False parameter
        """Update user's profile - PUT /accounts/profiles/{id}/"""
        try:
            profile = Profile.objects.get(account=request.user, pk=pk)
        except Profile.DoesNotExist:
            return Response(
                {"success": False, "error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProfileCreateUpdateSerializer(
            profile,
            data=request.data,
            partial=partial,
            context={"request": request},  # Pass partial to serializer
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"success": True, "data": serializer.data},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
