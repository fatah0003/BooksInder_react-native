# Guide de déploiement - Application Booksinder

## Vue d'ensemble

Ce document décrit la procédure complète de déploiement de l'application **Booksinder**, une application mobile d'échange de livres entre particuliers avec architecture microservices conteneurisée.

**Date de dernière mise à jour** : Février 2026  
**Version** : 1.0.0  
**Auteur** : AINSERI Fatah

---

## Architecture technique

### Stack technologique

#### Backend
- **Framework** : Symfony 7
- **Langage** : PHP 8.3
- **API** : REST JSON (Controllers personnalisés)
- **Authentification** : JWT (LexikJWTAuthenticationBundle)

#### Frontend
- **Framework** : React Native avec Expo
- **Langage** : TypeScript
- **Navigation** : React Navigation (Bottom Tabs + Stack Navigator)
- **Client HTTP** : Axios avec intercepteur JWT
- **Stockage local** : AsyncStorage

**Note** : Le frontend React Native n'est pas inclus dans Docker car c'est une application mobile native qui s'exécute
sur smartphone/émulateur. L'application communique avec le backend via l'API REST exposée sur `http://localhost:8000`.

---

#### Bases de données
- **MySQL 8.0** : Données relationnelles (utilisateurs, infos_user, livres, échanges, favoris, notifications)
- **MongoDB 6.0** : Données NoSQL (conversations, messages)

#### Services complémentaires
- **Mailpit** : Serveur SMTP de développement pour interception des emails

#### Infrastructure
- **Docker** : Containerisation de tous les services
- **Docker Compose** : Orchestration multi-conteneurs

---

