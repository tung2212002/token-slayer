# AI Boss Raid Game

A cooperative idle boss raid for your team. Each AI token your coding agents
spend (Claude Code, Codex, etc.) becomes damage against the current boss.
Watch hits land in real time on the battlefield, defeat bosses together,
and celebrate kills in Slack.

## Game setup

### Local setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
```

Fill in the required env vars (below), then start everything:

```bash
composer run dev
```

`composer run dev` runs the Laravel server, queue worker, log tail, Reverb
(WebSockets), and Vite together. That is the only command you need locally.

### Required env vars

| Var | Notes |
| --- | --- |
| `SLACK_CLIENT_ID` | From your Slack app's OAuth credentials. |
| `SLACK_CLIENT_SECRET` | Same Slack app. |
| `SLACK_REDIRECT_URI` | Typically `${APP_URL}/auth/slack/callback`. |
| `SLACK_KILL_WEBHOOK_URL` | Optional. Incoming webhook for the channel that gets boss-kill announcements. |
| `GAME_BASE_HP` | Optional. Boss starting HP. Defaults to `1000000`. |
| `GAME_IDLE_MINUTES` | Optional. Minutes of inactivity before a fighter is swept off the battlefield. Defaults to `30`. |

### New-developer onboarding

1. Open `/profile` in a browser.
2. Click **Sign in with Slack**.
3. Copy the displayed *Claude Code hook config* snippet.
4. Paste it into `~/.claude/settings.json` (merge with existing keys if any).
5. If you use Codex too, repeat with the *Codex hook config* snippet into
   `~/.codex/config.toml`.
6. Done. Open `/battlefield` and watch your hits register as you work.

### Pages

| Path | Description |
| --- | --- |
| `/` | Landing page. |
| `/battlefield` | Live battle view. Public. |
| `/history` | Defeated bosses. Public. |
| `/profile` | Your hook token and agent snippets. Slack login required. |

---

<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
