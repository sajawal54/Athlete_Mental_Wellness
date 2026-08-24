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

from apps.wellness.services import (
    complete_module,
    get_module_by_slug,
)

from apps.notifications.services import (
    create_wellness_notification,
)


def notify_wellness_completion(
    user,
    title,
    message,
    action_url="/modules",
):
    """
    Creates a Wellness notification for the user.
    """
    return create_wellness_notification(
        user=user,
        title=title,
        message=message,
        action_url=action_url,
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

    # Calculate score based on progress percentage
    score = int((completed_steps / total_steps) * 100) if total_steps > 0 else 100

    # Module lookup with slug fallbacks
    module = get_module_by_slug("mindful-monsters")
    if not module:
        module = get_module_by_slug("mindful_monsters")

    xp_awarded = 0

    if module:
        result = complete_module(
            user=request.user,
            module=module,
            score=score,
        )

        xp_awarded = int(
            result.get("xp_awarded") 
            or module.xp_reward 
            or 0
        )

        if xp_awarded == 0 and module.xp_reward:
            xp_awarded = int(module.xp_reward)

        if xp_awarded > 0:
            notify_wellness_completion(
                user=request.user,
                title="Mindful Monsters Session Completed!",
                message=(
                    f"You earned {xp_awarded} XP!"
                ),
                action_url="/modules",
            )
    else:
        xp_awarded = 15  # Fallback XP

    return Response(
        {
            "success": True,
            "session_id": session.id,
            "completed_steps": completed_steps,
            "total_steps": total_steps,
            "message": (
                f"Mindful Monsters session recorded successfully. You earned {xp_awarded} XP!"
            ),
            "xp_awarded": xp_awarded,
            "completion_required": True,
        },
        status=status.HTTP_201_CREATED,
    )