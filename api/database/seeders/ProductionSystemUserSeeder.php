<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class ProductionSystemUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SYSTEM_USER_EMAIL');
        $password = env('SYSTEM_USER_PASSWORD');
        $name = env('SYSTEM_USER_NAME', 'System User');

        if (!$email || !$password) {
            $this->command?->warn('ProductionSystemUserSeeder skipped: SYSTEM_USER_EMAIL or SYSTEM_USER_PASSWORD is missing.');
            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => $password]
        );

        $this->command?->info('Production system user seeded/updated successfully.');
    }
}