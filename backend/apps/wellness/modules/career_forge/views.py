from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def career_forge_info(request):
    return Response({
        "success": True,
        "module": {
            "name": "Career Forge",
            "description": "Create a clear roadmap for the next chapter in your athletic and professional life.",
            "instructions": "Set your direction, choose a focus area, and define milestone actions that support your post-sport transition.",
        },
        "roadmap": {
            "role": "Performance Analyst",
            "focus": "Sports operations and athlete development",
            "milestones": [
                "Earn certifications in analytics",
                "Build a portfolio of game insights",
                "Connect with mentors in sports business",
            ],
        },
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def career_forge_start(request):
    return Response({
        "success": True,
        "message": "Career Forge session started.",
        "session": {"id": 1, "status": "active"},
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def career_forge_complete(request):
    return Response({
        "success": True,
        "message": "Career Forge completed.",
        "xp_awarded": 40,
        "already_completed": False,
    })
