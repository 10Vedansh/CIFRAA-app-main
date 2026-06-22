import { useState, useEffect, useCallback } from 'react';
import { MutualFund } from '@/types/mutualFund';
import { getWorkbookFunds } from '@/utils/workbookLoader';

export function useFundCache() {
  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveData, setIsLiveData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFunds = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getWorkbookFunds();
      setFunds(result);
      setIsLiveData(true);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load workbook:', err);
      setFunds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const refreshFunds = useCallback(() => {
    fetchFunds();
  }, [fetchFunds]);

  return {
    funds,
    isLoading,
    isLiveData,
    lastUpdated,
    refreshFunds,
  };
}
