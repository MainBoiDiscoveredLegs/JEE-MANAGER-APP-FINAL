from pathlib import Path
from datetime import timedelta
from corsheaders.defaults import default_headers, default_methods

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'dev-secret-key-change-me'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
'django.contrib.admin',
'django.contrib.auth',
'django.contrib.contenttypes',
'django.contrib.sessions',
'django.contrib.messages',
'django.contrib.staticfiles',
# third-party
'rest_framework',
'django_filters',
'corsheaders',
# local
'core',
"app",
]

MIDDLEWARE = [
'corsheaders.middleware.CorsMiddleware',
'django.middleware.security.SecurityMiddleware',
'django.contrib.sessions.middleware.SessionMiddleware',
'django.middleware.common.CommonMiddleware',
'django.middleware.csrf.CsrfViewMiddleware',
'django.contrib.auth.middleware.AuthenticationMiddleware',
'django.contrib.messages.middleware.MessageMiddleware',
'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'server.urls'

TEMPLATES = [
{
'BACKEND': 'django.template.backends.django.DjangoTemplates',
'DIRS': [],
'APP_DIRS': True,
'OPTIONS': {
'context_processors': [
'django.template.context_processors.debug',
'django.template.context_processors.request',
'django.contrib.auth.context_processors.auth',
'django.contrib.messages.context_processors.messages',
],
},
},
]

WSGI_APPLICATION = 'server.wsgi.application'

DATABASES = {
'default': {
'ENGINE': 'django.db.backends.sqlite3',
'NAME': BASE_DIR / 'db.sqlite3',
}
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS (allow Vite dev server)
CORS_ALLOWED_ORIGINS = [
'http://localhost:5173',
'http://127.0.0.1:5173',
'http://localhost:5174',
]

# In dev, allow all origins to simplify local testing (preflight will include proper headers)
CORS_ALLOW_ALL_ORIGINS = True

# Allow credentials for cross-site requests (Axios, cookies if needed)
CORS_ALLOW_CREDENTIALS = True

# Explicitly allow headers/methods commonly sent by Axios and browsers
CORS_ALLOW_HEADERS = list(default_headers) + [
    'authorization',
    'content-type',
]
CORS_ALLOW_METHODS = list(default_methods)

# DRF + JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.SearchFilter',
    ),
    # Throttle rates used by rest_framework.throttling classes (scopes)
    'DEFAULT_THROTTLE_RATES': {
        'register': '10/hour',
    },
}

SIMPLE_JWT = {
'ACCESS_TOKEN_LIFETIME': timedelta(hours=4),
'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
'AUTH_HEADER_TYPES': ('Bearer',),
}