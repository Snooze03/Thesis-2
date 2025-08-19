from .models import Account
from rest_framework import generics, viewsets
from .serializers import AccountSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response


# Create your views here.
class CreateAccountView(generics.CreateAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [AllowAny]


class AccountProfileViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(id=self.request.user.id)

    def list(self, request):
        """Return current user's profile - GET /api/profile/"""
        serializer = AccountSerializer(request.user)
        return Response(serializer.data)
