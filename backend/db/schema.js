const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ivms.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'staff' CHECK(role IN ('admin','staff')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    total_slots INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    category TEXT CHECK(category IN ('professional','academic','volunteer')) NOT NULL,
    qualification TEXT,
    referring_partner TEXT,
    department_id INTEGER REFERENCES departments(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','retained','terminated')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intern_id INTEGER REFERENCES interns(id),
    task TEXT NOT NULL,
    output TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS monthly_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intern_id INTEGER REFERENCES interns(id),
    month TEXT NOT NULL,
    plan TEXT NOT NULL,
    report TEXT,
    achievement_rate INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intern_id INTEGER REFERENCES interns(id),
    resources_provided TEXT,
    resources_used INTEGER DEFAULT 0,
    support_needs TEXT,
    resolved INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS placement_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    qualification TEXT,
    department_id INTEGER REFERENCES departments(id),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
