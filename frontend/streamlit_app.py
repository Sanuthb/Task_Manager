import streamlit as st
import requests
import plotly.express as px
from datetime import datetime

API = st.secrets.get('API_URL', 'http://127.0.0.1:5000')

def api(path):
    return f"{API}{path}"

st.set_page_config(page_title='Task Genius', layout='wide')

if 'token' not in st.session_state:
    st.session_state.token = None

st.title('Task Genius')

with st.sidebar:
    st.header('Account')
    email = st.text_input('Email')
    password = st.text_input('Password', type='password')
    col1, col2 = st.columns(2)
    if col1.button('Register'):
        r = requests.post(api('/api/auth/register'), json={'email': email, 'password': password})
        st.toast(r.json().get('message', r.status_code))
    if col2.button('Login'):
        r = requests.post(api('/api/auth/login'), json={'email': email, 'password': password})
        if r.ok:
            st.session_state.token = r.json()['access_token']
            st.success('Logged in')
        else:
            st.error('Login failed')

if not st.session_state.token:
    st.info('Login to continue')
    st.stop()

headers = {'Authorization': f"Bearer {st.session_state.token}"}

tab1, tab2, tab3 = st.tabs(['Tasks', 'Dashboard', 'Export'])

with tab1:
    ttext = st.text_input('Add a task with natural language')
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
    else:
        st.error(lr.text)

with tab2:
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

with tab3:
    col1, col2 = st.columns(2)
    if col1.button('Export to Excel'):
        r = requests.post(api('/api/export?format=excel'), headers=headers)
        if r.ok:
            st.download_button('Download tasks.xlsx', r.content, file_name='tasks.xlsx')
        else:
            st.error(r.text)
    if col2.button('Export to PDF'):
        r = requests.post(api('/api/export?format=pdf'), headers=headers)
        if r.ok:
            st.download_button('Download tasks.pdf', r.content, file_name='tasks.pdf')
        else:
            st.error(r.text)
