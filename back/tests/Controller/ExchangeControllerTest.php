<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Book;
use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ExchangeControllerTest extends WebTestCase
{
    private KernelBrowser $client;
    private ?User $user1 = null;
    private ?User $user2 = null;
    private ?Book $book1 = null;
    private ?Book $book2 = null;
    private ?Book $book3 = null;
    private ?Book $book4 = null;
    private ?Book $book5 = null;
    private ?Book $book6 = null;
    private ?Book $book7 = null;
    private ?Book $book8 = null;
    private ?Book $book9 = null;
    private ?Book $book10 = null;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->setupTestData();
    }

    private function setupTestData(): void
    {
        self::bootKernel();
        $container = static::getContainer();
        $em = $container->get('doctrine')->getManager();

        // Users (admin + autre user)
        $userRepo = $em->getRepository(User::class);
        $this->user1 = $userRepo->findOneBy(['email' => 'admin@example.com']);
        $this->user2 = $userRepo->findOneBy(['email' => 'user@example.com']);

        $this->assertNotNull($this->user1, 'User admin@example.com manquant en BDD de test');
        $this->assertNotNull($this->user2, 'User user@example.com manquant en BDD de test');

        // Books - on en charge plusieurs pour différents tests
        $bookRepo = $em->getRepository(Book::class);

        // Pour testCreateExchangeWithAuth
        $this->book1 = $bookRepo->find(7);
        $this->book2 = $bookRepo->find(8);

        // Pour testAcceptExchange
        $this->book3 = $bookRepo->find(9);
        $this->book4 = $bookRepo->find(10);

        // Pour testRejectExchange
        $this->book5 = $bookRepo->find(1);
        $this->book6 = $bookRepo->find(2);

        // Pour testCancelExchange
        $this->book7 = $bookRepo->find(3);
        $this->book8 = $bookRepo->find(4);

        // Pour testShowExchange
        $this->book9 = $bookRepo->find(5);
        $this->book10 = $bookRepo->find(6);

        $this->assertNotNull($this->book1, 'Book #7 manquant');
        $this->assertNotNull($this->book2, 'Book #8 manquant');
        $this->assertNotNull($this->book3, 'Book #9 manquant');
        $this->assertNotNull($this->book4, 'Book #10 manquant');
        $this->assertNotNull($this->book5, 'Book #1 manquant');
        $this->assertNotNull($this->book6, 'Book #2 manquant');
        $this->assertNotNull($this->book7, 'Book #3 manquant');
        $this->assertNotNull($this->book8, 'Book #4 manquant');
        $this->assertNotNull($this->book9, 'Book #5 manquant');
        $this->assertNotNull($this->book10, 'Book #6 manquant');
    }


    private function loginUser(User $user, ?string $password = null): string
    {
        // Si pas de password fourni, on met celui de la fixture
        if ($password === null) {
            $password = $user->getEmail() === 'admin@example.com'
                ? 'admin123'
                : 'user123';
        }

        $this->client->request('POST', '/api/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => $user->getEmail(),
            'password' => $password,
        ]));

        $this->assertResponseIsSuccessful();
        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $responseData);

        return $responseData['token'];
    }


    public function testExchangesRequireAuth(): void
    {
        $this->client->request('GET', '/api/exchanges/received');
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testCreateExchangeFailsWithoutAuth(): void
    {
        $this->client->request('POST', '/api/exchanges', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'bookOneId' => 1,
            'bookTwoId' => 2,
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testCreateExchangeWithAuth(): void
    {
        $token = $this->loginUser($this->user1);

        $this->client->request('POST', '/api/exchanges', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_Authorization' => 'Bearer '.$token,
        ], json_encode([
            'bookOneId' => $this->book1->getId(),
            'bookTwoId' => $this->book2->getId(),
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertArrayHasKey('uuid', $response['data']);
    }

    public function testCreateExchangeWithInvalidData(): void
    {
        $token = $this->loginUser($this->user1);

        $this->client->request('POST', '/api/exchanges', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_Authorization' => 'Bearer '.$token,
        ], json_encode([
            'bookOneId' => 'invalid', // provoque une erreur de désérialisation
            'bookTwoId' => 2,
        ]));

        // Si tu laisses le comportement actuel
        $this->assertResponseStatusCodeSame(Response::HTTP_INTERNAL_SERVER_ERROR);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertFalse($response['success']);
    }


    public function testAcceptExchange(): void
    {
        $token1 = $this->loginUser($this->user1);

        // Création : admin demande échange book1 (user) <-> book2 (admin)
        $this->client->request('POST', '/api/exchanges', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_Authorization' => 'Bearer '.$token1,
        ], json_encode([
            'bookOneId' => $this->book1->getId(), // user
            'bookTwoId' => $this->book2->getId(), // admin
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED, $this->client->getResponse()->getContent());
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $exchangeUuid = $response['data']['uuid'];

        // Acceptation : user valide en choisissant un livre QUI APPARTIENT AU DEMANDEUR (admin)
        $token2 = $this->loginUser($this->user2);

        $this->client->request('PUT', "/api/exchanges/{$exchangeUuid}/accept", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_Authorization' => 'Bearer '.$token2,
        ], json_encode([
            'bookTwoId'    => $this->book2->getId(), // livre admin
            'exchangeType' => 'permanent',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_OK, $this->client->getResponse()->getContent());
        $resp = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($resp['success']);
    }


    public function testAcceptNonExistentExchange(): void
    {
        $token = $this->loginUser($this->user2);

        $this->client->request('PUT', '/api/exchanges/00000000-0000-0000-0000-000000000000/accept', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_Authorization' => 'Bearer '.$token,
        ], json_encode([
            'bookId' => $this->book3->getId(),
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testRejectExchange(): void
    {
        $token1 = $this->loginUser($this->user1);

        // Créer un échange
        $this->client->request('POST', '/api/exchanges', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_Authorization' => 'Bearer '.$token1,
        ], json_encode([
            'bookOneId' => $this->book5->getId(),
            'bookTwoId' => $this->book6->getId(),
        ]));

        // Vérifier que la création a réussi
        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED, $this->client->getResponse()->getContent());
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertArrayHasKey('uuid', $response['data']);
        $exchangeUuid = $response['data']['uuid'];

        // Rejeter depuis l'autre user
        $token2 = $this->loginUser($this->user2);

        $this->client->request('PUT', "/api/exchanges/{$exchangeUuid}/reject", [], [], [
            'HTTP_Authorization' => 'Bearer '.$token2,
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);
    }



    public function testCancelExchange(): void
    {
        $token = $this->loginUser($this->user1);

        // Créer un échange
        $this->client->request('POST', '/api/exchanges', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_Authorization' => 'Bearer '.$token,
        ], json_encode([
            'bookOneId' => $this->book7->getId(),
            'bookTwoId' => $this->book8->getId(),
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED, $this->client->getResponse()->getContent());
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertArrayHasKey('uuid', $response['data']);
        $exchangeUuid = $response['data']['uuid'];

        // Annuler
        $this->client->request('DELETE', "/api/exchanges/{$exchangeUuid}/cancel", [], [], [
            'HTTP_Authorization' => 'Bearer '.$token,
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);
        $resp = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($resp['success']);
    }

    public function testListReceivedExchanges(): void
    {
        $token = $this->loginUser($this->user2);

        $this->client->request('GET', '/api/exchanges/received?limit=5', [], [], [
            'HTTP_Authorization' => 'Bearer '.$token,
        ]);

        $this->assertResponseIsSuccessful();
        $resp = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($resp['success']);
        $this->assertArrayHasKey('data', $resp);
    }

    public function testListSentExchanges(): void
    {
        $token = $this->loginUser($this->user1);

        $this->client->request('GET', '/api/exchanges/sent?limit=5', [], [], [
            'HTTP_Authorization' => 'Bearer '.$token,
        ]);

        $this->assertResponseIsSuccessful();
        $resp = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($resp['success']);
    }

    public function testListCompletedExchanges(): void
    {
        $token = $this->loginUser($this->user1);

        $this->client->request('GET', '/api/exchanges/completed?limit=5', [], [], [
            'HTTP_Authorization' => 'Bearer '.$token,
        ]);

        $this->assertResponseIsSuccessful();
        $resp = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($resp['success']);
    }

    public function testShowExchange(): void
    {
        $token = $this->loginUser($this->user1);

        // Créer un échange
        $this->client->request('POST', '/api/exchanges', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_Authorization' => 'Bearer '.$token,
        ], json_encode([
            'bookOneId' => $this->book9->getId(),
            'bookTwoId' => $this->book10->getId(),
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED, $this->client->getResponse()->getContent());
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertArrayHasKey('uuid', $response['data']);
        $exchangeUuid = $response['data']['uuid'];


        // Afficher
        $this->client->request('GET', "/api/exchanges/{$exchangeUuid}", [], [], [
            'HTTP_Authorization' => 'Bearer '.$token,
        ]);

        $this->assertResponseIsSuccessful();
        $resp = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($resp['success']);
        $this->assertArrayHasKey('data', $resp);
    }

    public function testAvailableBooks(): void
    {
        $token1 = $this->loginUser($this->user1);

        // Créer un échange
        $this->client->request('POST', '/api/exchanges', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_Authorization' => 'Bearer '.$token1,
        ], json_encode([
            'bookOneId' => $this->book9->getId(),
            'bookTwoId' => $this->book10->getId(),
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED, $this->client->getResponse()->getContent());
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertArrayHasKey('uuid', $response['data']);
        $exchangeUuid = $response['data']['uuid'];


        // Récupérer les livres disponibles pour l'autre user
        $token2 = $this->loginUser($this->user2);

        $this->client->request('GET', "/api/exchanges/{$exchangeUuid}/available-books", [], [], [
            'HTTP_Authorization' => 'Bearer '.$token2,
        ]);

        $this->assertResponseIsSuccessful();
        $resp = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($resp['success']);
    }

    public function testReceivedExchangesByStatus(): void
    {
        $token = $this->loginUser($this->user2);

        $this->client->request('GET', '/api/exchanges/received?status=pending&limit=5', [], [], [
            'HTTP_Authorization' => 'Bearer '.$token,
        ]);

        $this->assertResponseIsSuccessful();
        $resp = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($resp['success']);
    }


    public function testInvalidStatusParameter(): void
    {
        $token = $this->loginUser($this->user2);

        $this->client->request('GET', '/api/exchanges/received?status=INVALID', [], [], [
            'HTTP_Authorization' => 'Bearer '.$token,
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }
}
