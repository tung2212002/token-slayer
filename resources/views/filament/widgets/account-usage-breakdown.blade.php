<x-filament-widgets::widget>
    <x-filament::section heading="Account usage (with contributors)">
        <div style="display:flex; flex-direction:column; gap:12px;">
            @forelse ($rows as $row)
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; padding:12px; border:1px solid rgba(120,120,140,.25); border-radius:8px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-weight:600;">{{ $row['email'] }}</span>
                            @if ($row['plan'])
                                <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(120,120,140,.2);">{{ $row['plan'] }}</span>
                            @endif
                        </div>
                        <div style="margin-top:6px; font-family:monospace;">{{ number_format($row['tokens']) }} tokens</div>
                        <div style="margin-top:4px; font-size:12px; opacity:.75;">
                            5h {{ $row['util_5h'] !== null ? $row['util_5h'].'%' : '—' }}
                            · 7d {{ $row['util_7d'] !== null ? $row['util_7d'].'%' : '—' }}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        @foreach ($row['users'] as $user)
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                                <span style="display:inline-flex; align-items:center; gap:6px;">
                                    @if ($user['avatar_url'])
                                        <img src="{{ $user['avatar_url'] }}" alt="" style="width:22px; height:22px; border-radius:50%;">
                                    @endif
                                    <span>{{ $user['handle'] }}</span>
                                </span>
                                <span style="font-size:12px; font-family:monospace; padding:2px 6px; border-radius:4px; background:rgba(37,99,235,.15);">{{ number_format($user['tokens']) }}</span>
                            </div>
                        @endforeach
                    </div>
                </div>
            @empty
                <div style="opacity:.7;">No account usage in this range.</div>
            @endforelse
        </div>
    </x-filament::section>
</x-filament-widgets::widget>
