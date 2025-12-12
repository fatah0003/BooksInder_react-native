<?php

namespace App\Controller;

use App\Document\Conversation;
use App\Document\Message;
use App\Entity\User;
use App\Service\ChatService;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/chat', name: 'api_chat_')]
class ChatController extends AbstractController
{
    public function __construct(
        private readonly ChatService $chatService,
        private readonly DocumentManager $dm,
    ) {}

    #[Route('/conversations', name: 'list_conversations', methods: ['GET'])]
    public function listConversations(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'error' => 'Non authentifié'], 401);
        }

        $conversations = $this->dm
            ->getRepository(Conversation::class)
            ->findBy(
                ['participants' => $user->getUuid()],
                ['lastMessageAt' => 'desc']
            );

        return $this->json([
            'success' => true,
            'data' => array_map(static function (Conversation $c) {
                return [
                    'id' => $c->getId(),
                    'participants' => $c->getParticipants(),
                    'exchangeId' => $c->getExchangeId(),
                    'exchangeUuid' => $c->getExchangeUuid(),
                    'lastMessage' => $c->getLastMessage(),
                    'lastMessageAt' => $c->getLastMessageAt()?->format(\DateTimeInterface::ATOM),
                    'createdAt' => $c->getCreatedAt()->format(\DateTimeInterface::ATOM),
                ];
            }, $conversations),
        ]);
    }

    #[Route('/conversations/{id}/messages', name: 'get_messages', methods: ['GET'])]
    public function getMessages(string $id, Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'error' => 'Non authentifié'], 401);
        }

        /** @var Conversation|null $conversation */
        $conversation = $this->dm->getRepository(Conversation::class)->find($id);
        if (!$conversation) {
            return $this->json(['success' => false, 'error' => 'Conversation introuvable'], 404);
        }

        if (!in_array($user->getUuid(), $conversation->getParticipants(), true)) {
            return $this->json(['success' => false, 'error' => 'Accès refusé'], 403);
        }

        $page = max(1, (int) $request->query->get('page', '1'));
        $limit = min(50, (int) $request->query->get('limit', '20'));
        $skip = ($page - 1) * $limit;

        $messages = $this->dm
            ->getRepository(Message::class)
            ->findBy(
                ['conversationId' => $id],
                ['createdAt' => 'ASC'],
                $limit,
                $skip
            );

        return $this->json([
            'success' => true,
            'data' => array_map(static function (Message $m) {
                return [
                    'id' => $m->getId(),
                    'conversationId' => $m->getConversationId(),
                    'senderUuid' => $m->getSenderUuid(),
                    'content' => $m->getContent(),
                    'createdAt' => $m->getCreatedAt()->format(\DateTimeInterface::ATOM),
                ];
            }, $messages),
        ]);
    }

    #[Route('/conversations/{id}/messages', name: 'post_message', methods: ['POST'])]
    public function postMessage(string $id, Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'error' => 'Non authentifié'], 401);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $content = isset($data['content']) ? trim((string) $data['content']) : '';

        if ($content === '') {
            return $this->json(['success' => false, 'error' => 'Le message est vide'], 400);
        }

        try {
            $message = $this->chatService->postMessage($id, $user->getUuid(), $content);
        } catch (\RuntimeException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], 400);
        }

        return $this->json([
            'success' => true,
            'data' => [
                'id' => $message->getId(),
                'conversationId' => $message->getConversationId(),
                'senderUuid' => $message->getSenderUuid(),
                'content' => $message->getContent(),
                'createdAt' => $message->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ],
        ], 201);
    }
}
