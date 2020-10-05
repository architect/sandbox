const jsonwebtoken = require('jsonwebtoken')

module.exports = function (arc) {

	return function jwt(req, res, next) {
		const route = arc.http.find(route => route[0] === req.method.toLowerCase() && route[1] === req.url);
		if (route.length > 2) {
			console.log(req.headers)
			if (req.headers.authorization) {
				const tokenValues = jsonwebtoken.decode(req.headers.authorization.split(' ')[1]);
				req.authorizer = { jwt: { claims: tokenValues } }
			} else {
				res.writeHead(401)
				res.end('{"message":"Unauthorized"}')
				return
			}
		}
		next()
	}
}
