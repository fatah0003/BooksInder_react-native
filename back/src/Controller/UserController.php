<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class UserController extends AbstractController
{
    #[Route('/api/users', name: 'api_users', methods: ['GET'])]
    public function index(UserRepository $userRepository): Response
    {
        // Récupérer tous les utilisateurs (SANS les mots de passe)
        $users = $userRepository->findAll();

        return $this->json($users, 200, [], [
            'groups' => ['user:read']
        ]);
    }
}

