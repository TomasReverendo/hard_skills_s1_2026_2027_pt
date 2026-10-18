"""
Regras de negócio.

Toda a lógica "do domínio" está aqui (validar, mudar estado, votar, contar votos).
As views (views.py) só tratam de HTTP: ler o pedido, chamar uma função daqui e
devolver JSON. Assim cada camada tem uma só responsabilidade e esta parte pode
ser testada sem HTTP.

Quando uma regra é violada, lanço ServiceError com a mensagem e o código HTTP
adequado; a view transforma isso numa resposta {"error": "..."}.
"""

from django.db import transaction
from django.db.models import Count

from .models import Option, Poll, Vote

MIN_OPTIONS = 2
MAX_OPTIONS = 5
MAX_QUESTION_LENGTH = 200
MAX_OPTION_LENGTH = 100

# Transições de estado permitidas: só se avança, nunca se volta atrás.
#   Rascunho -> Aberta -> Fechada
ALLOWED_TRANSITIONS = {
    Poll.Status.DRAFT: Poll.Status.OPEN,
    Poll.Status.OPEN: Poll.Status.CLOSED,
}


class ServiceError(Exception):
    """Erro de regra de negócio, com o código HTTP a devolver ao cliente."""

    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


# Obter votações

def get_poll_or_404(poll_id):
    """Devolve a votação com este id, ou lança erro 404."""
    try:
        return Poll.objects.prefetch_related("options").get(pk=poll_id)
    except Poll.DoesNotExist:
        raise ServiceError("Votação não encontrada.", 404)


def get_public_poll_or_404(poll_id):
    """Como get_poll_or_404, mas esconde os Rascunhos (o público nunca os vê)."""
    poll = get_poll_or_404(poll_id)
    if poll.status == Poll.Status.DRAFT:
        # 404 e não 403: para o público, um rascunho simplesmente "não existe".
        raise ServiceError("Votação não encontrada.", 404)
    return poll


def list_public_polls():
    """Votações visíveis para o público: Abertas e Fechadas."""
    return Poll.objects.exclude(status=Poll.Status.DRAFT).prefetch_related("options")


def list_all_polls():
    """
    Todas as votações (para o anfitrião), cada uma com o seu total de votos.
    annotate() acrescenta a cada votação um campo calculado "total_votes",
    contado pela base de dados (COUNT ... GROUP BY).
    """
    return Poll.objects.prefetch_related("options").annotate(
        total_votes=Count("options__votes")
    )


# Criar votação

def create_poll(question, options):
    """
    Cria uma votação (em Rascunho) com as suas opções.

    question: texto da pergunta
    options:  lista de textos, entre 2 e 5
    """
    # validação da pergunta
    if not isinstance(question, str) or not question.strip():
        raise ServiceError("A pergunta não pode estar vazia.")
    question = question.strip()
    if len(question) > MAX_QUESTION_LENGTH:
        raise ServiceError(f"A pergunta tem no máximo {MAX_QUESTION_LENGTH} caracteres.")

    # validação das opções
    if not isinstance(options, list):
        raise ServiceError("As opções têm de ser uma lista de textos.")
    # Remove espaços e ignora opções vazias (ex.: campos deixados em branco no formulário)
    cleaned = [o.strip() for o in options if isinstance(o, str) and o.strip()]

    if len(cleaned) < MIN_OPTIONS:
        raise ServiceError(f"Indica pelo menos {MIN_OPTIONS} opções.")
    if len(cleaned) > MAX_OPTIONS:
        raise ServiceError(f"No máximo {MAX_OPTIONS} opções.")
    if any(len(o) > MAX_OPTION_LENGTH for o in cleaned):
        raise ServiceError(f"Cada opção tem no máximo {MAX_OPTION_LENGTH} caracteres.")
    # Opções repetidas não fazem sentido (comparação sem maiúsculas/minúsculas)
    if len({o.lower() for o in cleaned}) != len(cleaned):
        raise ServiceError("Há opções repetidas.")

    # transaction.atomic: ou grava a votação E todas as opções, ou não grava nada.
    with transaction.atomic():
        poll = Poll.objects.create(question=question)
        Option.objects.bulk_create([Option(poll=poll, text=text) for text in cleaned])

    return get_poll_or_404(poll.id)  # volta a ler para trazer as opções


# Mudar estado

def change_status(poll, new_status):
    """Avança o estado da votação (Rascunho -> Aberta -> Fechada)."""
    if new_status not in Poll.Status.values:
        raise ServiceError("Estado inválido. Usa 'draft', 'open' ou 'closed'.")

    if new_status == poll.status:
        raise ServiceError(f"A votação já está '{poll.get_status_display()}'.", 409)

    expected = ALLOWED_TRANSITIONS.get(poll.status)
    if new_status != expected:
        # 409 Conflict: o pedido é válido mas choca com o estado atual do recurso
        raise ServiceError(
            f"Não é possível passar de '{poll.get_status_display()}' "
            f"para '{Poll.Status(new_status).label}'.",
            409,
        )

    poll.status = new_status
    poll.save(update_fields=["status"])
    return poll


# Votar

def has_voted(poll, voter_token):
    """True se este token já votou nalguma opção desta votação."""
    if not voter_token:
        return False
    return Vote.objects.filter(option__poll=poll, voter_token=voter_token).exists()


def cast_vote(poll_id, option_id, voter_token):
    """Regista um voto, aplicando todas as regras."""
    if not isinstance(voter_token, str) or not voter_token.strip():
        raise ServiceError("Falta o identificador do votante (voter_token).")

    with transaction.atomic():
        # select_for_update "tranca" esta votação até ao fim da transação.
        # Se o mesmo token enviar dois votos ao mesmo tempo, o segundo espera
        # e depois já vê o primeiro voto -> não há votos duplicados.
        try:
            poll = Poll.objects.select_for_update().get(pk=poll_id)
        except Poll.DoesNotExist:
            raise ServiceError("Votação não encontrada.", 404)

        # Nível 2: o BACKEND recusa votos em votações que não estejam Abertas
        # (não basta esconder o botão no frontend).
        if poll.status == Poll.Status.DRAFT:
            raise ServiceError("Votação não encontrada.", 404)
        if poll.status == Poll.Status.CLOSED:
            raise ServiceError("Esta votação já está fechada.", 409)

        # A opção tem de existir E pertencer a esta votação
        try:
            option = poll.options.get(pk=option_id)
        except (Option.DoesNotExist, ValueError, TypeError):
            raise ServiceError("Opção inválida para esta votação.")

        # Nível 2: um voto por pessoa
        if has_voted(poll, voter_token):
            raise ServiceError("Já votaste nesta votação.", 409)

        return Vote.objects.create(option=option, voter_token=voter_token)


# Resultados

def get_results(poll):
    """
    Conta os votos de cada opção e calcula percentagens.

    annotate(Count(...)) faz a contagem na própria base de dados com um
    único SELECT ... GROUP BY, em vez de carregar todos os votos para o Python.
    """
    options = poll.options.annotate(vote_count=Count("votes")).order_by("id")
    total = sum(o.vote_count for o in options)

    return {
        "poll_id": str(poll.id),
        "total_votes": total,
        "options": [
            {
                "id": o.id,
                "text": o.text,
                "votes": o.vote_count,
                # evita divisão por zero quando ainda não há votos
                "percentage": round(o.vote_count * 100 / total, 1) if total else 0.0,
            }
            for o in options
        ],
    }
