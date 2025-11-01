import streamlit as st
import requests
import plotly.express as px
from datetime import datetime
import os
try:
    from streamlit_mic_recorder import speech_to_text as st_speech_to_text
except Exception:
    st_speech_to_text = None

st.set_page_config(page_title='Task Genius', layout='wide')

# Modern CSS and fonts
st.markdown(
    """
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      :root { --tg-primary: #6C5CE7; --tg-accent: #00D4FF; --tg-bg:#0b0f19; --tg-card:#111827; --tg-text:#e5e7eb; }
      html, body, [class^="css"], .stMarkdown, .stTextInput, .stButton { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      .tg-hero { background: radial-gradient(1000px 400px at 10% 10%, rgba(108,92,231,.2), transparent), linear-gradient(135deg, #0b0f19, #0e1424); border-radius: 16px; padding: 40px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.06); }
      .tg-title { font-size: 36px; font-weight: 800; letter-spacing: -0.02em; color: var(--tg-text); }
      .tg-sub { font-size: 16px; color: #9CA3AF; margin-top: 6px; }
      .tg-cta .stButton>button { background: linear-gradient(90deg, var(--tg-primary), var(--tg-accent)); color: white; border: 0; border-radius: 10px; padding: 10px 16px; font-weight: 600; box-shadow: 0 6px 20px rgba(108,92,231,.25); }
      .tg-card { background: var(--tg-card); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; }
      .tg-badge { display:inline-block; padding: 4px 8px; border-radius: 999px; background: rgba(108,92,231,.15); color:#c7c8fe; font-size:12px; }
      .tg-muted { color: #9CA3AF; }
      /* Hide Streamlit default menu/footer */
      #MainMenu {visibility: hidden;} footer {visibility: hidden;} header {visibility: hidden;}
    </style>
    """,
    unsafe_allow_html=True,
)

def _get_api_base():
    # 1) Environment variable takes precedence
    env = os.environ.get("API_URL")
    if env:
        return env
    # 2) Only touch st.secrets if a secrets.toml is present
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    candidate_paths = [
        os.path.join(os.path.expanduser("~"), ".streamlit", "secrets.toml"),
        os.path.join(project_root, ".streamlit", "secrets.toml"),
    ]
    if any(os.path.exists(p) for p in candidate_paths):
        try:
            return st.secrets.get("API_URL", "http://127.0.0.1:5000")
        except Exception:
            pass
    # 3) Fallback default
    return "http://127.0.0.1:5000"

API = _get_api_base()

def api(path):
    return f"{API}{path}"

if 'token' not in st.session_state:
    st.session_state.token = None

