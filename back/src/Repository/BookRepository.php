<?php

namespace App\Repository;

use App\Entity\Book;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Book>
 */
class BookRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Book::class);
    }

    /**
     * Pagination optimisée avec filtres
     */
    public function findPaginated(
        int $page = 1,
        int $limit = 10,
        ?array $filters = null
    ): array {
        $qb = $this->createQueryBuilder('b')
            ->leftJoin('b.user', 'u')
            ->addSelect('u');

        // Filtres dynamiques
//        if (isset($filters['userId'])) {
//            $qb->andWhere('b.user = :userId')
//                ->setParameter('userId', $filters['userId']);   --à remttre plutard
//        }

        if (isset($filters['category'])) {
            $qb->andWhere('JSON_CONTAINS(b.categorie, :category) = 1')
                ->setParameter('category', json_encode($filters['category']));
        }

        if (isset($filters['state'])) {
            $qb->andWhere('b.state = :state')
                ->setParameter('state', $filters['state']);
        }

        if (isset($filters['status'])) {
            $qb->andWhere('b.bookStatus = :status')
                ->setParameter('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $qb->andWhere('b.title LIKE :search OR b.author LIKE :search OR b.isbn LIKE :search')
                ->setParameter('search', '%' . $filters['search'] . '%');
        }

        if (isset($filters['location'])) {
            $qb->andWhere('b.location = :location')
                ->setParameter('location', $filters['location']);
        }

        // Tri
        $orderBy = $filters['orderBy'] ?? 'createdAt';
        $order = $filters['order'] ?? 'DESC';
        $qb->orderBy('b.' . $orderBy, $order);

        // Pagination
        $offset = ($page - 1) * $limit;
        $qb->setFirstResult($offset)
            ->setMaxResults($limit);

        return $qb->getQuery()->getResult();
    }

    /**
     * Count optimisé avec cache
     */
    public function countWithFilters(?array $filters = null): int
    {
        $qb = $this->createQueryBuilder('b')
            ->select('COUNT(b.id)');

        // Appliquer les mêmes filtres que findPaginated
//        if (isset($filters['userId'])) {
//            $qb->andWhere('b.user = :userId')
//                ->setParameter('userId', $filters['userId']);   --à remttre plutard
//        }

        if (isset($filters['category'])) {
            $qb->andWhere('CONTAINS(b.categorie, :category) = true')
                ->setParameter('category', $filters['category']);
        }

        if (isset($filters['state'])) {
            $qb->andWhere('b.state = :state')
                ->setParameter('state', $filters['state']);
        }

        if (isset($filters['status'])) {
            $qb->andWhere('b.bookStatus = :status')
                ->setParameter('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $qb->andWhere('b.title LIKE :search OR b.author LIKE :search OR b.isbn LIKE :search')
                ->setParameter('search', '%' . $filters['search'] . '%');
        }

        if (isset($filters['location'])) {
            $qb->andWhere('b.location = :location')
                ->setParameter('location', $filters['location']);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}
