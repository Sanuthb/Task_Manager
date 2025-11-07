import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Divider, Tooltip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth } from '../context/AuthContext.jsx';

const drawerWidth = 220;

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, to: '/dashboard', activeMatch: ['/dashboard$'] },
    { label: 'Tasks', icon: <DashboardIcon />, to: '/dashboard/tasks', activeMatch: ['/dashboard/tasks'] },
    { label: 'Analysis', icon: <QueryStatsIcon />, to: '/dashboard/analytics', activeMatch: ['/dashboard/analytics'] },
    { label: 'Final Report', icon: <DescriptionIcon />, to: '/dashboard/final-report', activeMatch: ['/dashboard/final-report'] },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Task Genius</Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => {
          const isActive = item.to === '/dashboard'
            ? location.pathname === '/dashboard'
            : (location.pathname.startsWith(item.to));
          const content = (
            <ListItemButton
              key={item.label}
              component={item.disabled ? 'div' : Link}
              to={item.disabled ? undefined : item.to}
              disabled={item.disabled}
              selected={Boolean(isActive)}
              sx={{
                my: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#fff' },
                  '&:hover': { backgroundColor: 'primary.main' }
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
          return item.disabled ? (
            <Tooltip key={item.label} title="Coming soon">
              <div>{content}</div>
            </Tooltip>
          ) : content;
        })}
      </List>
      <Divider />
      <List>
        <ListItemButton onClick={() => { logout(); navigate('/login'); }}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar variant="dense" disableGutters sx={{ px: 2 }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 700 }}>
            {location.pathname.startsWith('/dashboard/final-report')
              ? 'Final Report'
              : location.pathname.startsWith('/dashboard/analytics')
              ? 'Analysis'
              : location.pathname.startsWith('/dashboard/tasks')
              ? 'Tasks'
              : 'Dashboard'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="sidebar">
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` }, backgroundColor: 'background.default' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
