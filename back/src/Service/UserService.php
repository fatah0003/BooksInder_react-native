<?php

namespace App\Service;

use App\DTO\User\CreateUserDTO;
use App\DTO\User\UpdateUserDTO;
use App\Entity\User;
use App\Enum\UserStatusEnum;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class UserService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly ValidatorInterface $validator,
        private readonly UserRepository $userRepository,
        private readonly LoggerInterface $logger
    ) {}

    /**
     * Create a new User from DTO, validate DTO and return persisted User.
     *
     * @throws BadRequestHttpException on validation error
     */
    public function createFromDTO(CreateUserDTO $dto): User
    {
        // Validate DTO
        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $e) {
                $messages[$e->getPropertyPath()] = $e->getMessage();
            }
            throw new BadRequestHttpException(json_encode($messages));
        }

        // Unique email check (optional)
        if ($this->userRepository->findOneBy(['email' => $dto->email])) {
            throw new BadRequestHttpException('Email already used.');
        }

        // Build entity
        $user = new User();
        $user->setEmail($dto->email);
        $user->setPassword($this->passwordHasher->hashPassword($user, $dto->password));
        $user->setRoles($dto->roles ?? ['ROLE_USER']);
        $user->setUserStatus(UserStatusEnum::ACTIVE);

        $this->em->persist($user);
        $this->em->flush();

        $this->logger->info('User created', ['userId' => $user->getId()]);

        return $user;
    }

    /**
     * Update an existing User from UpdateUserDTO.
     *
     * @throws BadRequestHttpException on validation error
     */
    public function updateFromDTO(User $user, UpdateUserDTO $dto): User
    {
        // Validate DTO (if provided fields are invalid)
        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $e) {
                $messages[$e->getPropertyPath()] = $e->getMessage();
            }
            throw new BadRequestHttpException(json_encode($messages));
        }

        if ($dto->email !== null && $dto->email !== $user->getEmail()) {
            // check uniqueness
            if ($this->userRepository->findOneBy(['email' => $dto->email])) {
                throw new BadRequestHttpException('Email already used.');
            }
            $user->setEmail($dto->email);
        }

        if ($dto->password !== null) {
            $user->setPassword($this->passwordHasher->hashPassword($user, $dto->password));
        }

        if (is_array($dto->roles)) {
            $user->setRoles($dto->roles);
        }

        $user->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->logger->info('User updated', ['userId' => $user->getId()]);

        return $user;
    }

    /**
     * Delete a user
     */
    public function delete(User $user): void
    {
        $id = $user->getId();
        $this->em->remove($user);
        $this->em->flush();
        $this->logger->info('User deleted', ['userId' => $id]);
    }

    /**
     * Convenience: find user or throw 404
     */
    public function findOrFail(int $id): User
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            throw new NotFoundHttpException('User not found');
        }
        return $user;
    }
}
