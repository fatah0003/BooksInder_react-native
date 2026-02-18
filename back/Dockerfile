# Utiliser une image PHP officielle avec FPM
FROM php:8.3-fpm-alpine AS base

# Installation des dépendances système
RUN apk add --no-cache \
    bash \
    git \
    unzip \
    curl \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    linux-headers

# Installation des extensions PHP standards
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    zip \
    intl \
    opcache

# Installation de MongoDB via package Alpine (binaire pré-compilé)
RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing \
    php83-pecl-mongodb \
    && ln -s /usr/lib/php83/modules/mongodb.so /usr/local/lib/php/extensions/no-debug-non-zts-20230831/mongodb.so \
    && docker-php-ext-enable mongodb

# Installation de Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && chmod +x /usr/local/bin/composer

# Définir le répertoire de travail
WORKDIR /var/www/html

# Copier les fichiers de dépendances (optimisation cache)
COPY composer.json composer.lock ./

# Installer les dépendances
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copier le code source
COPY . .

# Créer les dossiers nécessaires avec permissions
RUN mkdir -p var/cache var/log \
    && chown -R www-data:www-data var \
    && chmod -R 775 var

# Exposer le port
EXPOSE 8000

# Commande de démarrage
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
