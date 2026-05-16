<div class="p-8 max-w-3xl mx-auto space-y-6">
    <header class="flex items-center gap-4">
        <img src="{{ $user->avatar_url }}" class="w-16 h-16 rounded-full">
        <div>
            <h1 class="text-2xl font-semibold">{{ $user->display_name }}</h1>
            <p class="text-gray-500">@ {{ $user->slack_handle }}</p>
        </div>
    </header>

    <section class="border rounded p-4">
        <h2 class="font-semibold mb-2">Hook setup</h2>
        @if ($plainToken)
            <code class="block bg-gray-100 p-2 rounded select-all">{{ $plainToken }}</code>
            <p class="text-sm text-gray-500 mt-2">Shown once. The command below installs the Claude Code + Codex CLI hooks and saves this token to <code>~/.config/aiorg/token</code> in one step. Safe to re-run on rotation.</p>
            <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs select-all">{{ $combinedCommand }}</pre>
        @else
            <p class="text-sm mb-2">Installs hooks into <code>~/.claude/settings.json</code> and <code>~/.codex/config.toml</code>. Regenerate first if you also need a new token — that gives you a single command that does both.</p>
            <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs select-all">curl -fsSL {{ $installUrl }} | sh</pre>
        @endif
        <p class="text-xs text-gray-500 mt-2">Or inspect the script first: <a href="{{ $installUrl }}" class="underline">{{ $installUrl }}</a></p>
        <button wire:click="regenerate" class="mt-3 px-3 py-1 bg-red-600 text-white rounded">Regenerate token</button>
    </section>

    <details class="border rounded p-4">
        <summary class="font-semibold cursor-pointer">Manual hook config (if you'd rather copy by hand)</summary>
        <div class="mt-3 space-y-3">
            <div>
                <p class="text-sm mb-1">1. Save your token to <code>~/.config/aiorg/token</code> (the snippets below read it at runtime):</p>
                @if ($tokenSaveCommand)
                    <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs select-all">{{ $tokenSaveCommand }}</pre>
                @else
                    <p class="text-xs text-gray-500">Regenerate above to reveal a token, then come back for the save command.</p>
                @endif
            </div>
            <div>
                <p class="text-sm mb-1">2. Paste into <code>~/.claude/settings.json</code> under the top level:</p>
                <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs">{{ $claudeSnippet }}</pre>
            </div>
            <div>
                <p class="text-sm mb-1">3. Append to <code>~/.codex/config.toml</code>:</p>
                <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs">{{ $codexSnippet }}</pre>
            </div>
        </div>
    </details>
</div>
