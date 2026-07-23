const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

initializeApp();

exports.manageUser=onCall({region:'southamerica-east1'},async request=>{
  if(!request.auth)throw new HttpsError('unauthenticated','É necessário entrar no sistema.');
  const db=getFirestore(),adminSnap=await db.doc(`users/${request.auth.uid}`).get();
  if(!adminSnap.exists||adminSnap.data().active!==true||adminSnap.data().role!=='administrador')throw new HttpsError('permission-denied','Somente administradores podem gerenciar usuários.');
  const {uid,email,password,fullName,role,active=true}=request.data||{},allowedRoles=['administrador','gabinete','assessoria','diretoria','departamento','secao','servidor'];
  if(!email||!fullName||!allowedRoles.includes(role))throw new HttpsError('invalid-argument','Nome, e-mail e perfil são obrigatórios.');
  if(password&&password.length<6)throw new HttpsError('invalid-argument','A senha deve ter pelo menos 6 caracteres.');
  let user;
  if(uid){
    const changes={email,displayName:fullName,disabled:active===false};if(password)changes.password=password;
    user=await getAuth().updateUser(uid,changes);
  }else{
    if(!password)throw new HttpsError('invalid-argument','Informe uma senha para o novo usuário.');
    user=await getAuth().createUser({email,password,displayName:fullName,disabled:active===false});
  }
  await db.doc(`users/${user.uid}`).set({fullName,email,role,active:active!==false,updatedAt:FieldValue.serverTimestamp(),updatedBy:request.auth.uid},{merge:true});
  await db.collection('audit').add({userId:request.auth.uid,userName:adminSnap.data().fullName||request.auth.token.email,action:uid?'UPDATE_USER':'CREATE_USER',entity:'users',recordId:user.uid,newData:{email,fullName,role,active:active!==false,passwordChanged:!!password},createdAt:FieldValue.serverTimestamp()});
  return{uid:user.uid,email:user.email,fullName,role,active:active!==false};
});
