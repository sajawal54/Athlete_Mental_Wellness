from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import (
    MindfulMonsterSession,
    MindfulMonsterStep,
)

from apps.wellness.modules.mindful_monsters.serializers import (
    MindfulMonsterStepSerializer,
)


# =============================================================
# STEPS
# =============================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mindful_monsters_steps_view(request):

    steps = (
        MindfulMonsterStep.objects
        .filter(is_active=True)
        .order_by("order")
    )

    serializer = MindfulMonsterStepSerializer(
        steps,
        many=True,
    )

    return Response(
        {
            "success": True,
            "steps": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


# =============================================================
# RECORD SESSION
# =============================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mindful_monsters_record_view(request):

    completed_steps = request.data.get(
        "completed_steps",
        4,
    )

    try:
        completed_steps = int(
            completed_steps
        )
    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": (
                    "completed_steps must "
                    "be a valid number."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    total_steps = (
        MindfulMonsterStep.objects
        .filter(is_active=True)
        .count()
    )

    # Safety fallback
    if total_steps <= 0:
        total_steps = 4

    completed_steps = max(
        0,
        min(
            completed_steps,
            total_steps,
        ),
    )

    session = MindfulMonsterSession.objects.create(
        user=request.user,
        current_step=total_steps,
        completed_steps=completed_steps,
        total_steps=total_steps,
        status="completed",
        completed_at=timezone.now(),
    )

    # IMPORTANT:
    # XP is handled by shared ModuleShell.
    #
    # This endpoint only records the activity session.

    return Response(
        {
            "success": True,
            "session_id": session.id,
            "completed_steps": (
                completed_steps
            ),
            "total_steps": total_steps,
            "message": (
                "Mindful Monsters session "
                "recorded successfully."
            ),
            "completion_required": True,
        },
        status=status.HTTP_201_CREATED,
    )