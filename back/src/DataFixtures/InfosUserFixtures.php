<?php

namespace App\DataFixtures;

use App\Entity\InfosUser;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class InfosUserFixtures extends Fixture implements DependentFixtureInterface
{
    public function getDependencies(): array
    {
        return [
            UserFixtures::class,
        ];
    }

    public function load(ObjectManager $manager): void
    {
        // Récupérer les utilisateurs créés par UserFixtures
        $users = $manager->getRepository(User::class)->findAll();

        foreach ($users as $index => $user) {
            $infos = new InfosUser();
            $infos->setUser($user);
            $infos->setUserName($user->getEmail() === 'admin@example.com' ? 'AdminName' : 'UserName' . $index);
            $infos->setPhoneNumber('06000000' . str_pad($index, 2, '0', STR_PAD_LEFT));
            $infos->setCity('Paris');
            $infos->setBirthDate(new \DateTimeImmutable('1990-01-01'));
            $infos->setBio($user->getEmail() === 'admin@example.com' ? 'Admin user' : 'Regular user');

            $manager->persist($infos);
        }


        $manager->flush();
    }
}
