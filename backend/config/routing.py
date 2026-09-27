from django.urls import re_path

from apps.authentication.consumers import WebSocketConsumer
from apps.authentication.middleware import JWTAuthMiddlewareStack
from notifications.consumers import NotificationConsumer


websocket_urlpatterns = [
    re_path(
        r"ws/conversations/(?P<conversation_id>[0-9a-f-]+)/$",
        JWTAuthMiddlewareStack(
            WebSocketConsumer.as_asgi()
        ),
    ),
    re_path(
        r"ws/notifications/$",
        JWTAuthMiddlewareStack(
            NotificationConsumer.as_asgi()
        ),
    ),
]
