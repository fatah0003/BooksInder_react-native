<?php

namespace App\Enum;

enum UserStatusEnum: string
{
    case ACTIVE = 'active'; // user à activé son compte
    case INACTIVE = 'inactive'; // user n'a pas encore activé son compte
    case DELETED = 'deleted'; //compte supprimé
    case BLOCKED = 'blocked'; // compte banni
}
