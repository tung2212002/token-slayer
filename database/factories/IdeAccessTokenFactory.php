<?php

namespace Database\Factories;

use App\Models\IdeAccessToken;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<IdeAccessToken>
 */
class IdeAccessTokenFactory extends Factory
{
    protected $model = IdeAccessToken::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'kind' => 'bearer',
            'token_hash' => hash('sha256', Str::random(64)),
        ];
    }
}
