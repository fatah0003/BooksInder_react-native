<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class InfosUserControllerTest extends WebTestCase
{
    public function testIndexWithoutTokenReturns401(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/infosusers');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testShowWithoutTokenReturns401(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/infosusers/1');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testCreateWithoutTokenReturns401(): void
    {
        $client = static::createClient();
        $payload = [
            'adresse' => '1 rue de Test',   // adapte aux champs de InfosUser
            'ville'   => 'Paris',
        ];

        $client->request(
            'POST',
            '/api/infosusers',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testUpdateWithoutTokenReturns401(): void
    {
        $client = static::createClient();

        $payload = [
            'ville' => 'Lyon',
        ];

        $client->request(
            'PATCH',
            '/api/infosusers/1',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testDeleteWithoutTokenReturns401(): void
    {
        $client = static::createClient();
        $client->request('DELETE', '/api/infosusers/1');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }
}
