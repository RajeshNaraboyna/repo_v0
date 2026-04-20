import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import {
  AppBar, Toolbar, IconButton, Typography, Box, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Avatar, Button, Divider, Tooltip, useMediaQuery,
  useTheme, Fade,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SchoolIcon from '@mui/icons-material/School'
import DescriptionIcon from '@mui/icons-material/Description'
import EventNoteIcon from '@mui/icons-material/EventNote'
import BarChartIcon from '@mui/icons-material/BarChart'
import InsightsIcon from '@mui/icons-material/Insights'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'

const DRAWER_WIDTH = 260
const DRAWER_COLLAPSED = 68

const navItems = [
  { to: '/admission', label: 'Admission Request', icon: <AssignmentIcon />, authRequired: false },
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, authRequired: true },
  { to: '/approved', label: 'Approved', icon: <CheckCircleIcon />, authRequired: true },
  { to: '/students', label: 'Students', icon: <SchoolIcon />, authRequired: true },
  { to: '/question-papers', label: 'Question Papers', icon: <DescriptionIcon />, authRequired: true },
  { to: '/exams', label: 'Exams', icon: <EventNoteIcon />, authRequired: true },
  { to: '/results', label: 'Results', icon: <BarChartIcon />, authRequired: true },
  { to: '/analytics', label: 'Analytics', icon: <InsightsIcon />, authRequired: true },
]

export default function Layout() {
  const { user, isAuthenticated, isGuest, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(!isMobile)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleNavItems = navItems.filter(
    (item) => !item.authRequired || isAuthenticated
  )

  const drawerWidth = open ? DRAWER_WIDTH : DRAWER_COLLAPSED

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Drawer Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, minHeight: 64 }}>
        {open && (
          <Fade in={open}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 36,
                  height: 36,
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                S
              </Avatar>
              <Typography variant="h6" noWrap sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                School Mgmt
              </Typography>
            </Box>
          </Fade>
        )}
        <IconButton onClick={() => setOpen(!open)} size="small">
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <Divider />

      {/* Navigation List */}
      <List sx={{ flex: 1, py: 1 }}>
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          return (
            <Tooltip key={item.to} title={open ? '' : item.label} placement="right" arrow>
              <ListItemButton
                component={Link}
                to={item.to}
                selected={isActive}
                onClick={() => isMobile && setOpen(false)}
                sx={{
                  minHeight: 44,
                  justifyContent: open ? 'initial' : 'center',
                  px: open ? 2 : 1.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                    color: isActive ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 } } }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          )
        })}
      </List>

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 1.5, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {open ? '© 2026 School Mgmt' : '©'}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* App Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}

            {/* Spacer pushes user info right */}
            <Box sx={{ flex: 1 }} />

            {/* User Info */}
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {(isGuest ? 'G' : user.name?.charAt(0) || 'U').toUpperCase()}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                  {isGuest ? 'Guest' : user.name}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{ ml: 0.5 }}
                >
                  Logout
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<LoginIcon />}
                component={Link}
                to="/login"
              >
                Login
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 2, sm: 3, lg: 4 },
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
