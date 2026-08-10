
from django.conf import settings
from rest_framework import generics, permissions
from rest_framework.response import Response

from .models import SoundTrack
from .serializers import SoundTrackSerializer


class SoundTrackListAPIView(generics.ListAPIView):

    serializer_class = SoundTrackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = SoundTrack.objects.filter(
            is_active=True
        ).order_by("-created_at")

        category = self.request.query_params.get("category")

        if category:
            queryset = queryset.filter(category=category)

        return queryset


class SoundTrackDetailAPIView(generics.RetrieveAPIView):

    serializer_class = SoundTrackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SoundTrack.objects.filter(is_active=True)

