from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import GritGardenSession

from apps.wellness.modules.grit_garden.serializers import (
    GritGardenSessionSerializer,
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def grit_garden_save_view(request):
    """
    Saves a Grit Garden reflection and completes
    the Grit Garden module.
    """

    exercise_type = request.data.get(
        "exercise_type",
        "reflection",
    )

    journal_text = request.data.get(
        "journal_text",
        "",
    )

    exercise_response = request.data.get(
        "exercise_response",
        "",
    )

    session = GritGardenSession.objects.create(
        user=request.user,
        exercise_type=exercise_type,
        journal_text=journal_text,
        exercise_response=exercise_response,
        status="completed",
        completed_at=timezone.now(),
    )

    module = get_module_by_slug(
        "grit-garden"
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
                title="Grit Garden Reflection Saved!",
                message=(
                    f"You earned {xp_awarded} XP!"
                ),
                action_url="/modules",
            )

    return Response(
        {
            "success": True,
            "session_id": session.id,
            "message": (
                "Reflection saved to your Grit Garden."
            ),
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def grit_garden_history_view(request):
    """
    Returns the user's latest 10 Grit Garden reflections.
    """

    sessions = (
        GritGardenSession.objects
        .filter(user=request.user)
        .order_by("-created_at")[:10]
    )

    serializer = GritGardenSessionSerializer(
        sessions,
        many=True,
    )

    return Response(
        {
            "success": True,
            "history": serializer.data,
        },
        status=status.HTTP_200_OK,
    )