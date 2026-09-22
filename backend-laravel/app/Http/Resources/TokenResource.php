<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource: TokenResource
 *
 * Wraps Sanctum token data for API responses after login/register.
 * Includes the plain-text token only on initial creation.
 */
class TokenResource extends JsonResource
{
    /**
     * @var string|null Plain-text token — only set on creation.
     */
    protected ?string $plainToken = null;

    /**
     * Set the plain-text token (only returned once, on login/register).
     */
    public function withPlainToken(string $token): static
    {
        $this->plainToken = $token;
        return $this;
    }

    public function toArray(Request $request): array
    {
        return [
            'accessToken' => $this->plainToken,
            'tokenType'   => 'Bearer',
            'user'        => new UserResource($this->resource),
        ];
    }
}
