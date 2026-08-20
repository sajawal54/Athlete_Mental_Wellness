from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import (
    Counselor,
    CounselorRequest,
)

from apps.wellness.modules.counselor_hub.serializers import (
    CounselorRequestSerializer,
    CounselorSerializer,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def counselor_list_view(request):
    """
    Returns available counselors.

    Optional query parameter:
        ?specialization=...
    """

    specialization = request.query_params.get(
        "specialization"
    )

    counselors = Counselor.objects.filter(
        is_available=True
    )

    if specialization:
        counselors = counselors.filter(
            specialization=specialization
        )

    serializer = CounselorSerializer(
        counselors,
        many=True,
    )

    return Response(
        {
            "success": True,
            "counselors": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def counselor_request_create_view(request):
    """
    Creates a counselor request for the
    authenticated user.
    """

    serializer = CounselorRequestSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            {
                "success": False,
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    counselor = serializer.validated_data.get(
        "counselor"
    )

    if counselor and not counselor.is_available:
        return Response(
            {
                "success": False,
                "message": (
                    "This counselor is currently unavailable."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    req = serializer.save(
        user=request.user
    )

    return Response(
        {
            "success": True,
            "message": (
                "Counselor request submitted. "
                "The team will follow up shortly."
            ),
            "request": CounselorRequestSerializer(
                req
            ).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def counselor_my_requests_view(request):
    """
    Returns counselor requests belonging
    to the authenticated user.
    """

    requests = (
        CounselorRequest.objects
        .filter(user=request.user)
        .order_by("-created_at")
    )

    serializer = CounselorRequestSerializer(
        requests,
        many=True,
    )

    return Response(
        {
            "success": True,
            "requests": serializer.data,
        },
        status=status.HTTP_200_OK,
    )