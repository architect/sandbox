let b64enc = i => new Buffer.from(i).toString('base64')
// Normal
let headers = {
  'accept-encoding': 'gzip',
  cookie: '_idx=abc123DEF456'
}
// Arc 6 REST
let multiValueHeaders = {
  'accept-encoding': [ 'gzip' ],
  cookie: [ '_idx=abc123DEF456' ]
}

/**
 * Standard mock request set used in:
 * - [Architect Functions](test/unit/src/http/http-req-fixtures.js)
 * - [Architect Sandbox](test/unit/src/http/http-req-fixtures.js)
 * If you make changes to either, reflect it in the other(s)!
 */
let arc6 = {}

arc6.rest = {
  // get /
  getIndex: {
    resource: '/',
    path: '/',
    httpMethod: 'GET',
    headers,
    multiValueHeaders,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: null,
    isBase64Encoded: false,
  },

  // get /?whats=up
  getWithQueryString: {
    resource: '/',
    path: '/',
    httpMethod: 'GET',
    headers,
    multiValueHeaders,
    queryStringParameters: { whats: 'up' },
    multiValueQueryStringParameters: { whats: [ 'up' ] },
    pathParameters: null,
    body: null,
    isBase64Encoded: false,
  },

  // get /?whats=up&whats=there
  getWithQueryStringDuplicateKey: {
    resource: '/',
    path: '/',
    httpMethod: 'GET',
    headers,
    multiValueHeaders,
    queryStringParameters: { whats: 'there' },
    multiValueQueryStringParameters: { whats: [ 'up', 'there' ] },
    pathParameters: null,
    body: null,
    isBase64Encoded: false,
  },

  // get /nature/hiking
  getWithParam: {
    resource: '/nature/{activities}',
    path: '/nature/hiking',
    httpMethod: 'GET',
    headers,
    multiValueHeaders,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: { activities: 'hiking' },
    body: null,
    isBase64Encoded: false,
  },

  // get /{proxy+}
  getProxyPlus: {
    resource: '/{proxy+}',
    path: '/nature/hiking',
    httpMethod: 'GET',
    headers,
    multiValueHeaders,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: { proxy: '/nature/hiking' },
    body: null,
    isBase64Encoded: false,
  },

  // post /form (JSON)
  postJson: {
    resource: '/form',
    path: '/form',
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json' },
    multiValueHeaders: { 'content-type': [ 'application/json' ] },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc(JSON.stringify({ hi: 'there' })),
    isBase64Encoded: true
  },

  // post /form (form URL encoded)
  postFormURL: {
    resource: '/form',
    path: '/form',
    httpMethod: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    multiValueHeaders: { 'content-type': [ 'application/x-www-form-urlencoded' ] },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc('hi=there'),
    isBase64Encoded: true
  },

  // post /form (multipart form data)
  postMultiPartFormData: {
    resource: '/form',
    path: '/form',
    httpMethod: 'POST',
    headers: { 'content-type': 'multipart/form-data' },
    multiValueHeaders: { 'content-type': [ 'multipart/form-data' ] },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc('hi there'), // not a valid multipart form data payload but that's for userland validation
    isBase64Encoded: true
  },

  // post /form (octet stream)
  postOctetStream: {
    resource: '/form',
    path: '/form',
    httpMethod: 'POST',
    headers: { 'content-type': 'application/octet-stream' },
    multiValueHeaders: { 'content-type': [ 'application/octet-stream' ] },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc('hi there\n'),
    isBase64Encoded: true
  },

  // put /form (JSON)
  putJson: {
    resource: '/form',
    path: '/form',
    httpMethod: 'PUT',
    headers: { 'content-type': 'application/json' },
    multiValueHeaders: { 'content-type': [ 'application/json' ] },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc(JSON.stringify({ hi: 'there' })),
    isBase64Encoded: true
  },

  // patch /form (JSON)
  patchJson: {
    resource: '/form',
    path: '/form',
    httpMethod: 'PATCH',
    headers: { 'content-type': 'application/json' },
    multiValueHeaders: { 'content-type': [ 'application/json' ] },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc(JSON.stringify({ hi: 'there' })),
    isBase64Encoded: true
  },

  // delete /form (JSON)
  deleteJson: {
    resource: '/form',
    path: '/form',
    httpMethod: 'DELETE',
    headers: { 'content-type': 'application/json' },
    multiValueHeaders: { 'content-type': [ 'application/json' ] },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc(JSON.stringify({ hi: 'there' })),
    isBase64Encoded: true
  }
}

let arc5 = {
  // get /
  getIndex: {
    body: {},
    path: '/',
    headers,
    method: 'GET',
    httpMethod: 'GET',
    params: {},
    query: {},
    queryStringParameters: {}
  },

  // get /?whats=up
  getWithQueryString: {
    body: {},
    path: '/',
    headers,
    method: 'GET',
    httpMethod: 'GET',
    params: {},
    query: { whats: 'up' },
    queryStringParameters: { whats: 'up' }
  },

  // get /nature/hiking
  getWithParam: {
    body: {},
    path: '/nature/hiking',
    headers,
    method: 'GET',
    httpMethod: 'GET',
    params: { activities: 'hiking' },
    query: {},
    queryStringParameters: {}
  },

  // post /form
  //   accounts for both JSON and form URL-encoded bodies
  post: {
    body: { hi: 'there' },
    path: '/form',
    headers,
    method: 'POST',
    httpMethod: 'POST',
    params: {},
    query: {},
    queryStringParameters: {}
  },

  // post /form
  //   accounts for multipart form data-encoded bodies
  postBinary: {
    body: { base64: 'aGVsbG89dGhlcmU=' },
    path: '/form',
    headers,
    method: 'POST',
    httpMethod: 'POST',
    params: {},
    query: {},
    queryStringParameters: {}
  },

  // put /form
  put: {
    body: { hi: 'there' },
    path: '/form',
    headers,
    method: 'PUT',
    httpMethod: 'PUT',
    params: {},
    query: {},
    queryStringParameters: {}
  },

  // patch /form
  patch: {
    body: { hi: 'there' },
    path: '/form',
    headers,
    method: 'PATCH',
    httpMethod: 'PATCH',
    params: {},
    query: {},
    queryStringParameters: {}
  },

  // delete /form
  delete: {
    body: { hi: 'there' },
    path: '/form',
    headers,
    method: 'DELETE',
    httpMethod: 'DELETE',
    params: {},
    query: {},
    queryStringParameters: {}
  },
}

module.exports = {
  arc6,
  arc5,
  headers
}
