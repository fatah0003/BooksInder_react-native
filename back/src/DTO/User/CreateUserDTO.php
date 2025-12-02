<?php

namespace App\DTO\User;

use Symfony\Component\Validator\Constraints as Assert;

class CreateUserDTO
{
    #[Assert\NotBlank(message: "L'email est requis.")]
    #[Assert\Email(message: "L'email n'est pas valide.")]
    #[Assert\Length(
        max: 180,
        maxMessage: "L'email ne peut pas dépasser {{ limit }} caractères."
    )]

    public string $email;

    #[Assert\NotBlank(message: "Le mot de passe est requis.")]
    #[Assert\Length(
        min: 8,
        minMessage: "Le mot de passe doit faire au moins {{ limit }} caractères."
    )]
    #[Assert\Regex(
        pattern: "/[A-Z]/",
        message: "Le mot de passe doit contenir au moins une lettre majuscule."
    )]
    #[Assert\Regex(
        pattern: "/[a-z]/",
        message: "Le mot de passe doit contenir au moins une lettre minuscule."
    )]
    #[Assert\Regex(
        pattern: "/[0-9]/",
        message: "Le mot de passe doit contenir au moins un chiffre."
    )]
    #[Assert\Regex(
        pattern: "/[\W]/",
        message: "Le mot de passe doit contenir au moins un caractère spécial."
    )]
    public string $password;

    /**
     * @var list<string>|null
     */
    #[Assert\All([
        new Assert\Choice(
            choices: ['ROLE_USER', 'ROLE_ADMIN'],
            message: "Rôle invalide."
        )
    ])]
    public ?array $roles = null;
}
