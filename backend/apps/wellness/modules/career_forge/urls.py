from django.urls import path

from .views import career_forge_info, career_forge_start, career_forge_complete

urlpatterns = [
    path("", career_forge_info, name="career-forge-info"),
    path("start/", career_forge_start, name="career-forge-start"),
    path("complete/", career_forge_complete, name="career-forge-complete"),
]
