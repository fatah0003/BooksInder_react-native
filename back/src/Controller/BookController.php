<?php

namespace App\Controller;

use App\Entity\Book;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use App\Entity\User;

#[Route('/api/books', name: 'api_books_')]
class BookController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(BookRepository $bookRepository): JsonResponse
    {
        $books = $bookRepository->findAll();

        // plus besoin du Serializer ici :
        return $this->json($books, 200, [], ['groups' => 'book:read']);
    }

    #[Route('/user/{id}', name: 'list_by_user', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function listByUser(User $user): JsonResponse
    {
        // Un utilisateur ne peut voir que ses livres sauf admin
        if ($this->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        return $this->json($user->getBooks(), 200, [], ['groups' => 'book:read']);
    }


    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(Book $book): JsonResponse
    {
        return $this->json($book, 200, [], ['groups' => 'book:read']);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request, EntityManagerInterface $em, SerializerInterface $serializer): JsonResponse
    {
        $book = $serializer->deserialize($request->getContent(), Book::class, 'json', ['groups' => 'book:write']);

        $book->setCreatedAt(new \DateTimeImmutable());
        $book->setUpdatedAt(new \DateTimeImmutable());
        $book->setUser($this->getUser()); // lie automatiquement le livre à l'utilisateur connecté

        $em->persist($book);
        $em->flush();

        return $this->json($book, 201, [], ['groups' => ['book:read']]);
    }


    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request, Book $book, EntityManagerInterface $em, SerializerInterface $serializer): JsonResponse
    {
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
        $em->remove($book);
        $em->flush();

        return $this->json(null, 204);
    }
}
