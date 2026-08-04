const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

initializeApp();
const roles=['administrador','gabinete','assessoria','diretoria','departamento','secao','servidor'];

exports.manageUser=onCall({region:'southamerica-east1'},async request=>{
  if(!request.auth)throw new HttpsError('unauthenticated','Autenticação obrigatória.');
  const db=getFirestore(),adminSnap=await db.doc(`users/${request.auth.uid}`).get();
  if(!adminSnap.exists||adminSnap.data().active!==true||adminSnap.data().role!=='administrador')throw new HttpsError('permission-denied','Apenas administradores podem gerenciar usuários.');
  const data=request.data||{},email=String(data.email||'').trim().toLowerCase(),fullName=String(data.fullName||'').trim(),role=String(data.role||''),active=data.active!==false;
  if(!email||!fullName||!roles.includes(role))throw new HttpsError('invalid-argument','Nome, e-mail e perfil válidos são obrigatórios.');
  if(data.password&&String(data.password).length<6)throw new HttpsError('invalid-argument','A senha deve ter no mínimo 6 caracteres.');
  const auth=getAuth();let record;
  if(data.uid){record=await auth.updateUser(data.uid,{email,displayName:fullName,disabled:!active,...(data.password?{password:String(data.password)}:{})})}
  else{if(!data.password)throw new HttpsError('invalid-argument','Informe a senha inicial.');record=await auth.createUser({email,password:String(data.password),displayName:fullName,disabled:!active})}
  const profile={fullName,email,role,active,updatedAt:FieldValue.serverTimestamp(),updatedBy:request.auth.uid};
  await db.doc(`users/${record.uid}`).set(profile,{merge:true});
  await db.collection('audit').add({userId:request.auth.uid,userName:adminSnap.data().fullName||request.auth.token.email,action:data.uid?'UPDATE_USER':'CREATE_USER',entity:'users',recordId:record.uid,newData:{fullName,email,role,active},createdAt:FieldValue.serverTimestamp()});
  return{uid:record.uid,fullName,email,role,active};
});
