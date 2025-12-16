<?php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Service\PasswordResetService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/password')]
class PasswordResetController extends AbstractController
{
    public function __construct(
        private readonly UserRepository       $userRepository,
        private readonly PasswordResetService $passwordResetService,
        private readonly RateLimiterFactory $passwordResetLimiter
    ) {}

    #[Route('/reset-request', name: 'password_reset_request', methods: ['POST'])]
    public function resetRequest(Request $request): JsonResponse
    {
        // Rate limiting
        $limiter = $this->passwordResetLimiter->create($request->getClientIp());
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json([
                'success' => false,
                'message' => 'Trop de tentatives. Réessayez plus tard.'
            ], 429);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $email = $data['email'] ?? '';

        if (empty($email)) {
            return $this->json([
                'success' => false,
                'message' => 'Email requis'
            ], 400);
        }

        // Cherche l'utilisateur
        $user = $this->userRepository->findOneBy(['email' => $email]);

        if ($user) {
            $this->passwordResetService->requestReset($user);
        }

        // Toujours retourner succès (sécurité)
        return $this->json([
            'success' => true,
            'message' => 'Si cet email existe, un code de réinitialisation a été envoyé.'
        ]);
    }

    #[Route('/reset-confirm', name: 'password_reset_confirm', methods: ['POST'])]
    public function resetConfirm(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $token = $data['token'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        if (empty($token) || empty($newPassword)) {
            return $this->json([
                'success' => false,
                'message' => 'Token et nouveau mot de passe requis'
            ], 400);
        }

        if (strlen($newPassword) < 8) {
            return $this->json([
                'success' => false,
                'message' => 'Le mot de passe doit contenir au moins 8 caractères'
            ], 400);
        }

        // Délègue au service
        $success = $this->passwordResetService->confirmReset($token, $newPassword);

        if (!$success) {
            return $this->json([
                'success' => false,
                'message' => 'Token invalide ou expiré'
            ], 400);
        }

        return $this->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé avec succès'
        ]);
    }
}
