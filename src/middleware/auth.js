const jwt = require('jsonwebtoken')
const config = require('../config')

function authRequired(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' })
  }
  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' })
  }
}

module.exports = { authRequired }
