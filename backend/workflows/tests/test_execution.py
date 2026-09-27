from django.urls import reverse
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase

from apps.users.models import User
from workflows.execution_services import (
    add_dependency,
    calculate_workflow_progress,
    complete_task,
    get_blocking_dependencies,
    task_is_blocked,
)
from workflows.models import (
    Task,
    TaskDependency,
    Workflow,
    WorkflowStage,
)


class ExecutionDependencyServiceTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="StrongPassword123!",
            first_name="Admin",
            last_name="User",
            role=User.Role.ADMINISTRATOR,
        )

        self.manager = User.objects.create_user(
            email="manager@example.com",
            password="StrongPassword123!",
            first_name="Manager",
            last_name="User",
            role=User.Role.MANAGER,
        )

        self.staff = User.objects.create_user(
            email="staff@example.com",
            password="StrongPassword123!",
            first_name="Staff",
            last_name="User",
            role=User.Role.STAFF,
        )

        self.workflow = Workflow.objects.create(
            name="Execution Test Workflow",
            description="Workflow for execution tests.",
            created_by=self.admin,
        )

        self.workflow_two = Workflow.objects.create(
            name="Second Workflow",
            description="Second workflow for dependency isolation.",
            created_by=self.admin,
        )

        self.task_one = Task.objects.create(
            workflow=self.workflow,
            title="Task One",
            description="First task.",
            created_by=self.admin,
            assigned_to=self.staff,
        )

        self.task_two = Task.objects.create(
            workflow=self.workflow,
            title="Task Two",
            description="Second task.",
            created_by=self.admin,
            assigned_to=self.staff,
        )

        self.other_workflow_task = Task.objects.create(
            workflow=self.workflow_two,
            title="Other Workflow Task",
            description="Task in another workflow.",
            created_by=self.admin,
            assigned_to=self.staff,
        )


    def test_add_dependency(self):
        dependency = add_dependency(
            self.task_two,
            self.task_one,
        )

        self.assertEqual(
            dependency.task,
            self.task_two,
        )

        self.assertEqual(
            dependency.depends_on,
            self.task_one,
        )

        self.assertTrue(
            TaskDependency.objects.filter(
                task=self.task_two,
                depends_on=self.task_one,
            ).exists()
        )


    def test_self_dependency_rejected(self):
        with self.assertRaises(ValidationError):
            add_dependency(
                self.task_one,
                self.task_one,
            )


    def test_cross_workflow_dependency_rejected(self):
        with self.assertRaises(ValidationError):
            add_dependency(
                self.task_one,
                self.other_workflow_task,
            )


    def test_duplicate_dependency_rejected(self):
        add_dependency(
            self.task_two,
            self.task_one,
        )

        with self.assertRaises(ValidationError):
            add_dependency(
                self.task_two,
                self.task_one,
            )


    def test_task_is_blocked_when_dependency_is_incomplete(self):
        add_dependency(
            self.task_two,
            self.task_one,
        )

        self.assertTrue(
            task_is_blocked(self.task_two)
        )

        self.assertEqual(
            get_blocking_dependencies(
                self.task_two
            ).count(),
            1,
        )


    def test_completed_dependency_unblocks_task(self):
        add_dependency(
            self.task_two,
            self.task_one,
        )

        self.task_one.status = Task.Status.COMPLETED
        self.task_one.save(
            update_fields=["status"]
        )

        self.assertFalse(
            task_is_blocked(self.task_two)
        )

        self.assertEqual(
            get_blocking_dependencies(
                self.task_two
            ).count(),
            0,
        )


    def test_blocked_task_cannot_be_completed(self):
        add_dependency(
            self.task_two,
            self.task_one,
        )

        with self.assertRaises(ValidationError):
            complete_task(self.task_two)

        self.task_two.refresh_from_db()

        self.assertNotEqual(
            self.task_two.status,
            Task.Status.COMPLETED,
        )

        self.assertIsNone(
            self.task_two.completed_at
        )


    def test_unblocked_task_can_be_completed(self):
        add_dependency(
            self.task_two,
            self.task_one,
        )

        self.task_one.status = Task.Status.COMPLETED
        self.task_one.save(
            update_fields=["status"]
        )

        complete_task(self.task_two)

        self.task_two.refresh_from_db()

        self.assertEqual(
            self.task_two.status,
            Task.Status.COMPLETED,
        )

        self.assertIsNotNone(
            self.task_two.completed_at
        )


    def test_workflow_progress(self):
        Task.objects.create(
            workflow=self.workflow,
            title="Task Three",
            description="Third task.",
            created_by=self.admin,
            assigned_to=self.staff,
        )

        self.task_one.status = Task.Status.COMPLETED
        self.task_one.save(
            update_fields=["status"]
        )

        progress = calculate_workflow_progress(
            self.workflow
        )

        self.assertEqual(
            progress["total"],
            3,
        )

        self.assertEqual(
            progress["completed"],
            1,
        )

        self.assertEqual(
            progress["percentage"],
            33.33,
        )


    def test_empty_workflow_progress(self):
        empty_workflow = Workflow.objects.create(
            name="Empty Workflow",
            description="No tasks.",
            created_by=self.admin,
        )

        progress = calculate_workflow_progress(
            empty_workflow
        )

        self.assertEqual(
            progress,
            {
                "total": 0,
                "completed": 0,
                "percentage": 0,
            },
        )


    def test_workflow_auto_completes_when_all_tasks_complete(self):
        complete_task(self.task_one)
        complete_task(self.task_two)

        self.workflow.refresh_from_db()

        self.assertEqual(
            self.workflow.status,
            Workflow.Status.COMPLETED,
        )


class ExecutionDependencyAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="apiadmin@example.com",
            password="StrongPassword123!",
            first_name="API",
            last_name="Admin",
            role=User.Role.ADMINISTRATOR,
        )

        self.manager = User.objects.create_user(
            email="apimanager@example.com",
            password="StrongPassword123!",
            first_name="API",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        self.staff = User.objects.create_user(
            email="apistaff@example.com",
            password="StrongPassword123!",
            first_name="API",
            last_name="Staff",
            role=User.Role.STAFF,
        )

        self.workflow = Workflow.objects.create(
            name="API Workflow",
            description="API execution workflow.",
            created_by=self.admin,
        )

        self.task_one = Task.objects.create(
            workflow=self.workflow,
            title="API Task One",
            description="First API task.",
            created_by=self.admin,
            assigned_to=self.staff,
        )

        self.task_two = Task.objects.create(
            workflow=self.workflow,
            title="API Task Two",
            description="Second API task.",
            created_by=self.admin,
            assigned_to=self.staff,
        )


    def test_admin_can_create_stage(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.post(
            "/api/v1/workflow-stages/",
            {
                "workflow": str(self.workflow.id),
                "name": "Planning",
                "description": "Planning stage.",
                "order": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )


    def test_manager_can_create_stage(self):
        self.client.force_authenticate(
            user=self.manager
        )

        response = self.client.post(
            "/api/v1/workflow-stages/",
            {
                "workflow": str(self.workflow.id),
                "name": "Execution",
                "description": "Execution stage.",
                "order": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )


    def test_staff_cannot_create_stage(self):
        self.client.force_authenticate(
            user=self.staff
        )

        response = self.client.post(
            "/api/v1/workflow-stages/",
            {
                "workflow": str(self.workflow.id),
                "name": "Restricted",
                "description": "Restricted stage.",
                "order": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )


    def test_duplicate_stage_order_rejected(self):
        self.client.force_authenticate(
            user=self.admin
        )

        payload = {
            "workflow": str(self.workflow.id),
            "name": "Stage One",
            "description": "First stage.",
            "order": 1,
        }

        first = self.client.post(
            "/api/v1/workflow-stages/",
            payload,
            format="json",
        )

        self.assertEqual(
            first.status_code,
            201,
        )

        second = self.client.post(
            "/api/v1/workflow-stages/",
            {
                **payload,
                "name": "Duplicate Stage",
            },
            format="json",
        )

        self.assertEqual(
            second.status_code,
            400,
        )


    def test_admin_can_create_dependency(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.post(
            "/api/v1/task-dependencies/",
            {
                "task": str(self.task_two.id),
                "depends_on": str(self.task_one.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )


    def test_manager_can_create_dependency(self):
        self.client.force_authenticate(
            user=self.manager
        )

        response = self.client.post(
            "/api/v1/task-dependencies/",
            {
                "task": str(self.task_two.id),
                "depends_on": str(self.task_one.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )


    def test_staff_cannot_create_dependency(self):
        self.client.force_authenticate(
            user=self.staff
        )

        response = self.client.post(
            "/api/v1/task-dependencies/",
            {
                "task": str(self.task_two.id),
                "depends_on": str(self.task_one.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )


    def test_self_dependency_rejected_by_api(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.post(
            "/api/v1/task-dependencies/",
            {
                "task": str(self.task_one.id),
                "depends_on": str(self.task_one.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )


    def test_duplicate_dependency_rejected_by_api(self):
        self.client.force_authenticate(
            user=self.admin
        )

        payload = {
            "task": str(self.task_two.id),
            "depends_on": str(self.task_one.id),
        }

        first = self.client.post(
            "/api/v1/task-dependencies/",
            payload,
            format="json",
        )

        self.assertEqual(
            first.status_code,
            201,
        )

        second = self.client.post(
            "/api/v1/task-dependencies/",
            payload,
            format="json",
        )

        self.assertEqual(
            second.status_code,
            400,
        )