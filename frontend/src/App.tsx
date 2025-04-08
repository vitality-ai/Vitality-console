import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, IconButton, List, ListItem, ListItemText,
  ListItemSecondaryAction, Divider, Alert, Snackbar, CircularProgress,
  AppBar, Toolbar, Paper, Card, CardContent,
  Tooltip, Avatar, useTheme, ThemeProvider, createTheme,
  Tab, Tabs
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Delete as DeleteIcon, 
  Upload as UploadIcon, 
  Download as DownloadIcon,
  Storage as StorageIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Speed as SpeedIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import axios, { AxiosError } from 'axios';
import { alpha } from '@mui/material/styles';

interface Object {
  key: string;
  size: number;
  content_type: string;
  created_at: string;
}

interface Bucket {
  name: string;
  objects: Object[];
}

interface User {
  email: string;
  storage_used: number;
  storage_quota: number;
}

const defaultTheme = createTheme();

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#3b82f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4ade80',
      light: '#86efac',
      dark: '#22c55e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    divider: 'rgba(148, 163, 184, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #4ade80 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563eb 0%, #22c55e 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(-2px)',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
          },
          transition: 'all 0.3s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        },
        elevation1: {
          boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.08), 0px 2px 4px -1px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
        },
        bar: {
          borderRadius: 8,
          background: 'linear-gradient(135deg, #3b82f6 0%, #4ade80 100%)',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#60a5fa',
        },
        circle: {
          strokeLinecap: 'round',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
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
            background: 'linear-gradient(135deg, #3b82f6 0%, #4ade80 100%)',
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
            color: '#60a5fa',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backdropFilter: 'blur(20px)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          color: '#4ade80',
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#f87171',
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#fbbf24',
        },
        standardInfo: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#60a5fa',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '8px 12px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
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
              borderColor: '#60a5fa',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(148, 163, 184, 0.2)',
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #4ade80 100%)',
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
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [newBucketName, setNewBucketName] = useState('');
  const [createBucketOpen, setCreateBucketOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeOperations, setActiveOperations] = useState<Set<string>>(new Set());
  const [tabValue, setTabValue] = useState(0);
  const [totalOperations, setTotalOperations] = useState({ get: 0, put: 0 });

  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        await Promise.all([fetchUserInfo(), fetchBuckets()]);
      }
      setIsLoading(false);
    };
    initializeApp();
  }, []);

  const handleError = (error: unknown, defaultMessage: string) => {
    if (error instanceof AxiosError) {
      setError(error.response?.data?.detail || defaultMessage);
    } else {
      setError(defaultMessage);
    }
    setTimeout(() => setError(null), 5000);
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google-login`, {
        token: credentialResponse.credential
      });
      
      localStorage.setItem('token', response.data.access_token);
      setIsLoggedIn(true);
      await Promise.all([fetchUserInfo(), fetchBuckets()]);
    } catch (error) {
      handleError(error, 'Failed to login');
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
      const response = await axios.get<Bucket[]>(`${process.env.REACT_APP_API_URL}/api/buckets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBuckets(response.data);
    } catch (error) {
      handleError(error, 'Failed to fetch buckets');
    }
  };

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      setError('Bucket name cannot be empty');
      return;
    }

    const operationKey = `create-bucket-${newBucketName}`;
    setActiveOperations(prev => new Set(prev).add(operationKey));

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/buckets`,
        {
          name: newBucketName,
          owner_id: user?.email || '',
          objects: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreateBucketOpen(false);
      setNewBucketName('');
      await fetchBuckets();
    } catch (error) {
      handleError(error, 'Failed to create bucket');
    } finally {
      setActiveOperations(prev => {
        const next = new Set(prev);
        next.delete(operationKey);
        return next;
      });
    }
  };

  const handleDeleteBucket = async (bucketName: string) => {
    const operationKey = `delete-bucket-${bucketName}`;
    setActiveOperations(prev => new Set(prev).add(operationKey));

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/buckets/${bucketName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await Promise.all([fetchBuckets(), fetchUserInfo()]);
    } catch (error) {
      handleError(error, 'Failed to delete bucket');
    } finally {
      setActiveOperations(prev => {
        const next = new Set(prev);
        next.delete(operationKey);
        return next;
      });
    }
  };

  const handleFileUpload = async (bucketName: string, file: File) => {
    const operationKey = `upload-${bucketName}-${file.name}`;
    setActiveOperations(prev => new Set(prev).add(operationKey));

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/objects/${bucketName}/${file.name}`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            setUploadProgress(prev => ({ ...prev, [operationKey]: percentCompleted }));
          }
        }
      );
      
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[operationKey];
        return next;
      });
      await Promise.all([fetchBuckets(), fetchUserInfo()]);
    } catch (error) {
      handleError(error, 'Failed to upload file');
    } finally {
      setActiveOperations(prev => {
        const next = new Set(prev);
        next.delete(operationKey);
        return next;
      });
    }
  };

  const handleDeleteObject = async (bucketName: string, objectKey: string) => {
    const operationKey = `delete-${bucketName}-${objectKey}`;
    setActiveOperations(prev => new Set(prev).add(operationKey));

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/objects/${bucketName}/${objectKey}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await Promise.all([fetchBuckets(), fetchUserInfo()]);
    } catch (error) {
      handleError(error, 'Failed to delete file');
    } finally {
      setActiveOperations(prev => {
        const next = new Set(prev);
        next.delete(operationKey);
        return next;
      });
    }
  };

  const handleDownloadObject = async (bucketName: string, objectKey: string) => {
    const operationKey = `download-${bucketName}-${objectKey}`;
    setActiveOperations(prev => new Set(prev).add(operationKey));

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/objects/${bucketName}/${objectKey}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', objectKey);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      handleError(error, 'Failed to download file');
    } finally {
      setActiveOperations(prev => {
        const next = new Set(prev);
        next.delete(operationKey);
        return next;
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setBuckets([]);
    setUser(null);
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
    return buckets.reduce((total, bucket) => total + bucket.objects.length, 0);
  };

  const getStoragePercentage = () => {
    if (!user) return 0;
    return Math.round((user.storage_used / user.storage_quota) * 100);
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
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <StorageIcon sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
              <Typography variant="h6" color="primary" noWrap>
                Vitality-AI Storage
              </Typography>
            </Box>
            {isLoggedIn && user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {user.email.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                <Tooltip title="Logout">
                  <IconButton onClick={handleLogout} size="small">
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Snackbar 
            open={!!error} 
            autoHideDuration={5000} 
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="error" onClose={() => setError(null)} variant="filled">
              {error}
            </Alert>
          </Snackbar>

          {!isLoggedIn ? (
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
                Welcome to Vitality-AI Storage
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Secure, scalable object storage for your data needs
              </Typography>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => handleError(new Error('Login Failed'), 'Login Failed')}
              />
            </Paper>
          ) : (
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

                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CloudDownloadIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Typography variant="h6">GET Operations</Typography>
                      </Box>
                      <Typography variant="h4">{totalOperations.get}</Typography>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CloudUploadIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Typography variant="h6">PUT Operations</Typography>
                      </Box>
                      <Typography variant="h4">{totalOperations.put}</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {user && (
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center' }}>
                      <Box sx={{ position: 'relative', width: 120, height: 120 }}>
                        <CircularProgress
                          variant="determinate"
                          value={100}
                          size={120}
                          sx={{ 
                            position: 'absolute',
                            color: (theme) => theme.palette.grey[200],
                          }}
                        />
                        <CircularProgress
                          variant="determinate"
                          value={getStoragePercentage()}
                          size={120}
                          sx={{
                            position: 'absolute',
                            color: 'primary.main',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="h6" component="div" color="text.secondary">
                            {getStoragePercentage()}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          Storage Usage
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {formatSize(user.storage_used)} used of {formatSize(user.storage_quota)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(user.storage_used / user.storage_quota) * 100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'grey.100',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="storage tabs">
                  <Tab label="Buckets" />
                  <Tab label="Usage" />
                  <Tab label="Activity" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Your Buckets</Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => setCreateBucketOpen(true)}
                    disabled={activeOperations.size > 0}
                  >
                    Create Bucket
                  </Button>
                </Box>

                {buckets.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No buckets yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Create your first bucket to start storing files
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      onClick={() => setCreateBucketOpen(true)}
                    >
                      Create Bucket
                    </Button>
                  </Paper>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {buckets.map((bucket) => (
                      <Card key={bucket.name}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">{bucket.name}</Typography>
                            <Box>
                              <input
                                type="file"
                                id={`upload-${bucket.name}`}
                                style={{ display: 'none' }}
                                onChange={(e) => e.target.files && handleFileUpload(bucket.name, e.target.files[0])}
                                disabled={activeOperations.has(`upload-${bucket.name}`)}
                              />
                              <label htmlFor={`upload-${bucket.name}`}>
                                <Tooltip title="Upload file">
                                  <IconButton 
                                    component="span" 
                                    color="primary"
                                    disabled={activeOperations.has(`upload-${bucket.name}`)}
                                  >
                                    <UploadIcon />
                                  </IconButton>
                                </Tooltip>
                              </label>
                              <Tooltip title="Delete bucket">
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleDeleteBucket(bucket.name)}
                                  disabled={activeOperations.has(`delete-bucket-${bucket.name}`)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          {Object.entries(uploadProgress).map(([key, progress]) => {
                            if (key.startsWith(`upload-${bucket.name}`)) {
                              return (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Uploading...
                                  </Typography>
                                  <LinearProgress 
                                    key={key}
                                    variant="determinate" 
                                    value={progress} 
                                    sx={{ 
                                      height: 6, 
                                      borderRadius: 3,
                                      bgcolor: 'grey.100',
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                      }
                                    }} 
                                  />
                                </Box>
                              );
                            }
                            return null;
                          })}

                          {bucket.objects.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                No files in this bucket
                              </Typography>
                            </Box>
                          ) : (
                            <List>
                              {bucket.objects.map((obj) => (
                                <React.Fragment key={obj.key}>
                                  <ListItem
                                    secondaryAction={
                                      <Box>
                                        <Tooltip title="Download file">
                                          <IconButton 
                                            edge="end" 
                                            onClick={() => handleDownloadObject(bucket.name, obj.key)}
                                            disabled={activeOperations.has(`download-${bucket.name}-${obj.key}`)}
                                            sx={{ mr: 1 }}
                                          >
                                            {activeOperations.has(`download-${bucket.name}-${obj.key}`) ? (
                                              <CircularProgress size={24} />
                                            ) : (
                                              <DownloadIcon />
                                            )}
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete file">
                                          <IconButton 
                                            edge="end" 
                                            onClick={() => handleDeleteObject(bucket.name, obj.key)}
                                            disabled={activeOperations.has(`delete-${bucket.name}-${obj.key}`)}
                                            color="error"
                                          >
                                            {activeOperations.has(`delete-${bucket.name}-${obj.key}`) ? (
                                              <CircularProgress size={24} />
                                            ) : (
                                              <DeleteIcon />
                                            )}
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                    }
                                  >
                                    <ListItemText
                                      primary={obj.key}
                                      secondary={
                                        <Typography variant="body2" color="text.secondary">
                                          {formatSize(obj.size)} • {new Date(obj.created_at).toLocaleString()}
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                  <Divider />
                                </React.Fragment>
                              ))}
                            </List>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  Storage Usage Details
                </Typography>
                {/* Add detailed storage usage charts/graphs here */}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                {/* Add activity log/history here */}
              </TabPanel>
            </Box>
          )}
        </Container>
      </Box>

      <Dialog 
        open={createBucketOpen} 
        onClose={() => setCreateBucketOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Bucket</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Buckets are containers for storing files. Choose a unique name for your bucket.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Bucket Name"
            fullWidth
            value={newBucketName}
            onChange={(e) => setNewBucketName(e.target.value)}
            error={!!newBucketName && !/^[a-z0-9-]+$/.test(newBucketName)}
            helperText={newBucketName && !/^[a-z0-9-]+$/.test(newBucketName) ? 
              "Bucket name can only contain lowercase letters, numbers, and hyphens" : ""}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateBucketOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateBucket} 
            variant="contained" 
            color="primary"
            disabled={!newBucketName.trim() || !/^[a-z0-9-]+$/.test(newBucketName)}
          >
            Create Bucket
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
