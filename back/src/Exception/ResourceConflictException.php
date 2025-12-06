<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

class ResourceConflictException extends HttpException
{
    public function __construct(string $message)
    {
        parent::__construct(409, $message);
    }
}
