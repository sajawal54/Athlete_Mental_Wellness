from django.urls import path

from .views import (
    codex_categories_view,
    codex_lesson_detail_view,
    codex_lesson_start_view,
    codex_lesson_complete_view,
)


urlpatterns = [
    path(
        "categories/",
        codex_categories_view,
        name="codex-categories",
    ),

    path(
        "lessons/<int:lesson_id>/",
        codex_lesson_detail_view,
        name="codex-lesson-detail",
    ),

    path(
        "lessons/<int:lesson_id>/start/",
        codex_lesson_start_view,
        name="codex-lesson-start",
    ),

    path(
        "lessons/<int:lesson_id>/complete/",
        codex_lesson_complete_view,
        name="codex-lesson-complete",
    ),
]