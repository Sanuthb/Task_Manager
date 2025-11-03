import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ mode = 'login' }) {
  const [tab, setTab] = useState(mode === 'register' ? 1 : 0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (tab === 0) {
        const ok = await login(email, password);
        if (ok) navigate('/dashboard');
      } else {
        const ok = await register(email, password);
        if (ok) navigate('/dashboard');
      }
    } catch (err) {
      setError('Authentication failed');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3}>
        <Box p={3}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField label="Email" type="email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <Typography color="error" variant="body2">{error}</Typography>}
            <Button disabled={loading} type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {tab === 0 ? 'Login' : 'Register'}
            </Button>
            {tab === 0 ? (
              <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 2 }}>
                No account? <Link to="/register">Register</Link>
              </Typography>
            ) : (
              <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 2 }}>
                Have an account? <Link to="/login">Login</Link>
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
