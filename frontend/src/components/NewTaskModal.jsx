// frontend/src/components/NewTaskModal.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Button, DialogActions, DialogContent, Grid, Stack, TextField, MenuItem, IconButton, Tooltip, Alert, Typography } from '@mui/material';
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
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    reminder_date: ''
  });
  const [busy, setBusy] = useState(false);
  const [uiMessage, setUiMessage] = useState(null); // Used for all feedback, including voice error

  // --- Voice Input (Web Speech API) Logic ---
  const [recognizer, setRecognizer] = useState(null);

  const handleVoiceError = useCallback((message) => {
    setUiMessage({ severity: 'error', text: message });
    setListening(false);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setUiMessage({ severity: 'warning', text: "Voice input not supported by this browser." });
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false; 
    rec.continuous = false; 

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setNlText(transcript);
      setListening(false);
      setUiMessage({ severity: 'info', text: 'Voice successfully transcribed. Click Parse to continue.' });
    };

    rec.onend = () => {
        setListening(false);
    };
    
    rec.onerror = (e) => {
        let errorText = e.error;
        if (errorText === 'not-allowed') {
             // FIX: Clear instruction for the user
             errorText = "Microphone access blocked. Please check your browser's site permissions, ensure you are using a secure context (like HTTPS/localhost), and try again.";
        } else if (errorText === 'no-speech') {
             errorText = "No speech detected. Please speak clearly.";
        }
        handleVoiceError(errorText);
    };

    setRecognizer(rec);
    return () => { try { rec.stop(); } catch (_) {} };
  }, [handleVoiceError]);

  const startVoice = useCallback(() => {
    if (!recognizer) return;
    setUiMessage(null);
    try { 
        recognizer.start(); 
        setListening(true); 
        setUiMessage({ severity: 'info', text: 'Listening... say your task now.' });
    } catch (e) {
        handleVoiceError("Microphone already in use or permission denied.");
    }
  }, [recognizer, handleVoiceError]);

  const stopVoice = useCallback(() => {
    if (!recognizer) return;
    try { recognizer.stop(); setListening(false); } catch (_) {}
  }, [recognizer]);

  // --- API and Form Logic ---

  const parse = async () => {
    if (!nlText.trim()) return;
    setBusy(true);
    setUiMessage(null); 
    try {
      const res = await axios.post('/api/parse', { text: nlText });
      const p = res.data || {};
      
      setForm((prev) => ({
        ...prev,
        title: p.title || prev.title,
        description: p.description || prev.description,
        category: p.category || prev.category,
        priority: p.priority || prev.priority,
        due_date: p.due_date ? p.due_date.substring(0, 10) : prev.due_date,
        estimated_hours: p.estimated_hours ?? prev.estimated_hours,
        // Expect ISO string; trim to 'YYYY-MM-DDTHH:MM' for datetime-local input
        reminder_date: p.reminder_date ? p.reminder_date.substring(0, 16) : prev.reminder_date,
      }));
      setUiMessage({ severity: 'success', text: 'Text parsed successfully. Review details below.' });
    } catch (err) {
        setUiMessage({ severity: 'error', text: 'Failed to parse natural language text.' });
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    setBusy(true);
    setUiMessage(null);
    const due_date_iso = form.due_date ? new Date(form.due_date).toISOString().split('T')[0] : null;
    // Convert datetime-local value 'YYYY-MM-DDTHH:MM' to ISO-like without timezone for backend
    const reminder_date_iso = form.reminder_date
      ? (form.reminder_date.length === 16 ? `${form.reminder_date}:00` : form.reminder_date)
      : null;

    try {
      const payload = {
        ...form,
        due_date: due_date_iso,
        reminder_date: reminder_date_iso,
        estimated_hours: form.estimated_hours === '' ? null : Number(form.estimated_hours),
      };
      await axios.post('/api/tasks', payload);
      onCreated?.();
    } catch (err) {
        setUiMessage({ severity: 'error', text: 'Failed to create task. Check network or server logs.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogContent>
        <Stack spacing={2}>
            {uiMessage && <Alert severity={uiMessage.severity}>{uiMessage.text}</Alert>}

          <TextField label="Task Text (for NLP Parsing)" placeholder="e.g., Review design by Friday, high priority, 4 hours"
            value={nlText} onChange={(e) => setNlText(e.target.value)} fullWidth multiline minRows={1} />
            
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" color="secondary" onClick={parse} disabled={busy || !nlText.trim()}>Parse and Fill</Button>
            <Tooltip title={listening ? 'Stop voice input' : (recognizer ? 'Start voice input' : 'Voice not supported')}>
              <span>
                <IconButton 
                    color={listening ? 'error' : 'default'} 
                    onClick={listening ? stopVoice : startVoice} 
                    disabled={!recognizer || busy}
                >
                  {listening ? <StopCircleIcon /> : <MicIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        
        <Typography variant="overline" sx={{mt: 1, color: 'text.secondary'}}>Parsed & Manual Details</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description (Optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline minRows={1} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Category (Optional)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Priority" select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} fullWidth>
                {priorities.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Due Date (Optional)" type="date" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Estimated Hours (Optional)" type="number" inputProps={{ min: 0, step: '0.5' }} value={form.estimated_hours}
                onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reminder (Optional)"
                type="datetime-local"
                value={form.reminder_date || ''}
                onChange={(e) => setForm({ ...form, reminder_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Choose a date and time to receive an email reminder"
              />
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