import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardActions, CardContent, Chip, CircularProgress, Dialog, DialogTitle, Grid, Stack, Typography, IconButton, Tooltip, styled, TextField, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LabelIcon from '@mui/icons-material/Label';
import AlarmOnIcon from '@mui/icons-material/AlarmOn'; // NEW
import SnoozeIcon from '@mui/icons-material/Snooze';
import axios from 'axios';
import NewTaskModal from '../components/NewTaskModal.jsx';
import ExportButtons from '../components/ExportButtons.jsx';

// --- Utility Functions ---

const priorityColorMap = {
  high: { color: 'error', text: 'High' },
  medium: { color: 'warning', text: 'Medium' },
  low: { color: 'success', text: 'Low' },
};

function getPriorityProps(priority) {
  return priorityColorMap[(priority || 'medium').toLowerCase()] || priorityColorMap.medium;
}

function getDueChipProps(due) {
  if (!due) return { label: 'No Due Date', color: 'default', icon: <EventIcon sx={{ fontSize: 16 }} /> };
  const dueMs = new Date(due).getTime();
  const delta = dueMs - Date.now();
  const days = Math.ceil(delta / (1000 * 60 * 60 * 24));
  
  if (days < 0) return { label: `Overdue (${Math.abs(days)}d ago)`, color: 'error', icon: <EventIcon sx={{ fontSize: 16 }} /> };
  if (days === 0) return { label: 'Due Today', color: 'warning', icon: <EventIcon sx={{ fontSize: 16 }} /> };
  return { label: `Due in ${days}d`, color: (days < 7 ? 'warning' : 'default'), variant: 'outlined', icon: <EventIcon sx={{ fontSize: 16 }} /> };
}

// --- Custom Task Card Component ---

const StyledTaskCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    transition: 'box-shadow 0.3s, transform 0.1s',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        transform: 'translateY(-1px)'
    },
}));

