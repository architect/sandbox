exports.handler = async () => {
  return {
    statusCode: 200,
    cookies: [ 'c1=v1', 'c2=v2' ]
  }
}