# Hero section (landing)
with st.container():
    st.markdown(
        """
        <div class="tg-hero">
          <div class="tg-badge">AI-Powered Task Manager</div>
          <div class="tg-title">Task Genius</div>
          <div class="tg-sub">Organize smarter. Prioritize with AI. Stay on track with insights and reminders.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

headers = {'Authorization': f"Bearer {st.session_state.token}"} if st.session_state.token else {}

home_tab, login_tab, register_tab, tasks_tab, dash_tab, export_tab = st.tabs(['Home', 'Login', 'Register', 'Tasks', 'Dashboard', 'Export'])

with home_tab:
    col1, col2, col3 = st.columns([2, 3, 2])
    with col2:
        st.markdown('<div class="tg-card">', unsafe_allow_html=True)
        st.markdown("""
        - **Smart NLP input**
        - **AI prioritization** with urgency score
        - **Dashboard analytics** with Plotly
        - **Subtasks** and progress logging (API)
        - **Exports** to Excel/PDF
        """)
        st.markdown('</div>', unsafe_allow_html=True)
    st.markdown("\n")

with login_tab:
    with st.form('login_form'):
        st.subheader('Login')
        le = st.text_input('Email', key='login_email')
        lp = st.text_input('Password', type='password', key='login_password')
        submitted = st.form_submit_button('Login')
        if submitted:
            r = requests.post(api('/api/auth/login'), json={'email': le, 'password': lp})
            if r.ok:
                st.session_state.token = r.json()['access_token']
                st.success('Logged in')
                st.experimental_rerun()
            else:
                st.error(r.json().get('message', 'Login failed'))

with register_tab:
    with st.form('register_form'):
        st.subheader('Register')
        re = st.text_input('Email', key='reg_email')
        rp = st.text_input('Password', type='password', key='reg_password')
        submitted = st.form_submit_button('Create account')
        if submitted:
            r = requests.post(api('/api/auth/register'), json={'email': re, 'password': rp})
            if r.ok or r.status_code == 201:
                st.success('Registered. You can login now.')
            else:
                st.error(r.json().get('message', 'Registration failed'))

with tasks_tab:
    if not st.session_state.token:
        st.info('Please login to manage tasks.')
    else:
        col_txt, col_stt = st.columns([3, 2])
        with col_txt:
            typed_text = st.text_input('Add a task with natural language')
        with col_stt:
            st.caption('Voice input (optional)')
            transcript = None
            if st_speech_to_text is not None:
                raw = st_speech_to_text(
                    language='en',
                    use_container_width=True,
                    just_once=True,
                    key='stt'
                )
                # Normalize possible return types
                if isinstance(raw, str):
                    transcript = raw.strip() or None
                elif isinstance(raw, dict):
                    transcript = (raw.get('text') or raw.get('transcript') or '').strip() or None
                elif isinstance(raw, (list, tuple)):
                    try:
                        transcript = ' '.join(map(str, raw)).strip() or None
                    except Exception:
                        transcript = None
                if transcript:
                    st.session_state['last_transcript'] = transcript
                    st.success(f"Voice: {transcript}")
                elif st.session_state.get('last_transcript'):
                    st.info(f"Last voice: {st.session_state['last_transcript']}")
            else:
                st.info('Voice input available after installing streamlit-mic-recorder')
            ttext = (transcript or st.session_state.get('last_transcript') or '').strip() or typed_text

        if st.button('Parse and Add'):
            pr = requests.post(api('/api/parse'), json={'text': ttext}, headers=headers)
            if pr.ok:
                parsed = pr.json()
                create = {
                    'title': parsed['title'],
                    'priority': parsed['priority'],
                    'category': parsed['category'],
                    'due_date': parsed['due_date'],
                    'estimated_hours': parsed['estimated_hours']
                }
                cr = requests.post(api('/api/tasks'), json=create, headers=headers)
                if cr.ok:
                    st.success('Task added')
                else:
                    st.error(cr.text)
            else:
                st.error(pr.text)

        st.divider()
        lr = requests.get(api('/api/tasks'), headers=headers)
        if lr.ok:
            tasks = lr.json()
            for t in tasks:
                cols = st.columns([4,2,2,2,2,1])
                cols[0].markdown(f"**{t['title']}**")
                cols[1].write(t.get('category') or '-')
                cols[2].write(t.get('priority'))
                cols[3].write(t.get('due_date') or '-')
                cols[4].write(t.get('priority_score'))
                if cols[5].button('Done', key=f"done-{t['id']}"):
                    requests.patch(api(f"/api/tasks/{t['id']}"), json={'status': 'completed'}, headers=headers)
                    st.rerun()
                with st.expander('Subtasks', expanded=False):
                    st.write('Add a subtask')
                    base_key = f"sub-title-{t['id']}"
                    nonce_key = f"{base_key}-nonce"
                    nonce = st.session_state.get(nonce_key, 0)
                    input_key = f"{base_key}-{nonce}"
                    sub_title = st.text_input('Subtask title', key=input_key)
                    if st.button('Add subtask', key=f"add-sub-{t['id']}"):
                        if not (sub_title or '').strip():
                            st.warning('Please enter a subtask title')
                        else:
                            rr = requests.post(api(f"/api/tasks/{t['id']}/subtasks"), json={'title': sub_title.strip()}, headers=headers)
                            if rr.ok:
                                st.success('Subtask added')
                                st.session_state[nonce_key] = nonce + 1
                                st.rerun()
                            else:
                                st.error(rr.text)
        else:
            st.error(lr.text)

with dash_tab:
    if not st.session_state.token:
        st.info('Please login to view dashboard.')
    else:
        sr = requests.get(api('/api/stats'), headers=headers)
        if sr.ok:
            s = sr.json()
            colA, colB, colC, colD = st.columns(4)
            colA.metric('Total', s['total'])
            colB.metric('Pending', s['pending'])
            colC.metric('In Progress', s['in_progress'])
            colD.metric('Completed', s['completed'])
            lr = requests.get(api('/api/tasks'), headers=headers)
            if lr.ok and lr.json():
                tasks = lr.json()
                df = [{
                    'status': t['status'],
                    'priority': t['priority'],
                    'category': t['category'] or 'uncategorized',
                    'score': t['priority_score']
                } for t in tasks]
                fig = px.box(df, x='category', y='score', color='priority', points='all', title='Priority score by category')
                st.plotly_chart(fig, use_container_width=True)
        else:
            st.error(sr.text)

with export_tab:
    if not st.session_state.token:
        st.info('Please login to export data.')
    else:
        col1, col2 = st.columns(2)
        if col1.button('Export to Excel'):
            r1 = requests.post(api('/api/export?format=excel'), headers=headers)
            if r1.ok:
                st.download_button('Download tasks.xlsx', r1.content, file_name='tasks.xlsx')
            else:
                st.error(r1.text)
        if col2.button('Export to PDF'):
            r2 = requests.post(api('/api/export?format=pdf'), headers=headers)
            if r2.ok:
                st.download_button('Download tasks.pdf', r2.content, file_name='tasks.pdf')
            else:
                st.error(r2.text)
