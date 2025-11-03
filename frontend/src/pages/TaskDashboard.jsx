import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardActions, CardContent, Chip, CircularProgress, Dialog, DialogTitle, Grid, Stack, Typography, IconButton, Tooltip, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import axios from 'axios';
import NewTaskModal from '../components/NewTaskModal.jsx';
import ExportButtons from '../components/ExportButtons.jsx';

function priorityColor(priority) {
  switch ((priority || 'medium').toLowerCase()) {
    case 'high': return 'error';
    case 'low': return 'success';
    default: return 'warning';
  }
}

function dueChipProps(due) {
  if (!due) return { label: 'No due date', color: 'default' };
  const dueMs = new Date(due).getTime();
  const delta = dueMs - Date.now();
  const hours = Math.round(delta / (1000 * 60 * 60));
  if (delta < 0) return { label: `Overdue (${new Date(dueMs).toLocaleDateString()})`, color: 'error' };
  if (hours < 24) return { label: `Due in ${hours}h`, color: 'warning' };
  const days = Math.ceil(hours / 24);
  return { label: `Due in ${days}d`, color: 'default' };
}

function Column({ title, tasks, onMarkDone, onDelete, onRecalc }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center"  sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        <Chip label={tasks.length} size="small" />
      </Stack>
      <Stack spacing={2}>
        {tasks.map(t => (
          <Card key={t.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', '&:hover': { boxShadow: 3 } }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>{t.title}</Typography>
                <Chip label={`Score ${t.priority_score?.toFixed?.(1) ?? t.priority_score}`} size="small" color="primary" variant="outlined" />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }} noWrap>
                {t.description || 'No description'}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                <Chip label={(t.priority || 'medium').toUpperCase()} size="small" color={priorityColor(t.priority)} variant="filled" />
                {(() => { const p = dueChipProps(t.due_date); return <Chip label={p.label} size="small" color={p.color} /> })()}
                {t.estimated_hours != null && <Chip label={`${t.estimated_hours}h`} size="small" />}
                {t.category && <Chip label={t.category} size="small" />}
                {t.status === 'completed' && <Chip label="Done" size="small" color="success" />}
              </Stack>
            </CardContent>
            <CardActions>
              {t.status !== 'completed' && (
                <Button size="small" startIcon={<CheckCircleIcon />} onClick={() => onMarkDone(t.id)}>
                  Mark Done
                </Button>
              )}
              <Tooltip title="Recalculate AI Priority">
                <IconButton size="small" onClick={() => onRecalc(t)}>
                  <AutoFixHighIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Task">
                <IconButton size="small" color="error" onClick={() => onDelete(t.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

export default function TaskDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Deadline reminders: notify ~30 minutes before due_date if pending/in_progress
  useEffect(() => {
    const timers = [];
    const canNotify = 'Notification' in window;
    if (!canNotify) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    const now = Date.now();
    for (const t of tasks) {
      if (!t.due_date) continue;
      if (t.status === 'completed') continue;
      const dueMs = new Date(t.due_date).getTime();
      const triggerAt = dueMs - 30 * 60 * 1000; // 30 minutes
      const delay = triggerAt - now;
      if (delay <= 0) continue;
      const id = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Upcoming deadline', { body: `${t.title} due at ${new Date(dueMs).toLocaleString()}` });
        }
      }, Math.min(delay, 24 * 60 * 60 * 1000));
      timers.push(id);
    }
    return () => timers.forEach(clearTimeout);
  }, [tasks]);

  const grouped = useMemo(() => ({
    todo: tasks.filter(t => (t.status || 'pending') === 'pending'),
    inProgress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'completed'),
  }), [tasks]);

  const markDone = async (id) => {
    await axios.patch(`/api/tasks/${id}`, { status: 'completed' });
    await load();
  };

  const remove = async (id) => {
    await axios.delete(`/api/tasks/${id}`);
    await load();
  };

  // Recalculate AI priority by sending a PATCH with current fields (backend recomputes on update)
  const recalc = async (task) => {
    const payload = {
      title: task.title,
      description: task.description,
      category: task.category,
      status: task.status,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      due_date: task.due_date,
    };
    await axios.patch(`/api/tasks/${task.id}`, payload);
    await load();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h5" sx={{ letterSpacing: -0.2 }}>My Tasks</Typography>
        <Stack direction="row" spacing={1}>
          <ExportButtons />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenNew(true)}>Add New Task</Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Column title="To Do" tasks={grouped.todo} onMarkDone={markDone} onDelete={remove} onRecalc={recalc} /></Grid>
          <Grid item xs={12} md={4}><Column title="In Progress" tasks={grouped.inProgress} onMarkDone={markDone} onDelete={remove} onRecalc={recalc} /></Grid>
          <Grid item xs={12} md={4}><Column title="Completed" tasks={grouped.done} onMarkDone={markDone} onDelete={remove} onRecalc={recalc} /></Grid>
        </Grid>
      )}

      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <NewTaskModal onCreated={() => { setOpenNew(false); load(); }} onCancel={() => setOpenNew(false)} />
      </Dialog>
    </Box>
  );
}
