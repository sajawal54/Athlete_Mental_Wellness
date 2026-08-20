from rest_framework import serializers

from apps.wellness.models import (
    Counselor,
    CounselorRequest,
)


class CounselorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Counselor
        fields = [
            "id",
            "name",
            "specialization",
            "bio",
            "experience_years",
            "location",
            "email",
            "phone",
            "image",
            "is_available",
        ]


class CounselorRequestSerializer(serializers.ModelSerializer):
    counselor_name = serializers.CharField(
        source="counselor.name",
        read_only=True,
    )

    counselor_specialization = serializers.CharField(
        source="counselor.specialization",
        read_only=True,
    )

    class Meta:
        model = CounselorRequest
        fields = [
            "id",
            "counselor",
            "counselor_name",
            "counselor_specialization",
            "request_type",
            "message",
            "preferred_date",
            "preferred_time",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "created_at",
        ]