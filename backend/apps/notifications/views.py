from datetime import timedelta

from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Notification,
    NotificationPreference,
)
from .pagination import NotificationPagination
from .serializers import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
)


class NotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Delete read notifications older than 1 day
        one_day_ago = timezone.now() - timedelta(days=1)

        Notification.objects.filter(
            user=request.user,
            is_read=True,
            read_at__lte=one_day_ago,
        ).delete()

        notifications = Notification.objects.filter(
            user=request.user
        ).order_by("-created_at")

        notification_type = request.query_params.get("type")
        unread = request.query_params.get("unread")

        if notification_type and notification_type != "all":
            notifications = notifications.filter(
                notification_type=notification_type
            )

        if unread == "true":
            notifications = notifications.filter(
                is_read=False
            )

        elif unread == "false":
            notifications = notifications.filter(
                is_read=True
            )

        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        paginator = NotificationPagination()

        page = paginator.paginate_queryset(
            notifications,
            request,
            view=self,
        )

        serializer = NotificationSerializer(
            page,
            many=True,
        )

        response = paginator.get_paginated_response(
            serializer.data
        )

        response.data["unread_count"] = unread_count

        return response


class NotificationUnreadCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response(
            {
                "unread_count": unread_count,
            },
            status=status.HTTP_200_OK,
        )


class NotificationMarkReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user,
            )
        except Notification.DoesNotExist:
            return Response(
                {
                    "detail": "Notification not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()

            notification.save(
                update_fields=[
                    "is_read",
                    "read_at",
                ]
            )

        serializer = NotificationSerializer(
            notification
        )

        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response(
            {
                "notification": serializer.data,
                "unread_count": unread_count,
            },
            status=status.HTTP_200_OK,
        )


class NotificationMarkAllReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        now = timezone.now()

        updated_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).update(
            is_read=True,
            read_at=now,
        )

        return Response(
            {
                "message": "All notifications marked as read.",
                "updated_count": updated_count,
                "unread_count": 0,
            },
            status=status.HTTP_200_OK,
        )


class NotificationDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user,
            )
        except Notification.DoesNotExist:
            return Response(
                {
                    "detail": "Notification not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.delete()

        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response(
            {
                "message": "Notification deleted successfully.",
                "unread_count": unread_count,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# NOTIFICATION PREFERENCES
# =========================================================

class NotificationPreferenceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        preferences, _ = (
            NotificationPreference.objects.get_or_create(
                user=request.user
            )
        )

        serializer = NotificationPreferenceSerializer(
            preferences
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        preferences, _ = (
            NotificationPreference.objects.get_or_create(
                user=request.user
            )
        )

        serializer = NotificationPreferenceSerializer(
            preferences,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )