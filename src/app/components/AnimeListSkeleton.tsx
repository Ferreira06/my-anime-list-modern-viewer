// app/components/AnimeListSkeleton.tsx
import React from 'react';
import { Paper, Box, Skeleton } from '@mui/material';

const SkeletonCard = () => (
    <Paper elevation={1} sx={{ display: 'flex', p: 2, mb: 2, alignItems: 'center' }}>
        <Skeleton variant="rectangular" width={24} height={24} sx={{ mr: 2, borderRadius: 1 }}/>
        <Skeleton variant="rectangular" width={90} height={120} sx={{ mr: 2, borderRadius: 2 }} />
        <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="50%" sx={{ mt: 1 }} />
        </Box>
    </Paper>
);


export default function AnimeListSkeleton() {
  return (
    <Box>
        {[...Array(5)].map((_, index) => (
           <SkeletonCard key={index} />
        ))}
    </Box>
  );
}