var $ = function(id){ return document.getElementById(id); };

var modal = {
  open: function(html){ $('modal-content').innerHTML = html; $('modal-overlay').classList.remove('hidden'); },
  close: function(){ $('modal-overlay').classList.add('hidden'); }
};

async function api(path, method, body) {
  method = method || 'GET';
  var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  var r = await fetch(API + path, opts);
  return r.json();
}

function badge(text, cls) { return '<span class="badge badge-' + cls + '">' + text + '</span>'; }
function categoryBadge(c) { return badge(c, c); }
function statusBadge(s) { return badge(s, s); }

var currentPage = 'dashboard';
var deptCache = [];

async function loadDepts() {
  deptCache = await api('/departments');
  return deptCache;
}

function deptOptions(selected) {
  return deptCache.map(function(d){ return '<option value="' + d.id + '"' + (d.id == selected ? ' selected' : '') + '>' + d.name + '</option>'; }).join('');
}

function initApp() {
  $('modal-close').onclick = function(){ modal.close(); };
  $('modal-overlay').onclick = function(e){ if (e.target.id === 'modal-overlay') modal.close(); };
  document.querySelectorAll('.nav-link').forEach(function(a){
    a.onclick = function(e){
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(function(x){ x.classList.remove('active'); });
      a.classList.add('active');
      document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
      currentPage = a.dataset.page;
      $('page-' + currentPage).classList.add('active');
      pages[currentPage]();
    };
  });
  renderDashboard();
}

// DASHBOARD
var _categoryChart = null;
var _placementChart = null;

