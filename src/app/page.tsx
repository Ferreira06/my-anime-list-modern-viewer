'use client';

import React, { useState, useMemo, useEffect, useCallback, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import type { SelectChangeEvent } from '@mui/material/Select';

import { Anime, AnimeOrders, getBaseAnimeData } from '@/app/data/anime';
import { useFeedback } from '@/app/providers/FeedbackProvider';
import { ColorModeContext } from '@/app/providers/CustomThemeProvider';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import AppControls from '@/app/components/AppControls';
import AnimeCard from '@/app/components/AnimeCard';
import AnimeListSkeleton from '@/app/components/AnimeListSkeleton';
import ConfirmationDialog from '@/app/components/ConfirmationDialog';
import AnimeEditDialog, { AnimeUpdateData } from '@/app/components/AnimeEditDialog';

const LOCAL_COVERS_PREFIX = '/anime-covers/';

export default function Home() {
  const { showSnackbar } = useFeedback();
  const { toggleColorMode } = useContext(ColorModeContext);

  const [sortBy, setSortBy] = useState<string>('title');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [masterAnimeList, setMasterAnimeList] = useState<Anime[]>([]);
  const [customAnimeOrders, setCustomAnimeOrders] = useState<AnimeOrders>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isFetchingCovers, setIsFetchingCovers] = useState(false);

  const [newAnimeTitle, setNewAnimeTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [deleteDialogState, setDeleteDialogState] = useState({ open: false, title: '', description: '', onConfirm: () => {}, });
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch('/api/db');
      const data = await response.json();
      const initialAnime = Array.isArray(data.animeList) ? data.animeList : getBaseAnimeData().animeList;
      const initialOrders = typeof data.animeOrders === 'object' && data.animeOrders !== null ? data.animeOrders : getBaseAnimeData().animeOrders;
      setMasterAnimeList(initialAnime);
      setCustomAnimeOrders(initialOrders);
      const firstCustomOrder = Object.keys(initialOrders)[0];
      setSortBy(firstCustomOrder || 'title');
      fetchMissingCovers(initialAnime);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      showSnackbar('Could not load anime data from server.', 'error');
      const { animeList, animeOrders } = getBaseAnimeData();
      setMasterAnimeList(animeList);
      setCustomAnimeOrders(animeOrders);
    } finally {
      setIsLoadingData(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchMissingCovers = async (animeList: Anime[]) => {
    const animeToFetchCoversFor = animeList.filter( (anime: Anime) => !anime.coverImage || !anime.coverImage.startsWith(LOCAL_COVERS_PREFIX) );
    if (animeToFetchCoversFor.length > 0) {
      setIsFetchingCovers(true);
      await Promise.all(animeToFetchCoversFor.map(async (anime) => {
        try {
          const res = await fetch('/api/db', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: anime.title, id: anime.id }), });
          const data = await res.json();
          if (res.ok && data.coverImage) {
            setMasterAnimeList(prev => prev.map(a => a.id === anime.id ? { ...a, coverImage: data.coverImage } : a));
          }
        } catch (error) {
          console.error(`Failed to fetch cover for ${anime.title}:`, error);
        }
      }));
      setIsFetchingCovers(false);
    }
  };

  useEffect(() => {
    if (!isLoadingData) {
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'updateAnimeOrders', updatedOrders: customAnimeOrders }),
      }).catch(error => console.error("Failed to save anime orders:", error));
    }
  }, [customAnimeOrders, isLoadingData]);

  const handleAddAnime = async () => {
    if (!newAnimeTitle.trim()) {
      showSnackbar('Please enter an anime title.', 'warning');
      return;
    }
    setIsAdding(true);
    try {
      const response = await fetch('/api/anime', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newAnimeTitle }), });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add anime.');
      showSnackbar(`Successfully added '${result.title}'!`, 'success');
      setMasterAnimeList(prevList => [result, ...prevList]);
      setNewAnimeTitle('');
      fetch('/api/db', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: result.title, id: result.id }), });
    } catch (error: unknown) {
      showSnackbar(`Error: ${(error as Error).message}`, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(masterAnimeList.map((anime) => anime.status));
    return ['All', ...Array.from(statuses).sort()];
  }, [masterAnimeList]);
  
  const isCustomSortActive = useMemo(() => customAnimeOrders.hasOwnProperty(sortBy), [sortBy, customAnimeOrders]);

  const displayedAnimeList = useMemo(() => {
    const filteredList = masterAnimeList
      .filter(anime => (filterStatus === 'All' || anime.status === filterStatus) && anime.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(anime => ({ ...anime, score: Number(anime.score) }));

    if (isCustomSortActive) {
        const orderForCurrentSort = customAnimeOrders[sortBy] || [];
        return [...filteredList].sort((a, b) => {
            const indexA = orderForCurrentSort.indexOf(a.id);
            const indexB = orderForCurrentSort.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return a.title.localeCompare(b.title);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    } else {
        return [...filteredList].sort((a, b) => {
            switch (sortBy) {
                case 'title': return a.title.localeCompare(b.title);
                case 'score': return b.score - a.score;
                case 'status': return a.status.localeCompare(b.status);
                case 'episodes': return (b.episodes || 0) - (a.episodes || 0);
                case 'watchedEpisodes': return (b.watchedEpisodes || 0) - (a.watchedEpisodes || 0);
                case 'startDate':
                    const dateA = a.startDate === '0000-00-00' ? 0 : new Date(a.startDate).getTime();
                    const dateB = b.startDate === '0000-00-00' ? 0 : new Date(b.startDate).getTime();
                    return dateB - dateA;
                default: return 0;
            }
        });
    }
  }, [masterAnimeList, sortBy, filterStatus, searchTerm, customAnimeOrders, isCustomSortActive]);

  const handleSortChange = (event: SelectChangeEvent<string>) => setSortBy(event.target.value);
  const handleFilterStatusChange = (event: SelectChangeEvent<string>) => setFilterStatus(event.target.value);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !isCustomSortActive) return;
    setCustomAnimeOrders(prevOrders => {
        const currentIdsInView = displayedAnimeList.map(anime => anime.id);
        const oldIndex = currentIdsInView.indexOf(active.id as number);
        const newIndex = currentIdsInView.indexOf(over.id as number);
        const updatedOrderForSort = arrayMove(currentIdsInView, oldIndex, newIndex);
        return { ...prevOrders, [sortBy]: updatedOrderForSort };
    });
  };

  const handleRankChange = (animeId: number, newPosition: number) => {
    if (!isCustomSortActive) return;
    setCustomAnimeOrders(prevOrders => {
      const currentOrder = prevOrders[sortBy] || [];
      const oldIndex = currentOrder.indexOf(animeId);
      if (oldIndex === -1) return prevOrders;
      const newOrder = [...currentOrder];
      const [item] = newOrder.splice(oldIndex, 1);
      const newIndex = Math.max(0, Math.min(newOrder.length, newPosition - 1));
      newOrder.splice(newIndex, 0, item);
      return { ...prevOrders, [sortBy]: newOrder };
    });
  };

  const handleAddSort = (name: string) => {
    const newKey = `custom_${name.toLowerCase().replace(/\s+/g, '_')}`;
    setCustomAnimeOrders(prev => ({ ...prev, [newKey]: [] }));
    setSortBy(newKey);
    showSnackbar(`Added new sort: '${name}'`, 'success');
  };

  const handleEpisodeUpdate = async (animeId: number, newWatchedCount: number) => {
    setMasterAnimeList(prevList =>
      prevList.map(anime => {
        if (anime.id === animeId) {
          const updatedAnime = { ...anime, watchedEpisodes: newWatchedCount };
          if (updatedAnime.episodes > 0 && newWatchedCount === updatedAnime.episodes) {
            updatedAnime.status = 'Completed';
          }
          return updatedAnime;
        }
        return anime;
      })
    );
    try {
      const response = await fetch('/api/anime', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: animeId, watchedEpisodes: newWatchedCount }), });
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to update episode count.');
      }
    } catch (error: unknown) {
      showSnackbar(`Error: ${(error as Error).message}`, 'error');
      console.error("Failed to update episode count on server.");
    }
  };

  const handleOpenDeleteDialog = (anime: Anime) => {
    setDeleteDialogState({ open: true, title: `Delete "${anime.title}"?`, description: `You are about to permanently delete this anime from your list.`, onConfirm: () => handleConfirmDelete(anime), });
  };

  const handleConfirmDelete = async (animeToDelete: Anime) => {
    try {
      const response = await fetch(`/api/anime?id=${animeToDelete.id}`, { method: 'DELETE', });
      const result = await response.json();
      if (!response.ok) { throw new Error(result.error || 'Failed to delete anime.'); }
      setMasterAnimeList(prev => prev.filter(a => a.id !== animeToDelete.id));
      setCustomAnimeOrders(prevOrders => {
          const newOrders = { ...prevOrders };
          for (const key in newOrders) {
              newOrders[key] = newOrders[key].filter(id => id !== animeToDelete.id);
          }
          return newOrders;
      });
      showSnackbar(result.message, 'success');
    } catch (error: unknown) {
      showSnackbar(`Error: ${(error as Error).message}`, 'error');
    } finally {
      setDeleteDialogState({ ...deleteDialogState, open: false });
    }
  };

  const handleOpenEditDialog = (anime: Anime) => {
    setEditingAnime(anime);
  };

  const handleCloseEditDialog = () => {
    setEditingAnime(null);
  };

  const handleSaveChanges = async (id: number, data: AnimeUpdateData) => {
    setMasterAnimeList(prevList => prevList.map(anime => (anime.id === id ? { ...anime, ...data } : anime)));
    try {
      const response = await fetch('/api/anime', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }), });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to save changes.');
      const updatedAnimeFromServer = await response.json();
      setMasterAnimeList(prevList => prevList.map(anime => (anime.id === id ? updatedAnimeFromServer : anime)));
      showSnackbar('Changes saved successfully!', 'success');
    } catch (error: unknown) {
      showSnackbar(`Error: ${(error as Error).message}`, 'error');
    }
  };

  const handleClearFilters = () => {
    setFilterStatus('All');
    setSearchTerm('');
    const firstCustomOrder = Object.keys(customAnimeOrders)[0];
    setSortBy(firstCustomOrder || 'title');
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const xmlContent = e.target?.result as string;
      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/xml' },
          body: xmlContent,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Import failed.');
        }
        showSnackbar(result.message, 'success');
        await fetchInitialData();
      } catch (error: unknown) {
        showSnackbar(`Error: ${(error as Error).message}`, 'error');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      showSnackbar('Failed to read the file.', 'error');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h4" component="h1" fontWeight="700">My Anime List</Typography>
            <Typography variant="subtitle1" color="text.secondary">Your personal list, better than original.</Typography>
        </Box>
        <Tooltip title="Toggle light/dark theme" arrow>
             <IconButton onClick={toggleColorMode} color="primary">
                {useTheme().palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
        </Tooltip>
      </Box>

      <AppControls
        sortBy={sortBy}
        filterStatus={filterStatus}
        searchTerm={searchTerm}
        newAnimeTitle={newAnimeTitle}
        isAdding={isAdding || isImporting}
        uniqueStatuses={uniqueStatuses}
        customAnimeOrders={customAnimeOrders}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterStatusChange}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        onNewAnimeTitleChange={(e) => setNewAnimeTitle(e.target.value)}
        onAddNewAnime={handleAddAnime}
        onAddSort={handleAddSort}
        onClearFilters={handleClearFilters}
        onImport={handleImport}
      />

      <Box>
        {isLoadingData ? <AnimeListSkeleton /> : (
          <>
            {isImporting && ( <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}> <CircularProgress size={20} sx={{ mr: 1.5 }} /><Typography variant="body2" color="text.secondary">Importing your list, please wait...</Typography></Box>)}
            {isFetchingCovers && ( <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}> <CircularProgress size={20} sx={{ mr: 1.5 }} /><Typography variant="body2" color="text.secondary">Fetching missing covers...</Typography></Box>)}
            {displayedAnimeList.length === 0 && !isImporting ? (
              <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Your list is empty.</Typography>
                <Typography variant="body1" color="text.secondary">Add an anime manually or import your list from MyAnimeList.</Typography>
              </Paper>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={displayedAnimeList.map(anime => anime.id)} strategy={verticalListSortingStrategy} disabled={!isCustomSortActive} >
                  <List disablePadding>
                    {displayedAnimeList.map((anime: Anime, index: number) => (
                      <AnimeCard 
                          key={anime.id} 
                          anime={anime}
                          rank={index + 1}
                          isDragDisabled={!isCustomSortActive}
                          onDelete={() => handleOpenDeleteDialog(anime)}
                          onRankChange={handleRankChange}
                          onEpisodeUpdate={handleEpisodeUpdate}
                          onOpenEditDialog={() => handleOpenEditDialog(anime)}
                      />
                    ))}
                  </List>
                </SortableContext>
              </DndContext>
            )}
          </>
        )}
      </Box>

      <ConfirmationDialog
        open={deleteDialogState.open}
        onClose={() => setDeleteDialogState({ ...deleteDialogState, open: false })}
        onConfirm={deleteDialogState.onConfirm}
        title={deleteDialogState.title}
        description={deleteDialogState.description}
      />
      <AnimeEditDialog
        anime={editingAnime}
        open={!!editingAnime}
        onClose={handleCloseEditDialog}
        onSave={handleSaveChanges}
        onDelete={() => {
            if (editingAnime) {
                handleCloseEditDialog();
                handleOpenDeleteDialog(editingAnime);
            }
        }}
      />
    </Container>
  );
}