<?php

namespace App\Repository;

use App\Entity\Exchange;
use App\Entity\Book;
use App\Entity\User;
use App\Enum\ExchangeStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Exchange>
 */
class ExchangeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Exchange::class);
    }

    /**
     * Trouve les dernières demandes envoyées par l'utilisateur
     */
    public function findLatestSentRequests(User $user, int $limit = 10): array
    {
        return $this->createQueryBuilder('e')
            ->where('e.userRequester = :user')
            ->setParameter('user', $user)
            ->orderBy('e.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les dernières demandes reçues en attente
     */
    public function findLatestReceivedRequests(User $user, int $limit = 10): array
    {
        return $this->createQueryBuilder('e')
            ->where('e.userReceiver = :user')
            ->andWhere('e.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', ExchangeStatusEnum::PENDING)
            ->orderBy('e.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les demandes reçues par statut
     */
    public function findReceivedByStatus(User $user, ExchangeStatusEnum $status, int $limit = 10): array
    {
        return $this->createQueryBuilder('e')
            ->where('e.userReceiver = :user')
            ->andWhere('e.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', $status)
            ->orderBy('e.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les derniers échanges complétés (validés ou refusés)
     */
    public function findLatestCompletedRequests(User $user, int $limit = 10): array
    {
        return $this->createQueryBuilder('e')
            ->where('e.userRequester = :user OR e.userReceiver = :user')
            ->andWhere('e.status IN (:statuses)')
            ->setParameter('user', $user)
            ->setParameter('statuses', [
                ExchangeStatusEnum::VALIDATED,
                ExchangeStatusEnum::REJECTED
            ])
            ->orderBy('e.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les échanges validés de l'utilisateur
     */
    public function findValidatedExchanges(User $user, int $limit = 10): array
    {
        return $this->createQueryBuilder('e')
            ->where('e.userRequester = :user OR e.userReceiver = :user')
            ->andWhere('e.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', ExchangeStatusEnum::VALIDATED)
            ->orderBy('e.acceptedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Vérifie si un livre est déjà en cours d'échange
     */
    public function existsOpenExchangeForBook(Book $book): bool
    {
        $count = $this->createQueryBuilder('e')
            ->select('COUNT(e.id)')
            ->where('e.bookOne = :book OR e.bookTwo = :book')
            ->andWhere('e.status IN (:statuses)')
            ->setParameter('book', $book)
            ->setParameter('statuses', [
                ExchangeStatusEnum::PENDING,
                ExchangeStatusEnum::VALIDATED
            ])
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    /**
     * Trouve une demande en attente pour un utilisateur et un livre spécifique
     */
    public function findPendingExchangeByUserAndBook(User $user, Book $book): ?Exchange
    {
        return $this->createQueryBuilder('e')
            ->where('e.userRequester = :user')
            ->andWhere('e.bookOne = :book')
            ->andWhere('e.status = :status')
            ->setParameter('user', $user)
            ->setParameter('book', $book)
            ->setParameter('status', ExchangeStatusEnum::PENDING)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Compte le nombre de demandes en attente pour un utilisateur
     */
    public function countPendingReceivedRequests(User $user): int
    {
        return $this->createQueryBuilder('e')
            ->select('COUNT(e.id)')
            ->where('e.userReceiver = :user')
            ->andWhere('e.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', ExchangeStatusEnum::PENDING)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Trouve tous les échanges impliquant un livre
     */
    public function findExchangesByBook(Book $book): array
    {
        return $this->createQueryBuilder('e')
            ->where('e.bookOne = :book OR e.bookTwo = :book')
            ->setParameter('book', $book)
            ->orderBy('e.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les échanges en attente où l'utilisateur est le propriétaire du livre demandé
     */
    public function findPendingRequestsForUserBooks(User $user): array
    {
        return $this->createQueryBuilder('e')
            ->join('e.bookOne', 'b')
            ->where('b.user = :user')
            ->andWhere('e.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', ExchangeStatusEnum::PENDING)
            ->orderBy('e.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Statistiques des échanges d'un utilisateur
     */
    public function getUserExchangeStats(User $user): array
    {
        $qb = $this->createQueryBuilder('e');

        $stats = [
            'total' => 0,
            'pending' => 0,
            'validated' => 0,
            'rejected' => 0,
            'sent' => 0,
            'received' => 0,
        ];

        // Total des échanges
        $stats['total'] = $qb
            ->select('COUNT(e.id)')
            ->where('e.userRequester = :user OR e.userReceiver = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        // En attente
        $stats['pending'] = $this->createQueryBuilder('e')
            ->select('COUNT(e.id)')
            ->where('e.userReceiver = :user')
            ->andWhere('e.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', ExchangeStatusEnum::PENDING)
            ->getQuery()
            ->getSingleScalarResult();

        // Validés
        $stats['validated'] = $this->createQueryBuilder('e')
            ->select('COUNT(e.id)')
            ->where('e.userRequester = :user OR e.userReceiver = :user')
            ->andWhere('e.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', ExchangeStatusEnum::VALIDATED)
            ->getQuery()
            ->getSingleScalarResult();

        // Refusés
        $stats['rejected'] = $this->createQueryBuilder('e')
            ->select('COUNT(e.id)')
            ->where('e.userRequester = :user')
            ->andWhere('e.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', ExchangeStatusEnum::REJECTED)
            ->getQuery()
            ->getSingleScalarResult();

        // Envoyés
        $stats['sent'] = $this->createQueryBuilder('e')
            ->select('COUNT(e.id)')
            ->where('e.userRequester = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        // Reçus
        $stats['received'] = $this->createQueryBuilder('e')
            ->select('COUNT(e.id)')
            ->where('e.userReceiver = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return $stats;
    }
}