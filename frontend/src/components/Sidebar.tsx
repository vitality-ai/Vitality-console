import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Code as CodeIcon,
} from '@mui/icons-material';

export type ViewType = 'dashboard' | 'developer';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    {
      text: 'Dashboard',
      icon: DashboardIcon,
      value: 'dashboard' as ViewType,
    },
    {
      text: 'Developer Settings',
      icon: CodeIcon,
      value: 'developer' as ViewType,
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Toolbar /> {/* Spacer for AppBar */}
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.value}
              selected={currentView === item.value}
              onClick={() => onViewChange(item.value)}
            >
              <ListItemIcon>
                <item.icon color={currentView === item.value ? 'primary' : undefined} />
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  color: currentView === item.value ? 'primary' : 'textPrimary',
                  fontWeight: currentView === item.value ? 600 : 400,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 