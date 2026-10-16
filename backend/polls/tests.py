"""
polls/tests.py — Testes automáticos da API.

Correr com:   python manage.py test

O Django cria uma base de dados de teste temporária, corre os testes e apaga-a.
Cada teste começa com a BD vazia.
"""

import json

from django.test import TestCase

from .models import Poll, Vote


class PollApiTests(TestCase):

    # ---- utilitários para não repetir código --------------------------------

    def post(self, url, data):
        return self.client.post(url, json.dumps(data), content_type="application/json")

    def patch(self, url, data):
        return self.client.patch(url, json.dumps(data), content_type="application/json")

    def create_poll(self, question="Qual a melhor linguagem?", options=("Python", "TS")):
        res = self.post("/api/host/polls", {"question": question, "options": list(options)})
        self.assertEqual(res.status_code, 201)
        return res.json()

    def open_poll(self, poll_id):
        self.patch(f"/api/host/polls/{poll_id}", {"status": "open"})

    def close_poll(self, poll_id):
        self.patch(f"/api/host/polls/{poll_id}", {"status": "closed"})

    def vote(self, poll, option_index=0, token="token-a"):
        return self.post(
            f"/api/polls/{poll['id']}/votes",
            {"option_id": poll["options"][option_index]["id"], "voter_token": token},
        )

    # ---- Nível 1 -------------------------------------------------------------

    def test_create_poll_starts_as_draft(self):
        poll = self.create_poll()
        self.assertEqual(poll["status"], "draft")
        self.assertEqual(len(poll["options"]), 2)

    def test_poll_id_is_uuid(self):
        poll = self.create_poll()
        self.assertEqual(len(poll["id"]), 36)  # formato 8-4-4-4-12, ex.: 3f2a9c1e-8b7d-...
        # um id numérico (o formato antigo) já não corresponde a nenhuma rota
        self.assertEqual(self.client.get("/api/host/polls/1").status_code, 404)

    def test_public_list_hides_drafts(self):
        draft = self.create_poll("Rascunho?")
        opened = self.create_poll("Aberta?")
        self.open_poll(opened["id"])

        ids = [p["id"] for p in self.client.get("/api/polls").json()["polls"]]
        self.assertIn(opened["id"], ids)
        self.assertNotIn(draft["id"], ids)
        # o detalhe de um rascunho também é escondido
        self.assertEqual(self.client.get(f"/api/polls/{draft['id']}").status_code, 404)

    def test_host_list_shows_everything(self):
        self.create_poll()
        self.assertEqual(len(self.client.get("/api/host/polls").json()["polls"]), 1)

    def test_status_flow_draft_open_closed(self):
        poll = self.create_poll()
        res = self.patch(f"/api/host/polls/{poll['id']}", {"status": "open"})
        self.assertEqual(res.json()["status"], "open")
        res = self.patch(f"/api/host/polls/{poll['id']}", {"status": "closed"})
        self.assertEqual(res.json()["status"], "closed")

    def test_cannot_go_backwards_or_skip(self):
        poll = self.create_poll()
        # saltar de Rascunho para Fechada
        res = self.patch(f"/api/host/polls/{poll['id']}", {"status": "closed"})
        self.assertEqual(res.status_code, 409)

    def test_vote_and_results(self):
        poll = self.create_poll()
        self.open_poll(poll["id"])
        self.assertEqual(self.vote(poll, 0, "a").status_code, 201)
        self.assertEqual(self.vote(poll, 0, "b").status_code, 201)
        self.assertEqual(self.vote(poll, 1, "c").status_code, 201)

        host_list = self.client.get("/api/host/polls").json()["polls"]
        self.assertEqual(host_list[0]["total_votes"], 3)

        results = self.client.get(f"/api/host/polls/{poll['id']}/results").json()
        self.assertEqual(results["total_votes"], 3)
        self.assertEqual(results["options"][0]["votes"], 2)
        self.assertEqual(results["options"][0]["percentage"], 66.7)

    def test_public_results_only_when_closed(self):
        poll = self.create_poll()
        self.open_poll(poll["id"])
        url = f"/api/polls/{poll['id']}/results"
        self.assertEqual(self.client.get(url).status_code, 403)  # aberta: escondido
        self.close_poll(poll["id"])
        self.assertEqual(self.client.get(url).status_code, 200)  # fechada: visível

    # ---- Nível 2 -------------------------------------------------------------

    def test_one_vote_per_person(self):
        poll = self.create_poll()
        self.open_poll(poll["id"])
        self.assertEqual(self.vote(poll, 0, "mesmo-token").status_code, 201)
        self.assertEqual(self.vote(poll, 1, "mesmo-token").status_code, 409)
        self.assertEqual(Vote.objects.count(), 1)

        detail = self.client.get(f"/api/polls/{poll['id']}?voter_token=mesmo-token").json()
        self.assertTrue(detail["has_voted"])

    def test_backend_rejects_votes_on_draft_and_closed(self):
        poll = self.create_poll()
        self.assertEqual(self.vote(poll).status_code, 404)  # rascunho
        self.open_poll(poll["id"])
        self.close_poll(poll["id"])
        self.assertEqual(self.vote(poll).status_code, 409)  # fechada

    def test_option_from_another_poll_is_rejected(self):
        poll_a = self.create_poll("A?")
        poll_b = self.create_poll("B?")
        self.open_poll(poll_a["id"])
        res = self.post(
            f"/api/polls/{poll_a['id']}/votes",
            {"option_id": poll_b["options"][0]["id"], "voter_token": "x"},
        )
        self.assertEqual(res.status_code, 400)

    def test_validation_errors(self):
        cases = [
            {"question": "  ", "options": ["A", "B"]},              # pergunta vazia
            {"question": "Q?", "options": ["A"]},                   # só 1 opção
            {"question": "Q?", "options": ["A", "B", "C", "D", "E", "F"]},  # 6 opções
            {"question": "Q?", "options": ["Sim", "sim"]},          # repetidas
            {"question": "Q?", "options": "A,B"},                   # não é lista
        ]
        for body in cases:
            res = self.post("/api/host/polls", body)
            self.assertEqual(res.status_code, 400, body)
            self.assertIn("error", res.json())
        self.assertEqual(Poll.objects.count(), 0)

    def test_invalid_json_returns_400(self):
        res = self.client.post("/api/host/polls", "isto não é json", content_type="application/json")
        self.assertEqual(res.status_code, 400)
