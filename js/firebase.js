/* ==========================================================================
   FIREBASE — inicialização. Os SDKs "compat" são carregados no index.html.
   ========================================================================== */
const FB = (() => {
  if (typeof firebase === "undefined" || !CFG.FIREBASE || !CFG.FIREBASE.apiKey) {
    console.error("Firebase não configurado: preencha CFG.FIREBASE em js/config.js");
    return null;
  }
  firebase.initializeApp(CFG.FIREBASE);
  return { auth: firebase.auth(), db: firebase.firestore(), Google: firebase.auth.GoogleAuthProvider };
})();
