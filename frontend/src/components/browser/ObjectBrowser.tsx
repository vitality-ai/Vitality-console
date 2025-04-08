import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';
import FileIcon from '@mui/icons-material/InsertDriveFile';

interface FileObject {
  name: string;
  size: number;
  lastModified: string;
  type: string;
}

interface ObjectBrowserProps {
  bucketName: string;
  onRefresh: () => void;
  onUpload: (files: FileList) => void;
}

export const ObjectBrowser = ({ bucketName, onRefresh, onUpload }: ObjectBrowserProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  // Dummy data - replace with actual data from your backend
  const files: FileObject[] = [
    {
      name: 'example.txt',
      size: 1024,
      lastModified: '2024-01-20T10:00:00',
      type: 'text/plain',
    },
    {
      name: 'image.jpg',
      size: 1024 * 1024,
      lastModified: '2024-01-20T11:00:00',
      type: 'image/jpeg',
    },
  ];

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleString();
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(filteredFiles.map(file => file.name));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (name: string) => {
    const newSelected = selected.includes(name)
      ? selected.filter(item => item !== name)
      : [...selected, name];
    setSelected(newSelected);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography variant="h6" sx={{ mr: 2 }}>Object Browser</Typography>
        <TextField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Start typing to filter objects in the bucket"
          variant="outlined"
          size="small"
          sx={{ 
            flex: 1, 
            mx: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }
          }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Bucket Info */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2, 
        bgcolor: 'background.paper'
      }}>
        <Box>
          <Typography variant="h6">{bucketName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {files.length} objects
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            component="label"
          >
            Upload
            <input
              type="file"
              hidden
              multiple
              onChange={(e) => e.target.files && onUpload(e.target.files)}
            />
          </Button>
        </Box>
      </Box>

      {/* File List */}
      <TableContainer component={Paper} sx={{ flex: 1, bgcolor: 'background.paper' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selected.length === filteredFiles.length}
                  indeterminate={selected.length > 0 && selected.length < filteredFiles.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell align="right">Size</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFiles.map((file) => (
              <TableRow
                key={file.name}
                hover
                selected={selected.includes(file.name)}
                onClick={() => handleSelect(file.name)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell padding="checkbox">
                  <Checkbox checked={selected.includes(file.name)} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: 'text.secondary' }} />
                    {file.name}
                  </Box>
                </TableCell>
                <TableCell>{formatDate(file.lastModified)}</TableCell>
                <TableCell align="right">{formatSize(file.size)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 