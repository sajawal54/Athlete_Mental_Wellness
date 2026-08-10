from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from .models import MoodLog
from .serializers import MoodLogSerializer


# Helper function delivering supportive AI feedback in English
def get_ai_message(mood):
    messages = {
        'great': "Fantastic energy! Today is a great opportunity to tackle heavy tasks and stay proactive.",
        'good': "Balanced and focused. Keep up this steady momentum toward your daily goals.",
        'neutral': "A steady baseline day. Stay hydrated and keep a comfortable rhythm.",
        'anxious': "Tension detected. Take a few deep breaths and focus on one step at a time.",
        'exhausted': "Your energy is low today. Prioritize rest, active recovery, and proper sleep."
    }
    return messages.get(mood, "Thank you for logging your mood check-in today!")

class MoodLogListCreateView(generics.ListCreateAPIView):
    serializer_class = MoodLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 1. Fetch entries belonging strictly to the logged-in user
    def get_queryset(self):
        return MoodLog.objects.filter(user=self.request.user)

    # 2. Create entry with duplicate-today check in English
    def create(self, request, *args, **kwargs):
        user = request.user
        today = timezone.now().date()
        
        # Check if the user has already checked in today
        if MoodLog.objects.filter(user=user, created_at__date=today).exists():
            return Response(
                {"error": "You have already completed your daily mood check-in for today!"},
                status=status.HTTP_400_BAD_REQUEST
            ) 

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mood_obj = serializer.save(user=user)
        
        # Attach the English AI feedback message to the API response
        response_data = serializer.data
        response_data['ai_message'] = get_ai_message(mood_obj.mood)
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class MoodLogDetailView(generics.DestroyAPIView):
    serializer_class = MoodLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MoodLog.objects.filter(user=self.request.user)

# Create your views here.
