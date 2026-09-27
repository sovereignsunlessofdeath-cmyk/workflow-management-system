from datetime import timedelta

import resend

from django.conf import settings
from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.models import (
    EmailVerification,
    PasswordResetToken,
)
from apps.users.models import User


class AuthenticationService:

    @staticmethod
    def _send_email(
        *,
        to_email: str,
        subject: str,
        html: str,
    ):
        if not settings.RESEND_API_KEY:
            raise ValueError(
                "RESEND_API_KEY is not configured."
            )

        resend.api_key = settings.RESEND_API_KEY

        resend.Emails.send(
            {
                "from": settings.RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html,
            }
        )

@staticmethod
def user_exists(email):
    user = (
        User.objects
        .filter(email__iexact=email)
        .first()
    )

    if not user:
        return False

    if (
        not user.is_active
        and user.status == User.Status.INACTIVE
    ):
        verification = (
            EmailVerification.objects
            .filter(user=user)
            .first()
        )

        if (
            verification
            and verification.verified_at is None
            and timezone.now() > verification.expires_at
        ):
            user.delete()
            return False

    return True

    @staticmethod
    @transaction.atomic
    def register(
        email,
        password,
        first_name,
        last_name,
    ):
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=User.Role.STAFF,
            status=User.Status.INACTIVE,
            is_active=False,
        )

        verification = EmailVerification.objects.create(
            user=user,
            expires_at=timezone.now()
            + timedelta(
                hours=settings.EMAIL_VERIFICATION_TIMEOUT_HOURS
            ),
        )

        verification_url = (
            f"{settings.FRONTEND_URL}/verify-email/"
            f"{verification.token}/"
        )

        AuthenticationService._send_email(
            to_email=user.email,
            subject="Verify your WMS account",
            html=(
                f"<p>Hello {user.first_name},</p>"
                "<p>Welcome to WMS.</p>"
                "<p>Please verify your email address by clicking "
                "the link below:</p>"
                f'<p><a href="{verification_url}">'
                "Verify your account"
                "</a></p>"
                "<p>This link expires in 1 hour.</p>"
                "<p>If you did not create this account, "
                "you can ignore this email.</p>"
            ),
        )

        return user

    @staticmethod
    def request_password_reset(email):
        user = User.objects.filter(
            email__iexact=email
        ).first()

        if not user:
            return

        PasswordResetToken.objects.filter(
            user=user,
            used_at__isnull=True,
        ).update(
            used_at=timezone.now()
        )

        reset_token = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now()
            + timedelta(
                hours=settings.PASSWORD_RESET_TIMEOUT_HOURS
            ),
        )

        reset_url = (
            f"{settings.FRONTEND_URL}/reset-password/"
            f"{reset_token.token}/"
        )

        AuthenticationService._send_email(
            to_email=user.email,
            subject="Reset your WMS password",
            html=(
                f"<p>Hello {user.first_name},</p>"
                "<p>We received a request to reset your "
                "WMS password.</p>"
                "<p>Use the link below to create a new password:</p>"
                f'<p><a href="{reset_url}">'
                "Reset your password"
                "</a></p>"
                "<p>This link expires in "
                f"{settings.PASSWORD_RESET_TIMEOUT_HOURS} hour(s).</p>"
                "<p>If you did not request a password reset, "
                "you can safely ignore this email.</p>"
            ),
        )

    @staticmethod
    def reset_password(
        token,
        new_password,
    ):
        try:
            reset_token = (
                PasswordResetToken.objects
                .select_related("user")
                .get(token=token)
            )
        except PasswordResetToken.DoesNotExist:
            raise ValueError(
                "Invalid password reset link."
            )

        if reset_token.used_at is not None:
            raise ValueError(
                "This password reset link has already been used."
            )

        if timezone.now() > reset_token.expires_at:
            raise ValueError(
                "This password reset link has expired."
            )

        user = reset_token.user

        user.set_password(
            new_password
        )

        user.save(
            update_fields=[
                "password",
                "updated_at",
            ]
        )

        reset_token.used_at = timezone.now()

        reset_token.save(
            update_fields=[
                "used_at",
            ]
        )

        return user

    @staticmethod
    def verify_email(token):
        try:
            verification = (
                EmailVerification.objects
                .select_related("user")
                .get(token=token)
            )
        except EmailVerification.DoesNotExist:
            raise ValueError(
                "Invalid verification link."
            )

        if verification.verified_at is not None:
            raise ValueError(
                "This email has already been verified."
            )

         if timezone.now() > verification.expires_at:
             user = verification.user
             user.delete()

             raise ValueError(
               "This verification link has expired. "
               "Please register again."
            )

        user = verification.user

        verification.verified_at = timezone.now()

        verification.save(
            update_fields=[
                "verified_at",
            ]
        )

        user.is_active = True
        user.status = User.Status.ACTIVE

        user.save(
            update_fields=[
                "is_active",
                "status",
                "updated_at",
            ]
        )

        return user

    @staticmethod
    def login(
        email,
        password,
    ):
        user = User.objects.filter(
            email__iexact=email
        ).first()

        if user and not user.is_active:
            if (
                user.status
                == User.Status.INACTIVE
            ):
                raise ValueError(
                    "Please verify your email before logging in."
                )

            raise ValueError(
                "Your account is inactive."
            )

        user = authenticate(
            username=email,
            password=password,
        )

        if user is None:
            raise ValueError(
                "Invalid email or password."
            )

        if user.status != User.Status.ACTIVE:
            raise ValueError(
                "Your account is not active."
            )

        if not user.is_active:
            raise ValueError(
                "Your account is inactive."
            )

        refresh = RefreshToken.for_user(
            user
        )

        return {
            "user": user,
            "access": str(
                refresh.access_token
            ),
            "refresh": str(
                refresh
            ),
        }

    @staticmethod
    def logout(
        refresh_token,
    ):
        token = RefreshToken(
            refresh_token
        )

        token.blacklist()

        @staticmethod
    @transaction.atomic
    def register_admin(
        email,
        password,
        first_name,
        last_name,
    ):
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=User.Role.ADMINISTRATOR,
            status=User.Status.INACTIVE,
            is_active=False,
        )

        verification = EmailVerification.objects.create(
            user=user,
            expires_at=timezone.now()
            + timedelta(
                hours=settings.EMAIL_VERIFICATION_TIMEOUT_HOURS
            ),
        )

        verification_url = (
            f"{settings.FRONTEND_URL}/verify-email/"
            f"{verification.token}/"
        )

        AuthenticationService._send_email(
            to_email=user.email,
            subject="Verify your WMS administrator account",
            html=(
                f"<p>Hello {user.first_name},</p>"
                "<p>Your WMS administrator account has been created.</p>"
                "<p>Please verify your email address:</p>"
                f'<p><a href="{verification_url}">'
                "Verify administrator account"
                "</a></p>"
                "<p>This link expires in 24 hours.</p>"
            ),
        )

        return user    