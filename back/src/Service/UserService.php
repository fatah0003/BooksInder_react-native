<?php

namespace App\Service;

use App\DTO\User\CreateUserDTO;
use App\DTO\User\UpdateUserDTO;
use App\Entity\User;
use App\Enum\UserStatusEnum;
use App\Exception\BusinessValidationException;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class UserService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly ValidatorInterface $validator,
        private readonly UserRepository $userRepository,
        private readonly LoggerInterface $logger,
        private EmailService $emailService
    ) {
    }

    public function createFromDTO(CreateUserDTO $dto): User
    {
        // Validation DTO
        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $e) {
                $messages[$e->getPropertyPath()] = $e->getMessage();
            }
            throw new BusinessValidationException(json_encode($messages));
        }

        // Email unique
        if ($this->userRepository->findOneBy(['email' => $dto->email])) {
            throw new BusinessValidationException('Email already used.');
        }

        $user = new User();
        $user->setEmail($dto->email);
        $user->setPassword($this->passwordHasher->hashPassword($user, $dto->password));
        $user->setRoles($dto->roles ?? ['ROLE_USER']);
        //status inactive
        $user->setuserStatus(userstatusEnum::INACTIVE);
        //generation du code à 6 chiffres
        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->setVerificationCode($verificationCode);

        // Code expire dans 30 minutes
        $expiresAt = new \DateTimeImmutable('+30 minutes');
        $user->setVerificationCodeExpiresAt($expiresAt);

        $this->em->persist($user);
        $this->em->flush();

        $this->emailService->sendVerificationCode($user->getEmail(), $verificationCode);

        $this->logger->info('User created with verification code', [
            'userId' => $user->getId(),
            'email' => $user->getEmail(),
            'codeExpiresAt' => $expiresAt->format('Y-m-d H:i:s')
        ]);

        return $user;
    }

    public function updateFromDTO(User $user, UpdateUserDTO $dto): User
    {
        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $e) {
                $messages[$e->getPropertyPath()] = $e->getMessage();
            }
            throw new BusinessValidationException(json_encode($messages));
        }

        if ($dto->email !== null && $dto->email !== $user->getEmail()) {
            if ($this->userRepository->findOneBy(['email' => $dto->email])) {
                throw new BusinessValidationException('Email already used.');
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

    public function delete(User $user): void
    {
        $id = $user->getId();

        // Supprimer les livres
        $books = $user->getBooks()->toArray();  // ← Avec ->toArray()
        foreach ($books as $book) {
            $this->em->remove($book);
        }

        // Changer le statut
        $user->setUserStatus(UserStatusEnum::DELETED);
        $user->setUpdatedAt(new \DateTimeImmutable());

        // Flush
        $this->em->flush();

        $this->logger->info('User marked as deleted (soft delete)', ['userId' => $id]);
    }




}
