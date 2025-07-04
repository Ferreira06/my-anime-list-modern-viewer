'use client';

import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  AlertTitle,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          minWidth: { xs: '90%', sm: '400px' },
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          {description}
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>Warning</AlertTitle>
            This action is permanent and cannot be undone.
          </Alert>
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 16px' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          Confirm Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
