import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { MutualFund } from '@/types/mutualFund';
import { toast } from 'sonner';

interface WatchlistItem {
  id: string;
  fund_id: string;
  fund_name: string;
  fund_category: string | null;
}

const WATCHLIST_KEY = 'cifraa_watchlist';

function loadWatchlist(userId: string): WatchlistItem[] {
  try {
    const data = localStorage.getItem(`${WATCHLIST_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(userId: string, items: WatchlistItem[]) {
  localStorage.setItem(`${WATCHLIST_KEY}_${userId}`, JSON.stringify(items));
}

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWatchlist = useCallback(() => {
    if (!user) {
      setWatchlist([]);
      return;
    }
    setIsLoading(true);
    const items = loadWatchlist(user.id);
    setWatchlist(items);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addToWatchlist = async (fund: MutualFund) => {
    if (!user) {
      toast.error('Please sign in to save funds');
      return false;
    }

    const exists = watchlist.some(item => item.fund_id === fund.id);
    if (exists) {
      toast.info('Already in your watchlist');
      return false;
    }

    const newItem: WatchlistItem = {
      id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fund_id: fund.id,
      fund_name: fund.name,
      fund_category: fund.category,
    };

    const updated = [newItem, ...watchlist];
    saveWatchlist(user.id, updated);
    setWatchlist(updated);
    toast.success('Added to watchlist');
    return true;
  };

  const removeFromWatchlist = async (fundId: string) => {
    if (!user) return false;

    const updated = watchlist.filter(item => item.fund_id !== fundId);
    saveWatchlist(user.id, updated);
    setWatchlist(updated);
    toast.success('Removed from watchlist');
    return true;
  };

  const isInWatchlist = (fundId: string) => {
    return watchlist.some((item) => item.fund_id === fundId);
  };

  const toggleWatchlist = async (fund: MutualFund) => {
    if (isInWatchlist(fund.id)) {
      return removeFromWatchlist(fund.id);
    } else {
      return addToWatchlist(fund);
    }
  };

  return {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleWatchlist,
    refreshWatchlist: fetchWatchlist,
  };
}
