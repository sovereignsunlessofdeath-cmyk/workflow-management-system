from django.urls import path

from audit.views import (
    AuditLogDetailView,
    AuditLogListView,
)


urlpatterns = [
    path(
        "audit-logs/",
        AuditLogListView.as_view(),
        name="audit-log-list",
    ),
    path(
        "audit-logs/<uuid:pk>/",
        AuditLogDetailView.as_view(),
        name="audit-log-detail",
    ),
]
