<?php

namespace App\Controller;

use App\Entity\Book;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/books', name: 'api_books_')]
class BookController extends AbstractController
{
    // LIST ALL BOOKS
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(BookRepository $bookRepository): JsonResponse
    {
        $books = $bookRepository->findAll();

        $data = [];
        foreach ($books as $book) {
            $data[] = $this->serializeBook($book);
        }

        return new JsonResponse($data, 200);
    }

    // SHOW ONE BOOK
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(Book $book): JsonResponse
    {
        return new JsonResponse($this->serializeBook($book), 200);
    }

    // CREATE BOOK
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $book = new Book();
        $book->setTitle($data['title']);
        $book->setAuthor($data['author']);
        $book->setIsbn($data['isbn']);
        $book->setDescription($data['description']);
        $book->setPages($data['pages']);
        $book->setCreatedAt(new \DateTimeImmutable());
        $book->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($book);
        $em->flush();

        return new JsonResponse($this->serializeBook($book), 201);
    }

    // UPDATE BOOK
    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request, Book $book, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $book->setTitle($data['title'] ?? $book->getTitle());
        $book->setAuthor($data['author'] ?? $book->getAuthor());
        $book->setIsbn($data['isbn'] ?? $book->getIsbn());
        $book->setDescription($data['description'] ?? $book->getDescription());
        $book->setPages($data['pages'] ?? $book->getPages());
        $book->setUpdatedAt(new \DateTimeImmutable());

        $em->flush();

        return new JsonResponse($this->serializeBook($book), 200);
    }

    // DELETE BOOK
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Book $book, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($book);
        $em->flush();

        return new JsonResponse(null, 204);
    }

    // HELPER FUNCTION TO SERIALIZE BOOK
    private function serializeBook(Book $book): array
    {
        return [
            'id' => $book->getId(),
            'title' => $book->getTitle(),
            'author' => $book->getAuthor(),
            'isbn' => $book->getIsbn(),
            'description' => $book->getDescription(),
            'pages' => $book->getPages(),
            'createdAt' => $book->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $book->getUpdatedAt()?->format('Y-m-d H:i:s'),
        ];
    }
}
