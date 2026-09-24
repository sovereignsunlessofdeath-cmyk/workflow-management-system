from datetime import date

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User
from workflows.models import Approval, Task, Workflow


class ApprovalAPITests(APITestCase):

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

        self.other_approver = User.objects.create_user(
            email="otherapprover@test.com",
            password="OtherApproverPass123!",
            first_name="Other",
            last_name="Approver",
            role=User.Role.APPROVER,
        )

        self.staff = User.objects.create_user(
            email="staff@test.com",
            password="StaffPass123!",
            first_name="Staff",
            last_name="User",
            role=User.Role.STAFF,
        )

        self.workflow = Workflow.objects.create(
            name="Approval Workflow",
            created_by=self.admin,
            status=Workflow.Status.ACTIVE,
        )

        self.task = Task.objects.create(
            workflow=self.workflow,
            title="Task Requiring Approval",
            created_by=self.admin,
            assigned_to=self.staff,
            status=Task.Status.IN_PROGRESS,
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def create_approval(self):
        self.authenticate(self.manager)

        response = self.client.post(
            "/api/v1/approvals/",
            {
                "task": str(self.task.id),
                "approver": str(self.approver.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        return Approval.objects.get(
            task=self.task,
            status=Approval.Status.PENDING,
        )

    def test_manager_can_request_approval(self):
        approval = self.create_approval()

        self.task.refresh_from_db()

        self.assertEqual(
            approval.requested_by_id,
            self.manager.id,
        )
        self.assertEqual(
            self.task.status,
            Task.Status.PENDING_APPROVAL,
        )

    def test_admin_can_request_approval(self):
        self.authenticate(self.admin)

        response = self.client.post(
            "/api/v1/approvals/",
            {
                "task": str(self.task.id),
                "approver": str(self.approver.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_staff_cannot_request_approval(self):
        self.authenticate(self.staff)

        response = self.client.post(
            "/api/v1/approvals/",
            {
                "task": str(self.task.id),
                "approver": str(self.approver.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_only_approver_role_can_be_selected(self):
        self.authenticate(self.manager)

        response = self.client.post(
            "/api/v1/approvals/",
            {
                "task": str(self.task.id),
                "approver": str(self.staff.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_duplicate_pending_approval_is_rejected(self):
        self.create_approval()

        self.authenticate(self.manager)

        response = self.client.post(
            "/api/v1/approvals/",
            {
                "task": str(self.task.id),
                "approver": str(self.approver.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_assigned_approver_can_approve(self):
        approval = self.create_approval()

        self.authenticate(self.approver)

        response = self.client.post(
            f"/api/v1/approvals/{approval.id}/decision/",
            {
                "status": "APPROVED",
                "comment": "Work verified and approved.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        approval.refresh_from_db()
        self.task.refresh_from_db()

        self.assertEqual(
            approval.status,
            Approval.Status.APPROVED,
        )
        self.assertIsNotNone(approval.decided_at)
        self.assertEqual(
            self.task.status,
            Task.Status.COMPLETED,
        )
        self.assertIsNotNone(self.task.completed_at)

    def test_assigned_approver_can_reject(self):
        approval = self.create_approval()

        self.authenticate(self.approver)

        response = self.client.post(
            f"/api/v1/approvals/{approval.id}/decision/",
            {
                "status": "REJECTED",
                "comment": "Please correct the submitted work.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        approval.refresh_from_db()
        self.task.refresh_from_db()

        self.assertEqual(
            approval.status,
            Approval.Status.REJECTED,
        )
        self.assertEqual(
            approval.comment,
            "Please correct the submitted work.",
        )
        self.assertEqual(
            self.task.status,
            Task.Status.IN_PROGRESS,
        )

    def test_rejection_requires_comment(self):
        approval = self.create_approval()

        self.authenticate(self.approver)

        response = self.client.post(
            f"/api/v1/approvals/{approval.id}/decision/",
            {
                "status": "REJECTED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        approval.refresh_from_db()

        self.assertEqual(
            approval.status,
            Approval.Status.PENDING,
        )

    def test_wrong_approver_cannot_decide(self):
        approval = self.create_approval()

        self.authenticate(self.other_approver)

        response = self.client.post(
            f"/api/v1/approvals/{approval.id}/decision/",
            {
                "status": "APPROVED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_cannot_decide(self):
        approval = self.create_approval()

        self.authenticate(self.staff)

        response = self.client.post(
            f"/api/v1/approvals/{approval.id}/decision/",
            {
                "status": "APPROVED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_approval_cannot_be_decided_twice(self):
        approval = self.create_approval()

        self.authenticate(self.approver)

        first = self.client.post(
            f"/api/v1/approvals/{approval.id}/decision/",
            {
                "status": "APPROVED",
            },
            format="json",
        )

        self.assertEqual(
            first.status_code,
            status.HTTP_200_OK,
        )

        second = self.client.post(
            f"/api/v1/approvals/{approval.id}/decision/",
            {
                "status": "REJECTED",
                "comment": "Too late.",
            },
            format="json",
        )

        self.assertEqual(
            second.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_approver_only_sees_assigned_approvals(self):
        approval = self.create_approval()

        other_task = Task.objects.create(
            workflow=self.workflow,
            title="Other Approval Task",
            created_by=self.admin,
            assigned_to=self.staff,
            status=Task.Status.IN_PROGRESS,
        )

        Approval.objects.create(
            task=other_task,
            requested_by=self.admin,
            approver=self.other_approver,
        )

        self.authenticate(self.approver)

        response = self.client.get(
            "/api/v1/approvals/"
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
            str(response.data[0]["id"]),
            str(approval.id),
        )
