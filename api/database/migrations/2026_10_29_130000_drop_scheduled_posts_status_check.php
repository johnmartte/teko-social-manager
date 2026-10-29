<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // En PostgreSQL, ->change() a string no quita el CHECK del enum original y rechaza status = 'draft'.
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE scheduled_posts DROP CONSTRAINT IF EXISTS scheduled_posts_status_check');
        }
    }

    public function down(): void
    {
        //
    }
};
