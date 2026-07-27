document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="workflow-enhancements.css">');
const baseLoadRemoteState=loadRemoteState;
loadRemoteState=async function(){
  await baseLoadRemoteState();
  if(!firebase)return;
  try{
    const {collection,getDocs}=firebase.firestoreSdk;
    const [usersSnap,eventsSnap,objectsSnap]=await Promise.all([getDocs(collection(firebase.db,'users')),getDocs(collection(firebase.db,'events')),getDocs(collection(firebase.db,'objects'))]);
    state.users=usersSnap.docs.map(d=>({id:d.id,...d.data()}));
    const remoteObjects=new Map(objectsSnap.docs.map(d=>[d.id,d.data()]));
    state.objects=state.objects.map(o=>{const r=remoteObjects.get(o.dbId)||{};return{...o,objectType:r.objectType||o.objectType||'',duration:Number(r.duration??o.duration??0),interventionType:r.interventionType||o.interventionType||'',primaryArea:r.primaryArea||r.area||o.primaryArea||o.area,secondaryArea:r.secondaryArea||o.secondaryArea||'',observation:r.observation||o.observation||o.description||''}});
    const remote=new Map(eventsSnap.docs.map(d=>[d.id,d.data()]));
    state.events=state.events.map(e=>{const r=remote.get(e.dbId||e.id)||{};return{...e,productDelivery:r.productDelivery||'',responsible:r.responsible||'',area:r.area||'',observation:r.observation||'',assignedTo:r.assignedTo||'',assignedToName:r.assignedToName||'',assignedBy:r.assignedBy||r.createdBy||'',assignedByName:r.assignedByName||r.createdByName||'',receivedAt:r.receivedAt?.toDate?.().toISOString()||r.receivedAt||'',receivedBy:r.receivedBy||'',assigneeNote:r.assigneeNote||''}});
    recalculateAllProgress();save();
  }catch(error){toast('Falha ao carregar as atribuições: '+error.message)}
};

function progressEvents(objectId){return state.events.filter(e=>e.objectId===objectId&&e.status)}
function calculateProgress(objectId){const events=progressEvents(objectId);return events.length?Math.round(events.filter(e=>e.status==='finalizado').length/events.length*100):0}
function recalculateAllProgress(){state.objects.forEach(o=>o.progress=calculateProgress(o.id))}
function assignedEvents(){return state.events.filter(e=>e.assignedTo&&(e.assignedTo===session?.id||e.assignedToName===session?.name))}
function senderReceipts(){return state.events.filter(e=>e.assignedBy&&(e.assignedBy===session?.id||e.assignedByName===session?.name)&&e.receivedAt)}

function assignmentNotice(){
  const pending=assignedEvents().filter(e=>!e.receivedAt),receipts=senderReceipts();
  if(!pending.length&&!receipts.length)return'';
  return `<section class="assignment-alerts">${pending.length?`<button class="assignment-alert pending" onclick="openAssignments()"><strong>${pending.length} andamento${pending.length===1?'':'s'} para você</strong><span>Abra para confirmar o recebimento, aplicar e atualizar o status.</span></button>`:''}${receipts.slice(0,3).map(e=>`<div class="assignment-alert received"><strong>Andamento recebido</strong><span>${esc(e.assignedToName)} abriu ${esc(e.objectId)}.</span></div>`).join('')}</section>`;
}

const baseRender=render;
render=function(){baseRender();setupLoginLogo();if(session){const content=document.querySelector('.content');if(content)content.insertAdjacentHTML('afterbegin',assignmentNotice());setupNotificationBell();setupEditObjectButton()}};

function setupLoginLogo(){
  const seal=document.querySelector('.login .seal');if(!seal)return;
  seal.innerHTML='<img src="assets/logo_semed.jpeg" alt="Secretaria de Educação de Uberaba">';
  seal.classList.add('semed-logo')
}

function openAssignments(){
  const items=assignedEvents().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  modal(`<div class="modal-head"><h2>Meus andamentos</h2><button class="icon-btn" onclick="closeModal()">✕</button></div><div class="assignment-list">${items.map(e=>`<button onclick="openAssignedEvent('${e.id}')"><span><strong>${esc(e.objectId)} · ${esc(e.productDelivery||e.type)}</strong><small>${esc(e.text||'Sem descrição')} · enviado por ${esc(e.assignedByName||e.user)}</small></span><span class="pill ${e.status==='finalizado'?'green':e.receivedAt?'blue':'amber'}">${e.receivedAt?eventStatusLabel(e.status):'Novo'}</span></button>`).join('')||'<div class="empty">Nenhum andamento direcionado para você.</div>'}</div>`)
}

