from rest_framework import serializers
from django.db import models
from ..models import (
    Template,
    TemplateExercise,
    Exercise,
    TemplateHistory,
    TemplateHistoryExercise,
    SetTypeChoices,
)
from .exercise import ExerciseSerializer
from ..utils.validators import validate_sets_data, validate_set_type


class TemplateSerializer(serializers.ModelSerializer):
    exercise_count = serializers.SerializerMethodField()
    template_exercises = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = [
            "id",
            "user_id",
            "title",
            "isAlternative",
            "exercise_count",
            "template_exercises",
        ]
        extra_kwargs = {
            "user_id": {"read_only": True},
        }

    def get_exercise_count(self, obj):
        return obj.template_exercises.count()

    def get_template_exercises(self, obj):
        """
        Return all template exercises for this template
        """
        template_exercises = obj.template_exercises.all().order_by(
            "order", "created_at"
        )
        return TemplateExerciseSerializer(
            template_exercises, many=True, read_only=True
        ).data


class TemplateExerciseSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    exercise_name = serializers.CharField(source="exercise.name", read_only=True)
    formatted_sets_display = serializers.CharField(read_only=True)

    class Meta:
        model = TemplateExercise
        fields = [
            "id",
            "template",
            "exercise",
            "exercise_name",
            "set_type",  # Added
            "sets_data",
            "weight_unit",
            "total_sets",
            "rest_time",
            "notes",
            "order",
            "formatted_sets_display",
        ]

    def validate_set_type(self, value):
        """Validate set_type using centralized validator"""
        validate_set_type(value)
        return value

    def validate(self, data):
        """Cross-field validation for sets_data and set_type"""
        sets_data = (
            data.get("sets_data") or self.instance.sets_data if self.instance else None
        )
        set_type = (
            data.get("set_type") or self.instance.set_type
            if self.instance
            else SetTypeChoices.WEIGHT_REPS
        )

        # Only validate if sets_data is provided
        if sets_data:
            validate_sets_data(sets_data, set_type)

        return data


class TemplateHistoryExerciseSerializer(serializers.ModelSerializer):
    """
    Serializer for individual exercises within a completed workout
    """

    exercise = ExerciseSerializer(read_only=True)
    formatted_sets_display = serializers.ReadOnlyField()
    total_volume = serializers.ReadOnlyField()

    class Meta:
        model = TemplateHistoryExercise
        fields = [
            "id",
            "workout_history",
            "exercise",
            "exercise_name",
            "set_type",  # Added
            "performed_sets_data",
            "weight_unit",
            "total_sets_performed",
            "exercise_notes",
            "order",
            "formatted_sets_display",
            "total_volume",
            "created_at",
        ]
        extra_kwargs = {
            "workout_history": {"read_only": True},
        }

    def validate_set_type(self, value):
        """Validate set_type using centralized validator"""
        validate_set_type(value)
        return value

    def validate(self, data):
        """Cross-field validation for performed_sets_data and set_type"""
        performed_sets_data = (
            data.get("performed_sets_data") or self.instance.performed_sets_data
            if self.instance
            else None
        )
        set_type = (
            data.get("set_type") or self.instance.set_type
            if self.instance
            else SetTypeChoices.WEIGHT_REPS
        )

        # Only validate if performed_sets_data is provided
        if performed_sets_data:
            validate_sets_data(performed_sets_data, set_type)

        return data


class TemplateHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for completed workout sessions
    """

    performed_exercises = TemplateHistoryExerciseSerializer(many=True, read_only=True)
    original_template = TemplateSerializer(read_only=True)
    duration_minutes = serializers.ReadOnlyField()

    class Meta:
        model = TemplateHistory
        fields = [
            "id",
            "user_id",
            "original_template",
            "template_title",
            "started_at",
            "completed_at",
            "total_duration",
            "duration_minutes",
            "total_exercises",
            "total_sets",
            "workout_notes",
            "performed_exercises",
            "created_at",
        ]
        extra_kwargs = {
            "user_id": {"read_only": True},
        }


class SaveCompletedWorkoutSerializer(serializers.Serializer):
    """
    Serializer for saving a completed workout to history
    This is what the frontend will send when a workout is completed
    """

    # Template reference
    template_id = serializers.IntegerField(required=False, allow_null=True)
    template_title = serializers.CharField(max_length=50)

    # Timing
    started_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField()

    # Workout notes
    workout_notes = serializers.CharField(required=False, allow_blank=True)

    # Completed exercises
    completed_exercises = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
        help_text="List of completed exercises with their performed sets",
    )

    def validate_template_id(self, value):
        """Validate that the template exists and belongs to the user if provided"""
        if value is None:
            return value

        request = self.context.get("request")
        try:
            template = Template.objects.get(id=value, user_id=request.user)
            return value
        except Template.DoesNotExist:
            raise serializers.ValidationError(
                "Template not found or does not belong to user"
            )

    def validate_completed_exercises(self, value):
        """Validate completed exercises structure"""
        if not value:
            raise serializers.ValidationError("At least one exercise must be completed")

        for i, exercise_data in enumerate(value):
            # Required fields
            if "exercise_id" not in exercise_data:
                raise serializers.ValidationError(
                    f"Exercise {i + 1}: 'exercise_id' is required"
                )

            if "set_type" not in exercise_data:
                raise serializers.ValidationError(
                    f"Exercise {i + 1}: 'set_type' is required"
                )

            if "performed_sets_data" not in exercise_data:
                raise serializers.ValidationError(
                    f"Exercise {i + 1}: 'performed_sets_data' is required"
                )

            # Validate set_type
            set_type = exercise_data.get("set_type")
            try:
                validate_set_type(set_type)
            except serializers.ValidationError as e:
                raise serializers.ValidationError(f"Exercise {i + 1}: {str(e)}")

            # Validate performed_sets_data
            performed_sets_data = exercise_data.get("performed_sets_data")
            try:
                validate_sets_data(performed_sets_data, set_type)
            except serializers.ValidationError as e:
                raise serializers.ValidationError(f"Exercise {i + 1}: {str(e)}")

            # Validate exercise exists
            exercise_id = exercise_data.get("exercise_id")
            try:
                Exercise.objects.get(id=exercise_id)
            except Exercise.DoesNotExist:
                raise serializers.ValidationError(
                    f"Exercise {i + 1}: Exercise with id {exercise_id} does not exist"
                )

        return value

    def validate(self, data):
        """Cross-field validation"""
        started_at = data.get("started_at")
        completed_at = data.get("completed_at")

        if started_at and completed_at and completed_at <= started_at:
            raise serializers.ValidationError("completed_at must be after started_at")

        return data

    def create(self, validated_data):
        """Create a new workout history from completed workout data"""
        from django.db import transaction

        completed_exercises_data = validated_data.pop("completed_exercises")
        request = self.context.get("request")

        with transaction.atomic():
            # Get template if provided
            template = None
            template_id = validated_data.pop("template_id", None)
            if template_id:
                try:
                    template = Template.objects.get(
                        id=template_id, user_id=request.user
                    )
                except Template.DoesNotExist:
                    pass

            # Create workout history
            workout_history = TemplateHistory.objects.create(
                user_id=request.user,
                original_template=template,
                template_title=validated_data.get("template_title"),
                started_at=validated_data.get("started_at"),
                completed_at=validated_data.get("completed_at"),
                workout_notes=validated_data.get("workout_notes", ""),
                total_exercises=len(completed_exercises_data),
            )

            # Create history exercises
            total_sets = 0
            for order, exercise_data in enumerate(completed_exercises_data):
                exercise = Exercise.objects.get(id=exercise_data["exercise_id"])
                performed_sets_data = exercise_data["performed_sets_data"]
                set_type = exercise_data["set_type"]

                TemplateHistoryExercise.objects.create(
                    workout_history=workout_history,
                    exercise=exercise,
                    exercise_name=exercise.name,
                    set_type=set_type,
                    performed_sets_data=performed_sets_data,
                    weight_unit=exercise_data.get("weight_unit", "kg"),
                    exercise_notes=exercise_data.get("exercise_notes", ""),
                    order=order,
                )
                total_sets += len(performed_sets_data)

            # Update total sets
            workout_history.total_sets = total_sets
            workout_history.save()

            return workout_history


class AddExercisesToTemplateSerializer(serializers.Serializer):
    """
    Serializer for adding exercises from external API to a template
    """

    exercises = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_exercises(self, value):
        """Validate exercise data including sets_data and set_type"""
        for i, exercise_data in enumerate(value):
            # Required fields
            required_fields = ["name", "set_type", "sets_data"]
            for field in required_fields:
                if field not in exercise_data:
                    raise serializers.ValidationError(
                        f"Exercise {i + 1}: '{field}' is required"
                    )

            # Validate set_type
            set_type = exercise_data.get("set_type")
            try:
                validate_set_type(set_type)
            except serializers.ValidationError as e:
                raise serializers.ValidationError(f"Exercise {i + 1}: {str(e)}")

            # Validate sets_data
            sets_data = exercise_data.get("sets_data")
            try:
                validate_sets_data(sets_data, set_type)
            except serializers.ValidationError as e:
                raise serializers.ValidationError(f"Exercise {i + 1}: {str(e)}")

        return value


class CreateTemplateWithExercisesSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a template and adding exercises in one operation
    """

    exercises = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True,
        required=False,
        help_text="List of exercises to add to the template",
    )

    class Meta:
        model = Template
        fields = ["title", "isAlternative", "exercises"]

    def validate_exercises(self, value):
        """Validate exercise data including sets_data and set_type"""
        for i, exercise_data in enumerate(value):
            # Required fields
            required_fields = ["name", "set_type", "sets_data"]
            for field in required_fields:
                if field not in exercise_data:
                    raise serializers.ValidationError(
                        f"Exercise {i + 1}: '{field}' is required"
                    )

            # Validate set_type
            set_type = exercise_data.get("set_type")
            try:
                validate_set_type(set_type)
            except serializers.ValidationError as e:
                raise serializers.ValidationError(f"Exercise {i + 1}: {str(e)}")

            # Validate sets_data
            sets_data = exercise_data.get("sets_data")
            try:
                validate_sets_data(sets_data, set_type)
            except serializers.ValidationError as e:
                raise serializers.ValidationError(f"Exercise {i + 1}: {str(e)}")

        return value

    def create(self, validated_data):
        """Create template and associated exercises"""
        from django.db import transaction

        exercises_data = validated_data.pop("exercises", [])
        request = self.context.get("request")

        with transaction.atomic():
            # Create template
            template = Template.objects.create(
                user_id=request.user,
                title=validated_data.get("title"),
                isAlternative=validated_data.get("isAlternative", False),
            )

            # Add exercises if provided
            for order, exercise_data in enumerate(exercises_data):
                # Get or create exercise in master database
                exercise, _ = Exercise.objects.get_or_create(
                    name=exercise_data["name"],
                    defaults={
                        "type": exercise_data.get("type", ""),
                        "muscle": exercise_data.get("muscle", ""),
                        "equipment": exercise_data.get("equipment", ""),
                        "difficulty": exercise_data.get("difficulty", ""),
                        "instructions": exercise_data.get("instructions", ""),
                    },
                )

                # Create template exercise
                TemplateExercise.objects.create(
                    template=template,
                    exercise=exercise,
                    set_type=exercise_data["set_type"],
                    sets_data=exercise_data["sets_data"],
                    weight_unit=exercise_data.get("weight_unit", "kg"),
                    rest_time=exercise_data.get("rest_time"),
                    notes=exercise_data.get("notes", ""),
                    order=order,
                )

            return template


