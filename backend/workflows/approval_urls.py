from django.urls import path

from workflows.approval_views import (
    ApprovalDecisionView,
    ApprovalListCreateView,
)


urlpatterns = [
    path(
        "approvals/",
        ApprovalListCreateView.as_view(),
        name="approval-list-create",
    ),
    path(
        "approvals/<uuid:pk>/decision/",
        ApprovalDecisionView.as_view(),
        name="approval-decision",
    ),
]
