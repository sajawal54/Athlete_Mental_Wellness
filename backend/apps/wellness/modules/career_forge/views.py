from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import CareerRoadmap

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
            "xp_awarded": 0,
            "ready_for_module_completion": True,
        },
        status=status.HTTP_200_OK,
    )