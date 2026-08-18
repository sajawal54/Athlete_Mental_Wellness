from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    CounselorSerializer,
    CounselorRequestSerializer,
    CounselorRequestCreateSerializer,
)

from .services import (
    get_counselors,
    get_counselor,
    create_request,
    get_user_requests,
    cancel_request,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def counselor_hub_info(request):

    return Response({
        "success": True,
        "module": {
            "name": "Counselor Hub",
            "description": (
                "Find a counselor and request "
                "professional support."
            ),
        },
        "request_types": [
            "appointment",
            "callback",
            "contact",
        ],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def counselor_list(request):

    specialization = request.query_params.get(
        "specialization"
    )

    available_param = request.query_params.get(
        "available"
    )

    available = None

    if available_param == "true":
        available = True

    elif available_param == "false":
        available = False

    counselors = get_counselors(
        specialization=specialization,
        available=available,
    )

    return Response({
        "success": True,
        "count": counselors.count(),
        "counselors": CounselorSerializer(
            counselors,
            many=True,
        ).data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def counselor_detail(
    request,
    counselor_id,
):

    counselor = get_counselor(
        counselor_id
    )

    if not counselor:

        return Response(
            {
                "success": False,
                "message": "Counselor not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({
        "success": True,
        "counselor": CounselorSerializer(
            counselor
        ).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_counselor_request(
    request,
):

    serializer = CounselorRequestCreateSerializer(
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

    try:

        request_obj = create_request(
            user=request.user,
            counselor_id=serializer.validated_data[
                "counselor_id"
            ],
            request_type=serializer.validated_data[
                "request_type"
            ],
            message=serializer.validated_data.get(
                "message",
                "",
            ),
            preferred_date=serializer.validated_data.get(
                "preferred_date"
            ),
            preferred_time=serializer.validated_data.get(
                "preferred_time"
            ),
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "success": True,
            "message": (
                "Support request submitted."
            ),
            "request": CounselorRequestSerializer(
                request_obj
            ).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def counselor_request_history(request):

    requests = get_user_requests(
        request.user
    )

    return Response({
        "success": True,
        "requests": CounselorRequestSerializer(
            requests,
            many=True,
        ).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_counselor_request(
    request,
    request_id,
):

    try:

        request_obj = cancel_request(
            user=request.user,
            request_id=request_id,
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        "success": True,
        "message": "Request cancelled.",
        "request": CounselorRequestSerializer(
            request_obj
        ).data,
    })