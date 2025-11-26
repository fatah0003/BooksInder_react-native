<?php

namespace App\DataFixtures;

use App\Entity\Book;
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

            // Types d’échange selon l’index
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
        }

        $manager->flush();
    }


    public function getDependencies(): array
    {
        return [UserFixtures::class];
    }
}