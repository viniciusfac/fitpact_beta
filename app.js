'use strict';
const SUPABASE_URL='https://ghscxbyziztrrotyizcx.supabase.co';
const PUBLIC_KEY='sb_publishable_joaqsHtk6EQQhpdaHMno4w_97x3T8lN';
const $=id=>document.getElementById(id), D=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const DEFAULT=[['🦵','Musculação — inferiores',true],['💪','Musculação — superiores',true],['🏃','Corrida de rua',true],['🏃‍♂️','Corrida na esteira',true],['🏓','Padel',true]];
let client,user,viewId,offset=0,activities=[],workouts=[],goals=[],friends=[],profiles=[],requests=[],loading=false,historyFilter='all',socialReactions=[],socialNudges=[],socialReady=false,recoveryMode=false,friendFilter="all",interactionFilter="all",friendMutes=[],friendEvents=[];
let weekTemplates=[],weekTemplateItems=[];
let interactionPageSize=10;
let libraryOpen={active:true,inactive:false};
let evolutionFilter='three';
let evolutionFriendId='';
let evolutionComparisonMonth=null;
let evolutionCalendarMonth=null;
const evolutionOpenPanels=new Set();
let noticeTimer;const notice=t=>{const el=$('notice');el.textContent=t;el.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{el.hidden=true},5000)};
const monday=o=>{let d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7+o*7);return d};
const dateStr=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const shift=(s,n)=>{let d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return dateStr(d)};
const currentWeek=()=>dateStr(monday(offset));
const mondayOf=s=>{let d=new Date(s+'T12:00:00');d.setDate(d.getDate()-(d.getDay()+6)%7);return dateStr(d)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=a=>a?`${a.emoji} ${a.name}`:'';
const fmtDate=s=>s?`${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`:'';
const isRecovery=w=>w.planned_name==='Recuperação';
const hasRecovery=day=>workouts.some(w=>w.user_id===user.id&&w.scheduled_date===day&&isRecovery(w));
const effectiveActivity=w=>w.status==='done'?(w.actual_name||w.planned_name):w.planned_name;
const normalizedActivityName=s=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
const activityUsed=a=>workouts.some(w=>w.user_id===user.id&&(w.activity_id===a.id||w.actual_activity_id===a.id||normalizedActivityName(w.planned_name)===normalizedActivityName(a.name)||normalizedActivityName(w.actual_name)===normalizedActivityName(a.name)));
const effectiveEmoji=w=>w.status==='done'?(w.actual_emoji||w.planned_emoji):w.planned_emoji;
const owned=()=>!!user;
async function call(p){let r=await p;if(r.error)throw r.error;return r.data}
async function run(fn){try{notice('Salvando...');await fn();await refresh();notice('Atualizado com sucesso.')}catch(e){notice('Erro: '+e.message)}}
async function init(){
  if(!window.supabase?.createClient){notice('Erro: biblioteca Supabase indisponível. Confirma a ligação à Internet e recarrega a página.');return}
  try {
    const parsed = new window.URL(SUPABASE_URL);
    if(parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) throw new Error('URL do projeto inválida: '+SUPABASE_URL);
    client=window.supabase.createClient(parsed.origin,PUBLIC_KEY);
  }
  catch(e){notice('Erro ao configurar Supabase: '+e.message);return}
  // Registrar antes de getSession: o SDK pode consumir o token e limpar o hash.
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'){recoveryMode=true;showPasswordRecovery();return}
    if(event==='SIGNED_OUT'){user=null;recoveryMode=false;$('app').classList.add('hide');$('auth').classList.remove('hide');notice('Sessão terminada.')}
    else if(event==='SIGNED_IN'&&!recoveryMode&&!isRecoveryLink()&&session?.user&&session.user.id!==user?.id){setTimeout(()=>signed(session.user),0)}
  });
  // Não bloquear indefinidamente o ecrã de entrada à espera da sessão.
  notice('A verificar sessão...');
  try {
    const {data,error}=await Promise.race([
      client.auth.getSession(),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('Tempo limite ao verificar sessão. Podes tentar entrar ou atualizar a página.')),10000))
    ]);
    if(error)throw error;
    if(data?.session?.user){if(recoveryMode||isRecoveryLink()){recoveryMode=true;showPasswordRecovery()}else await signed(data.session.user)}
    else notice('Pronto. Entra com a tua conta ou cria uma nova.');
  } catch(e){notice('Aviso: '+e.message)}

}
async function signed(u){if(recoveryMode)return;user=u;viewId=u.id;$('auth').classList.add('hide');$('app').classList.remove('hide');$('who').textContent=u.email;$('myid').textContent=u.id;await run(async()=>{const existing=await call(client.from('profiles').select('id').eq('id',u.id).maybeSingle());if(!existing)await call(client.from('profiles').insert({id:u.id,display_name:u.user_metadata?.display_name||u.email.split('@')[0]}));const own=await call(client.from('activities').select('id').eq('user_id',u.id).limit(1));if(!own.length)await call(client.from('activities').insert(DEFAULT.map(([emoji,name,counts_as_training])=>({user_id:u.id,emoji,name,counts_as_training}))))})}
async function refresh(){if(!user||loading)return;loading=true;try{const [f,p,a,g,w]=await Promise.all([call(client.from('friendships').select('*').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)),call(client.from('profiles').select('*')),call(client.from('activities').select('*').order('created_at')),call(client.from('weekly_goals').select('*')),call(client.from('workouts').select('*').order('scheduled_date').order('created_at'))]);friends=f;profiles=p;activities=a;goals=g;workouts=w;try{[weekTemplates,weekTemplateItems]=await Promise.all([call(client.from('week_templates').select('*').order('created_at',{ascending:false})),call(client.from('week_template_items').select('*').order('day_index'))])}catch(e){weekTemplates=[];weekTemplateItems=[];notice('Migração beta 1.8.0 necessária: '+e.message)}await loadSocial();try{[friendMutes,friendEvents]=await Promise.all([call(client.from('friend_incentive_prefs').select('*')),call(client.from('friendship_events').select('*').order('created_at',{ascending:false}).limit(100))])}catch(e){friendMutes=[];friendEvents=[];notice('Migração 1.7.1 necessária: '+e.message)}render()}catch(e){notice('Falha ao carregar: '+e.message)}finally{loading=false}}
function selectOptions(){const sel=$('historyViewer'),old=viewId;sel.replaceChildren();const ids=[user.id,...friends.filter(f=>f.status==='accepted').map(f=>f.requester_id===user.id?f.addressee_id:f.requester_id)];for(const id of ids){const p=profiles.find(p=>p.id===id),o=document.createElement('option');o.value=id;o.textContent=id===user.id?'Eu':(p?.display_name||p?.email||'Amigo');sel.append(o)}if(!ids.includes(old))viewId=user.id;sel.value=viewId;if(document.activeElement!==$('displayName'))$('displayName').value=profiles.find(p=>p.id===user.id)?.display_name||''}
function renderRequests(){
 const root=$('requests');root.replaceChildren();
 const heading=element('h3','','Gerenciar amigos e convites');root.append(heading);const received=friends.filter(f=>f.status==='pending'&&f.addressee_id===user.id);if(received.length){const banner=element('p','',received.length===1?'📨 Nova solicitação de amizade de '+friendName(received[0].requester_id):'📨 Novas solicitações de amizade de '+received.map(f=>friendName(f.requester_id)).join(', '));root.append(banner)}
 const ordered=[...friends].sort((a,b)=>({accepted:0,pending:1,inactive:2}[a.status]??3)-({accepted:0,pending:1,inactive:2}[b.status]??3));
 if(!ordered.length)root.append(element('p','small','Nenhum amigo ou convite registrado.'));
 for(const f of ordered){
  const other=f.requester_id===user.id?f.addressee_id:f.requester_id;
  const line=element('div','social-person'),title=element('div','line');
  const label=f.status==='accepted'?'🟢 Amigo':f.status==='pending'?(f.addressee_id===user.id?'📨 Solicitação de amizade de '+friendName(f.requester_id):'📤 Convite enviado'):f.status==='inactive'?'⚪ Amizade inativa':'Convite encerrado';
  title.append(element('strong','',friendName(other)),element('span','small',label));line.append(title);
  const buttons=element('div','line');
  if(f.status==='pending'&&f.addressee_id===user.id){buttons.append(socialButton('Aceitar',()=>run(()=>call(client.rpc('fitpact_respond_friend',{friendship_id:f.id,accept_it:true})))),socialButton('Recusar',()=>run(()=>call(client.rpc('fitpact_respond_friend',{friendship_id:f.id,accept_it:false})))))}
  if(f.status==='accepted'){
   const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=!friendMutes.some(m=>m.friend_id===other&&m.muted);
   const labelMute=element('label','small','Permitir incentivos deste amigo ');labelMute.append(toggle);
   toggle.onchange=()=>run(()=>call(client.from('friend_incentive_prefs').upsert({user_id:user.id,friend_id:other,muted:!toggle.checked},{onConflict:'user_id,friend_id'})));
   buttons.append(labelMute,socialButton('Remover amigo',()=>{if(confirm('Remover '+friendName(other)+'? Ambos perderão acesso às atividades um do outro. O histórico será preservado para eventual reativação.'))run(()=>call(client.rpc('fitpact_remove_friend',{friendship_id:f.id})))}));
  }
  if(f.status==='inactive')buttons.append(socialButton('Solicitar reativação',()=>run(()=>call(client.rpc('fitpact_request_friend',{other_id:other})))));
  line.append(buttons);root.append(line)
 }
}
function weeklyStats(week,personId=viewId){const rows=workouts.filter(w=>w.user_id===personId&&w.status==='done'&&w.completed_date>=week&&w.completed_date<shift(week,7));const trainingDays=new Set(rows.filter(w=>w.actual_counts_as_training).map(w=>w.completed_date)).size;const target=new Set(workouts.filter(w=>w.user_id===personId&&w.scheduled_date>=week&&w.scheduled_date<shift(week,7)&&w.planned_counts_as_training&&!w.extra_workout&&w.status!=='rescheduled').map(w=>w.scheduled_date)).size;return {trainingDays,activities:rows.length,target,rows}}
function indicator(s){return s.target>0&&s.trainingDays>=s.target?'🟢':s.trainingDays>0?'🟡':'🔴'}
function render(){selectOptions();renderRequests();const week=currentWeek(),s=weeklyStats(week,user.id);$('weekLabel').textContent=`${fmtDate(week)} a ${fmtDate(shift(week,6))}`;$('repeat').disabled=!owned()||week<dateStr(monday(0));$('resetWeek').disabled=!owned()||week<dateStr(monday(0));$('daysCount').textContent=s.trainingDays;$('activitiesCount').textContent=s.activities;$('goalCount').textContent=s.target;$('result').textContent=indicator(s);renderDays(week);renderTemplates();renderLibrary();renderHistory();renderConsistency();renderSocial();renderEvolution()}
function renderDays(week){const root=$('days');root.replaceChildren();for(let i=0;i<7;i++){const day=shift(week,i),block=document.createElement('div');block.className='day';const title=document.createElement('div');title.className='line';title.innerHTML=`<b>${D[i]} ${fmtDate(day)}</b>`;const rows=workouts.filter(w=>w.user_id===user.id&&w.scheduled_date===day);const rest=rows.some(isRecovery);if(owned()){if(!rest){const add=document.createElement('button');add.className='secondary';add.textContent='+ Exercício';add.onclick=()=>addWorkout(day);title.append(add)}if(!rows.length){const restBtn=document.createElement('button');restBtn.className='secondary';restBtn.textContent='🧘 Recuperação';restBtn.onclick=()=>addRecovery(day);title.append(restBtn)}}block.append(title);for(const w of rows){const line=document.createElement('div');line.className='entry';const desc=document.createElement('span');desc.className='grow';desc.textContent=`${effectiveEmoji(w)} ${effectiveActivity(w)}${w.with_pt?' · 👤 PT':''}`+(w.start_time?` · ${String(w.start_time).slice(0,5)}${w.end_time?'–'+String(w.end_time).slice(0,5):''}`:'')+` ${isRecovery(w)?'':({planned:'⏳',done:'✅',missed:'❌',rescheduled:'➡️'}[w.status])}`+(w.notes?` · 📝 ${w.notes}`:'');line.append(desc);if(w.status==='done'&&w.actual_name&&w.actual_name!==w.planned_name){const changed=document.createElement('button');changed.className='secondary';changed.textContent='🕘';changed.title='Ver atividade originalmente planejada';changed.setAttribute('aria-label','Ver atividade originalmente planejada');changed.onclick=()=>notice('Planejado originalmente: '+w.planned_emoji+' '+w.planned_name);line.append(changed)}if(owned()&&isRecovery(w)){const note=document.createElement('button');note.className='secondary';note.textContent='📝';note.title='Editar observação';note.setAttribute('aria-label',note.title);note.classList.add('icon-action');note.onclick=()=>editRecoveryNote(w);line.append(note);const remove=document.createElement('button');remove.className='secondary';remove.textContent='🗑';remove.title='Remover recuperação';remove.setAttribute('aria-label',remove.title);remove.classList.add('icon-action');remove.onclick=()=>removeWorkout(w);line.append(remove);const swap=document.createElement('button');swap.className='secondary';swap.textContent='🔄';swap.title='Substituir recuperação por treino extra';swap.setAttribute('aria-label',swap.title);swap.classList.add('icon-action');swap.onclick=()=>convertRecovery(w);line.append(swap)}else if(owned()){const actions=w.status==='rescheduled'?[['🗑',()=>removeWorkout(w)]]:[['✅',()=>complete(w)],['🔄',()=>complete(w,true)],['❌',()=>updateWorkout(w,{status:w.status==='missed'?'planned':'missed',completed_date:null,actual_activity_id:null,actual_name:null,actual_emoji:null,actual_counts_as_training:null})],['↪',()=>reschedule(w)],['✎',()=>editWorkout(w)],['🗑',()=>removeWorkout(w)]];for(const [label,action] of actions){const b=document.createElement('button');b.className='secondary';b.textContent=label;b.title=({'✅':'Concluir ou desfazer treino','🔄':'Substituir treino','❌':'Marcar como não cumprido','↪':'Reprogramar treino','✎':'Editar treino','🗑':'Excluir treino'}[label]||label);b.setAttribute('aria-label',b.title);b.classList.add('icon-action');b.onclick=action;line.append(b)}}block.append(line)}root.append(block)}}
async function editRecoveryNote(w){const value=prompt('Observação do dia de recuperação (até 500 caracteres):',w.notes||'');if(value===null)return;if(value.length>500)return notice('A observação deve ter até 500 caracteres.');await updateWorkout(w,{notes:value.trim()||null})}
async function convertRecovery(w){
 if(!isRecovery(w))return;
 const a=await chooseActivity(myActivities().filter(a=>a.counts_as_training),'Substituir recuperação por treino extra');
 if(!a)return;
 if(!confirm('Trocar a recuperação por '+a.name+'? Este dia contará como treino extra, sem aumentar a meta semanal.'))return;
 await run(()=>call(client.from('workouts').update({activity_id:a.id,planned_name:a.name,planned_emoji:a.emoji,planned_counts_as_training:true,extra_workout:true,status:'planned',actual_activity_id:null,actual_name:null,actual_emoji:null,actual_counts_as_training:null,completed_date:null,notes:null,with_pt:false,start_time:null,end_time:null,updated_at:new Date().toISOString()}).eq('id',w.id).eq('user_id',user.id)));
}
async function addRecovery(day){if(workouts.some(w=>w.user_id===user.id&&w.scheduled_date===day))return notice('Remova os exercícios desse dia antes de marcar recuperação.');await run(()=>call(client.from('workouts').insert({user_id:user.id,scheduled_date:day,planned_name:'Recuperação',planned_emoji:'🧘',planned_counts_as_training:false,status:'planned'})))}
function formWorkout(day,old=null){const list=old?[...myActivities(),...activities.filter(a=>a.user_id===user.id&&a.is_active===false&&a.id===old.activity_id)]:myActivities();return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='workout-dialog';dialog.innerHTML=`<form method="dialog"><h3>${old?'Editar':'Adicionar'} treino · ${esc(day)}</h3><label>Atividade<select id="w-activity"></select></label><label><input id="w-pt" type="checkbox"> 👤 Com Personal Trainer</label><div class="line"><label>Início (opcional)<input id="w-start" type="time"></label><label>Fim (opcional)<input id="w-end" type="time"></label></div><label>Observação (opcional)<input id="w-note" placeholder="Incluir observação" maxlength="500"></label><div class="line"><button value="cancel" class="secondary">Cancelar</button><button value="save">Salvar</button></div></form>`;document.body.append(dialog);const sel=dialog.querySelector('#w-activity');for(const a of list){const o=document.createElement('option');o.value=a.id;o.textContent=name(a);sel.append(o)}if(old){sel.value=old.activity_id||'';dialog.querySelector('#w-pt').checked=!!old.with_pt;dialog.querySelector('#w-start').value=old.start_time||'';dialog.querySelector('#w-end').value=old.end_time||'';dialog.querySelector('#w-note').value=old.notes||''}dialog.addEventListener('close',()=>{const a=list.find(x=>x.id===sel.value);const result=dialog.returnValue==='save'&&a?{a,with_pt:dialog.querySelector('#w-pt').checked,start_time:dialog.querySelector('#w-start').value||null,end_time:dialog.querySelector('#w-end').value||null,notes:dialog.querySelector('#w-note').value.trim()||null}:null;dialog.remove();resolve(result)},{once:true});dialog.showModal()})}
function myActivities(){return activities.filter(a=>a.user_id===user.id&&a.is_active!==false)}
async function addWorkout(day){if(hasRecovery(day))return notice('Remova a recuperação antes de adicionar um exercício.');if(!myActivities().length)return notice('Crie uma atividade primeiro.');const data=await formWorkout(day);if(!data)return;const {a,...extra}=data;await run(()=>call(client.from('workouts').insert({user_id:user.id,scheduled_date:day,activity_id:a.id,planned_name:a.name,planned_emoji:a.emoji,planned_counts_as_training:a.counts_as_training,status:'planned',...extra})))}
async function editWorkout(w){if(isRecovery(w))return;const data=await formWorkout(w.scheduled_date,w);if(!data)return;const {a,...extra}=data;const changed=a.id!==w.activity_id;await updateWorkout(w,{activity_id:a.id,planned_name:a.name,planned_emoji:a.emoji,planned_counts_as_training:a.counts_as_training,...extra,notes:changed?null:extra.notes})}
async function updateWorkout(w,patch){await run(()=>call(client.from('workouts').update({...patch,updated_at:new Date().toISOString()}).eq('id',w.id).eq('user_id',user.id)))}
async function complete(w,swap=false){if(!swap&&w.status==='done'){await updateWorkout(w,{status:'planned',completed_date:null,actual_activity_id:null,actual_name:null,actual_emoji:null,actual_counts_as_training:null});return}const before=weeklyStats(mondayOf(w.scheduled_date),user.id);let a=null;if(swap){const currentId=w.actual_activity_id||w.activity_id;const currentName=effectiveActivity(w);const alternatives=myActivities().filter(x=>x.id!==currentId&&normalizedActivityName(x.name)!==normalizedActivityName(currentName));if(!alternatives.length)return notice('Não há outra atividade disponível para substituição.');a=await chooseActivity(alternatives,'Exercício realizado');if(!a)return}else if(w.actual_name){a=myActivities().find(x=>x.id===w.actual_activity_id)||null}else{a=myActivities().find(x=>x.id===w.activity_id)||null}await updateWorkout(w,{status:'done',completed_date:w.scheduled_date,actual_activity_id:swap?a.id:(w.actual_activity_id||a?.id||null),actual_name:swap?a.name:(w.actual_name||a?.name||w.planned_name),actual_emoji:swap?a.emoji:(w.actual_emoji||a?.emoji||w.planned_emoji),actual_counts_as_training:swap?a.counts_as_training:(w.actual_counts_as_training??a?.counts_as_training??w.planned_counts_as_training),moved_to_date:null,notes:swap?null:w.notes});const after=weeklyStats(mondayOf(w.scheduled_date),user.id);if(after.target>0&&before.trainingDays<after.target&&after.trainingDays>=after.target)celebrateGoal(mondayOf(w.scheduled_date))}
function celebrateGoal(week){const key='fitpact-celebrated-v175-'+user.id+'-'+week;if(localStorage.getItem(key))return;localStorage.setItem(key,'1');const overlay=document.createElement('div');overlay.className='goal-celebration';overlay.setAttribute('role','status');overlay.innerHTML='<div class="goal-celebration-box"><div class="confetti">🎊 ✨ 🎉 ✨ 🎊</div><div style="font-size:56px">🏆</div><h2>Parabéns! Meta semanal atingida!</h2><p>Você cumpriu seu compromisso. Continue assim! 💪</p><button>Continuar</button></div>';document.body.append(overlay);const close=()=>overlay.remove();overlay.querySelector('button').onclick=close;setTimeout(close,6000)}
function chooseActivity(list,label){return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='workout-dialog';const form=document.createElement('form');form.method='dialog';const h=document.createElement('h3');h.textContent=label;const select=document.createElement('select');for(const a of list){const opt=document.createElement('option');opt.value=a.id;opt.textContent=name(a);select.append(opt)}const cancel=document.createElement('button');cancel.value='cancel';cancel.textContent='Cancelar';cancel.className='secondary';const ok=document.createElement('button');ok.value='save';ok.textContent='Confirmar';form.append(h,select,cancel,ok);dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>{const a=dialog.returnValue==='save'?list.find(x=>x.id===select.value):null;dialog.remove();resolve(a)},{once:true});dialog.showModal()})}
function chooseDate(defaultDate){return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='workout-dialog';dialog.innerHTML='<form method="dialog"><h3>Reprogramar exercício</h3><label>Nova data<input type="date" required></label><div class="line"><button value="cancel" class="secondary">Cancelar</button><button value="save">Confirmar</button></div></form>';document.body.append(dialog);const input=dialog.querySelector('input');input.value=defaultDate;dialog.addEventListener('close',()=>{const value=dialog.returnValue==='save'?input.value:null;dialog.remove();resolve(value)},{once:true});dialog.showModal()})}
async function reschedule(w){const newDate=await chooseDate(shift(w.scheduled_date,1));if(!newDate)return;if(!/^\d{4}-\d{2}-\d{2}$/.test(newDate)||dateStr(new Date(newDate+'T12:00:00'))!==newDate)return notice('Data inválida.');if(hasRecovery(newDate))return notice('Remova a recuperação do novo dia antes de reprogramar.');await run(async()=>{await call(client.from('workouts').insert({user_id:user.id,scheduled_date:newDate,activity_id:w.actual_activity_id||w.activity_id,planned_name:w.actual_name||w.planned_name,planned_emoji:w.actual_emoji||w.planned_emoji,planned_counts_as_training:w.actual_counts_as_training??w.planned_counts_as_training,extra_workout:!!w.extra_workout,status:'planned',with_pt:w.with_pt,start_time:w.start_time,end_time:w.end_time,notes:w.notes}));await call(client.from('workouts').update({status:'rescheduled',moved_to_date:newDate,completed_date:null,actual_activity_id:null,actual_name:null,actual_emoji:null,actual_counts_as_training:null}).eq('id',w.id).eq('user_id',user.id))})}
async function removeWorkout(w){if(confirm('Excluir este registro?'))await run(()=>call(client.from('workouts').delete().eq('id',w.id)))}
function renderLibrary(){
 const root=$('library');root.replaceChildren();
 const mine=activities.filter(x=>x.user_id===user.id);
 for(const [key,label,items] of [['active','Ativas',mine.filter(a=>a.is_active!==false)],['inactive','Inativas',mine.filter(a=>a.is_active===false)]]){
  const panel=element('details','evolution-panel activity-panel');panel.open=libraryOpen[key];
  panel.append(element('summary','',`${key==='active'?'🏃':'📦'} ${label} (${items.length})`));
  panel.addEventListener('toggle',()=>{libraryOpen[key]=panel.open});
  if(!items.length)panel.append(element('p','small','Nenhuma atividade nesta categoria.'));
  for(const a of items){
   const row=element('div','activity-row');
   const info=element('span','activity-name',name(a));info.title=a.description||a.name;row.append(info);
   const actions=element('div','activity-actions');
   const edit=iconAction('✎','Editar atividade',()=>editActivity(a));
   const toggle=iconAction(key==='active'?'📦':'↺',key==='active'?'Desativar atividade':'Reativar atividade',()=>run(()=>call(client.from('activities').update({is_active:key!=='active'}).eq('id',a.id).eq('user_id',user.id))));
   const remove=iconAction('🗑','Excluir definitivamente',()=>{if(activityUsed(a))return notice('Atividade vinculada a treino não pode ser excluída.');if(confirm('Excluir definitivamente '+a.name+'?'))run(()=>call(client.from('activities').delete().eq('id',a.id).eq('user_id',user.id)))});
   remove.disabled=activityUsed(a);actions.append(edit,toggle,remove);row.append(actions);panel.append(row);
  }
  root.append(panel);
 }
 for(const id of ['emoji','activityName','counts','addActivity'])$(id).disabled=!owned();
}
function iconAction(symbol,title,handler){const b=element('button','secondary icon-action',symbol);b.type='button';b.title=title;b.setAttribute('aria-label',title);b.onclick=handler;return b}
async function editActivity(a){
 const dialog=document.createElement('dialog');dialog.className='workout-dialog';
 dialog.innerHTML='<form method="dialog"><h3>Editar atividade</h3><label>Ícone<input id="a-emoji" maxlength="8" required></label><label>Nome<input id="a-name" maxlength="100" required></label><label>Descrição<textarea id="a-description" maxlength="500" rows="3" placeholder="Descrição da atividade"></textarea></label><label><input id="a-counts" type="checkbox"> Conta como treino</label><label><input id="a-active" type="checkbox"> Atividade ativa</label><div class="line"><button type="button" id="cancel-activity" class="secondary">Cancelar</button><button value="save">Salvar</button></div></form>';
 document.body.append(dialog);dialog.querySelector('#a-emoji').value=a.emoji||'';dialog.querySelector('#a-name').value=a.name||'';dialog.querySelector('#a-description').value=a.description||'';dialog.querySelector('#a-counts').checked=!!a.counts_as_training;dialog.querySelector('#a-active').checked=a.is_active!==false;
 dialog.querySelector('#cancel-activity').addEventListener('click',()=>dialog.close('cancel'));
 dialog.addEventListener('close',()=>{if(dialog.returnValue==='save'){
  const emoji=dialog.querySelector('#a-emoji').value.trim(),activityName=dialog.querySelector('#a-name').value.trim(),description=dialog.querySelector('#a-description').value.trim()||null,is_active=dialog.querySelector('#a-active').checked,counts_as_training=dialog.querySelector('#a-counts').checked;
  if(!emoji||!activityName){notice('Preencha nome e ícone.');dialog.remove();return}
  if(activities.some(x=>x.user_id===user.id&&x.id!==a.id&&normalizedActivityName(x.name)===normalizedActivityName(activityName))){notice('Já existe uma atividade com esse nome.');dialog.remove();return}
  run(()=>call(client.from('activities').update({emoji,name:activityName,description,is_active,counts_as_training}).eq('id',a.id).eq('user_id',user.id)))
 }dialog.remove()},{once:true});dialog.showModal()
}

