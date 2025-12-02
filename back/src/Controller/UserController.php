<?php

namespace App\Controller;

use App\DTO\User\UpdateUserDTO;
use App\Entity\User;
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
        private readonly SerializerInterface $serializer
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(): JsonResponse
    {
        // keep this as before (repo injection or service listing method)
        return $this->json($this->getDoctrine()->getRepository(User::class)->findAll(), 200, [], ['groups' => 'user:read']);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(User $user): JsonResponse
    {
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access denied'], 403);
        }
        return $this->json($user, 200, [], ['groups' => 'user:read']);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request, User $user): JsonResponse
    {
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access denied'], 403);
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

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(User $user): JsonResponse
    {
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $this->userService->delete($user);
        return $this->json(null, 204);
    }
}
