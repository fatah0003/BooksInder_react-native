<?php

namespace App\DTO\Book;

use App\Enum\BookCategorieEnum;
use App\Enum\BookStatusEnum;
use App\Enum\ExchangeTypeEnum;
use App\Enum\StateEnum;
use Symfony\Component\Validator\Constraints as Assert;

class CreateBookDTO
{
    #[Assert\NotBlank(message: 'Le titre est requis')]
    #[Assert\Length(min: 1, max: 100, minMessage: 'Le titre doit faire au moins {{ limit }} caractère', maxMessage: 'Le titre ne peut pas dépasser {{ limit }} caractères')]
    public string $title;

    #[Assert\NotBlank(message: 'L\'auteur est requis')]
    #[Assert\Length(min: 1, max: 100)]
    public string $author;

    #[Assert\NotBlank(message: 'L\'ISBN est requis')]
    #[Assert\Isbn(message: 'L\'ISBN n\'est pas valide')]
    public string $isbn;

    #[Assert\NotBlank(message: 'La description est requise')]
    #[Assert\Length(min: 10, minMessage: 'La description doit faire au moins {{ limit }} caractères')]
    public string $description;

    #[Assert\NotBlank(message: 'Le nombre de pages est requis')]
    #[Assert\Positive(message: 'Le nombre de pages doit être positif')]
    public int $pages;

    #[Assert\Length(max: 40)]
    public ?string $edition = null;

    #[Assert\NotBlank(message: 'La localisation est requise')]
    #[Assert\Length(max: 50)]
    public string $location;

    /**
     * @var BookCategorieEnum[]
     */
    #[Assert\NotBlank(message: 'Au moins une catégorie est requise')]
    #[Assert\Count(min: 1, minMessage: 'Vous devez sélectionner au moins une catégorie')]
    public array $categorie = [];

    #[Assert\NotNull(message: 'L\'état du livre est requis')]
    public StateEnum $state;

    public BookStatusEnum $bookStatus = BookStatusEnum::ACTIVE;

    /**
     * @var ExchangeTypeEnum[]
     */
    #[Assert\NotBlank(message: 'Au moins un type d\'échange est requis')]
    #[Assert\Count(min: 1, minMessage: 'Vous devez sélectionner au moins un type d\'échange')]
    public array $availableExchangeTypes = [];
}