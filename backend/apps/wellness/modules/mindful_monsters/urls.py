from django.urls import path

from .views import (
    mindful_monsters_steps_view,
    mindful_monsters_record_view,
)


urlpatterns = [
    path(
        "steps/",
        mindful_monsters_steps_view,
        name="mindful-monsters-steps",
    ),

    path(
        "record/",
        mindful_monsters_record_view,
        name="mindful-monsters-record",
    ),
]