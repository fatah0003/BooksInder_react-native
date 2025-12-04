<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

class LoginRateLimitListener implements EventSubscriberInterface
{
    public function __construct(
        private readonly RateLimiterFactory $loginLimiter
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 10],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        // Appliquer uniquement sur /api/login en POST
        if ($request->getPathInfo() !== '/api/login' || $request->getMethod() !== 'POST') {
            return;
        }

        // Créer le limiter basé sur l'IP du client
        $limiter = $this->loginLimiter->create($request->getClientIp());

        // Consommer 1 jeton
        $limit = $limiter->consume(1);

        if (!$limit->isAccepted()) {
            $event->setResponse(new JsonResponse([
                'success' => false,
                'error' => 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
            ], 429));
        }
    }
}
