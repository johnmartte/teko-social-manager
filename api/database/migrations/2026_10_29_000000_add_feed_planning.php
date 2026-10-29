<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color', 16)->default('#c8f560');
            $table->text('description')->nullable();
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->timestamps();
        });

        Schema::table('scheduled_posts', function (Blueprint $table) {
            // 'draft' = planificado en el feed, sin fecha ni credenciales; el publicador lo ignora.
            $table->string('status', 20)->default('pending')->change();
            $table->dateTime('scheduled_at')->nullable()->change();
            $table->foreignId('campaign_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('feed_position')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('scheduled_posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('campaign_id');
            $table->dropColumn('feed_position');
        });
        Schema::dropIfExists('campaigns');
    }
};
