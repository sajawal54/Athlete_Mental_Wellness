from django.contrib import admin
from .models import SoundTrack


@admin.register(SoundTrack)
class SoundTrackAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "is_active",
        "created_at",
    )

    list_filter = (
        "category",
        "is_active",
    )

    search_fields = (
        "title",
    )