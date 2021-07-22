let b64enc = i => new Buffer.from(i).toString('base64')

// Generate a recurring set of headers, with the ability to expand them to include additional headers if needed by the fixture
function makeHeaders (additional) {
  let headers = {
    'accept-encoding': 'gzip',
    cookie: '_idx=abc123DEF456'
  }
  if (additional) headers = Object.assign(headers, additional)
  let multiValueHeaders = {}
  Object.entries(headers).forEach(([ header, value ]) => {
    multiValueHeaders[header] = [ value ]
  })
  return { headers, multiValueHeaders }
}

let {
  headers, // Just a regular set of baseline headers
  multiValueHeaders // Arc 6 REST-specific header format
} = makeHeaders()

// Recurring header cases
let {
  headers: headersJson,
  multiValueHeaders: multiValueHeadersJson
} = makeHeaders({ 'content-type': 'application/json' })
let {
  headers: headersFormUrl,
  multiValueHeaders: multiValueHeadersFormUrl
} = makeHeaders({ 'content-type': 'application/x-www-form-urlencoded' })
let {
  headers: headersFormData,
  multiValueHeaders: multiValueHeadersFormData
} = makeHeaders({ 'content-type': 'multipart/form-data' })
let {
  headers: headersOctet,
  multiValueHeaders: multiValueHeadersOctet
} = makeHeaders({ 'content-type': 'application/octet-stream' })

// Basic obj
let data = { hi: 'there' }

// Arc 7 HTTP
let cookies = [ headers.cookie ]

/**
 * Standard mock request set used in:
 * - [Architect Functions](test/unit/src/http/http-req-fixtures.js)
 * - [Architect Sandbox](test/unit/src/http/http-req-fixtures.js)
 * If you make changes to either, reflect it in the other(s)!
 */
