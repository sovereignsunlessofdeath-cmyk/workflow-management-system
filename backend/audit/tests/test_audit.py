from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User
from audit.models import AuditLog
from audit.services import (
    audit_task_created,
    audit_user_created,
    record_audit,
)
from workflows.models import Task, Workflow


class AuditServiceTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="audit-admin@test.com",
            password="Password123!",
            first_name="Audit",
            last_name="Admin",
            role=User.Role.ADMINISTRATOR,
        )

        self.staff = User.objects.create_user(
            email="audit-staff@test.com",
            password="Password123!",
            first_name="Audit",
            last_name="Staff",
            role=User.Role.STAFF,
        )

        self.workflow = Workflow.objects.create(
            name="Audit Workflow",
            created_by=self.admin,
        )

        self.task = Task.objects.create(
            workflow=self.workflow,
            title="Audit Task",
            created_by=self.admin,
            assigned_to=self.staff,
        )

    def test_record_audit(self):
        log = record_audit(
            action=AuditLog.Action.TASK_UPDATED,
            actor=self.admin,
            target=self.task,
            description="Task updated.",
            before={"status": Task.Status.TODO},
            after={"status": Task.Status.IN_PROGRESS},
            metadata={"source": "test"},
        )

        self.assertEqual(
            log.actor,
            self.admin,
        )

        self.assertEqual(
            log.target_type,
            "Task",
        )

        self.assertEqual(
            log.target_id,
            str(self.task.id),
        )

        self.assertEqual(
            log.before["status"],
            Task.Status.TODO,
        )

    def test_user_created_audit(self):
        log = audit_user_created(
            self.staff,
            actor=self.admin,
        )

        self.assertEqual(
            log.action,
            AuditLog.Action.USER_CREATED,
        )

        self.assertEqual(
            log.after["email"],
            self.staff.email,
        )

    def test_task_created_audit(self):
        log = audit_task_created(
            self.task,
            actor=self.admin,
        )

        self.assertEqual(
            log.action,
            AuditLog.Action.TASK_CREATED,
        )


class AuditAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="api-admin@test.com",
            password="Password123!",
            first_name="API",
            last_name="Admin",
            role=User.Role.ADMINISTRATOR,
        )

        self.staff = User.objects.create_user(
            email="api-staff@test.com",
            password="Password123!",
            first_name="API",
            last_name="Staff",
            role=User.Role.STAFF,
        )

        self.log = AuditLog.objects.create(
            actor=self.admin,
            action=AuditLog.Action.LOGIN,
            target_type="User",
            target_id=str(self.admin.id),
            description="Admin logged in.",
        )

    def test_admin_can_list_audit_logs(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            "/api/v1/audit-logs/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

    def test_admin_can_retrieve_audit_log(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            f"/api/v1/audit-logs/{self.log.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_non_admin_cannot_list_audit_logs(self):
        self.client.force_authenticate(
            user=self.staff
        )

        response = self.client.get(
            "/api/v1/audit-logs/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            0,
        )

    def test_non_admin_cannot_retrieve_audit_log(self):
        self.client.force_authenticate(
            user=self.staff
        )

        response = self.client.get(
            f"/api/v1/audit-logs/{self.log.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_action_filter(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            "/api/v1/audit-logs/?action=LOGIN"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )
