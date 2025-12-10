<?php

namespace App\Service;

use App\Document\Conversation;
use App\Document\Message;
use App\Entity\Exchange;
use App\Enum\ExchangeStatusEnum;
use App\Repository\ExchangeRepository;
use Doctrine\ODM\MongoDB\DocumentManager;
use Psr\Log\LoggerInterface;
use App\Service\NotificationService;

class ChatService
{
    public function __construct(
        private readonly DocumentManager $dm,
        private readonly ExchangeRepository $exchangeRepository,
        private readonly NotificationService $notificationService,
        private readonly LoggerInterface $logger,
    ) {}

    public function createConversationFromExchange(int $exchangeId): Conversation
    {
        /** @var Exchange|null $exchange */
        $exchange = $this->exchangeRepository->find($exchangeId);

        if (!$exchange) {
            throw new \RuntimeException(sprintf('Échange %d introuvable', $exchangeId));
        }

        if ($exchange->getStatus() !== ExchangeStatusEnum::VALIDATED) {
            throw new \RuntimeException('La conversation ne peut être créée que si l’échange est validé.');
        }

        $existing = $this->dm
            ->getRepository(Conversation::class)
            ->findOneBy(['exchangeId' => $exchangeId]);

        if ($existing) {
            return $existing;
        }

        $userRequester = $exchange->getUserRequester();
        $userReceiver  = $exchange->getUserReceiver();

        if (!$userRequester || !$userReceiver) {
            throw new \RuntimeException('Les participants de l’échange ne sont pas définis.');
        }

        $participants = [$userRequester->getUuid(), $userReceiver->getUuid()];
        sort($participants);

        $conversation = new Conversation(
            participants: $participants,
            exchangeId: $exchange->getId(),
            exchangeUuid: $exchange->getUuid()
        );

        $this->dm->persist($conversation);
        $this->dm->flush();

        return $conversation;
    }

    public function postMessage(string $conversationId, string $senderUuid, string $content): Message
    {
        /** @var Conversation|null $conversation */
        $conversation = $this->dm->getRepository(Conversation::class)->find($conversationId);

        if (!$conversation) {
            throw new \RuntimeException('Conversation introuvable.');
        }

        if (!in_array($senderUuid, $conversation->getParticipants(), true)) {
            throw new \RuntimeException('Vous ne faites pas partie de cette conversation.');
        }

        $message = new Message($conversationId, $senderUuid, $content);

        $this->dm->persist($message);

        $conversation
            ->setLastMessage($content)
            ->setLastMessageAt($message->getCreatedAt());
        $this->dm->persist($conversation);

        $this->dm->flush();

        // Notification après succès
        try {
            $this->notificationService->notifyNewChatMessage($conversation, $message);
        } catch (\Throwable $e) {
            $this->logger->warning('Échec notification nouveau message chat', [
                'conversationId' => $conversation->getId(),
                'messageId' => $message->getId(),
                'error' => $e->getMessage(),
            ]);
        }

        return $message;
    }
}
