from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from ..models import Exercise
from ..serializers import (
    ExerciseSerializer,
)


class ExerciseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing the master exercise database
    """

    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Exercise.objects.all()

    @action(detail=False, methods=["get"])
    def search(self, request):
        """
        Search exercises by name or muscle
        URL: /workouts/exercises/search/?q=push&muscle=chest
        if ninja api is down use this as the fall back
        """
        query = request.query_params.get("q", "")
        muscle = request.query_params.get("muscle", "")
        difficulty = request.query_params.get("difficulty", "")

        exercises = self.get_queryset()

        if query:
            exercises = exercises.filter(name__icontains=query)
        if muscle:
            exercises = exercises.filter(muscle__icontains=muscle)
        if difficulty:
            exercises = exercises.filter(difficulty=difficulty)

        exercises = exercises[:50]  # Limit results
        serializer = self.get_serializer(exercises, many=True)
        return Response(serializer.data)
