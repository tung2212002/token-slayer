# Token Slayer

A cooperative idle boss raid for your team. Each AI token your coding agents
spend (Claude Code, Codex, etc.) becomes damage against the current boss.
Watch hits land in real time on the battlefield, defeat bosses together,
and celebrate kills in Slack.

## How it works

1. You sign in with Slack and grab a personal hook token.
2. You paste the hook snippet into your agent config (Claude Code or Codex).
3. Every time your agent finishes a turn, its token usage is posted to the
   server, broadcast over Reverb websockets, and rendered as a hit on the
   live battlefield.
4. When the boss falls, the kill is announced in a Slack channel and a new
   boss spawns.

## Tech stack

- **Laravel 13** on PHP 8.4+
- **Livewire 4** + **Tailwind CSS 4** for the UI
- **Phaser 3** for the battlefield rendering
- **Laravel Reverb** for websocket broadcasting
- **Laravel Socialite** for Slack OAuth
- **PostgreSQL** in deployed environments, **SQLite** for local dev
- **Pest 4** for testing

## Local setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
```

Fill in the env vars below, then start everything in one command:

```bash
composer run dev
```

`composer run dev` runs the Laravel server, queue worker, log tail, Reverb
(websockets), and Vite together.

### Required env vars

| Var | Notes |
| --- | --- |
| `SLACK_CLIENT_ID` | From your Slack app's OAuth credentials. |
| `SLACK_CLIENT_SECRET` | Same Slack app. |
| `SLACK_REDIRECT_URI` | Typically `${APP_URL}/auth/slack/callback`. |
| `SLACK_KILL_WEBHOOK_URL` | Optional. Incoming webhook for boss-kill announcements. |
| `GAME_BASE_HP` | Optional. Boss starting HP. Defaults to `1000000`. |
| `GAME_IDLE_MINUTES` | Optional. Minutes of inactivity before a fighter is swept off the battlefield. Defaults to `30`. |

## Onboarding a new agent

1. Open `/profile` in a browser.
2. Click **Sign in with Slack**.
3. Copy the displayed *Claude Code hook config* snippet.
4. Paste it into `~/.claude/settings.json` (merge with existing keys if any).
5. If you use Codex too, repeat with the *Codex hook config* snippet into
   `~/.codex/config.toml`.
6. Open `/battlefield` and watch your hits register as you work.

## Pages

| Path | Description |
| --- | --- |
| `/` | Landing page. |
| `/battlefield` | Live battle view. Public. |
| `/history` | Defeated bosses. Public. |
| `/profile` | Your hook token and agent snippets. Slack login required. |

## Testing

```bash
php artisan test --compact
```

Browser tests use Pest 4's `visit()` driver and run headless by default.

## Docker deployment

Ships with a multi-stage `Dockerfile` (adapted from the `serversideup/php`
image) and three layered compose files.

### Local Docker dev

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Brings up `php`, `reverb`, and a `pgsql` container.

### Staging on a home server (behind Cloudflare Tunnel)

The staging stack runs `php` and `reverb` only — Postgres is expected to
run externally (reachable from the containers via `host.docker.internal`),
and a host-installed `cloudflared` handles public ingress.

```bash
cp .env.staging.example .env
# fill in APP_KEY, DB creds, Slack vars, Reverb keys, etc.
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
```

In the Cloudflare Zero Trust dashboard, add two public hostname routes on
your tunnel:

- `app.<your-domain>` → `http://localhost:8000`
- `ws.<your-domain>`  → `http://localhost:8080`

Both ports are bound to `127.0.0.1` on the host, so the only inbound path
is via cloudflared.

## License

MIT
