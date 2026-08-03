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

RUN echo '#!/bin/sh' > /etc/entrypoint.d/99-permissions.sh \
    && echo 'mkdir -p /var/www/html/storage/logs /var/www/html/storage/framework/cache/data /var/www/html/storage/framework/sessions /var/www/html/storage/framework/views /var/www/html/bootstrap/cache' >> /etc/entrypoint.d/99-permissions.sh \
    && echo 'chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache' >> /etc/entrypoint.d/99-permissions.sh \
    && chmod +x /etc/entrypoint.d/99-permissions.sh
