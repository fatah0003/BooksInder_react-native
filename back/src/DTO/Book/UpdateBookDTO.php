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

    #[Assert\Length(min: 1, max: 100)]
    public ?string $author = null;

    #[Assert\Isbn]
    public ?string $isbn = null;

    #[Assert\Length(min: 10)]
    public ?string $description = null;

    #[Assert\Positive]
    public ?int $pages = null;

    #[Assert\Length(max: 40)]
    public ?string $edition = null;

    #[Assert\Length(max: 50)]
    public ?string $location = null;

    /** @var BookCategorieEnum[]|null */
    #[Assert\Count(min: 1)]
    public ?array $categorie = null;

    public ?StateEnum $state = null;

    public ?BookStatusEnum $bookStatus = null;

    /** @var ExchangeTypeEnum[]|null */
    #[Assert\Count(min: 1)]
    public ?array $availableExchangeTypes = null;
}

