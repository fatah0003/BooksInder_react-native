<?php

namespace App\Service;

use App\Entity\PasswordResetToken;
use App\Entity\User;
use App\Repository\PasswordResetTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class PasswordResetService
{
    public function __construct(
        private PasswordResetTokenRepository $tokenRepository,
        private EntityManagerInterface $em,
        private EmailService $emailService,
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    /**
     * Crée un token de reset et envoie l'email
     */
    public function requestReset(User $user): bool
    {
        // Supprime les anciens tokens
        $this->tokenRepository->deleteUserTokens($user);

        // Génère un token à 6 chiffres
        $token = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Crée le token en BDD
        $resetToken = new PasswordResetToken($user, $token, 30);
        $this->em->persist($resetToken);
        $this->em->flush();

        // Envoie l'email
        return $this->emailService->sendPasswordResetEmail($user->getEmail(), $token);
    }

    /**
     * Valide le token et change le mot de passe
     */
    public function confirmReset(string $token, string $newPassword): bool
    {
        // Vérifie le token
        $resetToken = $this->tokenRepository->findValidToken($token);

        if (!$resetToken || !$resetToken->isValid()) {
            return false;
        }

        // Change le mot de passe
        $user = $resetToken->getUser();
        $hashedPassword = $this->passwordHasher->hashPassword($user, $newPassword);
        $user->setPassword($hashedPassword);

        // Marque le token comme utilisé
        $resetToken->markAsUsed();

        $this->em->flush();

        return true;
    }
}
