<?php

namespace App\Entity;

use App\Repository\InfosUserRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: InfosUserRepository::class)]
class InfosUser
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['infosuser:read', 'user:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 30)]
    #[Groups(['infosuser:read', 'user:read', 'infosuser:write'])]
    private ?string $userName = null;

    #[ORM\Column(length: 20)]
    #[Groups(['infosuser:read', 'user:read', 'infosuser:write'])]
    private ?string $phoneNumber = null;

    #[ORM\Column(length: 50)]
    #[Groups(['infosuser:read', 'user:read', 'infosuser:write'])]
    private ?string $city = null;

    #[ORM\Column]
    #[Groups(['infosuser:read', 'user:read', 'infosuser:write'])]
    private ?\DateTimeImmutable $birthDate = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['infosuser:read', 'user:read', 'infosuser:write'])]
    private ?string $bio = null;

    #[ORM\Column]
    #[Groups(['infosuser:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['infosuser:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToOne(inversedBy: 'infosUser', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
//    #[Groups(['infosuser:read'])]  // je vais retirer la ligne apres tests !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserName(): ?string
    {
        return $this->userName;
    }

    public function setUserName(string $userName): static
    {
        $this->userName = $userName;

        return $this;
    }

    public function getPhoneNumber(): ?string
    {
        return $this->phoneNumber;
    }

    public function setPhoneNumber(string $phoneNumber): static
    {
        $this->phoneNumber = $phoneNumber;

        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(string $city): static
    {
        $this->city = $city;

        return $this;
    }

    public function getBirthDate(): ?\DateTimeImmutable
    {
        return $this->birthDate;
    }

    public function setBirthDate(\DateTimeImmutable $birthDate): static
    {
        $this->birthDate = $birthDate;

        return $this;
    }

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): static
    {
        $this->bio = $bio;

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

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;

        return $this;
    }
}
