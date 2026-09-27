from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User
from notifications.models import Notification
from notifications.services import (
    notify_task_assigned,
    notify_task_approaching_due,
    notify_task_completed,
    notify_task_overdue,
    notify_task_status_changed,
)
from workflows.models import Task, Workflow


class NotificationServiceTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="Password123!",
            first_name="Admin",
            last_name="User",
            role=User.Role.ADMINISTRATOR,
        )

        self.staff = User.objects.create_user(
            email="staff@test.com",
            password="Password123!",
            first_name="Staff",
            last_name="User",
            role=User.Role.STAFF,
        )

        self.workflow = Workflow.objects.create(
            name="Notification Workflow",
            created_by=self.admin,
        )

        self.task = Task.objects.create(
            workflow=self.workflow,
            title="Notification Task",
            created_by=self.admin,
            assigned_to=self.staff,
        )

    def test_task_assigned_notification(self):
        notification = notify_task_assigned(self.task)

        self.assertEqual(
            notification.recipient,
            self.staff,
        )

        self.assertEqual(
            notification.notification_type,
            Notification.Type.TASK_ASSIGNED,
        )

    def test_status_changed_notification(self):
        notifications = notify_task_status_changed(
            self.task,
            Task.Status.TODO,
            Task.Status.IN_PROGRESS,
        )

        self.assertEqual(len(notifications), 2)

        self.assertEqual(
            Notification.objects.filter(
                notification_type=(
                    Notification.Type.TASK_STATUS_CHANGED
                )
            ).count(),
            2,
        )

    def test_completed_notification(self):
        notifications = notify_task_completed(
            self.task
        )

        self.assertEqual(len(notifications), 2)

        self.assertEqual(
            Notification.objects.filter(
                notification_type=(
                    Notification.Type.TASK_COMPLETED
                )
            ).count(),
            2,
        )

    def test_approaching_due_notification(self):
        notification = notify_task_approaching_due(
            self.task
        )

        self.assertEqual(
            notification.notification_type,
            Notification.Type.TASK_APPROACHING_DUE,
        )

    def test_overdue_notification(self):
        notification = notify_task_overdue(
            self.task
        )

        self.assertEqual(
            notification.notification_type,
            Notification.Type.TASK_OVERDUE,
        )


class NotificationAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="user@test.com",
            password="Password123!",
            first_name="Test",
            last_name="User",
            role=User.Role.STAFF,
        )

        self.other_user = User.objects.create_user(
            email="other@test.com",
            password="Password123!",
            first_name="Other",
            last_name="User",
            role=User.Role.STAFF,
        )

        self.notification = Notification.objects.create(
            recipient=self.user,
            notification_type=(
                Notification.Type.TASK_ASSIGNED
            ),
            title="Task Assigned",
            message="You have a new task.",
        )

        Notification.objects.create(
            recipient=self.other_user,
            notification_type=(
                Notification.Type.TASK_ASSIGNED
            ),
            title="Private",
            message="Private notification.",
        )

        self.client.force_authenticate(
            user=self.user
        )

    def test_list_only_returns_own_notifications(self):
        response = self.client.get(
            "/api/v1/notifications/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

    def test_notification_detail_only_returns_own(self):
        response = self.client.get(
            f"/api/v1/notifications/{self.notification.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_other_user_notification_is_not_accessible(self):
        other_notification = Notification.objects.filter(
            recipient=self.other_user
        ).first()

        response = self.client.get(
            f"/api/v1/notifications/{other_notification.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_mark_notification_read(self):
        response = self.client.post(
            f"/api/v1/notifications/{self.notification.id}/read/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.notification.refresh_from_db()

        self.assertTrue(
            self.notification.is_read
        )

        self.assertIsNotNone(
            self.notification.read_at
        )

    def test_read_all(self):
        Notification.objects.create(
            recipient=self.user,
            notification_type=(
                Notification.Type.TASK_COMPLETED
            ),
            title="Completed",
            message="Task completed.",
        )

        response = self.client.post(
            "/api/v1/notifications/read-all/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            Notification.objects.filter(
                recipient=self.user,
                is_read=False,
            ).count(),
            0,
        )

    def test_unread_count(self):
        response = self.client.get(
            "/api/v1/notifications/unread-count/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["unread_count"],
            1,
        )
