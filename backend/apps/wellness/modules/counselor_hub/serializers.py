from rest_framework import serializers

from .models import (
    Counselor,
    CounselorRequest,
)


class CounselorSerializer(
    serializers.ModelSerializer
):

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


class CounselorRequestSerializer(
    serializers.ModelSerializer
):

    counselor_name = serializers.CharField(
        source="counselor.name",
        read_only=True,
    )

    class Meta:
        model = CounselorRequest

        fields = [
            "id",
            "counselor",
            "counselor_name",
            "request_type",
            "message",
            "preferred_date",
            "preferred_time",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "counselor_name",
            "status",
            "created_at",
            "updated_at",
        ]


class CounselorRequestCreateSerializer(
    serializers.Serializer
):

    counselor_id = serializers.IntegerField()

    request_type = serializers.ChoiceField(
        choices=[
            "appointment",
            "callback",
            "contact",
        ]
    )

    message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=3000,
    )

    preferred_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    preferred_time = serializers.TimeField(
        required=False,
        allow_null=True,
    )