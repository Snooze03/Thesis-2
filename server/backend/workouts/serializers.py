from .models import Template, Exercise, TemplateExercise
from rest_framework import serializers


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


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = [
            "id",
            "name",
            "type",
            "muscle",
            "equipment",
            "difficulty",
            "instructions",
        ]


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
