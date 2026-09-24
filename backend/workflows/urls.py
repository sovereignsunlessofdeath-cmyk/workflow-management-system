from django.urls import include, path

from workflows.approval_views import (
    ApprovalDecisionView,
    ApprovalListCreateView,
)
from workflows.execution_views import (
    TaskDependencyDetailView,
    TaskDependencyListCreateView,
    WorkflowStageDetailView,
    WorkflowStageListCreateView,
)
from workflows.views import (
    TaskDetailView,
    TaskListCreateView,
    WorkflowDetailView,
    WorkflowListCreateView,
)


urlpatterns = [
    path(
        "workflows/",
        WorkflowListCreateView.as_view(),
        name="workflow-list-create",
    ),
    path(
        "workflows/<uuid:pk>/",
        WorkflowDetailView.as_view(),
        name="workflow-detail",
    ),

    path(
        "stages/",
        WorkflowStageListCreateView.as_view(),
        name="stage-list-create",
    ),
    path(
        "stages/<uuid:pk>/",
        WorkflowStageDetailView.as_view(),
        name="stage-detail",
    ),

    path(
        "tasks/",
        TaskListCreateView.as_view(),
        name="task-list-create",
    ),
    path(
        "tasks/<uuid:pk>/",
        TaskDetailView.as_view(),
        name="task-detail",
    ),

    path(
        "dependencies/",
        TaskDependencyListCreateView.as_view(),
        name="dependency-list-create",
    ),
    path(
        "dependencies/<uuid:pk>/",
        TaskDependencyDetailView.as_view(),
        name="dependency-detail",
    ),

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
