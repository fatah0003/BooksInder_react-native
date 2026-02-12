<?php

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

class UserProvider implements UserProviderInterface
{
    public function __construct(
        private readonly UserRepository $userRepository
    ) {
    }

    /**
     * Utilisé lors du login
     */
    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        // Cherche un user actif par email (exclut DELETED et BLOCKED)
        $user = $this->userRepository->findOneActiveByEmail($identifier);

        if (!$user) {
            throw new UserNotFoundException(
                sprintf('User "%s" not found or account is inactive/deleted.', $identifier)
            );
        }

        return $user;
    }

    /**
     * Utilisé pour rafraîchir les infos du user
     */
    public function refreshUser(UserInterface $user): UserInterface
    {
        return $this->loadUserByIdentifier($user->getUserIdentifier());
    }

    /**
     * Dit à Symfony que ce provider gère les objets User
     */
    public function supportsClass(string $class): bool
    {
        return User::class === $class || is_subclass_of($class, User::class);
    }
}
