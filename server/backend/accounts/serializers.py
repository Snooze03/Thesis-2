from .models import Account
from rest_framework import serializers


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "current_weight",
            "goal_weight",
            "height_ft",
            "height_in",
            "body_goal",
            "injuries",
            "food_allergies",
            "workout_frequency",
            "workout_location",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    # Overrides the built in create function to hash the password
    # use .save() to call this function
    def create(self, validated_data):
        user = Account.objects.create_user(**validated_data)
        return user
