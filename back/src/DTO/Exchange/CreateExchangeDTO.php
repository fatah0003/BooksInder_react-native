<?php

namespace App\DTO\Exchange;

use App\Enum\ExchangeTypeEnum;
use Symfony\Component\Validator\Constraints as Assert;

class CreateExchangeDTO
{
    #[Assert\NotNull(message: 'L\'ID du destinataire est requis')]
    #[Assert\Positive]
    public int $userReceiverId;

    #[Assert\NotNull(message: 'L\'ID du livre proposé est requis')]
    #[Assert\Positive(message: 'L\'ID du livre doit être un nombre positif')]
    public int $bookOneId;

    #[Assert\Positive]
    public ?int $bookTwoId = null;

    #[Assert\Length(
        max: 1000,
        maxMessage: 'Le message ne peut pas dépasser {{ limit }} caractères'
    )]
    public ?string $message = null;

    #[Assert\NotNull(message: 'Le type d\'échange est requis')]
    public ?ExchangeTypeEnum $exchangeType = null;
}
