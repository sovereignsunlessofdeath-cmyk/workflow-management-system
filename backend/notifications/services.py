from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from notifications.models import Notification


def _send_realtime_notification(notification):
    channel_layer = get_channel_layer()

    if channel_layer is None:
        return

    group_name = f"notifications_user_{notification.recipient_id}"

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "notification.created",
            "notification": {
                "id": str(notification.id),
                "notification_type": notification.notification_type,
                "title": notification.title,
                "message": notification.message,
                "task_id": (
                    str(notification.task_id)
                    if notification.task_id
                    else None
                ),
                "workflow_id": (
                    str(notification.workflow_id)
                    if notification.workflow_id
                    else None
                ),
                "approval_id": (
                    str(notification.approval_id)
                    if notification.approval_id
                    else None
                ),
                "metadata": notification.metadata,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat(),
            },
        },
    )


@transaction.atomic
def create_notification(
    *,
    recipient,
    notification_type,
    title,
    message,
    task=None,
    workflow=None,
    approval=None,
    metadata=None,
):
    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        task=task,
        workflow=workflow,
        approval=approval,
        metadata=metadata or {},
    )

    transaction.on_commit(
        lambda: _send_realtime_notification(notification)
    )

    return notification


def mark_notification_read(notification):
    if notification.is_read:
        return notification

    notification.is_read = True
    notification.read_at = timezone.now()

    notification.save(
        update_fields=[
            "is_read",
            "read_at",
        ]
    )

    return notification


def mark_all_notifications_read(user):
    return Notification.objects.filter(
        recipient=user,
        is_read=False,
    ).update(
        is_read=True,
        read_at=timezone.now(),
    )


def notify_task_assigned(task):
    if not task.assigned_to:
        return None

    return create_notification(
        recipient=task.assigned_to,
        notification_type=Notification.Type.TASK_ASSIGNED,
        title="Task Assigned",
        message=f'You have been assigned the task "{task.title}".',
        task=task,
        workflow=task.workflow,
        metadata={
            "task_title": task.title,
            "priority": task.priority,
        },
    )


def notify_task_status_changed(
    task,
    old_status,
    new_status,
):
    recipients = set()

    if task.assigned_to_id:
        recipients.add(task.assigned_to_id)

    if task.created_by_id:
        recipients.add(task.created_by_id)

    User = get_user_model()

    users = User.objects.filter(
        id__in=recipients,
    )

    notifications = []

    for user in users:
        notifications.append(
            create_notification(
                recipient=user,
                notification_type=(
                    Notification.Type.TASK_STATUS_CHANGED
                ),
                title="Task Status Changed",
                message=(
                    f'Task "{task.title}" changed from '
                    f"{old_status} to {new_status}."
                ),
                task=task,
                workflow=task.workflow,
                metadata={
                    "old_status": old_status,
                    "new_status": new_status,
                },
            )
        )

    return notifications

def notify_task_ready_for_review(
    task,
):
    User = get_user_model()

    reviewers = (
        User.objects.filter(
            role__in=[
                User.Role.ADMINISTRATOR,
                User.Role.MANAGER,
            ],
            status=User.Status.ACTIVE,
            is_active=True,
        )
        .exclude(
            id=task.assigned_to_id
        )
    )

    notifications = []

    staff_name = (
        task.assigned_to.full_name
        if task.assigned_to
        else "A staff member"
    )

    for reviewer in reviewers:
        notifications.append(
            create_notification(
                recipient=reviewer,
                notification_type=(
                    Notification.Type.TASK_STATUS_CHANGED
                ),
                title=(
                    "Task Ready for Review"
                ),
                message=(
                    f'{staff_name} marked '
                    f'"{task.title}" as done. '
                    "Please review and confirm completion."
                ),
                task=task,
                workflow=task.workflow,
                metadata={
                    "status": "DONE",
                    "operation": (
                        "TASK_READY_FOR_REVIEW"
                    ),
                },
            )
        )

    return notifications

def notify_task_completed(task):
    recipients = set()

    if task.assigned_to_id:
        recipients.add(task.assigned_to_id)

    if task.created_by_id:
        recipients.add(task.created_by_id)

    User = get_user_model()

    users = User.objects.filter(
        id__in=recipients,
    )

    notifications = []

    for user in users:
        notifications.append(
            create_notification(
                recipient=user,
                notification_type=Notification.Type.TASK_COMPLETED,
                title="Task Completed",
                message=f'Task "{task.title}" has been completed.',
                task=task,
                workflow=task.workflow,
            )
        )

    return notifications


def notify_approval_requested(approval):
    return create_notification(
        recipient=approval.approver,
        notification_type=Notification.Type.APPROVAL_REQUESTED,
        title="Approval Requested",
        message=(
            f'Approval is required for task '
            f'"{approval.task.title}".'
        ),
        task=approval.task,
        workflow=approval.task.workflow,
        approval=approval,
    )


def notify_approval_decided(approval):
    notification_type = (
        Notification.Type.APPROVAL_APPROVED
        if approval.status == approval.Status.APPROVED
        else Notification.Type.APPROVAL_REJECTED
    )

    title = (
        "Approval Approved"
        if approval.status == approval.Status.APPROVED
        else "Approval Rejected"
    )

    message = (
        f'Approval for task "{approval.task.title}" '
        f"was {approval.status.lower()}."
    )

    return create_notification(
        recipient=approval.requested_by,
        notification_type=notification_type,
        title=title,
        message=message,
        task=approval.task,
        workflow=approval.task.workflow,
        approval=approval,
        metadata={
            "comment": approval.comment,
        },
    )


def notify_workflow_created(workflow):
    return create_notification(
        recipient=workflow.created_by,
        notification_type=Notification.Type.WORKFLOW_CREATED,
        title="Workflow Created",
        message=f'Workflow "{workflow.name}" has been created.',
        workflow=workflow,
    )


def notify_workflow_completed(workflow):
    return create_notification(
        recipient=workflow.created_by,
        notification_type=Notification.Type.WORKFLOW_COMPLETED,
        title="Workflow Completed",
        message=f'Workflow "{workflow.name}" has been completed.',
        workflow=workflow,
    )


def notify_workflow_archived(workflow):
    return create_notification(
        recipient=workflow.created_by,
        notification_type=Notification.Type.WORKFLOW_ARCHIVED,
        title="Workflow Archived",
        message=f'Workflow "{workflow.name}" has been archived.',
        workflow=workflow,
    )


def notify_task_approaching_due(task):
    if not task.assigned_to:
        return None

    return create_notification(
        recipient=task.assigned_to,
        notification_type=Notification.Type.TASK_APPROACHING_DUE,
        title="Task Due Soon",
        message=(
            f'Task "{task.title}" is approaching its due date '
            f"({task.due_date})."
        ),
        task=task,
        workflow=task.workflow,
        metadata={
            "due_date": str(task.due_date),
        },
    )


def notify_task_overdue(task):
    if not task.assigned_to:
        return None

    return create_notification(
        recipient=task.assigned_to,
        notification_type=Notification.Type.TASK_OVERDUE,
        title="Task Overdue",
        message=(
            f'Task "{task.title}" is overdue '
            f"(due {task.due_date})."
        ),
        task=task,
        workflow=task.workflow,
        metadata={
            "due_date": str(task.due_date),
        },
    )
