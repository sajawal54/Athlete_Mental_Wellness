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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mindful_monsters_steps_view(request):
    """
    Returns all active Mindful Monsters steps.
    """

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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mindful_monsters_record_view(request):
    """
    Records a completed Mindful Monsters session
    and awards the module XP through the shared
    wellness completion service.
    """

    completed_steps = request.data.get(
        "completed_steps",
        4,
    )

    try:
        completed_steps = int(completed_steps)
    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": "completed_steps must be a valid number.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if completed_steps < 0:
        return Response(
            {
                "success": False,
                "message": "completed_steps cannot be negative.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    session = MindfulMonsterSession.objects.create(
        user=request.user,
        completed_steps=completed_steps,
        total_steps=4,
        status="completed",
        completed_at=timezone.now(),
    )

    module = get_module_by_slug(
        "mindful-monsters"
    )

    xp_awarded = 0

    if module:
        result = complete_module(
            user=request.user,
            module=module,
            session=None,
            score=100,
        )

        xp_awarded = result.get(
            "xp_awarded",
            0,
        )

        if xp_awarded > 0:
            notify_wellness_completion(
                user=request.user,
                title="Mindful Monsters Completed!",
                message=(
                    f"You earned {xp_awarded} XP!"
                ),
                action_url="/modules",
            )

    return Response(
        {
            "success": True,
            "session_id": session.id,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_201_CREATED,
    )