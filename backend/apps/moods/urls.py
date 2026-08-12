from django.urls import path
from .views import MoodLogListCreateView, MoodLogDetailView , MoodHistoryClearView

urlpatterns = [
    # Get all mood logs OR submit a new daily check-in
    path('moods/', MoodLogListCreateView.as_view(), name='mood-list-create'),
    
    # Delete a specific mood log entry by ID
    path('moods/<int:pk>/', MoodLogDetailView.as_view(), name='mood-delete'),
    path('moods/delete/ ' , MoodHistoryClearView.as_view() , name="delete-mood")
]