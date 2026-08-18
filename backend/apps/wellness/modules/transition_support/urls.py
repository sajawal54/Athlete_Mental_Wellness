from django.urls import path

from .views import (
    transition_support_info,
    resource_list,
    resource_detail,
    mark_viewed,
    viewed_resources,
)


urlpatterns = [

    path(
        "",
        transition_support_info,
        name="transition-support-info",
    ),

    path(
        "resources/",
        resource_list,
        name="transition-resource-list",
    ),

    path(
        "resources/<int:resource_id>/",
        resource_detail,
        name="transition-resource-detail",
    ),

    path(
        "resources/<int:resource_id>/view/",
        mark_viewed,
        name="transition-resource-view",
    ),

    path(
        "views/",
        viewed_resources,
        name="transition-resource-views",
    ),
]