async function renderDashboard() {
  var el = $('page-dashboard');
  el.innerHTML = '<h1>Dashboard</h1><p>Loading...</p>';
  var d = await api('/reports/dashboard');
  await loadDepts();
  var byCategory = { professional: 0, academic: 0, volunteer: 0 };
  d.by_category.forEach(function(c){ byCategory[c.category] = c.count; });
  var deptBars = d.dept_capacity.map(function(dep){
    var pct = dep.total_slots ? Math.round((dep.occupied / dep.total_slots) * 100) : 0;
    var color = pct >= 90 ? '#e53935' : pct >= 70 ? '#fb8c00' : '#43a047';
    return '<tr><td>' + dep.name + '</td><td>' + dep.total_slots + '</td><td>' + dep.occupied + '</td><td>' + (dep.total_slots - dep.occupied) + '</td><td><div class="cap-bar"><div class="cap-fill" style="width:' + pct + '%;background:' + color + '"></div></div><small>' + pct + '%</small></td></tr>';
  }).join('');

  var now = new Date();
  var dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  if(document.getElementById('header-date-text')) document.getElementById('header-date-text').textContent = dateStr;
  el.innerHTML = '<h1>Dashboard</h1>' +
    '<div class="cards">' +
    '<div class="card info"><div class="val">' + d.total_active + '</div><div class="lbl">Active Placements</div></div>' +
    '<div class="card"><div class="val">' + byCategory.professional + '</div><div class="lbl">Professional Interns</div></div>' +
    '<div class="card"><div class="val">' + byCategory.academic + '</div><div class="lbl">Academic Interns</div></div>' +
    '<div class="card"><div class="val">' + byCategory.volunteer + '</div><div class="lbl">Youth Volunteers</div></div>' +
    '<div class="card warn"><div class="val">' + d.overdue + '</div><div class="lbl">Overdue Placements</div></div>' +
    '<div class="card warn"><div class="val">' + d.expiring_soon + '</div><div class="lbl">Expiring in 30 days</div></div>' +
    '<div class="card ok"><div class="val">' + d.avg_achievement_rate + '%</div><div class="lbl">Avg Achievement</div></div>' +
    '<div class="card"><div class="val">' + d.pending_requests + '</div><div class="lbl">Pending Requests</div></div>' +
    '<div class="card warn"><div class="val">' + d.unresolved_followups + '</div><div class="lbl">Unresolved Follow-ups</div></div>' +
    '</div>' +
    '<div class="charts-row">' +
      '<div class="chart-card"><h2>Placements by Category</h2><canvas id="cat-chart"></canvas></div>' +
      '<div class="chart-card"><h2>Placement Status Overview</h2><canvas id="status-chart"></canvas></div>' +
      '<div class="chart-card"><h2>Department Capacity vs Occupied</h2><canvas id="dept-chart"></canvas></div>' +
    '</div>' +
    '<h2>Department Capacity Table</h2><div class="table-wrap"><table><thead><tr><th>Department</th><th>Total</th><th>Occupied</th><th>Available</th><th>Utilisation</th></tr></thead><tbody>' +
    (deptBars || '<tr><td colspan="5" style="text-align:center;color:#999">No departments yet</td></tr>') +
    '</tbody></table></div>';

  // Category Doughnut Chart
  if (_categoryChart) _categoryChart.destroy();
  _categoryChart = new Chart(document.getElementById('cat-chart'), {
    type: 'doughnut',
    data: {
      labels: ['Professional', 'Academic', 'Volunteer'],
      datasets: [{ data: [byCategory.professional, byCategory.academic, byCategory.volunteer], backgroundColor: ['#1a3c5e','#4fc3f7','#43a047'] }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  // Status Bar Chart
  if (_placementChart) _placementChart.destroy();
  _placementChart = new Chart(document.getElementById('status-chart'), {
    type: 'bar',
    data: {
      labels: ['Active', 'Overdue', 'Expiring Soon', 'Pending Requests', 'Unresolved Follow-ups'],
      datasets: [{ label: 'Count', data: [d.total_active, d.overdue, d.expiring_soon, d.pending_requests, d.unresolved_followups], backgroundColor: ['#1a3c5e','#e53935','#fb8c00','#0277bd','#e65100'] }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  // Department Capacity Chart
  var deptNames = d.dept_capacity.map(function(x){ return x.name; });
  var deptOccupied = d.dept_capacity.map(function(x){ return x.occupied; });
  var deptAvail = d.dept_capacity.map(function(x){ return x.total_slots - x.occupied; });
  new Chart(document.getElementById('dept-chart'), {
    type: 'bar',
    data: {
      labels: deptNames,
      datasets: [
        { label: 'Occupied', data: deptOccupied, backgroundColor: '#1a3c5e' },
        { label: 'Available', data: deptAvail, backgroundColor: '#4fc3f7' }
      ]
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

// DEPARTMENTS
async function renderDepartments() {
  var el = $('page-departments');
  var depts = await loadDepts();
  var rows = depts.map(function(d){
    return '<tr><td>' + d.id + '</td><td>' + d.name + '</td><td>' + d.total_slots + '</td><td>' + d.occupied + '</td><td>' + d.available + '</td><td><button class="btn btn-info btn-sm" onclick="editDept(' + d.id + ',\'' + d.name + '\',' + d.total_slots + ')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteDept(' + d.id + ')">Delete</button></td></tr>';
  }).join('');
  el.innerHTML = '<h1>Departments</h1><div class="toolbar"><button class="btn btn-primary" onclick="addDept()">+ Add Department</button></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Total Slots</th><th>Occupied</th><th>Available</th><th>Actions</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" style="text-align:center;color:#999">No departments</td></tr>') + '</tbody></table></div>';
}

function deptForm(name, slots) {
  name = name || ''; slots = slots || '';
  return '<h2>Department</h2><div class="form-group"><label>Name</label><input id="f-name" value="' + name + '" placeholder="e.g. Finance"/></div><div class="form-group"><label>Total Slots</label><input id="f-slots" type="number" value="' + slots + '" min="0"/></div><button class="btn btn-primary" id="f-save">Save</button>';
}

function addDept() {
  modal.open(deptForm());
  $('f-save').onclick = async function(){
    await api('/departments', 'POST', { name: $('f-name').value, total_slots: +$('f-slots').value });
    modal.close(); renderDepartments();
  };
}

function editDept(id, name, slots) {
  modal.open(deptForm(name, slots));
  $('f-save').onclick = async function(){
    await api('/departments/' + id, 'PUT', { name: $('f-name').value, total_slots: +$('f-slots').value });
    modal.close(); renderDepartments();
  };
}

async function deleteDept(id) {
  if (!confirm('Delete this department?')) return;
  await api('/departments/' + id, 'DELETE');
  renderDepartments();
}

// INTERNS
async function renderInterns() {
  var el = $('page-interns');
  await loadDepts();
  var interns = await api('/interns');
  window._internsData = interns;
  var rows = interns.map(function(i){ return internRow(i); }).join('');
  el.innerHTML = '<h1>Interns & Volunteers</h1><div class="toolbar"><input id="search-intern" placeholder="Search name..." oninput="filterInterns()" style="width:200px"/><select id="filter-cat" onchange="filterInterns()"><option value="">All Categories</option><option value="professional">Professional</option><option value="academic">Academic</option><option value="volunteer">Volunteer</option></select><select id="filter-status" onchange="filterInterns()"><option value="">All Status</option><option value="active">Active</option><option value="completed">Completed</option><option value="retained">Retained</option><option value="terminated">Terminated</option></select><button class="btn btn-primary" onclick="addIntern()">+ Add Intern/Volunteer</button></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Category</th><th>Department</th><th>Partner</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead><tbody id="interns-body">' + (rows || '<tr><td colspan="9" style="text-align:center;color:#999">No records</td></tr>') + '</tbody></table></div>';
}

function internRow(i) {
  return '<tr><td>' + i.id + '</td><td><strong>' + i.full_name + '</strong></td><td>' + categoryBadge(i.category) + '</td><td>' + (i.department_name || '--') + '</td><td>' + (i.referring_partner || '--') + '</td><td>' + i.start_date + '</td><td>' + i.end_date + '</td><td>' + statusBadge(i.status) + '</td><td><button class="btn btn-info btn-sm" onclick="viewIntern(' + i.id + ')">View</button> <button class="btn btn-warn btn-sm" onclick="editIntern(' + i.id + ')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteIntern(' + i.id + ')">Del</button></td></tr>';
}

function filterInterns() {
  var q = $('search-intern').value.toLowerCase();
  var cat = $('filter-cat').value;
  var st = $('filter-status').value;
  var filtered = window._internsData.filter(function(i){ return i.full_name.toLowerCase().includes(q) && (!cat || i.category === cat) && (!st || i.status === st); });
  $('interns-body').innerHTML = filtered.map(function(i){ return internRow(i); }).join('') || '<tr><td colspan="9" style="text-align:center;color:#999">No records</td></tr>';
}

function internFormHTML(i) {
  i = i || {};
  return '<h2>' + (i.id ? 'Edit' : 'Add') + ' Intern / Volunteer</h2>' +
    '<div class="form-row"><div class="form-group"><label>Full Name *</label><input id="f-name" value="' + (i.full_name||'') + '"/></div>' +
    '<div class="form-group"><label>Category *</label><select id="f-cat"><option value="professional"' + (i.category==='professional'?' selected':'') + '>Professional Intern</option><option value="academic"' + (i.category==='academic'?' selected':'') + '>Academic Intern</option><option value="volunteer"' + (i.category==='volunteer'?' selected':'') + '>Youth Volunteer</option></select></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Email</label><input id="f-email" type="email" value="' + (i.email||'') + '"/></div><div class="form-group"><label>Phone</label><input id="f-phone" value="' + (i.phone||'') + '"/></div></div>' +
    '<div class="form-group"><label>Qualification</label><input id="f-qual" value="' + (i.qualification||'') + '"/></div>' +
    '<div class="form-row"><div class="form-group"><label>Referring Partner</label><select id="f-partner"><option value="">-- Select --</option><option value="MIFOTRA"' + (i.referring_partner==='MIFOTRA'?' selected':'') + '>MIFOTRA</option><option value="RALGA"' + (i.referring_partner==='RALGA'?' selected':'') + '>RALGA</option><option value="Direct"' + (i.referring_partner==='Direct'?' selected':'') + '>Direct</option><option value="Other"' + (i.referring_partner==='Other'?' selected':'') + '>Other</option></select></div>' +
    '<div class="form-group"><label>Department</label><select id="f-dept"><option value="">-- Select --</option>' + deptOptions(i.department_id) + '</select></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Start Date *</label><input id="f-start" type="date" value="' + (i.start_date||'') + '"/></div><div class="form-group"><label>End Date *</label><input id="f-end" type="date" value="' + (i.end_date||'') + '"/></div></div>' +
    (i.id ? '<div class="form-group"><label>Status</label><select id="f-status"><option value="active"' + (i.status==='active'?' selected':'') + '>Active</option><option value="completed"' + (i.status==='completed'?' selected':'') + '>Completed</option><option value="retained"' + (i.status==='retained'?' selected':'') + '>Retained</option><option value="terminated"' + (i.status==='terminated'?' selected':'') + '>Terminated</option></select></div>' : '') +
    '<button class="btn btn-primary" id="f-save">Save</button>';
}

function collectInternForm() {
  return { full_name: $('f-name').value, email: $('f-email').value, phone: $('f-phone').value, category: $('f-cat').value, qualification: $('f-qual').value, referring_partner: $('f-partner').value, department_id: $('f-dept').value || null, start_date: $('f-start').value, end_date: $('f-end').value, status: $('f-status') ? $('f-status').value : 'active' };
}

function addIntern() {
  modal.open(internFormHTML());
  $('f-save').onclick = async function(){
    var data = collectInternForm();
    if (!data.full_name || !data.start_date || !data.end_date) return alert('Fill required fields');
    await api('/interns', 'POST', data);
    modal.close(); renderInterns();
  };
}

async function editIntern(id) {
  var i = await api('/interns/' + id);
  modal.open(internFormHTML(i));
  $('f-save').onclick = async function(){
    await api('/interns/' + id, 'PUT', collectInternForm());
    modal.close(); renderInterns();
  };
}

async function deleteIntern(id) {
  if (!confirm('Delete this record?')) return;
  await api('/interns/' + id, 'DELETE');
  renderInterns();
}

async function viewIntern(id) {
  var i = await api('/interns/' + id);
  var daysInfo = i.days_remaining >= 0 ? '<span style="color:#2e7d32">' + i.days_remaining + ' days remaining</span>' : '<span style="color:#c62828">' + Math.abs(i.days_remaining) + ' days overdue</span>';
  modal.open('<h2>' + i.full_name + '</h2><div class="ret-section"><p><strong>Category:</strong> ' + categoryBadge(i.category) + '</p><p><strong>Department:</strong> ' + (i.department_name||'--') + '</p><p><strong>Partner:</strong> ' + (i.referring_partner||'--') + '</p><p><strong>Qualification:</strong> ' + (i.qualification||'--') + '</p><p><strong>Email:</strong> ' + (i.email||'--') + ' &nbsp; <strong>Phone:</strong> ' + (i.phone||'--') + '</p><p><strong>Period:</strong> ' + i.start_date + ' to ' + i.end_date + ' (' + i.days_elapsed + ' days elapsed)</p><p><strong>Duration:</strong> ' + daysInfo + '</p><p><strong>Status:</strong> ' + statusBadge(i.status) + '</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" onclick="modal.close();navigateTo(\'contributions\',' + id + ')">Contributions</button><button class="btn btn-info btn-sm" onclick="modal.close();navigateTo(\'monthly\',' + id + ')">Monthly Plans</button><button class="btn btn-success btn-sm" onclick="modal.close();navigateTo(\'followups\',' + id + ')">Follow-ups</button><button class="btn btn-warn btn-sm" onclick="modal.close();navigateTo(\'retention\',' + id + ')">Retention Evidence</button></div>');
}

function navigateTo(page, internId) {
  document.querySelectorAll('.nav-link').forEach(function(x){ x.classList.remove('active'); });
  document.querySelector('[data-page="' + page + '"]').classList.add('active');
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  $('page-' + page).classList.add('active');
  currentPage = page;
  pages[page](internId);
}

// CONTRIBUTIONS
async function renderContributions(preselect) {
  var el = $('page-contributions');
  var interns = await api('/interns');
  var opts = interns.map(function(i){ return '<option value="' + i.id + '"' + (i.id==preselect?' selected':'') + '>' + i.full_name + '</option>'; }).join('');
  el.innerHTML = '<h1>Contributions</h1><div class="toolbar"><select id="c-intern-filter" onchange="loadContributions()"><option value="">All Interns</option>' + opts + '</select><button class="btn btn-primary" onclick="addContribution()">+ Add Contribution</button></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Intern</th><th>Task</th><th>Output</th><th>Date</th><th>Actions</th></tr></thead><tbody id="contrib-body"></tbody></table></div>';
  if (preselect) $('c-intern-filter').value = preselect;
  loadContributions();
}

async function loadContributions() {
  var id = $('c-intern-filter').value;
  var data = await api('/contributions' + (id ? '?intern_id=' + id : ''));
  $('contrib-body').innerHTML = data.map(function(c){ return '<tr><td>' + c.id + '</td><td>' + c.full_name + '</td><td>' + c.task + '</td><td>' + (c.output||'--') + '</td><td>' + c.date + '</td><td><button class="btn btn-danger btn-sm" onclick="deleteContrib(' + c.id + ')">Del</button></td></tr>'; }).join('') || '<tr><td colspan="6" style="text-align:center;color:#999">No contributions</td></tr>';
}

async function addContribution() {
  var interns = await api('/interns?status=active');
  var opts = interns.map(function(i){ return '<option value="' + i.id + '">' + i.full_name + '</option>'; }).join('');
  modal.open('<h2>Add Contribution</h2><div class="form-group"><label>Intern *</label><select id="f-intern">' + opts + '</select></div><div class="form-group"><label>Task *</label><input id="f-task" placeholder="What was done"/></div><div class="form-group"><label>Output</label><textarea id="f-output"></textarea></div><div class="form-group"><label>Date</label><input id="f-date" type="date" value="' + new Date().toISOString().split('T')[0] + '"/></div><button class="btn btn-primary" id="f-save">Save</button>');
  $('f-save').onclick = async function(){ await api('/contributions', 'POST', { intern_id: $('f-intern').value, task: $('f-task').value, output: $('f-output').value, date: $('f-date').value }); modal.close(); loadContributions(); };
}

async function deleteContrib(id) {
  if (!confirm('Delete?')) return;
  await api('/contributions/' + id, 'DELETE');
  loadContributions();
}

// MONTHLY PLANS
async function renderMonthly(preselect) {
  var el = $('page-monthly');
  var interns = await api('/interns');
  var opts = interns.map(function(i){ return '<option value="' + i.id + '"' + (i.id==preselect?' selected':'') + '>' + i.full_name + '</option>'; }).join('');
  el.innerHTML = '<h1>Monthly Plans & Reports</h1><div class="toolbar"><select id="mp-filter" onchange="loadMonthly()"><option value="">All Interns</option>' + opts + '</select><button class="btn btn-primary" onclick="addPlan()">+ Add Plan</button></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Intern</th><th>Month</th><th>Plan</th><th>Report</th><th>Achievement</th><th>Actions</th></tr></thead><tbody id="mp-body"></tbody></table></div>';
  if (preselect) $('mp-filter').value = preselect;
  loadMonthly();
}

async function loadMonthly() {
  var id = $('mp-filter').value;
  var data = await api('/monthly-plans' + (id ? '?intern_id=' + id : ''));
  $('mp-body').innerHTML = data.map(function(p){
    var pct = p.achievement_rate || 0;
    var bar = p.achievement_rate !== null ? '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;background:' + (pct>=70?'#2e7d32':pct>=40?'#fb8c00':'#e53935') + '"></div></div><small>' + pct + '%</small>' : '--';
    return '<tr><td>' + p.id + '</td><td>' + p.full_name + '</td><td>' + p.month + '</td><td>' + p.plan + '</td><td>' + (p.report || '<em style="color:#999">Pending</em>') + '</td><td>' + bar + '</td><td>' + (!p.report ? '<button class="btn btn-success btn-sm" onclick="submitReport(' + p.id + ')">Submit Report</button>' : '') + '</td></tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#999">No plans</td></tr>';
}

async function addPlan() {
  var interns = await api('/interns?status=active');
  var opts = interns.map(function(i){ return '<option value="' + i.id + '">' + i.full_name + '</option>'; }).join('');
  var now = new Date(); var month = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  modal.open('<h2>Add Monthly Plan</h2><div class="form-group"><label>Intern *</label><select id="f-intern">' + opts + '</select></div><div class="form-group"><label>Month *</label><input id="f-month" type="month" value="' + month + '"/></div><div class="form-group"><label>Plan / Objectives *</label><textarea id="f-plan" rows="4"></textarea></div><button class="btn btn-primary" id="f-save">Save</button>');
  $('f-save').onclick = async function(){ await api('/monthly-plans', 'POST', { intern_id: $('f-intern').value, month: $('f-month').value, plan: $('f-plan').value }); modal.close(); loadMonthly(); };
}

function submitReport(id) {
  modal.open('<h2>Submit Monthly Report</h2><div class="form-group"><label>Report</label><textarea id="f-report" rows="4"></textarea></div><div class="form-group"><label>Achievement Rate (0-100%)</label><input id="f-rate" type="number" min="0" max="100" value="80"/></div><button class="btn btn-success" id="f-save">Submit</button>');
  $('f-save').onclick = async function(){ await api('/monthly-plans/' + id + '/report', 'PUT', { report: $('f-report').value, achievement_rate: +$('f-rate').value }); modal.close(); loadMonthly(); };
}

// FOLLOWUPS
async function renderFollowups(preselect) {
  var el = $('page-followups');
  var interns = await api('/interns');
  var opts = interns.map(function(i){ return '<option value="' + i.id + '"' + (i.id==preselect?' selected':'') + '>' + i.full_name + '</option>'; }).join('');
  el.innerHTML = '<h1>Follow-ups & Support</h1><div class="toolbar"><select id="fu-filter" onchange="loadFollowups()"><option value="">All Interns</option>' + opts + '</select><button class="btn btn-primary" onclick="addFollowup()">+ Add Follow-up</button></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Intern</th><th>Resources Provided</th><th>Used?</th><th>Support Needs</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="fu-body"></tbody></table></div>';
  if (preselect) $('fu-filter').value = preselect;
  loadFollowups();
}

async function loadFollowups() {
  var id = $('fu-filter').value;
  var data = await api('/followups' + (id ? '?intern_id=' + id : ''));
  $('fu-body').innerHTML = data.map(function(f){ return '<tr><td>' + f.id + '</td><td>' + f.full_name + '</td><td>' + (f.resources_provided||'--') + '</td><td>' + (f.resources_used?'Yes':'No') + '</td><td>' + (f.support_needs||'--') + '</td><td>' + f.date + '</td><td>' + (f.resolved ? badge('Resolved','approved') : badge('Open','pending')) + '</td><td>' + (!f.resolved ? '<button class="btn btn-success btn-sm" onclick="resolveFollowup(' + f.id + ')">Resolve</button>' : '') + '</td></tr>'; }).join('') || '<tr><td colspan="8" style="text-align:center;color:#999">No follow-ups</td></tr>';
}

async function addFollowup() {
  var interns = await api('/interns?status=active');
  var opts = interns.map(function(i){ return '<option value="' + i.id + '">' + i.full_name + '</option>'; }).join('');
  modal.open('<h2>Add Follow-up</h2><div class="form-group"><label>Intern *</label><select id="f-intern">' + opts + '</select></div><div class="form-group"><label>Resources Provided</label><input id="f-res" placeholder="e.g. Laptop, Office space"/></div><div class="form-group"><label>Resources Being Used?</label><select id="f-used"><option value="1">Yes</option><option value="0">No</option></select></div><div class="form-group"><label>Support Needs</label><textarea id="f-needs"></textarea></div><button class="btn btn-primary" id="f-save">Save</button>');
  $('f-save').onclick = async function(){ await api('/followups', 'POST', { intern_id: $('f-intern').value, resources_provided: $('f-res').value, resources_used: +$('f-used').value, support_needs: $('f-needs').value }); modal.close(); loadFollowups(); };
}

async function resolveFollowup(id) {
  await api('/followups/' + id + '/resolve', 'PUT');
  loadFollowups();
}

// PLACEMENT REQUESTS
async function renderRequests() {
  var el = $('page-requests');
  await loadDepts();
  var data = await api('/requests');
  var rows = data.map(function(r){ return '<tr><td>' + r.id + '</td><td>' + r.partner + '</td><td>' + r.candidate_name + '</td><td>' + (r.qualification||'--') + '</td><td>' + (r.department_name||'--') + '</td><td>' + badge(r.status, r.status) + '</td><td>' + r.created_at.split('T')[0] + '</td><td>' + (r.status==='pending' ? '<button class="btn btn-success btn-sm" onclick="updateRequest(' + r.id + ',\'approved\')">Approve</button> <button class="btn btn-danger btn-sm" onclick="updateRequest(' + r.id + ',\'rejected\')">Reject</button>' : '') + '</td></tr>'; }).join('');
  el.innerHTML = '<h1>Placement Requests</h1><div class="toolbar"><button class="btn btn-primary" onclick="addRequest()">+ New Request</button></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Partner</th><th>Candidate</th><th>Qualification</th><th>Department</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>' + (rows || '<tr><td colspan="8" style="text-align:center;color:#999">No requests</td></tr>') + '</tbody></table></div>';
}

function addRequest() {
  modal.open('<h2>New Placement Request</h2><div class="form-group"><label>Partner *</label><select id="f-partner"><option value="MIFOTRA">MIFOTRA</option><option value="RALGA">RALGA</option><option value="Direct">Direct</option><option value="Other">Other</option></select></div><div class="form-group"><label>Candidate Name *</label><input id="f-name"/></div><div class="form-group"><label>Qualification</label><input id="f-qual"/></div><div class="form-group"><label>Department</label><select id="f-dept"><option value="">-- Select --</option>' + deptOptions() + '</select></div><button class="btn btn-primary" id="f-save">Submit</button>');
  $('f-save').onclick = async function(){ await api('/requests', 'POST', { partner: $('f-partner').value, candidate_name: $('f-name').value, qualification: $('f-qual').value, department_id: $('f-dept').value || null }); modal.close(); renderRequests(); };
}

async function updateRequest(id, status) {
  await api('/requests/' + id + '/status', 'PUT', { status: status });
  renderRequests();
}

// DURATION ALERTS
async function renderAlerts() {
  var el = $('page-alerts');
  var data = await api('/reports/duration-alerts');
  var rows = data.map(function(i){
    var isOverdue = i.days_overdue > 0;
    return '<tr class="' + (isOverdue?'row-overdue':'row-expiring') + '"><td>' + i.id + '</td><td><strong>' + i.full_name + '</strong></td><td>' + categoryBadge(i.category) + '</td><td>' + (i.department_name||'--') + '</td><td>' + i.start_date + '</td><td>' + i.end_date + '</td><td>' + (isOverdue ? '<span style="color:#c62828;font-weight:700">' + i.days_overdue + ' days overdue</span>' : '<span style="color:#f57f17;font-weight:700">' + i.days_remaining + ' days left</span>') + '</td><td><button class="btn btn-warn btn-sm" onclick="editIntern(' + i.id + ')">Update</button></td></tr>';
  }).join('');
  el.innerHTML = '<h1>Duration Alerts</h1><p style="margin-bottom:16px;color:#666">Placements overdue or expiring within 30 days.</p><div class="table-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Category</th><th>Department</th><th>Start</th><th>End</th><th>Alert</th><th>Action</th></tr></thead><tbody>' + (rows || '<tr><td colspan="8" style="text-align:center;color:#2e7d32">No alerts - all placements on track</td></tr>') + '</tbody></table></div>';
}

// RETENTION EVIDENCE
async function renderRetention(preselect) {
  var el = $('page-retention');
  var interns = await api('/interns');
  var opts = interns.map(function(i){ return '<option value="' + i.id + '"' + (i.id==preselect?' selected':'') + '>' + i.full_name + '</option>'; }).join('');
  el.innerHTML = '<h1>Retention Evidence</h1><div class="toolbar"><select id="ret-filter" onchange="loadRetention()"><option value="">-- Select Intern --</option>' + opts + '</select></div><div id="ret-content"><p style="color:#999">Select an intern to view their retention evidence file.</p></div>';
  if (preselect) { $('ret-filter').value = preselect; loadRetention(); }
}

async function loadRetention() {
  var id = $('ret-filter').value;
  if (!id) return;
  var d = await api('/reports/retention/' + id);
  var i = d.intern;
  var contribList = d.contributions.map(function(c){ return '<li><strong>' + c.date + ':</strong> ' + c.task + ' - ' + (c.output||'N/A') + '</li>'; }).join('') || '<li style="color:#999">No contributions recorded</li>';
  var planList = d.plans.map(function(p){ return '<li><strong>' + p.month + ':</strong> ' + p.plan + (p.report ? '<br><em>Report:</em> ' + p.report + ' <span style="color:#2e7d32">(' + p.achievement_rate + '%)</span>' : '<br><em style="color:#999">No report yet</em>') + '</li>'; }).join('') || '<li style="color:#999">No plans recorded</li>';
  var fuList = d.followups.map(function(f){ return '<li><strong>' + f.date + ':</strong> Resources: ' + (f.resources_provided||'--') + ' | Used: ' + (f.resources_used?'Yes':'No') + ' | Needs: ' + (f.support_needs||'--') + ' | ' + (f.resolved?'Resolved':'Open') + '</li>'; }).join('') || '<li style="color:#999">No follow-ups recorded</li>';
  $('ret-content').innerHTML = '<div class="ret-section"><h3>Intern Profile</h3><p><strong>Name:</strong> ' + i.full_name + ' &nbsp; ' + categoryBadge(i.category) + '</p><p><strong>Department:</strong> ' + (i.department_name||'--') + ' &nbsp; <strong>Partner:</strong> ' + (i.referring_partner||'--') + '</p><p><strong>Period:</strong> ' + i.start_date + ' to ' + i.end_date + ' &nbsp; <strong>Status:</strong> ' + statusBadge(i.status) + '</p><p><strong>Qualification:</strong> ' + (i.qualification||'--') + '</p></div><div class="ret-section"><h3>Average Monthly Achievement: <span style="color:' + (d.avg_achievement_rate>=70?'#2e7d32':'#e65100') + '">' + d.avg_achievement_rate + '%</span></h3><div class="progress-bar" style="height:12px"><div class="progress-fill" style="width:' + d.avg_achievement_rate + '%;background:' + (d.avg_achievement_rate>=70?'#2e7d32':'#fb8c00') + '"></div></div></div><div class="ret-section"><h3>Contributions (' + d.contributions.length + ')</h3><ul style="padding-left:18px;line-height:1.8">' + contribList + '</ul></div><div class="ret-section"><h3>Monthly Plans & Reports (' + d.plans.length + ')</h3><ul style="padding-left:18px;line-height:1.8">' + planList + '</ul></div><div class="ret-section"><h3>Follow-up Records (' + d.followups.length + ')</h3><ul style="padding-left:18px;line-height:1.8">' + fuList + '</ul></div>';
}

// SETTINGS
function renderSettings() {
  var el = $('page-settings');
  var user = currentUser || {};
  el.innerHTML = '<h1>Settings</h1>' +
    '<div class="ret-section"><h3>My Account</h3>' +
    '<p><strong>Name:</strong> ' + (user.full_name||'--') + '</p>' +
    '<p><strong>Email:</strong> ' + (user.email||'--') + '</p>' +
    '<p><strong>Role:</strong> ' + (user.role||'--') + '</p>' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
    '<button class="btn btn-info" onclick="showEditProfile()">Edit Profile</button>' +
    '<button class="btn btn-warn" onclick="showChangePassword()">Change Password</button>' +
    '</div></div>' +
    '<div class="ret-section"><h3>System Information</h3>' +
    '<p><strong>System:</strong> Interns &amp; Volunteers Management System (IVMS)</p>' +
    '<p><strong>Institution:</strong> City of Kigali</p>' +
    '<p><strong>Version:</strong> 1.0</p>' +
    '<p><strong>Backend API:</strong> http://localhost:3000/api</p>' +
    '</div>' +
    '<div class="ret-section"><h3>Danger Zone</h3>' +
    '<button class="btn btn-danger" onclick="doLogout()">Logout from System</button>' +
    '</div>';
}

function showEditProfile() {
  var user = currentUser || {};
  modal.open('<h2>Edit Profile</h2>' +
    '<div class="form-group"><label>Full Name</label><input id="f-name" value="' + (user.full_name||'') + '"/></div>' +
    '<div class="form-group"><label>Email</label><input id="f-email" type="email" value="' + (user.email||'') + '"/></div>' +
    '<div class="form-group"><label>Role</label><select id="f-role"><option value="staff"' + (user.role==='staff'?' selected':'') + '>Staff</option><option value="admin"' + (user.role==='admin'?' selected':'') + '>Admin</option></select></div>' +
    '<button class="btn btn-primary" id="f-save">Save Changes</button>');
  $('f-save').onclick = async function() {
    var full_name = $('f-name').value.trim();
    var email = $('f-email').value.trim();
    var role = $('f-role').value;
    if (!full_name || !email) return alert('Name and email are required');
    var res = await fetch(API + '/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentUser.id, full_name, email, role })
    });
    var data = await res.json();
    if (!res.ok) return alert(data.error);
    currentUser = Object.assign(currentUser, data);
    localStorage.setItem('ivms_user', JSON.stringify(currentUser));
    $('user-info').innerHTML = '<strong>' + currentUser.full_name + '</strong><br/>' + currentUser.role;
    modal.close();
    renderSettings();
  };
}

function showChangePassword() {
  modal.open('<h2>Change Password</h2>' +
    '<div class="form-group"><label>New Password</label><input id="f-newpwd" type="password"/></div>' +
    '<div class="form-group"><label>Confirm Password</label><input id="f-confirmpwd" type="password"/></div>' +
    '<button class="btn btn-primary" id="f-save">Update Password</button>');
  $('f-save').onclick = async function() {
    var np = $('f-newpwd').value;
    var cp = $('f-confirmpwd').value;
    if (!np) return alert('Enter new password');
    if (np !== cp) return alert('Passwords do not match');
    var res = await fetch(API + '/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentUser.id, new_password: np })
    });
    if (!res.ok) return alert('Failed to update password');
    alert('Password updated successfully!');
    modal.close();
  };
}

// PAGE ROUTER
var pages = {
  dashboard: renderDashboard,
  departments: renderDepartments,
  interns: renderInterns,
  contributions: renderContributions,
  monthly: renderMonthly,
  followups: renderFollowups,
  requests: renderRequests,
  alerts: renderAlerts,
  retention: renderRetention,
  settings: renderSettings
};