function monthsAgo(date,months){const d=new Date(date+'T12:00:00'),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()-months);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return dateStr(d)}
function historyRange(){const today=dateStr(new Date()),weekStart=dateStr(monday(0));switch(historyFilter){case 'week':return [shift(weekStart,-7),shift(weekStart,-1)];case 'month':return [shift(today,-29),today];case 'six':return [monthsAgo(today,6),today];case 'year':return [monthsAgo(today,12),today];case 'custom':return [$('historyStart').value||'0001-01-01',$('historyEnd').value||'9999-12-31'];default:return ['0001-01-01','9999-12-31']}}

// 1.8.0: modelos privados e consistência calculada. Publicação com ressalva de testes sociais.
function templateWeekRows(wk){return workouts.filter(w=>w.user_id===user.id&&w.scheduled_date>=wk&&w.scheduled_date<shift(wk,7))}
function templateItems(t){return weekTemplateItems.filter(x=>x.template_id===t.id).sort((a,b)=>a.day_index-b.day_index)}
function renderTemplates(){
 const root=$('templateList');if(!root)return;const count=$('templateCount');if(count)count.textContent=`(${weekTemplates.length})`;root.replaceChildren();
 if(!weekTemplates.length)root.append(element('p','small','Nenhum modelo guardado.'));
 for(const t of weekTemplates){const wrap=element('div','social-person'),line=element('div','line');line.append(element('strong','grow',t.name),element('span','small',`${templateItems(t).length} itens`));wrap.append(line);
 const buttons=element('div','line');for(const [label,action] of [['Aplicar',()=>applyTemplate(t)],['Editar nome',()=>renameTemplate(t)],['Duplicar',()=>duplicateTemplate(t)],['Excluir',()=>deleteTemplate(t)]])buttons.append(socialButton(label,action));wrap.append(buttons);root.append(wrap)
 }
}
async function saveTemplateFromWeek(){const wk=currentWeek(),rows=templateWeekRows(wk);if(!rows.length)return notice('A semana não tem atividades para guardar.');const name=(prompt('Nome do modelo semanal:')||'').trim();if(!name)return;if(weekTemplates.some(t=>normalizedActivityName(t.name)===normalizedActivityName(name)))return notice('Já existe um modelo com esse nome.');await run(async()=>{const t=await call(client.from('week_templates').insert({user_id:user.id,name}).select('id').single());try{await call(client.from('week_template_items').insert(rows.map(w=>({template_id:t.id,day_index:Math.round((new Date(w.scheduled_date+'T12:00:00')-new Date(wk+'T12:00:00'))/86400000),activity_id:isRecovery(w)?null:(w.actual_activity_id||w.activity_id),planned_name:effectiveActivity(w),planned_emoji:effectiveEmoji(w),planned_counts_as_training:isRecovery(w)?false:(w.actual_counts_as_training??w.planned_counts_as_training),with_pt:!!w.with_pt,start_time:w.start_time,end_time:w.end_time,notes:w.notes||null,is_recovery:isRecovery(w)}))))}catch(e){await call(client.from('week_templates').delete().eq('id',t.id));throw e}})}
async function renameTemplate(t){const name=(prompt('Novo nome do modelo:',t.name)||'').trim();if(!name||name===t.name)return;if(weekTemplates.some(x=>x.id!==t.id&&normalizedActivityName(x.name)===normalizedActivityName(name)))return notice('Nome já utilizado.');await run(()=>call(client.from('week_templates').update({name}).eq('id',t.id).eq('user_id',user.id)))}
async function duplicateTemplate(t){const name=(prompt('Nome da cópia:',t.name+' (cópia)')||'').trim();if(!name)return;if(weekTemplates.some(x=>normalizedActivityName(x.name)===normalizedActivityName(name)))return notice('Nome já utilizado.');await run(async()=>{const newT=await call(client.from('week_templates').insert({user_id:user.id,name}).select('id').single());try{const rows=templateItems(t).map(({id,template_id,...x})=>({...x,template_id:newT.id}));if(rows.length)await call(client.from('week_template_items').insert(rows))}catch(e){await call(client.from('week_templates').delete().eq('id',newT.id));throw e}})}
async function deleteTemplate(t){if(!confirm('Excluir o modelo '+t.name+'? As semanas já planejadas serão preservadas.'))return;await run(()=>call(client.from('week_templates').delete().eq('id',t.id).eq('user_id',user.id)))}
async function applyTemplate(t){const wk=currentWeek();if(wk<dateStr(monday(0)))return notice('Modelos só podem ser aplicados na semana atual ou futura.');const items=templateItems(t);if(!items.length)return notice('Este modelo está vazio.');const choice=prompt('Aplicar '+t.name+' na semana '+fmtDate(wk)+'?\nDigite A para ADICIONAR sem duplicar, ou S para SUBSTITUIR o planejamento:','A');if(choice===null)return;const mode=choice.trim().toUpperCase();if(!['A','S'].includes(mode))return notice('Opção inválida. Use A ou S.');const existing=templateWeekRows(wk);if(mode==='S'&&existing.some(w=>w.status!=='planned'))return notice('Não é permitido substituir uma semana com atividades executadas ou reprogramadas.');if(!confirm(mode==='S'?'SUBSTITUIR os '+existing.length+' registros planejados desta semana?':'ADICIONAR os itens que ainda não existam nesta semana?'))return;
 const act=activities.filter(a=>a.user_id===user.id);let planned;try{planned=items.map(x=>{const a=act.find(a=>a.id===x.activity_id);if(!x.is_recovery&&(!a||a.is_active===false))throw Error('Atividade inativa ou indisponível no modelo: '+x.planned_name);return {user_id:user.id,scheduled_date:shift(wk,x.day_index),activity_id:x.is_recovery?null:a.id,planned_name:x.is_recovery?'Recuperação':a.name,planned_emoji:x.is_recovery?'🧘':a.emoji,planned_counts_as_training:x.is_recovery?false:a.counts_as_training,with_pt:!!x.with_pt,start_time:x.start_time,end_time:x.end_time,notes:x.notes,status:'planned'}})}catch(e){return notice('Erro: '+e.message)}
 try{await run(async()=>{await call(client.rpc('fitpact_apply_week_template',{p_week:wk,p_mode:mode,p_rows:planned}))})}catch(e){notice('Erro: '+e.message)}
}
function consistencyStats(personId){const todayWeek=dateStr(monday(0)),weekSet=new Set(workouts.filter(w=>w.user_id===personId&&w.scheduled_date<=shift(todayWeek,6)).map(w=>mondayOf(w.scheduled_date)));const weeks=[...weekSet].filter(w=>w<=todayWeek).sort();let current=0,record=0,runLength=0;const ended=weeks.filter(w=>w<todayWeek);for(const w of ended){const s=weeklyStats(w,personId);if(s.target===0)continue;if(s.trainingDays>=s.target){runLength++;record=Math.max(record,runLength)}else runLength=0}current=runLength;const now=weeklyStats(todayWeek,personId);if(now.target>0&&now.trainingDays>=now.target){current++;record=Math.max(record,current)}return {current,record}}
function renderConsistency(){const root=$('consistencyStats');if(!root)return;const s=consistencyStats(viewId);root.textContent=`🔥 Sequência atual: ${s.current} semana(s) · 🏆 Recorde: ${s.record} semana(s)`}


