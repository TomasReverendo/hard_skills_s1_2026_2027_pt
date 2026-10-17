# backend/Dockerfile: Imagem do backend (Python + Django).

# Imagem base com Python 3.12 ("slim" = versão leve)
FROM python:3.12-slim

# PYTHONUNBUFFERED: os prints/logs aparecem logo no "docker compose logs"
# PYTHONDONTWRITEBYTECODE: não criar ficheiros .pyc dentro do contentor
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Pasta de trabalho dentro do contentor
WORKDIR /app

# 1) Instalar as dependências primeiro (a camada é reaproveitada se só o código mudar)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) Copiar o código do backend
COPY . .

# Porta onde o Django fica à escuta DENTRO do contentor
EXPOSE 8000

# Ao arrancar: aplicar as migrações (criar/atualizar tabelas) e iniciar o servidor.
# 0.0.0.0 = aceitar ligações de fora do contentor.
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