function eventStatusLabel(status){return({a_iniciar:'À iniciar',a_executar:'À executar',em_andamento:'Em andamento',em_execucao:'Em execução',parado:'Parado',cancelado:'Cancelado',arquivado:'Arquivado',finalizado:'Finalizado'})[status]||status||'Sem status'}

eventModal=function(id=''){
  const users=(state.users||[]).filter(u=>u.active!==false);
  modal(`<div class="modal-head"><h2>Novo andamento</h2><button class="icon-btn" onclick="closeModal()">✕</button></div><form class="form-grid" onsubmit="addEvent(event)"><div class="field"><label>Objeto</label><select name="objectId">${state.objects.map(o=>`<option ${id===o.id?'selected':''} value="${o.id}">${o.id} — ${esc(o.title)}</option>`).join('')}</select></div><div class="field"><label>Tipo de evento</label><select name="type"><option>Andamento</option><option>Pendência</option><option>Decisão</option><option>Comentário</option><option>Status</option></select></div><div class="field"><label>Status</label><select name="status" onchange="handleEventStatus(this)" required><option value="a_iniciar">À iniciar</option><option value="a_executar">À executar</option><option value="em_andamento">Em andamento</option><option value="em_execucao">Em execução</option><option value="parado">Parado</option><option value="cancelado">Cancelado</option><option value="arquivado">Arquivado</option><option value="finalizado">Finalizado</option></select></div><div class="field"><label>Direcionar para usuário</label><select name="assignedTo"><option value="">Sem direcionamento</option>${users.map(u=>`<option value="${u.id}">${esc(u.fullName||u.email)}</option>`).join('')}</select></div><div class="field span2"><label>Descrição</label><textarea name="text" rows="4" required></textarea><small id="descriptionStatusHint" class="field-hint">Informe os detalhes deste andamento.</small></div><div class="field"><label>Produto / Entrega</label><input name="productDelivery"></div><div class="field"><label>Responsável</label><input name="responsible"></div><div class="field"><label>Área</label><select name="area"><option value="">Selecione</option><option>Gestão Pedagógica</option><option>Infraestrutura</option><option>Tecnologia</option><option>Logística</option><option>Gestão de Pessoas</option></select></div><div class="field"><label>Observação</label><textarea name="observation" rows="3"></textarea></div><div class="span2"><label class="section-label">Este andamento terá controle de datas?</label><div class="date-options"><label class="date-toggle"><input type="checkbox" name="includeForecast" onchange="toggleDateSection('forecastDates',this.checked)"><span>Data de Previsão</span></label><label class="date-toggle"><input type="checkbox" name="includeExecution" onchange="toggleDateSection('executionDates',this.checked)"><span>Data de Execução</span></label></div></div><section class="date-section" id="forecastDates" hidden><div class="field"><label>Data de Previsão Início</label><input type="date" name="forecastStart" onchange="calculateDatePeriod('forecast')"></div><div class="field"><label>Data de Previsão Término</label><input type="date" name="forecastEnd" onchange="calculateDatePeriod('forecast')"></div><output class="days-result" id="forecastDays"><strong>—</strong><small>Dias previstos</small></output></section><section class="date-section" id="executionDates" hidden><div class="field"><label>Data de Execução Início</label><input type="date" name="executionStart" onchange="calculateDatePeriod('execution')"></div><div class="field"><label>Data de Execução Término</label><input type="date" name="executionEnd" onchange="calculateDatePeriod('execution')"></div><output class="days-result" id="executionDays"><strong>—</strong><small>Dias de execução</small></output></section><div class="span2 actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn" id="registerHistoryBtn">Registrar no histórico</button></div></form>`)
};

