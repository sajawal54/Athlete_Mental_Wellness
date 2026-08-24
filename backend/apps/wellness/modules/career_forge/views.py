from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import CareerRoadmap
from apps.wellness.services import (
    complete_module,
    get_module_by_slug,
)

from .serializers import CareerRoadmapSerializer


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

    notes = request.data.get(
        "notes",
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

    timeline_months = max(
        timeline_months,
        1,
    )

    if not isinstance(transferable_skills, list):
        return Response(
            {
                "success": False,
                "message": (
                    "transferable_skills must be a list."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(milestones, list):
        return Response(
            {
                "success": False,
                "message": "milestones must be a list.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    roadmap, created = (
        CareerRoadmap.objects.update_or_create(
            user=request.user,
            defaults={
                "target_role": str(target_role),
                "industry": str(industry),
                "transferable_skills": transferable_skills,
                "milestones": milestones,
                "financial_goals": str(
                    financial_goals or ""
                ),
                "timeline_months": timeline_months,
                "notes": str(notes or ""),
            },
        )
    )

    # ---------------------------------------------------------
    # MODULE COMPLETION & XP AWARD LOGIC FIXED
    # ---------------------------------------------------------
    module = get_module_by_slug("career-forge")  # Slug apnay database ke mutabiq check kar lijiyega (e.g. "career-forge" ya "career_forge")
    xp_awarded = 0

    if not module:
        # Fallback slug search agar dash ki jagah underscore ho
        module = get_module_by_slug("career_forge")

    if module:
        result = complete_module(
            user=request.user,
            module=module,
            score=100,
        )
        xp_awarded = int(
            result.get("xp_awarded") 
            or module.xp_reward 
            or 0
        )
    else:
        xp_awarded = 15  # Default fallback XP agar module entry database mein na mile

    return Response(
        {
            "success": True,
            "message": (
                f"Career roadmap saved successfully. You earned {xp_awarded} XP!"
            ),
            "created": created,
            "roadmap": CareerRoadmapSerializer(
                roadmap
            ).data,
            "xp_awarded": xp_awarded,
            "ready_for_module_completion": True,
        },
        status=status.HTTP_200_OK,
    )