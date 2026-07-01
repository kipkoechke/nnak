#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# server-setup.sh
# First-time server bootstrap for portal.nnak.or.ke
#
# Installs: Docker, Nginx, Certbot
# Configures: host nginx reverse proxy → Docker app container
# Obtains:    Let's Encrypt SSL certificate
#
# Called by:  GitHub Actions deploy.yml (first deploy only)
# Run manually: LETSENCRYPT_EMAIL=admin@nnak.or.ke bash scripts/server-setup.sh
# ──────────────────────────────────────────────────────────
set -euo pipefail

APP_PORT="${APP_PORT:-3010}"
DOMAIN="portal.nnak.or.ke"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-admin@nnak.or.ke}"

echo "========================================================"
echo "  Server setup for $DOMAIN"
echo "  App port: $APP_PORT"
echo "  SSL email: $LETSENCRYPT_EMAIL"
echo "========================================================"

# ──────────────────────────────────────────────────────────
# 1. Update system packages
# ──────────────────────────────────────────────────────────
echo ""
echo "==> [1/7] Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get upgrade -y -qq

# ──────────────────────────────────────────────────────────
# 2. Install Docker
# ──────────────────────────────────────────────────────────
echo ""
echo "==> [2/7] Installing Docker..."
if ! command -v docker &>/dev/null; then
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
      > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
    echo "    Docker installed."
else
    echo "    Docker already installed — skipping."
fi

# ──────────────────────────────────────────────────────────
# 3. Install Nginx
# ──────────────────────────────────────────────────────────
echo ""
echo "==> [3/7] Installing Nginx..."
if ! command -v nginx &>/dev/null; then
    apt-get install -y -qq nginx
    echo "    Nginx installed."
else
    echo "    Nginx already installed — skipping."
fi

# ──────────────────────────────────────────────────────────
# 4. Install Certbot (Let's Encrypt)
# ──────────────────────────────────────────────────────────
echo ""
echo "==> [4/7] Installing Certbot..."
if ! command -v certbot &>/dev/null; then
    apt-get install -y -qq certbot python3-certbot-nginx
    echo "    Certbot installed."
else
    echo "    Certbot already installed — skipping."
fi

# ──────────────────────────────────────────────────────────
# 5. Configure host Nginx vhost
# ──────────────────────────────────────────────────────────
echo ""
echo "==> [5/7] Configuring Nginx vhost for $DOMAIN..."

# Create ACME challenge directory
mkdir -p /var/www/certbot

# Copy vhost template and substitute APP_PORT
cp nginx/host-vhost.conf "/etc/nginx/sites-available/$DOMAIN"
sed -i "s/__APP_PORT__/$APP_PORT/g" "/etc/nginx/sites-available/$DOMAIN"

# Enable the site
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"

# Remove default site if present
rm -f /etc/nginx/sites-enabled/default

echo "    Vhost configured."

# ──────────────────────────────────────────────────────────
# 6. Obtain SSL certificate
# ──────────────────────────────────────────────────────────
echo ""
echo "==> [6/7] Obtaining Let's Encrypt SSL certificate..."

# Start nginx temporarily (HTTP only) for ACME challenge
# certbot --nginx handles the challenge automatically
if certbot --nginx -d "$DOMAIN" \
    --non-interactive --agree-tos \
    --email "$LETSENCRYPT_EMAIL" \
    --redirect; then
    echo "    SSL certificate obtained and configured."
else
    echo "    WARNING: SSL certificate request failed."
    echo "    HTTP-only mode active until SSL is resolved."
    echo "    Re-run: certbot --nginx -d $DOMAIN"
fi

# ──────────────────────────────────────────────────────────
# 7. Start & enable Nginx
# ──────────────────────────────────────────────────────────
echo ""
echo "==> [7/7] Starting Nginx..."
nginx -t && systemctl enable --now nginx
echo "    Nginx is running."

# ──────────────────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────────────────
echo ""
echo "========================================================"
echo "  Server setup complete!"
echo "  Site: https://$DOMAIN"
echo "  App port: $APP_PORT"
echo "========================================================"