addEvent=async function(e){
  e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),obj=state.objects.find(o=>o.id===f.objectId),assigned=state.users.find(u=>u.id===f.assignedTo),description=f.text||'',details={productDelivery:f.productDelivery||'',responsible:f.responsible||'',area:f.area||'',observation:f.observation||''},hasForecast=f.includeForecast==='on',hasExecution=f.includeExecution==='on',forecastDays=hasForecast?calculateDatePeriod('forecast'):null,executionDays=hasExecution?calculateDatePeriod('execution'):null;
  if((hasForecast&&forecastDays===null)||(hasExecution&&executionDays===null)){e.target.reportValidity();return}
  const assignment={assignedTo:f.assignedTo||'',assignedToName:assigned?.fullName||'',assignedBy:session.id||'',assignedByName:session.name},schedule={hasForecast,hasExecution,...(hasForecast?{forecastStart:f.forecastStart,forecastEnd:f.forecastEnd,forecastDays}:{}),...(hasExecution?{executionStart:f.executionStart,executionEnd:f.executionEnd,executionDays}:{})},localEvent={id:crypto.randomUUID(),objectId:f.objectId,type:f.type,status:f.status,text:description,...details,...assignment,...schedule,date:new Date().toLocaleString('sv-SE').slice(0,16),user:session.name};
  const projected=[localEvent,...state.events],relevant=projected.filter(x=>x.objectId===f.objectId&&x.status),progress=relevant.length?Math.round(relevant.filter(x=>x.status==='finalizado').length/relevant.length*100):0;
  if(firebase){try{const {collection,doc,writeBatch,serverTimestamp}=firebase.firestoreSdk,eventRef=doc(collection(firebase.db,'events')),auditRef=doc(collection(firebase.db,'audit')),batch=writeBatch(firebase.db),eventData={objectId:obj?.dbId,objectCode:f.objectId,eventType:f.type,status:f.status,description,...details,...assignment,...schedule,createdBy:session.id,createdByName:session.name,eventAt:serverTimestamp()};batch.set(eventRef,eventData);if(obj?.dbId)batch.update(doc(firebase.db,'objects',obj.dbId),{progress,updatedAt:serverTimestamp()});batch.set(auditRef,{userId:session.id,userName:session.name,action:'CREATE',entity:'events',recordId:eventRef.id,newData:eventData,createdAt:serverTimestamp()});await batch.commit();localEvent.id=eventRef.id;localEvent.dbId=eventRef.id}catch(error){return toast('Erro ao registrar andamento: '+error.message)}}
  state.events.unshift(localEvent);if(obj)obj.progress=progress;save();closeModal();toast(assigned?'Andamento direcionado para '+assigned.fullName+'.':'Andamento registrado.');render()
};

async function openAssignedEvent(id){
  const e=state.events.find(x=>x.id===id||x.dbId===id);if(!e)return;
  if(!e.receivedAt){e.receivedAt=new Date().toISOString();e.receivedBy=session.id||session.name;if(firebase&&e.dbId){try{await firebase.firestoreSdk.updateDoc(firebase.firestoreSdk.doc(firebase.db,'events',e.dbId),{receivedAt:firebase.firestoreSdk.serverTimestamp(),receivedBy:session.id,receivedByName:session.name})}catch(error){return toast('Não foi possível confirmar o recebimento: '+error.message)}}save()}
  closeModal();modal(`<div class="modal-head"><h2>Atualizar andamento</h2><button class="icon-btn" onclick="closeModal()">✕</button></div><div class="notice">Recebimento confirmado para ${esc(e.assignedByName||e.user)}.</div><form class="form-grid" onsubmit="updateAssignedEvent(event,'${e.id}')"><div class="field span2"><label>Objeto / Entrega</label><input value="${esc(e.objectId+' — '+(e.productDelivery||e.type))}" disabled></div><div class="field"><label>Status</label><select name="status">${['a_iniciar','a_executar','em_andamento','em_execucao','parado','cancelado','arquivado','finalizado'].map(s=>`<option value="${s}" ${e.status===s?'selected':''}>${eventStatusLabel(s)}</option>`).join('')}</select></div><div class="field"><label>Responsável</label><input value="${esc(e.assignedToName)}" disabled></div><div class="field span2"><label>Informação do responsável</label><textarea name="assigneeNote" rows="4">${esc(e.assigneeNote||'')}</textarea></div><div class="span2 actions"><button type="button" class="btn secondary" onclick="closeModal()">Fechar</button><button class="btn">Salvar atualização</button></div></form>`)
}

async function updateAssignedEvent(ev,id){
  ev.preventDefault();const e=state.events.find(x=>x.id===id||x.dbId===id),f=Object.fromEntries(new FormData(ev.target));if(!e)return;e.status=f.status;e.assigneeNote=f.assigneeNote||'';const obj=state.objects.find(o=>o.id===e.objectId),progress=calculateProgress(e.objectId);
  if(firebase&&e.dbId){try{const {doc,collection,writeBatch,serverTimestamp}=firebase.firestoreSdk,batch=writeBatch(firebase.db);batch.update(doc(firebase.db,'events',e.dbId),{status:e.status,assigneeNote:e.assigneeNote,updatedAt:serverTimestamp()});if(obj?.dbId)batch.update(doc(firebase.db,'objects',obj.dbId),{progress,updatedAt:serverTimestamp()});batch.set(doc(collection(firebase.db,'audit')),{userId:session.id,userName:session.name,action:'UPDATE_ASSIGNMENT',entity:'events',recordId:e.dbId,newData:{status:e.status,assigneeNote:e.assigneeNote},createdAt:serverTimestamp()});await batch.commit()}catch(error){return toast('Erro ao atualizar andamento: '+error.message)}}
  if(obj)obj.progress=progress;save();closeModal();toast(`Status atualizado. Progresso do objeto: ${progress}%.`);render()
}

