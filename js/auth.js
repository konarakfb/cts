// auth.js - handles login + role redirect + sign out
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const resetBtn = document.getElementById('resetBtn');
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (resetBtn) resetBtn.addEventListener('click', handleReset);

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      logDebug('onAuthStateChanged → null');
      return;
    }
    logDebug('onAuthStateChanged → ' + user.email);
    try {
      const udoc = await db.collection('users').doc(user.uid).get();
      if (!udoc.exists) {
        // If user doc missing, redirect to admin to fix quickly
        logDebug('User doc missing for ' + user.email + ' — redirecting to admin.html by default');
        window.location.href = 'admin.html';
        return;
      }
      const meta = udoc.data();
      const role = (meta.role || 'counter').toLowerCase();
      if (role === 'admin') window.location.href = 'admin.html';
      else if (role === 'manager') window.location.href = 'manager.html';
      else window.location.href = 'staff.html';
    } catch (e) {
      logDebug('Auth redirect error: ' + (e.message || e));
    }
  });
});

async function handleLogin(ev) {
  ev && ev.preventDefault();
  const email = (document.getElementById('email').value || '').trim();
  const password = (document.getElementById('password').value || '');
  const errEl = document.getElementById('loginError');
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
    logDebug('Login failed: ' + (e.message || e));
    if (errEl) errEl.textContent = e.message || 'Login failed';
  }
}

async function handleReset() {
  const email = prompt('Enter email for password reset:');
  if (!email) return;
  try {
    await auth.sendPasswordResetEmail(email);
    alert('Password reset email sent');
  } catch (e) {
    alert('Reset failed: ' + (e.message || e));
  }
}
