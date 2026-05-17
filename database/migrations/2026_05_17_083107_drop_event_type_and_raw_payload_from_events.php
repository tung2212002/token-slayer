<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bring older `events` tables in sync with the rewritten
     * create_events_table migration: drop event_type / raw_payload and
     * make tokens NOT NULL. Idempotent so it can run on any DB regardless
     * of how the original table was seeded.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'event_type')) {
                $table->dropColumn('event_type');
            }
            if (Schema::hasColumn('events', 'raw_payload')) {
                $table->dropColumn('raw_payload');
            }
        });

        DB::table('events')->whereNull('tokens')->update(['tokens' => 0]);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE events ALTER COLUMN tokens SET NOT NULL');
        }
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('event_type')->nullable();
            $table->json('raw_payload')->nullable();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE events ALTER COLUMN tokens DROP NOT NULL');
        }
    }
};