const loadWithAssignments=loadRemoteState;
loadRemoteState=async function(){
  await loadWithAssignments();state.notificationReads=[];
  if(!firebase||!session?.id)return;
  try{const {collection,getDocs,query,where}=firebase.firestoreSdk,snap=await getDocs(query(collection(firebase.db,'notificationReads'),where('userId','==',session.id)));state.notificationReads=snap.docs.map(d=>d.data().eventId)}catch(error){console.warn('Não foi possível carregar notificações lidas',error)}
};

function generalNotifications(){return state.events.filter(e=>!e.assignedTo&&e.user!==session?.name&&!state.notificationReads?.includes(e.id))}
function availableNotifications(){return[...assignedEvents().filter(e=>!e.receivedAt).map(e=>({kind:'assigned',event:e,title:'Andamento direcionado',text:`${e.objectId} · ${e.productDelivery||e.text||e.type}`})),...generalNotifications().map(e=>({kind:'general',event:e,title:'Novo andamento',text:`${e.objectId} · ${e.text||e.type}`})),...senderReceipts().map(e=>({kind:'receipt',event:e,title:'Recebimento confirmado',text:`${e.assignedToName} recebeu ${e.objectId}`}))]}

function setupNotificationBell(){
  const buttons=document.querySelectorAll('.top-actions .icon-btn'),bell=buttons[1];if(!bell)return;const notifications=availableNotifications();
  bell.innerHTML=`●${notifications.length?` <span class="pill red">${notifications.length}</span>`:''}`;bell.title='Notificações';bell.onclick=openNotificationCenter;bell.onmouseenter=showNotificationDropdown;bell.onmouseleave=()=>setTimeout(hideNotificationDropdown,180);
}

function showNotificationDropdown(){
  hideNotificationDropdown();const bell=document.querySelectorAll('.top-actions .icon-btn')[1],items=availableNotifications().slice(0,6);if(!bell)return;
  bell.insertAdjacentHTML('afterend',`<div class="notification-dropdown" id="notificationDropdown" onmouseenter="this.dataset.hover='1'" onmouseleave="this.remove()"><strong>Notificações</strong>${items.map(n=>`<div><span class="pill ${n.kind==='assigned'?'amber':'blue'}">${n.kind==='assigned'?'Para você':'Informação'}</span><p>${esc(n.text)}</p></div>`).join('')||'<p class="empty-mini">Nenhuma notificação disponível.</p>'}<button class="btn block" onclick="openNotificationCenter()">Ver todas</button></div>`)
}
function hideNotificationDropdown(){const box=document.getElementById('notificationDropdown');if(box&&!box.dataset.hover)box.remove()}

function openNotificationCenter(){
  hideNotificationDropdown();const items=availableNotifications();modal(`<div class="modal-head"><h2>Central de notificações</h2><button class="icon-btn" onclick="closeModal()">✕</button></div><div class="notification-center">${items.map(n=>`<article><div><span class="pill ${n.kind==='assigned'?'amber':n.kind==='receipt'?'green':'blue'}">${esc(n.title)}</span><p>${esc(n.text)}</p><small>${esc(n.event.date||'')}</small></div>${n.kind==='assigned'?`<button class="btn" onclick="receiveAssignedEvent('${n.event.id}')">Receber andamento</button>`:n.kind==='general'?`<button class="btn secondary" onclick="markNotificationRead('${n.event.id}')">Dar como lido</button>`:'<span class="pill green">Recebido</span>'}</article>`).join('')||'<div class="empty">Nenhuma notificação disponível.</div>'}</div>`)
}

async function receiveAssignedEvent(id){
  const e=state.events.find(x=>x.id===id||x.dbId===id);if(!e)return;if(!e.receivedAt){e.receivedAt=new Date().toISOString();e.receivedBy=session.id||session.name;if(firebase&&e.dbId){try{await firebase.firestoreSdk.updateDoc(firebase.firestoreSdk.doc(firebase.db,'events',e.dbId),{receivedAt:firebase.firestoreSdk.serverTimestamp(),receivedBy:session.id,receivedByName:session.name})}catch(error){return toast('Não foi possível receber o andamento: '+error.message)}}save()}closeModal();openAssignedEvent(id)
}

async function markNotificationRead(eventId){
  state.notificationReads=state.notificationReads||[];if(!state.notificationReads.includes(eventId))state.notificationReads.push(eventId);
  if(firebase&&session?.id){try{const {doc,setDoc,serverTimestamp}=firebase.firestoreSdk;await setDoc(doc(firebase.db,'notificationReads',`${session.id}_${eventId}`),{userId:session.id,eventId,readAt:serverTimestamp()},{merge:true})}catch(error){return toast('Não foi possível marcar como lida: '+error.message)}}save();closeModal();toast('Notificação marcada como lida.');render()
}

