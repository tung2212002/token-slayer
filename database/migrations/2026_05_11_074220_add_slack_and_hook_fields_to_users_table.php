<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('slack_user_id')->unique()->nullable()->after('id');
            $table->string('slack_handle')->nullable()->after('name');
            $table->string('display_name')->nullable()->after('slack_handle');
            $table->string('avatar_url')->nullable()->after('display_name');
            $table->string('hook_token')->nullable()->after('avatar_url'); // stores hash
            $table->timestampTz('last_event_at')->nullable()->after('hook_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['slack_user_id', 'slack_handle', 'display_name', 'avatar_url', 'hook_token', 'last_event_at']);
        });
    }
};
