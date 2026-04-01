<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_posts', function (Blueprint $table) {
            $table->id();
            $table->enum('platform', ['instagram', 'facebook', 'both']);
            $table->enum('type', ['photo', 'reel', 'carousel', 'text']);
            $table->text('caption')->nullable();
            $table->json('media_urls')->nullable();
            $table->dateTime('scheduled_at');
            $table->enum('status', ['pending', 'published', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->string('meta_post_id')->nullable();
            $table->text('ig_token')->nullable();
            $table->string('ig_user_id')->nullable();
            $table->text('fb_token')->nullable();
            $table->string('fb_page_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_posts');
    }
};
