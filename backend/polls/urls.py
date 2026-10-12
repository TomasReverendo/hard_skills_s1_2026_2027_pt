"""
polls/urls.py — Mapa de rotas da API (todas com o prefixo /api/).

Público:
  GET    /api/polls                       lista Abertas + Fechadas
  GET    /api/polls/<id>                  detalhe de uma votação
  POST   /api/polls/<id>/votes            submeter voto
  GET    /api/polls/<id>/results          resultados (só se Fechada)

Anfitrião:
  GET    /api/host/polls                  lista todas
  POST   /api/host/polls                  criar votação
  GET    /api/host/polls/<id>             detalhe de uma votação
  PATCH  /api/host/polls/<id>             mudar estado
  GET    /api/host/polls/<id>/results     resultados (sempre)
"""

from django.urls import path

from . import views

urlpatterns = [
    # Público
    path("polls", views.public_poll_list),
    path("polls/<int:poll_id>", views.public_poll_detail),
    path("polls/<int:poll_id>/votes", views.public_vote),
    path("polls/<int:poll_id>/results", views.public_results),
    # Anfitrião
    path("host/polls", views.host_poll_list),
    path("host/polls/<int:poll_id>", views.host_poll_detail),
    path("host/polls/<int:poll_id>/results", views.host_results),
]
