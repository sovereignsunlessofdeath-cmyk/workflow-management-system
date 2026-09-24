from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User


class UserManagementTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@wms.local",
            password="AdminPassword123!",
            first_name="System",
            last_name="Administrator",
            role=User.Role.ADMINISTRATOR,
            status=User.Status.ACTIVE,
            is_active=True,
        )

        self.manager = User.objects.create_user(
            email="manager@wms.local",
            password="ManagerPassword123!",
            first_name="Test",
            last_name="Manager",
            role=User.Role.MANAGER,
            status=User.Status.ACTIVE,
            is_active=True,
        )

        self.staff = User.objects.create_user(
            email="staff@wms.local",
            password="StaffPassword123!",
            first_name="Test",
            last_name="Staff",
            role=User.Role.STAFF,
            status=User.Status.ACTIVE,
            is_active=True,
        )

        self.approver = User.objects.create_user(
            email="approver@wms.local",
            password="ApproverPassword123!",
            first_name="Test",
            last_name="Approver",
            role=User.Role.APPROVER,
            status=User.Status.ACTIVE,
            is_active=True,
        )

        self.user_url = "/api/v1/users/"
        self.detail_url = (
            f"/api/v1/users/{self.staff.id}/"
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_administrator_can_list_users(self):
        self.authenticate(self.admin)

        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            4,
        )

    def test_manager_cannot_list_users(self):
        self.authenticate(self.manager)

        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_cannot_list_users(self):
        self.authenticate(self.staff)

        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_approver_cannot_list_users(self):
        self.authenticate(self.approver)

        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_user_cannot_list_users(self):
        response = self.client.get(self.user_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_administrator_can_create_user(self):
        self.authenticate(self.admin)

        response = self.client.post(
            self.user_url,
            {
                "email": "newuser@wms.local",
                "first_name": "New",
                "last_name": "User",
                "role": User.Role.STAFF,
                "status": User.Status.ACTIVE,
                "password": "NewUserPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            User.objects.filter(
                email="newuser@wms.local"
            ).exists()
        )

    def test_non_admin_cannot_create_user(self):
        self.authenticate(self.manager)

        response = self.client.post(
            self.user_url,
            {
                "email": "blocked@wms.local",
                "first_name": "Blocked",
                "last_name": "User",
                "role": User.Role.STAFF,
                "status": User.Status.ACTIVE,
                "password": "BlockedPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_administrator_can_retrieve_user(self):
        self.authenticate(self.admin)

        response = self.client.get(
            self.detail_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["email"],
            "staff@wms.local",
        )

    def test_administrator_can_update_user(self):
        self.authenticate(self.admin)

        response = self.client.patch(
            self.detail_url,
            {
                "first_name": "Updated",
                "role": User.Role.MANAGER,
                "status": User.Status.ACTIVE,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.staff.refresh_from_db()

        self.assertEqual(
            self.staff.first_name,
            "Updated",
        )

        self.assertEqual(
            self.staff.role,
            User.Role.MANAGER,
        )

    def test_non_admin_cannot_update_user(self):
        self.authenticate(self.manager)

        response = self.client.patch(
            self.detail_url,
            {
                "first_name": "Blocked",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_administrator_deactivates_user_instead_of_deleting(self):
        self.authenticate(self.admin)

        response = self.client.delete(
            self.detail_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.staff.refresh_from_db()

        self.assertFalse(
            self.staff.is_active
        )

        self.assertEqual(
            self.staff.status,
            User.Status.INACTIVE,
        )

        self.assertTrue(
            User.objects.filter(
                id=self.staff.id
            ).exists()
        )

    def test_non_admin_cannot_deactivate_user(self):
        self.authenticate(self.manager)

        response = self.client.delete(
            self.detail_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.staff.refresh_from_db()

        self.assertTrue(
            self.staff.is_active
        )

    def test_duplicate_email_is_rejected(self):
        self.authenticate(self.admin)

        response = self.client.post(
            self.user_url,
            {
                "email": "staff@wms.local",
                "first_name": "Duplicate",
                "last_name": "User",
                "role": User.Role.STAFF,
                "status": User.Status.ACTIVE,
                "password": "DuplicatePassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
