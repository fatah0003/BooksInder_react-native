<?php

namespace App\Controller;

use App\Entity\InfosUser;
use App\Repository\InfosUserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/infosusers', name: 'api_infosusers_')]
class InfosUserController extends AbstractController
{
    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(InfosUserRepository $repo, SerializerInterface $serializer): JsonResponse
    {
        $infosUsers = $repo->findAll();
        return $this->json($infosUsers, 200, [], ['groups' => 'infosuser:read']);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(InfosUser $infosUser, SerializerInterface $serializer): JsonResponse
    {
        return $this->json($infosUser, 200, [], ['groups' => 'infosuser:read']);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        SerializerInterface $serializer
    ): JsonResponse {
        $jsonContent = $request->getContent();

        try {
            // Désérialisation JSON → Objet InfosUser
            /** @var InfosUser $infosUser */
            $infosUser = $serializer->deserialize($jsonContent, InfosUser::class, 'json', ['groups' => 'infosuser:write']);

            $infosUser->setCreatedAt(new \DateTimeImmutable());
            $infosUser->setUpdatedAt(new \DateTimeImmutable());
            $infosUser->setUser($this->getUser()); // lie automatiquement à l’utilisateur connecté

            $em->persist($infosUser);
            $em->flush();

            return $this->json($infosUser, 201, [], ['groups' => 'infosuser:read']);


        } catch (NotEncodableValueException $e) {
            return new JsonResponse(['error' => 'Invalid JSON format'], 400);
        }
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function update(
        Request $request,
        InfosUser $infosUser,
        EntityManagerInterface $em,
        SerializerInterface $serializer
    ): JsonResponse {
        // Vérification que l’utilisateur modifie bien son profil
        if ($this->getUser() !== $infosUser->getUser()) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        $jsonContent = $request->getContent();

        try {
            // Met à jour seulement les champs présents dans la requête
            $serializer->deserialize(
                $jsonContent,
                InfosUser::class,
                'json',
                ['object_to_populate' => $infosUser, 'groups' => 'infosuser:write']
            );

            $infosUser->setUpdatedAt(new \DateTimeImmutable());
            $em->flush();

            return $this->json($infosUser, 200, [], ['groups' => 'infosuser:read']);

        } catch (NotEncodableValueException $e) {
            return $this->json(['error' => 'Invalid JSON format'], 400);
        }
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(InfosUser $infosUser, EntityManagerInterface $em): JsonResponse
    {
        // L’utilisateur ne peut supprimer que son propre profil
        if ($this->getUser() !== $infosUser->getUser()) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $em->remove($infosUser);
        $em->flush();

        return new JsonResponse(null, 204);
    }
}
