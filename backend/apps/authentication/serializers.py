from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.authentication.services import AuthenticationService


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)

    def validate_email(self, value):
        if AuthenticationService.user_exists(value):
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return AuthenticationService.register(**validated_data)

class AdminRegisterSerializer(RegisterSerializer):
    admin_pin = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate_admin_pin(self, value):
        from django.conf import settings

        if not settings.ADMIN_REGISTRATION_PIN:
            raise serializers.ValidationError(
                "Admin registration is not configured."
            )

        if value != settings.ADMIN_REGISTRATION_PIN:
            raise serializers.ValidationError(
                "Invalid administrator registration PIN."
            )

        return value

    def create(self, validated_data):
        validated_data.pop("admin_pin")

        return AuthenticationService.register_admin(
            **validated_data
        )        

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        email = attrs["email"]
        password = attrs["password"]

        try:
            result = AuthenticationService.login(
                email=email,
                password=password,
            )
        except ValueError as exc:
            raise serializers.ValidationError(
                {"detail": str(exc)}
            )

        return {
            "user": result["user"],
            "access": result["access"],
            "refresh": result["refresh"],
        }


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    def validate_new_password(self, value):
        validate_password(value)
        return value