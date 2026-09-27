import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):

    class Type(models.TextChoices):
        TASK_ASSIGNED = "TASK_ASSIGNED", "Task Assigned"
        TASK_STATUS_CHANGED = "TASK_STATUS_CHANGED", "Task Status Changed"
        TASK_COMPLETED = "TASK_COMPLETED", "Task Completed"
        APPROVAL_REQUESTED = "APPROVAL_REQUESTED", "Approval Requested"
        APPROVAL_APPROVED = "APPROVAL_APPROVED", "Approval Approved"
        APPROVAL_REJECTED = "APPROVAL_REJECTED", "Approval Rejected"
        TASK_APPROACHING_DUE = (
            "TASK_APPROACHING_DUE",
            "Task Approaching Due Date",
        )
        TASK_OVERDUE = "TASK_OVERDUE", "Task Overdue"
        WORKFLOW_CREATED = "WORKFLOW_CREATED", "Workflow Created"
        WORKFLOW_COMPLETED = "WORKFLOW_COMPLETED", "Workflow Completed"
        WORKFLOW_ARCHIVED = "WORKFLOW_ARCHIVED", "Workflow Archived"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=40,
        choices=Type.choices,
    )

    title = models.CharField(
        max_length=255,
    )

    message = models.TextField()

    task = models.ForeignKey(
        "workflows.Task",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    workflow = models.ForeignKey(
        "workflows.Workflow",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    approval = models.ForeignKey(
        "workflows.Approval",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    is_read = models.BooleanField(
        default=False,
    )

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["recipient", "is_read"],
            ),
            models.Index(
                fields=["recipient", "created_at"],
            ),
            models.Index(
                fields=["notification_type", "created_at"],
            ),
        ]

    def __str__(self):
        return f"{self.recipient.email} - {self.title}"