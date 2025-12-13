<?php

namespace App\DTO\Book;

use App\Enum\BookCategorieEnum;
use App\Enum\BookStatusEnum;
use App\Enum\ExchangeTypeEnum;
use App\Enum\StateEnum;
use Symfony\Component\Validator\Constraints as Assert;

class UpdateBookDTO
{
    #[Assert\Length(min: 1, max: 100)]
    public ?string $title = null;

    #[Assert\Length(min: 2, max: 100)]
    public ?string $author = null;

    #[Assert\Isbn(message: 'L\'ISBN n\'est pas valide')]
    #[Assert\Length(max: 20)]
    public ?string $isbn = null;

    #[Assert\Length(min: 10, max: 5000)]
    public ?string $description = null;

    #[Assert\Positive]
    #[Assert\Range(min: 1, max: 10000)]
    public ?int $pages = null;

    #[Assert\Length(max: 40)]
    public ?string $edition = null;

    #[Assert\Length(min: 2, max: 50)]
    public ?string $location = null;

    /** @var BookCategorieEnum[]|null */
    #[Assert\Count(min: 1, max: 5)]
    #[Assert\All([
        new Assert\Type(type: BookCategorieEnum::class)
    ])]
    public ?array $categorie = null;

    public ?StateEnum $state = null;

    public ?BookStatusEnum $bookStatus = null;

    /** @var ExchangeTypeEnum[]|null */
    #[Assert\Count(min: 1, max: 3)]
    #[Assert\All([
        new Assert\Type(type: ExchangeTypeEnum::class)
    ])]
    public ?array $availableExchangeTypes = null;
}
