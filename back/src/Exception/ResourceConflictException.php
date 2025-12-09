<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

class ResourceConflictException extends HttpException
{
    private string $publicMessage;

    public function __construct(string $message)
    {
        $this->publicMessage = $message;
        parent::__construct(409, $message);
    }

    public function getPublicMessage(): string
    {
        return $this->publicMessage;
    }
}
