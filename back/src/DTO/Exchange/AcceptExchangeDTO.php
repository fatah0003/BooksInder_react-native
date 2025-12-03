<?php

namespace App\DTO\Exchange;

use Symfony\Component\Validator\Constraints as Assert;

class AcceptExchangeDTO
{
    #[Assert\NotBlank(message: 'L\'ID du livre en échange est requis')]
    #[Assert\Positive]
    public int $bookTwoId;

    #[Assert\NotBlank(message: 'Le type d\'échange est requis')]
    #[Assert\Choice(
        choices: ['temporary', 'permanent'],
        message: 'Le type d\'échange doit être "temporary" ou "permanent"'
    )]
    public string $exchangeType;
}
