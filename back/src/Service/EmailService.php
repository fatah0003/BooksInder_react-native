<?php

namespace App\Service;

use App\Entity\User;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Psr\Log\LoggerInterface;

class EmailService
{
    public function __construct(
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        private string $fromEmail = 'noreply@booksinder.com'
    ) {}

    /**
     * Envoie un email de bienvenue après inscription
     */
    public function sendWelcomeEmail(string $userEmail, string $username): bool
    {
        $email = (new Email())
            ->from($this->fromEmail)
            ->to($userEmail)
            ->subject('Bienvenue sur Booksinder !')
            ->html(sprintf(
                '<h1>Bonjour %s !</h1>
                <p>Merci de vous être inscrit sur <strong>Booksinder</strong>.</p>
                <p>Vous pouvez maintenant commencer à échanger vos livres préférés !</p>',
                htmlspecialchars($username)
            ));

        return $this->send($email);
    }

    /**
     * Envoie un email de réinitialisation de mot de passe
     */
    public function sendPasswordResetEmail(string $userEmail, string $resetToken): bool
    {
        $email = (new Email())
            ->from($this->fromEmail)
            ->to($userEmail)
            ->subject('Réinitialisation de votre mot de passe')
            ->html(sprintf(
                '<h1>Réinitialisation de mot de passe</h1>
                <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
                <p>Utilisez ce code : <strong>%s</strong></p>
                <p>Ce code expire dans 30 minutes.</p>
                <p><small>Si vous n\'avez pas fait cette demande, ignorez cet email.</small></p>',
                htmlspecialchars($resetToken)
            ));

        return $this->send($email);
    }

    /**
     * Envoie un email de notification de nouveau message
     */
    public function sendNewMessageNotification(string $userEmail, string $senderName): bool
    {
        $email = (new Email())
            ->from($this->fromEmail)
            ->to($userEmail)
            ->subject('Nouveau message sur Booksinder')
            ->html(sprintf(
                '<h1>Nouveau message</h1>
                <p><strong>%s</strong> vous a envoyé un message.</p>
                <p>Connectez-vous à Booksinder pour le lire.</p>',
                htmlspecialchars($senderName)
            ));

        return $this->send($email);
    }

    /**
     * Envoie un email quand un utilisateur reçoit une demande d'échange
     */
    public function sendExchangeRequestReceived(
        string $recipientEmail,
        string $requesterName,
        string $bookTitle
    ): bool
    {
        $email = (new Email())
            ->from($this->fromEmail)
            ->to($recipientEmail)
            ->subject('Nouvelle demande d\'échange sur Booksinder')
            ->html(sprintf(
                '<h1>Nouvelle demande d\'échange</h1>
            <p><strong>%s</strong> souhaite échanger avec vous !</p>
            <p>Livre concerné : <strong>%s</strong></p>
            <p>Connectez-vous à Booksinder pour consulter la demande et y répondre.</p>',
                htmlspecialchars($requesterName),
                htmlspecialchars($bookTitle)
            ));

        return $this->send($email);
    }

    /**
     * Envoie un email quand une demande d'échange est acceptée
     */
    public function sendExchangeRequestAccepted(
        string $requesterEmail,
        string $accepterName,
        string $bookTitle
    ): bool
    {
        $email = (new Email())
            ->from($this->fromEmail)
            ->to($requesterEmail)
            ->subject('Votre demande d\'échange a été acceptée !')
            ->html(sprintf(
                '<h1>Bonne nouvelle</h1>
            <p><strong>%s</strong> a accepté votre demande d\'échange.</p>
            <p>Livre concerné : <strong>%s</strong></p>
            <p>Vous pouvez maintenant discuter ensemble pour organiser l\'échange.</p>
            <p>Connectez-vous à Booksinder pour continuer.</p>',
                htmlspecialchars($accepterName),
                htmlspecialchars($bookTitle)
            ));

        return $this->send($email);
    }

    /**
     * Envoie le code de vérification à 6 chiffres
     */
    public function sendVerificationCode(string $userEmail, string $code): bool
    {
        $email = (new Email())
            ->from($this->fromEmail)
            ->to($userEmail)
            ->subject('Code de vérification - Booksinder')
            ->html(sprintf(
                '<h1>Bienvenue sur Booksinder ! 📚</h1>
            <p>Votre code de vérification est :</p>
            <h2 style="background: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 10px; font-size: 32px;">%s</h2>
            <p>Ce code expire dans <strong>10 minutes</strong>.</p>
            <p><small>Si vous n\'avez pas créé de compte, ignorez cet email.</small></p>',
                htmlspecialchars($code)
            ));

        return $this->send($email);
    }




    /**
     * Méthode privée pour l'envoi avec gestion d'erreur
     */
    private function send(Email $email): bool
    {
        try {
            $this->mailer->send($email);
            $this->logger->info('Email envoyé avec succès', [
                'to' => $email->getTo()[0]->getAddress(),
                'subject' => $email->getSubject()
            ]);
            return true;
        } catch (TransportExceptionInterface $e) {
            $this->logger->error('Erreur lors de l\'envoi d\'email', [
                'error' => $e->getMessage(),
                'to' => $email->getTo()[0]->getAddress()
            ]);
            return false;
        }
    }
}
