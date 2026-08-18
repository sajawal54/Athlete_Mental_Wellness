from django.urls import path

from .views import (
    # Core Shared Lifecycle
    WellnessModuleListAPIView,
    WellnessModuleDetailAPIView,
    WellnessModuleStartAPIView,
    WellnessModuleProgressUpdateAPIView,
    WellnessModuleCompleteAPIView,
    WellnessMyProgressAPIView,
    # 1. Codex
    codex_categories_view,
    codex_lesson_detail_view,
    codex_lesson_start_view,
    codex_lesson_complete_view,
    # 2. Mindful Monsters
    mindful_monsters_steps_view,
    mindful_monsters_record_view,
    # 3. Breathwork
    breathwork_info_view,
    breathwork_record_view,
    # 4. Setback Reframer
    setback_reframe_generate_view,
    setback_reframe_history_view,
    # 5. Grit Garden
    grit_garden_save_view,
    grit_garden_history_view,
    # 6. Echoes of Empathy
    echoes_of_empathy_scenarios_view,
    echoes_of_empathy_submit_view,
    # 7. Counselor Hub
    counselor_list_view,
    counselor_request_create_view,
    counselor_my_requests_view,
    # 8. Transition Support
    transition_resources_view,
    transition_resource_mark_viewed_view,
    # 9. Locker Room Realities
    locker_room_scenarios_view,
    locker_room_decide_view,
    # 10. Reaction Zone
    reaction_zone_prompts_view,
    reaction_zone_submit_score_view,
    reaction_zone_leaderboard_view,
    # 11. Integrity Crossroads
    integrity_scenarios_view,
    integrity_submit_view,
    # 12. Self-Talk Detective
    self_talk_analyze_view,
    self_talk_history_view,
    # 13. Career Forge
    career_forge_roadmap_view,
    career_forge_save_view,
    # 14. Word Grid
    word_grid_daily_view,
    word_grid_submit_view,
    word_grid_leaderboard_view,
    # ai assisstant view
    WellnessAIAssistantView,
)

urlpatterns = [
    # -------------------------------------------------------------
    # Shared Module Shell Lifecycle Routes
    # -------------------------------------------------------------
    path("modules/", WellnessModuleListAPIView.as_view(), name="wellness-modules"),
    path("modules/<slug:slug>/", WellnessModuleDetailAPIView.as_view(), name="wellness-module-detail"),
    path("modules/<slug:slug>/start/", WellnessModuleStartAPIView.as_view(), name="wellness-module-start"),
    path("modules/<slug:slug>/progress/update/", WellnessModuleProgressUpdateAPIView.as_view(), name="wellness-module-progress-update"),
    path("modules/<slug:slug>/complete/", WellnessModuleCompleteAPIView.as_view(), name="wellness-module-complete"),
    path("my-progress/", WellnessMyProgressAPIView.as_view(), name="wellness-my-progress"),
    path('ai-assistant/', WellnessAIAssistantView.as_view(), name='wellness-ai-assistant'),

    # -------------------------------------------------------------
    # Module-Specific Routes
    # -------------------------------------------------------------
    # 1. Codex
    path("codex/categories/", codex_categories_view, name="codex-categories"),
    path("codex/lessons/<int:lesson_id>/", codex_lesson_detail_view, name="codex-lesson-detail"),
    path("codex/lessons/<int:lesson_id>/start/", codex_lesson_start_view, name="codex-lesson-start"),
    path("codex/lessons/<int:lesson_id>/complete/", codex_lesson_complete_view, name="codex-lesson-complete"),

    # 2. Mindful Monsters
    path("mindful-monsters/steps/", mindful_monsters_steps_view, name="mindful-monsters-steps"),
    path("mindful-monsters/record/", mindful_monsters_record_view, name="mindful-monsters-record"),

    # 3. Breathwork
    path("breathwork/info/", breathwork_info_view, name="breathwork-info"),
    path("breathwork/record/", breathwork_record_view, name="breathwork-record"),

    # 4. Setback Reframer
    path("setback-reframer/generate/", setback_reframe_generate_view, name="setback-reframer-generate"),
    path("setback-reframer/history/", setback_reframe_history_view, name="setback-reframer-history"),

    # 5. Grit Garden
    path("grit-garden/save/", grit_garden_save_view, name="grit-garden-save"),
    path("grit-garden/history/", grit_garden_history_view, name="grit-garden-history"),

    # 6. Echoes of Empathy
    path("echoes-of-empathy/scenarios/", echoes_of_empathy_scenarios_view, name="echoes-of-empathy-scenarios"),
    path("echoes-of-empathy/submit/", echoes_of_empathy_submit_view, name="echoes-of-empathy-submit"),

    # 7. Counselor Hub
    path("counselor-hub/counselors/", counselor_list_view, name="counselor-hub-list"),
    path("counselor-hub/request/", counselor_request_create_view, name="counselor-hub-request"),
    path("counselor-hub/my-requests/", counselor_my_requests_view, name="counselor-hub-my-requests"),

    # 8. Transition Support
    path("transition-support/resources/", transition_resources_view, name="transition-support-resources"),
    path("transition-support/resource/<int:resource_id>/view/", transition_resource_mark_viewed_view, name="transition-support-view"),

    # 9. Locker Room Realities
    path("locker-room-realities/scenarios/", locker_room_scenarios_view, name="locker-room-scenarios"),
    path("locker-room-realities/decide/", locker_room_decide_view, name="locker-room-decide"),

    # 10. Reaction Zone
    path("reaction-zone/prompts/", reaction_zone_prompts_view, name="reaction-zone-prompts"),
    path("reaction-zone/submit-score/", reaction_zone_submit_score_view, name="reaction-zone-submit"),
    path("reaction-zone/leaderboard/", reaction_zone_leaderboard_view, name="reaction-zone-leaderboard"),

    # 11. Integrity Crossroads
    path("integrity-crossroads/scenarios/", integrity_scenarios_view, name="integrity-crossroads-scenarios"),
    path("integrity-crossroads/submit/", integrity_submit_view, name="integrity-crossroads-submit"),

    # 12. Self-Talk Detective
    path("self-talk-detective/analyze/", self_talk_analyze_view, name="self-talk-detective-analyze"),
    path("self-talk-detective/history/", self_talk_history_view, name="self-talk-detective-history"),

    # 13. Career Forge
    path("career-forge/roadmap/", career_forge_roadmap_view, name="career-forge-roadmap"),
    path("career-forge/save/", career_forge_save_view, name="career-forge-save"),

    # 14. Word Grid
    path("word-grid/daily/", word_grid_daily_view, name="word-grid-daily"),
    path("word-grid/submit/", word_grid_submit_view, name="word-grid-submit"),
    path("word-grid/leaderboard/", word_grid_leaderboard_view, name="word-grid-leaderboard"),
]