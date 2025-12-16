<?php

namespace App\Entity;

use App\Repository\PasswordResetTokenRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PasswordResetTokenRepository::class)]
#[ORM\Table(name: 'password_reset_tokens')]
#[ORM\Index(columns: ['token'], name: 'idx_token')]
#[ORM\Index(columns: ['expires_at'], name: 'idx_expires_at')]
class PasswordResetToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(length: 64, unique: true)]
    private string $token;

    #[ORM\Column]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private bool $used = false;

    public function __construct(User $user, string $token, int $expirationMinutes = 30)
    {
        $this->user = $user;
        $this->token = $token;
        $this->createdAt = new \DateTimeImmutable();
        $this->expiresAt = new \DateTimeImmutable("+{$expirationMinutes} minutes");
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function isExpired(): bool
    {
        return new \DateTimeImmutable() > $this->expiresAt;
    }

    public function isUsed(): bool
    {
        return $this->used;
    }

    public function markAsUsed(): self
    {
        $this->used = true;
        return $this;
    }

    public function isValid(): bool
    {
        return !$this->isExpired() && !$this->isUsed();
    }
}