let arc7 = {
  // get /
  getIndex: {
    version: '2.0',
    routeKey: 'GET /',
    rawPath: '/',
    rawQueryString: '',
    cookies,
    headers,
    requestContext: {
      http: {
        method: 'GET',
        path: '/',
      },
      routeKey: 'GET /',
    },
    isBase64Encoded: false
  },

  // get /?whats=up
  getWithQueryString: {
    version: '2.0',
    routeKey: 'GET /',
    rawPath: '/',
    rawQueryString: 'whats=up',
    cookies,
    headers,
    queryStringParameters: { whats: 'up' },
    requestContext: {
      http: {
        method: 'GET',
        path: '/',
      },
      routeKey: 'GET /',
    },
    isBase64Encoded: false
  },

  // get /?whats=up&whats=there
  getWithQueryStringDuplicateKey: {
    version: '2.0',
    routeKey: 'GET /',
    rawPath: '/',
    rawQueryString: 'whats=up&whats=there',
    cookies,
    headers,
    queryStringParameters: { whats: 'up,there' },
    requestContext: {
      http: {
        method: 'GET',
        path: '/',
      },
      routeKey: 'GET /',
    },
    isBase64Encoded: false
  },

  // get /nature/:activities (/nature/hiking)
  getWithParam: {
    version: '2.0',
    routeKey: 'GET /nature/{activities}',
    rawPath: '/nature/hiking',
    rawQueryString: '',
    cookies,
    headers,
    requestContext: {
      http: {
        method: 'GET',
        path: '/nature/hiking',
      },
      routeKey: 'GET /nature/{activities}',
    },
    pathParameters: { nature: 'hiking' },
    isBase64Encoded: false
  },

  // get /{proxy+} (/nature/hiking)
  getProxyPlus: {
    version: '2.0',
    routeKey: 'GET /{proxy+}',
    rawPath: '/nature/hiking',
    rawQueryString: '',
    cookies,
    headers,
    requestContext: {
      http: {
        method: 'GET',
        path: '/nature/hiking',
      },
      routeKey: 'GET /{proxy+}',
    },
    pathParameters: { proxy: 'nature/hiking' },
    isBase64Encoded: false
  },

  // get /$default (/nature/hiking)
  // Deprecated in Arc 8, but possibly added via Macro
  get$default: {
    version: '2.0',
    routeKey: '$default',
    rawPath: '/nature/hiking',
    rawQueryString: '',
    cookies,
    headers,
    requestContext: {
      http: {
        method: 'GET',
        path: '/nature/hiking',
      },
      routeKey: '$default',
    },
    isBase64Encoded: false
  },

  // get /path/* (/path/hi/there)
  getCatchall: {
    version: '2.0',
    routeKey: 'GET /path/{proxy+}',
    rawPath: '/path/hi/there',
    rawQueryString: '',
    cookies,
    headers,
    requestContext: {
      http: {
        method: 'GET',
        path: '/path/hi/there',
      },
      routeKey: 'GET /path/{proxy+}'
    },
    pathParameters: { proxy: 'hi/there' },
    isBase64Encoded: false
  },

  // get /:activities/{proxy+} (/nature/hiking/wilderness)
  getWithParamAndCatchall: {
    version: '2.0',
    routeKey: 'GET /{activities}/{proxy+}',
    rawPath: '/nature/hiking/wilderness',
    rawQueryString: '',
    cookies,
    headers,
    requestContext: {
      http: {
        method: 'GET',
        path: '/nature/hiking/wilderness',
      },
      routeKey: 'GET /{activities}/{proxy+}',
    },
    pathParameters: {
      activities: 'nature',
      proxy: 'hiking/wilderness'
    },
    isBase64Encoded: false
  },

  // post /form (JSON)
  postJson: {
    version: '2.0',
    routeKey: 'POST /form',
    rawPath: '/form',
    rawQueryString: '',
    cookies,
    headers: headersJson,
    requestContext: {
      http: {
        method: 'POST',
        path: '/form',
      },
      routeKey: 'POST /form',
    },
    body: '{"hi":"there"}',
    isBase64Encoded: false
  },

  // post /form (form URL encoded)
  postFormURL: {
    version: '2.0',
    routeKey: 'POST /form',
    rawPath: '/form',
    rawQueryString: '',
    cookies,
    headers: headersFormUrl,
    requestContext: {
      http: {
        method: 'POST',
        path: '/form',
      },
      routeKey: 'POST /form',
    },
    body: b64enc('hi=there'),
    isBase64Encoded: true
  },

  // post /form (multipart form data)
  postMultiPartFormData: {
    version: '2.0',
    routeKey: 'POST /form',
    rawPath: '/form',
    rawQueryString: '',
    cookies,
    headers: headersFormData,
    requestContext: {
      http: {
        method: 'POST',
        path: '/form',
      },
      routeKey: 'POST /form',
    },
    body: b64enc('hi there'),
    isBase64Encoded: true
  },

  // post /form (octet stream)
  postOctetStream: {
    version: '2.0',
    routeKey: 'POST /form',
    rawPath: '/form',
    rawQueryString: '',
    cookies,
    headers: headersOctet,
    requestContext: {
      http: {
        method: 'POST',
        path: '/form',
      },
      routeKey: 'POST /form',
    },
    body: b64enc('hi there\n'),
    isBase64Encoded: true
  },

  // put /form (JSON)
  putJson: {
    version: '2.0',
    routeKey: 'PUT /form',
    rawPath: '/form',
    rawQueryString: '',
    cookies,
    headers: headersJson,
    requestContext: {
      http: {
        method: 'PUT',
        path: '/form',
      },
      routeKey: 'PUT /form',
    },
    body: '{"hi":"there"}',
    isBase64Encoded: false
  },

  // patch /form (JSON)
  patchJson: {
    version: '2.0',
    routeKey: 'PATCH /form',
    rawPath: '/form',
    rawQueryString: '',
    cookies,
    headers: headersJson,
    requestContext: {
      http: {
        method: 'PATCH',
        path: '/form',
      },
      routeKey: 'PATCH /form',
    },
    body: '{"hi":"there"}',
    isBase64Encoded: false
  },

  // delete /form (JSON)
  deleteJson: {
    version: '2.0',
    routeKey: 'DELETE /form',
    rawPath: '/form',
    rawQueryString: '',
    cookies,
    headers: headersJson,
    requestContext: {
      http: {
        method: 'DELETE',
        path: '/form',
      },
      routeKey: 'DELETE /form',
    },
    body: '{"hi":"there"}',
    isBase64Encoded: false
  }
}

