from rest_framework import serializers
from ..models import Template, TemplateExercise, Exercise
from .exercise import ExerciseSerializer


class TemplateSerializer(serializers.ModelSerializer):
    exercise_count = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = ["id", "user_id", "title", "isAlternative", "exercise_count"]
        extra_kwargs = {
            "user_id": {"read_only": True},
        }

    def get_exercise_count(self, obj):
        return obj.template_exercises.count()


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
            "sets_data",
            "total_sets",
            "rest_time",
            "notes",
            "order",
            "formatted_sets_display",
        ]

    def validate_sets_data(self, value):
        """Validate sets_data structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("sets_data must be a list")

        for i, set_data in enumerate(value):
            if not isinstance(set_data, dict):
                raise serializers.ValidationError(f"Set {i+1} must be an object")

            # Validate reps
            reps = set_data.get("reps")
            if reps is not None and (not isinstance(reps, int) or reps < 0):
                raise serializers.ValidationError(
                    f"Set {i+1}: reps must be a positive integer or null"
                )

            # Validate weight
            weight = set_data.get("weight")
            if weight is not None and (
                not isinstance(weight, (int, float)) or weight < 0
            ):
                raise serializers.ValidationError(
                    f"Set {i+1}: weight must be a positive number or null"
                )

        return value


class AddExercisesToTemplateSerializer(serializers.Serializer):
    """
    Serializer for adding exercises from external API to a template
    """

    exercises = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_exercises(self, value):
        """Validate exercise data including sets_data"""
        for exercise_data in value:
            # Validate sets_data if provided
            sets_data = exercise_data.get("sets_data", [])
            if sets_data and not isinstance(sets_data, list):
                raise serializers.ValidationError("sets_data must be a list")

            for i, set_data in enumerate(sets_data):
                if not isinstance(set_data, dict):
                    raise serializers.ValidationError(f"Set {i+1} must be an object")

                # Check for required keys
                if "reps" not in set_data or "weight" not in set_data:
                    raise serializers.ValidationError(
                        f"Set {i+1} must have 'reps' and 'weight' keys"
                    )

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
        extra_kwargs = {
            "isAlternative": {"default": False},
        }

    def validate_exercises(self, value):
        """Validate each exercise in the list"""
        if not value:
            return value

        for exercise_data in value:
            # Validate required fields for each exercise
            required_fields = ["name"]
            for field in required_fields:
                if field not in exercise_data or not exercise_data[field].strip():
                    raise serializers.ValidationError(
                        f"Exercise must have a '{field}' field"
                    )

            # Validate sets_data if provided
            sets_data = exercise_data.get("sets_data", [])
            if sets_data:
                for i, set_data in enumerate(sets_data):
                    if not isinstance(set_data, dict):
                        raise serializers.ValidationError(
                            f"Set {i+1} must be an object"
                        )

                    if "reps" not in set_data or "weight" not in set_data:
                        raise serializers.ValidationError(
                            f"Set {i+1} must have 'reps' and 'weight' keys"
                        )

        return value

    def create(self, validated_data):
        """Create template and add exercises in a single transaction"""
        from django.db import transaction

        exercises_data = validated_data.pop("exercises", [])

        # Get the user from the context (set in the view)
        user = self.context["request"].user
        validated_data["user_id"] = user

        with transaction.atomic():
            # Create the template
            template = Template.objects.create(**validated_data)

            # Add exercises if provided
            for order, exercise_data in enumerate(exercises_data):
                # Get or create the exercise in our database
                exercise, created = Exercise.objects.get_or_create(
                    name=exercise_data["name"].strip(),
                    defaults={
                        "type": exercise_data.get("type", ""),
                        "muscle": exercise_data.get("muscle", ""),
                        "equipment": exercise_data.get("equipment", ""),
                        "difficulty": exercise_data.get("difficulty", ""),
                        "instructions": exercise_data.get("instructions", ""),
                    },
                )

                # Create the template-exercise relationship
                TemplateExercise.objects.create(
                    template=template,
                    exercise=exercise,
                    sets_data=exercise_data.get("sets_data", []),
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
    reps = serializers.IntegerField(required=False, min_value=0, allow_null=True)
    weight = serializers.FloatField(required=False, min_value=0, allow_null=True)

    def validate(self, data):
        action = data.get("action")

        if action == "add":
            # For add, we don't need set_index
            pass
        elif action in ["update", "remove"]:
            # For update/remove, we need set_index
            if "set_index" not in data:
                raise serializers.ValidationError(
                    "set_index is required for update/remove actions"
                )

        if action == "update":
            # For update, we need at least one of reps or weight
            if "reps" not in data and "weight" not in data:
                raise serializers.ValidationError(
                    "At least one of 'reps' or 'weight' is required for update"
                )

        return data
