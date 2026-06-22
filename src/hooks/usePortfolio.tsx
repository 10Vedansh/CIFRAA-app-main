import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { MutualFund } from '@/types/mutualFund';
import { toast } from 'sonner';

// Replicate HoldingData type inline to avoid circular dependency
interface CamsHoldingData {
  fund_name: string;
  amc: string;
  folio_number?: string;
  units?: number | null;
  nav?: number | null;
  current_value?: number | null;
  cost_value?: number | null;
  category?: string;
}

export interface PortfolioItem {
  id: string;
  fund_id: string;
  fund_name: string;
  fund_category: string | null;
  invested_amount: number | null;
  sip_amount: number | null;
  is_sip: boolean;
  units: number | null;
  purchase_nav: number | null;
  notes: string | null;
  created_at: string;
}

const PORTFOLIO_KEY = 'cifraa_portfolio';

function loadPortfolio(userId: string): PortfolioItem[] {
  try {
    const data = localStorage.getItem(`${PORTFOLIO_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePortfolio(userId: string, items: PortfolioItem[]) {
  localStorage.setItem(`${PORTFOLIO_KEY}_${userId}`, JSON.stringify(items));
}

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPortfolio = useCallback(() => {
    if (!user) {
      setPortfolio([]);
      return;
    }
    setIsLoading(true);
    const items = loadPortfolio(user.id);
    setPortfolio(items);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const addToPortfolio = async (
    fund: MutualFund,
    details: {
      invested_amount?: number;
      sip_amount?: number;
      is_sip?: boolean;
      units?: number;
      purchase_nav?: number;
      notes?: string;
    }
  ) => {
    if (!user) {
      toast.error('Please sign in to add investments');
      return false;
    }

    const exists = portfolio.some(item => item.fund_id === fund.id);
    if (exists) {
      toast.info('This fund is already in your portfolio');
      return false;
    }

    const newItem: PortfolioItem = {
      id: `pf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fund_id: fund.id,
      fund_name: fund.name,
      fund_category: fund.category,
      invested_amount: details.invested_amount || null,
      sip_amount: details.sip_amount || null,
      is_sip: details.is_sip || false,
      units: details.units || null,
      purchase_nav: details.purchase_nav || null,
      notes: details.notes || null,
      created_at: new Date().toISOString(),
    };

    const updated = [newItem, ...portfolio];
    savePortfolio(user.id, updated);
    setPortfolio(updated);
    toast.success('Added to portfolio');
    return true;
  };

  const updatePortfolioItem = async (
    portfolioId: string,
    updates: Partial<PortfolioItem>
  ) => {
    if (!user) return false;

    const updated = portfolio.map(item =>
      item.id === portfolioId ? { ...item, ...updates } : item
    );
    savePortfolio(user.id, updated);
    setPortfolio(updated);
    toast.success('Portfolio updated');
    return true;
  };

  const removeFromPortfolio = async (portfolioId: string) => {
    if (!user) return false;

    const updated = portfolio.filter(item => item.id !== portfolioId);
    savePortfolio(user.id, updated);
    setPortfolio(updated);
    toast.success('Removed from portfolio');
    return true;
  };

  const bulkAddCamsHoldings = async (holdings: CamsHoldingData[]) => {
    if (!user) return false;
    const items: PortfolioItem[] = holdings.map(h => ({
      id: `cams_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fund_id: `cams_${h.folio_number || h.fund_name.replace(/\s+/g, '_')}`,
      fund_name: h.fund_name,
      fund_category: h.category || null,
      invested_amount: h.cost_value || h.current_value || null,
      sip_amount: null,
      is_sip: false,
      units: h.units || null,
      purchase_nav: h.nav || null,
      notes: 'Imported from CAMS statement',
      created_at: new Date().toISOString(),
    }));
    const updated = [...items, ...portfolio];
    savePortfolio(user.id, updated);
    setPortfolio(updated);
    return true;
  };

  const isInPortfolio = (fundId: string) => {
    return portfolio.some((item) => item.fund_id === fundId);
  };

  const portfolioSummary = {
    totalInvested: portfolio.reduce((sum, item) => sum + (item.invested_amount || 0), 0),
    totalSIP: portfolio.reduce((sum, item) => sum + (item.is_sip ? (item.sip_amount || 0) : 0), 0),
    fundCount: portfolio.length,
    categoryBreakdown: portfolio.reduce((acc, item) => {
      const category = item.fund_category || 'Other';
      acc[category] = (acc[category] || 0) + (item.invested_amount || 0);
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    portfolio,
    isLoading,
    addToPortfolio,
    updatePortfolioItem,
    removeFromPortfolio,
    isInPortfolio,
    refreshPortfolio: fetchPortfolio,
    portfolioSummary,
    bulkAddCamsHoldings,
  };
}
