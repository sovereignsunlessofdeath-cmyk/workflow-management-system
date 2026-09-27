from rest_framework import serializers

from apps.users.models import User
from workflows.models import (
    Task,
    Workflow,
)


class WorkflowSerializer(
    serializers.ModelSerializer
):
    created_by_name = (
        serializers.CharField(
            source="created_by.full_name",
            read_only=True,
        )
    )

    task_count = (
        serializers.IntegerField(
            source="tasks.count",
            read_only=True,
        )
    )

    class Meta:
        model = Workflow

        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "created_by_name",
            "status",
            "start_date",
            "end_date",
            "task_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_by_name",
            "task_count",
            "created_at",
            "updated_at",
        ]

    def validate(
        self,
        attrs,
    ):
        start_date = attrs.get(
            "start_date",
            getattr(
                self.instance,
                "start_date",
                None,
            ),
        )

        end_date = attrs.get(
            "end_date",
            getattr(
                self.instance,
                "end_date",
                None,
            ),
        )

        if (
            start_date and
            end_date and
            end_date <
            start_date
        ):
            raise serializers.ValidationError(
                "End date cannot be before start date."
            )

        return attrs


class TaskSerializer(
    serializers.ModelSerializer
):
    created_by_name = (
        serializers.CharField(
            source="created_by.full_name",
            read_only=True,
        )
    )

    assigned_to_name = (
        serializers.CharField(
            source="assigned_to.full_name",
            read_only=True,
            allow_null=True,
        )
    )

    class Meta:
        model = Task

        fields = [
            "id",
            "workflow",
            "stage",
            "title",
            "description",
            "created_by",
            "created_by_name",
            "assigned_to",
            "assigned_to_name",
            "status",
            "priority",
            "due_date",
            "completed_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_by_name",
            "assigned_to_name",
            "completed_at",
            "created_at",
            "updated_at",
        ]

    def validate_assigned_to(
        self,
        value,
    ):
        if (
            value and
            value.status !=
            User.Status.ACTIVE
        ):
            raise (
                serializers.ValidationError(
                    "Tasks can only be assigned to active users."
                )
            )

        return value

    def validate(
        self,
        attrs,
    ):
        workflow = attrs.get(
            "workflow",
            getattr(
                self.instance,
                "workflow",
                None,
            ),
        )

        stage = attrs.get(
            "stage",
            getattr(
                self.instance,
                "stage",
                None,
            ),
        )

        if (
            stage and
            workflow and
            stage.workflow_id !=
            workflow.id
        ):
            raise serializers.ValidationError(
                {
                    "stage": (
                        "The selected stage must belong "
                        "to the same workflow."
                    )
                }
            )

        requested_status = attrs.get(
            "status"
        )

        if (
            self.instance and
            self.instance.status ==
            Task.Status.COMPLETED and
            requested_status is not None and
            requested_status !=
            Task.Status.COMPLETED
        ):
            raise serializers.ValidationError(
                {
                    "status": (
                        "Completed tasks are locked. "
                        "Use the Reopen Task action "
                        "if the task was completed by mistake."
                    )
                }
            )

        return attrs