from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from notifications.services import notify_workflow_completed

from workflows.models import (
    Task,
    TaskDependency,
    Workflow,
)


def get_blocking_dependencies(task):
    return (
        TaskDependency.objects.filter(
            task=task
        )
        .exclude(
            depends_on__status=Task.Status.COMPLETED
        )
        .select_related(
            "depends_on"
        )
    )


def task_is_blocked(task):
    return get_blocking_dependencies(
        task
    ).exists()


def validate_dependency(
    task,
    depends_on,
):
    if (
        task.pk ==
        depends_on.pk
    ):
        raise ValidationError(
            "A task cannot depend on itself."
        )

    if (
        task.workflow_id !=
        depends_on.workflow_id
    ):
        raise ValidationError(
            "Tasks can only depend on tasks in the same workflow."
        )

    if (
        TaskDependency.objects.filter(
            task=task,
            depends_on=depends_on,
        ).exists()
    ):
        raise ValidationError(
            "This dependency already exists."
        )


@transaction.atomic
def add_dependency(
    task,
    depends_on,
):
    validate_dependency(
        task,
        depends_on,
    )

    return (
        TaskDependency.objects.create(
            task=task,
            depends_on=depends_on,
        )
    )


def calculate_workflow_progress(
    workflow,
):
    tasks = workflow.tasks.all()

    total = tasks.count()

    if total == 0:
        return {
            "total": 0,
            "completed": 0,
            "percentage": 0,
        }

    completed = tasks.filter(
        status=Task.Status.COMPLETED
    ).count()

    return {
        "total": total,
        "completed": completed,
        "percentage": round(
            (
                completed /
                total
            ) *
            100,
            2,
        ),
    }


@transaction.atomic
def complete_task(task):
    if task_is_blocked(
        task
    ):
        blocking_tasks = [
            dependency.depends_on.title
            for dependency in get_blocking_dependencies(
                task
            )
        ]

        raise ValidationError(
            {
                "detail": (
                    "Task cannot be completed because "
                    "dependencies are incomplete."
                ),
                "blocking_tasks":
                    blocking_tasks,
            }
        )

    task.status = (
        Task.Status.COMPLETED
    )

    task.completed_at = (
        timezone.now()
    )

    task.save(
        update_fields=[
            "status",
            "completed_at",
            "updated_at",
        ]
    )

    update_workflow_status(
        task.workflow
    )

    return task


@transaction.atomic
def reopen_task(task):
    """
    Explicitly reopen a completed task.

    Normal task updates must not be used
    to reverse COMPLETED status.
    """

    task = (
        Task.objects
        .select_for_update()
        .select_related(
            "workflow"
        )
        .get(
            pk=task.pk
        )
    )

    if (
        task.status !=
        Task.Status.COMPLETED
    ):
        raise ValidationError(
            {
                "detail": (
                    "Only completed tasks can be reopened."
                )
            }
        )

    if (
        task.workflow.status ==
        Workflow.Status.ARCHIVED
    ):
        raise ValidationError(
            {
                "detail": (
                    "A task in an archived workflow cannot be reopened."
                )
            }
        )

    task.status = (
        Task.Status.IN_PROGRESS
    )

    task.completed_at = None

    task.save(
        update_fields=[
            "status",
            "completed_at",
            "updated_at",
        ]
    )

    workflow = task.workflow

    if (
        workflow.status ==
        Workflow.Status.COMPLETED
    ):
        workflow.status = (
            Workflow.Status.ACTIVE
        )

        workflow.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

    return task


def update_workflow_status(
    workflow,
):
    tasks = workflow.tasks.all()

    if not tasks.exists():
        return

    if not tasks.exclude(
        status=Task.Status.COMPLETED
    ).exists():
        workflow.status = (
            Workflow.Status.COMPLETED
        )

        workflow.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        notify_workflow_completed(
            workflow
        )