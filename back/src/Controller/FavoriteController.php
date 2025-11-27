<?php

namespace App\Controller;

use App\Entity\Favorite;
use App\Entity\Book;
use App\Repository\FavoriteRepository;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/favorites')]
#[IsGranted('ROLE_USER')]
class FavoriteController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private FavoriteRepository $favoriteRepository,
        private BookRepository $bookRepository
    ) {}

    /**
     * Ajouter un livre aux favoris
     */
//    #[Route('', name: 'favorite_add', methods: ['POST'])]
//    public function add(Request $request): JsonResponse
//    {
//        $user = $this->getUser();
//        $data = json_decode($request->getContent(), true);
//
//        if (!isset($data['bookId'])) {
//            return $this->json(['error' => 'Le champ bookId est requis'], Response::HTTP_BAD_REQUEST);
//        }
//
//        $book = $this->bookRepository->find($data['bookId']);
//
//        if (!$book) {
//            return $this->json(['error' => 'Livre introuvable'], Response::HTTP_NOT_FOUND);
//        }
//
//        // Vérifier si déjà en favoris
//        if ($this->favoriteRepository->isFavorite($user, $book)) {
//            return $this->json(['error' => 'Ce livre est déjà dans vos favoris'], Response::HTTP_BAD_REQUEST);
//        }
//
//        // Empêcher d'ajouter son propre livre en favori (optionnel)
//        if ($book->getUser() === $user) {
//            return $this->json(['error' => 'Vous ne pouvez pas ajouter votre propre livre en favori'], Response::HTTP_BAD_REQUEST);
//        }
//
//        // Créer le favori
//        $favorite = new Favorite();
//        $favorite->setUser($user);
//        $favorite->setBook($book);
//        $favorite->setCreatedAt(new \DateTimeImmutable());
//
//        $this->em->persist($favorite);
//        $this->em->flush();
//
//        return $this->json([
//            'success' => true,
//            'message' => 'Livre ajouté aux favoris',
//            'favorite' => [
//                'id' => $favorite->getId(),
//                'bookId' => $book->getId(),
//                'createdAt' => $favorite->getCreatedAt()->format('c')
//            ]
//        ], Response::HTTP_CREATED);
//    }

    /**
     * Retirer un livre des favoris
     */
//    #[Route('/{bookId}', name: 'favorite_remove', methods: ['DELETE'])]
//    public function remove(int $bookId): JsonResponse
//    {
//        $user = $this->getUser();
//        $book = $this->bookRepository->find($bookId);
//
//        if (!$book) {
//            return $this->json(['error' => 'Livre introuvable'], Response::HTTP_NOT_FOUND);
//        }
//
//        $favorite = $this->favoriteRepository->findOneByUserAndBook($user, $book);
//
//        if (!$favorite) {
//            return $this->json(['error' => 'Ce livre n\'est pas dans vos favoris'], Response::HTTP_NOT_FOUND);
//        }
//
//        $this->em->remove($favorite);
//        $this->em->flush();
//
//        return $this->json([
//            'success' => true,
//            'message' => 'Livre retiré des favoris'
//        ]);
//    }

    /**
     * Toggle favori (ajouter si pas présent, retirer si présent)
     */
//    #[Route('/toggle/{bookId}', name: 'favorite_toggle', methods: ['POST'])]
    #[Route('/toggle/{bookId}', name: 'favorite_toggle', methods: ['PATCH'])]
    public function toggle(int $bookId): JsonResponse
    {
        $user = $this->getUser();
        $book = $this->bookRepository->find($bookId);

        if (!$book) {
            return $this->json(['error' => 'Livre introuvable'], Response::HTTP_NOT_FOUND);
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
        } else {
            // Ajouter aux favoris
            if ($book->getUser() === $user) {
                return $this->json(['error' => 'Vous ne pouvez pas ajouter votre propre livre en favori'], Response::HTTP_BAD_REQUEST);
            }

            $favorite = new Favorite();
            $favorite->setUser($user);
            $favorite->setBook($book);
//            $favorite->setCreatedAt(new \DateTimeImmutable());

            $this->em->persist($favorite);
            $this->em->flush();

            return $this->json([
                'success' => true,
                'action' => 'added',
                'message' => 'Livre ajouté aux favoris',
                'isFavorite' => true,
                'favoriteId' => $favorite->getId()
            ], Response::HTTP_CREATED);
        }
    }

    /**
     * Liste de tous les favoris de l'utilisateur
     */
    #[Route('', name: 'favorite_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
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
//                    'coverImage' => $book->getCoverImage(),
                    'bookStatus' => $book->getBookStatus()->value,
                    'owner' => [
                        'id' => $book->getUser()->getId(),
//                        'username' => $book->getUser()->getUsername(),
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

    /**
     * Vérifier si un livre est en favori
     */
    #[Route('/check/{bookId}', name: 'favorite_check', methods: ['GET'])]
    public function check(int $bookId): JsonResponse
    {
        $user = $this->getUser();
        $book = $this->bookRepository->find($bookId);

        if (!$book) {
            return $this->json(['error' => 'Livre introuvable'], Response::HTTP_NOT_FOUND);
        }

        $isFavorite = $this->favoriteRepository->isFavorite($user, $book);
        $favorite = $this->favoriteRepository->findOneByUserAndBook($user, $book);

        return $this->json([
            'success' => true,
            'isFavorite' => $isFavorite,
            'favoriteId' => $favorite?->getId()
        ]);
    }

    /**
     * Statistiques des favoris
     */
//    #[Route('/stats', name: 'favorite_stats', methods: ['GET'])]
//    public function stats(): JsonResponse
//    {
//        $user = $this->getUser();
//        $count = $this->favoriteRepository->countByUser($user);
//
//        return $this->json([
//            'success' => true,
//            'totalFavorites' => $count
//        ]);
//    }

    /**
     * Livres les plus favorisés (public)
     */
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