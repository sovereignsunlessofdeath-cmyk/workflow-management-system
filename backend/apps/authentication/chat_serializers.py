from rest_framework import serializers

from apps.authentication.models import Conversation, Message


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "participants",
            "last_message",
            "created_at",
            "updated_at",
        ]

    def get_participants(self, obj):
        return [
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
            }
            for user in obj.participants.all()
        ]

    def get_last_message(self, obj):
        message = obj.messages.select_related("sender").order_by("-created_at").first()

        if not message:
            return None

        return {
            "id": str(message.id),
            "sender": {
                "id": str(message.sender.id),
                "email": message.sender.email,
                "full_name": message.sender.full_name,
            },
            "message": message.content,
            "created_at": message.created_at.isoformat(),
        }


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    message = serializers.CharField(
        source="content",
        read_only=True,
    )

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "message",
            "created_at",
            "read_at",
        ]

    def get_sender(self, obj):
        return {
            "id": str(obj.sender.id),
            "email": obj.sender.email,
            "full_name": obj.sender.full_name,
        }