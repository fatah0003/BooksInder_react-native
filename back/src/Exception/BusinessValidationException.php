<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

class BusinessValidationException extends HttpException
{
    public function __construct(string $message)
    {
        parent::__construct(400, $message);
    }
}
