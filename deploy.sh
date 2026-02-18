#!/bin/bash
# Script de déploiement Booksinder

echo "Déploiement de Booksinder"

# Étape 1 : Arrêter les conteneurs existants
echo "Arrêt des conteneurs existants"
docker-compose down

# Étape 2 : Construction de l'image backend
echo "Construction de l'image backend"
docker-compose build backend

# Étape 3 : Démarrage des services
echo "Démarrage des services"
docker-compose up -d

# Étape 4 : Attendre que MySQL soit prêt
echo "Attente de MySQL (30 secondes)"
sleep 30

# Étape 5 : Exécution des migrations
echo "Exécution des migrations de base de données"
docker-compose exec -T backend php bin/console doctrine:migrations:migrate --no-interaction

# Étape 6 : Vérification du schéma
echo "Validation du schéma de base de données"
docker-compose exec -T backend php bin/console doctrine:schema:validate

# Étape 7 : Affichage de l'état des services
echo "État des services"
docker-compose ps

echo "Déploiement terminé, L'API est accessible sur http://localhost:8000"
