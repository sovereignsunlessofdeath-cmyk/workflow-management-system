import uuid

from django.conf import settings
from django.db import models


class Workflow(models.Model):

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        ARCHIVED = "ARCHIVED", "Archived"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    name = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_workflows",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    start_date = models.DateField(
        null=True,
        blank=True,
    )

    end_date = models.DateField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "workflows"
        ordering = [
            "-created_at"
        ]

    def __str__(self):
        return self.name


class WorkflowStage(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="stages",
    )

    name = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    order = models.PositiveIntegerField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "workflow_stages"

        ordering = [
            "order"
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "workflow",
                    "order",
                ],
                name=(
                    "unique_workflow_stage_order"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.workflow.name} - "
            f"{self.name}"
        )


class Task(models.Model):

    class Status(models.TextChoices):
        TODO = (
            "TODO",
            "To Do",
        )

        IN_PROGRESS = (
            "IN_PROGRESS",
            "In Progress",
        )

        DONE = (
            "DONE",
            "Done",
        )

        PENDING_APPROVAL = (
            "PENDING_APPROVAL",
            "Pending Approval",
        )

        COMPLETED = (
            "COMPLETED",
            "Completed",
        )

        CANCELLED = (
            "CANCELLED",
            "Cancelled",
        )

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="tasks",
    )

    stage = models.ForeignKey(
        WorkflowStage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )

    title = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_tasks",
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
    )

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    due_date = models.DateField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "tasks"

        ordering = [
            "due_date",
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "workflow",
                    "status",
                ]
            ),
            models.Index(
                fields=[
                    "assigned_to",
                    "status",
                ]
            ),
            models.Index(
                fields=[
                    "due_date"
                ]
            ),
        ]

    def __str__(self):
        return self.title


class TaskDependency(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="dependencies",
    )

    depends_on = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="dependent_tasks",
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = (
            "task_dependencies"
        )

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "task",
                    "depends_on",
                ],
                name=(
                    "unique_task_dependency"
                ),
            ),
        ]

    def __str__(self):
        return (
            f"{self.task.title} depends on "
            f"{self.depends_on.title}"
        )


class Approval(models.Model):

    class Status(models.TextChoices):
        PENDING = (
            "PENDING",
            "Pending",
        )

        APPROVED = (
            "APPROVED",
            "Approved",
        )

        REJECTED = (
            "REJECTED",
            "Rejected",
        )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="approvals",
    )

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="requested_approvals",
    )

    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assigned_approvals",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    comment = models.TextField(
        blank=True
    )

    requested_at = models.DateTimeField(
        auto_now_add=True
    )

    decided_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "task_approvals"

        ordering = [
            "-requested_at"
        ]

        indexes = [
            models.Index(
                fields=[
                    "task",
                    "status",
                ]
            ),
            models.Index(
                fields=[
                    "approver",
                    "status",
                ]
            ),
        ]

    def __str__(self):
        return (
            f"{self.task.title} - "
            f"{self.status}"
        )