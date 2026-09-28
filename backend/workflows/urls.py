from django.urls import (
    include,
    path,
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
    TaskPermanentDeleteView,
    TaskReopenView,
    WorkflowDetailView,
    WorkflowListCreateView,
)


urlpatterns = [
    # Workflows
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

# Tasks
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
       "tasks/<uuid:pk>/reopen/",
       TaskReopenView.as_view(),
       name="task-reopen",
    ),
    path(
       "tasks/<uuid:pk>/permanent-delete/",
       TaskPermanentDeleteView.as_view(),
       name="task-permanent-delete",
    ),

    # Workflow stages
    path(
        "workflow-stages/",
        WorkflowStageListCreateView.as_view(),
        name="workflow-stage-list-create",
    ),
    path(
        "workflow-stages/<uuid:pk>/",
        WorkflowStageDetailView.as_view(),
        name="workflow-stage-detail",
    ),

    # Task dependencies
    path(
        "task-dependencies/",
        TaskDependencyListCreateView.as_view(),
        name="workflow-task-dependency-list-create",
    ),
    path(
        "task-dependencies/<uuid:pk>/",
        TaskDependencyDetailView.as_view(),
        name="task-dependency-detail",
    ),

    # Approvals
    path(
        "",
        include(
            "workflows.approval_urls"
        ),
    ),
]