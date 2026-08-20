from django.urls import path

from .views import (
    NotificationListAPIView,
    NotificationUnreadCountAPIView,
    NotificationMarkReadAPIView,
    NotificationMarkAllReadAPIView,
    NotificationDeleteAPIView,
    NotificationPreferenceAPIView,
)


urlpatterns = [
    path(
        "",
        NotificationListAPIView.as_view(),
        name="notification-list",
    ),

    path(
        "unread-count/",
        NotificationUnreadCountAPIView.as_view(),
        name="notification-unread-count",
    ),

    path(
        "preferences/",
        NotificationPreferenceAPIView.as_view(),
        name="notification-preferences",
    ),

    path(
        "<int:notification_id>/read/",
        NotificationMarkReadAPIView.as_view(),
        name="notification-mark-read",
    ),

    path(
        "mark-all-read/",
        NotificationMarkAllReadAPIView.as_view(),
        name="notification-mark-all-read",
    ),

    path(
        "<int:notification_id>/",
        NotificationDeleteAPIView.as_view(),
        name="notification-delete",
    ),
]