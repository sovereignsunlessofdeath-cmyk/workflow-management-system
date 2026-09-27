from rest_framework import serializers

from audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(
        source="actor.email",
        read_only=True,
    )

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_email",
            "action",
            "target_type",
            "target_id",
            "description",
            "before",
            "after",
            "metadata",
            "ip_address",
            "user_agent",
            "created_at",
        ]
        read_only_fields = fields
