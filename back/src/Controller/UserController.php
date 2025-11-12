<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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
    public function index(UserRepository $repo, SerializerInterface $serializer): JsonResponse
    {
        $users = $repo->findAll();
        $json = $serializer->serialize($users, 'json', ['groups' => 'user:read']);
        return new JsonResponse($json, 200, [], true);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(User $user, SerializerInterface $serializer): JsonResponse
    {
        // Un utilisateur ne peut voir que ses propres infos sauf s’il est admin
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        $json = $serializer->serialize($user, 'json', ['groups' => 'user:read']);
        return new JsonResponse($json, 200, [], true);
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
        // Seul l’utilisateur concerné ou un admin peut modifier
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }
        $jsonContent = $request->getContent();
        try {
            $serializer->deserialize(
                $jsonContent,
                User::class,
                'json',
                ['object_to_populate' => $user, 'groups' => 'user:write']
            );
            if (!empty($user->getPassword())) {
                $hashedPassword = $passwordHasher->hashPassword($user, $user->getPassword());
                $user->setPassword($hashedPassword);
            }
            $user->setUpdatedAt(new \DateTimeImmutable());
            $em->flush();
            $json = $serializer->serialize($user, 'json', ['groups' => 'user:read']);
            return new JsonResponse($json, 200, [], true);
        } catch (NotEncodableValueException $e) {
            return new JsonResponse(['error' => 'Invalid JSON format'], 400);
        }
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(User $user, EntityManagerInterface $em): JsonResponse
    {
        // Seul l’utilisateur ou un admin peut supprimer le compte
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        $em->remove($user);
        $em->flush();

        return new JsonResponse(null, 204);
    }
}
