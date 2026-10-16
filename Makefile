# Makefile — Atalhos para os comandos do Docker.
#
# Em vez de escrever "docker compose up --build -d", escreves "make up".
# Lista de comandos:  make help
#
# No Windows o "make" não vem instalado. Opções:
#   - winget install GnuWin32.Make   (depois reabrir o terminal)
#   - ou usar o Git Bash, que já traz o make
#   - ou correr diretamente os comandos "docker compose ..." que estão em cada regra

# Estas regras não são ficheiros (sem isto, uma pasta chamada "test" estragava o "make test")
.PHONY: help up build down restart logs ps migrate makemigrations test shell psql reset

# Regra por omissão: correr só "make" mostra a ajuda
help:
	@echo "Comandos disponiveis:"
	@echo "  make up              Constroi e arranca tudo (db + backend + frontend)"
	@echo "  make down            Para e remove os contentores (os dados ficam guardados)"
	@echo "  make restart         Para e volta a arrancar tudo"
	@echo "  make build           Reconstroi as imagens (depois de mudar dependencias)"
	@echo "  make logs            Mostra os logs de todos os servicos (Ctrl+C para sair)"
	@echo "  make ps              Mostra o estado dos contentores"
	@echo "  make migrate         Aplica as migracoes da base de dados"
	@echo "  make makemigrations  Gera migracoes depois de alterar o models.py"
	@echo "  make test            Corre os testes automaticos do backend"
	@echo "  make shell           Abre a shell do Django (Python) dentro do backend"
	@echo "  make psql            Abre a consola do PostgreSQL"
	@echo "  make reset           APAGA a base de dados e arranca tudo do zero"

up:
	docker compose up --build -d
	@echo ""
	@echo "Pronto! Frontend: http://localhost:5173   API: http://localhost:8080/api/polls"

build:
	docker compose build

down:
	docker compose down

restart: down up

logs:
	docker compose logs -f

ps:
	docker compose ps

migrate:
	docker compose exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

test:
	docker compose exec backend python manage.py test

shell:
	docker compose exec backend python manage.py shell

psql:
	docker compose exec db psql -U postgres -d livepulse

# -v apaga também o volume com os dados da BD (útil depois de mudar o modelo de dados)
reset:
	docker compose down -v
	docker compose up --build -d
