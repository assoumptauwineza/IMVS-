const express = require('express');
const router = express.Router();
const db = require('../db/schema');

router.get('/', (req, res) => {
  const { status, category, department_id } = req.query;
  let query = `
    SELECT i.*, d.name as department_name,
      CAST((julianday('now') - julianday(i.start_date)) AS INTEGER) as days_elapsed,
      CAST((julianday(i.end_date) - julianday('now')) AS INTEGER) as days_remaining,
      CASE 
        WHEN julianday('now') > julianday(i.end_date) THEN 'overdue'
        WHEN julianday(i.end_date) - julianday('now') <= 30 THEN 'expiring_soon'
        ELSE 'on_track'
      END as duration_status
    FROM interns i
    LEFT JOIN departments d ON d.id = i.department_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND i.status=?'; params.push(status); }
  if (category) { query += ' AND i.category=?'; params.push(category); }
  if (department_id) { query += ' AND i.department_id=?'; params.push(department_id); }
  res.json(db.prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const intern = db.prepare(`
    SELECT i.*, d.name as department_name,
      CAST((julianday('now') - julianday(i.start_date)) AS INTEGER) as days_elapsed,
      CAST((julianday(i.end_date) - julianday('now')) AS INTEGER) as days_remaining
    FROM interns i LEFT JOIN departments d ON d.id = i.department_id
    WHERE i.id=?
  `).get(req.params.id);
  if (!intern) return res.status(404).json({ error: 'Not found' });
  res.json(intern);
});

router.post('/', (req, res) => {
  const { full_name, email, phone, category, qualification, referring_partner, department_id, start_date, end_date } = req.body;
  const result = db.prepare(`
    INSERT INTO interns (full_name, email, phone, category, qualification, referring_partner, department_id, start_date, end_date)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(full_name, email, phone, category, qualification, referring_partner, department_id, start_date, end_date);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { full_name, email, phone, category, qualification, referring_partner, department_id, start_date, end_date, status } = req.body;
  db.prepare(`
    UPDATE interns SET full_name=?, email=?, phone=?, category=?, qualification=?, referring_partner=?,
    department_id=?, start_date=?, end_date=?, status=? WHERE id=?
  `).run(full_name, email, phone, category, qualification, referring_partner, department_id, start_date, end_date, status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM interns WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
