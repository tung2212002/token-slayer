<x-filament-widgets::widget>
    <x-filament::section heading="Activity by hour and weekday">
        <div class="overflow-x-auto">
            <div class="inline-grid" style="grid-template-columns: 3rem repeat(24, 1fr); gap: 2px;">
                <div></div>
                @for ($h = 0; $h < 24; $h++)
                    <div class="text-[10px] text-center text-gray-400">{{ $h }}</div>
                @endfor

                @foreach ($weekdays as $wd => $label)
                    <div class="text-xs text-gray-500 pr-1 flex items-center">{{ $label }}</div>
                    @for ($h = 0; $h < 24; $h++)
                        @php($tokens = $cells["{$wd}:{$h}"]['tokens'] ?? 0)
                        @php($opacity = $tokens > 0 ? max(0.08, $tokens / $max) : 0)
                        <div
                            class="aspect-square rounded-[2px]"
                            style="background-color: rgba(217, 119, 6, {{ $opacity }}); min-width: 10px;"
                            title="{{ $label }} {{ $h }}:00 — {{ number_format($tokens) }} tokens"
                        ></div>
                    @endfor
                @endforeach
            </div>
        </div>
    </x-filament::section>
</x-filament-widgets::widget>
