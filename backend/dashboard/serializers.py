from rest_framework import serializers


class DashboardSummarySerializer(serializers.Serializer):
    users = serializers.JSONField()
    workflows = serializers.JSONField()
    tasks = serializers.JSONField()
    tasks_by_priority = serializers.JSONField()
    approvals = serializers.JSONField()
    notifications = serializers.JSONField()


class TaskStatisticsSerializer(serializers.Serializer):
    by_status = serializers.JSONField()
    by_priority = serializers.JSONField()
    by_workflow = serializers.JSONField()


class WorkflowStatisticsSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    status = serializers.CharField()
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    progress_percentage = serializers.FloatField()


class RecentActivitySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    actor = serializers.CharField(allow_null=True)
    action = serializers.CharField()
    target_type = serializers.CharField()
    target_id = serializers.CharField()
    description = serializers.CharField()
    created_at = serializers.DateTimeField()
