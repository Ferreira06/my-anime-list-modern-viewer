// app/components/AddSortDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface AddSortDialogProps {
  open: boolean;
  onClose: () => void;
  onAddSort: (name: string) => void;
  existingSortNames: string[];
}

export default function AddSortDialog({ open, onClose, onAddSort, existingSortNames }: AddSortDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName('');
      setError('');
    }
  }, [open]);

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Sort name cannot be empty.');
      return;
    }
    // Check for duplicates, ignoring case and spaces
    const isDuplicate = existingSortNames.some(
      (existing) => existing.toLowerCase().replace(/\s+/g, '_') === trimmedName.toLowerCase().replace(/\s+/g, '_')
    );
    if (isDuplicate) {
      setError(`A sort named "${trimmedName}" already exists.`);
      return;
    }

    onAddSort(trimmedName);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form' }}>
      <DialogTitle>Add New Custom Sort</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{mb: 2}}>
          Enter a name for your new sort order. You'll be able to arrange anime by dragging and dropping when this sort is active.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Sort Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 16px' }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleAdd} variant="contained">Add</Button>
      </DialogActions>
    </Dialog>
  );
}