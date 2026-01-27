<?php

namespace App\Controller;

use App\DTO\User\CreateUserDTO;
use App\Service\EmailService;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

class RegisterController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService,
        private readonly SerializerInterface $serializer,
        private readonly RateLimiterFactory $registerLimiter,
        private EmailService $emailService
    ) {
    }

    #[Route('/api/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        // Rate limiting
//        $limiter = $this->registerLimiter->create($request->getClientIp());
//        if (false === $limiter->consume(1)->isAccepted()) {
//            throw new TooManyRequestsHttpException(
//                null,
//                "Trop de tentatives d'inscription. Réessayez plus tard!"
//            );
//        }

        /** @var CreateUserDTO $dto */
        $dto = $this->serializer->deserialize(
            $request->getContent(),
            CreateUserDTO::class,
            'json'
        );

        // createFromDTO lève BusinessValidationException en cas d’erreur
        $user = $this->userService->createFromDTO($dto);

        // Envoi email de bienvenue
        $this->emailService->sendWelcomeEmail(
            $user->getEmail(),
            $user->getInfosUser()?->getUsername() ?? 'utilisateur'
        );

        return $this->json($user, 201, [], ['groups' => 'user:read']);
    }
}
