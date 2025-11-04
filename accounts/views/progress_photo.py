from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from ..models import ProgressPhoto
from ..serializers import (
    ProgressPhotoSerializer,
    ProgressPhotoUpdateSerializer,
)


class ProgressPhotoViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user's single progress photo entry"""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ["update", "partial_update"]:
            return ProgressPhotoUpdateSerializer
        return ProgressPhotoSerializer

    def get_queryset(self):
        """Filter queryset to show only current user's progress photo"""
        return ProgressPhoto.objects.filter(account=self.request.user)

    def get_object(self):
        """Get or create the user's progress photo entry"""
        try:
            return ProgressPhoto.objects.get(account=self.request.user)
        except ProgressPhoto.DoesNotExist:
            return ProgressPhoto.objects.create(account=self.request.user)

    def list(self, request, *args, **kwargs):
        """Return the user's progress photo (single object as list)"""
        instance = self.get_object()
        if instance:
            serializer = self.get_serializer(instance)
            return Response([serializer.data])
        return Response([])

    def retrieve(self, request, *args, **kwargs):
        """Retrieve the user's progress photo"""
        instance = self.get_object()
        if instance:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return Response(
            {"detail": "Progress photo not found"}, status=status.HTTP_404_NOT_FOUND
        )

    def create(self, request, *args, **kwargs):
        """Create or update the user's progress photo"""
        instance = self.get_object()

        # If already exists, update it
        serializer = ProgressPhotoUpdateSerializer(
            instance, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return full serialized data
        response_serializer = ProgressPhotoSerializer(
            instance, context={"request": request}
        )
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        """Update progress photo (full update)"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return full serialized data
        response_serializer = ProgressPhotoSerializer(
            instance, context={"request": request}
        )
        return Response(response_serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Partial update for progress photos"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Clear all photos but keep the record"""
        instance = self.get_object()

        # Delete files but keep the record
        if instance.before_photo:
            instance.before_photo.delete(save=False)
        if instance.after_photo:
            instance.after_photo.delete(save=False)

        instance.before_photo = None
        instance.after_photo = None
        instance.date_before = None
        instance.date_after = None
        instance.save()

        serializer = ProgressPhotoSerializer(instance, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def upload_before_photo(self, request):
        """Upload or update the before photo"""
        # Get existing instance or create new one
        try:
            instance = ProgressPhoto.objects.get(account=self.request.user)
        except ProgressPhoto.DoesNotExist:
            instance = ProgressPhoto.objects.create(account=self.request.user)

        if "before_photo" not in request.FILES:
            return Response(
                {"error": "No before photo file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete old before photo if exists
        if instance.before_photo:
            instance.before_photo.delete(save=False)

        instance.before_photo = request.FILES["before_photo"]

        # Update date_before if provided
        if "date_before" in request.data:
            instance.date_before = request.data["date_before"]

        instance.save()

        serializer = ProgressPhotoSerializer(instance, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def upload_after_photo(self, request):
        """Upload or update the after photo"""
        # Get existing instance or create new one
        try:
            instance = ProgressPhoto.objects.get(account=self.request.user)
        except ProgressPhoto.DoesNotExist:
            instance = ProgressPhoto.objects.create(account=self.request.user)

        if "after_photo" not in request.FILES:
            return Response(
                {"error": "No after photo file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete old after photo if exists
        if instance.after_photo:
            instance.after_photo.delete(save=False)

        instance.after_photo = request.FILES["after_photo"]

        # Update date_after if provided
        if "date_after" in request.data:
            instance.date_after = request.data["date_after"]

        instance.save()

        serializer = ProgressPhotoSerializer(instance, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["delete"])
    def remove_before_photo(self, request):
        """Remove the before photo"""
        instance = self.get_object()

        if instance.before_photo:
            # Delete the file from storage
            instance.before_photo.delete(save=False)
            instance.before_photo = None
            instance.date_before = None
            instance.save()

        serializer = ProgressPhotoSerializer(instance, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["delete"])
    def remove_after_photo(self, request):
        """Remove the after photo"""
        instance = self.get_object()

        if instance.after_photo:
            # Delete the file from storage
            instance.after_photo.delete(save=False)
            instance.after_photo = None
            instance.date_after = None
            instance.save()

        serializer = ProgressPhotoSerializer(instance, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def has_complete_comparison(self, request):
        """Check if user has both before and after photos"""
        instance = self.get_object()
        has_complete = instance.has_complete_comparison if instance else False

        return Response(
            {
                "has_complete_comparison": has_complete,
                "progress_duration_days": (
                    instance.progress_duration_days if instance else None
                ),
            }
        )
