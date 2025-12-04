<?php

namespace App\Entity;

use App\Enum\UserStatusEnum;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[UniqueEntity(fields: ["email"], message: "Cet email est déjà utilisé.")]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read', 'exchange:read', 'exchange:detail', 'book:read:detail'])]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 180)]
    #[Groups(['user:read', 'user:write', 'exchange:detail', 'book:read:detail'])]
    private ?string $email = null;

    /**
     * @var list<string> The user roles
     */
    #[ORM\Column]
    #[Assert\NotNull]
    #[Assert\All([
        new Assert\Choice(choices: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_MODERATOR'])
    ])]
    #[Groups(['user:read'])]
    private array $roles = [];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    #[Assert\NotBlank]
    #[Assert\Length(min: 60, max: 255)]
    #[Groups(['user:write'])]
    private ?string $password = null;

    #[ORM\Column]
    #[Assert\NotNull]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToOne(mappedBy: 'user', cascade: ['persist', 'remove'])]
    #[Groups(['user:read'])]
    private ?InfosUser $infosUser = null;

    #[ORM\OneToMany(targetEntity: Book::class, mappedBy: 'user', cascade: ['persist', 'remove'])]

        // Si on veut les livres d'un user => requête dédiée
        // #[Groups(['user:read'])]
    private Collection $books;

    #[ORM\Column(enumType: UserStatusEnum::class)]
    #[Assert\NotNull]
    #[Groups(['user:read'])]
    private ?UserStatusEnum $userStatus = null;

    /**
     * @var Collection<int, Exchange>
     */
    #[ORM\OneToMany(targetEntity: Exchange::class, mappedBy: 'userRequester')]
    private Collection $exchangeRequest;

    /**
     * @var Collection<int, Exchange>
     */
    #[ORM\OneToMany(targetEntity: Exchange::class, mappedBy: 'userReceiver')]
    private Collection $exchangeReceive;

    /**
     * @var Collection<int, Favorite>
     */
    #[ORM\OneToMany(targetEntity: Favorite::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $favorites;

    public function __construct()
    {
        $this->books = new ArrayCollection();
        $this->exchangeRequest = new ArrayCollection();
        $this->exchangeReceive = new ArrayCollection();
        $this->favorites = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    #[\Deprecated]
    public function eraseCredentials(): void
    {
        // @deprecated, to be removed when upgrading to Symfony 8
    }

    public function getInfosUser(): ?InfosUser
    {
        return $this->infosUser;
    }

    public function setInfosUser(InfosUser $infosUser): static
    {
        // set the owning side of the relation if necessary
        if ($infosUser->getUser() !== $this) {
            $infosUser->setUser($this);
        }

        $this->infosUser = $infosUser;

        return $this;
    }

    public function getBooks(): Collection
    {
        return $this->books;
    }

// ajouter un livre
    public function addBook(Book $book): static
    {
        if (!$this->books->contains($book)) {
            $this->books->add($book);
            $book->setUser($this);
        }
        return $this;
    }

// supprimer un livre
    public function removeBook(Book $book): static
    {
        if ($this->books->removeElement($book)) {
            if ($book->getUser() === $this) {
                $book->setUser(null);
            }
        }
        return $this;
    }

    public function getUserStatus(): ?UserStatusEnum
    {
        return $this->userStatus;
    }

    public function setUserStatus(UserStatusEnum $userStatus): static
    {
        $this->userStatus = $userStatus;

        return $this;
    }

    /**
     * @return Collection<int, Exchange>
     */
    public function getExchangeRequest(): Collection
    {
        return $this->exchangeRequest;
    }

    public function addExchangeRequest(Exchange $exchangeRequest): static
    {
        if (!$this->exchangeRequest->contains($exchangeRequest)) {
            $this->exchangeRequest->add($exchangeRequest);
            $exchangeRequest->setUserRequester($this);
        }

        return $this;
    }

    public function removeExchangeRequest(Exchange $exchangeRequest): static
    {
        if ($this->exchangeRequest->removeElement($exchangeRequest)) {
            // set the owning side to null (unless already changed)
            if ($exchangeRequest->getUserRequester() === $this) {
                $exchangeRequest->setUserRequester(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Exchange>
     */
    public function getExchangeReceive(): Collection
    {
        return $this->exchangeReceive;
    }

    public function addExchangeReceive(Exchange $exchangeReceive): static
    {
        if (!$this->exchangeReceive->contains($exchangeReceive)) {
            $this->exchangeReceive->add($exchangeReceive);
            $exchangeReceive->setUserReceiver($this);
        }

        return $this;
    }

    public function removeExchangeReceive(Exchange $exchangeReceive): static
    {
        if ($this->exchangeReceive->removeElement($exchangeReceive)) {
            // set the owning side to null (unless already changed)
            if ($exchangeReceive->getUserReceiver() === $this) {
                $exchangeReceive->setUserReceiver(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Favorite>
     */
    public function getFavorites(): Collection
    {
        return $this->favorites;
    }

    public function addFavorite(Favorite $favorite): static
    {
        if (!$this->favorites->contains($favorite)) {
            $this->favorites->add($favorite);
            $favorite->setUser($this);
        }

        return $this;
    }

    public function removeFavorite(Favorite $favorite): static
    {
        if ($this->favorites->removeElement($favorite)) {
            // set the owning side to null (unless already changed)
            if ($favorite->getUser() === $this) {
                $favorite->setUser(null);
            }
        }

        return $this;
    }
    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTimeImmutable();
        }

        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

}
