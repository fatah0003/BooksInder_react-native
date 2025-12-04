<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251204131307 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE exchange CHANGE user_requester_id user_requester_id INT NOT NULL, CHANGE user_receiver_id user_receiver_id INT NOT NULL, CHANGE book_one_id book_one_id INT NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE exchange CHANGE user_requester_id user_requester_id INT DEFAULT NULL, CHANGE user_receiver_id user_receiver_id INT DEFAULT NULL, CHANGE book_one_id book_one_id INT DEFAULT NULL');
    }
}
