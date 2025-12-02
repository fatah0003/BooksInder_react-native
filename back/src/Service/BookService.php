<?php

namespace App\Service;

use App\DTO\Book\CreateBookDTO;
use App\DTO\Book\UpdateBookDTO;
use App\Entity\Book;
use App\Entity\User;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

class BookService
{
    private const CACHE_TTL = 300; // 5 minutes

    public function __construct(
        private readonly BookRepository $bookRepository,
        private readonly EntityManagerInterface $em,
        private readonly CacheInterface $cache,
        private readonly LoggerInterface $logger
    ) {}

    /**
     * Construit et normalise les paramètres de requête (filtres + pagination)
     */
    public function buildQueryParams(array $query): array
    {
        $page = max(1, (int)($query['page'] ?? 1));
        $limit = min(100, max(1, (int)($query['limit'] ?? 10)));

        $filters = array_filter([
            'category' => $query['category'] ?? null,
            'availableExchangeType' => $query['availableExchangeType'] ?? null,
            'state' => $query['state'] ?? null,
            'status' => $query['status'] ?? null,
            'location' => $query['location'] ?? null,
            'search' => isset($query['search']) ? trim($query['search']) : null,
        ]);

        // ----- Tri -----
        $allowedOrderBy = ['id', 'title', 'author', 'createdAt', 'updatedAt', 'pages'];

        $orderBy = $query['orderBy'] ?? 'createdAt';
        if (!in_array($orderBy, $allowedOrderBy)) {
            $orderBy = 'createdAt';
        }

        $order = strtoupper($query['order'] ?? 'DESC');
        if (!in_array($order, ['ASC', 'DESC'])) {
            $order = 'DESC';
        }

        $filters['orderBy'] = $orderBy;
        $filters['order'] = $order;

        return compact('page', 'limit', 'filters');
    }


    /**
     * Récupère les livres paginés avec cache
     */
    public function getPaginatedBooks(int $page, int $limit, array $filters): array
    {
        try {
            $books = $this->bookRepository->findPaginated($page, $limit, $filters);

            // Cache pour le count total
            $cacheKey = 'books_count_' . md5(serialize($filters));
            $totalItems = $this->cache->get($cacheKey, function (ItemInterface $item) use ($filters) {
                $item->expiresAfter(self::CACHE_TTL);
                return $this->bookRepository->countWithFilters($filters);
            });

            $totalPages = (int)ceil($totalItems / $limit);

            return [
                'success' => true,
                'data' => $books,
                'pagination' => [
                    'currentPage' => $page,
                    'itemsPerPage' => $limit,
                    'totalItems' => $totalItems,
                    'totalPages' => $totalPages,
                    'hasNextPage' => $page < $totalPages,
                    'hasPreviousPage' => $page > 1,
                    'nextPage' => $page < $totalPages ? $page + 1 : null,
                    'previousPage' => $page > 1 ? $page - 1 : null,
                ],
                'filters' => array_filter(
                    $filters,
                    fn($key) => !in_array($key, ['orderBy', 'order']),
                    ARRAY_FILTER_USE_KEY
                ),
                'sort' => [
                    'orderBy' => $filters['orderBy'],
                    'order' => $filters['order'],
                ],
            ];
        } catch (\Exception $e) {
            $this->logger->error('Erreur récupération livres', [
                'error' => $e->getMessage(),
                'filters' => $filters,
            ]);

            throw $e;
        }
    }

    /**
     * Crée un nouveau livre à partir d'un DTO
     */
    public function createBook(User $user, CreateBookDTO $dto): Book
    {
        $book = new Book();
        $book->setUser($user);
        $book->setTitle($dto->title);
        $book->setAuthor($dto->author);
        $book->setIsbn($dto->isbn);
        $book->setDescription($dto->description);
        $book->setPages($dto->pages);
        $book->setEdition($dto->edition);
        $book->setLocation($dto->location);
        $book->setCategorie($dto->categorie);
        $book->setState($dto->state);
        $book->setBookStatus($dto->bookStatus);
        $book->setAvailableExchangeTypes($dto->availableExchangeTypes);
        $book->setCreatedAt(new \DateTimeImmutable());
        $book->setUpdatedAt(new \DateTimeImmutable());

        $this->em->persist($book);
        $this->em->flush();

        $this->logger->info('Livre créé', ['bookId' => $book->getId(), 'userId' => $user->getId()]);

        return $book;
    }

    /**
     * Met à jour un livre existant à partir d'un DTO
     */
    public function updateBook(Book $book, User $user, UpdateBookDTO $dto): Book
    {
        // Vérification des droits
        if ($book->getUser() !== $user && !in_array('ROLE_ADMIN', $user->getRoles())) {
            throw new AccessDeniedHttpException('Vous n\'êtes pas autorisé à modifier ce livre');
        }

        // Mise à jour uniquement des champs fournis
        if ($dto->title !== null) {
            $book->setTitle($dto->title);
        }
        if ($dto->author !== null) {
            $book->setAuthor($dto->author);
        }
        if ($dto->isbn !== null) {
            $book->setIsbn($dto->isbn);
        }
        if ($dto->description !== null) {
            $book->setDescription($dto->description);
        }
        if ($dto->pages !== null) {
            $book->setPages($dto->pages);
        }
        if ($dto->edition !== null) {
            $book->setEdition($dto->edition);
        }
        if ($dto->location !== null) {
            $book->setLocation($dto->location);
        }
        if ($dto->categorie !== null) {
            $book->setCategorie($dto->categorie);
        }
        if ($dto->state !== null) {
            $book->setState($dto->state);
        }
        if ($dto->bookStatus !== null) {
            $book->setBookStatus($dto->bookStatus);
        }
        if ($dto->availableExchangeTypes !== null) {
            $book->setAvailableExchangeTypes($dto->availableExchangeTypes);
        }

        $book->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->logger->info('Livre mis à jour', ['bookId' => $book->getId()]);

        return $book;
    }

    /**
     * Supprime un livre
     */
    public function deleteBook(Book $book, User $user): void
    {
        if ($book->getUser() !== $user && !in_array('ROLE_ADMIN', $user->getRoles())) {
            throw new AccessDeniedHttpException('Vous n\'êtes pas autorisé à supprimer ce livre');
        }

        $bookId = $book->getId();

        $this->em->remove($book);
        $this->em->flush();

        $this->logger->info('Livre supprimé', ['bookId' => $bookId]);
    }
}