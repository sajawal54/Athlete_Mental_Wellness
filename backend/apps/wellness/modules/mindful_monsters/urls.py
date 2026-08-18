from django.urls import path

from .views import (
    mindful_monsters_intro,
    mindful_monsters_start,
    mindful_monsters_update,
    mindful_monsters_complete,
)


urlpatterns = [

    path(
        "",
        mindful_monsters_intro,
        name="mindful-monsters-intro",
    ),

    path(
        "start/",
        mindful_monsters_start,
        name="mindful-monsters-start",
    ),

    path(
        "session/<int:session_id>/",
        mindful_monsters_update,
        name="mindful-monsters-update",
    ),

    path(
        "session/<int:session_id>/complete/",
        mindful_monsters_complete,
        name="mindful-monsters-complete",
    ),
]