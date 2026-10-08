const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Register
router.post('/register', (req, res) => {
  const { full_name, email, password, role } = req.body;
  if (!full_name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  const result = db.prepare('INSERT INTO users (full_name, email, password, role) VALUES (?,?,?,?)').run(full_name, email, hashPassword(password), role || 'staff');
  res.json({ id: result.lastInsertRowid, full_name, email, role: role || 'staff' });
});

// Update Profile
router.put('/profile', (req, res) => {
  const { id, full_name, email, role } = req.body;
  if (!id || !full_name || !email) return res.status(400).json({ error: 'Name and email are required' });
  const existing = db.prepare('SELECT id FROM users WHERE email=? AND id!=?').get(email, id);
  if (existing) return res.status(400).json({ error: 'Email already in use' });
  db.prepare('UPDATE users SET full_name=?, email=?, role=? WHERE id=?').run(full_name, email, role, id);
  res.json({ id, full_name, email, role });
});

// Change Password
router.put('/change-password', (req, res) => {
  const { id, new_password } = req.body;
  if (!id || !new_password) return res.status(400).json({ error: 'Missing fields' });
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(new_password), id);
  res.json({ success: true });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || user.password !== hashPassword(password)) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ id: user.id, full_name: user.full_name, email: user.email, role: user.role });
});

module.exports = router;
