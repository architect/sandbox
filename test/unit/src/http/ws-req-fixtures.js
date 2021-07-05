function makeHeaders (additional) {
  let headers = {
    ...additional,
  }
  let multiValueHeaders = {}
  for (let [ header, value ] of Object.entries(headers)){
    multiValueHeaders[header] = [ value ]
  }
  return { headers, multiValueHeaders }
}

/**
 * Standard mock response for the three primary websocket events
 */

let arc8 = {
  connect: {
    ...makeHeaders({
      // Host: 'abc123unme.execute-api.us-west-2.amazonaws.com',
      'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
      'Sec-WebSocket-Key': 'ABC123ABCYOUANDME==',
      'Sec-WebSocket-Version': '13',
      // 'X-Amzn-Trace-Id': 'Root=1-606a1ead-FFFF1043254985630FFFF3a',
      // 'X-Forwarded-For': 'xxx.xxx.xxx.xxx',
      // 'X-Forwarded-Port': '443',
      // 'X-Forwarded-Proto': 'https'
    }),
    requestContext: {
      routeKey: '$connect',
      eventType: 'CONNECT',
      messageDirection: 'IN',
      connectedAt: 1624590205808,
      requestTimeEpoch: 1624590205808,
      requestId: 'Bdsdf4nMvHcFaJg=',
      connectionId: 'BdgbbbcrMvHcCddQ=',
      // fields from testing not supported yet
      // extendedRequestId: 'BdgbsFnMvHcFaJg=',
      // requestTime: '25/Jun/2021:03:03:25 +0000',
      stage: 'staging',
      // identity: { sourceIp: 'xxx.xxx.xxx.xxx' },
      domainName: 'abc123unme.execute-api.us-west-2.amazonaws.com',
      // apiId: 'fdos88vuoi'
    },
    isBase64Encoded: false
  },

  // a normal message on a default handler
  default: {
    requestContext: {
      routeKey: '$default',
      messageId: 'dRm8Fdm0vHcCFAA=',
      eventType: 'MESSAGE',
      messageDirection: 'IN',
      connectedAt: 1617567405336,
      requestTimeEpoch: 1617567411634,
      requestId: 'dRm8FEWpPHcFSeQ=',
      connectionId: 'BdgbbbcrMvHcCddQ=',
      // fields from testing not supported yet
      // extendedRequestId: 'dRm8FEWpPHcFSeQ=',
      // requestTime: '04/Apr/2021:20:16:51 +0000',
      stage: 'staging',
      // identity: [Object],
      domainName: 'abc123unme.execute-api.us-west-2.amazonaws.com',
      // apiId: 'abc123unme'
    },
    body: '{}', // whatever you want
    isBase64Encoded: false
  },

  gracefulDisconnect: {
    ...makeHeaders({
      // Host: 'abc123unme.execute-api.us-west-2.amazonaws.com',
      // 'x-api-key': '',
      // 'X-Forwarded-For': '',
      // 'x-restapi': ''
    }),
    requestContext: {
      routeKey: '$disconnect',
      eventType: 'DISCONNECT',
      messageDirection: 'IN',
      disconnectReason: '',
      connectedAt: 1617567405336,
      requestTimeEpoch: 1617567415099,
      requestId: 'abc12345',
      connectionId: 'BdgbbbcrMvHcCddQ=',
      // requestTime: '04/Apr/2021:20:16:55 +0000',
      stage: 'staging',
      domainName: 'abc123unme.execute-api.us-west-2.amazonaws.com',
      // identity: [ Object ],
      // disconnectStatusCode: -1,
      // extendedRequestId: 'abc12345',
      // apiId: 'abc123unme'
    },
    isBase64Encoded: false
  },
}

module.exports = {
  arc8,
}
