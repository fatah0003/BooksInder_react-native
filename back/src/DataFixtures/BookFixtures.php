<?php

namespace App\DataFixtures;

use App\Entity\Book;
use App\Entity\Image;
use App\Entity\User;
use App\Enum\BookCategorieEnum;
use App\Enum\BookStatusEnum;
use App\Enum\ExchangeTypeEnum;
use App\Enum\StateEnum;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;

class BookFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        $admin = $this->getReference('user_admin', User::class);
        $user = $this->getReference('user_regular', User::class);

        // Chemin vers des images de test
        $projectDir = dirname(__DIR__, 2);
        $fixturesImagesDir = $projectDir . '/fixtures/images';
        $uploadsDir = $projectDir . '/public/uploads/books';

        // Créer les dossiers si n'existent pas
        if (!is_dir($fixturesImagesDir)) {
            mkdir($fixturesImagesDir, 0777, true);
        }
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0777, true);
        }

        // Créer des images de test si elles n'existent pas
        $this->createTestImages($fixturesImagesDir);

        for ($i = 1; $i <= 10; $i++) {
            $book = new Book();
            $book->setTitle("Livre de test $i")
                ->setAuthor("Auteur $i")
                ->setIsbn('978' . random_int(100000000, 999999999))
                ->setDescription("Ceci est la description du livre $i.")
                ->setPages(random_int(100, 600))
                ->setEdition("Édition $i")
                ->setLocation("Lyon")
                ->setCategorie([BookCategorieEnum::FICTION])
                ->setState(StateEnum::GOOD)
                ->setBookStatus(BookStatusEnum::ACTIVE)
                ->setUser($i % 2 === 0 ? $admin : $user);

            // Types d'échange selon l'index
            if ($i <= 3) {
                $book->setAvailableExchangeTypes([ExchangeTypeEnum::TEMPORARY]);
            } elseif ($i <= 6) {
                $book->setAvailableExchangeTypes([ExchangeTypeEnum::PERMANENT]);
            } else {
                $book->setAvailableExchangeTypes([
                    ExchangeTypeEnum::TEMPORARY,
                    ExchangeTypeEnum::PERMANENT
                ]);
            }

            $manager->persist($book);
            $manager->flush(); // Flush pour avoir l'ID du book

            // Ajouter des images (alternance)
            if ($i % 3 !== 0) { // 2 livres sur 3 auront une image front
                $imageFront = new Image();
                $imageFront->setType('front');
                $imageFront->setBook($book);

                // Copier manuellement le fichier et définir le nom
                $sourceFile = $fixturesImagesDir . '/test_front.jpg';
                $fileName = uniqid() . '_front.jpg';
                $destinationFile = $uploadsDir . '/' . $fileName;

                if (file_exists($sourceFile)) {
                    copy($sourceFile, $destinationFile);
                    $imageFront->setImageName($fileName); // 👈 Définir manuellement
                }

                $manager->persist($imageFront);
            }

            if ($i % 2 === 0) { // 1 livre sur 2 aura une image back
                $imageBack = new Image();
                $imageBack->setType('back');
                $imageBack->setBook($book);

                // Copier manuellement le fichier et définir le nom
                $sourceFile = $fixturesImagesDir . '/test_back.jpg';
                $fileName = uniqid() . '_back.jpg';
                $destinationFile = $uploadsDir . '/' . $fileName;

                if (file_exists($sourceFile)) {
                    copy($sourceFile, $destinationFile);
                    $imageBack->setImageName($fileName); // 👈 Définir manuellement
                }

                $manager->persist($imageBack);
            }
        }

        $manager->flush();
    }

    /**
     * Créer des images de test factices
     */
    private function createTestImages(string $dir): void
    {
        $frontPath = $dir . '/test_front.jpg';
        $backPath = $dir . '/test_back.jpg';

        // Créer une image front si n'existe pas
        if (!file_exists($frontPath)) {
            $img = imagecreatetruecolor(400, 600);
            $bgColor = imagecolorallocate($img, 100, 149, 237); // Bleu
            imagefill($img, 0, 0, $bgColor);
            $textColor = imagecolorallocate($img, 255, 255, 255);
            imagestring($img, 5, 150, 290, 'FRONT COVER', $textColor);
            imagejpeg($img, $frontPath, 80);
            imagedestroy($img);
        }

        // Créer une image back si n'existe pas
        if (!file_exists($backPath)) {
            $img = imagecreatetruecolor(400, 600);
            $bgColor = imagecolorallocate($img, 46, 139, 87); // Vert
            imagefill($img, 0, 0, $bgColor);
            $textColor = imagecolorallocate($img, 255, 255, 255);
            imagestring($img, 5, 150, 290, 'BACK COVER', $textColor);
            imagejpeg($img, $backPath, 80);
            imagedestroy($img);
        }
    }

    public function getDependencies(): array
    {
        return [UserFixtures::class];
    }
}
