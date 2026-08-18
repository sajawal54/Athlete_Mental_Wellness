from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    BreathworkSessionSerializer,
)

from .services import (
    start_session,
    update_session,
    pause_session,
    resume_session,
    stop_session,
    complete_session,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def breathwork_info(request):

    return Response({
        "success": True,
        "module": {
            "name": "Breathwork",
            "description": (
                "A guided breathing session "
                "with selectable durations."
            ),
        },
        "duration_options": [
            {
                "minutes": 1,
                "label": "1 Minute",
            },
            {
                "minutes": 3,
                "label": "3 Minutes",
            },
            {
                "minutes": 5,
                "label": "5 Minutes",
            },
            {
                "minutes": 10,
                "label": "10 Minutes",
            },
        ],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def breathwork_start(request):

    duration = request.data.get(
        "duration_minutes",
        5,
    )

    try:

        session = start_session(
            request.user,
            duration,
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = BreathworkSessionSerializer(
        session
    )

    return Response({
        "success": True,
        "message": "Breathwork session started.",
        "session": serializer.data,
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def breathwork_update(
    request,
    session_id,
):

    elapsed = request.data.get(
        "elapsed_seconds"
    )

    if elapsed is None:

        return Response(
            {
                "success": False,
                "message": (
                    "elapsed_seconds is required."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        session = update_session(
            request.user,
            session_id,
            elapsed,
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = BreathworkSessionSerializer(
        session
    )

    return Response({
        "success": True,
        "session": serializer.data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def breathwork_pause(
    request,
    session_id,
):

    try:

        session = pause_session(
            request.user,
            session_id,
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
        "message": "Session paused.",
        "session": BreathworkSessionSerializer(
            session
        ).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def breathwork_resume(
    request,
    session_id,
):

    try:

        session = resume_session(
            request.user,
            session_id,
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
        "message": "Session resumed.",
        "session": BreathworkSessionSerializer(
            session
        ).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def breathwork_stop(
    request,
    session_id,
):

    try:

        session = stop_session(
            request.user,
            session_id,
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
        "message": "Session stopped.",
        "session": BreathworkSessionSerializer(
            session
        ).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def breathwork_complete(
    request,
    session_id,
):

    try:

        result = complete_session(
            request.user,
            session_id,
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = BreathworkSessionSerializer(
        result["session"]
    )

    return Response({
        "success": True,
        "message": (
            "Breathwork completed."
            if not result["already_completed"]
            else "Session already completed."
        ),
        "already_completed": result[
            "already_completed"
        ],
        "xp_awarded": result[
            "xp_awarded"
        ],
        "session": serializer.data,
    })