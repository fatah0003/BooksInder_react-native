<?php
namespace App\Entity;

use App\Enum\NotificationTypeEnum;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

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
    #[Groups(['notification:read'])]
    private ?User $user = null; // destinataire

    #[ORM\Column(enumType: NotificationTypeEnum::class)]
    #[Groups(['notification:read'])]
    private NotificationTypeEnum $type;

    #[ORM\Column(length: 255)]
    #[Groups(['notification:read'])]
    private string $title;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['notification:read'])]
    private ?array $data = null; // payload (ids, messages, etc.)

    #[ORM\Column]
    #[Groups(['notification:read'])]
    private bool $isRead = false;

    #[ORM\Column]
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

    // getters & setters (essentiels)
    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function getType(): NotificationTypeEnum { return $this->type; }
    public function getTitle(): string { return $this->title; }
    public function getData(): ?array { return $this->data; }
    public function isRead(): bool { return $this->isRead; }
    public function setRead(bool $read): self { $this->isRead = $read; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
