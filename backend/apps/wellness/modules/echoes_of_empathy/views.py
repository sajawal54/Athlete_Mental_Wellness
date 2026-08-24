from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import (
    EmpathyScenario,
    EmpathySession,
)

from apps.wellness.modules.echoes_of_empathy.serializers import (
    EmpathyScenarioSerializer,
)

from apps.wellness.services import (
    complete_module,
    evaluate_empathy_response,
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
def echoes_of_empathy_scenarios_view(request):
    """
    Returns all active Echoes of Empathy scenarios.
    """

    scenarios = (
        EmpathyScenario.objects
        .filter(is_active=True)
        .order_by("order")
    )

    serializer = EmpathyScenarioSerializer(
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
def echoes_of_empathy_submit_view(request):
    """
    Evaluates the user's response to an empathy scenario,
    saves the session and completes the module securely.
    """

    scenario_id = request.data.get(
        "scenario_id"
    )

    response_text = request.data.get(
        "response",
        "",
    ).strip()

    if not scenario_id:
        return Response(
            {
                "success": False,
                "message": "scenario_id is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        scenario = EmpathyScenario.objects.get(
            id=scenario_id,
            is_active=True,
        )
    except EmpathyScenario.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Scenario not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if not response_text:
        return Response(
            {
                "success": False,
                "message": (
                    "Please provide your response."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    eval_result = evaluate_empathy_response(
        scenario,
        response_text,
    )

    session = EmpathySession.objects.create(
        user=request.user,
        scenario=scenario,
        response=response_text,
        feedback=eval_result.get("feedback", ""),
        score=eval_result.get("score", 0),
        status="completed",
        completed_at=timezone.now(),
    )

    # Module lookup with fallback for slug formats
    module = get_module_by_slug("echoes-of-empathy")
    if not module:
        module = get_module_by_slug("echoes_of_empathy")

    xp_awarded = 0

    if module:
        result = complete_module(
            user=request.user,
            module=module,
            session=None,
            score=eval_result.get("score", 0),
        )

        xp_awarded = int(
            result.get("xp_awarded") 
            or module.xp_reward 
            or 0
        )

        if xp_awarded > 0:
            notify_wellness_completion(
                user=request.user,
                title="Empathy Response Submitted!",
                message=(
                    f"You earned {xp_awarded} XP for completing Echoes of Empathy!"
                ),
                action_url="/modules",
            )
    else:
        xp_awarded = 15  # Safe fallback XP if module slug isn't found in DB

    return Response(
        {
            "success": True,
            "score": eval_result.get("score", 0),
            "feedback": eval_result.get("feedback", ""),
            "metrics": eval_result.get("metrics", {}),
            "session_id": session.id,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_201_CREATED,
    )