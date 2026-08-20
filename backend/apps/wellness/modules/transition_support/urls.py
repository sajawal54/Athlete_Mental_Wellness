from django.urls import path

from .views import (
    transition_resources_view,
    transition_resource_mark_viewed_view
)

urlpatterns = [
    path(
        "resources/",
        transition_resources_view,
        name="transition-support-resources",
    ),

    path(
        "resource/<int:resource_id>/view/",
        transition_resource_mark_viewed_view,
        name="transition-support-view",
    ),
]