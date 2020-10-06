
// This lib is quite large at 339kb is there a better and lighter jwt decoder we could use
const jsonwebtoken = require('jsonwebtoken')

module.exports = function (arc) {
	return function jwt(req, res, next) {
		const route = arc.http.find(route => route[0] === req.method.toLowerCase() && route[1] === req.url);
		if (route.length > 2) {
			console.log(req.headers)
			try {
				if (!req.headers.authorization) {
					throw Error('Unauthorized');
				}
				// This operation is not secure do not do this in production
				const tokenValues = jsonwebtoken.decode(req.headers.authorization.split(' ')[1]);
				req.authorizer = { jwt: { claims: tokenValues } }
			} catch(e) {
				res.writeHead(401)
				res.end('{"message":"Unauthorized"}')
				return
			}
		}
		next()
	}
}
