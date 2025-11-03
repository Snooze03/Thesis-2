from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction
from ..models import (
    Template,
    TemplateExercise,
    Exercise,
    TemplateHistory,
    TemplateHistoryExercise,
)
from ..serializers import (
    TemplateSerializer,
    TemplateExerciseSerializer,
    AddExercisesToTemplateSerializer,
    CreateTemplateWithExercisesSerializer,
    UpdateTemplateWithExercisesSerializer,
    SetManagementSerializer,
    TemplateHistorySerializer,
    TemplateHistoryExerciseSerializer,
    SaveCompletedWorkoutSerializer,
)


class TemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        gets alternative/main workouts with optimized queries
        URL: /workouts/templates/?is_alternative=false || true
        """
        # Get templates belonging to the authenticated user with prefetch
        queryset = (
            Template.objects.filter(user_id=self.request.user)
            .prefetch_related("template_exercises__exercise")
            .order_by("-id")
        )  # Most recent first

        is_alternative = self.request.query_params.get("is_alternative")

        # Check if the request is asking for alternative templates
        if is_alternative is not None:
            url_param = is_alternative.lower()

            if url_param == "true":
                queryset = queryset.filter(isAlternative=True)
            elif url_param == "false":
                queryset = queryset.filter(isAlternative=False)
            else:
                raise ValidationError({"is_alternative": "Must be 'true' or 'false'"})

        return queryset

    def get_serializer_class(self):
        """
        Return the serializer class based on the action
        """
        if self.action in ["update", "partial_update"]:
            return UpdateTemplateWithExercisesSerializer
        return self.serializer_class

    # Create template and assign user id as foreign key
    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Update a template with exercises (replacement logic)
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            try:
                updated_template = serializer.save()

                # Get update info from the serializer
                update_info = getattr(
                    updated_template,
                    "_update_info",
                    {
                        "updated_count": 0,
                        "added_count": 0,
                        "removed_count": 0,
                        "updated_exercises": [],
                        "added_exercises": [],
                        "removed_exercises": [],
                    },
                )

                # Reload the template with prefetched exercises for the response
                template_with_exercises = Template.objects.prefetch_related(
                    "template_exercises__exercise"
                ).get(id=updated_template.id)

                # Return the updated template with exercise data
                response_serializer = TemplateSerializer(template_with_exercises)

                message = f"Template '{updated_template.title}' updated successfully"
                if update_info["updated_count"] > 0:
                    message += f" - Updated {update_info['updated_count']} exercise(s)"
                if update_info["added_count"] > 0:
                    message += f" - Added {update_info['added_count']} exercise(s)"
                if update_info["removed_count"] > 0:
                    message += f" - Removed {update_info['removed_count']} exercise(s)"

                return Response(
                    {
                        "template": response_serializer.data,
                        "message": message,
                        "update_summary": {
                            "updated_exercises": update_info["updated_exercises"],
                            "added_exercises": update_info["added_exercises"],
                            "removed_exercises": update_info["removed_exercises"],
                            "total_exercises": updated_template.template_exercises.count(),
                        },
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                return Response(
                    {"error": f"Failed to update template: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        """
        Partial update (PATCH) for template
        """
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    @action(detail=False, methods=["post"])
    def create_with_exercises(self, request):
        """
        Create a template and add exercises to it in one operation
        URL: /workouts/templates/create_with_exercises/
        """
        serializer = CreateTemplateWithExercisesSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            try:
                template = serializer.save()

                # Reload the template with prefetched exercises for the response
                template_with_exercises = Template.objects.prefetch_related(
                    "template_exercises__exercise"
                ).get(id=template.id)

                # Return the created template with exercise data
                response_serializer = TemplateSerializer(template_with_exercises)
                return Response(
                    {
                        "template": response_serializer.data,
                        "message": f"Template '{template.title}' created successfully with {template.template_exercises.count()} exercises",
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                return Response(
                    {"error": f"Failed to create template: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def exercises(self, request, pk=None):
        """
        Get all exercises for a specific template
        URL: /workouts/templates/{id}/exercises/
        """
        template = self.get_object()
        template_exercises = (
            TemplateExercise.objects.filter(template=template)
            .select_related("exercise")
            .order_by("order", "created_at")
        )
        serializer = TemplateExerciseSerializer(template_exercises, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_exercises(self, request, pk=None):
        """
        Add multiple exercises from external API to a template
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
                                    "sets_data": exercise_data.get("sets_data", []),
                                    "rest_time": exercise_data.get("rest_time"),
                                    "notes": exercise_data.get("notes", ""),
                                    "order": TemplateExercise.objects.filter(
                                        template=template
                                    ).count(),
                                },
                            )
                        )

                        if te_created:
                            created_exercises.append(
                                {
                                    "exercise_id": exercise.id,
                                    "exercise_name": exercise.name,
                                    "already_existed": not created,
                                    "total_sets": template_exercise.total_sets,
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

    @action(detail=False, methods=["post"])
    def save_completed_workout(self, request):
        """
        Save a completed workout to history
        URL: /workouts/templates/save_completed_workout/

        Body: {
            "template_id": 123,  // optional, can be null if template was deleted
            "template_title": "Push Day Workout",
            "started_at": "2024-11-01T10:00:00Z",
            "completed_at": "2024-11-01T11:30:00Z",
            "workout_notes": "Great workout today!",
            "completed_exercises": [
                {
                    "exercise_name": "Push Up",
                    "performed_sets_data": [
                        {"reps": 12, "weight": null},
                        {"reps": 10, "weight": null},
                        {"reps": 8, "weight": null}
                    ],
                    "exercise_notes": "Felt strong today",
                    "order": 0
                },
                {
                    "exercise_name": "Bench Press",
                    "performed_sets_data": [
                        {"reps": 8, "weight": 135},
                        {"reps": 6, "weight": 145},
                        {"reps": 4, "weight": 155}
                    ],
                    "exercise_notes": "New PR!",
                    "order": 1
                }
            ]
        }
        """
        serializer = SaveCompletedWorkoutSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            try:
                workout_history = serializer.save()

                # Return the created workout history with all related data
                response_serializer = TemplateHistorySerializer(workout_history)

                return Response(
                    {
                        "workout_history": response_serializer.data,
                        "message": f"Workout '{workout_history.template_title}' saved to history successfully",
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                return Response(
                    {"error": f"Failed to save workout: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def workout_history(self, request):
        """
        Get user's workout history
        URL: /workouts/templates/workout_history/

        Query params:
        - limit: Number of workouts to return (default: 20)
        - offset: Pagination offset (default: 0)
        - template_id: Filter by specific template (optional)
        """
        # Get query parameters
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        template_id = request.query_params.get("template_id")

        # Build queryset
        queryset = (
            TemplateHistory.objects.filter(user_id=request.user)
            .prefetch_related("performed_exercises__exercise", "original_template")
            .order_by("-completed_at")
        )

        # Filter by template if specified
        if template_id:
            queryset = queryset.filter(original_template_id=template_id)

        # Apply pagination
        total_count = queryset.count()
        workouts = queryset[offset : offset + limit]

        # Serialize the data
        serializer = TemplateHistorySerializer(workouts, many=True)

        return Response(
            {
                "workouts": serializer.data,
                "pagination": {
                    "total_count": total_count,
                    "limit": limit,
                    "offset": offset,
                    "has_next": offset + limit < total_count,
                    "has_previous": offset > 0,
                },
            }
        )

    @action(detail=False, methods=["get"])
    def workout_stats(self, request):
        """
        Get user's workout statistics
        URL: /workouts/templates/workout_stats/

        Returns overall workout statistics like total workouts,
        total time worked out, etc.
        """
        from django.db.models import Sum, Count, Avg
        from django.utils import timezone
        from datetime import timedelta

        user_workouts = TemplateHistory.objects.filter(user_id=request.user)

        # Basic stats
        total_workouts = user_workouts.count()

        if total_workouts == 0:
            return Response(
                {
                    "total_workouts": 0,
                    "total_exercises_performed": 0,
                    "total_sets_performed": 0,
                    "total_time_minutes": 0,
                    "average_workout_duration": 0,
                    "workouts_this_week": 0,
                    "workouts_this_month": 0,
                }
            )

        # Aggregate stats
        stats = user_workouts.aggregate(
            total_exercises=Sum("total_exercises"),
            total_sets=Sum("total_sets"),
            avg_duration=Avg("total_duration"),
        )

        # Calculate total workout time in minutes
        total_duration = user_workouts.aggregate(total=Sum("total_duration"))["total"]
        total_minutes = (
            int(total_duration.total_seconds() / 60) if total_duration else 0
        )

        # Time-based filters
        now = timezone.now()
        week_start = now - timedelta(days=7)
        month_start = now - timedelta(days=30)

        workouts_this_week = user_workouts.filter(completed_at__gte=week_start).count()
        workouts_this_month = user_workouts.filter(
            completed_at__gte=month_start
        ).count()

        # Average workout duration in minutes
        avg_duration_minutes = 0
        if stats["avg_duration"]:
            avg_duration_minutes = int(stats["avg_duration"].total_seconds() / 60)

        return Response(
            {
                "total_workouts": total_workouts,
                "total_exercises_performed": stats["total_exercises"] or 0,
                "total_sets_performed": stats["total_sets"] or 0,
                "total_time_minutes": total_minutes,
                "average_workout_duration": avg_duration_minutes,
                "workouts_this_week": workouts_this_week,
                "workouts_this_month": workouts_this_month,
            }
        )


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

    @action(detail=True, methods=["post"])
    def manage_sets(self, request, pk=None):
        """
        Manage sets for a TemplateExercise instance (add, update, remove)
        URL: /workouts/template-exercises/{id}/manage_sets/

        Add set: {"action": "add", "reps": 12, "weight": 50.0}
        Update set: {"action": "update", "set_index": 0, "reps": 15, "weight": 55.0}
        Remove set: {"action": "remove", "set_index": 1}
        """
        template_exercise = self.get_object()
        serializer = SetManagementSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        action = data["action"]

        try:
            if action == "add":
                template_exercise.add_set(
                    reps=data.get("reps"), weight=data.get("weight")
                )
                message = "Set added successfully"

            elif action == "update":
                set_index = data["set_index"]
                if set_index >= len(template_exercise.sets_data):
                    return Response(
                        {"error": f"Set index {set_index} does not exist"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                template_exercise.update_set(
                    set_index=set_index,
                    reps=data.get("reps"),
                    weight=data.get("weight"),
                )
                message = f"Set {set_index + 1} updated successfully"

            elif action == "remove":
                set_index = data["set_index"]
                if set_index >= len(template_exercise.sets_data):
                    return Response(
                        {"error": f"Set index {set_index} does not exist"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                template_exercise.remove_set(set_index)
                message = f"Set {set_index + 1} removed successfully"

            template_exercise.save()

            # Return updated template exercise data
            response_serializer = TemplateExerciseSerializer(template_exercise)
            return Response(
                {"message": message, "template_exercise": response_serializer.data},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to {action} set: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["patch"])
    def update_exercise_params(self, request, pk=None):
        """
        Update exercise parameters (rest_time, notes, order) for a TemplateExercise
        URL: /workouts/template-exercises/{id}/update_exercise_params/
        """
        template_exercise = self.get_object()

        # Only allow updating specific fields
        allowed_fields = ["rest_time", "notes", "order"]
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = self.get_serializer(
            template_exercise, data=update_data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Exercise parameters updated successfully",
                    "template_exercise": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TemplateHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing workout history
    Read-only because workout history should not be modified after creation
    """

    serializer_class = TemplateHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            TemplateHistory.objects.filter(user_id=self.request.user)
            .prefetch_related("performed_exercises__exercise", "original_template")
            .order_by("-completed_at")
        )

    @action(detail=True, methods=["get"])
    def exercises(self, request, pk=None):
        """
        Get all exercises for a specific workout history
        URL: /workouts/history/{id}/exercises/
        """
        workout_history = self.get_object()
        performed_exercises = workout_history.performed_exercises.all().order_by(
            "order"
        )
        serializer = TemplateHistoryExerciseSerializer(performed_exercises, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """
        Get recent workout history (last 10 workouts)
        URL: /workouts/history/recent/
        """
        recent_workouts = self.get_queryset()[:10]
        serializer = self.get_serializer(recent_workouts, many=True)
        return Response(serializer.data)
