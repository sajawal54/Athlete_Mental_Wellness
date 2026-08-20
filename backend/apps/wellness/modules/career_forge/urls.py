from django.urls import path

from .views import (
    career_forge_roadmap_view,
    career_forge_save_view,
)


urlpatterns = [
    path(
        "roadmap/",
        career_forge_roadmap_view,
        name="career-forge-roadmap",
    ),

    path(
        "save/",
        career_forge_save_view,
        name="career-forge-save",
    ),
]