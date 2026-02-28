# Booksinder 📚

Application mobile d'échange de livres entre particuliers.  
Inspirée du principe de Tinder, elle permet aux lecteurs d'échanger leurs livres gratuitement.

**Stack** : Symfony 6.4 · PHP 8.3 · React Native (Expo) · TypeScript · MySQL 8 · MongoDB 6 · Docker · GitLab CI/CD

---

## Démarrage rapide

### Backend
```bash
git clone https://github.com/fatah0003/BooksInder_react-native.git
cd BooksInder_react-native
./deploy.sh
```

L'API est accessible sur http://localhost:8000  
L'interface Mailpit est accessible sur http://localhost:8025

### Frontend
```bash
cd front
npm install
npx expo start
```

---

## Lancer les tests
```bash
docker compose exec backend php bin/phpunit --testdox
```

---

## Documentation

- [Guide de déploiement complet](docs/DEPLOIEMENT.md)

---

## Auteur

**AINSERI Fatah** — Titre professionnel CDA RNCP niveau 6 — 2025/2026