accessView=function(){
  if(session.role!=='administrador')return head('Acesso restrito','Perfis de acesso','Somente administradores podem gerenciar perfis.')+'<div class="notice">Seu perfil não possui permissão para acessar este módulo.</div>';
  return head('Administração','Perfis de acesso','Crie usuários, altere dados, redefina senhas e enquadre cada pessoa no perfil correto.',`<button class="btn" onclick="userEditor()">+ Criar usuário</button>`)+`<section class="role-grid">${accessRoles.map(r=>`<article class="role-card"><span class="role-icon">${r[1][0]}</span><div><h3>${r[1]}</h3><p>${r[2]}</p></div></article>`).join('')}</section><section class="panel" style="margin-top:15px"><div class="panel-head"><h2>Usuários do sistema</h2><span class="pill blue">${state.users.length} usuário${state.users.length===1?'':'s'}</span></div><div class="table-wrap"><table><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th></th></tr></thead><tbody>${state.users.map(u=>`<tr><td><strong>${esc(u.fullName)}</strong></td><td>${esc(u.email)}</td><td><span class="pill blue">${roleLabel(u.role)}</span></td><td><span class="pill ${u.active?'green':'red'}">${u.active?'Ativo':'Inativo'}</span></td><td><button class="btn secondary" onclick="userEditor('${u.id}')">Editar</button></td></tr>`).join('')}</tbody></table></div></section>`
};

function userEditor(uid=''){
  const u=state.users.find(x=>x.id===uid)||{};modal(`<div class="modal-head"><h2>${uid?'Editar usuário':'Criar usuário'}</h2><button class="icon-btn" onclick="closeModal()">✕</button></div><form class="form-grid" onsubmit="manageAccessUser(event)"><input type="hidden" name="uid" value="${esc(uid)}"><div class="field"><label>Nome completo</label><input name="fullName" value="${esc(u.fullName||'')}" required></div><div class="field"><label>E-mail institucional</label><input name="email" type="email" value="${esc(u.email||'')}" required></div><div class="field"><label>${uid?'Nova senha':'Senha inicial'}</label><input name="password" type="password" minlength="6" ${uid?'placeholder="Deixe vazio para manter a senha"':'required'}><small>Mínimo de 6 caracteres.</small></div><div class="field"><label>Perfil de acesso</label><select name="role">${accessRoles.map(r=>`<option value="${r[0]}" ${u.role===r[0]?'selected':''}>${r[1]}</option>`).join('')}</select></div><div class="field span2"><label class="date-toggle"><input type="checkbox" name="active" ${u.active!==false?'checked':''}><span>Usuário ativo</span></label></div><div class="span2 actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn">${uid?'Salvar alterações':'Criar usuário'}</button></div></form>`)
}

async function manageAccessUser(ev){
  ev.preventDefault();const data=Object.fromEntries(new FormData(ev.target)),payload={uid:data.uid||undefined,fullName:data.fullName,email:data.email,password:data.password||undefined,role:data.role,active:data.active==='on'};
  if(firebase){try{const callable=firebase.functionsSdk.httpsCallable(firebase.functions,'manageUser'),result=await callable(payload),user={id:result.data.uid,...result.data},index=state.users.findIndex(u=>u.id===user.id);index>=0?state.users.splice(index,1,user):state.users.push(user)}catch(error){return toast('Erro ao salvar usuário: '+(error.message||error))}}
  else{const id=payload.uid||crypto.randomUUID(),user={id,fullName:payload.fullName,email:payload.email,role:payload.role,active:payload.active},index=state.users.findIndex(u=>u.id===id);index>=0?state.users.splice(index,1,user):state.users.push(user)}
  save();closeModal();toast(payload.uid?'Usuário atualizado com sucesso.':'Usuário criado com sucesso.');render()
}

function setupEditObjectButton(){
  if(view!=='detail'||!selected)return;
  const actions=document.querySelector('.page-head .actions'),newEvent=[...actions?.querySelectorAll('button')||[]].find(button=>button.textContent.includes('Novo andamento'));
  if(!actions||!newEvent||actions.querySelector('[data-edit-object]'))return;
  newEvent.insertAdjacentHTML('beforebegin',`<button class="btn secondary" data-edit-object onclick="editObjectModal('${selected}')">Editar objeto</button>${session.role==='administrador'?`<button class="btn danger" data-delete-object onclick="confirmDeleteObject('${selected}')">Excluir</button>`:''}`)
}

