<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: 'messages')]
#[ODM\Index(keys: ['conversationId' => 'asc', 'createdAt' => -1])]
class Message
{
    #[ODM\Id]
    private ?string $id = null;

    #[ODM\Field(type: 'string')]
    private string $conversationId;

    #[ODM\Field(type: 'string')]
    private string $senderUuid;

    #[ODM\Field(type: 'string')]
    private string $content;

    #[ODM\Field(type: 'date')]
    private \DateTime $createdAt;

    /** @var string[] */
    #[ODM\Field(type: 'collection')]
    private array $readBy = [];

    public function __construct(string $conversationId, string $senderUuid, string $content)
    {
        $this->conversationId = $conversationId;
        $this->senderUuid = $senderUuid;
        $this->content = $content;
        $this->createdAt = new \DateTime();
        $this->readBy = [];
    }

    public function getId(): ?string
    {
        return $this->id;
    }
    public function getConversationId(): string
    {
        return $this->conversationId;
    }
    public function getSenderUuid(): string
    {
        return $this->senderUuid;
    }
    public function getContent(): string
    {
        return $this->content;
    }
    public function getCreatedAt(): \DateTime
    {
        return $this->createdAt;
    }
    public function getReadBy(): array
    {
        return $this->readBy;
    }

    public function addReadBy(string $uuid): self
    {
        if (!in_array($uuid, $this->readBy, true)) {
            $this->readBy[] = $uuid;
        }
        return $this;
    }
}
