"""
Validation utilities for workout sets data
Centralizes validation logic for different set types
"""

from rest_framework import serializers
import re


def validate_duration_format(duration):
    """
    Validate duration format (MM:SS)
    Returns True if valid, raises ValidationError if not

    Examples of valid formats:
    - "00:30" (30 seconds)
    - "02:30" (2 minutes 30 seconds)
    - "59:59" (59 minutes 59 seconds)
    """
    if not isinstance(duration, str):
        raise serializers.ValidationError("Duration must be a string in MM:SS format")

    # Match MM:SS format where MM is 0-99 and SS is 00-59
    pattern = r"^(\d{1,2}):([0-5][0-9])$"
    match = re.match(pattern, duration)

    if not match:
        raise serializers.ValidationError(
            "Duration must be in MM:SS format (e.g., '02:30' for 2 minutes 30 seconds)"
        )

    # Extract minutes and seconds
    minutes = int(match.group(1))
    seconds = int(match.group(2))

    # Ensure total duration is reasonable (e.g., max 99 minutes)
    if minutes > 99:
        raise serializers.ValidationError("Duration minutes cannot exceed 99")

    # Ensure it's not zero duration
    if minutes == 0 and seconds == 0:
        raise serializers.ValidationError("Duration must be greater than 00:00")

    return True


def validate_single_set(set_data, set_type, set_number=None):
    """
    Validate a single set based on set_type

    Args:
        set_data: Dictionary containing set information
        set_type: One of 'weight_reps', 'reps_only', 'duration'
        set_number: Optional set number for error messages

    Returns:
        True if valid

    Raises:
        serializers.ValidationError if invalid
    """
    set_label = f"Set {set_number}" if set_number else "Set"

    if not isinstance(set_data, dict):
        raise serializers.ValidationError(f"{set_label} must be an object")

    if set_type == "weight_reps":
        # Validate reps
        if "reps" not in set_data:
            raise serializers.ValidationError(f"{set_label}: 'reps' is required")

        reps = set_data.get("reps")
        if reps is not None:
            if not isinstance(reps, int) or reps < 0:
                raise serializers.ValidationError(
                    f"{set_label}: reps must be a non-negative integer or null"
                )
            if reps > 1000:  # Reasonable upper limit
                raise serializers.ValidationError(
                    f"{set_label}: reps cannot exceed 1000"
                )

        # Validate weight
        if "weight" not in set_data:
            raise serializers.ValidationError(f"{set_label}: 'weight' is required")

        weight = set_data.get("weight")
        if weight is not None:
            if not isinstance(weight, (int, float)) or weight < 0:
                raise serializers.ValidationError(
                    f"{set_label}: weight must be a non-negative number or null"
                )
            if weight > 10000:  # Reasonable upper limit (e.g., 10000 kg/lbs)
                raise serializers.ValidationError(
                    f"{set_label}: weight cannot exceed 10000"
                )

    elif set_type == "reps_only":
        # Validate reps only
        if "reps" not in set_data:
            raise serializers.ValidationError(f"{set_label}: 'reps' is required")

        reps = set_data.get("reps")
        if not isinstance(reps, int) or reps <= 0:
            raise serializers.ValidationError(
                f"{set_label}: reps must be a positive integer"
            )
        if reps > 1000:  # Reasonable upper limit
            raise serializers.ValidationError(f"{set_label}: reps cannot exceed 1000")

    elif set_type == "duration":
        # Validate duration
        if "duration" not in set_data:
            raise serializers.ValidationError(f"{set_label}: 'duration' is required")

        duration = set_data.get("duration")
        try:
            validate_duration_format(duration)
        except serializers.ValidationError as e:
            raise serializers.ValidationError(f"{set_label}: {str(e)}")

    else:
        raise serializers.ValidationError(f"Invalid set_type: {set_type}")

    return True


def validate_sets_data(sets_data, set_type):
    """
    Validate an array of sets based on set_type

    Args:
        sets_data: List of set dictionaries
        set_type: One of 'weight_reps', 'reps_only', 'duration'

    Returns:
        True if valid

    Raises:
        serializers.ValidationError if invalid
    """
    if not isinstance(sets_data, list):
        raise serializers.ValidationError("sets_data must be a list")

    if not sets_data:
        raise serializers.ValidationError("sets_data must contain at least one set")

    if len(sets_data) > 50:  # Reasonable upper limit for sets
        raise serializers.ValidationError("Cannot have more than 50 sets per exercise")

    for i, set_data in enumerate(sets_data):
        validate_single_set(set_data, set_type, set_number=i + 1)

    return True


def validate_set_type(set_type):
    """
    Validate that set_type is one of the allowed choices

    Args:
        set_type: String representing the set type

    Returns:
        True if valid

    Raises:
        serializers.ValidationError if invalid
    """
    VALID_SET_TYPES = ["weight_reps", "reps_only", "duration"]

    if set_type not in VALID_SET_TYPES:
        raise serializers.ValidationError(
            f"Invalid set_type. Must be one of: {', '.join(VALID_SET_TYPES)}"
        )

    return True
