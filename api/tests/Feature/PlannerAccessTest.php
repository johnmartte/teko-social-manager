<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PlannerAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_delegated_to_planner_and_requires_social_access(): void
    {
        config(['services.planner.url' => 'https://planner.test/api', 'services.planner.key' => 'k']);
        Http::fake([
            '*' => Http::sequence()
                ->push(['success' => true, 'data' => ['name' => 'Ana Lopez', 'email' => 'ana@teko.do']], 200)
                ->push(['success' => false], 403),
        ]);

        $this->postJson('/api/auth/system/login', ['email' => 'ana@teko.do', 'password' => 'x'])
            ->assertOk()->assertJsonPath('user.email', 'ana@teko.do');
        $this->assertDatabaseHas('users', ['email' => 'ana@teko.do']);

        $this->postJson('/api/auth/system/login', ['email' => 'ana@teko.do', 'password' => 'x'])->assertStatus(422);
        $this->postJson('/api/auth/system/register', ['name' => 'N', 'email' => 'n@teko.do', 'password' => 'password1'])->assertForbidden();
    }
}
