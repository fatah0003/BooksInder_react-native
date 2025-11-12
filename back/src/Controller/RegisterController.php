<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Serializer\SerializerInterface;

class RegisterController extends AbstractController
{
    #[Route('/api/register', name: 'register', methods: ['POST'])]
    public function register(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher,
        SerializerInterface $serializer
    ): JsonResponse {
        $jsonContent = $request->getContent();

        try {
            /** @var User $user */
            $user = $serializer->deserialize($jsonContent, User::class, 'json', ['groups' => 'user:write']);

            // Hachage du mot de passe
            $hashedPassword = $passwordHasher->hashPassword($user, $user->getPassword());
            $user->setPassword($hashedPassword);

            // Rôle par défaut
            $user->setRoles(['ROLE_USER']);

            // Dates
            $user->setCreatedAt(new \DateTimeImmutable());
            $user->setUpdatedAt(new \DateTimeImmutable());

            $em->persist($user);
            $em->flush();
            return $this->json($user, 201, [], ['groups' => 'user:read']);

        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }
}
