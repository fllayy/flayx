# FLAYX — Discord Music Bot

Bot musical discord.

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/)
- Un bot Discord ([Discord Developer Portal](https://discord.com/developers/applications))

---

## Installation

### 1. Télécharger les fichiers nécessaires

```bash
curl -O https://raw.githubusercontent.com/fllayy/flayx/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/fllayy/flayx/main/application.yml
curl -O https://raw.githubusercontent.com/fllayy/flayx/main/flayx.env-example
```

### 2. Configurer les variables d'environnement

```bash
cp flayx.env-example flayx.env
```

Edite `flayx.env` :

```env
# ─── Discord ───────────────────────────────────────────────
CLIENT_TOKEN=ton_token_ici
CLIENT_ID=ton_client_id_ici

# ─── Developers (IDs séparés par des virgules) ─────────────
DEVELOPERS=ton_user_id_discord

# ─── Options ───────────────────────────────────────────────
SHARDING=false

# ─── Lavalink ──────────────────────────────────────────────
LAVALINK_HOST=lavalink
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false

# ─── PostgreSQL ────────────────────────────────────────────
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=flayx
POSTGRES_USER=flayx
POSTGRES_PASSWORD=flayx_password
```

### 3. Lancer le bot

```bash
docker compose up -d
```

Docker va démarrer automatiquement :
- `flayx_db` — base de données PostgreSQL
- `ejs_signature_api` — service de déchiffrement YouTube
- `lavalink_server` — serveur audio Lavalink
- `flayx_bot` — le bot

---

## Mise à jour

```bash
docker compose pull
docker compose up -d
```