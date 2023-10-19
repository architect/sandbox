cd scripts

npm install --force --omit=dev

npx esbuild ./aws-lite-dynamodb.mjs --bundle --platform=node --format=cjs --outfile=../src/tables/_aws-lite-dynamodb-vendor.js
