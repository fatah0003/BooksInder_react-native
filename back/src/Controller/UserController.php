<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users', name: 'api_users_')]
class UserController extends AbstractController
{
    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(UserRepository $repo): JsonResponse
    {
        $users = $repo->findAll();
        return $this->json($users, 200, [], ['groups' => 'user:read']);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(User $user): JsonResponse
    {
        // Un utilisateur ne peut voir que ses propres infos sauf s’il est admin
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        return $this->json($user, 200, [], ['groups' => 'user:read']);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function update(
        Request $request,
        User $user,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher,
        SerializerInterface $serializer
    ): JsonResponse {
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        try {
            $serializer->deserialize(
                $request->getContent(),
                User::class,
                'json',
                ['object_to_populate' => $user, 'groups' => 'user:write']
            );

            // Si un mot de passe est envoyé, on le rehash
            if (!empty($user->getPassword())) {
                $user->setPassword(
                    $passwordHasher->hashPassword($user, $user->getPassword())
                );
            }

            $user->setUpdatedAt(new \DateTimeImmutable());
            $em->flush();

            return $this->json($user, 200, [], ['groups' => 'user:read']);
        } catch (NotEncodableValueException $e) {
            return $this->json(['error' => 'Invalid JSON format'], 400);
        }
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(User $user, EntityManagerInterface $em): JsonResponse
    {
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $em->remove($user);
        $em->flush();

        return $this->json(null, 204);
    }
}
