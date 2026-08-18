from django.urls import path

from .views import (
    codex_categories,
    codex_lesson_detail,
    codex_start_lesson,
    codex_update_progress,
    codex_complete_lesson,
)


urlpatterns = [

    path(
        "",
        codex_categories,
        name="codex-categories",
    ),

    path(
        "lessons/<int:lesson_id>/",
        codex_lesson_detail,
        name="codex-lesson-detail",
    ),

    path(
        "lessons/<int:lesson_id>/start/",
        codex_start_lesson,
        name="codex-start-lesson",
    ),

    path(
        "lessons/<int:lesson_id>/progress/",
        codex_update_progress,
        name="codex-update-progress",
    ),

    path(
        "lessons/<int:lesson_id>/complete/",
        codex_complete_lesson,
        name="codex-complete-lesson",
    ),
]