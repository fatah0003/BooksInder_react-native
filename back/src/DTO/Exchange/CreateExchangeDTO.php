<?php

namespace App\DTO\Exchange;

use App\Enum\ExchangeTypeEnum;
use Symfony\Component\Validator\Constraints as Assert;

class CreateExchangeDTO
{
    #[Assert\NotNull(message: 'L\'ID du livre proposé est requis')]
    #[Assert\Positive(message: 'L\'ID du livre doit être un nombre positif')]
    public int $bookOneId;
}
