from ..models import Account
from rest_framework import generics, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..serializers import (
    AccountSerializer,
    AccountDetailSerializer,
)


class AccountProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for user account and profile."""

    permission_classes = [IsAuthenticated]
    serializer_class = AccountDetailSerializer

    def get_queryset(self):
        return Account.objects.filter(id=self.request.user.id).select_related("profile")

    def list(self, request):
        """Return current user's complete profile - GET /accounts/profile/"""
        serializer = AccountDetailSerializer(request.user)
        return Response({"success": True, "data": serializer.data})

    def retrieve(self, request, pk=None):
        """Return current user's profile by ID - GET /accounts/profile/{id}/"""
        if int(pk) != request.user.id:
            return Response(
                {"success": False, "message": "You can only access your own profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AccountDetailSerializer(request.user)
        return Response({"success": True, "data": serializer.data})


class AccountUpdateView(generics.UpdateAPIView):
    """Update account information (not profile)."""

    permission_classes = [IsAuthenticated]
    serializer_class = AccountSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            account = serializer.save()
            response_serializer = AccountDetailSerializer(account)
            return Response(
                {
                    "success": True,
                    "message": "Account updated successfully",
                    "data": response_serializer.data,
                }
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
