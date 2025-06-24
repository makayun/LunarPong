#!/bin/bash
set -e

mkdir -p nginx_modsecurity/ssl node_sqlite/ssl

# Nginx (frontend)
openssl req -x509 -newkey rsa:2048 -nodes -keyout nginx_modsecurity/ssl/front.key -out nginx_modsecurity/ssl/front.crt -days 365 -subj "/CN=localhost"

# Node.js (backend)
openssl req -x509 -newkey rsa:2048 -nodes -keyout node_sqlite/ssl/backend.key -out node_sqlite/ssl/backend.crt -days 365 -subj "/CN=node"
