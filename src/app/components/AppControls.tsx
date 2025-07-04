'use client';

import React, { useState, useRef } from 'react';
import {
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import AddSortDialog from './AddSortDialog';
import type { AnimeOrders } from '@/app/data/anime';

const formatSortName = (key: string) => {
    if (key.startsWith('custom_')) {
        return key.substring(7).replace(/_/g, ' ');
    }
    return key;
};

interface AppControlsProps {
  sortBy: string;
  filterStatus: string;
  searchTerm: string;
  newAnimeTitle: string;
  isAdding: boolean;
  uniqueStatuses: string[];
  customAnimeOrders: AnimeOrders;
  onSortChange: (event: SelectChangeEvent<string>) => void;
  onFilterChange: (event: SelectChangeEvent<string>) => void;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNewAnimeTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddNewAnime: () => void;
  onAddSort: (name: string) => void;
  onClearFilters: () => void;
  onImport: (file: File) => void;
}

export default function AppControls({
  sortBy,
  filterStatus,
  searchTerm,
  newAnimeTitle,
  isAdding,
  uniqueStatuses,
  customAnimeOrders,
  onSortChange,
  onFilterChange,
  onSearchChange,
  onNewAnimeTitleChange,
  onAddNewAnime,
  onAddSort,
  onClearFilters,
  onImport,
}: AppControlsProps) {
  const [isSortDialogOpen, setSortDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSortSelectChange = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    if (value === 'add_new_sort') {
      setSortDialogOpen(true);
    } else {
      onSortChange(event);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      event.target.value = '';
    }
  };

  const existingSortNames = Object.keys(customAnimeOrders);
  const isFiltered = filterStatus !== 'All' || searchTerm !== '';

  return (
    <>
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid >
            <FormControl fullWidth>
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                label="Sort By"
                onChange={handleSortSelectChange}
                renderValue={(selected) => (
                    <Typography noWrap sx={{ textTransform: 'capitalize' }}>
                        {formatSortName(selected)}
                    </Typography>
                )}
              >
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="score">Score</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="episodes">Total Episodes</MenuItem>
                <MenuItem value="watchedEpisodes">Watched Episodes</MenuItem>
                <MenuItem value="startDate">Start Date</MenuItem>
                <Divider sx={{ my: 1 }} />
                {Object.keys(customAnimeOrders).map((key) => (
                    <MenuItem key={key} value={key} sx={{textTransform: 'capitalize'}}>
                       {formatSortName(key)}
                    </MenuItem>
                ))}
                <MenuItem value="add_new_sort">
                    <ListItemIcon><PlaylistAddIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Add New Sort</ListItemText>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid>
            <FormControl fullWidth>
              <InputLabel id="filter-status-label">Filter</InputLabel>
              <Select
                labelId="filter-status-label"
                value={filterStatus}
                label="Filter"
                onChange={onFilterChange}
              >
                {uniqueStatuses.map((status: string) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid >
            <TextField
              fullWidth
              label="Search Anime"
              variant="outlined"
              value={searchTerm}
              onChange={onSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          {isFiltered && (
            <Grid>
                <Tooltip title="Clear Filters & Search">
                    <Button
                        fullWidth
                        onClick={onClearFilters}
                        variant="outlined"
                        color="secondary"
                        sx={{ height: '56px' }}
                    >
                        <ClearAllIcon />
                    </Button>
                </Tooltip>
            </Grid>
          )}
          <Grid >
            <TextField
                fullWidth
                label="Add New Anime by Title"
                variant="outlined"
                value={newAnimeTitle}
                onChange={onNewAnimeTitleChange}
                onKeyDown={(e) => e.key === 'Enter' && onAddNewAnime()}
                disabled={isAdding}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <Tooltip title="Add Anime">
                                <span> 
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={onAddNewAnime}
                                        disabled={isAdding || !newAnimeTitle.trim()}
                                        sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, height: '56px', px: 3 }}
                                    >
                                        {isAdding ? <CircularProgress size={24} color="inherit" /> : <AddIcon />}
                                    </Button>
                                </span>
                            </Tooltip>
                        </InputAdornment>
                    ),
                    sx: { paddingRight: 0 }
                }}
            />
          </Grid>
          <Grid >
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<UploadFileIcon />}
              onClick={handleImportClick}
              disabled={isAdding}
              sx={{ height: '56px' }}
            >
              Import
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xml"
              style={{ display: 'none' }}
            />
          </Grid>
        </Grid>
      </Paper>
      <AddSortDialog
        open={isSortDialogOpen}
        onClose={() => setSortDialogOpen(false)}
        onAddSort={onAddSort}
        existingSortNames={existingSortNames}
      />
    </>
  );
}