function editObjectModal(id){
  const o=state.objects.find(item=>item.id===id);if(!o)return toast('Objeto não encontrado.');
  const areas=['Gabinete do Secretário(a)','Assessoria de Comunicação','Assessoria Jurídica','Diretoria de Ensino','Diretoria de Apoio à Educação Básica','Diretoria de Logística','Diretoria de Planejamento Gestão e Finanças'],priorities=['Baixa','Média','Alta'],statuses=['À iniciar','Em execução'];
  modal(`<div class="modal-head"><h2>Editar objeto</h2><button class="icon-btn" onclick="closeModal()">✕</button></div><div class="notice">As alterações serão registradas na auditoria e não apagarão o histórico existente.</div><form class="form-grid" onsubmit="updateObject(event,'${o.id}')"><div class="field span2"><label>Título do objeto</label><input name="title" value="${esc(o.title)}" required></div><div class="field"><label>Área</label><select name="area">${areas.map(value=>`<option ${o.area===value?'selected':''}>${value}</option>`).join('')}</select></div><div class="field"><label>Responsável principal</label><input name="owner" value="${esc(o.owner)}" required></div><div class="field"><label>Status</label><select name="status">${statuses.map(value=>`<option ${o.status===value?'selected':''}>${value}</option>`).join('')}</select></div><div class="field"><label>Prioridade</label><select name="priority">${priorities.map(value=>`<option ${o.priority===value?'selected':''}>${value}</option>`).join('')}</select></div><div class="field"><label>Início previsto</label><input type="date" name="start" value="${esc(o.start||'')}" required></div><div class="field"><label>Término previsto</label><input type="date" name="due" value="${esc(o.due||'')}" required></div><div class="field"><label>Orçamento previsto</label><input type="number" name="budget" min="0" step="0.01" value="${Number(o.budget||0)}" required></div><div class="field"><label>Produto / Entrega</label><input name="product" value="${esc(o.product||'')}" required></div><div class="field span2"><label>Descrição detalhada</label><textarea name="description" rows="4" required>${esc(o.description||'')}</textarea></div><div class="span2 actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn">Salvar alterações</button></div></form>`)
}

async function updateObject(ev,id){
  ev.preventDefault();const o=state.objects.find(item=>item.id===id);if(!o)return;
  const f=Object.fromEntries(new FormData(ev.target)),before={title:o.title,area:o.area,owner:o.owner,status:o.status,priority:o.priority,start:o.start,due:o.due,budget:o.budget,product:o.product,description:o.description},changes={title:f.title,area:f.area,owner:f.owner,status:f.status,priority:f.priority,start:f.start,due:f.due,budget:+f.budget,product:f.product,description:f.description};
  if(firebase&&o.dbId){try{const {doc,collection,writeBatch,serverTimestamp}=firebase.firestoreSdk,batch=writeBatch(firebase.db),objectRef=doc(firebase.db,'objects',o.dbId),auditRef=doc(collection(firebase.db,'audit')),eventRef=doc(collection(firebase.db,'events'));batch.update(objectRef,{title:changes.title,area:changes.area,ownerName:changes.owner,status:changes.status,priority:changes.priority,plannedStart:changes.start,plannedEnd:changes.due,budget:changes.budget,product:changes.product,description:changes.description,updatedAt:serverTimestamp(),updatedBy:session.id});batch.set(eventRef,{objectId:o.dbId,objectCode:o.id,eventType:'Edição',description:'Dados principais do objeto atualizados',createdBy:session.id,createdByName:session.name,eventAt:serverTimestamp()});batch.set(auditRef,{userId:session.id,userName:session.name,action:'UPDATE',entity:'objects',recordId:o.dbId,oldData:before,newData:changes,createdAt:serverTimestamp()});await batch.commit()}catch(error){return toast('Erro ao atualizar objeto: '+error.message)}}
  Object.assign(o,changes);state.events.unshift({id:crypto.randomUUID(),objectId:o.id,date:new Date().toLocaleString('sv-SE').slice(0,16),type:'Edição',text:'Dados principais do objeto atualizados',user:session.name});save();closeModal();toast('Objeto atualizado com sucesso.');render()
}

function confirmDeleteObject(id){
  if(session.role!=='administrador')return toast('Somente o Administrador pode excluir objetos.');
  const o=state.objects.find(item=>item.id===id);if(!o)return toast('Objeto não encontrado.');
  modal(`<div class="delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="deleteObjectTitle"><div class="delete-symbol">!</div><h2 id="deleteObjectTitle">OBJETO SERÁ EXCLUÍDO - CONFIRMA EXCLUSÃO?</h2><p>${esc(o.id)} · ${esc(o.title)}</p><div class="delete-actions"><button type="button" class="btn secondary" onclick="closeModal()">Não</button><button type="button" class="btn danger" onclick="deleteObject('${o.id}')">Sim</button></div></div>`)
}

