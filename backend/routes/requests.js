const express = require('express');
const router = express.Router();
const db = require('../db/schema');

router.get('/', (req, res) => {
  res.json(db.prepare(`
    SELECT pr.*, d.name as department_name 
    FROM placement_requests pr 
    LEFT JOIN departments d ON d.id=pr.department_id 
    ORDER BY pr.created_at DESC
  `).all());
});

router.post('/', (req, res) => {
  const { partner, candidate_name, qualification, department_id } = req.body;
  const result = db.prepare('INSERT INTO placement_requests (partner, candidate_name, qualification, department_id) VALUES (?,?,?,?)').run(partner, candidate_name, qualification, department_id);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE placement_requests SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true });
});

module.exports = router;
