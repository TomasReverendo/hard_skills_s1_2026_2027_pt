"""
polls/views.py — Camada HTTP da API.

Cada view faz apenas três coisas:
  1. lê o pedido (URL, query string, corpo JSON)
  2. chama uma função de services.py
  3. devolve JSON com o código HTTP certo

Formato das respostas:
  - sucesso: o objeto pedido, ex. {"id": 1, "question": "...", ...}
  - erro:    {"error": "mensagem legível"}

Nota: não usamos o middleware de CSRF porque a API não usa cookies nem sessões
(não há login). O CSRF só é uma ameaça quando o navegador envia credenciais
automaticamente.
"""

import json
from functools import wraps

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from . import services
from .models import Poll
from .serializers import poll_to_dict
from .services import ServiceError


# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------

def handle_errors(view):
    """
    Decorador: se a view lançar ServiceError, devolve {"error": ...}
    com o código HTTP do erro, em vez de rebentar com um 500.
    """
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        try:
            return view(request, *args, **kwargs)
        except ServiceError as e:
            return JsonResponse({"error": e.message}, status=e.status_code)
    return wrapper


def parse_json(request):
    """Lê o corpo do pedido como JSON (tem de ser um objeto {...})."""
    try:
        data = json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        raise ServiceError("O corpo do pedido não é JSON válido.")
    if not isinstance(data, dict):
        raise ServiceError("O corpo do pedido tem de ser um objeto JSON.")
    return data


# ===========================================================================
# API DO PÚBLICO   (/api/polls/...)
# ===========================================================================

@require_http_methods(["GET"])
@handle_errors
def public_poll_list(request):
    """GET /api/polls — votações Abertas e Fechadas."""
    polls = services.list_public_polls()
    return JsonResponse({"polls": [poll_to_dict(p) for p in polls]})


@require_http_methods(["GET"])
@handle_errors
def public_poll_detail(request, poll_id):
    """
    GET /api/polls/<id>?voter_token=...
    Devolve a votação (sem resultados) e se este votante já votou.
    """
    poll = services.get_public_poll_or_404(poll_id)
    data = poll_to_dict(poll)
    data["has_voted"] = services.has_voted(poll, request.GET.get("voter_token"))
    return JsonResponse(data)


@require_http_methods(["POST"])
@handle_errors
def public_vote(request, poll_id):
    """
    POST /api/polls/<id>/votes
    Corpo: {"option_id": 3, "voter_token": "uuid-do-navegador"}
    """
    body = parse_json(request)
    services.cast_vote(poll_id, body.get("option_id"), body.get("voter_token"))
    return JsonResponse({"message": "Obrigado, o teu voto foi registado!"}, status=201)


@require_http_methods(["GET"])
@handle_errors
def public_results(request, poll_id):
    """GET /api/polls/<id>/results — só disponível quando a votação está Fechada."""
    poll = services.get_public_poll_or_404(poll_id)
    if poll.status != Poll.Status.CLOSED:
        # 403 Forbidden: o recurso existe, mas o público ainda não pode vê-lo
        raise ServiceError("Os resultados só ficam visíveis quando a votação fechar.", 403)
    return JsonResponse(services.get_results(poll))


# ===========================================================================
# API DO ANFITRIÃO   (/api/host/polls/...)
# Sem autenticação, como o enunciado permite.
# ===========================================================================

@require_http_methods(["GET", "POST"])
@handle_errors
def host_poll_list(request):
    """
    GET  /api/host/polls — todas as votações (incluindo Rascunhos)
    POST /api/host/polls — cria uma votação
         Corpo: {"question": "...", "options": ["A", "B", ...]}
    """
    if request.method == "POST":
        body = parse_json(request)
        poll = services.create_poll(body.get("question"), body.get("options"))
        return JsonResponse(poll_to_dict(poll), status=201)  # 201 Created

    polls = services.list_all_polls()
    return JsonResponse({"polls": [poll_to_dict(p) for p in polls]})


@require_http_methods(["GET", "PATCH"])
@handle_errors
def host_poll_detail(request, poll_id):
    """
    GET   /api/host/polls/<id> — detalhe de qualquer votação (incluindo Rascunho)
    PATCH /api/host/polls/<id> — muda o estado
          Corpo: {"status": "open"}  ou  {"status": "closed"}
    """
    poll = services.get_poll_or_404(poll_id)
    if request.method == "PATCH":
        body = parse_json(request)
        poll = services.change_status(poll, body.get("status"))
    return JsonResponse(poll_to_dict(poll))


@require_http_methods(["GET"])
@handle_errors
def host_results(request, poll_id):
    """GET /api/host/polls/<id>/results — o anfitrião vê sempre os resultados."""
    poll = services.get_poll_or_404(poll_id)
    return JsonResponse(services.get_results(poll))
