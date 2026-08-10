from rest_framework import serializers
from .models import DailyGoal


class DailyGoalSerializer(serializers.ModelSerializer):
  class Meta:
    model = DailyGoal
    fields = ["id" , "title" , "category" , "points" , "is_completed" , "created_at"]
    read_only_fields = ["id" ,  "created_at"]