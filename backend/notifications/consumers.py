import json

from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope.get("user", AnonymousUser())

        if not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user = user
        self.group_name = f"notifications_user_{user.id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )

        await self.accept()

        await self.send(
            text_data=json.dumps(
                {
                    "type": "connection",
                    "message": "Notification WebSocket connected successfully.",
                    "user_id": str(user.id),
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

        if data.get("type") == "ping":
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "pong",
                    }
                )
            )
            return

        await self.send_error("Unknown message type.")

    async def notification_created(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "notification",
                    "notification": event["notification"],
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
