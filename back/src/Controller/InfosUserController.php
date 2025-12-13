<?php

namespace App\Controller;

use App\Entity\InfosUser;
use App\Exception\UnauthorizedActionException;
use App\Repository\InfosUserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/infosusers', name: 'api_infosusers_')]
class InfosUserController extends AbstractController
{
    public function __construct(
        private readonly InfosUserRepository $infosUserRepository,
        private readonly EntityManagerInterface $em,
        private readonly SerializerInterface $serializer
    ) {
    }

    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(): JsonResponse
    {
        $infosUsers = $this->infosUserRepository->findAll();
        return $this->json($infosUsers, 200, [], ['groups' => 'infosuser:read']);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(InfosUser $infosUser): JsonResponse
    {
        return $this->json($infosUser, 200, [], ['groups' => 'infosuser:read']);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request): JsonResponse
    {
        /** @var InfosUser $infosUser */
        $infosUser = $this->serializer->deserialize(
            $request->getContent(),
            InfosUser::class,
            'json',
            ['groups' => 'infosuser:write']
        );

        $infosUser->setCreatedAt(new \DateTimeImmutable());
        $infosUser->setUpdatedAt(new \DateTimeImmutable());
        $infosUser->setUser($this->getUser());

        $this->em->persist($infosUser);
        $this->em->flush();

        return $this->json($infosUser, 201, [], ['groups' => 'infosuser:read']);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function update(Request $request, InfosUser $infosUser): JsonResponse
    {
        // Vérification des droits
        if ($this->getUser() !== $infosUser->getUser()) {
            throw new UnauthorizedActionException('Access denied');
        }

        $this->serializer->deserialize(
            $request->getContent(),
            InfosUser::class,
            'json',
            ['object_to_populate' => $infosUser, 'groups' => 'infosuser:write']
        );

        $infosUser->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json($infosUser, 200, [], ['groups' => 'infosuser:read']);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(InfosUser $infosUser): JsonResponse
    {
        // Vérification des droits
        if ($this->getUser() !== $infosUser->getUser()) {
            throw new UnauthorizedActionException('Access denied');
        }

        $this->em->remove($infosUser);
        $this->em->flush();

        return $this->json(null, 204);
    }
}
