from django.urls import path
from .views import SoundTrackListAPIView, SoundTrackDetailAPIView

urlpatterns = [
    path("sounds/", SoundTrackListAPIView.as_view(), name="sound-track-list"),
    path("sounds/<int:pk>/", SoundTrackDetailAPIView.as_view(), name="sound-track-detail"),
]