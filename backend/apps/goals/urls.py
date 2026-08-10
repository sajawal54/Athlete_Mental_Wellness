from django.urls import path
from .views import DailyGoalListCreateView, DailyGoalToggleView, DailyGoalDeleteView

urlpatterns = [
    path('goals/daily/', DailyGoalListCreateView.as_view(), name='daily-goals-list-create'),
    path('goals/<int:pk>/toggle/', DailyGoalToggleView.as_view(), name='daily-goal-toggle'),
    path('goals/<int:pk>/', DailyGoalDeleteView.as_view(), name='daily-goal-delete'),
]