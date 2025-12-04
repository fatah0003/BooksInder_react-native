<?php

namespace App\Controller;

use App\DTO\User\CreateUserDTO;
use App\Service\UserService;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

class RegisterController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService,
        private readonly SerializerInterface $serializer,
        private readonly LoggerInterface $logger,
        private readonly RateLimiterFactory $registerLimiter
    ) {}

    #[Route('/api/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        //rate limiting
        $limiter = $this->registerLimiter->create($request->getClientIp());
        if (false === $limiter->consume(1)->isAccepted()) {
            throw new TooManyRequestsHttpException(
                null,
                "Trop de tentatives d\'inscription. Réessayez plus tard."
            );
        }
        try {
            /** @var CreateUserDTO $dto */
            $dto = $this->serializer->deserialize($request->getContent(), CreateUserDTO::class, 'json');

            $user = $this->userService->createFromDTO($dto);

            return $this->json($user, 201, [], ['groups' => 'user:read']);
        } catch (BadRequestHttpException $e) {
            // DTO validation / business error from service
            $this->logger->warning('Register validation error', ['msg' => $e->getMessage()]);
            $payload = json_decode($e->getMessage(), true);
            return $this->json(['success' => false, 'errors' => $payload ?: $e->getMessage()], 400);
        } catch (\Exception $e) {
            $this->logger->error('Register failed', ['error' => $e->getMessage()]);
            return $this->json(['success' => false, 'error' => 'Erreur serveur'], 500);
        }
    }
}
