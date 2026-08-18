from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def integrity_crossroads_info(request):
    return Response({
        "success": True,
        "module": {
            "name": "Integrity Crossroads",
            "description": "Practice ethical decision-making in athlete scenarios.",
            "instructions": "Review each scenario, pick the response that best matches your values, and reflect on the outcome.",
        },
        "scenarios": [
            {
                "id": 1,
                "prompt": "Your teammate asks you to hide a failed drug test from the coach so the team keeps its momentum.",
                "options": [
                    {"label": "Tell the coach the truth and ask for support", "value": "integrity", "score": 100},
                    {"label": "Hide it and hope no one notices", "value": "avoid", "score": 30},
                    {"label": "Ask the teammate to tell the truth together", "value": "supportive", "score": 85},
                ],
            },
            {
                "id": 2,
                "prompt": "A teammate is exhausted and asks you to fake a recovery report so they can keep playing.",
                "options": [
                    {"label": "Refuse and encourage honest recovery planning", "value": "integrity", "score": 100},
                    {"label": "Sign it anyway to help the team", "value": "avoid", "score": 25},
                    {"label": "Report concerns without blaming the athlete", "value": "supportive", "score": 90},
                ],
            },
            {
                "id": 3,
                "prompt": "You see a teammate cheat during a study session and no one else noticed.",
                "options": [
                    {"label": "Address it directly and report it fairly", "value": "integrity", "score": 100},
                    {"label": "Stay silent to avoid conflict", "value": "avoid", "score": 20},
                    {"label": "Talk to the teammate privately and ask them to stop", "value": "supportive", "score": 88},
                ],
            },
        ],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def integrity_crossroads_start(request):
    return Response({
        "success": True,
        "message": "Integrity Crossroads session started.",
        "session": {"id": 1, "status": "active"},
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def integrity_crossroads_complete(request):
    return Response({
        "success": True,
        "message": "Integrity Crossroads completed.",
        "xp_awarded": 30,
        "already_completed": False,
    }, status=status.HTTP_200_OK)
