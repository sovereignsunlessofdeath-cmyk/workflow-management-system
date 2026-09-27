from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class WMSJWTAuthentication(JWTAuthentication):

    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        if not user.is_active:
            raise AuthenticationFailed(
                "Your account is inactive.",
                code="user_inactive",
            )

        if user.status != user.Status.ACTIVE:
            raise AuthenticationFailed(
                "Your account is not active.",
                code="user_not_active",
            )

        return user