from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import User
from audit.services import audit_login, audit_logout, audit_user_created

from apps.authentication.serializers import (
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
)
from apps.authentication.services import AuthenticationService


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        audit_user_created(
            user,
            actor=user,
            request=request,
        )

        return Response(
            {
                "data": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "message": (
                    "Registration successful. "
                    "Please check your email to verify your account."
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            user = AuthenticationService.verify_email(token)
        except ValueError as exc:
            return Response(
                {
                    "error": {
                        "code": "EMAIL_VERIFICATION_FAILED",
                        "message": str(exc),
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "data": {
                    "email": user.email,
                    "verified": True,
                },
                "message": (
                    "Email verified successfully. "
                    "You can now log in."
                ),
            },
            status=status.HTTP_200_OK,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = serializer.validated_data
        user = result["user"]

        audit_login(
            user,
            request=request,
        )

        return Response(
            {
                "data": {
                    "access": result["access"],
                    "refresh": result["refresh"],
                    "user": {
                        "id": str(user.id),
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "full_name": user.full_name,
                        "role": user.role,
                        "status": user.status,
                    },
                },
                "message": "Login successful.",
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response(
            {
                "data": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "full_name": user.full_name,
                    "role": user.role,
                    "status": user.status,
                },
                "message": "User profile retrieved successfully.",
            },
            status=status.HTTP_200_OK,
        )

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthenticationService.request_password_reset(
            serializer.validated_data["email"]
        )

        return Response(
            {
                "data": {},
                "message": (
                    "If an account exists for that email, "
                    "a password reset link has been sent."
                ),
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = AuthenticationService.reset_password(
                token=serializer.validated_data["token"],
                new_password=serializer.validated_data["new_password"],
            )
        except ValueError as exc:
            return Response(
                {
                    "error": {
                        "code": "PASSWORD_RESET_FAILED",
                        "message": str(exc),
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "data": {
                    "email": user.email,
                },
                "message": (
                    "Password reset successful. "
                    "You can now log in."
                ),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {
                    "error": {
                        "code": "REFRESH_TOKEN_REQUIRED",
                        "message": "Refresh token is required.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

        except Exception:
            return Response(
                {
                    "error": {
                        "code": "INVALID_REFRESH_TOKEN",
                        "message": "Invalid or expired refresh token.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        audit_logout(
            request.user,
            request=request,
        )

        return Response(
            {
                "data": {},
                "message": "Logout successful.",
            },
            status=status.HTTP_200_OK,
        )

        from django.shortcuts import get_object_or_404

from apps.authentication.chat_serializers import (
    ConversationSerializer,
    MessageSerializer,
)
from apps.authentication.models import Conversation, Message


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = (
            Conversation.objects
            .filter(participants=request.user)
            .prefetch_related("participants")
            .order_by("-updated_at")
        )

        serializer = ConversationSerializer(
            conversations,
            many=True,
        )

        return Response(
            {
                "data": serializer.data,
                "message": "Conversations retrieved successfully.",
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        participant_ids = request.data.get("participant_ids", [])

        if not isinstance(participant_ids, list):
            return Response(
                {
                    "error": {
                        "code": "INVALID_PARTICIPANTS",
                        "message": "participant_ids must be a list.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        participant_ids = list(set(participant_ids))
        participant_ids.append(str(request.user.id))
        participant_ids = list(set(participant_ids))

        if len(participant_ids) < 2:
            return Response(
                {
                    "error": {
                        "code": "INSUFFICIENT_PARTICIPANTS",
                        "message": "A conversation requires at least two participants.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        users = User.objects.filter(id__in=participant_ids)

        if users.count() != len(participant_ids):
            return Response(
                {
                    "error": {
                        "code": "INVALID_PARTICIPANT",
                        "message": "One or more participants do not exist.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_conversation = None

        for conversation in (
            Conversation.objects
            .filter(participants=request.user)
            .prefetch_related("participants")
        ):
            existing_participant_ids = {
                str(user.id)
                for user in conversation.participants.all()
            }

            if existing_participant_ids == set(participant_ids):
                existing_conversation = conversation
                break

        if existing_conversation:
            serializer = ConversationSerializer(
                existing_conversation,
            )

            return Response(
                {
                    "data": serializer.data,
                    "message": "Conversation already exists.",
                },
                status=status.HTTP_200_OK,
            )

        conversation = Conversation.objects.create()
        conversation.participants.set(users)

        serializer = ConversationSerializer(
            conversation,
        )

        return Response(
            {
                "data": serializer.data,
                "message": "Conversation created successfully.",
            },
            status=status.HTTP_201_CREATED,
        )

class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.prefetch_related("participants"),
            id=conversation_id,
            participants=request.user,
        )

        serializer = ConversationSerializer(conversation)

        return Response(
            {
                "data": serializer.data,
                "message": "Conversation retrieved successfully.",
            },
            status=status.HTTP_200_OK,
        )


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
            participants=request.user,
        )

        messages = (
            Message.objects
            .filter(conversation=conversation)
            .select_related("sender")
            .order_by("created_at")
        )

        serializer = MessageSerializer(
            messages,
            many=True,
        )

        return Response(
            {
                "data": serializer.data,
                "message": "Messages retrieved successfully.",
            },
            status=status.HTTP_200_OK,
        )
