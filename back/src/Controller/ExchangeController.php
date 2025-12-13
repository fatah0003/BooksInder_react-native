<?php

namespace App\Controller;

use App\DTO\Exchange\AcceptExchangeDTO;
use App\DTO\Exchange\CreateExchangeDTO;
use App\Enum\ExchangeStatusEnum;
use App\Service\ExchangeService;
use App\Repository\ExchangeRepository;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use App\Exception\ResourceNotFoundException;
use App\Exception\BusinessValidationException;
use App\Exception\UnauthorizedActionException;

#[Route('/api/exchanges')]
#[IsGranted('ROLE_USER')]
class ExchangeController extends AbstractController
{
    public function __construct(
        private readonly ExchangeService $exchangeService,
        private readonly ExchangeRepository $exchangeRepository,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator
    ) {
    }

    /**
     * Créer une demande d'échange
     */
    #[Route('', name: 'exchange_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var CreateExchangeDTO $dto */
        $dto = $this->serializer->deserialize(
            $request->getContent(),
            CreateExchangeDTO::class,
            'json'
        );

        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'success' => false,
                'errors' => $errorMessages
            ], Response::HTTP_BAD_REQUEST);
        }

        $exchange = $this->exchangeService->createExchange($this->getUser(), $dto);

        return $this->json([
            'success' => true,
            'message' => 'Demande d\'échange créée avec succès',
            'data' => $exchange
        ], Response::HTTP_CREATED, [], ['groups' => 'exchange:read']);
    }

    #[Route('/{uuid}/accept', name: 'exchange_accept', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['PUT'])]
    public function accept(string $uuid, Request $request): JsonResponse
    {
        $exchange = $this->exchangeRepository->findOneByUuid($uuid);

        if (!$exchange) {
            throw new ResourceNotFoundException('Échange', $uuid);
        }

        /** @var AcceptExchangeDTO $dto */
        $dto = $this->serializer->deserialize(
            $request->getContent(),
            AcceptExchangeDTO::class,
            'json'
        );

        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'success' => false,
                'errors' => $errorMessages
            ], Response::HTTP_BAD_REQUEST);
        }

        $exchange = $this->exchangeService->acceptExchange($exchange, $this->getUser(), $dto);

        return $this->json([
            'success' => true,
            'message' => 'Demande acceptée avec succès',
            'data' => $exchange
        ], 200, [], ['groups' => 'exchange:detail']);
    }

    #[Route('/{uuid}/reject', name: 'exchange_reject', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['PUT'])]
    public function reject(string $uuid): JsonResponse
    {
        $exchange = $this->exchangeRepository->findOneByUuid($uuid);

        if (!$exchange) {
            throw new ResourceNotFoundException('Échange', $uuid);
        }

        $exchange = $this->exchangeService->rejectExchange($exchange, $this->getUser());

        return $this->json([
            'success' => true,
            'message' => 'Demande refusée',
            'data' => $exchange
        ], 200, [], ['groups' => 'exchange:read']);
    }

    #[Route('/{uuid}/cancel', name: 'exchange_cancel', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['DELETE'])]
    public function cancel(string $uuid): JsonResponse
    {
        $exchange = $this->exchangeRepository->findOneByUuid($uuid);

        if (!$exchange) {
            throw new ResourceNotFoundException('Échange', $uuid);
        }

        $this->exchangeService->cancelExchange($exchange, $this->getUser());

        return $this->json([
            'success' => true,
            'message' => 'Demande annulée avec succès'
        ]);
    }

    #[Route('/received', name: 'exchange_received', methods: ['GET'])]
    public function received(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $status = $request->query->get('status');
        $limit = $request->query->getInt('limit', 10);

        if ($status) {
            try {
                $statusEnum = ExchangeStatusEnum::from($status);
            } catch (\ValueError) {
                throw new BusinessValidationException('Statut invalide');
            }
            $exchanges = $this->exchangeRepository->findReceivedByStatus($user, $statusEnum, $limit);
        } else {
            $exchanges = $this->exchangeRepository->findLatestReceivedRequests($user, $limit);
        }

        return $this->json([
            'success' => true,
            'data' => $exchanges
        ], 200, [], ['groups' => 'exchange:read']);
    }

    #[Route('/sent', name: 'exchange_sent', methods: ['GET'])]
    public function sent(Request $request): JsonResponse
    {
        $limit = $request->query->getInt('limit', 10);
        $exchanges = $this->exchangeRepository->findLatestSentRequests($this->getUser(), $limit);

        return $this->json([
            'success' => true,
            'data' => $exchanges
        ], 200, [], ['groups' => 'exchange:read']);
    }

    #[Route('/completed', name: 'exchange_completed', methods: ['GET'])]
    public function completed(Request $request): JsonResponse
    {
        $limit = $request->query->getInt('limit', 10);
        $exchanges = $this->exchangeRepository->findLatestCompletedRequests($this->getUser(), $limit);

        return $this->json([
            'success' => true,
            'data' => $exchanges
        ], 200, [], ['groups' => 'exchange:read']);
    }

    #[Route('/{uuid}', name: 'exchange_show', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['GET'])]
    public function show(string $uuid): JsonResponse
    {
        $exchange = $this->exchangeRepository->findOneByUuid($uuid);

        if (!$exchange) {
            throw new ResourceNotFoundException('Échange', $uuid);
        }

        $user = $this->getUser();

        if ($exchange->getUserRequester() !== $user && $exchange->getUserReceiver() !== $user) {
            throw new UnauthorizedActionException('Accès non autorisé à cet échange');
        }

        return $this->json([
            'success' => true,
            'data' => $exchange
        ], 200, [], ['groups' => 'exchange:detail']);
    }

    #[Route('/{uuid}/available-books', name: 'exchange_available_books', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['GET'])]
    public function availableBooks(string $uuid): JsonResponse
    {
        $exchange = $this->exchangeRepository->findOneByUuid($uuid);

        if (!$exchange) {
            throw new ResourceNotFoundException('Échange', $uuid);
        }

        $books = $this->exchangeService->getAvailableBooks($exchange, $this->getUser());

        return $this->json([
            'success' => true,
            'data' => $books
        ], 200, [], ['groups' => 'book:read']);
    }
}
