import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

from apps.authentication.models import Conversation, Message


class WebSocketConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope.get("user", AnonymousUser())

        if not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user = user
        self.conversation_id = self.scope.get("url_route", {}).get(
            "kwargs", {}
        ).get("conversation_id")

        if not self.conversation_id:
            await self.close(code=4002)
            return

        if not await self.user_in_conversation():
            await self.close(code=4003)
            return

        self.group_name = f"conversation_{self.conversation_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )

        await self.accept()

        await self.send(
            text_data=json.dumps(
                {
                    "type": "connection",
                    "message": "WebSocket connected successfully.",
                    "conversation_id": self.conversation_id,
                    "user": {
                        "id": str(self.user.id),
                        "email": self.user.email,
                        "full_name": self.user.full_name,
                    },
                }
            )
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON.")
            return

        message_type = data.get("type")

        if message_type == "ping":
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "pong",
                    }
                )
            )
            return

        if message_type == "history":
            messages = await self.get_message_history()

            await self.send(
                text_data=json.dumps(
                    {
                        "type": "history",
                        "conversation_id": self.conversation_id,
                        "messages": messages,
                    }
                )
            )
            return

        if message_type == "message":
            content = data.get("message", "").strip()

            if not content:
                await self.send_error("Message cannot be empty.")
                return

            message = await self.save_message(content)

            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat_message",
                    "message": message,
                },
            )
            return

        await self.send_error("Unknown message type.")

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "message",
                    "message": event["message"],
                }
            )
        )

    async def send_error(self, message):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "error",
                    "message": message,
                }
            )
        )

    @database_sync_to_async
    def user_in_conversation(self):
        return Conversation.objects.filter(
            id=self.conversation_id,
            participants=self.user,
        ).exists()

    @database_sync_to_async
    def save_message(self, content):
        message = Message.objects.create(
            conversation_id=self.conversation_id,
            sender=self.user,
            content=content,
        )

        Conversation.objects.filter(
            id=self.conversation_id,
        ).update(
            updated_at=timezone.now(),
        )

        return {
            "id": str(message.id),
            "conversation_id": str(message.conversation_id),
            "sender": {
                "id": str(self.user.id),
                "email": self.user.email,
                "full_name": self.user.full_name,
            },
            "message": message.content,
            "created_at": message.created_at.isoformat(),
        }

    @database_sync_to_async
    def get_message_history(self):
        messages = (
            Message.objects
            .filter(conversation_id=self.conversation_id)
            .select_related("sender")
            .order_by("created_at")
        )

        return [
            {
                "id": str(message.id),
                "conversation_id": str(message.conversation_id),
                "sender": {
                    "id": str(message.sender.id),
                    "email": message.sender.email,
                    "full_name": message.sender.full_name,
                },
                "message": message.content,
                "created_at": message.created_at.isoformat(),
                "read_at": (
                    message.read_at.isoformat()
                    if message.read_at
                    else None
                ),
            }
            for message in messages
        ]
