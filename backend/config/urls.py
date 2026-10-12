"""
config/urls.py — Ponto de entrada das rotas.

Todas as rotas da API começam por /api/ e estão definidas em polls/urls.py.
"""

from django.urls import include, path

urlpatterns = [
    path("api/", include("polls.urls")),
]
