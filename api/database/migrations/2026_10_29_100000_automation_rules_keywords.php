<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('automation_rules', function (Blueprint $table) {
            $table->json('keywords')->nullable();
        });

        // Estas dos reglas eran solo interruptores sin ninguna lógica detrás.
        DB::table('automation_rules')->whereIn('key', ['smart-publish', 'daily-summary'])->delete();

        $defaults = [
            'comment-moderation' => ['Moderación de comentarios', 'Marca los comentarios que contengan estas palabras o enlaces para revisarlos primero.', ['gratis', 'sorteo', 'sigueme', 'http', 'www.', 'estafa']],
            'support-escalation' => ['Prioridad en el inbox', 'Los mensajes que contengan estas palabras suben a prioridad alta.', ['reembolso', 'queja', 'urgente', 'cancelar', 'problema']],
        ];
        foreach ($defaults as $key => [$name, $description, $keywords]) {
            DB::table('automation_rules')->where('key', $key)->update([
                'name' => $name,
                'description' => $description,
                'keywords' => json_encode($keywords),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('automation_rules', function (Blueprint $table) {
            $table->dropColumn('keywords');
        });
    }
};
