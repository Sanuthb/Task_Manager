import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, DialogActions, DialogContent, Grid, Stack, TextField, MenuItem, IconButton, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import axios from 'axios';

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function NewTaskModal({ onCreated, onCancel }) {
  const [nlText, setNlText] = useState('');
  const [listening, setListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: ''
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setNlText((prev) => (prev ? prev + ' ' : '') + transcript.trim());
    };
    rec.onend = () => setListening(false);
    setRecognizer(rec);
    return () => { try { rec.stop(); } catch (_) {} };
  }, []);

  const startVoice = () => {
    if (!recognizer) return;
    try { recognizer.start(); setListening(true); } catch (_) {}
  };
  const stopVoice = () => {
    if (!recognizer) return;
    try { recognizer.stop(); setListening(false); } catch (_) {}
  };

  const parse = async () => {
    if (!nlText.trim()) return;
    setBusy(true);
    try {
      const res = await axios.post('/api/parse', { text: nlText });
      const p = res.data || {};
      setForm((prev) => ({
        ...prev,
        title: p.title || prev.title,
        description: p.description || prev.description,
        category: p.category || prev.category,
        priority: p.priority || prev.priority,
        due_date: p.due_date || prev.due_date,
        estimated_hours: p.estimated_hours ?? prev.estimated_hours,
      }));
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    setBusy(true);
    try {
      const payload = {
        ...form,
        estimated_hours: form.estimated_hours === '' ? null : Number(form.estimated_hours),
      };
      await axios.post('/api/tasks', payload);
      onCreated?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogContent>
        <Stack spacing={2}>
          <TextField label="Task Text" placeholder="e.g., Review design by Friday, high priority, 4 hours"
            value={nlText} onChange={(e) => setNlText(e.target.value)} fullWidth multiline minRows={2} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" onClick={parse} disabled={busy}>Parse and Fill</Button>
            <Tooltip title={listening ? 'Stop voice' : 'Start voice'}>
              <IconButton color={listening ? 'error' : 'primary'} onClick={listening ? stopVoice : startVoice}>
                {listening ? <StopCircleIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline minRows={2} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Priority" select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} fullWidth>
                {priorities.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Due Date" type="date" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Estimated Hours" type="number" inputProps={{ min: 0, step: '0.5' }} value={form.estimated_hours}
                onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} fullWidth />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={create} disabled={busy || !form.title}>Create Task</Button>
      </DialogActions>
    </>
  );
}
