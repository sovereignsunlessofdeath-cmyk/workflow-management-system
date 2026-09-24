from rest_framework import serializers

from workflows.models import Task, TaskDependency, WorkflowStage


class WorkflowStageSerializer(serializers.ModelSerializer):
    task_count = serializers.IntegerField(
        source="tasks.count",
        read_only=True,
    )

    class Meta:
        model = WorkflowStage
        fields = [
            "id",
            "workflow",
            "name",
            "description",
            "order",
            "task_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "task_count",
        ]

    def validate(self, attrs):
        workflow = attrs.get(
            "workflow",
            getattr(self.instance, "workflow", None),
        )
        order = attrs.get(
            "order",
            getattr(self.instance, "order", None),
        )

        queryset = WorkflowStage.objects.filter(
            workflow=workflow,
            order=order,
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                {
                    "order": "A stage with this order already exists in this workflow."
                }
            )

        return attrs


class TaskDependencySerializer(serializers.ModelSerializer):
    depends_on_title = serializers.CharField(
        source="depends_on.title",
        read_only=True,
    )

    class Meta:
        model = TaskDependency
        fields = [
            "id",
            "task",
            "depends_on",
            "depends_on_title",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "depends_on_title",
        ]

    def validate(self, attrs):
        task = attrs["task"]
        depends_on = attrs["depends_on"]

        if task.id == depends_on.id:
            raise serializers.ValidationError(
                "A task cannot depend on itself."
            )

        if task.workflow_id != depends_on.workflow_id:
            raise serializers.ValidationError(
                "Tasks can only depend on tasks in the same workflow."
            )

        if TaskDependency.objects.filter(
            task=task,
            depends_on=depends_on,
        ).exists():
            raise serializers.ValidationError(
                "This dependency already exists."
            )

        return attrs
