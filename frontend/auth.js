var API = 'http://localhost:3000/api';
var currentUser = JSON.parse(localStorage.getItem('ivms_user') || 'null');

function showLogin() {
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-error').classList.add('hidden');
}

function showRegister() {
  document.getElementById('register-form').classList.remove('hidden');
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-error').classList.add('hidden');
}

function showAuthError(form, msg) {
  var el = document.getElementById(form + '-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function doLogin() {
  var email = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;
  if (!email || !password) return showAuthError('login', 'Please fill all fields');
  fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) return showAuthError('login', data.error);
      currentUser = data;
      localStorage.setItem('ivms_user', JSON.stringify(data));
      launchApp();
    });
  }).catch(function(err) {
    showAuthError('login', 'Cannot connect to server. Make sure backend is running.');
  });
}

function doRegister() {
  var full_name = document.getElementById('reg-name').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var password = document.getElementById('reg-password').value;
  var role = document.getElementById('reg-role').value;
  if (!full_name || !email || !password) return showAuthError('register', 'Please fill all fields');
  fetch(API + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: full_name, email: email, password: password, role: role })
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) return showAuthError('register', data.error);
      alert('Account created! Please sign in.');
      showLogin();
      document.getElementById('login-email').value = email;
    });
  }).catch(function(err) {
    showAuthError('register', 'Cannot connect to server. Make sure backend is running.');
  });
}

function doLogout() {
  localStorage.removeItem('ivms_user');
  currentUser = null;
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  showLogin();
}

function launchApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  document.getElementById('user-info').innerHTML =
    '<strong>' + currentUser.full_name + '</strong><br/>' + currentUser.role;
  var now = new Date();
  var dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  var el = document.getElementById('header-date-text');
  if(el) el.textContent = dateStr;
  initApp();
}

window.addEventListener('DOMContentLoaded', function() {
  if (currentUser) {
    launchApp();
  }
});
