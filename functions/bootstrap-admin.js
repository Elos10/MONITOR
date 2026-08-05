const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

const ADMIN_EMAIL = 'detic@uberabadigital.com.br';

async function bootstrapAdmin() {
  const password = String(process.env.FIREBASE_INITIAL_ADMIN_PASSWORD || '');
  if (password.length < 6) {
    throw new Error('Configure FIREBASE_INITIAL_ADMIN_PASSWORD como GitHub Secret.');
  }

  initializeApp({ credential: applicationDefault() });
  const auth = getAuth();
  let user;

  try {
    user = await auth.getUserByEmail(ADMIN_EMAIL);
    user = await auth.updateUser(user.uid, {
      displayName: 'ADMINISTRADOR DETIC',
      password,
      disabled: false
    });
    console.log('Administrador inicial já existe; acesso institucional sincronizado.');
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    user = await auth.createUser({
      email: ADMIN_EMAIL,
      password,
      displayName: 'ADMINISTRADOR DETIC',
      disabled: false
    });
    console.log('Administrador inicial criado no Firebase Authentication.');
  }

  await getFirestore().doc(`users/${user.uid}`).set({
    fullName: 'ADMINISTRADOR DETIC',
    email: ADMIN_EMAIL,
    role: 'administrador',
    active: true,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'github-actions-bootstrap'
  }, { merge: true });

  console.log('Perfil e acesso do administrador confirmados.');
}

bootstrapAdmin().catch((error) => {
  console.error(`::error::${error.message}`);
  process.exit(1);
});
