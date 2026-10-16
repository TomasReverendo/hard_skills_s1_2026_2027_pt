# frontend/Dockerfile — Imagem do frontend (React + Vite).
#
# Corre o servidor de desenvolvimento do Vite, igual a fazer "npm run dev" no PC.
# É suficiente para avaliar o projeto localmente; em produção usaríamos
# "npm run build" e serviríamos a pasta dist/ com um servidor como o Nginx.

# Imagem base com Node.js 22 (versão "alpine" = Linux mínimo, imagem mais pequena)
FROM node:22-alpine

# Pasta de trabalho dentro do contentor
WORKDIR /app

# 1) Copiar só os ficheiros de dependências e instalá-las.
#    Fica numa "camada" separada: se só mudares código, o Docker reaproveita
#    esta camada e não volta a correr o npm ci (builds muito mais rápidos).
COPY package.json package-lock.json ./
RUN npm ci

# 2) Copiar o resto do código
COPY . .

# Porta onde o Vite fica à escuta
EXPOSE 5173

# --host 0.0.0.0: aceitar ligações de fora do contentor (senão só o próprio contentor o via)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
