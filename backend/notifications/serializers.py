from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "task",
            "workflow",
            "approval",
            "metadata",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "task",
            "workflow",
            "approval",
            "metadata",
            "is_read",
            "read_at",
            "created_at",
        ]