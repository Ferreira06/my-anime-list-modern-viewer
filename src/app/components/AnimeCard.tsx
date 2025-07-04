'use client';

import React, { useState, useEffect } from 'react';
import {
  Chip,
  Stack,
  Typography,
  Paper,
  Box,
  styled,
  useTheme,
  LinearProgress,
  Rating,
  Tooltip,
  IconButton,
  TextField,
  Link
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PhotoIcon from '@mui/icons-material/Photo';
import StarIcon from '@mui/icons-material/Star';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Anime } from '@/app/data/anime';

const AnimeCoverImage = styled('img')({
  width: 100,
  height: 140,
  objectFit: 'cover',
  borderRadius: 8,
  flexShrink: 0,
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  transition: 'transform 0.3s ease',
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Watching': return 'primary';
    case 'Completed': return 'success';
    case 'Plan to Watch': return 'info';
    case 'Dropped': return 'error';
    case 'On-Hold': return 'warning';
    default: return 'default';
  }
};

interface AnimeCardProps {
  anime: Anime;
  rank: number;
  isDragDisabled: boolean;
  onDelete: () => void;
  onRankChange: (animeId: number, newRank: number) => void;
  onEpisodeUpdate: (animeId: number, newWatchedCount: number) => void;
  onOpenEditDialog: () => void;
}

