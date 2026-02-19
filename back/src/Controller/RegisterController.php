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
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

class RegisterController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService,
        private readonly SerializerInterface $serializer,
        private readonly RateLimiterFactory $registerLimiter,
        private readonly JWTTokenManagerInterface $jwtManager
    ) {
    }

    #[Route('/api/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        // Rate limiting
        $limiter = $this->registerLimiter->create($request->getClientIp());
        if (false === $limiter->consume(1)->isAccepted()) {
            throw new TooManyRequestsHttpException(
                null,
                "Trop de tentatives d'inscription. Réessayez plus tard!"
            );
        }

        /** @var CreateUserDTO $dto */
        $dto = $this->serializer->deserialize(
            $request->getContent(),
            CreateUserDTO::class,
            'json'
        );

        // createFromDTO lève BusinessValidationException en cas d’erreur
        $user = $this->userService->createFromDTO($dto);

        return $this->json($user, 201, [], ['groups' => 'user:read']);
    }

    #[Route('/api/verify', name: 'api_verify_account', methods: ['POST'])]
    public function verify(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $email = $data['email'] ?? null;
        $code = $data['code'] ?? null;

        if (!$email || !$code) {
            return $this->json([
                'success' => false,
                'message' => 'Email et code requis'
            ], 400);
        }

        try {
            // Vérifier le code et activer le compte
            $user = $this->userService->verifyCode($email, $code);

            // Générer un token JWT
            $token = $this->jwtManager->create($user);

            return $this->json([
                'success' => true,
                'message' => 'Compte activé avec succès !',
                'token' => $token,
                'user' => $user
            ], 200, [], ['groups' => 'user:read']);

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

}
