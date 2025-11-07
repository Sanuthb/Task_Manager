import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from 'axios';

function StatCard({ title, value, color }) {
  return (
    <Card variant="outlined" sx={{ borderColor: 'divider' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
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

  const priorityPie = useMemo(() => {
    const high = tasks.filter(t => (t.priority || 'medium') === 'high').length;
    const med = tasks.filter(t => (t.priority || 'medium') === 'medium').length;
    const low = tasks.filter(t => (t.priority || 'medium') === 'low').length;
    return [
      { name: 'High', value: high },
      { name: 'Medium', value: med },
      { name: 'Low', value: low },
    ];
  }, [tasks]);

  const statusPie = useMemo(() => {
    const todo = tasks.filter(t => (t.status || 'pending') === 'pending').length;
    const inprog = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'completed').length;
    return [
      { name: 'To Do', value: todo },
      { name: 'In Progress', value: inprog },
      { name: 'Completed', value: done },
    ];
  }, [tasks]);

  const categoriesBar = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => {
      const k = t.category || 'Uncategorized';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [tasks]);

  const COLORS_PRIORITY = ['#ff4d4f', '#ffa726', '#22c55e'];
  const COLORS_STATUS = ['#80d8ff', '#ffd54f', '#22c55e'];

  return (
    <Box sx={{ pr: 5, pl:5 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 800 }}>Dashboard</Typography>

      {/* Top metrics */}
      <Grid container spacing={3}>
        <Grid width={500} item xs={12} md={3}><StatCard title="Total Tasks" value={stats.total ?? 0} color="#00e5ff" /></Grid>
        <Grid width={500} item xs={12} md={3}><StatCard title="Pending Tasks" value={stats.pending ?? 0} color="#ffa726" /></Grid>
        <Grid width={500} item xs={12} md={3}><StatCard title="Completed Tasks" value={stats.completed ?? 0} color="#22c55e" /></Grid>
        <Grid width={500} item xs={12} md={3}><StatCard title="Overdue Tasks" value={stats.overdue ?? 0} color="#ff4d4f" /></Grid>
      </Grid>

      {/* Charts row */}
      <Grid container spacing={4} sx={{ mt: 5 }}>
        <Grid item xs={12} md={6} width={500}>
          <Card variant="outlined" style={{background:"#0000"}}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Task Priority Distribution</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityPie} dataKey="value" nameKey="name" outerRadius={80} label>
                      {priorityPie.map((entry, index) => (
                        <Cell key={`p-${index}`} fill={COLORS_PRIORITY[index % COLORS_PRIORITY.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} width={500}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Task Status</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={80} label>
                      {statusPie.map((entry, index) => (
                        <Cell key={`s-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Categories bar chart */}
      <Grid container spacing={2} sx={{ mt: 4 }}>
        <Grid item xs={12} width={1030}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Task Categories</Typography>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoriesBar} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="name" interval={0} height={50} angle={-10} textAnchor="end" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#06b6d4" />
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
