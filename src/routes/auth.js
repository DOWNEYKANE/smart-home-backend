const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const { getPool } = require('../db')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.json({ code: 400, message: '用户名和密码不能为空' })
    }

    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username])
    if (rows.length === 0) {
      return res.json({ code: 401, message: '用户名或密码错误' })
    }

    const user = rows[0]
    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) {
      return res.json({ code: 401, message: '用户名或密码错误' })
    }

    const token = jwt.sign(
      { id: user.id, name: user.nickname || user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: { id: user.id, name: user.nickname || user.username, role: user.role }
    })
  } catch (e) {
    console.error('[Auth] 登录失败:', e)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// POST /api/logout
router.post('/logout', authRequired, (req, res) => {
  res.json({ code: 0, message: '已退出' })
})

// POST /api/register — 注册新用户（分享给朋友用）
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body
    if (!username || !password) {
      return res.json({ code: 400, message: '用户名和密码不能为空' })
    }
    if (password.length < 4) {
      return res.json({ code: 400, message: '密码至少4位' })
    }

    const pool = getPool()
    const [exist] = await pool.execute('SELECT id FROM users WHERE username = ?', [username])
    if (exist.length > 0) {
      return res.json({ code: 400, message: '用户名已存在' })
    }

    const hash = bcrypt.hashSync(password, 10)
    await pool.execute(
      'INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)',
      [username, hash, nickname || username, 'user']
    )

    res.json({ code: 0, message: '注册成功' })
  } catch (e) {
    console.error('[Auth] 注册失败:', e)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

module.exports = router
