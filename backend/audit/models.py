import uuid

from django.conf import settings
from django.db import models


class AuditLog(models.Model):

    class Action(models.TextChoices):
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"

        USER_CREATED = "USER_CREATED", "User Created"
        USER_UPDATED = "USER_UPDATED", "User Updated"
        USER_DEACTIVATED = "USER_DEACTIVATED", "User Deactivated"

        WORKFLOW_CREATED = "WORKFLOW_CREATED", "Workflow Created"
        WORKFLOW_UPDATED = "WORKFLOW_UPDATED", "Workflow Updated"
        WORKFLOW_ARCHIVED = "WORKFLOW_ARCHIVED", "Workflow Archived"

        TASK_CREATED = "TASK_CREATED", "Task Created"
        TASK_UPDATED = "TASK_UPDATED", "Task Updated"
        TASK_ASSIGNED = "TASK_ASSIGNED", "Task Assigned"
        TASK_COMPLETED = "TASK_COMPLETED", "Task Completed"
        TASK_CANCELLED = "TASK_CANCELLED", "Task Cancelled"
        TASK_DELETED = "TASK_DELETED", "Task Deleted"

        DEPENDENCY_CREATED = "DEPENDENCY_CREATED", "Dependency Created"

        APPROVAL_REQUESTED = "APPROVAL_REQUESTED", "Approval Requested"
        APPROVAL_APPROVED = "APPROVAL_APPROVED", "Approval Approved"
        APPROVAL_REJECTED = "APPROVAL_REJECTED", "Approval Rejected"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    action = models.CharField(
        max_length=40,
        choices=Action.choices,
    )

    target_type = models.CharField(
        max_length=100,
        blank=True,
    )

    target_id = models.CharField(
        max_length=100,
        blank=True,
    )

    description = models.TextField()

    before = models.JSONField(
        null=True,
        blank=True,
    )

    after = models.JSONField(
        null=True,
        blank=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["actor", "created_at"]),
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.action} - {self.target_type} - {self.target_id}"
