@app
multihandler

@http
get /deno/index.js
get /deno/mod.js
get /deno/index.ts
get /deno/mod.ts
get /deno/index.tsx
get /deno/mod.tsx

@aws
runtime deno
