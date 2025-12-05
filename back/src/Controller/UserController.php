<?php

namespace App\Controller;

use App\DTO\User\UpdateUserDTO;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\UserService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
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
        // keep this as before (repo injection or service listing method)
        return $this->json($this->getDoctrine()->getRepository(User::class)->findAll(), 200, [], ['groups' => 'user:read']);
    }

    #[Route('/{uuid}', name: 'show', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['GET'])]
    public function show(string $uuid): JsonResponse
    {
        $user = $this->userRepository->findOneByUuid($uuid);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur introuvable'], 404);
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
            return $this->json(['error' => 'Utilisateur introuvable'], 404);
        }

        // Vérifier que l'utilisateur connecté modifie son propre profil
        if ($this->getUser() !== $user && !in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        try {
            /** @var UpdateUserDTO $dto */
            $dto = $this->serializer->deserialize($request->getContent(), UpdateUserDTO::class, 'json');

            $user = $this->userService->updateFromDTO($user, $dto);

            return $this->json($user, 200, [], ['groups' => 'user:read']);
        } catch (BadRequestHttpException $e) {
            $payload = json_decode($e->getMessage(), true);
            return $this->json(['success' => false, 'errors' => $payload ?: $e->getMessage()], 400);
        } catch (\Exception $e) {
            return $this->json(['success' => false, 'error' => 'Erreur serveur'], 500);
        }
    }


    #[Route('/{uuid}', name: 'delete', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['DELETE'])]
    public function delete(string $uuid): JsonResponse
    {
        $user = $this->userRepository->findOneByUuid($uuid);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur introuvable'], 404);
        }

        // Vérifier permissions
        if ($this->getUser() !== $user && !in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $this->userService->delete($user);

        return $this->json([
            'success' => true,
            'message' => 'Utilisateur supprimé'
        ]);
    }
}
