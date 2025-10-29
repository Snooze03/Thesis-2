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

    class Meta:
        model = TemplateExercise
        fields = [
            "id",
            "template",
            "exercise",
            "exercise_name",
            "sets",
            "reps",
            "weight",
            "rest_time",
            "notes",
            "order",
        ]


class AddExercisesToTemplateSerializer(serializers.Serializer):
    """
    Serializer for adding exercises from external API to a template
    """

    exercises = serializers.ListField(child=serializers.DictField(), allow_empty=False)


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
                    sets=exercise_data.get("sets"),
                    reps=exercise_data.get("reps"),
                    weight=exercise_data.get("weight"),
                    rest_time=exercise_data.get("rest_time"),
                    notes=exercise_data.get("notes", ""),
                    order=order,
                )

        return template
