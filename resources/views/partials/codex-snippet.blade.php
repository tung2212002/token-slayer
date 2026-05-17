@php($command = "PROVIDER=codex bash \$HOME/.config/{$namespace}/send-hook.sh")
# Codex hook config — add to ~/.codex/config.toml under [hooks]
# Adjust event names to match your Codex CLI version.

@foreach (['session_start', 'stop'] as $event)
[[hooks]]
event = "{{ $event }}"
command = "{!! $command !!}"

@endforeach
