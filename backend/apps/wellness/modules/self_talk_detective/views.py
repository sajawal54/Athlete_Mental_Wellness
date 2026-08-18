from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def self_talk_detective_info(request):
    return Response({
        "success": True,
        "module": {
            "name": "Self-Talk Detective",
            "description": "Spot unhelpful thoughts and rewrite them into more useful self-talk.",
            "instructions": "Write the thought looping in your mind, identify the distortions, and replace it with a more balanced statement.",
        },
        "examples": [
            "I always fail under pressure.",
            "Everyone thinks I am weak.",
            "I should be better than this already.",
        ],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def self_talk_detective_start(request):
    return Response({
        "success": True,
        "message": "Self-Talk Detective session started.",
        "session": {"id": 1, "status": "active"},
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def self_talk_detective_complete(request):
    return Response({
        "success": True,
        "message": "Self-Talk Detective completed.",
        "xp_awarded": 25,
        "already_completed": False,
    })
