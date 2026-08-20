from django.urls import include, path

from .views import (
    WellnessAIAssistantView,
    WellnessModuleCompleteAPIView,
    WellnessModuleDetailAPIView,
    WellnessModuleListAPIView,
    WellnessModuleProgressUpdateAPIView,
    WellnessModuleStartAPIView,
    WellnessMyProgressAPIView,
)


urlpatterns = [
    # =============================================================
    # CORE WELLNESS MODULE LIFECYCLE
    # =============================================================

    path(
        "modules/",
        WellnessModuleListAPIView.as_view(),
        name="wellness-modules",
    ),

    path(
        "modules/<slug:slug>/",
        WellnessModuleDetailAPIView.as_view(),
        name="wellness-module-detail",
    ),

    path(
        "modules/<slug:slug>/start/",
        WellnessModuleStartAPIView.as_view(),
        name="wellness-module-start",
    ),

    path(
        "modules/<slug:slug>/progress/update/",
        WellnessModuleProgressUpdateAPIView.as_view(),
        name="wellness-module-progress-update",
    ),

    path(
        "modules/<slug:slug>/complete/",
        WellnessModuleCompleteAPIView.as_view(),
        name="wellness-module-complete",
    ),

    path(
        "my-progress/",
        WellnessMyProgressAPIView.as_view(),
        name="wellness-my-progress",
    ),

    # =============================================================
    # WELLNESS AI ASSISTANT
    # =============================================================

    path(
        "ai-assistant/",
        WellnessAIAssistantView.as_view(),
        name="wellness-ai-assistant",
    ),

    # =============================================================
    # 1. CODEX
    # =============================================================

    path(
        "codex/",
        include(
            "apps.wellness.modules.codex.urls"
        ),
    ),

    # =============================================================
    # 2. MINDFUL MONSTERS
    # =============================================================

    path(
        "mindful-monsters/",
        include(
            "apps.wellness.modules.mindful_monsters.urls"
        ),
    ),

    # =============================================================
    # 3. BREATHWORK
    # =============================================================

    path(
        "breathwork/",
        include(
            "apps.wellness.modules.breathwork.urls"
        ),
    ),

    # =============================================================
    # 4. SETBACK REFRAMER
    # =============================================================

    path(
        "setback-reframer/",
        include(
            "apps.wellness.modules.setback_reframer.urls"
        ),
    ),

    # =============================================================
    # 5. GRIT GARDEN
    # =============================================================

    path(
        "grit-garden/",
        include(
            "apps.wellness.modules.grit_garden.urls"
        ),
    ),

    # =============================================================
    # 6. ECHOES OF EMPATHY
    # =============================================================

    path(
        "echoes-of-empathy/",
        include(
            "apps.wellness.modules.echoes_of_empathy.urls"
        ),
    ),

    # =============================================================
    # 7. COUNSELOR HUB
    # =============================================================

    path(
        "counselor-hub/",
        include(
            "apps.wellness.modules.counselor_hub.urls"
        ),
    ),

    # =============================================================
    # 8. TRANSITION SUPPORT
    # =============================================================

    path(
        "transition-support/",
        include(
            "apps.wellness.modules.transition_support.urls"
        ),
    ),

    # =============================================================
    # 9. LOCKER ROOM REALITIES
    # =============================================================

    path(
        "locker-room-realities/",
        include(
            "apps.wellness.modules.locker_room_realities.urls"
        ),
    ),

    # =============================================================
    # 10. REACTION ZONE
    # =============================================================

    path(
        "reaction-zone/",
        include(
            "apps.wellness.modules.reaction_zone.urls"
        ),
    ),

    # =============================================================
    # 11. INTEGRITY CROSSROADS
    # =============================================================

    path(
        "integrity-crossroads/",
        include(
            "apps.wellness.modules.integrity_crossroads.urls"
        ),
    ),

    # =============================================================
    # 12. SELF-TALK DETECTIVE
    # =============================================================

    path(
        "self-talk-detective/",
        include(
            "apps.wellness.modules.self_talk_detective.urls"
        ),
    ),

    # =============================================================
    # 13. CAREER FORGE
    # =============================================================

    path(
        "career-forge/",
        include(
            "apps.wellness.modules.career_forge.urls"
        ),
    ),

    # =============================================================
    # 14. WORD GRID
    # =============================================================

    path(
        "word-grid/",
        include(
            "apps.wellness.modules.word_grid.urls"
        ),
    ),
]