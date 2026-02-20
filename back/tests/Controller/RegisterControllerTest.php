<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class RegisterControllerTest extends WebTestCase
{
    public function testRegisterEndpointExists(): void
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([])
        );

        self::assertNotSame(Response::HTTP_NOT_FOUND, $client->getResponse()->getStatusCode());
        self::assertResponseHeaderSame('content-type', 'application/json');

        $response = json_decode($client->getResponse()->getContent(), true);
        self::assertArrayHasKey('success', $response);
        self::assertFalse($response['success']);
    }
    public function testRegisterRateLimit429(): void
    {
        if (getenv('CI')) {
            $this->markTestSkipped('Rate limit non testable en CI avec cache en mémoire.');
        }
        $client = static::createClient();
        $client->disableReboot();

        for ($i = 0; $i < 3; $i++) {
            $client->request(
                'POST',
                '/api/register',
                [],
                [],
                ['CONTENT_TYPE' => 'application/json'],
                json_encode([
                    'email'    => "test{$i}@example.com",
                    'password' => 'MotDePasse123!',
                    'username' => "testuser{$i}",
                ])
            );
        }

        $client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email'    => 'final@example.com',
                'password' => 'MotDePasse123!',
                'username' => 'finaluser',
            ])
        );

        self::assertResponseStatusCodeSame(Response::HTTP_TOO_MANY_REQUESTS);

        $response = json_decode($client->getResponse()->getContent(), true);
        self::assertFalse($response['success']);
    }

    public function testRegisterValidatesContentType(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/register', [], [], [], 'contenu invalide');

        // Doit retourner une erreur métier (400) et non un 404
        self::assertNotSame(Response::HTTP_NOT_FOUND, $client->getResponse()->getStatusCode());
        self::assertResponseHeaderSame('content-type', 'application/json');
    }
}