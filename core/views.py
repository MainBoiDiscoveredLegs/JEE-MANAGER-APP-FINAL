from rest_framework import viewsets, permissions, response, decorators, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
import re
import logging
import traceback
from django.conf import settings


from .models import Chapter, UserChapterProgress, CalendarEvent
from .serializers import (
    ChapterSerializer, UserChapterProgressSerializer, CalendarEventSerializer, MeSerializer
)
class UserScopedMixin:
    def get_queryset(self):
        qs = super().get_queryset()
        if isinstance(self, (UserChapterProgressViewSet, CalendarEventViewSet)):
            return qs.filter(user=self.request.user)
        return qs

class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['subject', 'phase']
    ordering_fields = ['serial_number', 'created_date', 'updated_date']
    search_fields = ['name']


    def get_queryset(self):
        qs = super().get_queryset()
        request = self.request
        f_subj = request.query_params.get('filter[subject]')
        f_phase = request.query_params.get('filter[phase]')
        if f_subj:
            qs = qs.filter(subject=f_subj)
        if f_phase:
            try:
                qs = qs.filter(phase=int(f_phase))
            except ValueError:
                pass
        sort = request.query_params.get('sort')
        if sort:
            qs = qs.order_by(sort)
        return qs

class UserChapterProgressViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = UserChapterProgress.objects.select_related('chapter')
    serializer_class = UserChapterProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['chapter']

class CalendarEventViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.select_related('chapter')
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['date', 'chapter']


@decorators.api_view(['GET'])
def me(request):
    return response.Response(MeSerializer(request.user).data)

class RegisterThrottle(AnonRateThrottle):
    scope = 'register'

name_pattern = re.compile(r"^[A-Za-zÀ-ÿ' -]{1,50}$")

def _clean_name(raw: str) -> str:
    cleaned = re.sub(r'\s+', ' ', (raw or '').strip())
    return cleaned

def _valid_name(raw: str) -> bool:
    cleaned = _clean_name(raw)
    return bool(name_pattern.match(cleaned))

def _valid_email(raw: str) -> bool:
    s = (raw or '').strip()
    regex = re.compile(
        r"^(?=.{3,254}$)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$",
        re.IGNORECASE
    )
    return bool(regex.match(s))

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegisterThrottle])
def register(request):
    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''
    first_name_raw = request.data.get('first_name') or ''
    last_name_raw = request.data.get('last_name') or ''
    email_raw = request.data.get('email') or ''

    first_name = _clean_name(first_name_raw)
    last_name = _clean_name(last_name_raw)
    email = (email_raw or '').strip().lower()

    # Validate required fields
    if not username or not password or not first_name or not last_name or not email:
        return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

    if not _valid_name(first_name) or not _valid_name(last_name):
        return Response({'error': 'Names must be 1-50 chars and may contain letters, spaces, hyphens, apostrophes.'}, status=status.HTTP_400_BAD_REQUEST)

    if not _valid_email(email):
        return Response({'error': 'Invalid email address'}, status=status.HTTP_400_BAD_REQUEST)

    # Conflict checks
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_409_CONFLICT)

    if User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_409_CONFLICT)

    try:
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email
        )
    except Exception as exc:
        logger = logging.getLogger(__name__)
        logger.exception("Error creating user during registration")
        detail = str(exc)
        tb = traceback.format_exc()
        logger.debug(tb)
        body = {
            'error': 'Server error while creating account.',
            'detail': detail,
        }
        if getattr(settings, 'DEBUG', False):
            body['traceback'] = tb
        return Response(body, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Generate tokens for immediate session (optional). Make token generation non-fatal.
    refresh = None
    token_error = None
    try:
        refresh = RefreshToken.for_user(user)
    except Exception as exc:
        logger = logging.getLogger(__name__)
        logger.exception("Error generating tokens for new user")
        tb_tok = traceback.format_exc()
        logger.debug(tb_tok)
        token_error = str(exc)
        if getattr(settings, 'DEBUG', False):
            token_error = f"{token_error}\n{tb_tok}"
        # continue without tokens; client will receive a created response but no tokens

    # In a production app: enqueue an email verification with a one-time token (omitted here)
    payload = {
        'user': {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'emailVerified': False,
        },
        'next': '/dashboard',
    'access': str(refresh.access_token) if refresh is not None else None,
    'refresh': str(refresh) if refresh is not None else None,
    }
    if token_error:
        payload['token_error'] = token_error
    return Response(payload, status=status.HTTP_201_CREATED)