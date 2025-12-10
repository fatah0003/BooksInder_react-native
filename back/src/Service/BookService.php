<?php

namespace App\Service;

use App\DTO\Book\CreateBookDTO;
use App\DTO\Book\UpdateBookDTO;
use App\Entity\Book;
use App\Entity\User;
use App\Exception\UnauthorizedActionException;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use App\Entity\Image;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use App\Exception\BusinessValidationException;
use Symfony\Component\HttpKernel\KernelInterface;


class BookService
{
    private const CACHE_TTL = 300; // 5 minutes

    public function __construct(
        private readonly BookRepository $bookRepository,
        private readonly EntityManagerInterface $em,
        private readonly CacheInterface $cache,
        private readonly LoggerInterface $logger,
        private readonly KernelInterface $kernel,
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

        // Tri
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
            throw new UnauthorizedActionException('Vous n\'êtes pas autorisé à modifier ce livre');
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
            throw new UnauthorizedActionException('Vous n\'êtes pas autorisé à supprimer ce livre');
        }

        $bookId = $book->getId();

        $this->em->remove($book);
        $this->em->flush();

        $this->logger->info('Livre supprimé', ['bookId' => $bookId]);
    }

    /**
     * Met à jour une image de couverture (front/back) pour un livre
     */
    /**
     * Met à jour une image de couverture (front/back) pour un livre
     */
    public function updateBookCover(Book $book, User $user, UploadedFile $file, string $side): void
    {
        // Vérification des droits d'accès
        if ($book->getUser() !== $user && !in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            throw new UnauthorizedActionException('Vous n\'êtes pas autorisé à modifier les images de ce livre');
        }

        // Validation du type d'image
        if (!in_array($side, ['front', 'back'], true)) {
            throw new BusinessValidationException('Type d\'image invalide (front/back uniquement)');
        }

        // Validation du fichier
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            throw new BusinessValidationException('Format d\'image invalide. Formats acceptés : JPEG, PNG, WEBP');
        }

        if ($file->getSize() > 5 * 1024 * 1024) { // 5MB
            throw new BusinessValidationException('L\'image ne doit pas dépasser 5 Mo');
        }

        // Supprimer l'ancienne image du même type
        foreach ($book->getImages() as $existingImage) {
            if ($existingImage->getType() === $side) {
                $this->em->remove($existingImage);
            }
        }
        $this->em->flush();

        // Préparer le dossier de destination
        $projectDir = $this->kernel->getProjectDir();
        $uploadsDir = $projectDir . '/public/uploads/books';

        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0775, true);
        }

        // Générer un nom de fichier unique et sécurisé
        $extension = $file->guessExtension() ?: pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION) ?: 'bin';
        $filename = sprintf('book_%s_%s.%s', uniqid('', true), $side, $extension);

        // Déplacer le fichier vers le dossier public
        $file->move($uploadsDir, $filename);

        // Créer la nouvelle entité Image
        $image = new Image();
        $image->setType($side);
        $image->setBook($book);
        $image->setImageName($filename);
        $image->setUpdatedAt(new \DateTimeImmutable());

        // Persister les changements
        $this->em->persist($image);
        $book->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->logger->info('Image de couverture mise à jour', [
            'bookId' => $book->getId(),
            'userId' => $user->getId(),
            'side' => $side,
            'filename' => $filename
        ]);
    }




}
