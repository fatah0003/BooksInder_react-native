<?php

namespace App\EventSubscriber;

use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpKernel\KernelInterface;

class ExceptionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly KernelInterface $kernel
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

        // Log l'erreur avec le message technique complet
        $this->logger->error('Exception capturée', [
            'message' => $exception->getMessage(), // Message technique avec UUID
            'code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
        ]);

        // Déterminer le status code
        $statusCode = $exception instanceof HttpExceptionInterface
            ? $exception->getStatusCode()
            : 500;

        // Message public pour l'utilisateur
        if (method_exists($exception, 'getPublicMessage')) {
            $publicError = $exception->getPublicMessage();
        } else {
            $publicError = 'Une erreur est survenue.';
        }

        // Préparer la réponse
        $responseData = [
            'success' => false,
            'error' => $publicError, // Message user-friendly
        ];

        // En mode dev, ajouter plus de détails techniques
        if ($this->kernel->getEnvironment() === 'dev') {
            $responseData['debug'] = [
                'technicalMessage' => $exception->getMessage(), // Message avec UUID
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
