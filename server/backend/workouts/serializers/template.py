from rest_framework import serializers
from django.db import models
from ..models import Template, TemplateExercise, Exercise
from .exercise import ExerciseSerializer


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
        # Use prefetch_related to avoid N+1 queries if available
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

    def update(self, instance, validated_data):
        """Update template and replace exercises with the provided list"""
        from django.db import transaction
        from django.db import models
        import logging

        logger = logging.getLogger(__name__)

        exercises_data = validated_data.pop("exercises", None)

        logger.info(
            f"Updating template {instance.id} with {len(exercises_data) if exercises_data else 0} exercises"
        )

        with transaction.atomic():
            # Update template basic fields
            instance.title = validated_data.get("title", instance.title)
            instance.isAlternative = validated_data.get(
                "isAlternative", instance.isAlternative
            )
            instance.save()

            # If exercises data is provided, replace all exercises
            if exercises_data is not None:
                # Get all current template exercises for this template
                current_template_exercises = list(instance.template_exercises.all())
                current_exercise_ids = {te.id for te in current_template_exercises}

                # Get the IDs of exercises we want to keep/update
                provided_exercise_ids = set()
                for exercise_data in exercises_data:
                    template_exercise_id = exercise_data.get("template_exercise_id")
                    if template_exercise_id:
                        provided_exercise_ids.add(template_exercise_id)

                # Find exercises to remove (existing ones not in the provided list)
                exercises_to_remove = current_exercise_ids - provided_exercise_ids

                logger.info(f"Current exercises: {current_exercise_ids}")
                logger.info(f"Provided exercises: {provided_exercise_ids}")
                logger.info(f"Exercises to remove: {exercises_to_remove}")

                # Remove exercises that weren't included in the update
                if exercises_to_remove:
                    removed_count = TemplateExercise.objects.filter(
                        id__in=exercises_to_remove, template=instance
                    ).delete()[0]
                    logger.info(f"Removed {removed_count} exercises")
                else:
                    removed_count = 0

                # Now process the exercises we want to keep/add
                updated_exercises = []
                added_exercises = []

                for i, exercise_data in enumerate(exercises_data):
                    logger.info(
                        f"Processing exercise {i+1}: {exercise_data.get('name')} - ID: {exercise_data.get('template_exercise_id')}"
                    )

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

                    # Check if template_exercise_id is provided (for updating existing)
                    template_exercise_id = exercise_data.get("template_exercise_id")

                    if template_exercise_id:
                        logger.info(
                            f"Updating existing template exercise ID: {template_exercise_id}"
                        )
                        # Update existing template exercise
                        try:
                            template_exercise = TemplateExercise.objects.get(
                                id=template_exercise_id, template=instance
                            )
                            # Update the fields
                            old_sets = template_exercise.sets_data.copy()
                            template_exercise.sets_data = exercise_data.get(
                                "sets_data", template_exercise.sets_data
                            )
                            template_exercise.rest_time = exercise_data.get(
                                "rest_time", template_exercise.rest_time
                            )
                            template_exercise.notes = exercise_data.get(
                                "notes", template_exercise.notes
                            )
                            template_exercise.order = exercise_data.get(
                                "order", template_exercise.order
                            )
                            template_exercise.save()
                            logger.info(
                                f"Updated sets from {old_sets} to {template_exercise.sets_data}"
                            )
                            updated_exercises.append(template_exercise)
                        except TemplateExercise.DoesNotExist:
                            logger.warning(
                                f"Template exercise ID {template_exercise_id} not found, creating new"
                            )
                            # If template_exercise_id doesn't exist, create new one
                            template_exercise = self._create_template_exercise(
                                instance, exercise, exercise_data
                            )
                            added_exercises.append(template_exercise)
                    else:
                        logger.info(
                            f"No template_exercise_id provided, creating new exercise"
                        )
                        # Create new template exercise
                        template_exercise = self._create_template_exercise(
                            instance, exercise, exercise_data
                        )
                        added_exercises.append(template_exercise)

                logger.info(
                    f"Update complete: {len(updated_exercises)} updated, {len(added_exercises)} added, {removed_count} removed"
                )

                # Store update info for response
                instance._update_info = {
                    "updated_count": len(updated_exercises),
                    "added_count": len(added_exercises),
                    "removed_count": removed_count,
                    "updated_exercises": [te.exercise.name for te in updated_exercises],
                    "added_exercises": [te.exercise.name for te in added_exercises],
                    "removed_exercises": list(exercises_to_remove),
                }

        return instance

    def _create_template_exercise(self, template, exercise, exercise_data):
        """Helper method to create a new template exercise"""
        # Get the next order number
        max_order = (
            TemplateExercise.objects.filter(template=template).aggregate(
                max_order=models.Max("order")
            )["max_order"]
            or -1
        )

        return TemplateExercise.objects.create(
            template=template,
            exercise=exercise,
            sets_data=exercise_data.get("sets_data", []),
            rest_time=exercise_data.get("rest_time"),
            notes=exercise_data.get("notes", ""),
            order=exercise_data.get("order", max_order + 1),
        )
