<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

class UnauthorizedActionException extends HttpException
{
    public function __construct(string $message = 'Vous n\'êtes pas autorisé à effectuer cette action')
    {
        parent::__construct(403, $message);
    }
}
