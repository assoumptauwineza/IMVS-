const express = require('express');
const cors = require('cors');
require('./db/schema');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/interns', require('./routes/interns'));
app.use('/api/contributions', require('./routes/contributions'));
app.use('/api/monthly-plans', require('./routes/monthly_plans'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/reports', require('./routes/reports'));

app.listen(3000, () => console.log('IVMS API running on http://localhost:3000'));
