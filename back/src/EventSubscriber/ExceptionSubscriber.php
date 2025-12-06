<?php

namespace App\EventSubscriber;

use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

class ExceptionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly string $environment
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onKernelException',
        ];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        // Log l'erreur
        $this->logger->error('Exception capturée', [
            'message' => $exception->getMessage(),
            'code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
        ]);

        // Déterminer le status code
        $statusCode = $exception instanceof HttpExceptionInterface
            ? $exception->getStatusCode()
            : 500;

        // Préparer la réponse
        $responseData = [
            'success' => false,
            'error' => $exception->getMessage(),
        ];

        // En mode dev, ajouter plus de détails
        if ($this->environment === 'dev') {
            $responseData['debug'] = [
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString(),
            ];
        }

        // Créer la réponse JSON
        $response = new JsonResponse($responseData, $statusCode);
        $event->setResponse($response);
    }
}
