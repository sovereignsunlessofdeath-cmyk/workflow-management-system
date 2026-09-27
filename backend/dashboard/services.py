from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from apps.users.models import User
from audit.models import AuditLog
from notifications.models import Notification
from workflows.models import Approval, Task, Workflow


def get_dashboard_queryset(user):
    if user.role in [
        user.Role.ADMINISTRATOR,
        user.Role.MANAGER,
        user.Role.APPROVER,
    ]:
        return {
            "tasks": Task.objects.all(),
            "workflows": Workflow.objects.all(),
            "approvals": Approval.objects.all(),
            "notifications": Notification.objects.filter(
                recipient=user
            ),
        }

    return {
        "tasks": Task.objects.filter(assigned_to=user),
        "workflows": Workflow.objects.filter(
            tasks__assigned_to=user
        ).distinct(),
        "approvals": Approval.objects.filter(
            approver=user
        ),
        "notifications": Notification.objects.filter(
            recipient=user
        ),
    }


def build_summary(user):
    querysets = get_dashboard_queryset(user)

    tasks = querysets["tasks"]
    workflows = querysets["workflows"]
    approvals = querysets["approvals"]
    notifications = querysets["notifications"]

    today = timezone.localdate()
    soon = today + timedelta(days=3)

    return {
        "users": {
            "total": (
                User.objects.count()
                if user.role == user.Role.ADMINISTRATOR
                else None
            ),
            "active": (
                User.objects.filter(
                    is_active=True
                ).count()
                if user.role == user.Role.ADMINISTRATOR
                else None
            ),
            "by_role": (
                list(
                    User.objects.values(
                        "role"
                    ).annotate(
                        count=Count("id")
                    ).order_by("role")
                )
                if user.role == user.Role.ADMINISTRATOR
                else []
            ),
        },
        "workflows": {
            "total": workflows.count(),
            "draft": workflows.filter(
                status=Workflow.Status.DRAFT
            ).count(),
            "active": workflows.filter(
                status=Workflow.Status.ACTIVE
            ).count(),
            "completed": workflows.filter(
                status=Workflow.Status.COMPLETED
            ).count(),
            "archived": workflows.filter(
                status=Workflow.Status.ARCHIVED
            ).count(),
        },
        "tasks": {
            "total": tasks.count(),
            "todo": tasks.filter(
                status=Task.Status.TODO
            ).count(),
            "in_progress": tasks.filter(
                status=Task.Status.IN_PROGRESS
            ).count(),
            "pending_approval": tasks.filter(
                status=Task.Status.PENDING_APPROVAL
            ).count(),
            "completed": tasks.filter(
                status=Task.Status.COMPLETED
            ).count(),
            "cancelled": tasks.filter(
                status=Task.Status.CANCELLED
            ).count(),
            "overdue": tasks.filter(
                due_date__lt=today
            ).exclude(
                status__in=[
                    Task.Status.COMPLETED,
                    Task.Status.CANCELLED,
                ]
            ).count(),
            "due_soon": tasks.filter(
                due_date__gte=today,
                due_date__lte=soon,
            ).exclude(
                status__in=[
                    Task.Status.COMPLETED,
                    Task.Status.CANCELLED,
                ]
            ).count(),
        },
        "tasks_by_priority": list(
            tasks.values(
                "priority"
            ).annotate(
                count=Count("id")
            ).order_by("priority")
        ),
        "approvals": {
            "pending": approvals.filter(
                status=Approval.Status.PENDING
            ).count(),
            "approved": approvals.filter(
                status=Approval.Status.APPROVED
            ).count(),
            "rejected": approvals.filter(
                status=Approval.Status.REJECTED
            ).count(),
        },
        "notifications": {
            "unread": notifications.filter(
                is_read=False
            ).count(),
        },
    }


def get_task_statistics(user):
    tasks = get_dashboard_queryset(user)["tasks"]

    return {
        "by_status": list(
            tasks.values(
                "status"
            ).annotate(
                count=Count("id")
            ).order_by("status")
        ),
        "by_priority": list(
            tasks.values(
                "priority"
            ).annotate(
                count=Count("id")
            ).order_by("priority")
        ),
        "by_workflow": list(
            tasks.values(
                "workflow_id",
                "workflow__name",
            ).annotate(
                count=Count("id")
            ).order_by("workflow__name")
        ),
    }


def get_workflow_statistics(user):
    workflows = get_dashboard_queryset(user)["workflows"]

    results = []

    for workflow in workflows.prefetch_related("tasks"):
        tasks = workflow.tasks.all()
        total = tasks.count()
        completed = tasks.filter(
            status=Task.Status.COMPLETED
        ).count()

        results.append(
            {
                "id": str(workflow.id),
                "name": workflow.name,
                "status": workflow.status,
                "total_tasks": total,
                "completed_tasks": completed,
                "progress_percentage": (
                    round((completed / total) * 100, 2)
                    if total
                    else 0
                ),
            }
        )

    return results


def get_recent_activity(user, limit=20):
    if user.role == user.Role.ADMINISTRATOR:
        logs = AuditLog.objects.select_related(
            "actor"
        ).all()
    elif user.role in [
        user.Role.MANAGER,
        user.Role.APPROVER,
    ]:
        logs = AuditLog.objects.select_related(
            "actor"
        ).all()
    else:
        logs = AuditLog.objects.select_related(
            "actor"
        ).filter(
            actor=user
        )

    return logs[:limit]
