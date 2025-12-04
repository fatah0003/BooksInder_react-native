<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251203173003 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE book (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, title VARCHAR(100) NOT NULL, author VARCHAR(100) NOT NULL, isbn VARCHAR(20) NOT NULL, description LONGTEXT NOT NULL, pages INT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', edition VARCHAR(40) DEFAULT NULL, location VARCHAR(50) NOT NULL, categorie LONGTEXT NOT NULL COMMENT \'(DC2Type:simple_array)\', state VARCHAR(255) NOT NULL, book_status VARCHAR(255) NOT NULL, available_exchange_types LONGTEXT NOT NULL COMMENT \'(DC2Type:simple_array)\', INDEX IDX_CBE5A331A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE exchange (id INT AUTO_INCREMENT NOT NULL, user_requester_id INT DEFAULT NULL, user_receiver_id INT DEFAULT NULL, book_one_id INT DEFAULT NULL, book_two_id INT DEFAULT NULL, status VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', accepted_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', refused_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', exchange_type VARCHAR(255) DEFAULT NULL, INDEX IDX_D33BB0796D8850F6 (user_requester_id), INDEX IDX_D33BB07964482423 (user_receiver_id), INDEX IDX_D33BB079D24DC59E (book_one_id), INDEX IDX_D33BB079B9112251 (book_two_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE favorite (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, book_id INT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_68C58ED9A76ED395 (user_id), INDEX IDX_68C58ED916A2B381 (book_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE infos_user (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, user_name VARCHAR(30) NOT NULL, phone_number VARCHAR(20) NOT NULL, city VARCHAR(50) NOT NULL, birth_date DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', bio LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_AA81A6EA24A232CF (user_name), UNIQUE INDEX UNIQ_AA81A6EA6B01BC5B (phone_number), UNIQUE INDEX UNIQ_AA81A6EAA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE notification (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, type VARCHAR(255) NOT NULL, title VARCHAR(255) NOT NULL, data JSON DEFAULT NULL, is_read TINYINT(1) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_BF5476CAA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', user_status VARCHAR(255) NOT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE book ADD CONSTRAINT FK_CBE5A331A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE exchange ADD CONSTRAINT FK_D33BB0796D8850F6 FOREIGN KEY (user_requester_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE exchange ADD CONSTRAINT FK_D33BB07964482423 FOREIGN KEY (user_receiver_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE exchange ADD CONSTRAINT FK_D33BB079D24DC59E FOREIGN KEY (book_one_id) REFERENCES book (id)');
        $this->addSql('ALTER TABLE exchange ADD CONSTRAINT FK_D33BB079B9112251 FOREIGN KEY (book_two_id) REFERENCES book (id)');
        $this->addSql('ALTER TABLE favorite ADD CONSTRAINT FK_68C58ED9A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE favorite ADD CONSTRAINT FK_68C58ED916A2B381 FOREIGN KEY (book_id) REFERENCES book (id)');
        $this->addSql('ALTER TABLE infos_user ADD CONSTRAINT FK_AA81A6EAA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE book DROP FOREIGN KEY FK_CBE5A331A76ED395');
        $this->addSql('ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB0796D8850F6');
        $this->addSql('ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB07964482423');
        $this->addSql('ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB079D24DC59E');
        $this->addSql('ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB079B9112251');
        $this->addSql('ALTER TABLE favorite DROP FOREIGN KEY FK_68C58ED9A76ED395');
        $this->addSql('ALTER TABLE favorite DROP FOREIGN KEY FK_68C58ED916A2B381');
        $this->addSql('ALTER TABLE infos_user DROP FOREIGN KEY FK_AA81A6EAA76ED395');
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_BF5476CAA76ED395');
        $this->addSql('DROP TABLE book');
        $this->addSql('DROP TABLE exchange');
        $this->addSql('DROP TABLE favorite');
        $this->addSql('DROP TABLE infos_user');
        $this->addSql('DROP TABLE notification');
        $this->addSql('DROP TABLE user');
    }
}
