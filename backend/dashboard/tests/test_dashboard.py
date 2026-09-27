from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.users.models import User
from workflows.models import Task, Workflow


class DashboardAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="dashboard-admin@example.com",
            password="StrongPassword123!",
            first_name="Dashboard",
            last_name="Admin",
            role=User.Role.ADMINISTRATOR,
        )

        self.staff = User.objects.create_user(
            email="dashboard-staff@example.com",
            password="StrongPassword123!",
            first_name="Dashboard",
            last_name="Staff",
            role=User.Role.STAFF,
        )

        self.workflow = Workflow.objects.create(
            name="Dashboard Workflow",
            description="Dashboard test workflow",
            created_by=self.admin,
            status=Workflow.Status.ACTIVE,
        )

        self.task = Task.objects.create(
            workflow=self.workflow,
            title="Dashboard Task",
            created_by=self.admin,
            assigned_to=self.staff,
            status=Task.Status.IN_PROGRESS,
            priority=Task.Priority.HIGH,
            due_date=timezone.localdate() + timedelta(days=1),
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_admin_summary(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse("dashboard-summary")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["tasks"]["total"], 1)
        self.assertEqual(
            response.data["tasks"]["in_progress"],
            1,
        )
        self.assertEqual(
            response.data["workflows"]["active"],
            1,
        )
        self.assertEqual(
            response.data["users"]["total"],
            2,
        )

    def test_staff_summary_is_scoped(self):
        self.authenticate(self.staff)

        response = self.client.get(
            reverse("dashboard-summary")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["tasks"]["total"], 1)
        self.assertIsNone(
            response.data["users"]["total"]
        )

    def test_task_statistics(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse("dashboard-task-statistics")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["by_status"][0]["count"],
            1,
        )

    def test_workflow_statistics(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse("dashboard-workflow-statistics")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["progress_percentage"],
            0,
        )

    def test_recent_activity(self):
        self.authenticate(self.admin)

        response = self.client.get(
            reverse("dashboard-recent-activity")
        )

        self.assertEqual(response.status_code, 200)

    def test_dashboard_requires_authentication(self):
        response = self.client.get(
            reverse("dashboard-summary")
        )

        self.assertEqual(response.status_code, 401)
