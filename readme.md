# `@architect/sandbox`

Run a `.arc` file in a local sandbox.

## install

```bash
npm i @architect/sandbox
```

### example usage

```javascript
let sandbox = require('@architect/sandbox')
```

todo:
- [ ] src/db/_init calls readArc
- [ ] hydrate and env population dep?
- [ ] events/index calls readArc
- [ ] events subprocess needs to refactor to call invoke-lambda
- [ ] http/fallback.js calls readArc
- [ ] http/index calls readArc
- [ ] http/register-http calls getLambdaName
