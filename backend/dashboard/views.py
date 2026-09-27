from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import AuditLog
from dashboard.serializers import (
    DashboardSummarySerializer,
    RecentActivitySerializer,
    TaskStatisticsSerializer,
    WorkflowStatisticsSerializer,
)
from dashboard.services import (
    build_summary,
    get_recent_activity,
    get_task_statistics,
    get_workflow_statistics,
)


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = build_summary(request.user)

        return Response(
            DashboardSummarySerializer(data).data
        )


class DashboardTaskStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_task_statistics(request.user)

        return Response(
            TaskStatisticsSerializer(data).data
        )


class DashboardWorkflowStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_workflow_statistics(request.user)

        return Response(
            WorkflowStatisticsSerializer(
                data,
                many=True,
            ).data
        )


class DashboardRecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = int(
                request.query_params.get(
                    "limit",
                    20,
                )
            )
        except ValueError:
            limit = 20

        limit = max(1, min(limit, 100))

        logs = get_recent_activity(
            request.user,
            limit=limit,
        )

        data = [
            {
                "id": log.id,
                "actor": (
                    log.actor.email
                    if log.actor
                    else None
                ),
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "description": log.description,
                "created_at": log.created_at,
            }
            for log in logs
        ]

        return Response(
            RecentActivitySerializer(
                data,
                many=True,
            ).data
        )
