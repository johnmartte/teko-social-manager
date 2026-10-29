<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->string('profile_name', 120)->nullable()->after('description');
            $table->text('profile_bio')->nullable()->after('profile_name');
            $table->string('profile_website', 500)->nullable()->after('profile_bio');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn(['profile_name', 'profile_bio', 'profile_website']);
        });
    }
};
