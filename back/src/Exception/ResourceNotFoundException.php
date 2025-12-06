<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

class ResourceNotFoundException extends HttpException
{
    public function __construct(string $resourceType, string $identifier)
    {
        parent::__construct(
            404,
            sprintf('%s avec l\'identifiant "%s" introuvable', $resourceType, $identifier)
        );
    }
}
