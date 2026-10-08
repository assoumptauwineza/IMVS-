const express = require('express');
const router = express.Router();
const db = require('../db/schema');

// Get all departments with occupancy
router.get('/', (req, res) => {
  const depts = db.prepare(`
    SELECT d.*, 
      COUNT(CASE WHEN i.status='active' THEN 1 END) as occupied,
      d.total_slots - COUNT(CASE WHEN i.status='active' THEN 1 END) as available
    FROM departments d
    LEFT JOIN interns i ON i.department_id = d.id
    GROUP BY d.id
  `).all();
  res.json(depts);
});

router.post('/', (req, res) => {
  const { name, total_slots } = req.body;
  const result = db.prepare('INSERT INTO departments (name, total_slots) VALUES (?,?)').run(name, total_slots);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { name, total_slots } = req.body;
  db.prepare('UPDATE departments SET name=?, total_slots=? WHERE id=?').run(name, total_slots, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM departments WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
