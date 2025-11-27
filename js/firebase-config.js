// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyDFBaRe6jDJwbSoRMpGZiQUB8PNXak0o8E",
  authDomain: "konarak-dry-store.firebaseapp.com",
  projectId: "konarak-dry-store",
  storageBucket: "konarak-dry-store.firebasestorage.app",
  messagingSenderId: "796844296062",
  appId: "1:796844296062:web:addf9694564505f914552f"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function logDebug(msg) {
  try {
    const el = document.getElementById('debugLog');
    if (el) el.textContent = new Date().toLocaleTimeString() + ' — ' + msg + '\n' + el.textContent;
    else console.log(msg);
  } catch(e) { console.log(msg); }
}