async function deleteObject(id){
  if(session.role!=='administrador')return toast('Somente o Administrador pode excluir objetos.');
  const index=state.objects.findIndex(item=>item.id===id),o=state.objects[index];if(index<0||!o)return toast('Objeto não encontrado.');
  if(firebase&&o.dbId){try{const {doc,collection,writeBatch,serverTimestamp}=firebase.firestoreSdk,batch=writeBatch(firebase.db),objectRef=doc(firebase.db,'objects',o.dbId),eventRef=doc(collection(firebase.db,'events')),auditRef=doc(collection(firebase.db,'audit'));batch.update(objectRef,{active:false,deletedAt:serverTimestamp(),deletedBy:session.id,updatedAt:serverTimestamp()});batch.set(eventRef,{objectId:o.dbId,objectCode:o.id,eventType:'Exclusão',description:'Objeto excluído pelo administrador',createdBy:session.id,createdByName:session.name,eventAt:serverTimestamp()});batch.set(auditRef,{userId:session.id,userName:session.name,action:'DELETE',entity:'objects',recordId:o.dbId,oldData:{code:o.id,title:o.title,active:true},newData:{active:false},createdAt:serverTimestamp()});await batch.commit()}catch(error){return toast('Erro ao excluir objeto: '+error.message)}}
  state.objects.splice(index,1);state.events.unshift({id:crypto.randomUUID(),objectId:o.id,date:new Date().toLocaleString('sv-SE').slice(0,16),type:'Exclusão',text:'Objeto excluído pelo administrador',user:session.name});save();closeModal();selected=null;view='objects';toast('Objeto excluído com sucesso.');render()
}

objectModal=function(){
  const primaryAreas=['Gabinete do Secretário(a)','Assessoria de Comunicação','Assessoria Jurídica','Diretoria de Ensino','Diretoria de Apoio à Educação Básica','Diretoria de Logística','Diretoria de Planejamento Gestão e Finanças'],secondaryAreas=['Educação Infantil','Educação Fundamental','DETIC','Inspeção','Núcleo de Avaliação','Transporte','Patrimônio','Infraestrutura','Recursos Humanos','Monitoramento de Contratos','Programas Federais','Planejamento','Arte e Cultura','Céu das Artes','CREI','CEMEA Boa Vista'];
  modal(`<div class="modal-head"><h2>Novo objeto</h2><button class="icon-btn" onclick="closeModal()">✕</button></div><div class="notice">Preencha os dados na sequência abaixo. A duração será calculada automaticamente.</div><form class="form-grid object-create-form" onsubmit="addObject(event)"><div class="field span2"><label>1. Título do Objeto</label><input name="title" required></div><div class="field span2"><label>2. Produto / Entrega</label><input name="product" required></div><div class="field"><label>3. Tipo</label><select name="objectType" required><option>Projeto</option><option>Processo</option><option>Programa</option><option>Contrato</option><option>Aquisição</option></select></div><div class="field"><label>4. Prioridade</label><select name="priority" required><option>Baixa</option><option selected>Média</option><option>Alta</option></select></div><div class="field span2"><label>5. Orçamento previsto (em R$)</label><div class="currency-input"><span>R$</span><input type="number" name="budget" min="0" step="0.01" value="0" required></div></div><div class="field"><label>6. Previsão de Início</label><input type="date" name="start" onchange="calculateObjectDuration(this.form)" required></div><div class="field"><label>7. Previsão de Término</label><input type="date" name="due" onchange="calculateObjectDuration(this.form)" required></div><div class="field span2"><label>8. Duração (em dias)</label><output class="object-duration" id="objectDuration" aria-live="polite"><strong>—</strong><span>Informe as datas de início e término</span></output><input type="hidden" name="duration"></div><div class="field"><label>9. Status</label><select name="status" required><option>À iniciar</option><option>Em execução</option></select></div><div class="field"><label>10. Tipo de intervenção</label><select name="interventionType" required><option>Construção</option><option>Reforma</option><option>Licitação</option><option>Modernização</option></select></div><div class="field span2"><label>11. Responsável Principal</label><input name="owner" required></div><div class="field span2"><label>12. Área Principal</label><select name="primaryArea" required>${primaryAreas.map(area=>`<option>${area}</option>`).join('')}</select></div><div class="field span2"><label>13. Área Secundária</label><select name="secondaryArea" required>${secondaryAreas.map(area=>`<option>${area}</option>`).join('')}</select></div><div class="field span2"><label>14. Observação</label><textarea name="observation" rows="4"></textarea></div><div class="span2 actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn">Cadastrar objeto</button></div></form>`)
};

const renderUnfilteredObjectModal=objectModal;
objectModal=function(){
  renderUnfilteredObjectModal();
  const form=document.querySelector('#modal .object-create-form'),primary=form?.elements.primaryArea;if(!primary)return;
  primary.addEventListener('change',()=>updateObjectSecondaryAreas(primary));
  updateObjectSecondaryAreas(primary)
};

