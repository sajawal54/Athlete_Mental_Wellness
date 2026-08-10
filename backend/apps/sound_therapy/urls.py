from django.urls import path
from .views import SoundTrackListAPIView

urlpatterns = [
    path("sounds/", SoundTrackListAPIView.as_view(), name="sound-track-list"),
]