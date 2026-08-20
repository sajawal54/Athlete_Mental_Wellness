from django.contrib import admin

from .models import (
    EmergencyContact,
    Counselor,
    CallbackRequest,
    CrisisInformation,
    BreathingExercise,
)


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "region",
        "phone",
        "is_active",
        "order",
    )

    list_filter = (
        "region",
        "is_active",
    )

    search_fields = (
        "name",
        "phone",
        "description",
    )

    ordering = (
        "order",
        "name",
    )


@admin.register(Counselor)
class CounselorAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "specialization",
        "availability",
        "contact_email",
        "is_active",
        "order",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
        "specialization",
        "contact_email",
        "bio",
    )

    ordering = (
        "order",
        "name",
    )


@admin.register(CallbackRequest)
class CallbackRequestAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "contact",
        "urgency",
        "status",
        "created_at",
    )

    list_filter = (
        "urgency",
        "status",
        "created_at",
    )

    search_fields = (
        "name",
        "contact",
        "reason",
        "message",
    )

    readonly_fields = (
        "user",
        "name",
        "contact",
        "reason",
        "urgency",
        "message",
        "created_at",
    )

    ordering = (
        "-created_at",
    )


@admin.register(CrisisInformation)
class CrisisInformationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "is_active",
        "order",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "title",
        "content",
    )

    ordering = (
        "order",
        "id",
    )


@admin.register(BreathingExercise)
class BreathingExerciseAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "duration_seconds",
        "inhale_seconds",
        "hold_seconds",
        "exhale_seconds",
        "is_active",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "title",
        "description",
        "instructions",
    )

    ordering = (
        "title",
    )