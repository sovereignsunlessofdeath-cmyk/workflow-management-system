from django.urls import path

from notifications.views import (
    NotificationDetailView,
    NotificationListView,
    NotificationReadAllView,
    NotificationReadView,
    NotificationUnreadCountView,
)


urlpatterns = [
    path(
        "notifications/",
        NotificationListView.as_view(),
        name="notification-list",
    ),
    path(
        "notifications/unread-count/",
        NotificationUnreadCountView.as_view(),
        name="notification-unread-count",
    ),
    path(
        "notifications/read-all/",
        NotificationReadAllView.as_view(),
        name="notification-read-all",
    ),
    path(
        "notifications/<uuid:pk>/",
        NotificationDetailView.as_view(),
        name="notification-detail",
    ),
    path(
        "notifications/<uuid:pk>/read/",
        NotificationReadView.as_view(),
        name="notification-read",
    ),
]