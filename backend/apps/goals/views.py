from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from .models import DailyGoal
from .serializers import DailyGoalSerializer

class DailyGoalListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    # Get Today's Goals for logged-in athlete
    def get(self, request):
        today = timezone.now().date()
        goals = DailyGoal.objects.filter(user=request.user, created_at=today)
        serializer = DailyGoalSerializer(goals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Add Custom Daily Goal
    def post(self, request):
        serializer = DailyGoalSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DailyGoalToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    # Toggle Goal Completion (Complete / Uncomplete)
    def patch(self, request, pk):
        try:
            goal = DailyGoal.objects.get(pk=pk, user=request.user)
            goal.is_completed = not goal.is_completed
            goal.save()
            serializer = DailyGoalSerializer(goal)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DailyGoal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=status.HTTP_404_NOT_FOUND)


class DailyGoalDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    # Delete Goal
    def delete(self, request, pk):
        try:
            goal = DailyGoal.objects.get(pk=pk, user=request.user)
            goal.delete()
            return Response({'message': 'Goal deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except DailyGoal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=status.HTTP_404_NOT_FOUND)
# Create your views here.
