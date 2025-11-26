<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251118211234 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE exchange (id INT AUTO_INCREMENT NOT NULL, user_requester_id INT NOT NULL, user_receiver_id INT NOT NULL, book_one_id INT NOT NULL, book_two_id INT DEFAULT NULL, status VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', accepted_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', refused_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_D33BB0796D8850F6 (user_requester_id), INDEX IDX_D33BB07964482423 (user_receiver_id), INDEX IDX_D33BB079D24DC59E (book_one_id), INDEX IDX_D33BB079B9112251 (book_two_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE exchange ADD CONSTRAINT FK_D33BB0796D8850F6 FOREIGN KEY (user_requester_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE exchange ADD CONSTRAINT FK_D33BB07964482423 FOREIGN KEY (user_receiver_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE exchange ADD CONSTRAINT FK_D33BB079D24DC59E FOREIGN KEY (book_one_id) REFERENCES book (id)');
        $this->addSql('ALTER TABLE exchange ADD CONSTRAINT FK_D33BB079B9112251 FOREIGN KEY (book_two_id) REFERENCES book (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB0796D8850F6');
        $this->addSql('ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB07964482423');
        $this->addSql('ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB079D24DC59E');
        $this->addSql('ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB079B9112251');
        $this->addSql('DROP TABLE exchange');
    }
}
