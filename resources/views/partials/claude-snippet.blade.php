@php($command = "bash \$HOME/.config/{$namespace}/send-hook.sh")
{
  "hooks": {
@foreach (['SessionStart','UserPromptSubmit','PreToolUse','PostToolUse','Stop','SubagentStop','SessionEnd','Notification'] as $event)
    "{{ $event }}": [
      { "hooks": [{
        "type": "command",
        "command": "{!! $command !!}"
      }]}]{{ ! $loop->last ? ',' : '' }}
@endforeach
  }
}