class SetManagementSerializer(serializers.Serializer):
    """
    Serializer for managing individual sets in a TemplateExercise
    """

    action = serializers.ChoiceField(choices=["add", "update", "remove"])
    set_index = serializers.IntegerField(required=False, min_value=0)
    set_type = serializers.CharField(required=False)
    reps = serializers.IntegerField(required=False, min_value=0, allow_null=True)
    weight = serializers.FloatField(required=False, min_value=0, allow_null=True)
    duration = serializers.CharField(required=False, allow_null=True)

    def validate_set_type(self, value):
        """Validate set_type if provided"""
        if value:
            validate_set_type(value)
        return value

    def validate(self, data):
        """Validate based on action type and set_type"""
        action = data.get("action")

        if action in ["update", "remove"]:
            if "set_index" not in data:
                raise serializers.ValidationError(
                    "set_index is required for update/remove actions"
                )

        if action == "add":
            # set_type is required for add
            if "set_type" not in data:
                raise serializers.ValidationError("set_type is required for add action")

            set_type = data.get("set_type")

            # Validate required fields based on set_type
            if set_type == "weight_reps":
                if "reps" not in data or "weight" not in data:
                    raise serializers.ValidationError(
                        "reps and weight are required for weight_reps type"
                    )
            elif set_type == "reps_only":
                if "reps" not in data:
                    raise serializers.ValidationError(
                        "reps is required for reps_only type"
                    )
            elif set_type == "duration":
                if "duration" not in data:
                    raise serializers.ValidationError(
                        "duration is required for duration type"
                    )

        if action == "update":
            # At least one field to update must be provided
            if not any(key in data for key in ["reps", "weight", "duration"]):
                raise serializers.ValidationError(
                    "At least one field (reps, weight, or duration) must be provided for update"
                )

        return data


