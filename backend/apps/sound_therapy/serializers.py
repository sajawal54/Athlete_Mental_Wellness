
from rest_framework import serializers
from .models import SoundTrack


class SoundTrackSerializer(serializers.ModelSerializer):
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = SoundTrack
        fields = [
            "id",
            "title",
            "category",
            "audio_url",
        ]

    def get_audio_url(self, obj):
        if not obj.audio_file:
            return None

        url = obj.audio_file.url

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(url)

        return url

