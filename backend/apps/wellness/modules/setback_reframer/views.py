from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    ReframeSessionSerializer,
    ReframeCreateSerializer,
)

from .services import (
    create_reframe_session,
    get_history,
    complete_reframe,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reframer_info(request):

    return Response({
        "success": True,
        "module": {
            "name": "Setback Reframer",
            "description": (
                "Turn a difficult thought into "
                "a more balanced perspective."
            ),
        },
        "instructions": [
            "Write one difficult or negative thought.",
            "Review the suggested reframe.",
            "Choose one small action you can control.",
        ],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_reframe(request):

    serializer = ReframeCreateSerializer(
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

        session = create_reframe_session(
            user=request.user,
            thought=serializer.validated_data[
                "negative_thought"
            ],
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
            "message": "Reframe generated.",
            "session": ReframeSessionSerializer(
                session
            ).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reframer_history(request):

    sessions = get_history(
        request.user
    )

    serializer = ReframeSessionSerializer(
        sessions,
        many=True,
    )

    return Response({
        "success": True,
        "history": serializer.data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_reframe_view(
    request,
    session_id,
):

    try:

        result = complete_reframe(
            user=request.user,
            session_id=session_id,
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
        "message": (
            "Reframing exercise completed."
            if not result["already_completed"]
            else "Exercise already completed."
        ),
        "already_completed": result[
            "already_completed"
        ],
        "xp_awarded": result[
            "xp_awarded"
        ],
        "session": ReframeSessionSerializer(
            result["session"]
        ).data,
    })