### Schéma d'architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network (bridge)                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  MySQL 8.0   │  │ MongoDB 6.0  │  │   Mailpit    │    │
│  │  Port 3306   │  │  Port 27017  │  │ Ports 1025/  │    │
│  │              │  │              │  │     8025     │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │             │
│         └─────────────────┴─────────────────┘             │
│                           │                               │
│                  ┌────────▼────────┐                      │
│                  │ Symfony Backend│                      │
│                  │    PHP 8.3     │                      │
│                  │   Port 8000    │                      │
│                  └─────────────────┘                      │
│                           │                               │
└───────────────────────────┼─────────────────────────────────┘
                            ▼
                     API REST JSON
                 (http://localhost:8000)
```

---

## Prérequis système

### Logiciels requis

- **Docker Engine** : version 24.0 ou supérieure
- **Docker Compose** : version 2.20 ou supérieure
- **Git** : version 2.30 ou supérieure
- **Curl** : pour les tests de smoke

### Ports utilisés

Assurez-vous que ces ports sont libres sur votre machine :

| Service | Port | Description |
|---------|------|-------------|
| Backend Symfony | 8000 | API REST |
| MySQL | 3306 | Base de données relationnelle |
| MongoDB | 27017 | Base de données NoSQL |
| Mailpit SMTP | 1025 | Serveur email sortant |
| Mailpit Web | 8025 | Interface web Mailpit |

---

## Procédure de déploiement

### Méthode 1 : Déploiement automatisé (RECOMMANDÉ)

**Utilisation du script de déploiement** :

```bash
# Cloner le repository
git clone https://github.com/fatah0003/BooksInder_react-native.git
cd BooksInder_react-native

# Lancer le déploiement automatique
./deploy.sh
```

**Le script effectue automatiquement** :

1. Arrêt des conteneurs existants
2. Construction de l'image backend
3. Démarrage des services (MySQL → MongoDB → Mailpit → Backend)
4. Attente que MySQL soit prêt (30 secondes)
5. Exécution des migrations Doctrine
6. Validation du schéma de base de données
7. Affichage de l'état des services

**Durée estimée** : 2-3 minutes (première fois : 10-15 minutes pour télécharger les images)

### Méthode 2 : Déploiement manuel

#### Étape 1 : Cloner le repository
```bash
git clone https://github.com/fatah0003/BooksInder_react-native.git
cd BooksInder_react-native
```

#### Étape 2 : Configuration des variables d'environnement
Le fichier `.env.docker` est déjà configuré dans le repository (`back/.env.docker`).

Vérifiez les credentials (si déploiement en production, modifiez les mots de passe) :

```text
DATABASE_URL="mysql://booksinder:password@mysql:3306/booksinder?serverVersion=8.0&charset=utf8mb4"
MONGODB_URL="mongodb://mongodb:27017"
MAILER_DSN=smtp://mailpit:1025
```

**En production** : Utilisez des mots de passe sécurisés et des secrets Symfony.

#### Étape 3 : Construction de l'image backend
```bash
docker compose build backend
```

- **Première construction** : 10-15 minutes (téléchargement PHP, compilation extensions)
- **Reconstructions suivantes** : 1-2 minutes (grâce au cache Docker)

#### Étape 4 : Démarrage des services
```bash
docker compose up -d
```

Option `-d` : détaché (les conteneurs tournent en arrière-plan)

**Vérification** :

```bash
docker compose ps
```

Vous devriez voir 4 conteneurs avec le statut `Up` :

```text
booksinder_mysql      Up (healthy)
booksinder_mongodb    Up (healthy)
booksinder_mailpit    Up
booksinder_backend    Up
```

#### Étape 5 : Exécution des migrations
Attendre 30 secondes que MySQL soit complètement prêt, puis :

```bash
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
```

**Résultat attendu** :

```text
[OK] Successfully migrated to version: DoctrineMigrations\VersionXXXXXXXXXXXXXX
```

#### Étape 6 : Validation du schéma
```bash
docker compose exec backend php bin/console doctrine:schema:validate
```

Vous devez voir 2 OK :

```text
[OK] The mapping files are correct.
[OK] The database schema is in sync with the mapping files.
```

#### Étape 7 : Tests de smoke
```bash
./tests-smoke.sh
```

Vérification automatique de 4 services :

- MySQL : connectivité et existence de la base `booksinder`
- MongoDB : réponse au ping
- API Backend : HTTP 200 sur `/api/books`
- Mailpit : interface web accessible

---

## Vérifications post-déploiement

### 1. Accès à l'API
**Navigateur** : http://localhost:8000/api

**Ligne de commande** :

```bash
curl http://localhost:8000/api/books
```

**Réponse attendue** (liste vide si aucun livre) :

```json
{
  "success": true,
  "data": [],
  "pagination": {...}
}
```

### 2. Interface Mailpit
**URL** : http://localhost:8025

Vous devriez voir l'interface web de Mailpit (boîte de réception vide).

### 3. Logs des conteneurs
**Tous les services** :

```bash
docker compose logs -f
```

**Backend uniquement** :

```bash
docker compose logs -f backend
```

**Rechercher les erreurs** :

```bash
docker compose logs backend | grep -i error
```

### 4. État de la base de données MySQL
**Se connecter à MySQL** :

```bash
docker exec -it booksinder_mysql mysql -u booksinder -ppassword booksinder
```

**Lister les tables** :

```sql
SHOW TABLES;
```

**Tables attendues** :
- `user`
- `infos_user`
- `book`
- `image`
- `exchange`
- `favorite`
- `notification`
- `password_reset_token`
- `doctrine_migration_versions`


### 5. État de MongoDB
**Se connecter à MongoDB** :

```bash
docker exec -it booksinder_mongodb mongosh
```

**Utiliser la base booksinder_chat** :

```javascript
use booksinder_chat
db.getCollectionNames()
```

---

## Commandes utiles

### Gestion des conteneurs
```bash
# Démarrer les services
docker compose up -d

# Arrêter les services
docker compose stop

# Redémarrer les services
docker compose restart

# Arrêter ET supprimer les conteneurs
docker compose down

# Arrêter et supprimer TOUT (conteneurs + volumes)
docker compose down -v
```

### Accès aux conteneurs
```bash
# Shell dans le conteneur backend
docker compose exec backend bash

# Shell dans MySQL
docker exec -it booksinder_mysql mysql -u booksinder -ppassword booksinder

# Shell dans MongoDB
docker exec -it booksinder_mongodb mongosh
```

### Commandes Symfony
```bash
# Vider le cache
docker compose exec backend php bin/console cache:clear

# Créer une nouvelle migration
docker compose exec backend php bin/console make:migration

# Lister les routes
docker compose exec backend php bin/console debug:router
```

---

## Procédure de rollback

En cas de problème après un déploiement, suivez cette procédure pour revenir à la version précédente.

### Étape 1 : Identifier la version stable
```bash
git log --oneline -10
```

Notez le SHA du commit stable (ex : `abc1234`).

### Étape 2 : Arrêter les services
```bash
docker compose down
```

### Étape 3 : Revenir au commit stable
```bash
git checkout abc1234
```

### Étape 4 : Reconstruire et relancer
```bash
docker compose build --no-cache backend
docker compose up -d
```

### Étape 5 : Restaurer la base de données (si nécessaire)
Si vous avez une sauvegarde :

```bash
# Restaurer MySQL
docker exec -i booksinder_mysql mysql -u booksinder -ppassword booksinder < backup_YYYYMMDD.sql

# Restaurer MongoDB
docker exec -i booksinder_mongodb mongorestore --archive < backup_mongo_YYYYMMDD.archive
```

### Étape 6 : Vérifier
```bash
./tests-smoke.sh
```

---

## Sauvegardes

### Sauvegarde MySQL
**Créer une sauvegarde** :

```bash
docker exec booksinder_mysql mysqldump -u booksinder -ppassword booksinder > backup_$(date +%Y%m%d).sql
```

**Restaurer une sauvegarde** :

```bash
docker exec -i booksinder_mysql mysql -u booksinder -ppassword booksinder < backup_20260216.sql
```

### Sauvegarde MongoDB
**Créer une sauvegarde** :

```bash
docker exec booksinder_mongodb mongodump --db=booksinder_chat --archive > backup_mongo_$(date +%Y%m%d).archive
```

**Restaurer une sauvegarde** :

```bash
docker exec -i booksinder_mongodb mongorestore --archive < backup_mongo_20260216.archive
```

---

## Guide de dépannage

### Problème 1 : Le port 3306 est déjà utilisé
**Symptôme** :

```text
Error: bind: address already in use
```

**Solution** :

1. Arrêtez votre MySQL local :
   - **Windows** : `services.msc` → MySQL → Arrêter
   - **Linux** : `sudo systemctl stop mysql`

2. Ou modifiez le port dans `docker-compose.yml` :

```text
ports:
  - "3307:3306"  # Utilise 3307 au lieu de 3306
```

### Problème 2 : Erreur "Connection refused" à MySQL
**Symptôme** :

```text
SQLSTATE[HY000] Connection refused
```

**Causes possibles** :

- MySQL n'est pas encore prêt (attend le healthcheck)
- Credentials incorrects dans `.env.docker`

**Solution** :

1. Vérifiez l'état de MySQL :

```bash
docker compose logs mysql | grep "ready for connections"
```

2. Attendez 30 secondes après `docker compose up -d`

3. Vérifiez les credentials dans `back/.env.docker`

### Problème 3 : Erreur "Permission denied" dans le conteneur
**Symptôme** :

```text
Failed to write to var/cache: Permission denied
```

**Solution** :

```bash
# Reconstruire l'image avec les bonnes permissions
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

### Problème 4 : Les migrations échouent
**Symptôme** :

```text
Migration failed
```

**Solution** :

1. Vérifiez que MySQL est accessible :

```bash
docker exec booksinder_mysql mysql -u booksinder -ppassword -e "SELECT 1"
```

2. Réinitialisez la base de données :

```bash
docker compose exec backend php bin/console doctrine:database:drop --force
docker compose exec backend php bin/console doctrine:database:create
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
```

### Problème 5 : L'API retourne une erreur 500
**Solution** :

1. Consultez les logs :

```bash
docker compose logs backend
```

2. Vérifiez le fichier de log Symfony :

```bash
docker compose exec backend cat var/log/dev.log
```

3. Videz le cache :

```bash
docker compose exec backend php bin/console cache:clear
```

---

## Déploiement en production

### Checklist pré-production

- [ ] Modifier `APP_ENV=prod` dans `.env.docker`
- [ ] Régénérer `APP_SECRET` avec une valeur aléatoire sécurisée
- [ ] Changer tous les mots de passe (MySQL, MongoDB)
- [ ] Configurer un vrai serveur SMTP (remplacer Mailpit)
- [ ] Activer HTTPS/TLS avec certificats (Let's Encrypt)
- [ ] Restreindre `CORS_ALLOW_ORIGIN` au domaine de production
- [ ] Désactiver le mode debug Symfony
- [ ] Configurer les sauvegardes automatiques (cron)
- [ ] Mettre en place un monitoring (Prometheus, Grafana)
- [ ] Configurer les logs centralisés (ELK Stack)

### Recommandations production

**1. Utiliser Nginx au lieu du serveur PHP intégré** :

Modifier `back/Dockerfile` :

```text
# Remplacer la ligne CMD par :
CMD ["php-fpm"]
```

Ajouter un service Nginx dans `docker-compose.yml`.

**2. Utiliser des secrets Docker pour les credentials sensibles.**

**3. Limiter les ressources des conteneurs** :

```text
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
```

---

## Déploiement du frontend React Native

### Build de l'application mobile

Le frontend React Native se déploie indépendamment du backend via les stores d'applications.

#### Prérequis
- **Node.js** : version 18 ou supérieure
- **npx** : inclus avec Node.js (pas besoin d'installer Expo CLI globalement)
- **Compte développeur** (pour production) : Google Play Console (Android) et/ou Apple Developer (iOS)

#### Configuration de l'API

**L'URL de l'API est définie dans `front/src/config/apiConfig.ts`** :

```typescript
/*seul changement au changement de réseau auquel le pc est connecté*/
const HOST = '192.168.1.xxx'; // Ethernet maison
// const HOST = '192.168.1.xx'; // wifi maison
const PORT = '8000';

export const BASE_URL = `http://${HOST}:${PORT}`;
export const API_URL = `${BASE_URL}/api`;
```

**En développement** :
- Utilisez votre IP locale (ex : `192.168.1.xxx`)
- L'application mobile doit être sur le **même réseau** que votre PC

**En production** :
- Remplacez par l'URL du serveur (ex : `https://api.booksinder.com`)
- Supprimez le port si vous utilisez HTTPS standard (443)


#### Test de l'application en développement

**Installation des dépendances** :

```bash
cd front
npm install
```

**Démarrage du serveur Expo** :

```bash
# Démarrage normal
npx expo start

# Démarrage avec nettoyage du cache (si problèmes)
npx expo start --clear
# ou
npx expo start -c
```

**Options de test** :
- Scannez le QR code avec l'application **Expo Go** sur votre smartphone (Android/iOS)
- Appuyez sur `a` pour lancer l'émulateur Android
- Appuyez sur `i` pour lancer le simulateur iOS (Mac uniquement)

**Important** : Assurez-vous que le backend Docker est démarré (`./deploy.sh` ou `docker compose up -d`) avant de tester l'application.

#### Build Android (APK)

```bash
cd front
npx expo build:android
```

L'APK généré peut être téléchargé et distribué sur Google Play Store.

**Alternative avec EAS Build (recommandé par Expo)** :

```bash
npm install -g eas-cli
eas build --platform android
```

#### Build iOS (IPA)

```bash
cd front
npx expo build:ios
```

Le fichier IPA peut être soumis à l'App Store via Xcode ou Transporter.

**Alternative avec EAS Build** :

```bash
eas build --platform ios
```

**Note** : Le build iOS nécessite un Mac et un compte Apple Developer.

#### Configuration pour la production

**Avant de déployer en production** :

1. **Modifier `apiConfig.ts`** :

```typescript
const HOST = 'api.booksinder.com'; // URL de production
const PORT = ''; // Pas de port si HTTPS

export const BASE_URL = `https://${HOST}`;
export const API_URL = `${BASE_URL}/api`;
```

2. **Vérifier `app.json`** :
   - Nom de l'application
   - Version
   - Bundle identifier (iOS) et package name (Android)
   - Icônes et splash screen

3. **Tester sur un appareil réel** avec la production API avant de soumettre aux stores.

---

## Contacts et support

**Développeur** : AINSERI Fatah  
**Repository** : https://github.com/fatah0003/BooksInder_react-native

**En cas de problème** :

1. Consultez d'abord ce guide de dépannage
2. Vérifiez les logs : `docker compose logs`
3. Ouvrez une issue sur GitHub avec les logs d'erreur

---

## Historique des versions

| Version | Date          | Changements                                      |
|---------|---------------|--------------------------------------------------|
| 1.0.0   | Février 2026  | Version initiale - Infrastructure Docker complète |

---

*Document rédigé dans le cadre de la validation du titre RNCP Concepteur Développeur d'Applications (CDA) niveau 6.*
