@php($command = "BODY=\$(cat); curl -s --max-time 3 -X POST '{$baseUrl}' -H 'Authorization: Bearer '\$(cat ~/.config/{$namespace}/token) -H 'Content-Type: application/json' -d \\\"\$BODY\\\" >/dev/null 2>&1 &")
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
