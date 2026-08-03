FROM serversideup/php:8.1-fpm-nginx

USER root

RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install gd \
    && rm -rf /var/lib/apt/lists/*

# Jangan ubah USER — biarkan image handle sendiri
