const express = require('express');
const router = express.Router();
const db = require('../db/schema');

// Dashboard summary
router.get('/dashboard', (req, res) => {
  const total_interns = db.prepare("SELECT COUNT(*) as count FROM interns WHERE status='active'").get();
  const by_category = db.prepare("SELECT category, COUNT(*) as count FROM interns WHERE status='active' GROUP BY category").all();
  const overdue = db.prepare("SELECT COUNT(*) as count FROM interns WHERE status='active' AND julianday('now') > julianday(end_date)").get();
  const expiring_soon = db.prepare("SELECT COUNT(*) as count FROM interns WHERE status='active' AND julianday(end_date) - julianday('now') BETWEEN 0 AND 30").get();
  const dept_capacity = db.prepare(`
    SELECT d.name, d.total_slots,
      COUNT(CASE WHEN i.status='active' THEN 1 END) as occupied
    FROM departments d LEFT JOIN interns i ON i.department_id=d.id
    GROUP BY d.id
  `).all();
  const avg_achievement = db.prepare("SELECT AVG(achievement_rate) as avg FROM monthly_plans WHERE achievement_rate IS NOT NULL").get();
  const pending_requests = db.prepare("SELECT COUNT(*) as count FROM placement_requests WHERE status='pending'").get();
  const unresolved_followups = db.prepare("SELECT COUNT(*) as count FROM followups WHERE resolved=0").get();

  res.json({
    total_active: total_interns.count,
    by_category,
    overdue: overdue.count,
    expiring_soon: expiring_soon.count,
    dept_capacity,
    avg_achievement_rate: avg_achievement.avg ? Math.round(avg_achievement.avg) : 0,
    pending_requests: pending_requests.count,
    unresolved_followups: unresolved_followups.count
  });
});

// Retention evidence for a specific intern
router.get('/retention/:intern_id', (req, res) => {
  const intern = db.prepare('SELECT i.*, d.name as department_name FROM interns i LEFT JOIN departments d ON d.id=i.department_id WHERE i.id=?').get(req.params.intern_id);
  const contributions = db.prepare('SELECT * FROM contributions WHERE intern_id=? ORDER BY date DESC').all(req.params.intern_id);
  const plans = db.prepare('SELECT * FROM monthly_plans WHERE intern_id=? ORDER BY month DESC').all(req.params.intern_id);
  const followups = db.prepare('SELECT * FROM followups WHERE intern_id=? ORDER BY date DESC').all(req.params.intern_id);
  const avg_rate = plans.filter(p => p.achievement_rate).reduce((s, p) => s + p.achievement_rate, 0) / (plans.filter(p => p.achievement_rate).length || 1);
  res.json({ intern, contributions, plans, followups, avg_achievement_rate: Math.round(avg_rate) });
});

// Overdue/expiring interns
router.get('/duration-alerts', (req, res) => {
  const alerts = db.prepare(`
    SELECT i.*, d.name as department_name,
      CAST((julianday('now') - julianday(i.end_date)) AS INTEGER) as days_overdue,
      CAST((julianday(i.end_date) - julianday('now')) AS INTEGER) as days_remaining
    FROM interns i LEFT JOIN departments d ON d.id=i.department_id
    WHERE i.status='active' AND (
      julianday('now') > julianday(i.end_date) OR
      julianday(i.end_date) - julianday('now') <= 30
    )
    ORDER BY i.end_date ASC
  `).all();
  res.json(alerts);
});

module.exports = router;
