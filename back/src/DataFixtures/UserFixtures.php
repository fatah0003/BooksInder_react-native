<?php

namespace App\DataFixtures;

use App\Entity\User;
use App\Enum\UserStatusEnum;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserFixtures extends Fixture
{
    private UserPasswordHasherInterface $hasher;

    public function __construct(UserPasswordHasherInterface $hasher)
    {
        $this->hasher = $hasher;
    }

    public function load(ObjectManager $manager): void
    {
        $admin = new User();
        $admin->setEmail('admin@example.com')
            ->setRoles(['ROLE_ADMIN'])
            ->setPassword($this->hasher->hashPassword($admin, 'admin123'))
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUserStatus(UserStatusEnum::ACTIVE);
        $manager->persist($admin);
        $this->addReference('user_admin', $admin); // <-- référence

        $user = new User();
        $user->setEmail('user@example.com')
            ->setRoles(['ROLE_USER'])
            ->setPassword($this->hasher->hashPassword($user, 'user123'))
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUserStatus(UserStatusEnum::ACTIVE);
        $manager->persist($user);
        $this->addReference('user_regular', $user);

        $manager->flush();
    }
}
