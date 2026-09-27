from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.models import Notification
from notifications.services import (
    notify_task_approaching_due,
    notify_task_overdue,
)
from workflows.models import Task


class Command(BaseCommand):
    help = "Create approaching-due and overdue task notifications."

    def handle(self, *args, **options):
        today = timezone.localdate()

        approaching_days = 1
        approaching_date = today + timedelta(
            days=approaching_days
        )

        approaching_tasks = Task.objects.select_related(
            "assigned_to",
            "workflow",
        ).filter(
            due_date=approaching_date,
        ).exclude(
            status__in=[
                Task.Status.COMPLETED,
                Task.Status.CANCELLED,
            ]
        ).exclude(
            assigned_to=None,
        )

        overdue_tasks = Task.objects.select_related(
            "assigned_to",
            "workflow",
        ).filter(
            due_date__lt=today,
        ).exclude(
            status__in=[
                Task.Status.COMPLETED,
                Task.Status.CANCELLED,
            ]
        ).exclude(
            assigned_to=None,
        )

        approaching_count = 0
        overdue_count = 0

        for task in approaching_tasks:
            exists = Notification.objects.filter(
                recipient=task.assigned_to,
                task=task,
                notification_type=(
                    Notification.Type.TASK_APPROACHING_DUE
                ),
                created_at__date=today,
            ).exists()

            if not exists:
                notify_task_approaching_due(task)
                approaching_count += 1

        for task in overdue_tasks:
            exists = Notification.objects.filter(
                recipient=task.assigned_to,
                task=task,
                notification_type=(
                    Notification.Type.TASK_OVERDUE
                ),
                created_at__date=today,
            ).exists()

            if not exists:
                notify_task_overdue(task)
                overdue_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Approaching due notifications: "
                f"{approaching_count}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Overdue notifications: "
                f"{overdue_count}"
            )
        )
