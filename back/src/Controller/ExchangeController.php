<?php

namespace App\Controller;

use App\DTO\Exchange\AcceptExchangeDTO;
use App\DTO\Exchange\CreateExchangeDTO;
use App\Entity\Exchange;
use App\Enum\ExchangeStatusEnum;
use App\Service\ExchangeService;
use App\Repository\ExchangeRepository;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/exchanges')]
#[IsGranted('ROLE_USER')]
class ExchangeController extends AbstractController
{
    public function __construct(
        private readonly ExchangeService $exchangeService,
        private readonly ExchangeRepository $exchangeRepository,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly LoggerInterface $logger
    ) {}

    /**
     * Créer une demande d'échange
     */
    #[Route('', name: 'exchange_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
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

        } catch (\InvalidArgumentException $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);

        } catch (\Exception $e) {
            $this->logger->error('Erreur création échange', ['error' => $e->getMessage()]);
            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Accepter une demande
     */
    #[Route('/{id}/accept', name: 'exchange_accept', methods: ['PUT'])]
    public function accept(Exchange $exchange, Request $request): JsonResponse
    {
        try {
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

            // ✅ Utilisation des serialization groups
            return $this->json([
                'success' => true,
                'message' => 'Demande acceptée avec succès',
                'data' => $exchange
            ], 200, [], ['groups' => 'exchange:detail']);

        } catch (AccessDeniedHttpException $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], Response::HTTP_FORBIDDEN);

        } catch (\InvalidArgumentException $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);

        } catch (\RuntimeException $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);

        } catch (\Exception $e) {
            $this->logger->error('Erreur acceptation échange', ['error' => $e->getMessage()]);
            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Refuser une demande
     */
    #[Route('/{id}/reject', name: 'exchange_reject', methods: ['PUT'])]
    public function reject(Exchange $exchange): JsonResponse
    {
        try {
            $exchange = $this->exchangeService->rejectExchange($exchange, $this->getUser());

            // ✅ Retourner l'entité sérialisée
            return $this->json([
                'success' => true,
                'message' => 'Demande refusée',
                'data' => $exchange
            ], 200, [], ['groups' => 'exchange:read']);

        } catch (AccessDeniedHttpException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            $this->logger->error('Erreur refus échange', ['error' => $e->getMessage()]);
            return $this->json(['success' => false, 'error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Annuler une demande
     */
    #[Route('/{id}/cancel', name: 'exchange_cancel', methods: ['DELETE'])]
    public function cancel(Exchange $exchange): JsonResponse
    {
        try {
            $this->exchangeService->cancelExchange($exchange, $this->getUser());

            return $this->json([
                'success' => true,
                'message' => 'Demande annulée avec succès'
            ]);

        } catch (AccessDeniedHttpException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\RuntimeException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        } catch (\Exception $e) {
            $this->logger->error('Erreur annulation échange', ['error' => $e->getMessage()]);
            return $this->json(['success' => false, 'error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Liste demandes reçues
     */
    #[Route('/received', name: 'exchange_received', methods: ['GET'])]
    public function received(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $status = $request->query->get('status');
        $limit = $request->query->getInt('limit', 10);

        try {
            if ($status) {
                $statusEnum = ExchangeStatusEnum::from($status);
                $exchanges = $this->exchangeRepository->findReceivedByStatus($user, $statusEnum, $limit);
            } else {
                $exchanges = $this->exchangeRepository->findLatestReceivedRequests($user, $limit);
            }

            return $this->json([
                'success' => true,
                'data' => $exchanges
            ], 200, [], ['groups' => 'exchange:read']);

        } catch (\ValueError $e) {
            return $this->json(['success' => false, 'error' => 'Statut invalide'], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Liste demandes envoyées
     */
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

    /**
     * Liste échanges complétés
     */
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

    /**
     * Détail d'un échange
     */
    #[Route('/{id}', name: 'exchange_show', methods: ['GET'])]
    public function show(Exchange $exchange): JsonResponse
    {
        $user = $this->getUser();

        if ($exchange->getUserRequester() !== $user && $exchange->getUserReceiver() !== $user) {
            return $this->json([
                'success' => false,
                'error' => 'Accès non autorisé'
            ], Response::HTTP_FORBIDDEN);
        }

        // ✅ Groupe 'exchange:detail' pour plus d'infos
        return $this->json([
            'success' => true,
            'data' => $exchange
        ], 200, [], ['groups' => 'exchange:detail']);
    }

    /**
     * Livres disponibles pour l'échange
     */
    #[Route('/{id}/available-books', name: 'exchange_available_books', methods: ['GET'])]
    public function availableBooks(Exchange $exchange): JsonResponse
    {
        try {
            $books = $this->exchangeService->getAvailableBooks($exchange, $this->getUser());

            // ✅ Utiliser les groups book:read
            return $this->json([
                'success' => true,
                'data' => $books
            ], 200, [], ['groups' => 'book:read']);

        } catch (AccessDeniedHttpException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }
}
