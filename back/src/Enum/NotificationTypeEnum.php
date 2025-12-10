<?php
namespace App\Enum;

enum NotificationTypeEnum: string
{
    case EXCHANGE_REQUEST = 'exchange_request';
    case EXCHANGE_ACCEPTED = 'exchange_accepted';
    case EXCHANGE_REJECTED = 'exchange_rejected';
    case EXCHANGE_CANCELLED = 'exchange_cancelled';
    case EXCHANGE_RETURN_REMINDER = 'exchange_return_reminder';
    case MESSAGE_RECEIVED = 'message_received';
}

