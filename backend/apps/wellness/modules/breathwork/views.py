from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import BreathworkSession

from apps.wellness.modules.breathwork.serializers import (
    BreathworkSessionSerializer,
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
def breathwork_info_view(request):
    """
    Returns Breathwork duration options
    and the breathing technique used
    by the module.
    """

    return Response(
        {
            "success": True,
            "duration_options": [
                {
                    "minutes": 1,
                    "label": "1 Minute Reset",
                },
                {
                    "minutes": 3,
                    "label": "3 Minutes Focus",
                },
                {
                    "minutes": 5,
                    "label": "5 Minutes Decompress",
                },
                {
                    "minutes": 10,
                    "label": "10 Minutes Deep State",
                },
            ],
            "technique": (
                "Box Breathing "
                "(4s Inhale, 4s Hold, 4s Exhale, 4s Hold)"
            ),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def breathwork_record_view(request):
    """
    Records a completed Breathwork session,
    completes the Breathwork module and awards XP.
    """

    try:
        duration = int(
            request.data.get(
                "duration_minutes",
                3,
            )
        )

        elapsed = int(
            request.data.get(
                "elapsed_seconds",
                duration * 60,
            )
        )

    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": (
                    "duration_minutes and elapsed_seconds "
                    "must be valid numbers."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if duration <= 0:
        return Response(
            {
                "success": False,
                "message": (
                    "duration_minutes must be greater than 0."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if elapsed < 0:
        return Response(
            {
                "success": False,
                "message": (
                    "elapsed_seconds cannot be negative."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    session = BreathworkSession.objects.create(
        user=request.user,
        duration_minutes=duration,
        elapsed_seconds=elapsed,
        status="completed",
        completed_at=timezone.now(),
    )

    module = get_module_by_slug(
        "breathwork-sanctuary"
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
                title="Breathwork Session Finished!",
                message=(
                    f"You earned {xp_awarded} XP!"
                ),
                action_url="/modules",
            )

    return Response(
        {
            "success": True,
            "session": BreathworkSessionSerializer(
                session
            ).data,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_201_CREATED,
    )