// 1.9.0-beta.1 — Painel de evolução: somente leitura dos dados existentes.
function evolutionRange(){
 const today=dateStr(new Date());
 switch(evolutionFilter){
  case 'one':return [monthsAgo(today,1),today];
  case 'three':return [monthsAgo(today,3),today];
  case 'six':return [monthsAgo(today,6),today];
  case 'year':return [monthsAgo(today,12),today];
  case 'custom':return [$('evolutionStart').value||today,$('evolutionEnd').value||today];
  default:return [monthsAgo(today,3),today];
 }
}
function evolutionData(start,end){
 const today=dateStr(new Date()),last=end<today?end:today;
 if(start>last)return {weeks:[],days:0,activities:0,hits:0,eligible:0,fulfilled:0,planned:0};
 const mine=workouts.filter(w=>w.user_id===user.id);
 const done=mine.filter(w=>w.status==='done'&&w.completed_date&&w.completed_date>=start&&w.completed_date<=last);
 const days=new Set(done.filter(w=>w.actual_counts_as_training).map(w=>w.completed_date)).size;
 const weeks=[];let hits=0,eligible=0,fulfilled=0,planned=0;
 for(let wk=mondayOf(start),i=0;wk<=last&&i<60;wk=shift(wk,7),i++){
  const from=wk<start?start:wk,to=shift(wk,6)>last?last:shift(wk,6);
  const scheduled=new Set(mine.filter(w=>w.scheduled_date>=from&&w.scheduled_date<=to&&w.planned_counts_as_training&&!w.extra_workout&&w.status!=='rescheduled').map(w=>w.scheduled_date));
  const actual=new Set(done.filter(w=>w.actual_counts_as_training&&w.completed_date>=from&&w.completed_date<=to).map(w=>w.completed_date));
  const goal=scheduled.size,real=actual.size;
  const full=from===wk&&to===shift(wk,6);
  // Taxa: semanas sem meta são neutras; semanas parciais usam apenas dias abrangidos.
  if(goal){eligible++;planned+=goal;fulfilled+=Math.min(goal,real);if(full&&real>=goal)hits++}
  weeks.push({week:wk,from,to,goal,real,full});
 }
 return {weeks,days,activities:done.length,hits,eligible,fulfilled,planned};
}
// 1.10.0-beta.1: resumo de evolução de amigos aceitos, somente leitura.
// Dados consultados sob as políticas RLS existentes; nenhum acesso de escrita é criado.
function renderFriendEvolution(root,start,end){
 const panel=evolutionPanel('friends','👥 Evolução dos amigos');
 const accepted=[...new Set(friends.filter(f=>f.status==='accepted').map(f=>f.requester_id===user.id?f.addressee_id:f.requester_id))].filter(id=>id!==user.id);
 if(!accepted.length){panel.append(element('p','small','Nenhum amigo aceito para acompanhar.'));root.append(panel);return}
 if(!accepted.includes(evolutionFriendId))evolutionFriendId=accepted[0];
 const line=element('div','line');
 const label=element('label','small','Amigo');label.htmlFor='evolutionFriendSelect';
 const select=document.createElement('select');select.id='evolutionFriendSelect';select.setAttribute('aria-label','Selecionar amigo para acompanhar evolução');
 for(const id of accepted){const opt=document.createElement('option');opt.value=id;opt.textContent=friendName(id);select.append(opt)}
 select.value=evolutionFriendId;
 select.onchange=()=>{evolutionFriendId=select.value;renderEvolution()};
 line.append(label,select);panel.append(line);
 const id=evolutionFriendId, today=dateStr(new Date()),last=end<today?end:today;
 const done=workouts.filter(w=>w.user_id===id&&w.status==='done'&&w.completed_date&&w.completed_date>=start&&w.completed_date<=last);
 const days=new Set(done.filter(w=>w.actual_counts_as_training).map(w=>w.completed_date)).size;
 let hits=0,planned=0,fulfilled=0,weekCount=0;
 if(start<=last)for(let wk=mondayOf(start),i=0;wk<=last&&i<60;wk=shift(wk,7),i++){
  const from=wk<start?start:wk,to=shift(wk,6)>last?last:shift(wk,6);
  const scheduled=new Set(workouts.filter(w=>w.user_id===id&&w.scheduled_date>=from&&w.scheduled_date<=to&&w.planned_counts_as_training&&!w.extra_workout&&w.status!=='rescheduled').map(w=>w.scheduled_date));
  const actual=new Set(done.filter(w=>w.actual_counts_as_training&&w.completed_date>=from&&w.completed_date<=to).map(w=>w.completed_date));
  const goal=scheduled.size,real=actual.size;
  if(goal){weekCount++;planned+=goal;fulfilled+=Math.min(goal,real);if(from===wk&&to===shift(wk,6)&&real>=goal)hits++}
 }
 const stats=element('div','evolution-stats');
 for(const [value,title] of [[days,'Dias treinados'],[done.length,'Atividades concluídas'],[hits,'Semanas com meta atingida'],[planned?Math.round(100*fulfilled/planned)+'%':'—','Cumprimento da meta']]){
  const card=element('div','evolution-stat');card.append(element('strong','',String(value)),element('span','small',title));stats.append(card)
 }
 panel.append(stats,element('p','small',`Período: ${fmtDate(start)} a ${fmtDate(end)}. Semanas sem meta são neutras. Dados disponibilizados pelas permissões de amizade existentes.`));
 root.append(panel);
}
function renderEvolution(){
 const root=$('evolutionContent');if(!root||!user)return;
 // Preservar os painéis abertos durante atualizações dos treinos e filtros.
 for(const panel of root.querySelectorAll('details[data-evolution-panel]')){
  if(panel.open)evolutionOpenPanels.add(panel.dataset.evolutionPanel);
  else evolutionOpenPanels.delete(panel.dataset.evolutionPanel);
 }
 const [start,end]=evolutionRange();root.replaceChildren();
 if(start>end){root.append(element('p','small','A data inicial não pode ser posterior à data final.'));return}
 const data=evolutionData(start,end),pct=data.planned?Math.round(100*data.fulfilled/data.planned):null;
 const stats=element('div','evolution-stats');
 const streakStats=consistencyStats(user.id);
 for(const [value,label] of [[data.days,'Dias treinados'],[data.activities,'Atividades concluídas'],[data.hits,'Semanas com meta atingida'],[pct===null?'—':pct+'%','Cumprimento da meta'],[streakStats.current,'🔥 Sequência atual (semanas)'],[streakStats.record,'🏆 Recorde pessoal (semanas)']]){
  const card=element('div','evolution-stat');card.append(element('strong','',String(value)),element('span','small',label));stats.append(card)
 }
 root.append(stats);
 renderFriendEvolution(root,start,end);
 const note=element('p','small',`Período: ${fmtDate(start)} a ${fmtDate(end)} · Apenas resultados até hoje. Metas semanais parciais consideram os dias dentro do filtro.`);root.append(note);
 const details=evolutionPanel('weekly','📊 Dias treinados × meta semanal');

 if(!data.weeks.length){details.append(element('p','small','Nenhum período disponível para apresentar.'));root.append(details);renderEvolutionCalendar(root,start,end);renderEvolutionDistribution(root,start,end);renderEvolutionMonthly(root,start,end);return}
 const chart=element('div','evolution-chart');chart.setAttribute('role','list');
 for(const w of data.weeks){
  const item=element('div','evolution-week');item.setAttribute('role','listitem');
  const header=element('div','evolution-week-title',`${fmtDate(w.from)}–${fmtDate(w.to)}${!w.full?' · parcial':''}`);
  const bars=element('div','evolution-bars');
  const max=Math.max(1,w.goal,w.real);
  for(const [count,cls,label] of [[w.goal,'goal','Meta'],[w.real,'done','Realizado']]){
   const line=element('div','evolution-bar-line');
   const labelEl=element('span','',label);
   const track=element('div','evolution-track');const fill=element('div','evolution-fill '+cls);fill.style.width=(count/max*100)+'%';track.append(fill);
   line.append(labelEl,track,element('b','',String(count)));bars.append(line)
  }
  const status=w.goal===0?'Sem meta':w.real>=w.goal?'Meta atingida':w.to===dateStr(new Date())?'Em andamento':'Abaixo da meta';
  item.append(header,bars,element('div','small',status));chart.append(item)
 }
 details.append(chart);root.append(details);
 renderEvolutionCalendar(root,start,end);
 renderEvolutionDistribution(root,start,end);
 renderEvolutionMonthly(root,start,end);
}


