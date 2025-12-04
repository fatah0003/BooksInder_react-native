<?php

namespace App\Entity;

use App\Enum\NotificationTypeEnum;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ORM\Table(name: 'notification')]
class Notification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['notification:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'Le destinataire est requis')]
    #[Groups(['notification:read'])]
    private ?User $user = null;

    #[ORM\Column(enumType: NotificationTypeEnum::class)]
    #[Assert\NotNull(message: 'Le type de notification est requis')]
    #[Groups(['notification:read'])]
    private NotificationTypeEnum $type;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le titre est requis')]
    #[Assert\Length(
        min: 1,
        max: 255,
        maxMessage: 'Le titre ne peut pas dépasser {{ limit }} caractères'
    )]
    #[Groups(['notification:read'])]
    private string $title;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['notification:read'])]
    private ?array $data = null;

    #[ORM\Column]
    #[Assert\NotNull]
    #[Groups(['notification:read'])]
    private bool $isRead = false;

    #[ORM\Column]
    #[Assert\NotNull]
    #[Groups(['notification:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct(User $user, NotificationTypeEnum $type, string $title, ?array $data = null)
    {
        $this->user = $user;
        $this->type = $type;
        $this->title = $title;
        $this->data = $data;
        $this->isRead = false;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function getType(): NotificationTypeEnum { return $this->type; }
    public function getTitle(): string { return $this->title; }
    public function getData(): ?array { return $this->data; }
    public function isRead(): bool { return $this->isRead; }
    public function setRead(bool $read): self { $this->isRead = $read; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
