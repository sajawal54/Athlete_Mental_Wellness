from rest_framework import serializers

from .models import (
    EmergencyContact,
    Counselor,
    CallbackRequest,
    CrisisInformation,
    BreathingExercise,
)


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = [
            "id",
            "name",
            "region",
            "phone",
            "website_url",
            "description",
            "is_active",
            "order",
        ]


class CounselorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Counselor
        fields = [
            "id",
            "name",
            "specialization",
            "bio",
            "availability",
            "contact_email",
            "is_active",
            "order",
        ]


class CallbackRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallbackRequest
        fields = [
            "id",
            "name",
            "contact",
            "reason",
            "urgency",
            "message",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Name is required."
            )

        return value

    def validate_contact(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Contact information is required."
            )

        return value

    def validate_reason(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Please provide a reason for the callback request."
            )

        return value


class CrisisInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrisisInformation
        fields = [
            "id",
            "title",
            "content",
            "is_active",
            "order",
        ]


class BreathingExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreathingExercise
        fields = [
            "id",
            "title",
            "description",
            "duration_seconds",
            "inhale_seconds",
            "hold_seconds",
            "exhale_seconds",
            "instructions",
            "is_active",
        ]