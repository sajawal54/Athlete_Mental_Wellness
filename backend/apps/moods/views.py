from django.db import transaction
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import MoodLog
from .serializers import MoodLogSerializer
from apps.accounts.models import Profile
from rest_framework.pagination import PageNumberPagination


    
class MoodPagination(PageNumberPagination):
    page_size = 2
    page_query_param = "page"

def get_ai_message(mood):
    messages = {
        "great": (
            "Fantastic energy! Today is a great opportunity "
            "to tackle heavy tasks and stay proactive."
        ),
        "good": (
            "Balanced and focused. Keep up this steady momentum "
            "toward your daily goals."
        ),
        "neutral": (
            "A steady baseline day. Stay hydrated and keep "
            "a comfortable rhythm."
        ),
        "anxious": (
            "Tension detected. Take a few deep breaths and "
            "focus on one step at a time."
        ),
        "exhausted": (
            "Your energy is low today. Prioritize rest, active "
            "recovery, and proper sleep."
        ),
    }

    return messages.get(
        mood,
        "Thank you for logging your mood check-in today!"
    )


class MoodLogListCreateView(generics.ListCreateAPIView):
    serializer_class = MoodLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MoodPagination

    def get_queryset(self):
        return MoodLog.objects.filter(
            user=self.request.user
        ).order_by("-created_at")
        

    def create(self, request, *args, **kwargs):
        user = request.user
        today = timezone.localdate()

        # One mood check-in per user per day
        already_checked_in = MoodLog.objects.filter(
            user=user,
            created_at__date=today
        ).exists()

        if already_checked_in:
            return Response(
                {
                    "error": (
                        "You have already completed your "
                        "daily mood check-in for today!"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            mood_obj = serializer.save(user=user)

            profile, _ = Profile.objects.get_or_create(
                user=user
            )

            # Mood check-in reward
            profile.add_xp(80)

            # Update daily streak
            profile.update_streak(today)

            profile.refresh_from_db()

        response_data = serializer.data

        response_data["ai_message"] = get_ai_message(
            mood_obj.mood
        )

        response_data["xp_gained"] = 80
        response_data["new_total_xp"] = profile.xp
        response_data["level"] = profile.level
        response_data["streak"] = profile.streak

        return Response(
            response_data,
            status=status.HTTP_201_CREATED
        )


class MoodLogDetailView(generics.DestroyAPIView):
    serializer_class = MoodLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MoodLog.objects.filter(
            user=self.request.user
        )
        
class MoodHistoryClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        MoodLog.objects.filter(user=request.user).delete()

        return Response(
            {"message": "Mood history cleared successfully"},
            status=status.HTTP_204_NO_CONTENT
        )