from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from notifications.services import (
    mark_all_notifications_read,
    mark_notification_read,
)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
        ).select_related(
            "task",
            "workflow",
            "approval",
        )


class NotificationDetailView(
    generics.RetrieveAPIView
):
    serializer_class = NotificationSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
        ).select_related(
            "task",
            "workflow",
            "approval",
        )


class NotificationReadView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(
                pk=pk,
                recipient=request.user,
            )
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=404,
            )

        mark_notification_read(notification)

        return Response(
            NotificationSerializer(notification).data
        )


class NotificationReadAllView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request):
        count = mark_all_notifications_read(
            request.user
        )

        return Response(
            {
                "detail": "All notifications marked as read.",
                "updated": count,
            }
        )


class NotificationUnreadCountView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).count()

        return Response(
            {
                "unread_count": count,
            }
        )