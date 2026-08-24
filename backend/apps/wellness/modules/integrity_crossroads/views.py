from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import IntegrityScenario, IntegritySession
from apps.wellness.services import complete_module, get_module_by_slug
from apps.notifications.services import create_wellness_notification

from .serializers import IntegrityScenarioSerializer


def notify_wellness_completion(
    user,
    title,
    message,
    action_url="/modules",
):
    return create_wellness_notification(
        user=user,
        title=title,
        message=message,
        action_url=action_url,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def integrity_scenarios_view(request):
    scenarios = (
        IntegrityScenario.objects
        .filter(is_active=True)
        .order_by("order")
    )

    serializer = IntegrityScenarioSerializer(
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
def integrity_submit_view(request):
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

    reflection = request.data.get(
        "reflection",
        "",
    )

    try:
        scenario = IntegrityScenario.objects.get(
            id=scenario_id,
            is_active=True,
        )
    except IntegrityScenario.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Scenario not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    choices = scenario.choices or []

    if (
        choice_index < 0
        or choice_index >= len(choices)
    ):
        return Response(
            {
                "success": False,
                "message": "Invalid choice_index.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    selected_choice = choices[choice_index]

    score = selected_choice.get(
        "score",
        80,
    )

    try:
        score = int(score)
    except (TypeError, ValueError):
        score = 80

    score = max(
        0,
        min(score, 100),
    )

    feedback = (
        selected_choice.get("values_reflection")
        or scenario.explanation
    )

    # Use atomic transaction and update_or_create to prevent "in progress" stuck state
    try:
        with transaction.atomic():
            session, _ = IntegritySession.objects.update_or_create(
                user=request.user,
                scenario=scenario,
                defaults={
                    "selected_choice": choice_index,
                    "reflection": reflection,
                    "score": score,
                    "status": "completed",
                },
            )
    except Exception as db_exc:
        return Response(
            {
                "success": False,
                "message": "Unable to save integrity session.",
                "error": str(db_exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Robust module lookup with slug fallbacks
    module = get_module_by_slug("integrity-crossroads")
    if not module:
        module = get_module_by_slug("integrity_crossroads")

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
                notify_wellness_completion(
                    user=request.user,
                    title="Integrity Scenario Completed!",
                    message=f"You earned {xp_awarded} XP!",
                    action_url="/modules",
                )
        except Exception:
            xp_awarded = int(module.xp_reward or 15)
    else:
        xp_awarded = 15  # Fallback XP if module lookup fails

    return Response(
        {
            "success": True,
            "score": score,
            "feedback": feedback,
            "session_id": session.id,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_200_OK,
    )