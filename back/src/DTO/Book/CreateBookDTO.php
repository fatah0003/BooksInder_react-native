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
    #[Assert\Length(
        min: 1,
        max: 100,
        minMessage: 'Le titre doit faire au moins {{ limit }} caractère',
        maxMessage: 'Le titre ne peut pas dépasser {{ limit }} caractères'
    )]
    public string $title;

    #[Assert\NotBlank(message: 'L\'auteur est requis')]
    #[Assert\Length(min: 2, max: 100, minMessage: 'L\'auteur doit faire au moins {{ limit }} caractères')]
    public string $author;

    #[Assert\NotBlank(message: 'L\'ISBN est requis')]
    #[Assert\Isbn(message: 'L\'ISBN n\'est pas valide')]
    #[Assert\Length(max: 20)]
    public string $isbn;

    #[Assert\NotBlank(message: 'La description est requise')]
    #[Assert\Length(
        min: 10,
        max: 5000,
        minMessage: 'La description doit faire au moins {{ limit }} caractères',
        maxMessage: 'La description ne peut pas dépasser {{ limit }} caractères'
    )]
    public string $description;

    #[Assert\NotBlank(message: 'Le nombre de pages est requis')]
    #[Assert\Positive(message: 'Le nombre de pages doit être positif')]
    #[Assert\Range(
        notInRangeMessage: 'Le nombre de pages doit être entre {{ min }} et {{ max }}',
        min: 1,
        max: 10000
    )]
    public int $pages;

    #[Assert\Length(max: 40, maxMessage: 'L\'édition ne peut pas dépasser {{ limit }} caractères')]
    public ?string $edition = null;

    #[Assert\NotBlank(message: 'La localisation est requise')]
    #[Assert\Length(
        min: 2,
        max: 50,
        minMessage: 'La localisation doit faire au moins {{ limit }} caractères'
    )]
    public string $location;

    /**
     * @var BookCategorieEnum[]
     */
    #[Assert\NotBlank(message: 'Au moins une catégorie est requise')]
    #[Assert\Count(
        min: 1,
        max: 5,
        minMessage: 'Vous devez sélectionner au moins une catégorie',
        maxMessage: 'Vous ne pouvez pas sélectionner plus de {{ limit }} catégories'
    )]
    #[Assert\All([
        new Assert\Type(type: BookCategorieEnum::class, message: 'Catégorie invalide')
    ])]
    public array $categorie = [];

    #[Assert\NotNull(message: 'L\'état du livre est requis')]
    public StateEnum $state;

    public BookStatusEnum $bookStatus = BookStatusEnum::ACTIVE;

    /**
     * @var ExchangeTypeEnum[]
     */
    #[Assert\NotBlank(message: 'Au moins un type d\'échange est requis')]
    #[Assert\Count(
        min: 1,
        max: 3,
        minMessage: 'Vous devez sélectionner au moins un type d\'échange',
        maxMessage: 'Vous ne pouvez pas sélectionner plus de {{ limit }} types d\'échange'
    )]
    #[Assert\All([
        new Assert\Type(type: ExchangeTypeEnum::class, message: 'Type d\'échange invalide')
    ])]
    public array $availableExchangeTypes = [];
}