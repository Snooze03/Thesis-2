from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .models import Template, Exercise
from .serializers import TemplateSerializer, ExerciseSerializer


class TemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return templates belonging to the authenticated user
        return Template.objects.filter(user_id=self.request.user)

    def perform_create(self, serializer):
        # Automatically set the user_id to the authenticated user
        serializer.save(user_id=self.request.user)

    @action(detail=True, methods=["get"])
    def exercises(self, request, pk=None):
        """
        Get all exercises for a specific template
        URL: /workouts/templates/{id}/exercises/
        """
        template = self.get_object()
        exercises = Exercise.objects.filter(template_id=template)
        serializer = ExerciseSerializer(exercises, many=True)
        return Response(serializer.data)


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return exercises from templates belonging to the authenticated user
        return Exercise.objects.filter(template_id__user_id=self.request.user)

    def perform_create(self, serializer):
        # Get template_id from request data
        template_id = self.request.data.get("template_id")

        if template_id:
            try:
                # Verify that the template exists and belongs to the authenticated user
                template = Template.objects.get(
                    id=template_id, user_id=self.request.user
                )
                serializer.save(template_id=template)
            except Template.DoesNotExist:
                raise ValidationError(
                    "Template not found or you don't have permission to access it"
                )
        else:
            raise ValidationError("template_id is required")

    def create(self, request, *args, **kwargs):
        # Override create method to handle validation errors properly
        template_id = request.data.get("template_id")

        if not template_id:
            return Response(
                {"error": "template_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verify that the template exists and belongs to the authenticated user
            template = Template.objects.get(id=template_id, user_id=request.user)
        except Template.DoesNotExist:
            return Response(
                {
                    "error": "Template not found or you don't have permission to access it"
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Call the parent create method
        return super().create(request, *args, **kwargs)
