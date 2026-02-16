import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, IconButton, Alert, CircularProgress,
  AppBar, Toolbar, Paper, Card, CardContent,
  Tooltip, Avatar, ThemeProvider, createTheme,
  Tab, Tabs, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Storage as StorageIcon,
  Logout as LogoutIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import axios, { AxiosError } from 'axios';
import Sidebar, { ViewType } from './components/Sidebar';
import DeveloperSettings from './components/DeveloperSettings';
import { ApiKey, ApiKeyResponse } from './types';

const hasGoogleAuth = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim());

interface BucketSummary {
  name: string;
  object_count: number;
  total_size: number;
  type?: string;
  access_policies?: string | null;
}

interface UsageSummary {
  storage_used: number;
  storage_quota: number;
  object_count: number;
}

interface User {
  email: string;
  full_name?: string;
  picture?: string;
}

const defaultTheme = createTheme();

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#22d3ee',
      light: '#67e8f9',
      dark: '#06b6d4',
      contrastText: '#0c1222',
    },
    secondary: {
      main: '#a78bfa',
      light: '#c4b5fd',
      dark: '#8b5cf6',
      contrastText: '#0c1222',
    },
    background: {
      default: '#0c1222',
      paper: 'rgba(18, 24, 42, 0.85)',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      disabled: '#64748b',
    },
    error: {
      main: '#f87171',
      light: '#fca5a5',
      dark: '#ef4444',
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
    },
    info: {
      main: '#22d3ee',
      light: '#67e8f9',
      dark: '#06b6d4',
    },
    warning: {
      main: '#fbbf24',
      light: '#fcd34d',
      dark: '#f59e0b',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
  },
  typography: {
    fontFamily: '"Outfit", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.25)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 0 24px rgba(34, 211, 238, 0.35)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #67e8f9 100%)',
          color: '#0c1222',
          '&:hover': {
            background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
            boxShadow: '0 0 28px rgba(34, 211, 238, 0.4)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)',
          color: '#0c1222',
          '&:hover': {
            background: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 50%, #a78bfa 100%)',
            boxShadow: '0 0 24px rgba(167, 139, 250, 0.35)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(18, 24, 42, 0.6)',
          border: '1px solid rgba(34, 211, 238, 0.08)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(34, 211, 238, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 40px rgba(34, 211, 238, 0.06)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(18, 24, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          backdropFilter: 'blur(12px)',
        },
        elevation1: {
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(12, 18, 34, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(34, 211, 238, 0.1)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: 'rgba(34, 211, 238, 0.12)',
        },
        bar: {
          borderRadius: 8,
          background: 'linear-gradient(90deg, #06b6d4 0%, #22d3ee 50%, #a78bfa 100%)',
          boxShadow: '0 0 12px rgba(34, 211, 238, 0.4)',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          strokeLinecap: 'round',
          color: '#22d3ee',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': {
            backgroundColor: 'rgba(34, 211, 238, 0.06)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': {
            backgroundColor: 'rgba(34, 211, 238, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(34, 211, 238, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(34, 211, 238, 0.16)',
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            background: 'linear-gradient(90deg, #22d3ee 0%, #a78bfa 100%)',
            boxShadow: '0 0 12px rgba(34, 211, 238, 0.5)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          '&.Mui-selected': {
            color: '#22d3ee',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          borderColor: 'rgba(52, 211, 153, 0.3)',
          color: '#34d399',
        },
        standardError: {
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          borderColor: 'rgba(248, 113, 113, 0.3)',
          color: '#f87171',
        },
        standardWarning: {
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          borderColor: 'rgba(251, 191, 36, 0.3)',
          color: '#fbbf24',
        },
        standardInfo: {
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          borderColor: 'rgba(34, 211, 238, 0.3)',
          color: '#22d3ee',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(18, 24, 42, 0.95)',
          border: '1px solid rgba(34, 211, 238, 0.2)',
          borderRadius: 10,
          fontSize: '0.75rem',
          padding: '8px 12px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          background: 'linear-gradient(180deg, rgba(18, 24, 42, 0.98) 0%, rgba(12, 18, 34, 0.98) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.15)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 60px rgba(34, 211, 238, 0.08)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(34, 211, 238, 0.4)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#22d3ee',
              boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.2)',
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #06b6d4 0%, #a78bfa 100%)',
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
        },
      },
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [buckets, setBuckets] = useState<BucketSummary[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [emailAuthMode, setEmailAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [createBucketOpen, setCreateBucketOpen] = useState(false);
  const [createBucketName, setCreateBucketName] = useState('');
  const [createBucketType, setCreateBucketType] = useState<string>('general_purpose');
  const [createBucketPolicies, setCreateBucketPolicies] = useState('');
  const [createBucketSubmitting, setCreateBucketSubmitting] = useState(false);
  const [createBucketError, setCreateBucketError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        await Promise.all([fetchUserInfo(), fetchBuckets(), fetchUsage(), fetchApiKeys()]);
      }
      setIsLoading(false);
    };
    initializeApp();
  }, []);

  // Refetch buckets and usage when user opens Storage tab so S3 uploads are reflected
  useEffect(() => {
    if (!isLoggedIn || currentView !== 'dashboard') return;
    if (tabValue === 0 || tabValue === 1) {
      fetchBuckets();
      fetchUsage();
    }
  }, [isLoggedIn, currentView, tabValue]);

  const handleError = (error: unknown, defaultMessage: string) => {
    if (error instanceof AxiosError) {
      setError(error.response?.data?.detail || defaultMessage);
    } else {
      setError(defaultMessage);
    }
    setTimeout(() => setError(null), 5000);
  };

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<UsageSummary>(`${process.env.REACT_APP_API_URL}/api/buckets/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsage(response.data);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
      setUsage({ storage_used: 0, storage_quota: 5 * 1024 ** 3, object_count: 0 });
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google-login`, {
        token: credentialResponse.credential
      });
      localStorage.setItem('token', response.data.access_token);
      setIsLoggedIn(true);
      await Promise.all([fetchUserInfo(), fetchBuckets(), fetchUsage(), fetchApiKeys()]);
    } catch (error) {
      handleError(error, 'Failed to login');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = emailAuthMode === 'login'
        ? `${process.env.REACT_APP_API_URL}/api/auth/login`
        : `${process.env.REACT_APP_API_URL}/api/auth/register`;
      const payload = emailAuthMode === 'login'
        ? { email, password }
        : { email, password, full_name: fullName || email.split('@')[0] };
      const response = await axios.post(url, payload);
      localStorage.setItem('token', response.data.access_token);
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');
      setFullName('');
      await Promise.all([fetchUserInfo(), fetchBuckets(), fetchUsage(), fetchApiKeys()]);
    } catch (error) {
      handleError(error, emailAuthMode === 'login' ? 'Login failed' : 'Registration failed');
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<User>(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      handleError(error, 'Failed to fetch user info');
    }
  };

  const fetchBuckets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<BucketSummary[]>(`${process.env.REACT_APP_API_URL}/api/buckets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBuckets(response.data);
    } catch (error) {
      handleError(error, 'Failed to fetch buckets');
    }
  };

  const handleCreateBucketOpen = () => {
    setCreateBucketName('');
    setCreateBucketType('general_purpose');
    setCreateBucketPolicies('');
    setCreateBucketError(null);
    setCreateBucketOpen(true);
  };

  const handleCreateBucketSubmit = async () => {
    setCreateBucketError(null);
    if (!createBucketName.trim()) {
      setCreateBucketError('Bucket name is required');
      return;
    }
    setCreateBucketSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/buckets`,
        {
          name: createBucketName.trim(),
          type: createBucketType,
          access_policies: createBucketPolicies.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreateBucketOpen(false);
      await fetchBuckets();
      await fetchUsage();
    } catch (err) {
      if (err instanceof AxiosError) {
        const detail = err.response?.data?.detail;
        setCreateBucketError(typeof detail === 'string' ? detail : 'Failed to create bucket');
      } else {
        setCreateBucketError('Failed to create bucket');
      }
    } finally {
      setCreateBucketSubmitting(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(response.data.api_keys);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      // Don't show error to user as this is not critical
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      setUser(null);
      setBuckets([]);
      setUsage(null);
      setTabValue(0);
      setLogoutDialogOpen(false);
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (error) {
        console.log('Logout cleanup error:', error);
      }

      window.location.href = '/';
    } catch (error) {
      handleError(error, 'Failed to logout');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTotalObjectCount = () => {
    return usage?.object_count ?? buckets.reduce((total, b) => total + b.object_count, 0);
  };

  const getStoragePercentage = () => {
    if (!usage || usage.storage_quota <= 0) return 0;
    return Math.round((usage.storage_used / usage.storage_quota) * 100);
  };

  const handleGenerateApiKey = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/generate-api-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate API key');
      }

      const data = await response.json();
      const formattedKey: ApiKeyResponse = {
        access_key: data.access_key,
        secret_key: data.secret_key,
        created_at: new Date().toISOString(),
        status: 'active'
      };
      
      setApiKeys([...apiKeys, formattedKey]);
      return formattedKey;
    } catch (error) {
      console.error('Error generating API key:', error);
      throw error;
    }
  };

  const handleDeleteApiKey = async () => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/auth/api-keys`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to delete API key');
      }

      setApiKeys([]); // Clear the API keys since user can only have one
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setError('Copied to clipboard!');
    setTimeout(() => setError(null), 3000);
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          bgcolor: 'background.default' 
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <StorageIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <CircularProgress />
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        {user && (
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
          />
        )}

        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <StorageIcon sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
                <Typography variant="h6" color="primary" noWrap>
                  Vitality-AI Storage
                </Typography>
              </Box>
              {user && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {user.email.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Tooltip title="Logout">
                    <IconButton onClick={() => setLogoutDialogOpen(true)} size="small">
                      <LogoutIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Toolbar>
          </AppBar>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              mt: 8,
              ml: user ? '240px' : 0,
            }}
          >
            {!user ? (
              <Paper sx={{ 
                p: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                maxWidth: 400,
                mx: 'auto',
                mt: 8
              }}>
                <StorageIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Welcome to Vitality Console
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  Sign in to manage API keys and view usage
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <Tabs value={emailAuthMode === 'login' ? 0 : 1} onChange={(_, v) => setEmailAuthMode(v === 0 ? 'login' : 'register')} sx={{ mb: 2 }}>
                  <Tab label="Log in" />
                  <Tab label="Register" />
                </Tabs>
                <Box component="form" onSubmit={handleEmailSubmit} sx={{ width: '100%', mb: 3 }}>
                  {emailAuthMode === 'register' && (
                    <TextField
                      fullWidth
                      label="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      margin="normal"
                      size="small"
                    />
                  )}
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    margin="normal"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    margin="normal"
                    size="small"
                  />
                  <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
                    {emailAuthMode === 'login' ? 'Log in' : 'Register'}
                  </Button>
                </Box>
                {hasGoogleAuth ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>or</Typography>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => handleError(new Error('Login Failed'), 'Login Failed')}
                    />
                  </>
                ) : (
                  <Alert severity="info" sx={{ width: '100%', mt: 2 }}>
                    Google sign-in is not set up yet. Please use email above to register or log in.
                  </Alert>
                )}
              </Paper>
            ) : (
              currentView === 'dashboard' ? (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Storage Dashboard
                  </Typography>

                  <Box sx={{ mb: 4, mt: 3 }}>
                    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <FolderIcon sx={{ color: 'primary.main', mr: 1 }} />
                            <Typography variant="h6">Buckets</Typography>
                          </Box>
                          <Typography variant="h4">{buckets.length}</Typography>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <FileIcon sx={{ color: 'primary.main', mr: 1 }} />
                            <Typography variant="h6">Objects</Typography>
                          </Box>
                          <Typography variant="h4">{getTotalObjectCount()}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>

                  <Card sx={{ mb: 4 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center' }}>
                        <Box sx={{ position: 'relative', width: 120, height: 120 }}>
                          <CircularProgress
                            variant="determinate"
                            value={100}
                            size={120}
                            sx={{ position: 'absolute', color: 'rgba(148, 163, 184, 0.2)' }}
                          />
                          <CircularProgress
                            variant="determinate"
                            value={usage ? getStoragePercentage() : 0}
                            size={120}
                            sx={{ position: 'absolute', color: 'primary.main' }}
                          />
                          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h6" component="div" color="text.secondary">
                              {usage ? `${getStoragePercentage()}%` : '…'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom>Storage Usage (read-only)</Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {usage
                              ? `${formatSize(usage.storage_used)} used of ${formatSize(usage.storage_quota)}`
                              : 'Loading…'}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={usage && usage.storage_quota > 0 ? (usage.storage_used / usage.storage_quota) * 100 : 0}
                            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(34, 211, 238, 0.12)', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Create buckets here; upload files via Warpdrive S3 API.
                          </Typography>
                          <Tooltip title="Refresh usage and bucket stats">
                            <IconButton size="small" onClick={() => { fetchBuckets(); fetchUsage(); }} sx={{ mt: 1 }}>
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="storage tabs">
                      <Tab label="Buckets" />
                      <Tab label="Usage" />
                      <Tab label="Activity" />
                    </Tabs>
                  </Box>

                  <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                      <Typography variant="h6">Your Buckets</Typography>
                      <Button variant="contained" onClick={handleCreateBucketOpen} startIcon={<FolderIcon />}>
                        Create bucket
                      </Button>
                    </Box>
                    {buckets.length === 0 ? (
                      <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No buckets yet</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Create a bucket here to get started. Object counts and sizes are synced from Warpdrive when you upload via S3.
                        </Typography>
                      </Paper>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {buckets.map((bucket) => (
                          <Card key={bucket.name}>
                            <CardContent>
                              <Typography variant="h6">{bucket.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {bucket.type === 'ai_training' ? 'AI training' : 'General purpose'}
                                {' • '}
                                {bucket.object_count} objects • {formatSize(bucket.total_size)}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <Typography variant="h6" gutterBottom>Storage Usage Details</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {usage
                        ? `${formatSize(usage.storage_used)} of ${formatSize(usage.storage_quota)} used • ${usage.object_count} objects`
                        : 'Loading…'}
                    </Typography>
                  </TabPanel>
                  <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" gutterBottom>Activity</Typography>
                    <Typography variant="body2" color="text.secondary">Activity is tracked in Warpdrive.</Typography>
                  </TabPanel>
                </Box>
              ) : (
                <DeveloperSettings 
                  apiKeys={apiKeys}
                  onGenerateKey={handleGenerateApiKey}
                  onDeleteKey={handleDeleteApiKey}
                  onCopyToClipboard={copyToClipboard}
                />
              )
            )}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={createBucketOpen}
        onClose={() => !createBucketSubmitting && setCreateBucketOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create bucket</DialogTitle>
        <DialogContent>
          {createBucketError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCreateBucketError(null)}>
              {createBucketError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Bucket name"
            fullWidth
            value={createBucketName}
            onChange={(e) => setCreateBucketName(e.target.value)}
            placeholder="e.g. my-data"
            helperText="3–63 characters, lowercase letters, numbers, hyphens or dots"
          />
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
            <InputLabel id="create-bucket-type-label">Bucket type</InputLabel>
            <Select
              labelId="create-bucket-type-label"
              label="Bucket type"
              value={createBucketType}
              onChange={(e) => setCreateBucketType(e.target.value)}
            >
              <MenuItem value="general_purpose">General purpose storage</MenuItem>
              <MenuItem value="ai_training">AI training</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Access policies (optional)"
            fullWidth
            multiline
            minRows={2}
            value={createBucketPolicies}
            onChange={(e) => setCreateBucketPolicies(e.target.value)}
            placeholder='JSON e.g. {"read": ["*"]}'
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateBucketOpen(false)} disabled={createBucketSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateBucketSubmit}
            variant="contained"
            disabled={createBucketSubmitting}
          >
            {createBucketSubmitting ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to log out? You will need to log in again to access your storage.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setLogoutDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleLogout}
            variant="contained"
            color="primary"
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
