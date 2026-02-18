#!/bin/bash
# Tests de smoke après déploiement

echo "Tests de smoke Booksinder"

# Test 1 : MySQL
echo "Test MySQL"
docker exec booksinder_mysql mysql -u booksinder -ppassword -e "SHOW DATABASES;" | grep booksinder
if [ $? -eq 0 ]; then
    echo "MySQL : OK"
else
    echo "MySQL : ERREUR"
    exit 1
fi

# Test 2 : MongoDB
echo "Test MongoDB"
docker exec booksinder_mongodb mongosh --eval "db.adminCommand('ping')" | grep "ok: 1"
if [ $? -eq 0 ]; then
    echo "MongoDB : OK"
else
    echo "MongoDB : ERREUR"
    exit 1
fi

# Test 3 : API Backend
echo "Test API Backend"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/books)
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "API Backend : OK (HTTP $HTTP_CODE)"
else
    echo "API Backend : ERREUR (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 4 : Mailpit
echo "Test Mailpit"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8025)
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "Mailpit : OK (HTTP $HTTP_CODE)"
else
    echo "Mailpit : ERREUR (HTTP $HTTP_CODE)"
    exit 1
fi

echo ""
echo "Tous les tests sont passés avec succès"
