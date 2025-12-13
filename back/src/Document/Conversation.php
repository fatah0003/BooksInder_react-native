<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: 'conversations')]
#[ODM\Index(keys: ['participants' => 'asc', 'lastMessageAt' => -1])]
class Conversation
{
    #[ODM\Id]
    private ?string $id = null;

    /** @var string[] UUID des 2 participants */
    #[ODM\Field(type: 'collection')]
    private array $participants = [];

    #[ODM\Field(type: 'int', nullable: true)]
    private ?int $exchangeId = null;

    #[ODM\Field(type: 'string', nullable: true)]
    private ?string $exchangeUuid = null;

    #[ODM\Field(type: 'string', nullable: true)]
    private ?string $lastMessage = null;

    #[ODM\Field(type: 'date', nullable: true)]
    private ?\DateTimeInterface $lastMessageAt = null;

    #[ODM\Field(type: 'date')]
    private \DateTime $createdAt;

    public function __construct(array $participants = [], ?int $exchangeId = null, ?string $exchangeUuid = null)
    {
        $this->participants = $participants;
        $this->exchangeId = $exchangeId;
        $this->exchangeUuid = $exchangeUuid;
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getParticipants(): array
    {
        return $this->participants;
    }
    public function setParticipants(array $participants): self
    {
        $this->participants = $participants;
        return $this;
    }

    public function getExchangeId(): ?int
    {
        return $this->exchangeId;
    }
    public function setExchangeId(?int $exchangeId): self
    {
        $this->exchangeId = $exchangeId;
        return $this;
    }

    public function getExchangeUuid(): ?string
    {
        return $this->exchangeUuid;
    }
    public function setExchangeUuid(?string $exchangeUuid): self
    {
        $this->exchangeUuid = $exchangeUuid;
        return $this;
    }

    public function getLastMessage(): ?string
    {
        return $this->lastMessage;
    }
    public function setLastMessage(?string $lastMessage): self
    {
        $this->lastMessage = $lastMessage;
        return $this;
    }

    public function getLastMessageAt(): ?\DateTimeInterface
    {
        return $this->lastMessageAt;
    }
    public function setLastMessageAt(?\DateTimeInterface $lastMessageAt): self
    {
        $this->lastMessageAt = $lastMessageAt;
        return $this;
    }

    public function getCreatedAt(): \DateTime
    {
        return $this->createdAt;
    }
}