function updateObjectSecondaryAreas(primarySelect){
  const all=['Educação Infantil','Educação Fundamental','DETIC','Inspeção','Núcleo de Avaliação','Arte e Cultura','CREI','CEMEA Boa Vista','CEU das Artes','Biblioteca','Infraestrutura','Recursos Humanos','Patrimônio','Transporte','Nutrição','Programas Federais','Monitoramento de Contratos','Planejamento'],byArea={
    'Diretoria de Ensino':['Educação Infantil','Educação Fundamental','DETIC','Inspeção','Núcleo de Avaliação'],
    'Diretoria de Apoio à Educação Básica':['Arte e Cultura','CREI','CEMEA Boa Vista','CEU das Artes','Biblioteca'],
    'Diretoria de Logística':['Infraestrutura','Recursos Humanos','Patrimônio','Transporte','Nutrição'],
    'Diretoria de Planejamento Gestão e Finanças':['Programas Federais','Monitoramento de Contratos','Planejamento']
  },secondary=primarySelect.form?.elements.secondaryArea,options=byArea[primarySelect.value]||all,current=secondary?.value;
  if(!secondary)return;secondary.innerHTML=options.map(area=>`<option value="${esc(area)}" ${current===area?'selected':''}>${esc(area)}</option>`).join('')
}

function calculateObjectDuration(form){
  const start=form?.elements.start,due=form?.elements.due,duration=form?.elements.duration,output=document.getElementById('objectDuration');if(!start||!due||!duration||!output)return null;
  if(!start.value||!due.value){duration.value='';due.setCustomValidity('');output.classList.remove('invalid');output.innerHTML='<strong>—</strong><span>Informe as datas de início e término</span>';return null}
  const days=Math.round((new Date(`${due.value}T12:00:00`)-new Date(`${start.value}T12:00:00`))/86400000);
  if(days<0){duration.value='';due.setCustomValidity('A previsão de término deve ser igual ou posterior à previsão de início.');output.classList.add('invalid');output.innerHTML='<strong>Data inválida</strong><span>O término deve ser posterior ao início</span>';return null}
  due.setCustomValidity('');duration.value=String(days);output.classList.remove('invalid');output.innerHTML=`<strong>${days} ${days===1?'dia':'dias'}</strong><span>Duração prevista</span>`;return days
}

addObject=async function(ev){
  ev.preventDefault();const form=ev.target,duration=calculateObjectDuration(form);if(duration===null){form.reportValidity();return}const f=Object.fromEntries(new FormData(form)),n=String(Math.max(0,...state.objects.map(o=>+o.id.split('-').pop()))+1).padStart(3,'0'),code=`OBJ-${new Date().getFullYear()}-${n}`,o={id:code,title:f.title,product:f.product,objectType:f.objectType,priority:f.priority,budget:+f.budget,start:f.start,due:f.due,duration:+f.duration,status:f.status,interventionType:f.interventionType,owner:f.owner,area:f.primaryArea,primaryArea:f.primaryArea,secondaryArea:f.secondaryArea,observation:f.observation||'',description:f.observation||'',progress:0,spent:0};
  if(firebase){try{const {collection,doc,writeBatch,serverTimestamp}=firebase.firestoreSdk,objectRef=doc(collection(firebase.db,'objects')),eventRef=doc(collection(firebase.db,'events')),auditRef=doc(collection(firebase.db,'audit')),batch=writeBatch(firebase.db),objectData={code,title:o.title,product:o.product,objectType:o.objectType,priority:o.priority,budget:o.budget,plannedStart:o.start,plannedEnd:o.due,duration:o.duration,status:o.status,interventionType:o.interventionType,ownerName:o.owner,area:o.area,primaryArea:o.primaryArea,secondaryArea:o.secondaryArea,observation:o.observation,description:o.description,progress:0,spent:0,active:true,createdBy:session.id,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};batch.set(objectRef,objectData);batch.set(eventRef,{objectId:objectRef.id,objectCode:code,eventType:'Criação',description:'Objeto cadastrado no sistema',createdBy:session.id,createdByName:session.name,eventAt:serverTimestamp()});batch.set(auditRef,{userId:session.id,userName:session.name,action:'CREATE',entity:'objects',recordId:objectRef.id,newData:objectData,createdAt:serverTimestamp()});await batch.commit();o.dbId=objectRef.id}catch(error){return toast('Erro ao cadastrar objeto: '+error.message)}}
  state.objects.unshift(o);state.events.unshift({id:crypto.randomUUID(),objectId:o.id,date:new Date().toLocaleString('sv-SE').slice(0,16),type:'Criação',text:'Objeto cadastrado no sistema',user:session.name});save();closeModal();toast('Objeto cadastrado com sucesso.');openObject(o.id)
};
