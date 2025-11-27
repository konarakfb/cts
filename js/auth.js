// auth.js - safe login + role redirect (no infinite looping)
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const resetBtn = document.getElementById('resetBtn');
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (resetBtn) resetBtn.addEventListener('click', handleReset);

  auth.onAuthStateChanged(async (user) => {
    const page = window.location.pathname.toLowerCase();

    // -------------------------
    // USER NOT LOGGED IN
    // -------------------------
    if (!user) {
      if (!page.includes('index.html')) {
        window.location.replace('index.html');   // go to login page
      }
      return;
    }

    // -------------------------
    // USER LOGGED IN
    // -------------------------
    logDebug('Logged in: ' + user.email);

    // If already on a role page, don't redirect again
    if (
      page.includes('admin.html') ||
      page.includes('manager.html') ||
      page.includes('staff.html')
    ) return;

    try {
      const udoc = await db.collection('users').doc(user.uid).get();

      if (!udoc.exists) {
        logDebug('No user document — sending to admin');
        window.location.replace('admin.html');
        return;
      }

      const role = (udoc.data().role || 'staff').toLowerCase();

      if (role === 'admin') {
        window.location.replace('admin.html');
      } else if (role === 'manager') {
        window.location.replace('manager.html');
      } else {
        window.location.replace('staff.html');
      }

    } catch (e) {
      logDebug('Auth redirect error: ' + e.message);
    }
  });
});

async function handleLogin(ev) {
  ev && ev.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errEl = document.getElementById('loginError');
  if (errEl) errEl.textContent = '';

  if (!email || !password) {
    if (errEl) errEl.textContent = 'Enter email and password';
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    logDebug('Login success: ' + email);
  } catch (e) {
    logDebug('Login failed: ' + e.message);
    if (errEl) errEl.textContent = e.message;
  }
}

async function handleReset() {
  const email = prompt('Enter email for password reset:');
  if (!email) return;
  try {
    await auth.sendPasswordResetEmail(email);
    alert('Password reset email sent');
  } catch (e) {
    alert('Reset failed: ' + e.message);
  }
}
