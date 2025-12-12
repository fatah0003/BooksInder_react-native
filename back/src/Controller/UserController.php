<?php

namespace App\Controller;

use App\DTO\User\UpdateUserDTO;
use App\Exception\ResourceNotFoundException;
use App\Exception\UnauthorizedActionException;
use App\Repository\UserRepository;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users', name: 'api_users_')]
class UserController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService,
        private readonly SerializerInterface $serializer,
        private readonly UserRepository $userRepository
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(): JsonResponse
    {
        $users = $this->userRepository->findAll();

        return $this->json($users, 200, [], ['groups' => 'user:read']);
    }

    #[Route('/{uuid}', name: 'show', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['GET'])]
    public function show(string $uuid): JsonResponse
    {
        $user = $this->userRepository->findOneByUuid($uuid);

        if (!$user) {
            throw new ResourceNotFoundException('Utilisateur', $uuid);
        }

        return $this->json([
            'success' => true,
            'data' => $user
        ], 200, [], ['groups' => 'user:read']);
    }

    #[Route('/{uuid}', name: 'update', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['PUT', 'PATCH'])]
    public function update(string $uuid, Request $request): JsonResponse
    {
        $user = $this->userRepository->findOneByUuid($uuid);

        if (!$user) {
            throw new ResourceNotFoundException('Utilisateur', $uuid);
        }

        // Vérifier que l'utilisateur connecté modifie son propre profil ou est admin
        $currentUser = $this->getUser();
        if ($currentUser !== $user && !in_array('ROLE_ADMIN', $currentUser->getRoles(), true)) {
            throw new UnauthorizedActionException('Accès refusé');
        }

        /** @var UpdateUserDTO $dto */
        $dto = $this->serializer->deserialize(
            $request->getContent(),
            UpdateUserDTO::class,
            'json'
        );

        $user = $this->userService->updateFromDTO($user, $dto);

        return $this->json([
            'success' => true,
            'data' => $user
        ], 200, [], ['groups' => 'user:read']);
    }

    #[Route('/{uuid}', name: 'delete', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['DELETE'])]
    public function delete(string $uuid): JsonResponse
    {
        $user = $this->userRepository->findOneByUuid($uuid);

        if (!$user) {
            throw new ResourceNotFoundException('Utilisateur', $uuid);
        }

        $currentUser = $this->getUser();
        if ($currentUser !== $user && !in_array('ROLE_ADMIN', $currentUser->getRoles(), true)) {
            throw new UnauthorizedActionException('Accès refusé');
        }

        $this->userService->delete($user);

        return $this->json([
            'success' => true,
            'message' => 'Utilisateur supprimé'
        ]);
    }
}
