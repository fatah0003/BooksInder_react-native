<?php

namespace App\Controller;

use App\Entity\Favorite;
use App\Entity\User;
use App\Exception\ResourceNotFoundException;
use App\Exception\BusinessValidationException;
use App\Repository\FavoriteRepository;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/favorites')]
#[IsGranted('ROLE_USER')]
class FavoriteController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly FavoriteRepository $favoriteRepository,
        private readonly BookRepository $bookRepository
    ) {}

    #[Route('/toggle/{bookId}', name: 'favorite_toggle', methods: ['PATCH'])]
    public function toggle(int $bookId): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        $book = $this->bookRepository->find($bookId);

        if (!$book) {
            throw new ResourceNotFoundException('Livre', (string) $bookId);
        }

        $favorite = $this->favoriteRepository->findOneByUserAndBook($user, $book);

        if ($favorite) {
            // Retirer des favoris
            $this->em->remove($favorite);
            $this->em->flush();

            return $this->json([
                'success' => true,
                'action' => 'removed',
                'message' => 'Livre retiré des favoris',
                'isFavorite' => false
            ]);
        }

        // Ajouter aux favoris
        if ($book->getUser() === $user) {
            throw new BusinessValidationException('Vous ne pouvez pas ajouter votre propre livre en favori');
        }

        $favorite = new Favorite();
        $favorite->setUser($user);
        $favorite->setBook($book);

        $this->em->persist($favorite);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'action' => 'added',
            'message' => 'Livre ajouté aux favoris',
            'isFavorite' => true,
            'favoriteId' => $favorite->getId()
        ], 201);
    }

    #[Route('', name: 'favorite_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('User must be logged in.');
        }

        $favorites = $this->favoriteRepository->findByUser($user);


        $data = array_map(function(Favorite $favorite) {
            $book = $favorite->getBook();
            return [
                'id' => $favorite->getId(),
                'createdAt' => $favorite->getCreatedAt()->format('c'),
                'book' => [
                    'id' => $book->getId(),
                    'title' => $book->getTitle(),
                    'author' => $book->getAuthor(),
                    'isbn' => $book->getIsbn(),
                    'bookStatus' => $book->getBookStatus()->value,
                    'owner' => [
                        'id' => $book->getUser()->getId(),
                    ]
                ]
            ];
        }, $favorites);

        return $this->json([
            'success' => true,
            'count' => count($data),
            'data' => $data
        ]);
    }

    #[Route('/check/{bookId}', name: 'favorite_check', methods: ['GET'])]
    public function check(int $bookId): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('User must be logged in.');
        }

        $book = $this->bookRepository->find($bookId);


        if (!$book) {
            throw new ResourceNotFoundException('Livre', (string) $bookId);
        }

        $isFavorite = $this->favoriteRepository->isFavorite($user, $book);
        $favorite = $this->favoriteRepository->findOneByUserAndBook($user, $book);

        return $this->json([
            'success' => true,
            'isFavorite' => $isFavorite,
            'favoriteId' => $favorite?->getId()
        ]);
    }

    #[Route('/popular', name: 'favorite_popular', methods: ['GET'])]
    public function popular(Request $request): JsonResponse
    {
        $limit = $request->query->getInt('limit', 10);
        $mostFavorited = $this->favoriteRepository->findMostFavorited($limit);

        return $this->json([
            'success' => true,
            'data' => $mostFavorited
        ]);
    }
}
