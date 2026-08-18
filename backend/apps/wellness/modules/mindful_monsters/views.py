from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    MindfulMonsterStepSerializer,
    MindfulMonsterSessionSerializer,
)

from .services import (
    get_steps,
    start_session,
    update_session,
    complete_session,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mindful_monsters_intro(request):
    """
    Return Mindful Monsters steps.
    """

    steps = get_steps()

    serializer = MindfulMonsterStepSerializer(
        steps,
        many=True,
    )

    return Response({
        "success": True,
        "module": {
            "name": "Mindful Monsters",
            "description": (
                "A guided breathing exercise "
                "to help you slow down and reset."
            ),
        },
        "steps": serializer.data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mindful_monsters_start(request):
    """
    Start or restore session.
    """

    try:

        module, progress, session = (
            start_session(
                request.user
            )
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = MindfulMonsterSessionSerializer(
        session
    )

    return Response({
        "success": True,
        "message": "Mindful Monsters session started.",
        "session": serializer.data,
        "module_progress": {
            "status": progress.status,
            "progress": progress.progress,
            "current_step": progress.current_step,
        },
    })


@api_view(["POST", "PATCH"])
@permission_classes([IsAuthenticated])
def mindful_monsters_update(
    request,
    session_id,
):
    """
    Update current breathing step.
    """

    try:

        session = update_session(
            user=request.user,
            session_id=session_id,
            current_step=request.data.get(
                "current_step"
            ),
            completed_steps=request.data.get(
                "completed_steps"
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

    serializer = MindfulMonsterSessionSerializer(
        session
    )

    return Response({
        "success": True,
        "session": serializer.data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mindful_monsters_complete(
    request,
    session_id,
):
    """
    Complete Mindful Monsters.
    """

    try:

        result = complete_session(
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

    serializer = MindfulMonsterSessionSerializer(
        result["session"]
    )

    return Response({
        "success": True,
        "message": (
            "Mindful Monsters completed."
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