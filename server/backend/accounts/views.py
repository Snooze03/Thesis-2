from .models import Account
from rest_framework import generics
from .serializers import AccountSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny


# Create your views here.
class CreateAccountView(generics.CreateAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [AllowAny]
