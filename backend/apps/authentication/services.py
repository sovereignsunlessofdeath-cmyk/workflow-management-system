from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.models import (
    EmailVerification,
    PasswordResetToken,
)
from apps.users.models import User


class AuthenticationService:

    @staticmethod
    def user_exists(email):
        return User.objects.filter(
            email__iexact=email
        ).exists()

    @staticmethod
    def register(email, password, first_name, last_name):
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

        send_mail(
            subject="Verify your WMS account",
            message=(
                f"Hello {user.first_name},\n\n"
                "Welcome to WMS.\n\n"
                "Please verify your email address by clicking "
                "the link below:\n\n"
                f"{verification_url}\n\n"
                "This link expires in 24 hours.\n\n"
                "If you did not create this account, you can "
                "ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return user

    @staticmethod
    def request_password_reset(email):
        user = User.objects.filter(
            email__iexact=email
        ).first()

        if user:
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

            send_mail(
                subject="Reset your WMS password",
                message=(
                    f"Hello {user.first_name},\n\n"
                    "We received a request to reset your WMS password.\n\n"
                    "Use the link below to create a new password:\n\n"
                    f"{reset_url}\n\n"
                    "This link expires in "
                    f"{settings.PASSWORD_RESET_TIMEOUT_HOURS} hours.\n\n"
                    "If you did not request a password reset, "
                    "you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

    @staticmethod
    def reset_password(token, new_password):
        try:
            reset_token = PasswordResetToken.objects.select_related(
                "user"
            ).get(token=token)
        except PasswordResetToken.DoesNotExist:
            raise ValueError("Invalid password reset link.")

        if reset_token.used_at is not None:
            raise ValueError(
                "This password reset link has already been used."
            )

        if timezone.now() > reset_token.expires_at:
            raise ValueError(
                "This password reset link has expired."
            )

        user = reset_token.user

        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])

        reset_token.used_at = timezone.now()
        reset_token.save(update_fields=["used_at"])

        return user

    @staticmethod
    def verify_email(token):
        try:
            verification = EmailVerification.objects.select_related(
                "user"
            ).get(token=token)
        except EmailVerification.DoesNotExist:
            raise ValueError("Invalid verification link.")

        if verification.verified_at is not None:
            raise ValueError("This email has already been verified.")

        if timezone.now() > verification.expires_at:
            raise ValueError("This verification link has expired.")

        user = verification.user

        verification.verified_at = timezone.now()
        verification.save(update_fields=["verified_at"])

        user.is_active = True
        user.status = User.Status.ACTIVE
        user.save(update_fields=["is_active", "status", "updated_at"])

        return user

    @staticmethod
    def login(email, password):
        user = User.objects.filter(
            email__iexact=email
        ).first()

        if user and not user.is_active:
            raise ValueError(
                "Please verify your email before logging in."
            )

        user = authenticate(
            username=email,
            password=password,
        )

        if user is None:
            raise ValueError("Invalid email or password.")

        if user.status != User.Status.ACTIVE:
            raise ValueError("Your account is not active.")

        if not user.is_active:
            raise ValueError("Your account is inactive.")

        refresh = RefreshToken.for_user(user)

        return {
            "user": user,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

    @staticmethod
    def logout(refresh_token):
        token = RefreshToken(refresh_token)
        token.blacklist()
