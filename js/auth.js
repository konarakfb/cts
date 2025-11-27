// js/auth.js  — fixed version (replace your file with this)
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const resetBtn = document.getElementById('resetBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (resetBtn) resetBtn.addEventListener('click', handleReset);
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      // after signout, send to login
      window.location.replace('index.html');
    });
  });

  // helper to get the "file" of current page (index.html, admin.html, etc.)
  function currentPageName() {
    const parts = window.location.pathname.split('/');
    let p = parts.pop() || parts.pop(); // handle trailing slash
    if (!p) p = 'index.html';
    return p.toLowerCase();
  }

  // map page → required role (if any). 'staff' covers counter/counter role.
  const pageRequiredRole = {
    'admin.html': 'admin',
    'manager.html': 'manager',
    'staff.html': 'staff',
    'index.html': null,
    'login.html': null
  };

  auth.onAuthStateChanged(async (user) => {
    const page = currentPageName();

    // USER NOT LOGGED IN -> allow only login page
    if (!user) {
      // If we're not on login, send to login
      if (page !== 'index.html' && page !== 'login.html') {
        // use replace so back doesn't loop
        window.location.replace('index.html');
      }
      return;
    }

    // USER IS LOGGED IN
    logDebug('onAuthStateChanged → ' + (user.email || user.uid));

    // If we are on a dashboard page (admin/manager/staff), verify that the user role
    // matches. If not, redirect to the correct role page.
    const requiredRoleForThisPage = pageRequiredRole[page] || null;

    try {
      const udoc = await db.collection('users').doc(user.uid).get();

      // if no user doc, send to admin to fix account quickly
      if (!udoc.exists) {
        logDebug('User document missing — redirecting to admin.html for fix');
        if (page !== 'admin.html') window.location.replace('admin.html');
        return;
      }

      const meta = udoc.data() || {};
      // Accept either 'counter' or 'staff' as staff role
      const roleRaw = (meta.role || 'staff').toString().toLowerCase();
      const role = (roleRaw === 'counter') ? 'staff' : roleRaw; // normalize

      // If we're currently on a dashboard page, and it's the right page for this role, do nothing.
      if (requiredRoleForThisPage) {
        // if role matches required role, stay; otherwise redirect to correct page
        if ( (requiredRoleForThisPage === 'staff' && role === 'staff') ||
             (requiredRoleForThisPage === role) ) {
          logDebug(`On ${page} and user role is ${role} — no redirect`);
          return;
        } else {
          // role mismatch — redirect to correct dashboard for this user
          redirectToRolePage(role);
          return;
        }
      }

      // If we're on the login page, redirect user to their appropriate dashboard
      if (page === 'index.html' || page === 'login.html') {
        redirectToRolePage(role);
        return;
      }

      // Otherwise (unknown page), do nothing.
      logDebug('Auth check complete — no action for page: ' + page);

    } catch (err) {
      logDebug('Auth redirect error: ' + (err && err.message ? err.message : err));
    }
  });

  function redirectToRolePage(role) {
    if (!role) {
      window.location.replace('index.html');
      return;
    }
    if (role === 'admin') window.location.replace('admin.html');
    else if (role === 'manager') window.location.replace('manager.html');
    else window.location.replace('staff.html');
  }
});


// LOGIN HANDLER
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
    // onAuthStateChanged will handle the redirect
  } catch (e) {
    logDebug('Login failed: ' + (e && e.message ? e.message : e));
    if (errEl) errEl.textContent = (e && e.message) ? e.message : 'Login failed';
  }
}


// RESET PASSWORD
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
