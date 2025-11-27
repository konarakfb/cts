// js/auth.js
// Robust auth + role redirect; avoids infinite loops
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const resetBtn = document.getElementById('resetBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (resetBtn) resetBtn.addEventListener('click', handleReset);
  if (logoutBtn) logoutBtn.addEventListener('click', ()=>auth.signOut().then(()=>window.location.replace('index.html')));

  function currentPageName() {
    const parts = window.location.pathname.split('/');
    let p = parts.pop() || parts.pop();
    if (!p) p = 'index.html';
    return p.toLowerCase();
  }

  const pageRequiredRole = {
    'admin.html': 'admin',
    'manager.html': 'manager',
    'staff.html': 'staff',
    'index.html': null,
    'login.html': null
  };

  auth.onAuthStateChanged(async (user) => {
    const page = currentPageName();

    if (!user) {
      if (page !== 'index.html' && page !== 'login.html') {
        window.location.replace('index.html');
      }
      return;
    }

    logDebug('Logged in: ' + (user.email || user.uid));

    const requiredRoleForThisPage = pageRequiredRole[page] || null;

    try {
      const udoc = await db.collection('users').doc(user.uid).get();

      if (!udoc.exists) {
        logDebug('User document missing — redirecting to admin');
        if (page !== 'admin.html') window.location.replace('admin.html');
        return;
      }

      const meta = udoc.data() || {};
      const roleRaw = (meta.role || 'staff').toString().toLowerCase();
      const role = (roleRaw === 'counter') ? 'staff' : roleRaw;

      if (requiredRoleForThisPage) {
        if (
          (requiredRoleForThisPage === 'staff' && role === 'staff') ||
          (requiredRoleForThisPage === role)
        ) {
          logDebug(`On ${page} and user role is ${role} — no redirect`);
          return;
        } else {
          redirectToRolePage(role);
          return;
        }
      }

      if (page === 'index.html' || page === 'login.html') {
        redirectToRolePage(role);
        return;
      }

      logDebug('Auth check complete — no action for page: ' + page);
    } catch (err) {
      logDebug('Auth redirect error: ' + (err && err.message ? err.message : err));
    }
  });

  function redirectToRolePage(role) {
    if (!role) { window.location.replace('index.html'); return; }
    if (role === 'admin') window.location.replace('admin.html');
    else if (role === 'manager') window.location.replace('manager.html');
    else window.location.replace('staff.html');
  }
});

async function handleLogin(ev) {
  ev && ev.preventDefault();
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const errEl = document.getElementById('loginError');

  const email = emailEl ? (emailEl.value || '').trim() : '';
  const password = passwordEl ? (passwordEl.value || '') : '';

  if (errEl) errEl.textContent = '';

  if (!email || !password) {
    if (errEl) errEl.textContent = 'Enter email and password';
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    logDebug('Login success: ' + email);
    // redirect handled by onAuthStateChanged
  } catch (e) {
    logDebug('Login failed: ' + (e && e.message ? e.message : e));
    if (errEl) errEl.textContent = (e && e.message) ? e.message : 'Login failed';
  }
}

async function handleReset() {
  const email = prompt('Enter email for password reset:');
  if (!email) return;
  try {
    await auth.sendPasswordResetEmail(email);
    alert('Password reset email sent');
  } catch (e) {
    alert('Reset failed: ' + (e && e.message ? e.message : e));
  }
}
