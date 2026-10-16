"""
config/settings.py — Configuração global do projeto Django.

Mantivemos só o essencial: não há contas de utilizador nem templates HTML,
porque o Django aqui serve APENAS uma API JSON. O frontend (React) é outra app.

Valores sensíveis (password da BD, SECRET_KEY) vêm de variáveis de ambiente,
lidas do ficheiro backend/.env (ver .env.example).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Pasta "backend/" (onde está o manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

# Carrega as variáveis do ficheiro .env (se existir) para os.environ
load_dotenv(BASE_DIR / ".env")

# Em produção esta chave tem de ser secreta. Para correr localmente o valor por omissão chega.
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-insecure-key-change-me")

# DEBUG=True mostra erros detalhados. Nunca usar True em produção.
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"

# Nomes pelos quais o Django aceita ser chamado (proteção contra ataques ao cabeçalho Host).
# "backend" é o nome do serviço no docker-compose: dentro do Docker, o proxy do Vite
# chama o Django por http://backend:8000. Sem isto, o Django responde 400 Bad Request.
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "backend"]


# ---------------------------------------------------------------------------
# Apps instaladas
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.contenttypes",  # necessário internamente pelo Django
    "django.contrib.staticfiles",
    "polls",                        # a nossa app: votações, opções e votos
]

# Middleware = "filtros" por onde passa cada pedido HTTP.
# Não usamos sessões nem autenticação, por isso a lista é curta.
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

# Não renderizamos HTML no backend, mas o Django exige esta definição.
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    },
]


# ---------------------------------------------------------------------------
# Base de dados: PostgreSQL
# Os valores por omissão batem certo com o docker-compose.yml na raiz.
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "livepulse"),
        "USER": os.getenv("POSTGRES_USER", "postgres"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "postgres"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5433"),
    }
}


# ---------------------------------------------------------------------------
# Internacionalização
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "pt-pt"
TIME_ZONE = "Europe/Lisbon"
USE_I18N = True
USE_TZ = True  # datas guardadas em UTC na BD, convertidas quando necessário

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Não acrescentar "/" automaticamente aos URLs (evita redirects em pedidos POST da API).
APPEND_SLASH = False
