"""
polls/models.py: Modelo de dados (tabelas da base de dados).

Três tabelas, com relações 1-para-N:

    Poll (votação)  1 ──< N  Option (opção)  1 ──< N  Vote (voto)

- Uma votação tem várias opções.
- Uma opção tem vários votos.
- Um voto pertence a UMA opção. A votação de um voto obtém-se via vote.option.poll,
  por isso não guardo poll_id no Vote (evita informação duplicada = normalizado).

A votação usa um UUID como chave primária (ex.: 3f2a9c1e-8b7d-4e21-...) em vez de
um número sequencial (1, 2, 3...). Como o id aparece nos links (/polls/<id>),
isto impede que alguém adivinhe ou percorra as outras votações mudando o número.
"""

import uuid

from django.db import models


class Poll(models.Model):
    """Uma votação: uma pergunta com um estado (Rascunho, Aberta ou Fechada)."""

    class Status(models.TextChoices):
        # valor guardado na BD  /  texto legível
        DRAFT = "draft", "Rascunho"
        OPEN = "open", "Aberta"
        CLOSED = "closed", "Fechada"

    # UUID gerado automaticamente ao criar a votação (uuid4 = aleatório)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.CharField(max_length=200)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.DRAFT,  # uma votação nasce sempre em Rascunho
    )
    created_at = models.DateTimeField(auto_now_add=True)  # preenchido automaticamente

    class Meta:
        ordering = ["-created_at"]  # as mais recentes primeiro

    def __str__(self):
        return self.question


class Option(models.Model):
    """Uma opção de resposta, pertencente a uma votação."""

    # on_delete=CASCADE: se a votação for apagada, as opções também são.
    # related_name="options" permite fazer poll.options.all()
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=100)

    class Meta:
        ordering = ["id"]  # mantém a ordem em que as opções foram criadas

    def __str__(self):
        return self.text


class Vote(models.Model):
    """Um voto numa opção específica."""

    option = models.ForeignKey(Option, on_delete=models.CASCADE, related_name="votes")
    created_at = models.DateTimeField(auto_now_add=True)

    # Nível 2 — "um voto por pessoa".
    # O navegador gera um identificador aleatório (UUID), guarda-o em localStorage
    # e envia-o com cada voto. Antes de gravar, verifico se esse token já votou
    # nesta votação (ver services.cast_vote).
    voter_token = models.CharField(max_length=64)

    class Meta:
        # Índice para tornar rápida a pesquisa "este token já votou?"
        indexes = [models.Index(fields=["voter_token"])]

    def __str__(self):
        return f"Voto em '{self.option.text}'"
