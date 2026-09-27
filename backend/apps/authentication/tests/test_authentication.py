from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIClient

from apps.authentication.models import (
    EmailVerification,
    PasswordResetToken,
)
from apps.users.models import User


class AuthenticationTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email="testuser@wms.local",
            password="TestPassword123!",
            first_name="Test",
            last_name="User",
            role=User.Role.STAFF,
            status=User.Status.ACTIVE,
            is_active=True,
        )

    def test_login_success(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {
                "email": "testuser@wms.local",
                "password": "TestPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "access",
            response.data["data"],
        )

        self.assertIn(
            "refresh",
            response.data["data"],
        )

    def test_suspended_user_existing_jwt_is_rejected(self):
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)

        self.user.status = User.Status.SUSPENDED
        self.user.save(update_fields=["status", "updated_at"])

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )

        response = self.client.get(
            "/api/v1/auth/me/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )    

    def test_login_wrong_password(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {
                "email": "testuser@wms.local",
                "password": "WrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_forgot_password_existing_user(self):
        response = self.client.post(
            "/api/v1/auth/forgot-password/",
            {
                "email": "testuser@wms.local",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            PasswordResetToken.objects.filter(
                user=self.user
            ).exists()
        )

    def test_forgot_password_nonexistent_user(self):
        response = self.client.post(
            "/api/v1/auth/forgot-password/",
            {
                "email": "nobody@wms.local",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["message"],
            (
                "If an account exists for that email, "
                "a password reset link has been sent."
            ),
        )

    def test_password_reset_success(self):
        self.client.post(
            "/api/v1/auth/forgot-password/",
            {
                "email": "testuser@wms.local",
            },
            format="json",
        )

        reset_token = (
            PasswordResetToken.objects
            .filter(user=self.user)
            .order_by("-created_at")
            .first()
        )

        response = self.client.post(
            "/api/v1/auth/reset-password/",
            {
                "token": str(reset_token.token),
                "new_password": "NewStrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.user.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                "NewStrongPassword123!"
            )
        )

    def test_password_reset_token_cannot_be_reused(self):
        self.client.post(
            "/api/v1/auth/forgot-password/",
            {
                "email": "testuser@wms.local",
            },
            format="json",
        )

        reset_token = (
            PasswordResetToken.objects
            .filter(user=self.user)
            .order_by("-created_at")
            .first()
        )

        self.client.post(
            "/api/v1/auth/reset-password/",
            {
                "token": str(reset_token.token),
                "new_password": "NewStrongPassword123!",
            },
            format="json",
        )

        response = self.client.post(
            "/api/v1/auth/reset-password/",
            {
                "token": str(reset_token.token),
                "new_password": "AnotherStrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            response.data["error"]["message"],
            "This password reset link has already been used.",
        )