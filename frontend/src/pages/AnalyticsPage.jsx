import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import axios from 'axios';

function MetricCard({ label, value }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="overline" color="text.secondary">{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0 });
  const [tasks, setTasks] = useState([]);

  const load = async () => {
    const [s, t] = await Promise.all([
      axios.get('/api/stats'),
      axios.get('/api/tasks')
    ]);
    setStats(s.data || {});
    setTasks(t.data || []);
  };

  useEffect(() => { load(); }, []);

  const statusData = useMemo(() => ([
    { name: 'To Do', count: tasks.filter(t => (t.status || 'pending') === 'pending').length },
    { name: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
  ]), [tasks]);

  const priorityData = useMemo(() => ([
    { name: 'High', count: tasks.filter(t => (t.priority || 'medium') === 'high').length },
    { name: 'Medium', count: tasks.filter(t => (t.priority || 'medium') === 'medium').length },
    { name: 'Low', count: tasks.filter(t => (t.priority || 'medium') === 'low').length },
  ]), [tasks]);

  const scoreByCategory = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const cat = t.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(typeof t.priority_score === 'number' ? t.priority_score : 0);
    }
    const arr = [];
    for (const [cat, scores] of map.entries()) {
      if (scores.length === 0) continue;
      const avg = scores.reduce((a,b)=>a+b,0) / scores.length;
      arr.push({ name: cat, avg: Number(avg.toFixed(1)) });
    }
    return arr.sort((a,b)=>b.avg - a.avg);
  }, [tasks]);

  return (
    <Box sx={{ pr: 5, pl:5 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 800 }}>Analytics</Typography>

      <Grid container spacing={2}>
        <Grid width={500} item xs={12} md={3}><MetricCard label="Total" value={stats.total ?? 0} /></Grid>
        <Grid width={500} item xs={12} md={3}><MetricCard label="Pending" value={stats.pending ?? 0} /></Grid>
        <Grid width={500} item xs={12} md={3}><MetricCard label="In Progress" value={stats.in_progress ?? 0} /></Grid>
        <Grid width={500} item xs={12} md={3}><MetricCard label="Completed" value={stats.completed ?? 0} /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6} width={1030}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Task Distribution by Status</Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} width={1030}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Task Distribution by Priority</Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} width={1030}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Average Priority Score by Category</Typography>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" interval={0} height={60} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg" name="Avg Score" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
