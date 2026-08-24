from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import (
    LockerRoomScenario,
    LockerRoomSession,
)

from apps.wellness.services import (
    complete_module,
    get_module_by_slug,
)

from apps.notifications.services import (
    create_wellness_notification,
)

from .serializers import LockerRoomScenarioSerializer


# =============================================================
# WELLNESS NOTIFICATION HELPER
# =============================================================


def notify_wellness_completion(
    user,
    title,
    message,
    action_url="/modules",
):
    try:
        return create_wellness_notification(
            user=user,
            title=title,
            message=message,
            action_url=action_url,
        )
    except Exception:
        pass


# =============================================================
# LOCKER ROOM REALITIES
# =============================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def locker_room_scenarios_view(request):
    scenarios = (
        LockerRoomScenario.objects
        .filter(is_active=True)
        .order_by("order")
    )

    serializer = LockerRoomScenarioSerializer(
        scenarios,
        many=True,
    )

    return Response(
        {
            "success": True,
            "scenarios": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def locker_room_decide_view(request):
    scenario_id = request.data.get("scenario_id")

    if not scenario_id:
        return Response(
            {
                "success": False,
                "message": "scenario_id is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        choice_index = int(
            request.data.get(
                "choice_index",
                0,
            )
        )

    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": "choice_index must be a valid integer.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        scenario = LockerRoomScenario.objects.get(
            id=scenario_id,
            is_active=True,
        )

    except LockerRoomScenario.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Scenario not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    is_optimal = (
        choice_index == scenario.correct_choice
    )

    score = 100 if is_optimal else 60

    if is_optimal:
        evaluation = (
            f"Optimal Decision! "
            f"{scenario.explanation}"
        )
    else:
        evaluation = (
            "Consider the team-wide impact: "
            f"{scenario.explanation}"
        )

    # Use atomic transaction to securely handle session saving
    try:
        with transaction.atomic():
            session, _ = LockerRoomSession.objects.update_or_create(
                user=request.user,
                scenario=scenario,
                defaults={
                    "selected_choice": choice_index,
                    "score": score,
                    "evaluation": evaluation,
                    "status": "completed",
                    "completed_at": timezone.now(),
                },
            )
    except Exception as db_exc:
        return Response(
            {
                "success": False,
                "message": "Unable to save session right now.",
                "error": str(db_exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Robust module lookup with slug fallbacks
    module = get_module_by_slug("locker-room-realities")
    if not module:
        module = get_module_by_slug("locker_room_realities")

    xp_awarded = 0

    if module:
        try:
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
                try:
                    create_wellness_notification(
                        user=request.user,
                        title="Locker Room Decision Completed!",
                        message=f"You earned {xp_awarded} XP!",
                        action_url="/modules",
                    )
                except Exception:
                    pass
        except Exception:
            xp_awarded = int(getattr(module, "xp_reward", 15) or 15)
    else:
        xp_awarded = 15  # Default Fallback XP

    return Response(
        {
            "success": True,
            "is_optimal": is_optimal,
            "score": score,
            "evaluation": evaluation,
            "session_id": session.id,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_200_OK,
    )