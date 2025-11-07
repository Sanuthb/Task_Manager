import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Grid, Stack, Typography, Button, Divider } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import ExportButtons from '../components/ExportButtons.jsx';

function StatBlock({ label, value }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function FinalReportPage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [s, t] = await Promise.all([
        axios.get('/api/stats').catch(() => ({ data: {} })),
        axios.get('/api/tasks').catch(() => ({ data: [] }))
      ]);
      setStats(s.data || {});
      setTasks(t.data || []);
    };
    load();
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => {
      const k = t.category || 'Uncategorized';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a,b)=>b.count-a.count);
  }, [tasks]);

  const byPriority = useMemo(() => ({
    high: tasks.filter(t => (t.priority || 'medium') === 'high').length,
    medium: tasks.filter(t => (t.priority || 'medium') === 'medium').length,
    low: tasks.filter(t => (t.priority || 'medium') === 'low').length,
  }), [tasks]);

  const byStatus = useMemo(() => ({
    pending: tasks.filter(t => (t.status || 'pending') === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks]);

  const printReport = () => window.print();

  return (
    <Box  sx={{ pr: 5, pl:5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Final Report</Typography>
        <Stack direction="row" spacing={1}>
          <ExportButtons />
          <Button startIcon={<PrintIcon />} variant="outlined" onClick={printReport}>Print</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid width={500} item xs={12} md={3}><StatBlock label="Total Tasks" value={stats.total ?? 0} /></Grid>
        <Grid width={500} item xs={12} md={3}><StatBlock label="Pending Tasks" value={stats.pending ?? 0} /></Grid>
        <Grid width={500} item xs={12} md={3}><StatBlock label="In Progress" value={stats.in_progress ?? 0} /></Grid>
        <Grid width={500} item xs={12} md={3}><StatBlock label="Completed" value={stats.completed ?? 0} /></Grid>
      </Grid>

      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="overline" color="text.secondary">By Priority</Typography>
              <Typography variant="body1">High: {byPriority.high}</Typography>
              <Typography variant="body1">Medium: {byPriority.medium}</Typography>
              <Typography variant="body1">Low: {byPriority.low}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="overline" color="text.secondary">By Status</Typography>
              <Typography variant="body1">To Do: {byStatus.pending}</Typography>
              <Typography variant="body1">In Progress: {byStatus.in_progress}</Typography>
              <Typography variant="body1">Completed: {byStatus.completed}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="overline" color="text.secondary">Top Categories</Typography>
              {byCategory.slice(0,5).map(row => (
                <Typography key={row.name} variant="body1">{row.name}: {row.count}</Typography>
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>All Tasks (compact)</Typography>
            <Button size="small" startIcon={<DownloadIcon />} variant="outlined" onClick={printReport}>Save as PDF (Print)</Button>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1 }}>
            <Typography variant="overline">Title</Typography>
            <Typography variant="overline">Status</Typography>
            <Typography variant="overline">Priority</Typography>
            <Typography variant="overline">Category</Typography>
            {tasks.map(t => (
              <React.Fragment key={t.id}>
                <Typography variant="body2" noWrap title={t.title}>{t.title}</Typography>
                <Typography variant="body2">{t.status || 'pending'}</Typography>
                <Typography variant="body2">{t.priority || 'medium'}</Typography>
                <Typography variant="body2">{t.category || 'Uncategorized'}</Typography>
              </React.Fragment>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
