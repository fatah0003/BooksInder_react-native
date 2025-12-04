<?php

namespace App\Entity;

use App\Enum\ExchangeStatusEnum;
use App\Enum\ExchangeTypeEnum;
use App\Repository\ExchangeRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ExchangeRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Exchange
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'exchangeRequest')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le demandeur est requis')]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?User $userRequester = null;

    #[ORM\ManyToOne(inversedBy: 'exchangeReceive')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le destinataire est requis')]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?User $userReceiver = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le premier livre est requis')]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?Book $bookOne = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?Book $bookTwo = null;

    #[ORM\Column(enumType: ExchangeStatusEnum::class)]
    #[Assert\NotNull]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?ExchangeStatusEnum $status = null;

    #[ORM\Column]
    #[Assert\NotNull]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?\DateTimeImmutable $acceptedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?\DateTimeImmutable $refusedAt = null;

    #[ORM\Column(nullable: true, enumType: ExchangeTypeEnum::class)]
    #[Groups(['exchange:read', 'exchange:detail'])]
    private ?ExchangeTypeEnum $exchangeType = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->status = ExchangeStatusEnum::PENDING;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserRequester(): ?User
    {
        return $this->userRequester;
    }

    public function setUserRequester(?User $userRequester): static
    {
        $this->userRequester = $userRequester;

        return $this;
    }

    public function getUserReceiver(): ?User
    {
        return $this->userReceiver;
    }

    public function setUserReceiver(?User $userReceiver): static
    {
        $this->userReceiver = $userReceiver;

        return $this;
    }

    public function getBookOne(): ?Book
    {
        return $this->bookOne;
    }

    public function setBookOne(?Book $bookOne): static
    {
        $this->bookOne = $bookOne;

        return $this;
    }

    public function getBookTwo(): ?Book
    {
        return $this->bookTwo;
    }

    public function setBookTwo(?Book $bookTwo): static
    {
        $this->bookTwo = $bookTwo;

        return $this;
    }

    public function getStatus(): ?ExchangeStatusEnum
    {
        return $this->status;
    }

    public function setStatus(ExchangeStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getAcceptedAt(): ?\DateTimeImmutable
    {
        return $this->acceptedAt;
    }

    public function setAcceptedAt(?\DateTimeImmutable $acceptedAt): static
    {
        $this->acceptedAt = $acceptedAt;

        return $this;
    }

    public function getRefusedAt(): ?\DateTimeImmutable
    {
        return $this->refusedAt;
    }

    public function setRefusedAt(?\DateTimeImmutable $refusedAt): static
    {
        $this->refusedAt = $refusedAt;

        return $this;
    }

    public function getExchangeType(): ?ExchangeTypeEnum
    {
        return $this->exchangeType;
    }

    public function setExchangeType(?ExchangeTypeEnum $exchangeType): static
    {
        $this->exchangeType = $exchangeType;

        return $this;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        // Mise à jour automatique des dates selon le statut
        if ($this->status === ExchangeStatusEnum::ACCEPTED && $this->acceptedAt === null) {
            $this->acceptedAt = new \DateTimeImmutable();
        }
        if ($this->status === ExchangeStatusEnum::REFUSED && $this->refusedAt === null) {
            $this->refusedAt = new \DateTimeImmutable();
        }
    }
}
