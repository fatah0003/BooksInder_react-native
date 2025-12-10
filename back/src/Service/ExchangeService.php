<?php

namespace App\Service;

use App\DTO\Exchange\AcceptExchangeDTO;
use App\DTO\Exchange\CreateExchangeDTO;
use App\Entity\Exchange;
use App\Entity\User;
use App\Enum\BookStatusEnum;
use App\Enum\ExchangeStatusEnum;
use App\Enum\ExchangeTypeEnum;
use App\Exception\BusinessValidationException;
use App\Exception\UnauthorizedActionException;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use App\Service\ChatService;

class ExchangeService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly BookRepository $bookRepository,
        private readonly NotificationService $notificationService,
        private readonly LoggerInterface $logger,
        private readonly ChatService $chatService,
    ) {}

    /**
     * Crée une demande d'échange
     */
    public function createExchange(User $requester, CreateExchangeDTO $dto): Exchange
    {
        // Récupérer le livre demandé
        $bookOne = $this->bookRepository->find($dto->bookOneId);

        if (!$bookOne) {
            throw new BusinessValidationException('Livre introuvable');
        }

        // Vérifications métier
        if ($bookOne->getUser() === $requester) {
            throw new BusinessValidationException('Vous ne pouvez pas demander un échange avec votre propre livre');
        }

        if ($bookOne->getBookStatus() !== BookStatusEnum::ACTIVE) {
            throw new BusinessValidationException('Ce livre n\'est pas disponible pour un échange');
        }

        //Récupérer automatiquement le receiver via le propriétaire du livre
        $receiver = $bookOne->getUser();

        // Créer l'échange
        $exchange = new Exchange();
        $exchange->setUserRequester($requester);
        $exchange->setUserReceiver($receiver);  // Automatique !
        $exchange->setBookOne($bookOne);
        $exchange->setStatus(ExchangeStatusEnum::PENDING);
        // exchangeType et bookTwo restent null jusqu'à l'acceptation

        $this->em->persist($exchange);
        $this->em->flush();

        // Notification au propriétaire du livre
        try {
            $this->notificationService->notifyExchangeRequestReceived($exchange);
        } catch (\Exception $e) {
            $this->logger->warning('Échec notification demande échange', [
                'exchangeId' => $exchange->getId(),
                'error' => $e->getMessage()
            ]);
        }

        $this->logger->info('Demande d\'échange créée', [
            'exchangeId' => $exchange->getId(),
            'requesterId' => $requester->getId(),
            'receiverId' => $receiver->getId()
        ]);

        return $exchange;
    }


    /**
     * Accepte une demande d'échange
     */
    public function acceptExchange(Exchange $exchange, User $user, AcceptExchangeDTO $dto): Exchange
    {
        // TOUTES les validations AVANT la transaction
        if ($exchange->getUserReceiver() !== $user) {
            throw new UnauthorizedActionException('Vous n\'êtes pas autorisé à accepter cette demande');
        }

        if ($exchange->getStatus() !== ExchangeStatusEnum::PENDING) {
            throw new BusinessValidationException('Cette demande a déjà été traitée');
        }

        $bookTwo = $this->bookRepository->find($dto->bookTwoId);
        if (!$bookTwo) {
            throw new BusinessValidationException('Livre sélectionné introuvable');
        }

        if ($bookTwo->getUser() !== $exchange->getUserRequester()) {
            throw new BusinessValidationException('Le livre sélectionné n\'appartient pas au demandeur');
        }

        if ($bookTwo->getBookStatus() !== BookStatusEnum::ACTIVE) {
            throw new BusinessValidationException('Le livre sélectionné n\'est pas disponible');
        }

        try {
            $exchangeType = ExchangeTypeEnum::from($dto->exchangeType);
        } catch (\ValueError $e) {
            throw new BusinessValidationException('Type d\'échange invalide');
        }

        // Transaction UNIQUEMENT pour les opérations base de données
        try {
            $this->em->wrapInTransaction(function () use ($exchange, $bookTwo, $exchangeType) {
                $exchange->setBookTwo($bookTwo);
                $exchange->setExchangeType($exchangeType);
                $exchange->setStatus(ExchangeStatusEnum::VALIDATED);
                $exchange->setAcceptedAt(new \DateTimeImmutable());

                // Mise à jour du statut des livres
                $exchange->getBookOne()->setBookStatus(BookStatusEnum::UNAVAILABLE);
                $bookTwo->setBookStatus(BookStatusEnum::UNAVAILABLE);
            });
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de l\'acceptation de l\'échange', [
                'exchangeId' => $exchange->getId(),
                'error' => $e->getMessage()
            ]);
            throw new \RuntimeException('Erreur lors de la validation de l\'échange', 0, $e);
        }

        // Création / récupération de la conversation après validation
        try {
            $this->chatService->createConversationFromExchange($exchange->getId());
        } catch (\Throwable $e) {
            $this->logger->error('Erreur lors de la création de la conversation de chat', [
                'exchangeId' => $exchange->getId(),
                'error' => $e->getMessage(),
            ]);
            // on log seulement, on ne casse pas l’acceptation de l’échange
        }

        // Notification APRÈS la transaction réussie
        try {
            $this->notificationService->notifyExchangeAccepted($exchange);
        } catch (\Exception $e) {
            // Log l'erreur mais ne bloque pas l'acceptation
            $this->logger->warning('Échec notification acceptation échange', [
                'exchangeId' => $exchange->getId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        $this->logger->info('Échange accepté', ['exchangeId' => $exchange->getId()]);

        return $exchange;
    }

    /**
     * Refuse une demande d'échange
     */
    public function rejectExchange(Exchange $exchange, User $user): Exchange
    {
        if ($exchange->getUserReceiver() !== $user) {
            throw new UnauthorizedActionException('Vous n\'êtes pas autorisé à refuser cette demande');
        }

        if ($exchange->getStatus() !== ExchangeStatusEnum::PENDING) {
            throw new BusinessValidationException('Cette demande a déjà été traitée');
        }

        $exchange->setStatus(ExchangeStatusEnum::REJECTED);
        $exchange->setRefusedAt(new \DateTimeImmutable());

        $this->em->flush();

        try {
            $this->notificationService->notifyExchangeRejected($exchange);
        } catch (\Exception $e) {
            $this->logger->warning('Échec notification refus échange', [
                'exchangeId' => $exchange->getId(),
                'error' => $e->getMessage()
            ]);
        }

        $this->logger->info('Échange refusé', ['exchangeId' => $exchange->getId()]);

        return $exchange;
    }

    /**
     * Annule une demande d'échange
     */
    public function cancelExchange(Exchange $exchange, User $user): void
    {
        if ($exchange->getUserRequester() !== $user) {
            throw new UnauthorizedActionException('Vous n\'êtes pas autorisé à annuler cette demande');
        }

        if ($exchange->getStatus() === ExchangeStatusEnum::REJECTED) {
            throw new BusinessValidationException('Impossible d\'annuler une demande déjà refusée');
        }

        $exchangeId = $exchange->getId();
        $status = $exchange->getStatus();

        try {
            $this->em->wrapInTransaction(function () use ($exchange) {
                // Si validé, remettre les livres en disponible
                if ($exchange->getStatus() === ExchangeStatusEnum::VALIDATED) {
                    if ($exchange->getBookOne()) {
                        $exchange->getBookOne()->setBookStatus(BookStatusEnum::ACTIVE);
                    }
                    if ($exchange->getBookTwo()) {
                        $exchange->getBookTwo()->setBookStatus(BookStatusEnum::ACTIVE);
                    }
                }

                $this->em->remove($exchange);
            });
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de l\'annulation de l\'échange', [
                'exchangeId' => $exchangeId,
                'error' => $e->getMessage()
            ]);
            throw new \RuntimeException('Erreur lors de l\'annulation de l\'échange', 0, $e);
        }

        // Notification APRÈS la suppression (si c'était en attente)
        if ($status === ExchangeStatusEnum::PENDING) {
            try {
                $this->notificationService->notifyExchangeCancelled($exchange);
            } catch (\Exception $e) {
                $this->logger->warning('Échec notification annulation échange', [
                    'exchangeId' => $exchangeId,
                    'error' => $e->getMessage()
                ]);
            }
        }


        $this->logger->info('Échange annulé', ['exchangeId' => $exchangeId]);
    }

    /**
     * Récupère les livres disponibles du demandeur
     */
    public function getAvailableBooks(Exchange $exchange, User $user): array
    {
        if ($exchange->getUserReceiver() !== $user) {
            throw new UnauthorizedActionException('Accès non autorisé');
        }

        if ($exchange->getStatus() !== ExchangeStatusEnum::PENDING) {
            throw new BusinessValidationException('Cette demande a déjà été traitée');
        }

        return $this->bookRepository->findBy([
            'user' => $exchange->getUserRequester(),
            'bookStatus' => BookStatusEnum::ACTIVE
        ]);
    }
}
