<?php

namespace App\Enum;

enum ExchangeStatusEnum: string
{
    case PENDING = 'pending';
    case VALIDATED = 'validated';
    case REJECTED = 'rejected';
}
