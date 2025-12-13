<?php

namespace App\Repository;

use App\Entity\Favorite;
use App\Entity\User;
use App\Entity\Book;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Favorite>
 */
class FavoriteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Favorite::class);
    }

    /**
     * Trouve tous les favoris d'un utilisateur
     */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('f')
            ->join('f.book', 'b')
            ->where('f.user = :user')
            ->setParameter('user', $user)
            ->orderBy('f.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Vérifie si un livre est dans les favoris d'un utilisateur
     */
    public function isFavorite(User $user, Book $book): bool
    {
        $count = $this->createQueryBuilder('f')
            ->select('COUNT(f.id)')
            ->where('f.user = :user')
            ->andWhere('f.book = :book')
            ->setParameter('user', $user)
            ->setParameter('book', $book)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    /**
     * Trouve un favori spécifique
     */
    public function findOneByUserAndBook(User $user, Book $book): ?Favorite
    {
        return $this->createQueryBuilder('f')
            ->where('f.user = :user')
            ->andWhere('f.book = :book')
            ->setParameter('user', $user)
            ->setParameter('book', $book)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Compte le nombre de favoris d'un utilisateur
     */
    public function countByUser(User $user): int
    {
        return $this->createQueryBuilder('f')
            ->select('COUNT(f.id)')
            ->where('f.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Compte combien de fois un livre a été mis en favori
     */
    public function countByBook(Book $book): int
    {
        return $this->createQueryBuilder('f')
            ->select('COUNT(f.id)')
            ->where('f.book = :book')
            ->setParameter('book', $book)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Trouve les livres les plus favorisés
     */
    public function findMostFavorited(int $limit = 10): array
    {
        return $this->createQueryBuilder('f')
            ->select('b.id, b.title, b.author, COUNT(f.id) as favoriteCount')
            ->join('f.book', 'b')
            ->groupBy('b.id')
            ->orderBy('favoriteCount', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
