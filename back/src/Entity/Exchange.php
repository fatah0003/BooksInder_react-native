<?php

namespace App\Entity;

use App\Enum\ExchangeStatusEnum;
use App\Enum\ExchangeTypeEnum;
use App\Repository\ExchangeRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ExchangeRepository::class)]
class Exchange
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'exchangeRequest')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $userRequester = null;

    #[ORM\ManyToOne(inversedBy: 'exchangeReceive')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $userReceiver = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Book $bookOne = null;

    #[ORM\ManyToOne]
    private ?Book $bookTwo = null;

    #[ORM\Column(enumType: ExchangeStatusEnum::class)]
    private ?ExchangeStatusEnum $status = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $acceptedAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $refusedAt = null;

    #[ORM\Column(nullable: true, enumType: ExchangeTypeEnum::class)]
    private ?ExchangeTypeEnum $exchangeType = null;

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
}
