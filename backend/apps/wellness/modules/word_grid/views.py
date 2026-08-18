from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def word_grid_info(request):
    return Response({
        "success": True,
        "module": {
            "name": "Word Grid",
            "description": "Identify hidden performance words in a focused daily puzzle.",
            "instructions": "Scan the grid, find target words, and complete the challenge with your best focus.",
        },
        "words": ["LEAD", "POWER", "ATHLETE", "BALANCE"],
        "grid": [
            ["A", "T", "H", "L", "E"],
            ["R", "E", "S", "I", "L"],
            ["P", "O", "W", "E", "R"],
            ["N", "E", "T", "W", "O"],
            ["L", "E", "A", "D", "S"],
        ],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def word_grid_start(request):
    return Response({
        "success": True,
        "message": "Word Grid session started.",
        "session": {"id": 1, "status": "active"},
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def word_grid_complete(request):
    return Response({
        "success": True,
        "message": "Word Grid completed.",
        "xp_awarded": 25,
        "already_completed": False,
    })
