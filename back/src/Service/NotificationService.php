<?php
namespace App\Service;

use App\Enum\NotificationTypeEnum;
use App\Entity\Exchange;
use App\Entity\Notification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class NotificationService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    public function createNotification(UserInterface $user, NotificationTypeEnum $type, string $title, ?array $data = null): Notification
    {
        $notification = new Notification($user, $type, $title, $data);
        $this->em->persist($notification);
//        $this->em->flush();

        return $notification;
    }

    // helpers métier
    public function notifyExchangeRequestReceived(Exchange $exchange): Notification
    {
        $owner = $exchange->getUserReceiver();
        $title = "Nouvelle demande pour : " . $exchange->getBookOne()->getTitle();
        $data = [
            'exchangeId' => $exchange->getId(),
            'bookId' => $exchange->getBookOne()->getId(),
            'requesterId' => $exchange->getUserRequester()->getId()
        ];
        return $this->createNotification($owner, NotificationTypeEnum::EXCHANGE_REQUEST, $title, $data);
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
        return $this->createNotification($requester, NotificationTypeEnum::EXCHANGE_ACCEPTED, $title, $data);
    }

    public function notifyExchangeRejected(Exchange $exchange): Notification
    {
        $requester = $exchange->getUserRequester();
        $title = "Votre demande a été refusée pour : " . $exchange->getBookOne()->getTitle();
        $data = ['exchangeId' => $exchange->getId()];
        return $this->createNotification($requester, NotificationTypeEnum::EXCHANGE_REJECTED, $title, $data);
    }

    public function notifyExchangeCancelled(Exchange $exchange): Notification
    {
        $owner = $exchange->getUserReceiver();
        $title = "Une demande d'échange a été annulée pour : " . $exchange->getBookOne()->getTitle();
        $data = ['exchangeId' => $exchange->getId()];
        return $this->createNotification($owner, NotificationTypeEnum::EXCHANGE_CANCELLED, $title, $data);
    }

    public function markAllAsRead(UserInterface $user): int
    {
        $qb = $this->em->createQueryBuilder();

        // Mise à jour en masse
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


    // possibilité d'ajouter notifyMessageReceived() etc.
}
