@app
multi-handler

@http
# Bun
get /bun/index.js
get /bun/index.ts
get /bun/index.tsx

# Deno
get /deno/index.js
get /deno/mod.js

get /deno/mod.ts
get /deno/index.tsx
get /deno/mod.tsx

# Node
get /node/cjs/index.js
get /node/cjs/index.cjs
get /node/esm/index.js
get /node/esm/index.mjs

@arc
runtime nodejs20.x # The Deno and Bun functions have config files
