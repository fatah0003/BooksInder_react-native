<?php

namespace App\Controller;

use App\Entity\Book;
use App\Entity\User;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

#[Route('/api/books', name: 'api_books_')]
class BookController extends AbstractController
{
    private const MAX_LIMIT = 100;
    private const DEFAULT_LIMIT = 10;
    private const CACHE_TTL = 300; // 5 minutes

    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly CacheInterface $cache,
    ) {}

    /**
     * Liste paginée avec filtres
     *
     * Query params:
     * - page: numéro de page (default: 1)
     * - limit: nombre d'items par page (default: 10, max: 100)
     * - userId: filtrer par utilisateur (plutard pour l'admin)
     * - category: filtrer par catégorie
     * - availableExchangeType : filtrer par type d'échange(définif ou temporaire)
     * - state: filtrer par état (NEW, LIKE_NEW, GOOD, etc.)
     * - status: filtrer par statut (ACTIVE, INACTIVE, etc.)
     * - location: filtrer par localisation
     * - search: recherche textuelle (title, author, ISBN)
     * - orderBy: champ de tri (default: createdAt)
     * - order: direction du tri (ASC/DESC, default: DESC)
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request, BookRepository $bookRepository): JsonResponse
    {
        // Validation et normalisation des paramètres
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(self::MAX_LIMIT, max(1, (int) $request->query->get('limit', self::DEFAULT_LIMIT)));

        // Construction des filtres
        $filters = [];

//        if ($userId = $request->query->get('userId')) {
//            $filters['userId'] = (int) $userId;
//        }    --à remttre plutard

        if ($category = $request->query->get('category')) {
            $filters['category'] = $category;
        }

        if ($availableExchangeType = $request->query->get('availableExchangeType')) {
            $filters['availableExchangeType'] = $availableExchangeType;
        }

        if ($state = $request->query->get('state')) {
            $filters['state'] = $state;
        }

        if ($status = $request->query->get('status')) {
            $filters['status'] = $status;
        }

        if ($location = $request->query->get('location')) {
            $filters['location'] = $location;
        }

        if ($search = $request->query->get('search')) {
            $filters['search'] = trim($search);
        }

        $orderBy = $request->query->get('orderBy', 'createdAt');
        $order = strtoupper($request->query->get('order', 'DESC'));

        // Validation des champs de tri autorisés
        $allowedOrderBy = ['id', 'title', 'author', 'createdAt', 'updatedAt', 'pages'];
        if (!in_array($orderBy, $allowedOrderBy)) {
            $orderBy = 'createdAt';
        }

        if (!in_array($order, ['ASC', 'DESC'])) {
            $order = 'DESC';
        }

        $filters['orderBy'] = $orderBy;
        $filters['order'] = $order;

        try {
            // Récupération des livres avec filtres
            $books = $bookRepository->findPaginated($page, $limit, $filters);

            // Cache du count total pour éviter les requêtes répétées
            $cacheKey = 'books_count_' . md5(serialize($filters));
            $totalItems = $this->cache->get($cacheKey, function (ItemInterface $item) use ($bookRepository, $filters) {
                $item->expiresAfter(self::CACHE_TTL);
                return $bookRepository->countWithFilters($filters);
            });

            $totalPages = (int) ceil($totalItems / $limit);
            $hasNextPage = $page < $totalPages;
            $hasPreviousPage = $page > 1;

            return $this->json([
                'success' => true,
                'data' => $books,
                'pagination' => [
                    'currentPage' => $page,
                    'itemsPerPage' => $limit,
                    'totalItems' => $totalItems,
                    'totalPages' => $totalPages,
                    'hasNextPage' => $hasNextPage,
                    'hasPreviousPage' => $hasPreviousPage,
                    'nextPage' => $hasNextPage ? $page + 1 : null,
                    'previousPage' => $hasPreviousPage ? $page - 1 : null,
                ],
                'filters' => array_filter($filters, fn($key) => !in_array($key, ['orderBy', 'order']), ARRAY_FILTER_USE_KEY),
                'sort' => [
                    'orderBy' => $orderBy,
                    'order' => $order,
                ],
            ], 200, [], ['groups' => 'book:read']);

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des livres', [
                'error' => $e->getMessage(),
                'filters' => $filters,
            ]);

            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue lors de la récupération des livres',
            ], 500);
        }
    }
// récupérer tout les livres d'un user, à enlever plutard, et gerer ça dans exchangeController
//    #[Route('/user/{id}', name: 'list_books_by_user', methods: ['GET'])]
//    public function listBooksByUser(User $user): JsonResponse
//    {
//        return $this->json(
//            $user->getBooks(),
//            200,
//            [],
//            ['groups' => 'book:read']
//        );
//    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(Book $book): JsonResponse
    {
        return $this->json($book, 200, [], ['groups' => 'book:read']);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, SerializerInterface $serializer): JsonResponse
    {
        $book = $serializer->deserialize(
            $request->getContent(),
            Book::class,
            'json',
            ['groups' => 'book:write']
        );

        $book->setCreatedAt(new \DateTimeImmutable());
        $book->setUpdatedAt(new \DateTimeImmutable());
        $book->setUser($this->getUser());

        $em->persist($book);
        $em->flush();

        return $this->json($book, 201, [], ['groups' => 'book:read']);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request, Book $book, EntityManagerInterface $em, SerializerInterface $serializer): JsonResponse
    {
        if ($book->getUser() !== $this->getUser() && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $serializer->deserialize(
            $request->getContent(),
            Book::class,
            'json',
            ['object_to_populate' => $book, 'groups' => 'book:write']
        );

        $book->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();

        return $this->json($book, 200, [], ['groups' => 'book:read']);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Book $book, EntityManagerInterface $em): JsonResponse
    {
        if ($book->getUser() !== $this->getUser() && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $em->remove($book);
        $em->flush();

        return $this->json(null, 204);
    }
}
