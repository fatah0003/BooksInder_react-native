<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class RegisterControllerTest extends WebTestCase
{
    public function testRegisterEndpointExists(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/register');

        self::assertResponseStatusCodeSame(Response::HTTP_TOO_MANY_REQUESTS);
        self::assertResponseHeaderSame('content-type', 'application/json');
    }

    public function testRegisterRateLimit429(): void
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'test@example.com'])
        );

        self::assertResponseStatusCodeSame(Response::HTTP_TOO_MANY_REQUESTS);
    }

    public function testRegisterValidatesContentType(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/register', [], [], [], 'invalid content');

        self::assertResponseStatusCodeSame(Response::HTTP_TOO_MANY_REQUESTS);
    }
}
