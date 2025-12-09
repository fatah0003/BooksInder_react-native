<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

class BusinessValidationException extends HttpException
{
    private string $publicMessage;

    public function __construct(string $message)
    {
        $this->publicMessage = $message;
        parent::__construct(400, $message);
    }

    public function getPublicMessage(): string
    {
        return $this->publicMessage;
    }
}
