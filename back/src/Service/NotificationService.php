<?php
namespace App\Service;

use App\Enum\NotificationTypeEnum;
use App\Entity\Exchange;
use App\Entity\Notification;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use App\Document\Conversation;
use App\Document\Message;
use App\Repository\UserRepository;

class NotificationService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
        private readonly UserRepository $userRepository,
    ) {}

    /**
     * Crée une notification (persist uniquement, pas de flush)
     */
    public function createNotification(
        UserInterface $user,
        NotificationTypeEnum $type,
        string $title,
        ?array $data = null
    ): Notification {
        $notification = new Notification($user, $type, $title, $data);
        $this->em->persist($notification);

        return $notification;
    }

    /**
     * Sauvegarde immédiatement la notification
     */
    public function createAndFlushNotification(
        UserInterface $user,
        NotificationTypeEnum $type,
        string $title,
        ?array $data = null
    ): Notification {
        $notification = $this->createNotification($user, $type, $title, $data);
        $this->em->flush();

        $this->logger->info('Notification créée', [
            'userId' => $user->getId(),
            'type' => $type->value,
            'title' => $title
        ]);

        return $notification;
    }

    // Helpers métier - utilisent createAndFlushNotification
    public function notifyExchangeRequestReceived(Exchange $exchange): Notification
    {
        $owner = $exchange->getUserReceiver();
        $title = "Nouvelle demande pour : " . $exchange->getBookOne()->getTitle();
        $data = [
            'exchangeId' => $exchange->getId(),
            'bookId' => $exchange->getBookOne()->getId(),
            'requesterId' => $exchange->getUserRequester()->getId()
        ];

        return $this->createAndFlushNotification(
            $owner,
            NotificationTypeEnum::EXCHANGE_REQUEST,
            $title,
            $data
        );
    }

    public function notifyExchangeAccepted(Exchange $exchange): Notification
    {
        $requester = $exchange->getUserRequester();
        $title = "Votre demande a été acceptée pour : " . $exchange->getBookOne()->getTitle();
        $data = [
            'exchangeId' => $exchange->getId(),
            'bookOneId' => $exchange->getBookOne()->getId(),
            'bookTwoId' => $exchange->getBookTwo()?->getId(),
            'type' => $exchange->getExchangeType()?->value
        ];

        return $this->createAndFlushNotification(
            $requester,
            NotificationTypeEnum::EXCHANGE_ACCEPTED,
            $title,
            $data
        );
    }

    public function notifyExchangeRejected(Exchange $exchange): Notification
    {
        $requester = $exchange->getUserRequester();
        $title = "Votre demande a été refusée pour : " . $exchange->getBookOne()->getTitle();
        $data = ['exchangeId' => $exchange->getId()];

        return $this->createAndFlushNotification(
            $requester,
            NotificationTypeEnum::EXCHANGE_REJECTED,
            $title,
            $data
        );
    }

    public function notifyExchangeCancelled(Exchange $exchange): Notification
    {
        $owner = $exchange->getUserReceiver();
        $title = "Une demande d'échange a été annulée pour : " . $exchange->getBookOne()->getTitle();
        $data = ['exchangeId' => $exchange->getId()];

        return $this->createAndFlushNotification(
            $owner,
            NotificationTypeEnum::EXCHANGE_CANCELLED,
            $title,
            $data
        );
    }

    public function markAllAsRead(UserInterface $user): int
    {
        $qb = $this->em->createQueryBuilder();

        $count = $qb->update(Notification::class, 'n')
            ->set('n.isRead', ':read')
            ->where('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('read', true)
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();

        return $count;
    }

    public function notifyNewChatMessage(Conversation $conversation, Message $message): void
    {
        // Trouver le destinataire = l’autre participant
        $recipientUuid = null;
        foreach ($conversation->getParticipants() as $uuid) {
            if ($uuid !== $message->getSenderUuid()) {
                $recipientUuid = $uuid;
                break;
            }
        }

        if (!$recipientUuid) {
            return;
        }

        $recipient = $this->userRepository->findOneBy(['uuid' => $recipientUuid]);
        if (!$recipient) {
            return;
        }

        $title = "Nouveau message dans un échange de livres";
        $data = [
            'conversationId' => $conversation->getId(),
            'exchangeId' => $conversation->getExchangeId(),
            'exchangeUuid' => $conversation->getExchangeUuid(),
            'senderUuid' => $message->getSenderUuid(),
            'messageId' => $message->getId(),
        ];

        // On crée une notification interne, comme pour les échanges
        $this->createAndFlushNotification(
            $recipient,
            NotificationTypeEnum::MESSAGE_RECEIVED,
            $title,
            $data
        );
    }

}