function TaskCard({ task, onMarkDone, onDelete, onRecalc, onSnooze }) {
  const priority = getPriorityProps(task.priority);
  const due = getDueChipProps(task.due_date);

  const handleRecalc = () => {
    onRecalc({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      status: task.status,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      due_date: task.due_date,
      reminder_date: task.reminder_date // Include NEW field in recalc payload
    });
  };

  return (
    <StyledTaskCard
      variant="elevation"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <CardContent sx={{ py: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" component="div" fontWeight={600} noWrap>
            {task.title}
          </Typography>
          <Chip 
            label={`Score ${task.priority_score?.toFixed?.(1) ?? task.priority_score}`} 
            size="small" 
            variant="filled" 
            sx={{ 
                bgcolor: '#22c55e', 
                color: 'white', 
                minWidth: '60px', 
                fontWeight: 700,
                marginLeft: 1 
            }} 
          />
        </Stack>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, whiteSpace: 'pre-wrap', maxHeight: '40px', overflow: 'hidden' }}>
          {task.description || 'No description provided.'}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', '& .MuiChip-root': { fontSize: '0.7rem', height: 24, fontWeight: 600 } }}>
          <Chip label={priority.text} size="small" color={priority.color} />
          <Chip label={due.label} size="small" color={due.color} variant={due.variant} icon={due.icon} />
          {task.estimated_hours != null && <Chip label={`${task.estimated_hours}h`} size="small" icon={<AccessTimeIcon sx={{ fontSize: 16 }} />} variant="outlined" />}
          {task.category && <Chip label={task.category} size="small" icon={<LabelIcon sx={{ fontSize: 16 }} />} variant="outlined" />}
          {typeof task.subtasks_done === 'number' && typeof task.subtasks_count === 'number' && (
            <Chip label={`${task.subtasks_done}/${task.subtasks_count}`} size="small" variant="outlined" />
          )}
          
          {/* NEW: Display reminder status */}
          {task.reminder_date && (
            <Chip 
                label={`Reminder: ${new Date(task.reminder_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} 
                size="small" 
                color="primary" 
                variant="outlined" 
                icon={<AlarmOnIcon sx={{ fontSize: 16 }} />} 
            />
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', borderTop: theme => `1px solid ${theme.palette.divider}`, bgcolor: 'transparent', py: 0.5, px: 1.5 }}>
        {task.status !== 'completed' ? (
          <Button size="small" startIcon={<CheckCircleIcon />} onClick={() => onMarkDone(task.id)} color="success" sx={{ mr: 'auto', p: '4px 8px' }}>
            Mark Done
          </Button>
        ) : (
             <Chip label="Completed" size="small" color="success" variant="outlined" sx={{ mr: 'auto', p: '4px 8px' }} />
        )}
        
        <Box> 
            <Tooltip title="Recalculate AI Priority">
              <IconButton size="small" onClick={handleRecalc} sx={{ p: '4px' }}>
                <AutoFixHighIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Snooze 10 minutes">
              <IconButton size="small" onClick={() => onSnooze?.(task.id, 10)} sx={{ p: '4px' }}>
                <SnoozeIcon fontSize="small" color="action" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Task">
              <IconButton size="small" color="error" onClick={() => onDelete(task.id)} sx={{ p: '4px' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
        </Box>
      </CardActions>
    </StyledTaskCard>
  );
}


// --- Kanban Column Component (Remains the same as last successful revision) ---
function Column({ title, tasks, statusKey, onMarkDone, onDelete, onRecalc, onDropTask, onSnooze }) {
  return (
    <Box sx={{ 
        minHeight: '80vh', 
        p: 1, 
        borderRadius: 2, 
        bgcolor: 'background.default',
        border: theme => `1px solid ${theme.palette.divider}`,
    }}
      onDragOver={(e)=>{ e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e)=>{
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id) onDropTask?.(id, statusKey);
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, px: 1, py: 1, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h6" component="div" fontWeight={700} color="text.primary">
            {title.split('(')[0].trim()}
        </Typography>
        <Chip 
            label={tasks.length} 
            size="medium" 
            color="primary" 
            variant="filled" 
            sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 800 }}
        />
      </Stack>
      <Stack spacing={1}>
        {tasks.map(t => (
          <TaskCard 
            key={t.id} 
            task={t} 
            onMarkDone={onMarkDone} 
            onDelete={onDelete} 
            onRecalc={onRecalc}
            onSnooze={onSnooze}
          />
        ))}
        {tasks.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3, p: 2, border: theme => `2px dashed ${theme.palette.divider}`, borderRadius: 1 }}>
            No tasks in this column.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}


// --- Main Dashboard Component ---

export default function TaskDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  // Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data || []);
    } catch (error) {
        console.error("Failed to load tasks:", error);
        setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  // --- NEW: Reminder Notification Logic ---
  useEffect(() => {
    const timers = [];
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const now = Date.now();
    
    for (const t of tasks) {
        // Use reminder_date if available
        const reminderTime = t.reminder_date; 
        
        if (!reminderTime || t.status === 'completed') continue;

        const reminderMs = new Date(reminderTime).getTime();
        const delay = reminderMs - now;
        
        // Check if the reminder is in the future (up to 7 days away)
        if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) { 
            const id = setTimeout(() => {
                if (Notification.permission === 'granted') {
                    const time = new Date(reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    new Notification('Task Reminder', { 
                        body: `${t.title} is approaching! Due: ${new Date(t.due_date).toLocaleDateString()} at ${time}`,
                        icon: '/vite.svg' 
                    });
                }
            }, delay);
            timers.push(id);
        }
    }
    return () => timers.forEach(clearTimeout); 
  }, [tasks]);
  // --- END Reminder Notification Logic ---

  const categories = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => { if (t.category) set.add(t.category); });
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const catOk = filterCategory === 'all' || (t.category || 'Uncategorized') === filterCategory;
      const priOk = filterPriority === 'all' || (t.priority || 'medium') === filterPriority;
      const status = (t.status || 'pending');
      const stOk = filterStatus === 'all' || status === filterStatus;
      return catOk && priOk && stOk;
    });
  }, [tasks, filterCategory, filterPriority, filterStatus]);

  const groupedTasks = useMemo(() => ({
    todo: filtered.filter(t => (t.status || 'pending') === 'pending'),
    inProgress: filtered.filter(t => t.status === 'in_progress'),
    done: filtered.filter(t => t.status === 'completed'),
  }), [filtered]);

  const markDone = async (id) => {
    await axios.patch(`/api/tasks/${id}`, { status: 'completed' });
    loadTasks();
  };

  const remove = async (id) => {
    await axios.delete(`/api/tasks/${id}`);
    loadTasks();
  };

  const recalc = async (taskData) => {
    setLoading(true);
    try {
        await axios.patch(`/api/tasks/${taskData.id}`, taskData);
        await loadTasks();
    } catch (error) {
        console.error("AI Recalculation failed:", error);
    } finally {
        setLoading(false);
    }
  };

  const snooze = async (id, minutes = 10) => {
    try {
      await axios.post(`/api/tasks/${id}/snooze?minutes=${minutes}`);
      await loadTasks();
    } catch (e) {
      // ignore UI error for now
    }
  };

  const updateTaskStatus = async (id, status) => {
    // optimistic update
    setTasks(prev => prev.map(t => (t.id === Number(id) || t.id === id) ? { ...t, status } : t));
    try {
      await axios.patch(`/api/tasks/${id}`, { status });
      await loadTasks();
    } catch (e) {
      await loadTasks();
    }
  };

  return (
    <Box sx={{ pt: 3, pb: 4 }}>
        <Box sx={{ px: { xs: 1, sm: 2 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4" fontWeight={800}>My Tasks</Typography>
                <Stack direction="row" spacing={1}>
                    <ExportButtons />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenNew(true)}>
                        Add New Task
                    </Button>
                </Stack>
            </Stack>

            {/* Filters Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
              <TextField select label="Filter by Category" size="small" value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} sx={{ minWidth: { xs: '100%', md: 220 }}}>
                <MenuItem value="all">All</MenuItem>
                {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField select label="Filter by Priority" size="small" value={filterPriority} onChange={(e)=>setFilterPriority(e.target.value)} sx={{ minWidth: { xs: '100%', md: 220 }}}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
              <TextField select label="Filter by Status" size="small" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} sx={{ minWidth: { xs: '100%', md: 220 }}}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">To Do</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Stack>
        </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3} sx={{ px: { xs: 1, sm: 2 } }}> 
          <Grid item xs={12} md={4}>
            <Column
              title={`To Do (${groupedTasks.todo.length})`}
              tasks={groupedTasks.todo}
              statusKey="pending"
              onDropTask={updateTaskStatus}
              onMarkDone={markDone}
              onDelete={remove}
              onRecalc={recalc}
              onSnooze={snooze}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Column
              title={`In Progress (${groupedTasks.inProgress.length})`}
              tasks={groupedTasks.inProgress}
              statusKey="in_progress"
              onDropTask={updateTaskStatus}
              onMarkDone={markDone}
              onDelete={remove}
              onRecalc={recalc}
              onSnooze={snooze}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Column
              title={`Completed (${groupedTasks.done.length})`}
              tasks={groupedTasks.done}
              statusKey="completed"
              onDropTask={updateTaskStatus}
              onMarkDone={markDone}
              onDelete={remove}
              onRecalc={recalc}
              onSnooze={snooze}
            />
          </Grid>
        </Grid>
      )}

      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <NewTaskModal onCreated={() => { setOpenNew(false); loadTasks(); }} onCancel={() => setOpenNew(false)} />
      </Dialog>
    </Box>
  );
}