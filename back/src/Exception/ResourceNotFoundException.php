<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

class ResourceNotFoundException extends HttpException
{
    private string $publicMessage;

    public function __construct(string $resourceType, string $identifier = '')
    {
        // Messages publics user-friendly
        $publicMessages = [
            'Livre' => 'Ce livre n\'existe pas ou n\'est plus disponible.',
            'Utilisateur' => 'Cet utilisateur est introuvable.',
            'Échange' => 'Cette demande d\'échange n\'existe plus.',
            'Notification' => 'Cette notification n\'existe pas ou a déjà été supprimée.',
            'Favori' => 'Ce favori n\'existe pas ou a déjà été supprimé.',
        ];

        $this->publicMessage = $publicMessages[$resourceType] ?? 'La ressource demandée est introuvable.';

        // Message technique avec UUID pour les logs
        $technicalMessage = sprintf(
            '%s avec l\'identifiant "%s" introuvable',
            $resourceType,
            $identifier
        );

        parent::__construct(404, $technicalMessage);
    }

    public function getPublicMessage(): string
    {
        return $this->publicMessage;
    }
}
