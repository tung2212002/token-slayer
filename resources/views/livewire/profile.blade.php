<div class="p-8 max-w-3xl mx-auto space-y-6">
    <header class="flex items-center gap-4">
        <img src="{{ $user->avatar_url }}" class="w-16 h-16 rounded-full">
        <div>
            <h1 class="text-2xl font-semibold">{{ $user->display_name }}</h1>
            <p class="text-gray-500">@ {{ $user->slack_handle }}</p>
        </div>
    </header>

    <section class="border rounded p-4">
        <h2 class="font-semibold mb-2">Hook token</h2>
        @if ($plainToken)
            <code class="block bg-gray-100 p-2 rounded select-all">{{ $plainToken }}</code>
            <p class="text-sm text-gray-500 mt-2">Shown once — run the command below to save it. After that you can regenerate freely without touching your Claude/Codex settings.</p>
            <p class="text-sm font-medium mt-3 mb-1">Save token to <code>~/.config/aiorg/token</code>:</p>
            <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs select-all">{{ $installCommand }}</pre>
        @else
            <p class="text-gray-500">Token is set. Regenerate to view a new one — the hook config below never needs to change.</p>
        @endif
        <button wire:click="regenerate" class="mt-3 px-3 py-1 bg-red-600 text-white rounded">Regenerate</button>
    </section>

    <section class="border rounded p-4">
        <h2 class="font-semibold mb-2">One-time hook setup</h2>
        <p class="text-sm mb-2">Installs Claude Code and Codex CLI hooks into <code>~/.claude/settings.json</code> and <code>~/.codex/config.toml</code>. Safe to re-run — existing settings are preserved.</p>
        <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs select-all">curl -fsSL {{ $installUrl }} | sh</pre>
        <p class="text-xs text-gray-500 mt-2">Or inspect the script first: <a href="{{ $installUrl }}" class="underline">{{ $installUrl }}</a></p>
    </section>

    <details class="border rounded p-4">
        <summary class="font-semibold cursor-pointer">Manual hook config (if you'd rather copy by hand)</summary>
        <div class="mt-3 space-y-3">
            <div>
                <p class="text-sm mb-1">Paste into <code>~/.claude/settings.json</code> under the top level:</p>
                <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs">{{ $claudeSnippet }}</pre>
            </div>
            <div>
                <p class="text-sm mb-1">Append to <code>~/.codex/config.toml</code>:</p>
                <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs">{{ $codexSnippet }}</pre>
            </div>
        </div>
    </details>
</div>
