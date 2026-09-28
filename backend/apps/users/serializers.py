from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.users.models import User


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "status",
            "is_active",
            "created_at",
            "updated_at",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "role",
            "status",
            "password",
        ]

    def validate_email(self, value):
        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop(
            "password"
        )

        status = validated_data.get(
            "status",
            User.Status.ACTIVE,
        )

        user = User.objects.create_user(
            password=password,
            is_active=(
                status
                == User.Status.ACTIVE
            ),
            **validated_data,
        )

        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "role",
            "status",
        ]

    def validate_email(self, value):
        queryset = (
            User.objects
            .filter(
                email__iexact=value
            )
            .exclude(
                pk=self.instance.pk
            )
        )

        if queryset.exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def update(
        self,
        instance,
        validated_data,
    ):
        status = validated_data.get(
            "status",
            instance.status,
        )

        for field, value in validated_data.items():
            setattr(
                instance,
                field,
                value,
            )

        instance.is_active = (
            status
            == User.Status.ACTIVE
        )

        instance.save()

        return instance