class UpdateTemplateWithExercisesSerializer(serializers.ModelSerializer):
    """
    Serializer for updating a template with exercises (replacement logic)
    """

    exercises = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True,
        required=False,
        help_text="List of exercises to keep in the template",
    )

    class Meta:
        model = Template
        fields = ["title", "isAlternative", "exercises"]

    def validate_exercises(self, value):
        """Validate exercise data including sets_data and set_type"""
        for i, exercise_data in enumerate(value):
            # Required fields
            required_fields = ["name", "set_type", "sets_data"]
            for field in required_fields:
                if field not in exercise_data:
                    raise serializers.ValidationError(
                        f"Exercise {i + 1}: '{field}' is required"
                    )

            # Validate set_type
            set_type = exercise_data.get("set_type")
            try:
                validate_set_type(set_type)
            except serializers.ValidationError as e:
                raise serializers.ValidationError(f"Exercise {i + 1}: {str(e)}")

            # Validate sets_data
            sets_data = exercise_data.get("sets_data")
            try:
                validate_sets_data(sets_data, set_type)
            except serializers.ValidationError as e:
                raise serializers.ValidationError(f"Exercise {i + 1}: {str(e)}")

        return value

    def update(self, instance, validated_data):
        """Update template and replace all exercises"""
        from django.db import transaction

        exercises_data = validated_data.pop("exercises", None)

        with transaction.atomic():
            # Update template fields
            instance.title = validated_data.get("title", instance.title)
            instance.isAlternative = validated_data.get(
                "isAlternative", instance.isAlternative
            )
            instance.save()

            # If exercises data provided, replace all exercises
            if exercises_data is not None:
                # Delete all existing template exercises
                instance.template_exercises.all().delete()

                # Create new template exercises
                for order, exercise_data in enumerate(exercises_data):
                    exercise = self._create_template_exercise(
                        instance, None, exercise_data, order
                    )

            return instance

    def _create_template_exercise(self, template, exercise, exercise_data, order=0):
        """Helper method to create a template exercise"""
        # Get or create exercise in master database
        if not exercise:
            exercise, _ = Exercise.objects.get_or_create(
                name=exercise_data["name"],
                defaults={
                    "type": exercise_data.get("type", ""),
                    "muscle": exercise_data.get("muscle", ""),
                    "equipment": exercise_data.get("equipment", ""),
                    "difficulty": exercise_data.get("difficulty", ""),
                    "instructions": exercise_data.get("instructions", ""),
                },
            )

        # Create template exercise
        template_exercise = TemplateExercise.objects.create(
            template=template,
            exercise=exercise,
            set_type=exercise_data["set_type"],
            sets_data=exercise_data["sets_data"],
            weight_unit=exercise_data.get("weight_unit", "kg"),
            rest_time=exercise_data.get("rest_time"),
            notes=exercise_data.get("notes", ""),
            order=order,
        )

        return template_exercise
