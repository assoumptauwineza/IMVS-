const express = require('express');
const router = express.Router();
const db = require('../db/schema');

router.get('/', (req, res) => {
  const { intern_id } = req.query;
  let q = 'SELECT mp.*, i.full_name FROM monthly_plans mp JOIN interns i ON i.id=mp.intern_id WHERE 1=1';
  const params = [];
  if (intern_id) { q += ' AND mp.intern_id=?'; params.push(intern_id); }
  res.json(db.prepare(q + ' ORDER BY mp.month DESC').all(...params));
});

router.post('/', (req, res) => {
  const { intern_id, month, plan } = req.body;
  const result = db.prepare('INSERT INTO monthly_plans (intern_id, month, plan) VALUES (?,?,?)').run(intern_id, month, plan);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id/report', (req, res) => {
  const { report, achievement_rate } = req.body;
  db.prepare('UPDATE monthly_plans SET report=?, achievement_rate=? WHERE id=?').run(report, achievement_rate, req.params.id);
  res.json({ success: true });
});

module.exports = router;
