<?php

namespace App\Enum;

enum StateEnum: string
{
    case NEW = 'new';
    case LIKE_NEW = 'like_new';
    case VERY_GOOD = 'very_good';
    case GOOD = 'good';
    case ACCEPTABLE = 'acceptable';
    case WELL_LOVED = 'well_loved';
}
