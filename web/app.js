const API = location.origin.replace(/\/$/, '');
const tokenKey = 'tg_token';

function getToken() { return localStorage.getItem(tokenKey); }
function setToken(t) { localStorage.setItem(tokenKey, t); }
function clearToken() { localStorage.removeItem(tokenKey); }
function authHeaders() { const t = getToken(); return t ? { 'Authorization': 'Bearer ' + t } : {}; }

// Router
const routes = Array.from(document.querySelectorAll('.route'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const logoutBtn = document.getElementById('logoutBtn');

function showRoute(hash) {
  const name = (hash || '#home').replace('#', '') || 'home';
  routes.forEach(r => r.classList.add('hidden'));
  document.getElementById(name)?.classList.remove('hidden');
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + name));
  const authed = !!getToken();
  document.querySelectorAll('.protected').forEach(el => el.classList.toggle('hidden', !authed));
  logoutBtn.classList.toggle('hidden', !authed);
}
window.addEventListener('hashchange', () => showRoute(location.hash));
showRoute(location.hash);

// Toast
const toast = document.getElementById('toast');
function showToast(msg, ok=true) {
  toast.textContent = msg;
  toast.style.borderColor = ok ? 'rgba(34,197,94,.35)' : 'rgba(239,68,68,.35)';
  toast.classList.remove('hidden');
  setTimeout(()=> toast.classList.add('hidden'), 2200);
}

// Auth
logoutBtn.addEventListener('click', () => { clearToken(); showToast('Logged out'); showRoute('#home'); });

document.getElementById('loginForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const r = await fetch(API + '/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password}) });
  if (r.ok) { const j = await r.json(); setToken(j.access_token); showToast('Logged in'); location.hash = '#tasks'; showRoute('#tasks'); await refreshTasks(); } else { showToast('Login failed', false); }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const r = await fetch(API + '/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password}) });
  if (r.ok) { showToast('Registered'); location.hash = '#login'; showRoute('#login'); } else { showToast('Registration failed', false); }
});

// Tasks
const parseAddBtn = document.getElementById('parseAddBtn');
parseAddBtn?.addEventListener('click', async ()=>{
  const taskInput = document.getElementById('taskText');
  const text = taskInput.value.trim();
  if (!text) { showToast('Enter a task'); return; }
  const pr = await fetch(API + '/api/parse', { method:'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify({ text }) });
  if (!pr.ok) { showToast('Parse failed', false); return; }
  const parsed = await pr.json();
  const cr = await fetch(API + '/api/tasks', { method:'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify({
    title: parsed.title,
    priority: parsed.priority,
    category: parsed.category,
    due_date: parsed.due_date,
    estimated_hours: parsed.estimated_hours
  }) });
  if (cr.ok) { showToast('Task added'); taskInput.value=''; await refreshTasks(); } else { showToast('Create failed', false); }
});