let arc6 = {
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
    requestContext: {
      httpMethod: 'GET',
      path: '/',
      resourcePath: '/',
    },
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
    requestContext: {
      httpMethod: 'GET',
      path: '/',
      resourcePath: '/',
    },
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
    requestContext: {
      httpMethod: 'GET',
      path: '/',
      resourcePath: '/',
    },
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
    requestContext: {
      httpMethod: 'GET',
      path: '/nature/hiking',
      resourcePath: '/nature/{activities}',
    },
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
    pathParameters: { proxy: 'nature/hiking' },
    body: null,
    isBase64Encoded: false,
    requestContext: {
      httpMethod: 'GET',
      path: '/nature/hiking',
      resourcePath: '/{proxy+}',
    },
  },

  // get /path/* (/path/hi/there)
  getCatchall: {
    resource: '/path/{proxy+}',
    path: '/path/hi/there',
    httpMethod: 'GET',
    headers,
    multiValueHeaders,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: { proxy: 'hi/there' },
    body: null,
    isBase64Encoded: false,
    requestContext: {
      httpMethod: 'GET',
      path: '/path/hi/there',
      resourcePath: '/path/{proxy+}',
    },
  },

  // get /:activities/{proxy+} (/nature/hiking/wilderness)
  getWithParamAndCatchall: {
    resource: '/{activities}/{proxy+}',
    path: '/nature/hiking/wilderness',
    httpMethod: 'GET',
    headers,
    multiValueHeaders,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: {
      activities: 'nature',
      proxy: 'hiking/wilderness'
    },
    body: null,
    isBase64Encoded: false,
    requestContext: {
      httpMethod: 'GET',
      path: '/nature/hiking/wilderness',
      resourcePath: '/{activities}/{proxy+}',
    },
  },

  // post /form (JSON)
  postJson: {
    resource: '/form',
    path: '/form',
    httpMethod: 'POST',
    headers: headersJson,
    multiValueHeaders: multiValueHeadersJson,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc(JSON.stringify(data)),
    isBase64Encoded: true,
    requestContext: {
      httpMethod: 'POST',
      path: '/form',
      resourcePath: '/form',
    },
  },

  // post /form (form URL encoded)
  postFormURL: {
    resource: '/form',
    path: '/form',
    httpMethod: 'POST',
    headers: headersFormUrl,
    multiValueHeaders: multiValueHeadersFormUrl,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc('hi=there'),
    isBase64Encoded: true,
    requestContext: {
      httpMethod: 'POST',
      path: '/form',
      resourcePath: '/form',
    },
  },

  // post /form (multipart form data)
  postMultiPartFormData: {
    resource: '/form',
    path: '/form',
    httpMethod: 'POST',
    headers: headersFormData,
    multiValueHeaders: multiValueHeadersFormData,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc('hi there'), // not a valid multipart form data payload but that's for userland validation
    isBase64Encoded: true,
    requestContext: {
      httpMethod: 'POST',
      path: '/form',
      resourcePath: '/form',
    },
  },

  // post /form (octet stream)
  postOctetStream: {
    resource: '/form',
    path: '/form',
    httpMethod: 'POST',
    headers: headersOctet,
    multiValueHeaders: multiValueHeadersOctet,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc('hi there\n'),
    isBase64Encoded: true,
    requestContext: {
      httpMethod: 'POST',
      path: '/form',
      resourcePath: '/form',
    },
  },

  // put /form (JSON)
  putJson: {
    resource: '/form',
    path: '/form',
    httpMethod: 'PUT',
    headers: headersJson,
    multiValueHeaders: multiValueHeadersJson,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc(JSON.stringify(data)),
    isBase64Encoded: true,
    requestContext: {
      httpMethod: 'PUT',
      path: '/form',
      resourcePath: '/form',
    },
  },

  // patch /form (JSON)
  patchJson: {
    resource: '/form',
    path: '/form',
    httpMethod: 'PATCH',
    headers: headersJson,
    multiValueHeaders: multiValueHeadersJson,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc(JSON.stringify(data)),
    isBase64Encoded: true,
    requestContext: {
      httpMethod: 'PATCH',
      path: '/form',
      resourcePath: '/form',
    },
  },

  // delete /form (JSON)
  deleteJson: {
    resource: '/form',
    path: '/form',
    httpMethod: 'DELETE',
    headers: headersJson,
    multiValueHeaders: multiValueHeadersJson,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    body: b64enc(JSON.stringify(data)),
    isBase64Encoded: true,
    requestContext: {
      httpMethod: 'DELETE',
      path: '/form',
      resourcePath: '/form',
    },
  }
}

module.exports = {
  arc7,
  arc6,
  headers
}
