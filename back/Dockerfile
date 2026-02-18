# Étape 1 : Image de base PHP 8.3 avec FPM (FastCGI Process Manager)
FROM php:8.3-fpm-alpine

# Étape 2 : Installation des dépendances système
RUN apk add --no-cache \
    bash \
    git \
    unzip \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    autoconf \
    g++ \
    make

# Étape 3 : Installation des extensions PHP nécessaires
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    zip \
    intl \
    opcache

# Étape 4 : Installation de l'extension MongoDB via PECL
RUN pecl install mongodb \
    && docker-php-ext-enable mongodb

# Étape 5 : Installation de Composer (directement depuis getcomposer.org)
RUN apk add --no-cache curl \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && chmod +x /usr/local/bin/composer

# Étape 6 : Définir le répertoire de travail
WORKDIR /var/www/html

# Étape 7 : Copier les fichiers de dépendances (pour utiliser le cache Docker)
COPY composer.json composer.lock ./

# Étape 8 : Installer les dépendances Composer
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Étape 9 : Copier tout le code source
COPY . .

# Étape 10 : Donner les permissions au dossier var
RUN mkdir -p var/cache var/log \
    && chown -R www-data:www-data var \
    && chmod -R 775 var

# Étape 11 : Exposer le port 8000
EXPOSE 8000

# Étape 12 : Commande de démarrage
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
