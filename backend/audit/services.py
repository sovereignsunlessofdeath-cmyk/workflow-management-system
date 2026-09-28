from django.utils import timezone

from audit.models import AuditLog


def get_client_ip(request):
    if request is None:
        return None

    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR")


def record_audit(
    *,
    action,
    actor=None,
    target=None,
    target_type=None,
    target_id=None,
    description="",
    before=None,
    after=None,
    metadata=None,
    request=None,
):
    if target is not None:
        target_type = target.__class__.__name__
        target_id = str(target.pk)

    return AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type or "",
        target_id=target_id or "",
        description=description,
        before=before,
        after=after,
        metadata=metadata or {},
        ip_address=get_client_ip(request),
        user_agent=(
            request.META.get("HTTP_USER_AGENT", "")
            if request is not None
            else ""
        ),
    )


def audit_login(user, request=None):
    return record_audit(
        action=AuditLog.Action.LOGIN,
        actor=user,
        target=user,
        description=f"User {user.email} logged in.",
        request=request,
    )


def audit_logout(user, request=None):
    return record_audit(
        action=AuditLog.Action.LOGOUT,
        actor=user,
        target=user,
        description=f"User {user.email} logged out.",
        request=request,
    )


def serialize_user(user):
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "status": user.status,
        "is_active": user.is_active,
    }


def serialize_workflow(workflow):
    return {
        "id": str(workflow.id),
        "name": workflow.name,
        "description": workflow.description,
        "status": workflow.status,
        "start_date": (
            workflow.start_date.isoformat()
            if workflow.start_date
            else None
        ),
        "end_date": (
            workflow.end_date.isoformat()
            if workflow.end_date
            else None
        ),
    }


def serialize_task(task):
    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "workflow_id": str(task.workflow_id),
        "assigned_to_id": (
            str(task.assigned_to_id)
            if task.assigned_to_id
            else None
        ),
        "stage_id": (
            str(task.stage_id)
            if task.stage_id
            else None
        ),
        "due_date": (
            task.due_date.isoformat()
            if task.due_date
            else None
        ),
    }


def audit_user_created(user, actor=None, request=None):
    return record_audit(
        action=AuditLog.Action.USER_CREATED,
        actor=actor,
        target=user,
        description=f"User {user.email} was created.",
        after=serialize_user(user),
        request=request,
    )


def audit_user_updated(
    user,
    actor=None,
    before=None,
    request=None,
):
    return record_audit(
        action=AuditLog.Action.USER_UPDATED,
        actor=actor,
        target=user,
        description=f"User {user.email} was updated.",
        before=before,
        after=serialize_user(user),
        request=request,
    )


def audit_user_deactivated(
    user,
    actor=None,
    before=None,
    request=None,
):
    return record_audit(
        action=AuditLog.Action.USER_DEACTIVATED,
        actor=actor,
        target=user,
        description=f"User {user.email} was deactivated.",
        before=before,
        after=serialize_user(user),
        request=request,
    )


def audit_workflow_created(workflow, actor=None, request=None):
    return record_audit(
        action=AuditLog.Action.WORKFLOW_CREATED,
        actor=actor,
        target=workflow,
        description=f'Workflow "{workflow.name}" was created.',
        after=serialize_workflow(workflow),
        request=request,
    )


def audit_workflow_updated(
    workflow,
    actor=None,
    before=None,
    request=None,
):
    return record_audit(
        action=AuditLog.Action.WORKFLOW_UPDATED,
        actor=actor,
        target=workflow,
        description=f'Workflow "{workflow.name}" was updated.',
        before=before,
        after=serialize_workflow(workflow),
        request=request,
    )


def audit_workflow_archived(
    workflow,
    actor=None,
    before=None,
    request=None,
):
    return record_audit(
        action=AuditLog.Action.WORKFLOW_ARCHIVED,
        actor=actor,
        target=workflow,
        description=f'Workflow "{workflow.name}" was archived.',
        before=before,
        after=serialize_workflow(workflow),
        request=request,
    )


def audit_task_created(task, actor=None, request=None):
    return record_audit(
        action=AuditLog.Action.TASK_CREATED,
        actor=actor,
        target=task,
        description=f'Task "{task.title}" was created.',
        after=serialize_task(task),
        request=request,
    )


def audit_task_updated(
    task,
    actor=None,
    before=None,
    request=None,
):
    return record_audit(
        action=AuditLog.Action.TASK_UPDATED,
        actor=actor,
        target=task,
        description=f'Task "{task.title}" was updated.',
        before=before,
        after=serialize_task(task),
        request=request,
    )


def audit_task_assigned(
    task,
    actor=None,
    before=None,
    request=None,
):
    return record_audit(
        action=AuditLog.Action.TASK_ASSIGNED,
        actor=actor,
        target=task,
        description=f'Task "{task.title}" was assigned.',
        before=before,
        after=serialize_task(task),
        request=request,
    )


def audit_task_completed(task, actor=None, before=None, request=None):
    return record_audit(
        action=AuditLog.Action.TASK_COMPLETED,
        actor=actor,
        target=task,
        description=f'Task "{task.title}" was completed.',
        before=before,
        after=serialize_task(task),
        request=request,
    )


def audit_task_cancelled(task, actor=None, before=None, request=None):
    return record_audit(
        action=AuditLog.Action.TASK_CANCELLED,
        actor=actor,
        target=task,
        description=f'Task "{task.title}" was cancelled.',
        before=before,
        after=serialize_task(task),
        request=request,
    )


def audit_dependency_created(
    task,
    depends_on,
    actor=None,
    request=None,
):
    return record_audit(
        action=AuditLog.Action.DEPENDENCY_CREATED,
        actor=actor,
        target=task,
        description=(
            f'Task "{task.title}" was made dependent on '
            f'"{depends_on.title}".'
        ),
        after={
            "task_id": str(task.id),
            "depends_on_id": str(depends_on.id),
        },
        request=request,
    )


def audit_approval_requested(
    approval,
    actor=None,
    request=None,
):
    return record_audit(
        action=AuditLog.Action.APPROVAL_REQUESTED,
        actor=actor,
        target=approval,
        description=(
            f'Approval was requested for '
            f'task "{approval.task.title}".'
        ),
        after={
            "status": approval.status,
            "task_id": str(approval.task_id),
            "approver_id": str(approval.approver_id),
        },
        request=request,
    )


def audit_approval_decided(
    approval,
    actor=None,
    before=None,
    request=None,
):
    action = (
        AuditLog.Action.APPROVAL_APPROVED
        if approval.status == approval.Status.APPROVED
        else AuditLog.Action.APPROVAL_REJECTED
    )

    return record_audit(
        action=action,
        actor=actor,
        target=approval,
        description=(
            f'Approval for task "{approval.task.title}" '
            f'was {approval.status.lower()}.'
        ),
        before=before,
        after={
            "status": approval.status,
            "comment": approval.comment,
            "decided_at": (
                approval.decided_at.isoformat()
                if approval.decided_at
                else None
            ),
        },
        request=request,
    )

def audit_task_deleted(
    task,
    actor=None,
    before=None,
    request=None,
):
    return record_audit(
        action=AuditLog.Action.TASK_DELETED,
        actor=actor,
        target_type="Task",
        target_id=str(task.id),
        description=(
            f'Task "{task.title}" was permanently deleted.'
        ),
        before=before,
        after=None,
        metadata={
            "operation": "TASK_PERMANENTLY_DELETED",
        },
        request=request,
    )