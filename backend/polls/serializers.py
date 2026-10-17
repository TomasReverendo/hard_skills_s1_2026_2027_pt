"""
polls/serializers.py: Converte objetos Python (modelos) em dicionários JSON.

Fica separado para que o formato das respostas da API esteja num só sítio.
"""


def option_to_dict(option):
    return {"id": option.id, "text": option.text}


def poll_to_dict(poll):
    data = {
        "id": str(poll.id),                         # UUID convertido em texto
        "question": poll.question,
        "status": poll.status,                      # "draft" | "open" | "closed"
        "status_label": poll.get_status_display(),  # "Rascunho" | "Aberta" | "Fechada"
        "created_at": poll.created_at.isoformat(),
        "options": [option_to_dict(o) for o in poll.options.all()],
    }
    # Só existe quando a query usou annotate() (lista do anfitrião)
    if hasattr(poll, "total_votes"):
        data["total_votes"] = poll.total_votes
    return data
