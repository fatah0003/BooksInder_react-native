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
            ->addSelect('ur', 'ure', 'b1', 'b2')
            ->leftJoin('e.userRequester', 'ur')
            ->leftJoin('e.userReceiver', 'ure')
            ->leftJoin('e.bookOne', 'b1')
            ->leftJoin('e.bookTwo', 'b2')
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
            ->addSelect('ur', 'ure', 'b1', 'b2')
            ->leftJoin('e.userRequester', 'ur')
            ->leftJoin('e.userReceiver', 'ure')
            ->leftJoin('e.bookOne', 'b1')
            ->leftJoin('e.bookTwo', 'b2')
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
            ->addSelect('ur', 'ure', 'b1', 'b2')
            ->leftJoin('e.userRequester', 'ur')
            ->leftJoin('e.userReceiver', 'ure')
            ->leftJoin('e.bookOne', 'b1')
            ->leftJoin('e.bookTwo', 'b2')
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
            ->addSelect('ur', 'ure', 'b1', 'b2')
            ->leftJoin('e.userRequester', 'ur')
            ->leftJoin('e.userReceiver', 'ure')
            ->leftJoin('e.bookOne', 'b1')
            ->leftJoin('e.bookTwo', 'b2')
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
            ->addSelect('ur', 'ure', 'b1', 'b2')
            ->leftJoin('e.userRequester', 'ur')
            ->leftJoin('e.userReceiver', 'ure')
            ->leftJoin('e.bookOne', 'b1')
            ->leftJoin('e.bookTwo', 'b2')
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
            ->addSelect('ur', 'ure', 'b1', 'b2')
            ->leftJoin('e.userRequester', 'ur')
            ->leftJoin('e.userReceiver', 'ure')
            ->leftJoin('e.bookOne', 'b1')
            ->leftJoin('e.bookTwo', 'b2')
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
            ->addSelect('ur', 'ure', 'b1', 'b2')
            ->leftJoin('e.userRequester', 'ur')
            ->leftJoin('e.userReceiver', 'ure')
            ->leftJoin('e.bookOne', 'b1')
            ->leftJoin('e.bookTwo', 'b2')
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
            ->addSelect('b', 'ur', 'ure', 'b2')
            ->join('e.bookOne', 'b')
            ->leftJoin('e.userRequester', 'ur')
            ->leftJoin('e.userReceiver', 'ure')
            ->leftJoin('e.bookTwo', 'b2')
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
        $qb = $this->createQueryBuilder('e')
            ->select([
                'COUNT(e.id) AS total',
                "SUM(CASE WHEN e.userReceiver = :user AND e.status = :pending THEN 1 ELSE 0 END) AS pending",
                "SUM(CASE WHEN e.status = :validated THEN 1 ELSE 0 END) AS validated",
                "SUM(CASE WHEN e.userRequester = :user AND e.status = :rejected THEN 1 ELSE 0 END) AS rejected",
                "SUM(CASE WHEN e.userRequester = :user THEN 1 ELSE 0 END) AS sent",
                "SUM(CASE WHEN e.userReceiver = :user THEN 1 ELSE 0 END) AS received",
            ])
            ->where('e.userRequester = :user OR e.userReceiver = :user')
            ->setParameter('user', $user)
            ->setParameter('pending', ExchangeStatusEnum::PENDING)
            ->setParameter('validated', ExchangeStatusEnum::VALIDATED)
            ->setParameter('rejected', ExchangeStatusEnum::REJECTED);

        $result = $qb->getQuery()->getSingleResult();

        return [
            'total'     => (int) $result['total'],
            'pending'   => (int) $result['pending'],
            'validated' => (int) $result['validated'],
            'rejected'  => (int) $result['rejected'],
            'sent'      => (int) $result['sent'],
            'received'  => (int) $result['received'],
        ];
    }

    /**
     * Trouve un échange par son UUID
     */
    public function findOneByUuid(string $uuid): ?Exchange
    {
        return $this->createQueryBuilder('e')
            ->where('e.uuid = :uuid')
            ->setParameter('uuid', $uuid)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
