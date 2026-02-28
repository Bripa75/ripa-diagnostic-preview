import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id)=> document.getElementById(id);

function setText(id, txt, cls){
  const el = $(id);
  if (!el) return;
  el.className = cls || el.className;
  el.textContent = txt;
}

async function refreshStatus(){
  const { data } = await supabase.auth.getSession();
  const loggedIn = !!data?.session;
  setText('loginStatus', loggedIn ? `Signed in as ${data.session.user.email}` : 'Not signed in.', loggedIn ? 'ok' : 'muted');
  $('genBtn').disabled = !loggedIn;
}

$('loginBtn')?.addEventListener('click', async ()=>{
  setText('loginStatus', 'Signing in…', 'muted');
  const email = ($('adminEmail')?.value || '').trim();
  const password = $('adminPass')?.value || '';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setText('loginStatus', `Login failed: ${error.message}`, 'err');
    return;
  }
  await refreshStatus();
});

$('logoutBtn')?.addEventListener('click', async ()=>{
  await supabase.auth.signOut();
  await refreshStatus();
});

$('genBtn')?.addEventListener('click', async ()=>{
  setText('genStatus', 'Generating…', 'muted');
  const user_email = ($('customerEmail')?.value || '').trim() || null;
  const expiration_hours = Number(($('expiresHours')?.value || '168').trim()) || 168;

  const { data, error } = await supabase.rpc('generate_access_code', { user_email, expiration_hours });
  if (error) {
    setText('genStatus', `Error: ${error.message}`, 'err');
    return;
  }
  $('codeOut').textContent = data;
  setText('genStatus', 'Done.', 'ok');
});

$('copyBtn')?.addEventListener('click', async ()=>{
  const code = $('codeOut')?.textContent || '';
  if (!code || code === '—') return;
  try {
    await navigator.clipboard.writeText(code);
    setText('genStatus', 'Copied.', 'ok');
  } catch {
    setText('genStatus', 'Copy failed (browser blocked).', 'err');
  }
});

supabase.auth.onAuthStateChange(()=>{
  refreshStatus();
});

refreshStatus();
