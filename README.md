# Naty Achados 🔗

Link-in-bio personalizado com painel administrativo. Alternativa ao Linktree, feita para uso próprio.

**Domínio:** [natyachados.com.br](https://natyachados.com.br)

---

## ⚡ Início rápido (local)

```bash
# 1. Instalar dependências
npm install

# 2. Criar banco de dados e rodar seed
npx prisma migrate dev

# 3. Rodar o projeto
npm run dev
```

Acesse:
- Página pública: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

**Login padrão:** `admin` / `admin123`

> ⚠️ Troque a senha após o primeiro acesso!

---

## 🚀 Deploy na VPS (Linux)

### 1. Pré-requisitos

```bash
# Node.js 18+ e npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git
sudo apt-get install -y git
```

### 2. Clonar e configurar

```bash
# Clonar
git clone https://github.com/iagoschumaker/natyachados.git
cd natyachados

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
nano .env
# Editar DATABASE_URL e SESSION_SECRET
```

### 3. Configurar `.env`

```env
DATABASE_URL="file:./prod.db"
SESSION_SECRET="TROQUE_ESTE_VALOR_POR_ALGO_ALEATORIO_COM_32_CHARS_MIN"
```

Para gerar um secret aleatório:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Criar banco e rodar seed

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 5. Build e iniciar

```bash
npm run build
npm start
```

O servidor roda na porta 3000 por padrão.

### 6. Nginx como proxy reverso (recomendado)

```bash
sudo apt install nginx
```

Crie `/etc/nginx/sites-available/natyachados`:

```nginx
server {
    listen 80;
    server_name natyachados.com.br www.natyachados.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/natyachados /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL com Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d natyachados.com.br -d www.natyachados.com.br
```

### 8. Manter rodando com PM2

```bash
sudo npm install -g pm2
pm2 start npm --name "natyachados" -- start
pm2 save
pm2 startup
```

---

## 📁 Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx              # Página pública
│   ├── layout.tsx            # Layout raiz
│   ├── globals.css           # Estilos globais
│   ├── admin/
│   │   ├── page.tsx          # Dashboard de links
│   │   ├── layout.tsx        # Layout do admin
│   │   ├── login/page.tsx    # Tela de login
│   │   └── settings/page.tsx # Configurações
│   └── api/
│       ├── auth/             # Login/logout/sessão
│       ├── admin/            # CRUD links + settings + upload
│       └── click/[id]/       # Tracking de cliques
├── components/
│   └── LinkButton.tsx        # Botão de link com tracking
└── lib/
    ├── auth.ts               # Config de sessão
    └── prisma.ts             # Cliente do banco
prisma/
├── schema.prisma             # Esquema do banco
└── seed.ts                   # Dados iniciais
```

---

## 🛠️ Stack

- **Next.js 16** (App Router)
- **Tailwind CSS 4**
- **Prisma 6** + SQLite
- **iron-session** (autenticação)
- **bcryptjs** (hash de senhas)
- **TypeScript**

---

## 📋 Funcionalidades

### Página pública
- ✅ Links ativos em ordem definida
- ✅ Link destacado com estilo diferenciado
- ✅ Logo/foto de perfil
- ✅ Cores personalizáveis
- ✅ Animações suaves
- ✅ Responsivo (mobile-first)
- ✅ SEO + Open Graph

### Painel admin
- ✅ Login seguro
- ✅ CRUD completo de links
- ✅ Reordenar links (↑↓)
- ✅ Ativar/desativar links
- ✅ Destacar link principal
- ✅ Duplicar link
- ✅ Copiar URL
- ✅ Contador de cliques
- ✅ Notas internas
- ✅ Personalizar título, subtítulo, cores, logo, rodapé
- ✅ Upload de logo e favicon
- ✅ Espaço para scripts (Analytics, Pixel)
