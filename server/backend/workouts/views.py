from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Template, Exercise, TemplateExercise
from .serializers import (
    TemplateSerializer,
    ExerciseSerializer,
    TemplateExerciseSerializer,
    AddExercisesToTemplateSerializer,
)


class TemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]

    # Get templates belonging to the authenticated user
    def get_queryset(self):
        return Template.objects.filter(user_id=self.request.user)

    # Create template and assign user id as foreign key
    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user)

    @action(detail=True, methods=["get"])
    def exercises(self, request, pk=None):
        """
        Get all exercises for a specific template
        URL: /workouts/templates/{id}/exercises/
        """
        template = self.get_object()
        template_exercises = TemplateExercise.objects.filter(
            template=template
        ).select_related("exercise")
        serializer = TemplateExerciseSerializer(template_exercises, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_exercises(self, request, pk=None):
        """
        Add multiple exercises from external API to a template
        This will:
        1. Create Exercise records if they don't exist
        2. Create TemplateExercise records to link them to the template
        URL: /workouts/templates/{id}/add_exercises/
        """
        template = self.get_object()
        serializer = AddExercisesToTemplateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        exercises_data = serializer.validated_data["exercises"]
        created_exercises = []
        errors = []

        try:
            with transaction.atomic():
                for exercise_data in exercises_data:
                    try:
                        # Get or create the exercise in our database
                        exercise, created = Exercise.objects.get_or_create(
                            name=exercise_data.get("name", "").strip(),
                            defaults={
                                "type": exercise_data.get("type", ""),
                                "muscle": exercise_data.get("muscle", ""),
                                "equipment": exercise_data.get("equipment", ""),
                                "difficulty": exercise_data.get("difficulty", ""),
                                "instructions": exercise_data.get("instructions", ""),
                            },
                        )

                        # Create the template-exercise relationship (avoid duplicates)
                        template_exercise, te_created = (
                            TemplateExercise.objects.get_or_create(
                                template=template,
                                exercise=exercise,
                                defaults={
                                    "order": TemplateExercise.objects.filter(
                                        template=template
                                    ).count()
                                },
                            )
                        )

                        if te_created:
                            created_exercises.append(
                                {
                                    "exercise_id": exercise.id,
                                    "exercise_name": exercise.name,
                                    "already_existed": not created,
                                }
                            )
                        else:
                            errors.append(
                                {
                                    "exercise": exercise.name,
                                    "error": "Exercise already exists in this template",
                                }
                            )

                    except Exception as e:
                        errors.append(
                            {
                                "exercise": exercise_data.get("name", "Unknown"),
                                "error": str(e),
                            }
                        )

        except Exception as e:
            return Response(
                {"error": f"Transaction failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_data = {
            "created": created_exercises,
            "message": f"Successfully added {len(created_exercises)} exercises to template",
        }

        if errors:
            response_data["errors"] = errors
            response_data["message"] += f" with {len(errors)} errors"
            return Response(response_data, status=status.HTTP_207_MULTI_STATUS)

        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"])
    def remove_exercise(self, request, pk=None):
        """
        Remove an exercise from a template
        URL: /workouts/templates/{id}/remove_exercise/
        Body: {"exercise_id": 123}
        """
        template = self.get_object()
        exercise_id = request.data.get("exercise_id")

        if not exercise_id:
            return Response(
                {"error": "exercise_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            template_exercise = TemplateExercise.objects.get(
                template=template, exercise_id=exercise_id
            )
            exercise_name = template_exercise.exercise.name
            template_exercise.delete()

            return Response({"message": f"Removed {exercise_name} from template"})

        except TemplateExercise.DoesNotExist:
            return Response(
                {"error": "Exercise not found in this template"},
                status=status.HTTP_404_NOT_FOUND,
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


class TemplateExerciseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing template-exercise relationships
    (for updating sets, reps, etc.)
    """

    serializer_class = TemplateExerciseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TemplateExercise.objects.filter(
            template__user_id=self.request.user
        ).select_related("exercise", "template")
