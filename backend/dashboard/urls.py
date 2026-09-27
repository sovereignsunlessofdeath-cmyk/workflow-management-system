from django.urls import path

from dashboard.views import (
    DashboardRecentActivityView,
    DashboardSummaryView,
    DashboardTaskStatisticsView,
    DashboardWorkflowStatisticsView,
)


urlpatterns = [
    path(
        "dashboard/",
        DashboardSummaryView.as_view(),
        name="dashboard-summary",
    ),
    path(
        "dashboard/tasks/",
        DashboardTaskStatisticsView.as_view(),
        name="dashboard-task-statistics",
    ),
    path(
        "dashboard/workflows/",
        DashboardWorkflowStatisticsView.as_view(),
        name="dashboard-workflow-statistics",
    ),
    path(
        "dashboard/recent-activity/",
        DashboardRecentActivityView.as_view(),
        name="dashboard-recent-activity",
    ),
]
