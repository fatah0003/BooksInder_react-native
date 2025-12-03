<?php

namespace App\DTO\Exchange;

use Symfony\Component\Validator\Constraints as Assert;

class CreateExchangeDTO
{
    #[Assert\NotBlank(message: 'L\'ID du livre est requis')]
    #[Assert\Positive(message: 'L\'ID du livre doit être un nombre positif')]
    public int $bookId;
}
