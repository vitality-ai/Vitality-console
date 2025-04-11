import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ApiKey, ApiKeyResponse } from '../types';

interface DeveloperSettingsProps {
  apiKeys: ApiKey[];
  onGenerateKey: () => Promise<ApiKeyResponse>;
  onDeleteKey: () => Promise<void>;
  onCopyToClipboard: (text: string) => void;
}

const DeveloperSettings: React.FC<DeveloperSettingsProps> = ({ 
  apiKeys, 
  onGenerateKey, 
  onDeleteKey,
  onCopyToClipboard 
}) => {
  const [newKey, setNewKey] = useState<ApiKeyResponse | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateKey = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const key = await onGenerateKey();
      setNewKey(key);
      setShowDialog(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onDeleteKey();
      setShowConfirmDialog(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete API key');
    } finally {
      setIsLoading(false);
    }
  };

  const hasExistingKey = apiKeys.length > 0;

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Developer Settings
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                API Key
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate an API key to access your storage programmatically
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleGenerateKey}
              disabled={isLoading || hasExistingKey}
            >
              {isLoading ? 'Generating...' : 'Generate API Key'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {hasExistingKey ? (
            <Box>
              {apiKeys.map((key) => (
                <Box key={key.access_key} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2">Access Key:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {key.access_key}
                      </Typography>
                      <Tooltip title="Copy Access Key">
                        <IconButton 
                          size="small" 
                          onClick={() => onCopyToClipboard(key.access_key)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Created: {new Date(key.created_at).toLocaleString()}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={isLoading}
                    >
                      Delete Key
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No API key generated yet. Generate one to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog to show the newly generated keys */}
      <Dialog 
        open={showDialog} 
        onClose={() => {
          setShowDialog(false);
          setShowSecret(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>API Key Generated</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Save your secret key now. You won't be able to see it again!
          </Alert>

          <Typography variant="subtitle2" gutterBottom>
            Access Key:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              value={newKey?.access_key || ''}
              InputProps={{ readOnly: true }}
              size="small"
            />
            <IconButton 
              onClick={() => newKey && onCopyToClipboard(newKey.access_key)}
              sx={{ ml: 1 }}
            >
              <CopyIcon />
            </IconButton>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Secret Key:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TextField
              fullWidth
              type={showSecret ? 'text' : 'password'}
              value={newKey?.secret_key || ''}
              InputProps={{ readOnly: true }}
              size="small"
            />
            <IconButton 
              onClick={() => setShowSecret(!showSecret)}
              sx={{ ml: 1 }}
            >
              {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
            <IconButton 
              onClick={() => newKey && onCopyToClipboard(newKey.secret_key)}
              sx={{ ml: 1 }}
            >
              <CopyIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Example usage:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={`import boto3

s3_client = boto3.client('s3',
    aws_access_key_id='${newKey?.access_key || 'YOUR_ACCESS_KEY'}',
    aws_secret_access_key='${newKey?.secret_key || 'YOUR_SECRET_KEY'}',
    endpoint_url='${process.env.REACT_APP_API_URL}',
    region_name='auto'
)`}
            InputProps={{ readOnly: true }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowDialog(false);
              setShowSecret(false);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete API Key</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your API key? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowConfirmDialog(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteKey}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeveloperSettings; 