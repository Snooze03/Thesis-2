from .models import Template, Exercise
from rest_framework import serializers


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = [
            "id",
            "user_id",
            "title",
        ]
        extra_kwargs = {
            "user_id": {"read_only": True},
        }


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = [
            "id",
            "template_id",
            "name",
            "type",
            "muscle",
            "equipment",
            "difficulty",
            "instructions",
        ]
        # extra_kwargs = {
        #     "template_id": {"read_only": True},
        # }
