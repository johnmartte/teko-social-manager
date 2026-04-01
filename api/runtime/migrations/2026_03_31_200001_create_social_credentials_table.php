<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('platform', ['instagram', 'facebook']);
            $table->text('access_token');        // encrypted in model
            $table->text('refresh_token')->nullable(); // encrypted in model
            $table->string('meta_user_id')->nullable(); // ig_user_id or fb_page_id
            $table->string('meta_username')->nullable(); // ig username or fb page name
            $table->timestamp('expira_en')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'platform']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_credentials');
    }
};
