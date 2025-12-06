<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Exception\UnauthorizedActionException;
use App\Repository\NotificationRepository;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notifications')]
#[IsGranted('ROLE_USER')]
class NotificationController extends AbstractController
{
    public function __construct(
        private readonly NotificationRepository $repo,
        private readonly EntityManagerInterface $em,
        private readonly NotificationService $notificationService
    ) {}

    #[Route('', name: 'notification_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $limit = $request->query->getInt('limit', 20);
        $onlyUnread = $request->query->getBoolean('unread', false);

        $criteria = ['user' => $user];
        if ($onlyUnread) {
            $criteria['isRead'] = false;
        }

        $notifications = $this->repo->findBy(
            $criteria,
            ['createdAt' => 'DESC'],
            $limit
        );

        return $this->json([
            'success' => true,
            'count' => count($notifications),
            'data' => $notifications
        ], 200, [], ['groups' => 'notification:read']);
    }

    #[Route('/unread-count', name: 'notification_unread_count', methods: ['GET'])]
    public function unreadCount(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $count = $this->repo->count(['user' => $user, 'isRead' => false]);

        return $this->json([
            'success' => true,
            'unreadCount' => $count
        ]);
    }

    #[Route('/{id}/read', name: 'notification_mark_read', methods: ['PATCH'])]
    public function markRead(Notification $notification): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($notification->getUser() !== $user) {
            throw new UnauthorizedActionException('Accès non autorisé');
        }

        $notification->setRead(true);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Notification marquée comme lue'
        ]);
    }

    #[Route('/mark-all-read', name: 'notification_mark_all_read', methods: ['PATCH'])]
    public function markAllRead(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $count = $this->notificationService->markAllAsRead($user);

        return $this->json([
            'success' => true,
            'message' => "{$count} notification(s) marquée(s) comme lue(s)",
            'markedCount' => $count
        ]);
    }

    #[Route('/{id}', name: 'notification_delete', methods: ['DELETE'])]
    public function delete(Notification $notification): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($notification->getUser() !== $user) {
            throw new UnauthorizedActionException('Accès non autorisé');
        }

        $this->em->remove($notification);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Notification supprimée'
        ]);
    }

    #[Route('/clear-read', name: 'notification_clear_read', methods: ['DELETE'])]
    public function clearRead(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $qb = $this->em->createQueryBuilder();
        $count = $qb->delete(Notification::class, 'n')
            ->where('n.user = :user')
            ->andWhere('n.isRead = true')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();

        return $this->json([
            'success' => true,
            'message' => "{$count} notification(s) supprimée(s)",
            'deletedCount' => $count
        ]);
    }

    #[Route('/{id}', name: 'notification_show', methods: ['GET'])]
    public function show(Notification $notification): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($notification->getUser() !== $user) {
            throw new UnauthorizedActionException('Accès non autorisé');
        }

        // Marquer comme lue automatiquement
        if (!$notification->isRead()) {
            $notification->setRead(true);
            $this->em->flush();
        }

        return $this->json([
            'success' => true,
            'data' => $notification
        ], 200, [], ['groups' => 'notification:read']);
    }
}