async function refreshTasks(){
  const list = document.getElementById('tasksContainer');
  if (!list) return;
  const r = await fetch(API + '/api/tasks', { headers: { ...authHeaders() } });
  if (!r.ok) { list.innerHTML = '<div class="muted">Failed to load tasks</div>'; return; }
  const tasks = await r.json();
  list.innerHTML = '';
  tasks.forEach(t=>{
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div><strong>${t.title}</strong></div>
      <div>${t.category || '-'}</div>
      <div>${t.priority}</div>
      <div>${t.due_date || '-'}</div>
      <div><span class="badge">${t.priority_score}</span></div>
      <div><button class="btn" data-done="${t.id}">Done</button></div>
      <div style="grid-column: 1 / -1; margin-top:6px;">
        <details>
          <summary>Subtasks</summary>
          <div class="row" style="margin-top:8px;">
            <input type="text" placeholder="Subtask title" data-subtitle="${t.id}" class="col"/>
            <button class="btn" data-addsub="${t.id}">Add</button>
          </div>
        </details>
      </div>
    `;
    list.appendChild(row);
  });
  // Bind done and subtask
  list.querySelectorAll('button[data-done]')?.forEach(btn=>btn.addEventListener('click', async (e)=>{
    const id = e.currentTarget.getAttribute('data-done');
    const r = await fetch(API + `/api/tasks/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify({ status:'completed' }) });
    if (r.ok) { showToast('Marked done'); refreshTasks(); } else { showToast('Failed', false); }
  }));
  list.querySelectorAll('button[data-addsub]')?.forEach(btn=>btn.addEventListener('click', async (e)=>{
    const id = e.currentTarget.getAttribute('data-addsub');
    const input = list.querySelector(`input[data-subtitle="${id}"]`);
    const title = (input?.value || '').trim();
    if (!title) { showToast('Enter subtask title'); return; }
    const r = await fetch(API + `/api/tasks/${id}/subtasks`, { method:'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify({ title }) });
    if (r.ok) { showToast('Subtask added'); input.value=''; } else { showToast('Failed', false); }
  }));
}

// Dashboard
async function refreshStats(){
  const r = await fetch(API + '/api/stats', { headers: { ...authHeaders() } });
  if (!r.ok) return;
  const s = await r.json();
  document.getElementById('mTotal').textContent = s.total;
  document.getElementById('mPending').textContent = s.pending;
  document.getElementById('mInProgress').textContent = s.in_progress;
  document.getElementById('mCompleted').textContent = s.completed;

  const tr = await fetch(API + '/api/tasks', { headers: { ...authHeaders() } });
  if (!tr.ok) return;
  const tasks = await tr.json();
  const x = tasks.map(t=> t.category || 'uncategorized');
  const y = tasks.map(t=> t.priority_score);
  const c = tasks.map(t=> t.priority);
  const data = [{ x, y, type:'box', marker:{color:'#6C5CE7'}, name:'score', text:c }];
  Plotly.newPlot('chart', data, { paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)', font:{color:'#e5e7eb'} });
}

// Export
const exportExcel = document.getElementById('exportExcel');
const exportPdf = document.getElementById('exportPdf');
exportExcel?.addEventListener('click', async ()=>{
  const r = await fetch(API + '/api/export?format=excel', { method:'POST', headers:{ ...authHeaders() } });
  if (!r.ok) { showToast('Export failed', false); return; }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tasks.xlsx'; a.click();
  URL.revokeObjectURL(url);
});
exportPdf?.addEventListener('click', async ()=>{
  const r = await fetch(API + '/api/export?format=pdf', { method:'POST', headers:{ ...authHeaders() } });
  if (!r.ok) { showToast('Export failed', false); return; }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tasks.pdf'; a.click();
  URL.revokeObjectURL(url);
});

// Simple Web Speech API for STT (Chrome/Edge only)
(function initSTT(){
  const btn = document.getElementById('sttBtn');
  const status = document.getElementById('sttStatus');
  const input = document.getElementById('taskText');
  if (!btn || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    if (status) status.textContent = 'Voice not supported in this browser';
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recog = new SR();
  recog.lang = 'en-US';
  recog.interimResults = false;
  recog.maxAlternatives = 1;
  let listening = false;
  btn.addEventListener('click', ()=>{
    if (!listening) { recog.start(); listening = true; status.textContent = 'Listening...'; btn.disabled = true; }
  });
  recog.onresult = (e)=>{
    const text = e.results[0][0].transcript;
    input.value = text;
    status.textContent = 'Captured voice';
    btn.disabled = false; listening = false;
  };
  recog.onerror = ()=>{ status.textContent = 'Voice error'; btn.disabled = false; listening = false; };
  recog.onend = ()=>{ if (listening) { btn.disabled = false; listening = false; status.textContent = 'Idle'; } };
})();

// Initial loads when routes shown
window.addEventListener('hashchange', async ()=>{
  const name = (location.hash || '#home').replace('#','') || 'home';
  if (name === 'tasks') await refreshTasks();
  if (name === 'dashboard') await refreshStats();
});
if (location.hash === '#tasks') refreshTasks();
if (location.hash === '#dashboard') refreshStats();
