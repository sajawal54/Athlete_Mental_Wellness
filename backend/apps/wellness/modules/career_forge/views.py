from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import CareerRoadmap

from apps.wellness.services import (
    complete_module,
    get_module_by_slug,
)

from apps.notifications.services import (
    create_wellness_notification,
)

from .serializers import CareerRoadmapSerializer


# =============================================================
# WELLNESS NOTIFICATION HELPER
# =============================================================

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


# =============================================================
# CAREER FORGE
# =============================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def career_forge_roadmap_view(request):
    roadmap = (
        CareerRoadmap.objects
        .filter(user=request.user)
        .first()
    )

    return Response(
        {
            "success": True,
            "roadmap": (
                CareerRoadmapSerializer(
                    roadmap
                ).data
                if roadmap
                else None
            ),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def career_forge_save_view(request):
    target_role = request.data.get(
        "target_role",
        "Sports Performance Specialist",
    )

    industry = request.data.get(
        "industry",
        "Athletics & Sports Tech",
    )

    transferable_skills = request.data.get(
        "transferable_skills",
        [],
    )

    milestones = request.data.get(
        "milestones",
        [],
    )

    financial_goals = request.data.get(
        "financial_goals",
        "",
    )

    try:
        timeline_months = int(
            request.data.get(
                "timeline_months",
                12,
            )
        )
    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": (
                    "timeline_months must be a valid integer."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    notes = request.data.get(
        "notes",
        "",
    )

    roadmap, created = (
        CareerRoadmap.objects.update_or_create(
            user=request.user,
            defaults={
                "target_role": target_role,
                "industry": industry,
                "transferable_skills": transferable_skills,
                "milestones": milestones,
                "financial_goals": financial_goals,
                "timeline_months": timeline_months,
                "notes": notes,
            },
        )
    )

    # ---------------------------------------------------------
    # Complete Wellness Module
    # ---------------------------------------------------------

    module = get_module_by_slug(
        "career-forge"
    )

    xp_awarded = 0

    if module:
        result = complete_module(
            user=request.user,
            module=module,
            score=100,
        )

        xp_awarded = result.get(
            "xp_awarded",
            0,
        )

        if xp_awarded > 0:
            notify_wellness_completion(
                user=request.user,
                title="Career Roadmap Updated!",
                message=(
                    f"You earned {xp_awarded} XP "
                    "for saving your roadmap!"
                ),
                action_url="/modules",
            )

    return Response(
        {
            "success": True,
            "message": (
                "Career roadmap saved successfully."
            ),
            "created": created,
            "roadmap": CareerRoadmapSerializer(
                roadmap
            ).data,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_200_OK,
    )