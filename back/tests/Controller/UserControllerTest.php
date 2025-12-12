<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class UserControllerTest extends WebTestCase
{
    public function testIndexRequiresAdmin401(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/users');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testShowUserWithoutAuth401(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/users/123e4567-e89b-12d3-a456-426614174000');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testShowUserInvalidUuid404(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/users/invalid-uuid');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testUpdateUserWithoutAuth401(): void
    {
        $client = static::createClient();
        $client->request(
            'PATCH',
            '/api/users/123e4567-e89b-12d3-a456-426614174000',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => 'test'])
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testDeleteUserWithoutAuth401(): void
    {
        $client = static::createClient();
        $client->request('DELETE', '/api/users/123e4567-e89b-12d3-a456-426614174000');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    // je reviens pour ajouter des tests
}
