#!/bin/bash
set -e

echo "=== PocketBank Setup ==="

# 1. Create .env if it doesn't exist
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  sed -i.bak "s/change_this_to_a_long_random_secret/$SECRET/" server/.env
  rm -f server/.env.bak
  echo "✓ server/.env created with a generated JWT_SECRET"
else
  echo "✓ server/.env already exists — skipping"
fi

# 2. Install dependencies
echo "→ Installing server dependencies..."
npm install --prefix server

echo "→ Installing client dependencies..."
npm install --prefix client

# 3. Run DB migration
echo "→ Running database migration..."
npm run db:migrate --prefix server

# 4. Build client + server
echo "→ Building..."
npm run build

echo ""
echo "=== Setup complete ==="
echo "Start the app with:  npm start"
echo "Then open:           http://localhost:8080"
