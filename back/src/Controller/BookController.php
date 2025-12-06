<?php

namespace App\Controller;

use App\DTO\Book\CreateBookDTO;
use App\DTO\Book\UpdateBookDTO;
use App\Exception\ResourceNotFoundException;
use App\Repository\BookRepository;
use App\Service\BookService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/books', name: 'api_books_')]
class BookController extends AbstractController
{
    public function __construct(
        private readonly BookService $bookService,
        private readonly BookRepository $bookRepository,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {}

    /**
     * Liste paginée avec filtres
     *
     * Query params:
     * - page, limit, category, availableExchangeType, state, status, location, search, orderBy, order
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $params = $this->bookService->buildQueryParams($request->query->all());

        $response = $this->bookService->getPaginatedBooks(
            $params['page'],
            $params['limit'],
            $params['filters']
        );

        return $this->json($response, 200, [], ['groups' => 'book:read']);
    }

    /**
     * Afficher un livre
     */
    #[Route('/{uuid}', name: 'show', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['GET'])]
    public function show(string $uuid): JsonResponse
    {
        $book = $this->bookRepository->findOneByUuid($uuid);

        if (!$book) {
            throw new ResourceNotFoundException('Livre', $uuid);
        }

        return $this->json([
            'success' => true,
            'data' => $book
        ], 200, [], ['groups' => 'book:read']);
    }

    /**
     * Créer un livre
     */
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var CreateBookDTO $dto */
        $dto = $this->serializer->deserialize(
            $request->getContent(),
            CreateBookDTO::class,
            'json'
        );

        // Validation
        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'success' => false,
                'errors' => $errorMessages
            ], Response::HTTP_BAD_REQUEST);
        }

        $book = $this->bookService->createBook($this->getUser(), $dto);

        return $this->json([
            'success' => true,
            'message' => 'Livre créé avec succès',
            'data' => $book
        ], Response::HTTP_CREATED, [], ['groups' => 'book:read']);
    }

    /**
     * Mettre à jour un livre
     */
    #[Route('/{uuid}', name: 'update', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['PUT', 'PATCH'])]
    public function update(Request $request, string $uuid): JsonResponse
    {
        $book = $this->bookRepository->findOneByUuid($uuid);

        if (!$book) {
            throw new ResourceNotFoundException('Livre', $uuid);
        }

        /** @var UpdateBookDTO $dto */
        $dto = $this->serializer->deserialize(
            $request->getContent(),
            UpdateBookDTO::class,
            'json'
        );

        // Validation
        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'success' => false,
                'errors' => $errorMessages
            ], Response::HTTP_BAD_REQUEST);
        }

        $book = $this->bookService->updateBook($book, $this->getUser(), $dto);

        return $this->json([
            'success' => true,
            'message' => 'Livre mis à jour avec succès',
            'data' => $book
        ], 200, [], ['groups' => 'book:read']);
    }

    /**
     * Supprimer un livre
     */
    #[Route('/{uuid}', name: 'delete', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['DELETE'])]
    public function delete(string $uuid): JsonResponse
    {
        $book = $this->bookRepository->findOneByUuid($uuid);

        if (!$book) {
            throw new ResourceNotFoundException('Livre', $uuid);
        }

        $this->bookService->deleteBook($book, $this->getUser());

        return $this->json([
            'success' => true,
            'message' => 'Livre supprimé avec succès'
        ]);
    }
}
