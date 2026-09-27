from datetime import date, timedelta

from django.utils import timezone
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User
from workflows.models import Task, Workflow


class WorkflowAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=User.Role.ADMINISTRATOR,
        )

        self.manager = User.objects.create_user(
            email="manager@test.com",
            password="ManagerPass123!",
            first_name="Manager",
            last_name="User",
            role=User.Role.MANAGER,
        )

        self.approver = User.objects.create_user(
            email="approver@test.com",
            password="ApproverPass123!",
            first_name="Approver",
            last_name="User",
            role=User.Role.APPROVER,
        )

        self.staff = User.objects.create_user(
            email="staff@test.com",
            password="StaffPass123!",
            first_name="Staff",
            last_name="User",
            role=User.Role.STAFF,
        )

        self.other_staff = User.objects.create_user(
            email="otherstaff@test.com",
            password="OtherPass123!",
            first_name="Other",
            last_name="Staff",
            role=User.Role.STAFF,
        )

        self.workflow = Workflow.objects.create(
            name="Test Workflow",
            description="Workflow test",
            created_by=self.admin,
            status=Workflow.Status.ACTIVE,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )

        self.task = Task.objects.create(
            workflow=self.workflow,
            title="Assigned Task",
            description="Test task",
            created_by=self.admin,
            assigned_to=self.staff,
            priority=Task.Priority.MEDIUM,
            status=Task.Status.TODO,
            due_date=date.today() + timedelta(days=7),
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    # ------------------------------------------------------------------
    # WORKFLOW TESTS
    # ------------------------------------------------------------------

    def test_admin_can_create_workflow(self):
        self.authenticate(self.admin)

        response = self.client.post(
            "/api/v1/workflows/",
            {
                "name": "Admin Workflow",
                "description": "Created by admin",
                "status": "DRAFT",
                "start_date": str(date.today()),
                "end_date": str(
                    date.today() + timedelta(days=10)
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            str(response.data["created_by"]),
            str(self.admin.id),
        )

    def test_manager_can_create_workflow(self):
        self.authenticate(self.manager)

        response = self.client.post(
            "/api/v1/workflows/",
            {
                "name": "Manager Workflow",
                "description": "Created by manager",
                "status": "DRAFT",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_staff_cannot_create_workflow(self):
        self.authenticate(self.staff)

        response = self.client.post(
            "/api/v1/workflows/",
            {
                "name": "Staff Workflow",
                "description": "Should fail",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_approver_cannot_create_workflow(self):
        self.authenticate(self.approver)

        response = self.client.post(
            "/api/v1/workflows/",
            {
                "name": "Approver Workflow",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_list_workflows(self):
        self.authenticate(self.admin)

        response = self.client.get(
            "/api/v1/workflows/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

    def test_manager_can_update_workflow(self):
        self.authenticate(self.manager)

        response = self.client.patch(
            f"/api/v1/workflows/{self.workflow.id}/",
            {
                "name": "Updated Workflow",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_staff_cannot_update_workflow(self):
        self.authenticate(self.staff)

        response = self.client.patch(
            f"/api/v1/workflows/{self.workflow.id}/",
            {
                "name": "Unauthorized Update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_workflow_delete_archives_instead(self):
        self.authenticate(self.admin)

        response = self.client.delete(
            f"/api/v1/workflows/{self.workflow.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.workflow.refresh_from_db()

        self.assertEqual(
            self.workflow.status,
            Workflow.Status.ARCHIVED,
        )

    def test_workflow_rejects_invalid_date_range(self):
        self.authenticate(self.admin)

        response = self.client.post(
            "/api/v1/workflows/",
            {
                "name": "Invalid Workflow",
                "start_date": "2026-10-20",
                "end_date": "2026-10-10",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # ------------------------------------------------------------------
    # TASK TESTS
    # ------------------------------------------------------------------

    def test_admin_can_create_task(self):
        self.authenticate(self.admin)

        response = self.client.post(
            "/api/v1/tasks/",
            {
                "workflow": str(self.workflow.id),
                "title": "Admin Task",
                "description": "Created by admin",
                "assigned_to": str(self.staff.id),
                "status": "TODO",
                "priority": "HIGH",
                "due_date": str(
                    date.today() + timedelta(days=5)
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["title"],
            "Admin Task",
        )

    def test_manager_can_create_task(self):
        self.authenticate(self.manager)

        response = self.client.post(
            "/api/v1/tasks/",
            {
                "workflow": str(self.workflow.id),
                "title": "Manager Task",
                "assigned_to": str(self.staff.id),
                "priority": "MEDIUM",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_staff_cannot_create_task(self):
        self.authenticate(self.staff)

        response = self.client.post(
            "/api/v1/tasks/",
            {
                "workflow": str(self.workflow.id),
                "title": "Staff Task",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_can_only_see_assigned_tasks(self):
        self.authenticate(self.staff)

        Task.objects.create(
            workflow=self.workflow,
            title="Other Staff Task",
            created_by=self.admin,
            assigned_to=self.other_staff,
        )

        response = self.client.get(
            "/api/v1/tasks/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]["id"],
            str(self.task.id),
        )

    def test_admin_can_see_all_tasks(self):
        self.authenticate(self.admin)

        Task.objects.create(
            workflow=self.workflow,
            title="Other Staff Task",
            created_by=self.admin,
            assigned_to=self.other_staff,
        )

        response = self.client.get(
            "/api/v1/tasks/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            2,
        )

    def test_staff_can_update_only_status(self):
        self.authenticate(self.staff)

        response = self.client.patch(
            f"/api/v1/tasks/{self.task.id}/",
            {
                "status": "IN_PROGRESS",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.IN_PROGRESS,
        )

    def test_staff_cannot_change_task_title(self):
        self.authenticate(self.staff)

        response = self.client.patch(
            f"/api/v1/tasks/{self.task.id}/",
            {
                "title": "Unauthorized Title Change",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_completed_task_gets_completion_timestamp(self):
        self.authenticate(self.staff)

        response = self.client.patch(
            f"/api/v1/tasks/{self.task.id}/",
            {
                "status": "COMPLETED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.COMPLETED,
        )

        self.assertIsNotNone(
            self.task.completed_at
        )

    def test_completed_task_cannot_be_reopened_with_normal_patch(
        self,
    ):
        self.authenticate(self.admin)

        self.task.status = (
            Task.Status.COMPLETED
        )

        self.task.completed_at = (
            timezone.now()
        )

        self.task.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        response = self.client.patch(
            f"/api/v1/tasks/{self.task.id}/",
            {
                "status":
                    Task.Status.IN_PROGRESS,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.COMPLETED,
        )

        self.assertIsNotNone(
            self.task.completed_at
        )

    def test_admin_can_reopen_completed_task(self):
        self.authenticate(self.admin)

        self.task.status = (
            Task.Status.COMPLETED
        )

        self.task.completed_at = (
            timezone.now()
        )

        self.task.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        response = self.client.post(
            f"/api/v1/tasks/{self.task.id}/reopen/",
            {
                "reason":
                    "Task was completed by mistake.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.IN_PROGRESS,
        )

        self.assertIsNone(
            self.task.completed_at
        )

    def test_reopen_requires_reason(self):
        self.authenticate(self.admin)

        self.task.status = (
            Task.Status.COMPLETED
        )

        self.task.completed_at = (
            timezone.now()
        )

        self.task.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        response = self.client.post(
            f"/api/v1/tasks/{self.task.id}/reopen/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.COMPLETED,
        )

        self.assertIsNotNone(
            self.task.completed_at
        )

    def test_manager_cannot_reopen_completed_task(self):
        self.authenticate(self.manager)

        self.task.status = (
            Task.Status.COMPLETED
        )

        self.task.completed_at = (
            timezone.now()
        )

        self.task.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        response = self.client.post(
            f"/api/v1/tasks/{self.task.id}/reopen/",
            {
                "reason":
                    "Needs correction.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.COMPLETED,
        )

    def test_approver_cannot_reopen_completed_task(self):
        self.authenticate(self.approver)

        self.task.status = (
            Task.Status.COMPLETED
        )

        self.task.completed_at = (
            timezone.now()
        )

        self.task.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        response = self.client.post(
            f"/api/v1/tasks/{self.task.id}/reopen/",
            {
                "reason":
                    "Needs correction.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.COMPLETED,
        )

    def test_staff_cannot_reopen_completed_task(self):
        self.authenticate(self.staff)

        self.task.assigned_to = (
            self.staff
        )

        self.task.status = (
            Task.Status.COMPLETED
        )

        self.task.completed_at = (
            timezone.now()
        )

        self.task.save(
            update_fields=[
                "assigned_to",
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        response = self.client.post(
            f"/api/v1/tasks/{self.task.id}/reopen/",
            {
                "reason":
                    "Needs correction.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.COMPLETED,
        )

    def test_approver_can_view_all_tasks(self):
        self.authenticate(self.approver)

        response = self.client.get(
            "/api/v1/tasks/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_staff_cannot_delete_task(self):
        self.authenticate(self.staff)

        response = self.client.delete(
            f"/api/v1/tasks/{self.task.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_can_cancel_task(self):
        self.authenticate(self.manager)

        response = self.client.delete(
            f"/api/v1/tasks/{self.task.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.CANCELLED,
        )

    def test_inactive_user_cannot_be_assigned_task(self):
        inactive_user = (
            User.objects.create_user(
                email="inactive@test.com",
                password="InactivePass123!",
                first_name="Inactive",
                last_name="User",
                role=User.Role.STAFF,
                status=User.Status.INACTIVE,
                is_active=False,
            )
        )

        self.authenticate(self.admin)

        response = self.client.post(
            "/api/v1/tasks/",
            {
                "workflow":
                    str(self.workflow.id),
                "title":
                    "Invalid Assignment",
                "assigned_to":
                    str(inactive_user.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )