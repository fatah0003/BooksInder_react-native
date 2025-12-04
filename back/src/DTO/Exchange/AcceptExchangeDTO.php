<?php

namespace App\DTO\Exchange;

use App\Enum\ExchangeTypeEnum;
use Symfony\Component\Validator\Constraints as Assert;

class AcceptExchangeDTO
{
    #[Assert\NotNull(message: 'L\'ID du livre en échange est requis')]
    #[Assert\Positive]
    public int $bookTwoId;

    #[Assert\NotNull(message: 'Le type d\'échange est requis')]
    public ?string $exchangeType = null;
}
