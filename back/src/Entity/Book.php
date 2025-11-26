<?php

namespace App\Entity;

use App\Enum\BookCategorieEnum;
use App\Enum\BookStatusEnum;
use App\Enum\ExchangeTypeEnum;
use App\Enum\StateEnum;
use App\Repository\BookRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: BookRepository::class)]
class Book
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['book:read', 'user:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private ?string $title = null;

    #[ORM\Column(length: 100)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private ?string $author = null;

    #[ORM\Column(length: 20)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private ?string $isbn = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private ?string $description = null;

    #[ORM\Column]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private ?int $pages = null;

    #[ORM\Column]
    #[Groups(['book:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['book:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'books')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['book:read:detail'])]
    private ?User $user = null;

    #[ORM\Column(length: 40, nullable: true)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private ?string $edition = null;

    #[ORM\Column(length: 50)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private ?string $location = null;

    #[ORM\Column(type: Types::SIMPLE_ARRAY, enumType: BookCategorieEnum::class)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private array $categorie = [];

    #[ORM\Column(enumType: StateEnum::class)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private ?StateEnum $state = null;

    #[ORM\Column(enumType: BookStatusEnum::class)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private ?BookStatusEnum $bookStatus = null;

    #[ORM\Column(type: Types::SIMPLE_ARRAY, enumType: ExchangeTypeEnum::class)]
    #[Groups(['book:read', 'book:write', 'user:read'])]
    private array $availableExchangeTypes = [];

//    /**
//     * @var Collection<int, Exchange>
//     */
//    #[ORM\OneToMany(targetEntity: Exchange::class, mappedBy: 'bookOne')]
//    private Collection $exchagedBook;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->categorie = [BookCategorieEnum::FICTION]; // valeur par défaut pour éviter une erreur d’énumération vide
        $this->state = StateEnum::GOOD;
        $this->bookStatus = BookStatusEnum::ACTIVE;
//        $this->exchagedBook = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }
    public function getAuthor(): ?string { return $this->author; }
    public function setAuthor(string $author): static { $this->author = $author; return $this; }
    public function getIsbn(): ?string { return $this->isbn; }
    public function setIsbn(string $isbn): static { $this->isbn = $isbn; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }
    public function getPages(): ?int { return $this->pages; }
    public function setPages(int $pages): static { $this->pages = $pages; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getEdition(): ?string { return $this->edition; }
    public function setEdition(?string $edition): static { $this->edition = $edition; return $this; }
    public function getLocation(): ?string { return $this->location; }
    public function setLocation(string $location): static { $this->location = $location; return $this; }

    /** @return BookCategorieEnum[] */
    public function getCategorie(): array { return $this->categorie; }
    public function setCategorie(array $categorie): static { $this->categorie = $categorie; return $this; }

    public function getState(): ?StateEnum { return $this->state; }
    public function setState(StateEnum $state): static { $this->state = $state; return $this; }

    public function getBookStatus(): ?BookStatusEnum { return $this->bookStatus; }
    public function setBookStatus(BookStatusEnum $bookStatus): static { $this->bookStatus = $bookStatus; return $this; }

    /**
     * @return Collection<int, Exchange>
     */
//    public function getExchagedBook(): Collection
//    {
//        return $this->exchagedBook;
//    }

//    public function addExchagedBook(Exchange $exchagedBook): static
//    {
//        if (!$this->exchagedBook->contains($exchagedBook)) {
//            $this->exchagedBook->add($exchagedBook);
//            $exchagedBook->setBookOne($this);
//        }

//        return $this;
//    }

//    public function removeExchagedBook(Exchange $exchagedBook): static
//    {
//        if ($this->exchagedBook->removeElement($exchagedBook)) {
//            // set the owning side to null (unless already changed)
//            if ($exchagedBook->getBookOne() === $this) {
//                $exchagedBook->setBookOne(null);
//            }
//        }
//
//        return $this;
//    }

/**
 * @return ExchangeTypeEnum[]
 */
public function getAvailableExchangeTypes(): array
{
    return $this->availableExchangeTypes;
}

public function setAvailableExchangeTypes(array $availableExchangeTypes): static
{
    $this->availableExchangeTypes = $availableExchangeTypes;

    return $this;
}
}
