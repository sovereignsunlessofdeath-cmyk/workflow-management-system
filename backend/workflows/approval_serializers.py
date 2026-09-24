from rest_framework import serializers

from apps.users.models import User
from workflows.models import Approval, Task


class ApprovalSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(
        source="requested_by.full_name",
        read_only=True,
    )
    approver_name = serializers.CharField(
        source="approver.full_name",
        read_only=True,
    )
    task_title = serializers.CharField(
        source="task.title",
        read_only=True,
    )

    class Meta:
        model = Approval
        fields = [
            "id",
            "task",
            "task_title",
            "requested_by",
            "requested_by_name",
            "approver",
            "approver_name",
            "status",
            "comment",
            "requested_at",
            "decided_at",
        ]
        read_only_fields = [
            "id",
            "requested_by",
            "requested_by_name",
            "approver_name",
            "task_title",
            "status",
            "requested_at",
            "decided_at",
        ]

    def validate_approver(self, value):
        if value.role != User.Role.APPROVER:
            raise serializers.ValidationError(
                "Approval must be assigned to an Approver."
            )

        if value.status != User.Status.ACTIVE:
            raise serializers.ValidationError(
                "Approval can only be assigned to an active user."
            )

        return value

    def validate_task(self, value):
        if value.status in [
            Task.Status.COMPLETED,
            Task.Status.CANCELLED,
        ]:
            raise serializers.ValidationError(
                "Completed or cancelled tasks cannot be submitted for approval."
            )

        return value


class ApprovalDecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            Approval.Status.APPROVED,
            Approval.Status.REJECTED,
        ]
    )
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate(self, attrs):
        if (
            attrs["status"] == Approval.Status.REJECTED
            and not attrs.get("comment", "").strip()
        ):
            raise serializers.ValidationError(
                {
                    "comment": "A rejection comment is required."
                }
            )

        return attrs
