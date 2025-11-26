<?php

namespace App\Controller;

use App\Entity\Exchange;
use App\Entity\Book;
use App\Enum\ExchangeStatusEnum;
use App\Enum\ExchangeTypeEnum;
use App\Enum\BookStatusEnum;
use App\Repository\ExchangeRepository;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/exchanges')]
#[IsGranted('ROLE_USER')]
class ExchangeController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ExchangeRepository $exchangeRepository,
        private BookRepository $bookRepository
    ) {}

    /**
     * Créer une demande d'échange
     */
    #[Route('', name: 'exchange_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        // Validation des données
        if (!isset($data['bookId'])) {
            return $this->json(['error' => 'Le champ bookId est requis'], Response::HTTP_BAD_REQUEST);
        }

        $book = $this->bookRepository->find($data['bookId']);

        if (!$book) {
            return $this->json(['error' => 'Livre introuvable'], Response::HTTP_NOT_FOUND);
        }

        // Vérifications métier
        if ($book->getUser() === $user) {
            return $this->json(['error' => 'Vous ne pouvez pas demander l\'échange de votre propre livre'], Response::HTTP_BAD_REQUEST);
        }

        if ($book->getBookStatus() !== BookStatusEnum::ACTIVE) {
            return $this->json(['error' => 'Ce livre n\'est pas disponible pour un échange'], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier si l'utilisateur a déjà une demande en cours pour ce livre
        $existingExchange = $this->exchangeRepository->findPendingExchangeByUserAndBook($user, $book);
        if ($existingExchange) {
            return $this->json(['error' => 'Vous avez déjà une demande en cours pour ce livre'], Response::HTTP_BAD_REQUEST);
        }

        // Création de l'échange
        $exchange = new Exchange();
        $exchange->setUserRequester($user);
        $exchange->setUserReceiver($book->getUser());
        $exchange->setBookOne($book);
        $exchange->setStatus(ExchangeStatusEnum::PENDING);
        $exchange->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($exchange);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Demande d\'échange créée avec succès',
            'exchangeId' => $exchange->getId()
        ], Response::HTTP_CREATED);
    }

    /**
     * Accepter une demande d'échange (avec choix du livre et du type)
     */
    #[Route('/{id}/accept', name: 'exchange_accept', methods: ['PUT'])]
    public function accept(int $id, Request $request): JsonResponse
    {
        $user = $this->getUser();
        $exchange = $this->exchangeRepository->find($id);

        if (!$exchange) {
            return $this->json(['error' => 'Demande d\'échange introuvable'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que l'utilisateur est bien le propriétaire du livre
        if ($exchange->getUserReceiver() !== $user) {
            return $this->json(['error' => 'Vous n\'êtes pas autorisé à accepter cette demande'], Response::HTTP_FORBIDDEN);
        }

        if ($exchange->getStatus() !== ExchangeStatusEnum::PENDING) {
            return $this->json(['error' => 'Cette demande a déjà été traitée'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);

        // Validation des données
        if (!isset($data['bookTwoId']) || !isset($data['exchangeType'])) {
            return $this->json(['error' => 'Les champs bookTwoId et exchangeType sont requis'], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier le livre choisi en échange
        $bookTwo = $this->bookRepository->find($data['bookTwoId']);

        if (!$bookTwo) {
            return $this->json(['error' => 'Livre sélectionné introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($bookTwo->getUser() !== $exchange->getUserRequester()) {
            return $this->json(['error' => 'Le livre sélectionné n\'appartient pas au demandeur'], Response::HTTP_BAD_REQUEST);
        }

        if ($bookTwo->getBookStatus() !== BookStatusEnum::ACTIVE) {
            return $this->json(['error' => 'Le livre sélectionné n\'est pas disponible'], Response::HTTP_BAD_REQUEST);
        }

        // Valider le type d'échange
        try {
            $exchangeType = ExchangeTypeEnum::from($data['exchangeType']);
        } catch (\ValueError $e) {
            return $this->json(['error' => 'Type d\'échange invalide. Valeurs acceptées : temporary, permanent'], Response::HTTP_BAD_REQUEST);
        }

        // 🔒 TRANSACTION : Tout ou rien pour garantir la cohérence
        try {
            $this->em->wrapInTransaction(function () use ($exchange, $bookTwo, $exchangeType) {
                // Mise à jour de l'échange
                $exchange->setBookTwo($bookTwo);
                $exchange->setExchangeType($exchangeType);
                $exchange->setStatus(ExchangeStatusEnum::VALIDATED);
                $exchange->setAcceptedAt(new \DateTimeImmutable());

                // Mise à jour du statut des livres
                $exchange->getBookOne()->setBookStatus(BookStatusEnum::UNAVAILABLE);
                $bookTwo->setBookStatus(BookStatusEnum::UNAVAILABLE);
            });
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Erreur lors de la validation de l\'échange',
                'details' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json([
            'success' => true,
            'message' => 'Demande d\'échange acceptée avec succès',
            'exchange' => $this->serializeExchange($exchange)
        ]);
    }

    /**
     * Refuser une demande d'échange
     */
    #[Route('/{id}/reject', name: 'exchange_reject', methods: ['PUT'])]
    public function reject(int $id): JsonResponse
    {
        $user = $this->getUser();
        $exchange = $this->exchangeRepository->find($id);

        if (!$exchange) {
            return $this->json(['error' => 'Demande d\'échange introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($exchange->getUserReceiver() !== $user) {
            return $this->json(['error' => 'Vous n\'êtes pas autorisé à refuser cette demande'], Response::HTTP_FORBIDDEN);
        }

        if ($exchange->getStatus() !== ExchangeStatusEnum::PENDING) {
            return $this->json(['error' => 'Cette demande a déjà été traitée'], Response::HTTP_BAD_REQUEST);
        }

        $exchange->setStatus(ExchangeStatusEnum::REJECTED);
        $exchange->setRefusedAt(new \DateTimeImmutable());

        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Demande d\'échange refusée'
        ]);
    }

    /**
     * Annuler une demande d'échange (par le demandeur)
     */
    #[Route('/{id}/cancel', name: 'exchange_cancel', methods: ['DELETE'])]
    public function cancel(int $id): JsonResponse
    {
        $user = $this->getUser();
        $exchange = $this->exchangeRepository->find($id);

        if (!$exchange) {
            return $this->json(['error' => 'Demande d\'échange introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($exchange->getUserRequester() !== $user) {
            return $this->json(['error' => 'Vous n\'êtes pas autorisé à annuler cette demande'], Response::HTTP_FORBIDDEN);
        }

        if ($exchange->getStatus() === ExchangeStatusEnum::REJECTED) {
            return $this->json(['error' => 'Impossible d\'annuler une demande déjà refusée'], Response::HTTP_BAD_REQUEST);
        }

        // 🔒 TRANSACTION : Garantir la cohérence lors de l'annulation
        try {
            $this->em->wrapInTransaction(function () use ($exchange) {
                // Si l'échange était validé, remettre les livres en disponible
                if ($exchange->getStatus() === ExchangeStatusEnum::VALIDATED) {
                    if ($exchange->getBookOne()) {
                        $exchange->getBookOne()->setBookStatus(BookStatusEnum::ACTIVE);
                    }
                    if ($exchange->getBookTwo()) {
                        $exchange->getBookTwo()->setBookStatus(BookStatusEnum::ACTIVE);
                    }
                }

                // Supprimer l'échange
                $this->em->remove($exchange);
            });
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Erreur lors de l\'annulation de l\'échange',
                'details' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json([
            'success' => true,
            'message' => 'Demande d\'échange annulée avec succès'
        ]);
    }

    /**
     * Lister les demandes reçues
     */
    #[Route('/received', name: 'exchange_received', methods: ['GET'])]
    public function received(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $status = $request->query->get('status');
        $limit = $request->query->getInt('limit', 10);

        if ($status) {
            try {
                $statusEnum = ExchangeStatusEnum::from($status);
                $exchanges = $this->exchangeRepository->findReceivedByStatus($user, $statusEnum, $limit);
            } catch (\ValueError $e) {
                return $this->json(['error' => 'Statut invalide'], Response::HTTP_BAD_REQUEST);
            }
        } else {
            $exchanges = $this->exchangeRepository->findLatestReceivedRequests($user, $limit);
        }

        return $this->json([
            'success' => true,
            'data' => array_map(fn($e) => $this->serializeExchange($e), $exchanges)
        ]);
    }

    /**
     * Lister les demandes envoyées
     */
    #[Route('/sent', name: 'exchange_sent', methods: ['GET'])]
    public function sent(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $limit = $request->query->getInt('limit', 10);

        $exchanges = $this->exchangeRepository->findLatestSentRequests($user, $limit);

        return $this->json([
            'success' => true,
            'data' => array_map(fn($e) => $this->serializeExchange($e), $exchanges)
        ]);
    }

    /**
     * Lister les échanges complétés (validés)
     */
    #[Route('/completed', name: 'exchange_completed', methods: ['GET'])]
    public function completed(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $limit = $request->query->getInt('limit', 10);

        $exchanges = $this->exchangeRepository->findLatestCompletedRequests($user, $limit);

        return $this->json([
            'success' => true,
            'data' => array_map(fn($e) => $this->serializeExchange($e), $exchanges)
        ]);
    }

    /**
     * Voir le détail d'un échange
     */
    #[Route('/{id}', name: 'exchange_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->getUser();
        $exchange = $this->exchangeRepository->find($id);

        if (!$exchange) {
            return $this->json(['error' => 'Échange introuvable'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que l'utilisateur est impliqué dans l'échange
        if ($exchange->getUserRequester() !== $user && $exchange->getUserReceiver() !== $user) {
            return $this->json(['error' => 'Accès non autorisé'], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'success' => true,
            'data' => $this->serializeExchange($exchange, true)
        ]);
    }

    /**
     * Obtenir les livres disponibles d'un utilisateur pour un échange
     */
    #[Route('/{id}/available-books', name: 'exchange_available_books', methods: ['GET'])]
    public function availableBooks(int $id): JsonResponse
    {
        $user = $this->getUser();
        $exchange = $this->exchangeRepository->find($id);

        if (!$exchange) {
            return $this->json(['error' => 'Échange introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($exchange->getUserReceiver() !== $user) {
            return $this->json(['error' => 'Accès non autorisé'], Response::HTTP_FORBIDDEN);
        }

        if ($exchange->getStatus() !== ExchangeStatusEnum::PENDING) {
            return $this->json(['error' => 'Cette demande a déjà été traitée'], Response::HTTP_BAD_REQUEST);
        }

        // Récupérer les livres actifs du demandeur
        $books = $this->bookRepository->findBy([
            'user' => $exchange->getUserRequester(),
            'bookStatus' => BookStatusEnum::ACTIVE
        ]);

        return $this->json([
            'success' => true,
            'data' => array_map(fn($book) => [
                'id' => $book->getId(),
                'title' => $book->getTitle(),
                'author' => $book->getAuthor(),
                'isbn' => $book->getIsbn(),
                'coverImage' => $book->getCoverImage(),
            ], $books)
        ]);
    }

    /**
     * Sérialiser un échange pour la réponse JSON
     */
    private function serializeExchange(Exchange $exchange, bool $detailed = false): array
    {
        $data = [
            'id' => $exchange->getId(),
            'status' => $exchange->getStatus()->value,
            'exchangeType' => $exchange->getExchangeType()?->value,
            'createdAt' => $exchange->getCreatedAt()->format('c'),
            'acceptedAt' => $exchange->getAcceptedAt()?->format('c'),
            'refusedAt' => $exchange->getRefusedAt()?->format('c'),
            'bookOne' => [
                'id' => $exchange->getBookOne()->getId(),
                'title' => $exchange->getBookOne()->getTitle(),
                'author' => $exchange->getBookOne()->getAuthor(),
                'coverImage' => $exchange->getBookOne()->getCoverImage(),
            ],
            'bookTwo' => $exchange->getBookTwo() ? [
                'id' => $exchange->getBookTwo()->getId(),
                'title' => $exchange->getBookTwo()->getTitle(),
                'author' => $exchange->getBookTwo()->getAuthor(),
                'coverImage' => $exchange->getBookTwo()->getCoverImage(),
            ] : null,
        ];

        if ($detailed) {
            $data['userRequester'] = [
                'id' => $exchange->getUserRequester()->getId(),
                'username' => $exchange->getUserRequester()->getUsername(),
                'email' => $exchange->getUserRequester()->getEmail(),
            ];
            $data['userReceiver'] = [
                'id' => $exchange->getUserReceiver()->getId(),
                'username' => $exchange->getUserReceiver()->getUsername(),
                'email' => $exchange->getUserReceiver()->getEmail(),
            ];
        } else {
            $data['userRequester'] = [
                'id' => $exchange->getUserRequester()->getId(),
                'username' => $exchange->getUserRequester()->getUsername(),
            ];
            $data['userReceiver'] = [
                'id' => $exchange->getUserReceiver()->getId(),
                'username' => $exchange->getUserReceiver()->getUsername(),
            ];
        }

        return $data;
    }
}