<?php

namespace App\Controller;

use App\DTO\Book\CreateBookDTO;
use App\DTO\Book\UpdateBookDTO;
use App\Entity\Book;
use App\Service\BookService;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/books', name: 'api_books_')]
class BookController extends AbstractController
{
    public function __construct(
        private readonly BookService $bookService,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly LoggerInterface $logger
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
        try {
            $params = $this->bookService->buildQueryParams($request->query->all());

            $response = $this->bookService->getPaginatedBooks(
                $params['page'],
                $params['limit'],
                $params['filters']
            );

            return $this->json($response, 200, [], ['groups' => 'book:read']);

        } catch (\Exception $e) {
            $this->logger->error('Erreur liste livres', ['error' => $e->getMessage()]);

            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue lors de la récupération des livres'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Afficher un livre
     */
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(Book $book): JsonResponse
    {
        return $this->json([
            'success' => true,
            'data' => $book
        ], 200, [], ['groups' => 'book:read']);
    }

    /**
     * Créer un livre
     */
    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {
        try {
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

        } catch (\Exception $e) {
            $this->logger->error('Erreur création livre', ['error' => $e->getMessage()]);

            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue lors de la création du livre'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Mettre à jour un livre
     */
    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function update(Request $request, Book $book): JsonResponse
    {
        try {
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

        } catch (AccessDeniedHttpException $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], Response::HTTP_FORBIDDEN);

        } catch (\Exception $e) {
            $this->logger->error('Erreur mise à jour livre', ['error' => $e->getMessage()]);

            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue lors de la mise à jour du livre'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Supprimer un livre
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(Book $book): JsonResponse
    {
        try {
            $this->bookService->deleteBook($book, $this->getUser());

            return $this->json([
                'success' => true,
                'message' => 'Livre supprimé avec succès'
            ]);

        } catch (AccessDeniedHttpException $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], Response::HTTP_FORBIDDEN);

        } catch (\Exception $e) {
            $this->logger->error('Erreur suppression livre', ['error' => $e->getMessage()]);

            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue lors de la suppression du livre'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
