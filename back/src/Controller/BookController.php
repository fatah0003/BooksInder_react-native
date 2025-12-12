<?php

namespace App\Controller;

use App\DTO\Book\CreateBookDTO;
use App\DTO\Book\UpdateBookDTO;
use App\Entity\User;
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
use Symfony\Component\HttpFoundation\File\UploadedFile;

#[Route('/api/books', name: 'api_books_')]
class BookController extends AbstractController
{
    public function __construct(
        private readonly BookService $bookService,
        private readonly BookRepository $bookRepository,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {}

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

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var CreateBookDTO $dto */
        $dto = $this->serializer->deserialize(
            $request->getContent(),
            CreateBookDTO::class,
            'json'
        );

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

        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('User must be logged in to create a book.');
        }

        $book = $this->bookService->createBook($user, $dto);

        return $this->json([
            'success' => true,
            'message' => 'Livre créé avec succès',
            'data' => $book
        ], Response::HTTP_CREATED, [], ['groups' => 'book:read']);
    }

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

        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('User must be logged in to update a book.');
        }

        $book = $this->bookService->updateBook($book, $user, $dto);

        return $this->json([
            'success' => true,
            'message' => 'Livre mis à jour avec succès',
            'data' => $book
        ], 200, [], ['groups' => 'book:read']);
    }

    #[Route('/{uuid}', name: 'delete', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['DELETE'])]
    public function delete(string $uuid): JsonResponse
    {
        $book = $this->bookRepository->findOneByUuid($uuid);

        if (!$book) {
            throw new ResourceNotFoundException('Livre', $uuid);
        }

        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('User must be logged in to delete a book.');
        }

        $this->bookService->deleteBook($book, $user);

        return $this->json([
            'success' => true,
            'message' => 'Livre supprimé avec succès'
        ]);
    }

    #[Route('/{uuid}/cover-front', name: 'upload_cover_front', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['POST'])]
    public function uploadCoverFront(string $uuid, Request $request): JsonResponse
    {
        $book = $this->bookRepository->findOneByUuid($uuid);

        if (!$book) {
            throw new ResourceNotFoundException('Livre', $uuid);
        }

        /** @var UploadedFile|null $file */
        $file = $request->files->get('file');
        if (!$file) {
            return $this->json([
                'success' => false,
                'error' => 'Aucun fichier fourni (champ "file" requis)'
            ], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('User must be logged in to update cover.');
        }

        $this->bookService->updateBookCover($book, $user, $file, 'front');

        return $this->json([
            'success' => true,
            'message' => 'Image de couverture avant mise à jour',
        ], Response::HTTP_OK);
    }

    #[Route('/{uuid}/cover-back', name: 'upload_cover_back', requirements: ['uuid' => '[0-9a-f-]{36}'], methods: ['POST'])]
    public function uploadCoverBack(string $uuid, Request $request): JsonResponse
    {
        $book = $this->bookRepository->findOneByUuid($uuid);

        if (!$book) {
            throw new ResourceNotFoundException('Livre', $uuid);
        }

        /** @var UploadedFile|null $file */
        $file = $request->files->get('file');
        if (!$file) {
            return $this->json([
                'success' => false,
                'error' => 'Aucun fichier fourni (champ "file" requis)'
            ], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('User must be logged in to update cover.');
        }

        $this->bookService->updateBookCover($book, $user, $file, 'back');

        return $this->json([
            'success' => true,
            'message' => 'Image de couverture arrière mise à jour',
        ], Response::HTTP_OK);
    }
}
