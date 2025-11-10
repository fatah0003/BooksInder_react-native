<?php

namespace App\Controller;

use App\Entity\InfosUser;
use App\Repository\InfosUserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/infosusers', name: 'api_infosusers_')]
class InfosUserController extends AbstractController
{
    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(InfosUserRepository $infosUserRepository): JsonResponse
    {
        $infosUsers = $infosUserRepository->findAll();
        $data = [];

        foreach ($infosUsers as $infosUser) {
            $data[] = [
                'id' => $infosUser->getId(),
                'userName' => $infosUser->getUserName(),
                'phoneNumber' => $infosUser->getPhoneNumber(),
                'city' => $infosUser->getCity(),
                'birthDate' => $infosUser->getBirthDate()->format('Y-m-d'),
                'bio' => $infosUser->getBio(),
                'user_id' => $infosUser->getUser()->getId(),
            ];
        }

        return $this->json($data);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(InfosUser $infosUser): JsonResponse
    {
        return $this->json([
            'id' => $infosUser->getId(),
            'userName' => $infosUser->getUserName(),
            'phoneNumber' => $infosUser->getPhoneNumber(),
            'city' => $infosUser->getCity(),
            'birthDate' => $infosUser->getBirthDate()->format('Y-m-d'),
            'bio' => $infosUser->getBio(),
            'user_id' => $infosUser->getUser()->getId(),
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        $user = $this->getUser();

        $infosUser = new InfosUser();
        $infosUser->setUserName($data['userName'] ?? '');
        $infosUser->setPhoneNumber($data['phoneNumber'] ?? '');
        $infosUser->setCity($data['city'] ?? '');
        $infosUser->setBirthDate(new \DateTimeImmutable($data['birthDate']));
        $infosUser->setBio($data['bio'] ?? null);
        $infosUser->setCreatedAt(new \DateTimeImmutable());
        $infosUser->setUser($user);

        $em->persist($infosUser);
        $em->flush();

        return $this->json(['message' => 'Profil créé avec succès'], 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function update(Request $request, InfosUser $infosUser, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();

        if ($infosUser->getUser() !== $user) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $data = json_decode($request->getContent(), true);

        $infosUser->setUserName($data['userName'] ?? $infosUser->getUserName());
        $infosUser->setPhoneNumber($data['phoneNumber'] ?? $infosUser->getPhoneNumber());
        $infosUser->setCity($data['city'] ?? $infosUser->getCity());
        if (isset($data['birthDate'])) {
            $infosUser->setBirthDate(new \DateTimeImmutable($data['birthDate']));
        }
        $infosUser->setBio($data['bio'] ?? $infosUser->getBio());
        $infosUser->setUpdatedAt(new \DateTimeImmutable());

        $em->flush();

        return $this->json(['message' => 'Profil mis à jour avec succès']);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(InfosUser $infosUser, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();

        if ($infosUser->getUser() !== $user) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $em->remove($infosUser);
        $em->flush();

        return $this->json(['message' => 'Profil supprimé avec succès']);
    }
}
