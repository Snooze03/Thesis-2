from ..models import WeightHistory
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..serializers import (
    WeightHistorySerializer,
    WeightHistoryCreateSerializer,
)


class WeightHistoryViewSet(viewsets.ModelViewSet):
    """CRUD operations for weight history."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WeightHistory.objects.filter(account=self.request.user).order_by(
            "-recorded_date"
        )

    def get_serializer_class(self):
        if self.action == "create":
            return WeightHistoryCreateSerializer
        return WeightHistorySerializer

    def create(self, request):
        """Add new weight entry - POST /accounts/weight-history/"""
        serializer = WeightHistoryCreateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            weight_entry = serializer.save()
            response_serializer = WeightHistorySerializer(weight_entry)
            return Response(
                {
                    "success": True,
                    "message": "Weight entry added successfully",
                    "data": response_serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def list(self, request):
        """Get all weight history for user - GET /accounts/weight-history/"""
        queryset = self.get_queryset()
        serializer = WeightHistorySerializer(queryset, many=True)
        return Response(
            {"success": True, "count": len(serializer.data), "data": serializer.data}
        )

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Get recent weight entries - GET /accounts/weight-history/recent/"""
        recent_entries = self.get_queryset()[:10]  # Last 10 entries
        serializer = WeightHistorySerializer(recent_entries, many=True)
        return Response(
            {"success": True, "count": len(serializer.data), "data": serializer.data}
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get weight statistics - GET /accounts/weight-history/stats/"""
        queryset = self.get_queryset()

        if not queryset.exists():
            return Response(
                {"success": True, "message": "No weight history found", "data": None}
            )

        latest = queryset.first()
        oldest = queryset.last()

        total_change = (
            float(latest.weight - oldest.weight) if queryset.count() > 1 else 0
        )

        # Get profile for goal comparison
        profile = getattr(request.user, "profile", None)

        stats = {
            "total_entries": queryset.count(),
            "current_weight": float(latest.weight),
            "starting_weight": float(oldest.weight),
            "total_weight_change": total_change,
            "goal_weight": float(profile.goal_weight) if profile else None,
            "weight_to_goal": float(profile.weight_to_goal) if profile else None,
            "latest_entry_date": latest.recorded_date,
            "first_entry_date": oldest.recorded_date,
        }

        return Response({"success": True, "data": stats})