export default function AnimeCard({ anime, rank, isDragDisabled, onDelete, onRankChange, onEpisodeUpdate, onOpenEditDialog }: AnimeCardProps) {
  const theme = useTheme();
  const [isEditingRank, setIsEditingRank] = useState(false);
  const [rankInputValue, setRankInputValue] = useState(String(rank));
  const [isEditingEpisodes, setIsEditingEpisodes] = useState(false);
  const [episodeInputValue, setEpisodeInputValue] = useState(String(anime.watchedEpisodes));

  useEffect(() => { setRankInputValue(String(rank)); }, [rank]);
  useEffect(() => { setEpisodeInputValue(String(anime.watchedEpisodes)); }, [anime.watchedEpisodes]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: anime.id, disabled: isDragDisabled || isEditingRank || isEditingEpisodes });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'all 0.2s ease-in-out',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : 1,
    boxShadow: isDragging ? theme.shadows[8] : theme.shadows[1],
  };

  const progress = anime.episodes > 0 ? (anime.watchedEpisodes / anime.episodes) * 100 : 0;
  const justWatchUrl = `https://www.justwatch.com/br/busca?q=${encodeURIComponent(anime.title)}`;

  const handleDeleteClick = (event: React.MouseEvent) => { event.stopPropagation(); onDelete(); };
  const handleRankClick = (event: React.MouseEvent) => { event.stopPropagation(); if (!isDragDisabled) setIsEditingRank(true); };
  const handleEpisodeClick = (event: React.MouseEvent) => { event.stopPropagation(); setIsEditingEpisodes(true); };
  
  const handleIncrementEpisode = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newCount = anime.watchedEpisodes + 1;
    if (anime.episodes === 0 || newCount <= anime.episodes) {
      onEpisodeUpdate(anime.id, newCount);
    }
  };

  const handleRankCommit = () => {
    const newRank = parseInt(rankInputValue, 10);
    if (!isNaN(newRank) && newRank !== rank) {
      onRankChange(anime.id, newRank);
    }
    setIsEditingRank(false);
  };

  const handleRankInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') handleRankCommit();
    else if (event.key === 'Escape') {
      setRankInputValue(String(rank));
      setIsEditingRank(false);
    }
  };

  const handleEpisodeCommit = () => {
    let newCount = parseInt(episodeInputValue, 10);
    if (isNaN(newCount)) { newCount = anime.watchedEpisodes; }
    newCount = Math.max(0, newCount);
    if (anime.episodes > 0) {
      newCount = Math.min(newCount, anime.episodes);
    }
    if (newCount !== anime.watchedEpisodes) {
      onEpisodeUpdate(anime.id, newCount);
    }
    setIsEditingEpisodes(false);
  };

  const handleEpisodeInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') handleEpisodeCommit();
    else if (event.key === 'Escape') {
      setEpisodeInputValue(String(anime.watchedEpisodes));
      setIsEditingEpisodes(false);
    }
  };

  const RankControl = (
    <Stack direction="column" alignItems="center" justifyContent="center" sx={{ width: 40, flexShrink: 0, alignSelf: 'center', mr: 1 }} onClick={(e) => e.stopPropagation()}>
      {!isDragDisabled && isEditingRank ? (
        <TextField value={rankInputValue} onChange={(e) => setRankInputValue(e.target.value)} onKeyDown={handleRankInputKeyDown} onBlur={handleRankCommit} autoFocus type="number" size="small" inputProps={{ style: { textAlign: 'center', MozAppearance: 'textfield' }, min: 1 }} sx={{ width: '48px', '& .MuiOutlinedInput-root': { height: '40px' }, '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0, }, }} />
      ) : (
        <Tooltip title={isDragDisabled ? 'Rank' : 'Click to edit rank'} placement="left" arrow>
          <Typography variant="h5" component="div" onClick={handleRankClick} sx={{ fontWeight: 700, color: isDragDisabled ? 'text.disabled' : 'primary.main', cursor: isDragDisabled ? 'default' : 'pointer', lineHeight: '40px', minHeight: '40px' }} >
            {rank}
          </Typography>
        </Tooltip>
      )}
      <Box {...attributes} {...listeners} sx={{ cursor: isDragDisabled ? 'not-allowed' : 'grab', color: 'text.disabled', mt: 0.5, opacity: isEditingRank ? 0 : 1, }} >
        <DragIndicatorIcon />
      </Box>
    </Stack>
  );

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      onClick={onOpenEditDialog}
      sx={{
        p: 2, mb: 2, display: 'flex', gap: 1, position: 'relative',
        cursor: 'pointer',
        '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'translateY(-2px)',
        },
        transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
      }}
    >
      {RankControl}
      <Box sx={{ flexShrink: 0, width: 100, height: 140 }}>
        {anime.coverImage ? <AnimeCoverImage src={anime.coverImage} alt={`${anime.title} Cover`} /> : <Box sx={{ width: 100, height: 140, bgcolor: 'background.default', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}><PhotoIcon sx={{ fontSize: 40 }} /></Box>}
      </Box>
      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <Link
          href={justWatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          color="inherit"
          onClick={(e) => e.stopPropagation()}
          title={`Search for "${anime.title}" on JustWatch`}
        >
          <Typography
            variant="h6"
            component="h3"
            noWrap
            sx={{
              mb: 0.5,
              pr: '40px',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            {anime.title}
          </Typography>
        </Link>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip label={anime.status} size="small" color={getStatusColor(anime.status)} />
          <Chip label={anime.type} size="small" variant="outlined" />
          <Tooltip title="Add 1 watched episode">
            <span onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" onClick={handleIncrementEpisode} disabled={anime.episodes > 0 && anime.watchedEpisodes >= anime.episodes} sx={{ p: 0.25 }} >
                <AddCircleOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Stack spacing={1}>
          <Box onClick={(e) => e.stopPropagation()}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">Episodes</Typography>
              {isEditingEpisodes ? (
                <TextField value={episodeInputValue} onChange={(e) => setEpisodeInputValue(e.target.value)} onKeyDown={handleEpisodeInputKeyDown} onBlur={handleEpisodeCommit} autoFocus type="number" size="small" variant="outlined" inputProps={{ style: { textAlign: 'right', width: '50px', MozAppearance: 'textfield' } }} sx={{ '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 } }} />
              ) : (
                <Tooltip title="Click to edit watched episodes">
                  <Typography variant="body2" color="text.secondary" onClick={handleEpisodeClick} sx={{ cursor: 'pointer', p: '4px', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }} >
                    {anime.watchedEpisodes} / {anime.episodes || '?'}
                  </Typography>
                </Tooltip>
              )}
            </Stack>
            <LinearProgress variant="determinate" value={progress} color={progress === 100 ? 'success' : 'primary'} sx={{ mt: 0.5 }} />
          </Box>
          {anime.score > 0 && (<Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="body2" color="text.secondary">Score</Typography><Rating name="read-only-score" value={anime.score / 2} precision={0.5} readOnly size="small" emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />} /></Stack>)}
        </Stack>
      </Stack>
      <Tooltip title="Delete Anime" placement="top" arrow>
        <IconButton aria-label={`Delete ${anime.title}`} onClick={handleDeleteClick} size="small" sx={{ position: 'absolute', top: 8, right: 8, color: 'grey.500', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', '&:hover': { color: 'error.main', backgroundColor: 'error.lighter' } }} >
          <DeleteForeverIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}
