<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inbox_conversations', function (Blueprint $table) {
            $table->id();
            $table->enum('channel', ['instagram', 'facebook']);
            $table->string('from_name', 140);
            $table->text('message');
            $table->enum('priority_level', ['alta', 'media', 'baja'])->default('media');
            $table->boolean('is_resolved')->default(false);
            $table->dateTime('last_activity_at')->nullable();
            $table->timestamps();
        });

        Schema::create('quick_reply_templates', function (Blueprint $table) {
            $table->id();
            $table->text('content');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('automation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->string('name', 150);
            $table->text('description');
            $table->boolean('enabled')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automation_rules');
        Schema::dropIfExists('quick_reply_templates');
        Schema::dropIfExists('inbox_conversations');
    }
};
