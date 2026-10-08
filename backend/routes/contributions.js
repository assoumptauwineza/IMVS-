const express = require('express');
const router = express.Router();
const db = require('../db/schema');

router.get('/', (req, res) => {
  const { intern_id } = req.query;
  let q = 'SELECT c.*, i.full_name FROM contributions c JOIN interns i ON i.id=c.intern_id WHERE 1=1';
  const params = [];
  if (intern_id) { q += ' AND c.intern_id=?'; params.push(intern_id); }
  res.json(db.prepare(q + ' ORDER BY c.date DESC').all(...params));
});

router.post('/', (req, res) => {
  const { intern_id, task, output, date } = req.body;
  const result = db.prepare('INSERT INTO contributions (intern_id, task, output, date) VALUES (?,?,?,?)').run(intern_id, task, output, date || new Date().toISOString().split('T')[0]);
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM contributions WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
