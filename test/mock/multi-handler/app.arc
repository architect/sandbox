@app
multi-handler

@http
# Deno
get /deno/index.js
get /deno/mod.js
get /deno/index.ts
get /deno/mod.ts
get /deno/index.tsx
get /deno/mod.tsx

# Node
get /node/cjs/index.js
get /node/cjs/index.cjs
get /node/esm/index.js
get /node/esm/index.mjs

@arc
runtime nodejs20.x # The Deno functions have config files
