<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

class UnauthorizedActionException extends HttpException
{
    private string $publicMessage;

    public function __construct(string $message = 'Vous n\'êtes pas autorisé à effectuer cette action')
    {
        $this->publicMessage = $message;
        parent::__construct(403, $message);
    }

    public function getPublicMessage(): string
    {
        return $this->publicMessage;
    }
}
