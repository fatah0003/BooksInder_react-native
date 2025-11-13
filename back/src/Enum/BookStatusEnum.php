<?php

namespace App\Enum;

enum BookStatusEnum: string
{
    case ACTIVE = 'active';      // livre disponible pour échange
    case INACTIVE = 'inactive';  // si le livre a été échangé de façon permanente, il ne sera plus visible dans les annonces
    case UNAVAILABLE = 'unavailable'; // livre indisponible temporairement mais sera dispo dès qu’il revient au propriétaire
    case DELETED = 'deleted';    // livre supprimé par l’utilisateur
}
