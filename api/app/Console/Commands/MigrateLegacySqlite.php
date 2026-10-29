<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateLegacySqlite extends Command
{
    protected $signature = 'data:migrate-legacy-sqlite
        {--source= : SQLite file path}
        {--fresh : Clear PostgreSQL tables before copying}';

    protected $description = 'Copy the persistent legacy SQLite data into the active PostgreSQL database';

    public function handle(): int
    {
        $source = $this->option('source') ?: env('DB_SQLITE_PATH', '/data/database.sqlite');
        if (!is_file($source)) {
            $this->error("SQLite source not found: {$source}");
            return self::FAILURE;
        }

        $sqlite = DB::connection('sqlite_legacy');
        $postgres = DB::connection();
        $tables = $sqlite->select("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations' ORDER BY name");
        $tableNames = array_map(static fn ($table) => $table->name, $tables);

        if ($this->option('fresh')) {
            $quoted = implode(', ', array_map([$postgres->getQueryGrammar(), 'wrapTable'], $tableNames));
            if ($quoted !== '') {
                $postgres->statement("TRUNCATE TABLE {$quoted} RESTART IDENTITY CASCADE");
            }
        }

        $postgres->statement('SET session_replication_role = replica');
        try {
            foreach ($tableNames as $table) {
                $rows = $sqlite->table($table)->get();
                $this->output->writeln("<info>{$table}</info>: {$rows->count()} rows");
                foreach ($rows->chunk(250) as $chunk) {
                    $payload = $chunk->map(static fn ($row) => (array) $row)->all();
                    if ($payload !== []) {
                        $postgres->table($table)->insertOrIgnore($payload);
                    }
                }
            }
        } finally {
            $postgres->statement('SET session_replication_role = DEFAULT');
        }

        foreach ($tableNames as $table) {
            $sequence = "{$table}_id_seq";
            if (!$postgres->selectOne('SELECT to_regclass(?) AS sequence_name', [$sequence])->sequence_name) {
                continue;
            }
            $postgres->statement("SELECT setval('{$sequence}', COALESCE((SELECT MAX(id) FROM \"{$table}\"), 1), true)");
        }

        $this->info('SQLite data copied to PostgreSQL successfully.');
        return self::SUCCESS;
    }
}
