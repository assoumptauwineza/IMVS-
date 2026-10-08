const express = require('express');
const router = express.Router();
const db = require('../db/schema');

router.get('/', (req, res) => {
  const { intern_id } = req.query;
  let q = 'SELECT f.*, i.full_name FROM followups f JOIN interns i ON i.id=f.intern_id WHERE 1=1';
  const params = [];
  if (intern_id) { q += ' AND f.intern_id=?'; params.push(intern_id); }
  res.json(db.prepare(q + ' ORDER BY f.date DESC').all(...params));
});

router.post('/', (req, res) => {
  const { intern_id, resources_provided, resources_used, support_needs } = req.body;
  const result = db.prepare('INSERT INTO followups (intern_id, resources_provided, resources_used, support_needs) VALUES (?,?,?,?)').run(intern_id, resources_provided, resources_used ? 1 : 0, support_needs);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id/resolve', (req, res) => {
  db.prepare('UPDATE followups SET resolved=1 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