// FP-48/49: painéis independentes, recolhidos por padrão e sem consultas adicionais.
function evolutionPanel(id,title){
 const details=element('details','evolution-panel');
 details.dataset.evolutionPanel=id;
 details.open=evolutionOpenPanels.has(id);
 details.append(element('summary','',title));
 details.addEventListener('toggle',()=>{if(details.open)evolutionOpenPanels.add(id);else evolutionOpenPanels.delete(id)});
 return details;
}
function evolutionMonthStart(date){return date.slice(0,7)+'-01'}
function evolutionMonthShift(date,n){
 const d=new Date(date.slice(0,7)+'-01T12:00:00');
 d.setMonth(d.getMonth()+n);
 return dateStr(d);
}
function renderEvolutionCalendar(root,start,end){
 const panel=evolutionPanel('calendar','🗓️ Calendário de consistência');
 const today=dateStr(new Date()),limit=end<today?end:today;
 const earliest=evolutionMonthStart(start),latest=evolutionMonthStart(limit);
 if(start>limit){panel.append(element('p','small','Não há dias decorridos neste período.'));root.append(panel);return}
 if(!evolutionCalendarMonth||evolutionCalendarMonth<earliest||evolutionCalendarMonth>latest)evolutionCalendarMonth=latest;
 const month=evolutionCalendarMonth;
 const controls=element('div','line evolution-calendar-controls');
 const previous=element('button','secondary','◀'),next=element('button','secondary','▶');
 previous.type=next.type='button';
 previous.disabled=month<=earliest;next.disabled=month>=latest;
 const monthLabel=element('strong','',new Date(month+'T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}));
 previous.onclick=()=>{evolutionCalendarMonth=evolutionMonthShift(month,-1);renderEvolution()};
 next.onclick=()=>{evolutionCalendarMonth=evolutionMonthShift(month,1);renderEvolution()};
 controls.append(previous,monthLabel,next);panel.append(controls);
 const legend=element('p','small','● Verde: treino concluído · Cinza: sem treino · Dias futuros: indisponíveis');
 panel.append(legend);
 const grid=element('div','evolution-calendar');
 for(const d of ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'])grid.append(element('span','evolution-calendar-weekday',d));
 const first=new Date(month+'T12:00:00'),offset=(first.getDay()+6)%7;
 for(let i=0;i<offset;i++)grid.append(element('span','evolution-calendar-blank',''));
 const daysInMonth=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
 const mine=workouts.filter(w=>w.user_id===user.id&&w.status==='done'&&w.actual_counts_as_training&&w.completed_date);
 const details=element('div','evolution-day-details small','Toque num dia para consultar os treinos.');
 for(let day=1;day<=daysInMonth;day++){
  const date=month.slice(0,7)+'-'+String(day).padStart(2,'0');
  const eligible=date>=start&&date<=limit;
  const entries=eligible?mine.filter(w=>w.completed_date===date):[];
  const btn=element('button','evolution-calendar-day'+(entries.length?' trained':'')+(!eligible?' unavailable':''),String(day));
  btn.type='button';btn.disabled=!eligible;
  btn.setAttribute('aria-label',`${fmtDate(date)}: ${entries.length} treino(s) concluído(s)`);
  btn.onclick=()=>{
   details.replaceChildren(element('strong','',fmtDate(date)));
   if(!entries.length)details.append(element('p','small','Nenhum treino concluído neste dia.'));
   else {
    const list=element('ul','');
    for(const w of entries)list.append(element('li','',`${effectiveEmoji(w)||'🏃'} ${effectiveActivity(w)||'Atividade'}`));
    details.append(list);
   }
  };
  grid.append(btn);
 }
 panel.append(grid,details);root.append(panel);
}
function renderEvolutionDistribution(root,start,end){
 const panel=evolutionPanel('distribution','🥧 Distribuição por atividade');
 const today=dateStr(new Date()),limit=end<today?end:today;
 const done=workouts.filter(w=>w.user_id===user.id&&w.status==='done'&&w.completed_date&&w.completed_date>=start&&w.completed_date<=limit&&w.actual_counts_as_training);
 const counts=new Map();
 for(const w of done){
  // O nome realizado tem prioridade sobre o planejado, preservando o histórico.
  const label=String(effectiveActivity(w)||'Atividade sem nome').trim();
  const key=normalizedActivityName(label);
  const item=counts.get(key)||{label,emoji:effectiveEmoji(w)||'🏃',count:0};
  item.count++;counts.set(key,item);
 }
 const items=[...counts.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'pt-BR'));
 if(!items.length){panel.append(element('p','small','Nenhum treino concluído no período selecionado.'));root.append(panel);return}
 panel.append(element('p','small',`${done.length} treino(s) concluído(s) no período. Recuperação não conta como treino.`));
 const list=element('div','evolution-distribution');
 for(const item of items){
  const percent=100*item.count/done.length;
  const row=element('div','evolution-distribution-item');
  const heading=element('div','evolution-distribution-heading');
  heading.append(element('span','',`${item.emoji} ${item.label}`),element('strong','',`${item.count} · ${percent.toFixed(1).replace('.',',')}%`));
  const track=element('div','evolution-track');
  const fill=element('div','evolution-fill done');fill.style.width=percent+'%';track.append(fill);
  row.append(heading,track);list.append(row);
 }
 panel.append(list);root.append(panel);
}

// FP-50: compara períodos equivalentes de dois meses consecutivos, sem criar dados.
function evolutionMonthBounds(month,days){
 const first=month.slice(0,7)+'-01';
 const lastDay=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
 return [first,month.slice(0,7)+'-'+String(Math.min(days,lastDay)).padStart(2,'0')];
}
function evolutionMonthlyStats(from,to){
 const mine=workouts.filter(w=>w.user_id===user.id);
 const completed=mine.filter(w=>w.status==='done'&&w.completed_date&&w.completed_date>=from&&w.completed_date<=to);
 const trained=completed.filter(w=>w.actual_counts_as_training);
 const days=new Set(trained.map(w=>w.completed_date)).size;
 let planned=0,fulfilled=0;
 // Mesmo critério da evolução: metas semanais parciais restritas aos dias comparados.
 for(let week=mondayOf(from),i=0;week<=to&&i<6;week=shift(week,7),i++){
  const begin=week<from?from:week,finish=shift(week,6)>to?to:shift(week,6);
  const scheduled=new Set(mine.filter(w=>w.scheduled_date>=begin&&w.scheduled_date<=finish&&w.planned_counts_as_training&&!w.extra_workout&&w.status!=='rescheduled').map(w=>w.scheduled_date));
  const actual=new Set(trained.filter(w=>w.completed_date>=begin&&w.completed_date<=finish).map(w=>w.completed_date));
  if(scheduled.size){planned+=scheduled.size;fulfilled+=Math.min(scheduled.size,actual.size)}
 }
 return {days,activities:completed.length,planned,fulfilled,pct:planned?Math.round(100*fulfilled/planned):null};
}
function renderEvolutionMonthly(root,start,end){
 const panel=evolutionPanel('monthly','📈 Comparação mensal');
 const today=dateStr(new Date()),last=end<today?end:today;
 if(start>last){panel.append(element('p','small','Não há resultados neste período.'));root.append(panel);return}
 // A seleção de meses respeita o filtro Evolução. O mês anterior é apenas referência.
 const months=[];
 for(let m=evolutionMonthStart(start),i=0;m<=evolutionMonthStart(last)&&i<14;m=evolutionMonthShift(m,1),i++)months.push(m);
 if(!months.includes(evolutionComparisonMonth))evolutionComparisonMonth=months[months.length-1];
 const controls=element('div','line evolution-month-controls');
 const label=element('label','small','Mês analisado');label.setAttribute('for','evolutionComparisonMonth');
 const select=element('select','');select.id='evolutionComparisonMonth';
 const monthLabel=date=>new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 for(const m of months){const option=element('option','',monthLabel(m));option.value=m;option.selected=m===evolutionComparisonMonth;select.append(option)}
 select.onchange=()=>{evolutionComparisonMonth=select.value;renderEvolution()};
 controls.append(label,select);panel.append(controls);
 panel.append(element('p','small',`${months.length} mês(es) disponível(is) no filtro. Escolha o mês para consultar sua comparação com o anterior.`));
 const currentMonth=evolutionComparisonMonth,previousMonth=evolutionMonthShift(currentMonth,-1);
 const monthLast=evolutionMonthShift(currentMonth,1);
 const from=currentMonth<start?start:currentMonth;
 const to=(shift(monthLast,-1)>last?last:shift(monthLast,-1));
 if(from>to){panel.append(element('p','small','Não há dias para comparar neste mês.'));root.append(panel);return}
 // Mesma faixa de dias, respeitando meses mais curtos (ex.: fevereiro).
 const firstDay=Number(from.slice(8,10)),lastDay=Number(to.slice(8,10));
 const priorDays=new Date(Number(previousMonth.slice(0,4)),Number(previousMonth.slice(5,7)),0).getDate();
 const prevFrom=previousMonth.slice(0,7)+'-'+String(Math.min(firstDay,priorDays)).padStart(2,'0');
 const prevTo=previousMonth.slice(0,7)+'-'+String(Math.min(lastDay,priorDays)).padStart(2,'0');
 const now=evolutionMonthlyStats(from,to),before=evolutionMonthlyStats(prevFrom,prevTo);
 panel.append(element('p','small',`Período selecionado: ${fmtDate(from)} a ${fmtDate(to)}. Referência: ${fmtDate(prevFrom)} a ${fmtDate(prevTo)} (mês anterior, mesmo que fora do filtro).`));
 const table=element('div','evolution-monthly');
 const heading=element('div','evolution-monthly-row evolution-monthly-header');
 for(const title of ['Indicador',monthLabel(previousMonth),monthLabel(currentMonth),'Diferença'])heading.append(element('span','',title));
 table.append(heading);
 function add(label,previous,current,kind){
  const row=element('div','evolution-monthly-row');let difference='—';
  if(previous!==null&&current!==null){const delta=current-previous;difference=(delta>0?'+':'')+String(delta)+(kind==='pct'?' p.p.':'')}
  for(const value of [label,previous===null?'—':String(previous)+(kind==='pct'?'%':''),current===null?'—':String(current)+(kind==='pct'?'%':''),difference])row.append(element('span','',value));
  table.append(row);
 }
 add('Dias treinados',before.days,now.days,'count');
 add('Atividades concluídas',before.activities,now.activities,'count');
 add('Cumprimento da meta',before.pct,now.pct,'pct');
 panel.append(table);
 panel.append(element('p','small','Sem meta: — (não equivale a 0%). Diferenças de cumprimento em pontos percentuais. A comparação usa o mês escolhido dentro do filtro e o mês anterior como referência.'));
 root.append(panel);
}

function renderHistory(){const root=$('history');root.replaceChildren();$('historyDetails').textContent='';const [start,end]=historyRange();if(start>end){root.textContent='A data inicial não pode ser posterior à data final.';return}const relevant=workouts.filter(w=>w.user_id===viewId&&((w.status==='done'&&w.completed_date?w.completed_date:w.scheduled_date)>=start&&(w.status==='done'&&w.completed_date?w.completed_date:w.scheduled_date)<=end));const weeks=[...new Set(relevant.map(w=>mondayOf(w.status==='done'&&w.completed_date?w.completed_date:w.scheduled_date)))].sort().reverse();let hits=0,totalDays=0,totalActs=0;for(const wk of weeks){const all=weeklyStats(wk,viewId);const inRange=relevant.filter(w=>w.status==='done'&&w.completed_date>=wk&&w.completed_date<shift(wk,7));const days=new Set(inRange.filter(w=>w.actual_counts_as_training).map(w=>w.completed_date)).size;totalDays+=days;totalActs+=inRange.length;if(all.target>0&&all.trainingDays>=all.target)hits++;const b=document.createElement('button');b.className='secondary';b.textContent=`${indicator(all)} ${fmtDate(wk)} a ${fmtDate(shift(wk,6))} · ${days}/${all.target} dias · ${inRange.length} atividades`;b.onclick=()=>{$('historyDetails').textContent=`Semana ${fmtDate(wk)} a ${fmtDate(shift(wk,6))}\nMeta de dias: ${all.target} | Atividades concluídas: ${inRange.length} | Dias concluídos: ${days}\n\n`+relevant.filter(w=>{const d=w.status==='done'&&w.completed_date?w.completed_date:w.scheduled_date;return d>=wk&&d<shift(wk,7)}).sort((a,b)=>a.scheduled_date.localeCompare(b.scheduled_date)).map(w=>`${fmtDate(w.scheduled_date)}: ${effectiveEmoji(w)} ${effectiveActivity(w)} ${w.status==='done'?'✅':w.status==='missed'?'❌':w.status==='rescheduled'?'➡️':'⏳'}${w.status==='done'&&w.actual_name!==w.planned_name?' (substituiu '+w.planned_name+')':''}${w.completed_date?' (concluído em '+fmtDate(w.completed_date)+')':''}`).join('\n')};root.append(b)}$('historyStats').textContent=`${weeks.length} semanas registradas · ${hits} metas atingidas · ${totalActs} atividades concluídas · ${totalDays} dias concluídos`;if(!weeks.length)root.textContent='Nenhuma atividade encontrada neste período.'}
function summary(){
  const wk=currentWeek(),s=weeklyStats(wk,user.id);
  const rows=workouts.filter(w=>w.user_id===user.id&&w.scheduled_date>=wk&&w.scheduled_date<shift(wk,7));
  const legend=new Map();let hasPT=false;
  const statusIcon=w=>w.status==='done'?'✅':w.status==='missed'?'❌':w.status==='rescheduled'?'➡️':'';
  const lines=Array.from({length:7},(_,i)=>{
    const date=shift(wk,i),dayRows=rows.filter(w=>w.scheduled_date===date);
    const icons=dayRows.map(w=>{
      const emoji=effectiveEmoji(w)||'🏋️',activity=effectiveActivity(w)||'Atividade';
      if(!legend.has(emoji+'|'+activity))legend.set(emoji+'|'+activity,`${emoji} ${activity}`);
      if(w.with_pt)hasPT=true;
      return emoji+(w.with_pt?'👤':'')+statusIcon(w);
    });
    const notes=dayRows.filter(w=>w.notes).map(w=>'📝 '+w.notes.trim());return D[i]+': '+(icons.join(' ')||'—')+(notes.length?' | '+notes.join(' | '):'');
  });
  const trophies='🏆'.repeat(Math.min(s.trainingDays,s.target));
  const medals='🥇'.repeat(Math.max(0,s.trainingDays-s.target));
  const completed=trophies+medals||'0';
  const history=[...new Set(workouts.filter(w=>w.user_id===user.id&&w.scheduled_date<shift(wk,7)).map(w=>mondayOf(w.scheduled_date)))].filter(week=>week<wk||(week===wk&&new Date().getDay()===0&&wk===dateStr(monday(0)))).sort().slice(-25).map(week=>indicator(weeklyStats(week,user.id))).join('');
  const legendLines=[...legend.values()];if(hasPT)legendLines.push('👤 Treino com personal trainer');
  return `🏆 FITPACT — ${profiles.find(p=>p.id===user.id)?.display_name||'Usuário'}\n📅 ${fmtDate(wk)} a ${fmtDate(shift(wk,6))}\n\n🎯 Meta de dias: ${s.target}\n✅ Atividades concluídas: ${s.activities}\n🏆 Dias concluídos: ${completed}\n📊 Histórico: ${history||'—'}\n\n${lines.join('\n')}\n\n📖 Legenda\n${legendLines.join('\n')||'Nenhuma atividade planejada'}${s.trainingDays>s.target?'\n🥇 Dia concluído acima da meta':''}`;
}

// FitPact Social: dados visíveis apenas entre amigos aceitos, com políticas RLS no banco.
async function loadSocial(){
 try{
  const [r,n]=await Promise.all([call(client.from('social_reactions').select('*').order('created_at',{ascending:false}).limit(500)),call(client.from('social_nudges').select('*').order('created_at',{ascending:false}).limit(200))]);
  socialReactions=r;socialNudges=n;socialReady=true;
 }catch(e){socialReady=false;socialReactions=[];socialNudges=[];if(document.querySelector('[data-tab="friends"]')?.classList.contains('active'))notice('FitPact Social: execute migration_v1_7_0.sql no Supabase. '+e.message)}
}
function friendIds(){return [...new Set(friends.filter(f=>f.status==='accepted').map(f=>f.requester_id===user.id?f.addressee_id:f.requester_id))]}
function friendName(id){const p=profiles.find(p=>p.id===id);return p?.display_name?.trim()||p?.email||'Amigo'}
function element(tag,cls,content){const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e}
function socialButton(label,fn){const b=element('button','secondary',label);b.onclick=fn;return b}
function socialWeekStats(id){const wk=dateStr(monday(0));return weeklyStats(wk,id)}
function socialDate(value){if(!value)return 'Data não registrada';return new Date(value).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function renderSocial(){
 const opt=$('allowNudges');if(opt)opt.checked=profiles.find(p=>p.id===user.id)?.social_nudges_enabled!==false;
 const root=$('socialFeed'),inbox=$('socialInbox'),count=$('socialNotificationCount');if(!root||!user)return;
 root.replaceChildren();inbox.replaceChildren();
 const ids=friendIds(),filter=$('socialFriendFilter'),old=friendFilter;
 filter.replaceChildren();const all=element('option','','Todos os amigos');all.value='all';filter.append(all);
 for(const id of ids){const o=element('option','',friendName(id));o.value=id;filter.append(o)}
 if(old!=='all'&&!ids.includes(old))friendFilter='all';filter.value=friendFilter;
 if(!socialReady){root.append(element('p','small','Execute a migração SQL do FitPact Social no Supabase.'));count.textContent='';return}
 const visible=ids.filter(id=>friendFilter==='all'||id===friendFilter),wk=dateStr(monday(0)),today=dateStr(new Date());
 if(!ids.length)root.append(element('p','small','Nenhum amigo vinculado. Convide alguém em Configurações.'));
 for(const id of visible){
  const card=element('div','social-person'),stats=socialWeekStats(id),title=element('div','line');
  title.append(element('strong','',friendName(id)),element('span','small',`Meta: ${stats.target} · Dias concluídos: ${stats.trainingDays}`));card.append(title);
  const achievements=workouts.filter(w=>w.user_id===id&&w.status==='done'&&w.completed_date>=shift(today,-6)&&w.completed_date<=today).sort((a,b)=>String(b.completed_date).localeCompare(String(a.completed_date))).slice(0,5);
  if(stats.target>0&&stats.trainingDays>=stats.target){const line=element('div','line');line.append(element('span','grow','🏆 Meta semanal alcançada!'));appendReactions(line,id,'week',wk);card.append(line)}
  for(const w of achievements){const line=element('div','line');line.append(element('span','grow',`${fmtDate(w.completed_date)} · ${effectiveEmoji(w)} ${effectiveActivity(w)} ✅`));appendReactions(line,id,'workout',w.id);card.append(line)}
  if(!achievements.length&&!(stats.target>0&&stats.trainingDays>=stats.target))card.append(element('p','small','Sem treinos concluídos nos últimos 7 dias.'));
  const nudgeLine=element('div','line'),nudge=element('select','grow');for(const [val,txt] of [['encourage','💪 Bora treinar!'],['checkin','🤝 Está tudo bem?'],['playful','👀 Sumiu da academia?'],['together','🏃 Vamos treinar juntos?']]){const o=element('option','',txt);o.value=val;nudge.append(o)}
  nudgeLine.append(nudge,socialButton('Enviar incentivo',()=>sendNudge(id,nudge.value)));card.append(nudgeLine);root.append(card)
 }
 // Pending requests are actionable directly from the Friends tab, regardless of notification history.
 const pendingRequests=friends.filter(f=>f.status==='pending'&&f.addressee_id===user.id);
 if(pendingRequests.length){const requestBox=element('div','social-person');requestBox.append(element('h3','','📨 Solicitações de amizade'));
  for(const pending of pendingRequests){const line=element('div','line');line.append(element('strong','grow',friendName(pending.requester_id)),
   socialButton('Aceitar',()=>run(()=>call(client.rpc('fitpact_respond_friend',{friendship_id:pending.id,accept_it:true})))),
   socialButton('Recusar',()=>run(()=>call(client.rpc('fitpact_respond_friend',{friendship_id:pending.id,accept_it:false})))));requestBox.append(line)}
  inbox.append(requestBox)
 }
 const interactions=[];
 for(const r of socialReactions){const incoming=r.recipient_id===user.id,other=incoming?r.sender_id:r.recipient_id;if(!visible.includes(other))continue;interactions.push({date:r.created_at,direction:incoming?'received':'sent',other,text:`${r.emoji} ${incoming?'Reação recebida':'Você reagiu'} · ${r.target_type==='week'?'meta semanal':'treino'}`})}
 const kinds={encourage:'💪 Bora treinar!',checkin:'🤝 Está tudo bem?',playful:'👀 Sumiu da academia?',together:'🏃 Vamos treinar juntos?'};
 for(const n of socialNudges){const incoming=n.recipient_id===user.id,other=incoming?n.sender_id:n.recipient_id;if(!visible.includes(other))continue;
  interactions.push({date:n.created_at,direction:incoming?'received':'sent',other,text:(incoming?'Incentivo recebido: ':'Incentivo enviado: ')+(kinds[n.kind]||'Incentivo'),nudge:incoming&&!n.reply?n:null});
  if(n.reply)interactions.push({date:n.replied_at||n.created_at,direction:incoming?'sent':'received',other,text:(incoming?'Sua resposta: ':'Resposta recebida: ')+n.reply})
 }
 for(const ev of friendEvents){if(ev.recipient_id!==user.id||!ev.actor_id)continue;interactions.push({date:ev.created_at,direction:'received',other:ev.actor_id,text:'🔔 '+(ev.event_type==='removed'?'Esta pessoa removeu você da lista de amigos.':ev.event_type==='requested'?'Nova solicitação de amizade de '+friendName(ev.actor_id)+'.':'Solicitação de amizade atualizada por '+friendName(ev.actor_id)+'.'),event:true})}
 interactions.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const unread=socialNudges.filter(n=>n.recipient_id===user.id&&!n.seen_at).length+friendEvents.filter(e=>e.recipient_id===user.id&&!e.seen_at).length;
 count.textContent=unread?`🔔 ${unread} interação(ões) não lida(s)`:'';
 const filteredInteractions=interactions.filter(x=>interactionFilter==='all'||x.direction===interactionFilter);const shown=filteredInteractions.slice(0,interactionPageSize);
 if(!shown.length)inbox.append(element('p','small','Nenhuma interação para este filtro.'));
 for(const x of shown){const item=element('div','social-person');item.append(element('strong','',friendName(x.other)),element('p','',x.text),element('span','small',socialDate(x.date)+' · '+(x.direction==='sent'?'Enviada':'Recebida')));
  if(x.nudge){const n=x.nudge,sel=element('select','grow');for(const v of ['','🏃 Já estou indo!','📅 Vou amanhã','😅 Semana corrida','🤝 Vamos juntos?']){const o=element('option','',v||'Responder...');o.value=v;sel.append(o)}const line=element('div','line');line.append(sel,socialButton('Responder',()=>{if(sel.value)run(()=>call(client.from('social_nudges').update({reply:sel.value,replied_at:new Date().toISOString(),seen_at:new Date().toISOString()}).eq('id',n.id).eq('recipient_id',user.id)))}));item.append(line);
   if(!n.seen_at)item.append(socialButton('Marcar como lida',()=>run(()=>call(client.from('social_nudges').update({seen_at:new Date().toISOString()}).eq('id',n.id).eq('recipient_id',user.id)))))
  }
  if(x.event){
   const ev=friendEvents.find(e=>e.actor_id===x.other&&e.created_at===x.date);
   // Only show invitation actions for an invitation that is STILL pending for this user.
   // Old notification events remain visible, but must not allow duplicate responses.
   const pending=ev?.event_type==='requested'?friends.find(f=>f.status==='pending'&&f.requester_id===ev.actor_id&&f.addressee_id===user.id):null;
   if(pending){const actions=element('div','line');actions.append(
    socialButton('Aceitar',()=>run(()=>call(client.rpc('fitpact_respond_friend',{friendship_id:pending.id,accept_it:true})))),
    socialButton('Recusar',()=>run(()=>call(client.rpc('fitpact_respond_friend',{friendship_id:pending.id,accept_it:false})))));
    item.append(actions)
   }
   if(ev&&!ev.seen_at)item.append(socialButton('Marcar como lida',()=>run(()=>call(client.from('friendship_events').update({seen_at:new Date().toISOString()}).eq('id',ev.id).eq('recipient_id',user.id)))))
  }
  inbox.append(item)
 }
 if(filteredInteractions.length>shown.length){const more=socialButton(`Carregar mais 10 (${filteredInteractions.length-shown.length} restantes)`,()=>{interactionPageSize+=10;renderSocial()});more.classList.add('secondary');inbox.append(more)}
}
function appendReactions(line,recipient,kind,ref){
 const options=[['👏','Boa!'],['🔥','Mandou bem!'],['💪','Força!'],['🏆','Parabéns!']];const own=socialReactions.find(r=>r.sender_id===user.id&&r.recipient_id===recipient&&r.target_type===kind&&r.target_ref===ref);
 const select=element('select','');for(const [emoji,label] of options){const opt=element('option','',emoji+' '+label);opt.value=emoji;select.append(opt)}if(own)select.value=own.emoji;
 const send=socialButton(own?'Alterar reação':'Reagir',()=>sendReaction(recipient,kind,ref,select.value));line.append(select,send)
}
async function sendReaction(recipient,kind,ref,emoji){if(!friendIds().includes(recipient))return notice('Apenas amigos podem receber reações.');await run(()=>call(client.from('social_reactions').upsert({sender_id:user.id,recipient_id:recipient,target_type:kind,target_ref:ref,emoji},{onConflict:'sender_id,recipient_id,target_type,target_ref'})))}
async function sendNudge(recipient,kind){if(!friendIds().includes(recipient))return notice('Apenas amigos podem receber incentivos.');const since=Date.now()-86400000;if(socialNudges.some(n=>n.sender_id===user.id&&n.recipient_id===recipient&&Date.parse(n.created_at)>since))return notice('Você já enviou um incentivo a esse amigo nas últimas 24 horas.');await run(()=>call(client.from('social_nudges').insert({sender_id:user.id,recipient_id:recipient,kind}))) }

function setAuthMode(mode){const signup=mode==='signup';$('authHeading').textContent=signup?'Criar minha conta':'Entrar na sua conta';$('authDescription').textContent=signup?'Ainda não tem cadastro? Informe seu e-mail e crie uma senha de pelo menos 6 caracteres. Confirme a conta pelo e-mail.':'Informe o e-mail e a senha cadastrados.';$('signup').classList.toggle('hide',!signup);$('login').classList.toggle('hide',signup);$('forgotPassword').classList.toggle('hide',signup);$('authLoginTab').classList.toggle('selected',!signup);$('authSignupTab').classList.toggle('selected',signup);$('authLoginTab').classList.toggle('secondary',signup);$('authSignupTab').classList.toggle('secondary',!signup);$('password').autocomplete=signup?'new-password':'current-password'}
$('authLoginTab').onclick=()=>setAuthMode('login');$('authSignupTab').onclick=()=>setAuthMode('signup');
$('login').onclick=()=>run(async()=>{if(!client?.auth)throw new Error('Ligação ao Supabase indisponível. Recarrega a página.');const {error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error});
$('signup').onclick=async()=>{try{if(!client?.auth)throw new Error('Ligação ao Supabase indisponível. Recarrega a página.');const {error}=await client.auth.signUp({email:$('email').value.trim(),password:$('password').value,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;notice('Conta criada. Verifique o email para confirmar a conta.')}catch(e){notice(e.message)}};
function isRecoveryLink(){return new URLSearchParams(location.hash.slice(1)).get('type')==='recovery'||new URLSearchParams(location.search).get('type')==='recovery'}
function showPasswordRecovery(){
  $('auth').classList.add('hide');$('app').classList.add('hide');$('passwordRecovery').classList.remove('hide');
  notice('Defina sua nova senha para concluir a recuperação.');
}
$('forgotPassword').onclick=async()=>{
  const email=$('email').value.trim();
  if(!email)return notice('Informe seu e-mail para receber o link de recuperação.');
  if(!client?.auth)return notice('Conexão indisponível. Atualize a página.');
  try{const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;notice('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha. Verifique também o spam.')}catch(e){notice('Não foi possível solicitar a recuperação: '+e.message)}
};
$('saveNewPassword').onclick=async()=>{
  const password=$('newPassword').value,confirmation=$('confirmPassword').value;
  if(password.length<6)return notice('A nova senha deve ter pelo menos 6 caracteres.');
  if(password!==confirmation)return notice('As senhas não coincidem.');
  if(!client?.auth)return notice('Conexão indisponível. Atualize a página.');
  try{const {data,error}=await client.auth.getSession();if(error)throw error;if(!data.session)throw Error('Link expirado ou inválido. Solicite outro link de recuperação.');const result=await client.auth.updateUser({password});if(result.error)throw result.error;$('newPassword').value='';$('confirmPassword').value='';history.replaceState(null,'',location.pathname);recoveryMode=false;$('passwordRecovery').classList.add('hide');notice('Senha alterada com sucesso.');await signed(result.data.user||data.session.user)}catch(e){notice('Não foi possível alterar a senha: '+e.message)}
};
$('cancelRecovery').onclick=()=>{recoveryMode=false;history.replaceState(null,'',location.pathname);$('passwordRecovery').classList.add('hide');$('auth').classList.remove('hide')};
const historicalCard=$('tab-history').querySelector('section');if(historicalCard){$('evolutionHistoryBody').append(historicalCard);historicalCard.classList.remove('card')}
$('logout').onclick=()=>client.auth.signOut();document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{const tab=b.dataset.tab;for(const id of ['plan','history','activities','friends','settings','evolution'])$('tab-'+id).classList.toggle('hide',id!==tab);$('tab-share').classList.toggle('hide',tab!=='plan');document.querySelectorAll('[data-tab]').forEach(x=>{x.classList.toggle('active',x.dataset.tab===tab);x.classList.toggle('secondary',x.dataset.tab!==tab)})});$('socialFriendFilter').onchange=()=>{friendFilter=$('socialFriendFilter').value;interactionPageSize=10;renderSocial()};$('interactionFilter').onchange=()=>{interactionFilter=$('interactionFilter').value;interactionPageSize=10;renderSocial()};$('evolutionFilter').onchange=()=>{evolutionComparisonMonth=null;evolutionFilter=$('evolutionFilter').value;for(const id of ['evolutionStart','evolutionEnd'])$(id).classList.toggle('hide',evolutionFilter!=='custom');renderEvolution()};for(const id of ['evolutionStart','evolutionEnd'])$(id).onchange=()=>{evolutionComparisonMonth=null;renderEvolution()};$('historyFilter').onchange=()=>{historyFilter=$('historyFilter').value;for(const id of ['historyStart','historyEnd'])$(id).classList.toggle('hide',historyFilter!=='custom');renderHistory()};for(const id of ['historyStart','historyEnd'])$(id).onchange=renderHistory;$('prev').onclick=()=>{offset--;render()};$('next').onclick=()=>{offset++;render()};$('historyViewer').onchange=()=>{viewId=$('historyViewer').value;render()};

$('saveWeekTemplate').onclick=saveTemplateFromWeek;
$('resetWeek').onclick=async()=>{const wk=currentWeek();if(!owned()||wk<dateStr(monday(0)))return notice('Semanas anteriores não podem ser reiniciadas.');const rows=workouts.filter(w=>w.user_id===user.id&&w.scheduled_date>=wk&&w.scheduled_date<shift(wk,7));if(!rows.length)return notice('Esta semana não tem registros para reiniciar.');if(!confirm('Reiniciar a semana de '+fmtDate(wk)+'? Isso excluirá permanentemente '+rows.length+' registro(s) desta semana, incluindo resultados. Esta ação não pode ser desfeita.'))return;await run(()=>call(client.from('workouts').delete().eq('user_id',user.id).gte('scheduled_date',wk).lt('scheduled_date',shift(wk,7))))};
$('repeat').onclick=()=>run(async()=>{if(currentWeek()<dateStr(monday(0)))throw Error('Não é permitido repetir semanas anteriores.');const prev=shift(currentWeek(),-7),rows=workouts.filter(w=>w.user_id===user.id&&w.scheduled_date>=prev&&w.scheduled_date<shift(prev,7));if(!rows.length)throw Error('A semana anterior não tem atividades.');if(rows.some(w=>isRecovery(w)&&workouts.some(x=>x.user_id===user.id&&x.scheduled_date===shift(w.scheduled_date,7))))throw Error('Remova as atividades do dia de recuperação antes de repetir.');if(!confirm('Adicionar programação da semana anterior nesta semana?'))return;await call(client.from('workouts').insert(rows.map(w=>({user_id:user.id,scheduled_date:shift(w.scheduled_date,7),activity_id:w.actual_activity_id||w.activity_id,planned_name:w.actual_name||w.planned_name,planned_emoji:w.actual_emoji||w.planned_emoji,planned_counts_as_training:w.actual_counts_as_training??w.planned_counts_as_training,extra_workout:!!w.extra_workout,status:'planned',with_pt:w.with_pt,start_time:w.start_time,end_time:w.end_time,notes:w.notes}))))});
$('addActivity').onclick=()=>{const name=$('activityName').value.trim(),emoji=$('emoji').value.trim()||'🏋️';if(!name)return notice('Escreva o nome da atividade.');if(myActivities().some(a=>normalizedActivityName(a.name)===normalizedActivityName(name)))return notice('Já existe uma atividade com esse nome.');run(async()=>{const latest=await call(client.from('activities').select('id,name').eq('user_id',user.id));if(latest.some(a=>normalizedActivityName(a.name)===normalizedActivityName(name)))throw Error('Já existe uma atividade com esse nome.');await call(client.from('activities').insert({user_id:user.id,name,emoji,counts_as_training:$('counts').checked}));$('activityName').value=''})};
$('allowNudges').onchange=()=>run(()=>call(client.from('profiles').update({social_nudges_enabled:$('allowNudges').checked}).eq('id',user.id)));
$('saveName').onclick=()=>run(()=>call(client.from('profiles').update({display_name:$('displayName').value.trim()}).eq('id',user.id)));
$('copyid').onclick=()=>navigator.clipboard.writeText(user.id).then(()=>notice('Código copiado.')).catch(()=>notice('Não foi possível copiar.'));
$('invite').onclick=()=>{const id=$('friendId').value.trim();if(!/^[0-9a-f-]{36}$/i.test(id)||id===user.id)return notice('Insira o código UUID do amigo.');run(()=>call(client.rpc('fitpact_request_friend',{other_id:id})))};
const INVITE_URL=location.origin+location.pathname;
function inviteMessage(){const sender=profiles.find(p=>p.id===user.id)?.display_name||'Um amigo';return `🏆 Convite para o FitPact!\n\n${sender} convidou você para acompanhar seus treinos e manter a motivação em dia.\n\nNo FitPact você pode montar seu Plano Semanal, marcar os treinos concluídos, acompanhar metas e compartilhar resultados com amigos.\n\n📲 Acesse: ${INVITE_URL}?amigo=${encodeURIComponent(user.id)}\n👥 Meu código de amigo: ${user.id}\n\nCrie sua conta, entre em Configurações e envie o convite de amizade. 💪`}
$('shareInvite').onclick=async()=>{const message=inviteMessage();if(navigator.share){try{await navigator.share({title:'Convite FitPact',text:message});return}catch(e){if(e.name==='AbortError')return}}try{await navigator.clipboard.writeText(message);notice('Convite copiado! Compartilhe com seus amigos.')}catch(e){window.open('https://wa.me/?text='+encodeURIComponent(message),'_blank','noopener')}};
$('copyInvite').onclick=()=>navigator.clipboard.writeText(inviteMessage()).then(()=>notice('Convite copiado.')).catch(()=>notice('Não foi possível copiar o convite.'));
const invitedBy=new URLSearchParams(location.search).get('amigo')||sessionStorage.getItem('fitpact_invite');if(invitedBy)sessionStorage.setItem('fitpact_invite',invitedBy);if(invitedBy&&/^[0-9a-f-]{36}$/i.test(invitedBy)){$('friendId').value=invitedBy;$('inviteHint').textContent='Código do convite preenchido. Entre na sua conta e clique em Convidar para enviar a solicitação.'}
$('share').onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent(summary()),'_blank','noopener');$('copy').onclick=()=>navigator.clipboard.writeText(summary()).then(()=>notice('Resumo copiado.')).catch(()=>notice('Falha ao copiar.'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)refresh()});setInterval(()=>{if(user&&!document.hidden)refresh()},30000);init().catch(e=>notice("Erro ao iniciar Supabase: "+e.message));
