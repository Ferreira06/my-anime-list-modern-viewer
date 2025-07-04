'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Typography,
  Slider,
  Box,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ClearIcon from '@mui/icons-material/Clear'; // Import the clear icon
import type { Anime } from '@/app/data/anime';

export type AnimeUpdateData = Partial<Pick<Anime, 'status' | 'watchedEpisodes' | 'score' | 'startDate' | 'finishDate'>>;

interface AnimeEditDialogProps {
  anime: Anime | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, data: AnimeUpdateData) => void;
  onDelete: () => void;
}

const statusOptions = ['Watching', 'Completed', 'On-Hold', 'Dropped', 'Plan to Watch'];

export default function AnimeEditDialog({ anime, open, onClose, onSave, onDelete }: AnimeEditDialogProps) {
  const [formData, setFormData] = useState<AnimeUpdateData>({});

  useEffect(() => {
    if (anime) {
      setFormData({
        status: anime.status,
        watchedEpisodes: anime.watchedEpisodes,
        score: anime.score,
        startDate: anime.startDate === '0000-00-00' ? '' : anime.startDate,
        finishDate: anime.finishDate === '0000-00-00' ? '' : anime.finishDate,
      });
    }
  }, [anime]);

  if (!anime) return null;

  const handleInputChange = (field: keyof AnimeUpdateData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(anime.id, formData);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { position: 'relative' } }}>
      <DialogTitle sx={{ pr: '48px' }}>
        Edit: {anime.title}
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: 'absolute', right: 12, top: 12, color: (theme) => theme.palette.grey[500] }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ pt: 1 }}>
          <Grid>
            <FormControl fullWidth>
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                label="Status"
                value={formData.status || ''}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                {statusOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid>
            <Typography component="legend">Your Score</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating
                name="score-rating"
                value={(formData.score || 0) / 2}
                precision={0.5}
                size="large"
                onChange={(event, newValue) => handleInputChange('score', (newValue || 0) * 2)}
              />
              <Tooltip title="Clear score">
                {/* Span is for tooltip to work on disabled buttons */}
                <span>
                  <IconButton
                    onClick={() => handleInputChange('score', 0)}
                    disabled={(formData.score || 0) === 0}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>

          <Grid>
            <Typography gutterBottom>
              Progress ({formData.watchedEpisodes} / {anime.episodes || '?'})
            </Typography>
            <Slider
              value={formData.watchedEpisodes || 0}
              onChange={(e, newValue) => handleInputChange('watchedEpisodes', newValue)}
              aria-labelledby="input-slider"
              valueLabelDisplay="auto"
              step={1}
              marks
              min={0}
              max={anime.episodes || 100}
              disabled={!anime.episodes}
            />
          </Grid>

          <Grid>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid>
            <TextField
              fullWidth
              label="Finish Date"
              type="date"
              value={formData.finishDate || ''}
              onChange={(e) => handleInputChange('finishDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px', justifyContent: 'space-between' }}>
        <Button
          onClick={handleDelete}
          color="error"
          startIcon={<DeleteForeverIcon />}
        >
          Delete Anime
        </Button>
        <Box>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ ml: 1 }}>Save Changes</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
