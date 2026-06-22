import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeaderZone } from '@/components/dashboard/DashboardHeaderZone';
import { DashboardBackground } from '@/components/dashboard/DashboardBackground';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { FundCard } from '@/components/dashboard/FundCard';
import { SectorAllocationChart } from '@/components/dashboard/SectorAllocationChart';
import { FundDetailModal } from '@/components/dashboard/FundDetailModal';
import { SectorSearchDropdown } from '@/components/dashboard/SectorSearchDropdown';
import { FundComparisonCard } from '@/components/dashboard/FundComparisonCard';
import { PortfolioFundModal } from '@/components/dashboard/PortfolioFundModal';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';
import { AllFundsTab } from '@/components/dashboard/AllFundsTab';
import { AIChat } from '@/components/dashboard/AIChat';
import { CAMSUpload } from '@/components/dashboard/CAMSUpload';
import { BuildPortfolio } from '@/components/dashboard/BuildPortfolio';
import { PortfolioAnalytics } from '@/components/dashboard/PortfolioAnalytics';
import { AddFundDialog } from '@/components/dashboard/AddFundDialog';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MutualFund, FundSectorData, CATEGORY_LABELS } from '@/types/mutualFund';
import { getCachedSectorData } from '@/utils/sectorDataGenerator';
import { 
  Plus,
  AlertTriangle,
  Loader2,
  Bookmark,
  Wallet,
  Target,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFundCache } from '@/hooks/useFundCache';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePortfolio, PortfolioItem } from '@/hooks/usePortfolio';
import { useNewRecommendations } from '@/hooks/useNewRecommendations';
import { toRawAnswers } from '@/engine/adapter';
import { Info } from 'lucide-react';
import { PreferencesModal } from '@/components/dashboard/PreferencesModal';
import { isProfileComplete } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { funds, isLoading, refreshFunds } = useFundCache();
  const { watchlist, isInWatchlist, toggleWatchlist } = useWatchlist();
  const { 
    portfolio, 
    addToPortfolio, 
    removeFromPortfolio, 
    portfolioSummary,
    isLoading: portfolioLoading,
    bulkAddCamsHoldings,
  } = usePortfolio();

  const [globalSearch, setGlobalSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [aiResetKey, setAiResetKey] = useState(0);
  const [selectedFundA, setSelectedFundA] = useState('');
  const [selectedFundB, setSelectedFundB] = useState('');
  
  // Force recommendation refresh when preferences are saved
  const [prefVersion, setPrefVersion] = useState(0);

  // Modal states
  const [selectedFundForModal, setSelectedFundForModal] = useState<MutualFund | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddToPortfolioOpen, setIsAddToPortfolioOpen] = useState(false);
  const [portfolioFundToAdd, setPortfolioFundToAdd] = useState<MutualFund | null>(null);
  const [investedAmount, setInvestedAmount] = useState('');
  const [sipAmount, setSipAmount] = useState('');
  const [isSip, setIsSip] = useState(false);
  
  // Portfolio fund detail modal
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [selectedPortfolioFund, setSelectedPortfolioFund] = useState<MutualFund | null>(null);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

  // CAMS uploaded flag
  const [hasCamsData, setHasCamsData] = useState(false);
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  // Handle CAMS data loaded - save to portfolio
  const handleCamsDataLoaded = (parsed?: any) => {
    setHasCamsData(true);
    if (parsed?.holdings?.length > 0) {
      bulkAddCamsHoldings(parsed.holdings);
    }
  };

  const profileComplete = isProfileComplete(profile);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Set initial comparison funds
  useEffect(() => {
    if (funds.length > 0 && !selectedFundA) {
      setSelectedFundA(funds[0].id);
    }
    if (funds.length > 1 && !selectedFundB) {
      setSelectedFundB(funds[1].id);
    }
  }, [funds, selectedFundA, selectedFundB]);

  // Get user's first name
  const firstName = useMemo(() => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    return null;
  }, [profile]);

  // Build questionnaire answers from profile using new engine adapter
  const rawAnswers = useMemo(() => {
    if (!profile) {
      console.log("RAW ANSWERS: null (no profile)");
      return null;
    }
    const stage = profile.investor_stage;
    const goal = profile.primary_goal;
    const horizon = profile.investment_horizon;
    const reaction = profile.market_reaction;
    const experience = profile.experience_level;
    const existing = profile.existing_investments_range;
    const emergency = profile.emergency_fund;
    const riskSlider = (profile as any).risk_slider;
    if (!stage || !goal || !horizon || !reaction || !experience || !existing || !emergency) {
      console.log("RAW ANSWERS: null (missing fields)", { stage, goal, horizon, reaction, experience, existing, emergency });
      return null;
    }
    const result = toRawAnswers(
      { investorStage: stage, primaryGoal: goal, investmentHorizon: horizon, marketReaction: reaction, experience, existingInvestments: existing, emergencyFund: emergency },
      riskSlider ?? 5,
    );
    console.log("RAW ANSWERS: generated", result);
    return result;
  }, [profile, prefVersion]);

  // New v2 engine recommendations
  const { portfolio: newPortfolio, isLoading: newEngineLoading } = useNewRecommendations(rawAnswers);

  // Filter funds using recommendation engine (v2 output)
  const personalizedFunds = useMemo(() => {
    if (!newPortfolio || funds.length === 0) {
      console.log("PERSONALIZED FUNDS: empty (newPortfolio:" + !!newPortfolio + ", funds:" + funds.length + ")");
      return [];
    }

    const recommended = newPortfolio.recommendedFunds;
    console.log("RECOMMENDATIONS PASSED TO UI", recommended);
    if (recommended.length > 0) {
      // Map v2 RecommendedFund to format used by FundCard (which expects MutualFund)
      return recommended.map(rec => {
        const fund = funds.find(f => f.id === rec.fundId);
        if (!fund) return null;
        return {
          ...fund,
          matchScore: rec.matchScore,
          reason: rec.reason,
          profile: newPortfolio.investorPersona.personaName as any,
          allocationPercent: rec.allocationPercent,
        };
      }).filter(Boolean) as any[];
    }
    console.log("PERSONALIZED FUNDS: using fallback (0 recommended from engine)");
    return funds.slice(0, 9).map(f => ({ ...f, matchScore: 0, reason: 'Fallback recommendation', profile: 'Moderate' as any, allocationPercent: 100 / 9 }));
  }, [funds, newPortfolio]);

  // Global search results
  const globalFilteredFunds = useMemo(() => {
    if (!globalSearch) return [];
    const query = globalSearch.toLowerCase();
    return funds.filter(f => 
      f.name.toLowerCase().includes(query) || 
      f.amc.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [funds, globalSearch]);

  // Watchlist funds
  const watchlistFunds = useMemo(() => 
    funds.filter(f => watchlist.some(w => w.fund_id === f.id)),
    [funds, watchlist]
  );

  // Sector data
  const getSectorData = (fundId: string): FundSectorData | null => {
    const fund = funds.find(f => f.id === fundId);
    if (!fund) return null;
    return getCachedSectorData(fund);
  };

  const sectorDataA = useMemo(() => getSectorData(selectedFundA), [selectedFundA, funds]);
  const sectorDataB = useMemo(() => getSectorData(selectedFundB), [selectedFundB, funds]);
  const comparisonFundA = useMemo(() => funds.find(f => f.id === selectedFundA), [selectedFundA, funds]);
  const comparisonFundB = useMemo(() => funds.find(f => f.id === selectedFundB), [selectedFundB, funds]);
  const modalSectorData = useMemo(() => {
    if (!selectedFundForModal) return null;
    return getCachedSectorData(selectedFundForModal);
  }, [selectedFundForModal]);

  const handleFundClick = (fund: MutualFund) => {
    setSelectedFundForModal(fund);
    setIsModalOpen(true);
  };

  const handleAddToPortfolio = (fund: MutualFund) => {
    setPortfolioFundToAdd(fund);
    setInvestedAmount('');
    setSipAmount('');
    setIsSip(false);
    setIsAddToPortfolioOpen(true);
  };

  const handlePortfolioItemClick = (item: PortfolioItem) => {
    const fund = funds.find(f => f.id === item.fund_id);
    if (fund) {
      setSelectedPortfolioItem(item);
      setSelectedPortfolioFund(fund);
      setIsPortfolioModalOpen(true);
    }
  };

  const submitAddToPortfolio = async () => {
    if (!portfolioFundToAdd) return;
    
    await addToPortfolio(portfolioFundToAdd, {
      invested_amount: investedAmount ? parseFloat(investedAmount) : undefined,
      sip_amount: sipAmount ? parseFloat(sipAmount) : undefined,
      is_sip: isSip,
    });
    
    setIsAddToPortfolioOpen(false);
    setPortfolioFundToAdd(null);
  };

  // Generate educational insights for portfolio
  const getPortfolioInsight = (item: PortfolioItem): { type: 'continue' | 'review' | 'reduce'; message: string } => {
    const fund = funds.find(f => f.id === item.fund_id);
    if (!fund) return { type: 'review', message: 'Fund data not available for analysis' };

    const cat = fund.category || '';
    const isEquity = cat.startsWith('EQ-') || cat === 'Equity';
    const isDebt = cat.startsWith('DT-') || cat === 'Debt';

    if (fund.sharpeRatio >= 1.5 && fund.cagr1Y > 15 && fund.expenseRatio < 1.5) {
      return { type: 'continue', message: `Strong risk-adjusted performance with Sharpe ${fund.sharpeRatio.toFixed(2)} and ${fund.cagr1Y.toFixed(1)}% 1Y return. Low expense ratio keeps costs efficient. Consider continuing SIP or holding.` };
    }
    if (fund.cagr1Y > 25 && fund.volatility > 20) {
      return { type: 'review', message: `High returns (${fund.cagr1Y.toFixed(1)}%) but elevated volatility (${fund.volatility.toFixed(1)}%). The fund may be in a momentum phase. Review if it aligns with your risk capacity and rebalance if overweight.` };
    }
    if (fund.sharpeRatio < 0.5 && fund.cagr1Y < 5 && isEquity) {
      return { type: 'reduce', message: `Underperforming with ${fund.cagr1Y.toFixed(1)}% return and weak Sharpe ratio (${fund.sharpeRatio.toFixed(2)}) for an equity fund. Consider switching to a better-rated fund in the same category.` };
    }
    if (fund.expenseRatio > 2.0) {
      return { type: 'review', message: `High expense ratio of ${fund.expenseRatio.toFixed(2)}% is eroding returns. Over 10 years, this could cost ₹${Math.round(((item.invested_amount || 50000) * 0.02) * 10 / 1000)}K+ in fees. Consider a direct plan or lower-cost alternative.` };
    }
    if (isDebt && fund.cagr1Y > 7) {
      return { type: 'continue', message: `Solid ${fund.cagr1Y.toFixed(1)}% return for a debt fund with low volatility (${fund.volatility.toFixed(1)}%). Good for capital preservation and regular income goals.` };
    }
    if (fund.beta !== undefined && fund.beta > 1.3 && isEquity) {
      return { type: 'review', message: `High beta (${fund.beta.toFixed(2)}) means this fund amplifies market swings. In a 10% correction, expect ~${(10 * fund.beta).toFixed(0)}% fall. Suitable only if your horizon is 5+ years.` };
    }
    if (fund.cagr3Y > 12 && fund.cagr5Y > 10) {
      return { type: 'continue', message: `Consistent multi-year performer: ${fund.cagr3Y.toFixed(1)}% (3Y) and ${fund.cagr5Y.toFixed(1)}% (5Y) CAGR. Long-term compounding is working in your favor.` };
    }
    if (fund.cagr1Y < 0) {
      return { type: 'review', message: `Currently in negative territory (${fund.cagr1Y.toFixed(1)}%). Evaluate if the downturn is market-wide or fund-specific. If the fund's 3Y track record is strong, consider averaging down via SIP.` };
    }
    return { type: 'continue', message: `Performance within expectations for a ${fund.category} fund. Sharpe: ${fund.sharpeRatio.toFixed(2)}, Expense: ${fund.expenseRatio.toFixed(2)}%. Continue monitoring quarterly.` };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleOpenAuctus = () => {
    setActiveTab('ai');
    setAiResetKey(k => k + 1);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <DashboardBackground />
      {/* Header: always shown on lg+; on mobile only on Home (overview) tab */}
      <div className={activeTab === 'overview' ? '' : 'hidden lg:block'}>
        <DashboardHeader
          onRefresh={refreshFunds}
          isLoading={isLoading}
          onOpenAuctus={handleOpenAuctus}
          onPreferencesSaved={() => setPrefVersion(v => v + 1)}
        />
      </div>
      
      <div className="flex flex-1">
        {/* Desktop Sidebar - Fixed position */}
        <DashboardSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          watchlistCount={watchlist.length}
          portfolioCount={portfolio.length}
        />
        
        {/* Main content with left margin to account for fixed sidebar */}
        <main className="flex-1 px-4 md:px-6 lg:px-10 py-8 pb-24 lg:pb-8 overflow-x-hidden bg-gradient-to-b from-transparent via-background/50 to-background lg:ml-24">
          <div className="max-w-6xl mx-auto">

            {/* Dashboard Header Zone */}
            <DashboardHeaderZone
              firstName={activeTab === 'overview' ? firstName : null}
              globalSearch={globalSearch}
              onGlobalSearchChange={setGlobalSearch}
              globalFilteredFunds={globalFilteredFunds}
              onFundClick={(fund) => {
                handleFundClick(fund);
              }}
              showSearch={activeTab === 'overview' || activeTab === 'watchlist'}
              showInfoText={activeTab === 'overview'}
              showGreeting={activeTab === 'overview'}
            />

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-6">
                  {(() => { if (!isLoading && !newEngineLoading) { if (personalizedFunds.length > 0 && newPortfolio) { console.log("SHOW RECOMMENDATIONS — personalizedFunds:", personalizedFunds.length); } else { console.log("SHOW QUESTIONNAIRE — personalizedFunds:", personalizedFunds.length, "newPortfolio:", !!newPortfolio, "profileComplete:", profileComplete); } } })()}
                  {isLoading || newEngineLoading ? (
                    <DashboardLoadingState />
                  ) : personalizedFunds.length > 0 && newPortfolio ? (
                    <div className="space-y-4">
                      {/* Persona + Allocation Summary */}
                      <Card className="glass-card border-primary/20">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Your Investor Profile</p>
                              <p className="text-xl font-bold text-primary mt-1">{newPortfolio.investorPersona.personaName}</p>
                              <p className="text-sm text-muted-foreground mt-1">{newPortfolio.investorPersona.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Allocation</p>
                              <div className="flex flex-wrap gap-1 mt-1 justify-end max-w-[200px]">
                                {newPortfolio.allocationPlan.slots.map(slot => (
                                  <Badge key={slot.canonicalCategory} variant="outline" className="text-xs">
                                    {slot.percent}% {slot.canonicalCategory.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Conflict warnings */}
                          {newPortfolio.explanations.conflictWarnings.length > 0 && (
                            <div className="flex items-start gap-2 p-2 rounded bg-warning/10 border border-warning/20 text-xs text-warning">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div>
                                {newPortfolio.explanations.conflictWarnings.map((w, i) => (
                                  <p key={i}>{w}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Data quality warnings */}
                          {newPortfolio.explanations.dataQualityWarnings.length > 0 && (
                            <div className="flex items-start gap-2 p-2 rounded bg-muted text-xs text-muted-foreground">
                              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div>
                                {newPortfolio.explanations.dataQualityWarnings.map((w, i) => (
                                  <p key={i}>{w}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {personalizedFunds.map(fund => (
                          <FundCard 
                            key={fund.id}
                            fund={fund} 
                            onClick={() => handleFundClick(fund)}
                            isBookmarked={isInWatchlist(fund.id)}
                            onBookmarkToggle={() => toggleWatchlist(fund)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Card className="glass-card">
                      <CardContent className="py-12 text-center">
                        <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground mb-4">
                          Complete your investment profile to get personalized fund recommendations.
                        </p>
                        <Button onClick={() => setIsPreferencesModalOpen(true)}>
                          Take the Questionnaire
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* All Funds Tab */}
              {activeTab === 'allfunds' && (
                <AllFundsTab
                  funds={funds}
                  isLoading={isLoading}
                  onFundClick={handleFundClick}
                  isInWatchlist={isInWatchlist}
                  onBookmarkToggle={toggleWatchlist}
                />
              )}

              {/* Sectors Tab */}
              {activeTab === 'sectors' && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SectorSearchDropdown
                      funds={funds}
                      selectedFundId={selectedFundA}
                      onSelect={setSelectedFundA}
                      placeholder="Search Fund A by name or AMC..."
                      watchlistFundIds={watchlist.map(w => w.fund_id)}
                      onBookmarkToggle={toggleWatchlist}
                    />
                    <SectorSearchDropdown
                      funds={funds}
                      selectedFundId={selectedFundB}
                      onSelect={setSelectedFundB}
                      placeholder="Search Fund B by name or AMC..."
                      watchlistFundIds={watchlist.map(w => w.fund_id)}
                      onBookmarkToggle={toggleWatchlist}
                    />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sectorDataA && <SectorAllocationChart sectorData={sectorDataA} />}
                    {sectorDataB && <SectorAllocationChart sectorData={sectorDataB} />}
                  </div>
                  <FundComparisonCard fundA={comparisonFundA} fundB={comparisonFundB} />

                  <Card className="bg-secondary/30">
                    <CardContent className="py-4">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Note:</strong> Sector allocation data is indicative. For exact holdings, refer to the fund's official factsheet.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Watchlist Tab */}
              {activeTab === 'watchlist' && (
                <div className="animate-fade-in space-y-6">
                  {watchlistFunds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {watchlistFunds.map(fund => (
                        <FundCard 
                          key={fund.id}
                          fund={fund} 
                          onClick={() => handleFundClick(fund)}
                          isBookmarked={true}
                          onBookmarkToggle={() => toggleWatchlist(fund)}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="glass-card">
                      <CardContent className="py-12 text-center">
                        <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground mb-2">Your watchlist is empty</p>
                        <p className="text-sm text-muted-foreground">
                          Click the bookmark icon on any fund to add it to your watchlist
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div className="animate-fade-in space-y-6">
                  {/* Empty state: prompt to upload or add */}
                  {portfolio.length === 0 && !hasCamsData && (
                    <Card className="glass-card">
                      <CardContent className="py-8 text-center">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Upload CAMS statement / Create manually
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                          Import your full portfolio from a CAMS PDF, or add individual funds one at a time.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <CAMSUpload compact onDataLoaded={handleCamsDataLoaded} />
                          <Button onClick={() => setIsAddFundOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Mutual Fund
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Analytics dashboard when portfolio has data */}
                  {(portfolio.length > 0 || hasCamsData) && (
                    <>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Portfolio Analytics</h3>
                        <div className="flex gap-2">
                          <CAMSUpload compact onDataLoaded={handleCamsDataLoaded} />
                          <Button size="sm" onClick={() => setIsAddFundOpen(true)}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add Fund
                          </Button>
                        </div>
                      </div>

                      {portfolioLoading ? (
                        <DashboardLoadingState />
                      ) : (
                        <PortfolioAnalytics
                          portfolio={portfolio}
                          funds={funds}
                          userProfile={profile}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Build Portfolio Tab */}
              {activeTab === 'build' && (
                <BuildPortfolio funds={funds} userProfile={profile} />
              )}

              {/* AI Tab */}
              {activeTab === 'ai' && (
                <AIChat resetKey={aiResetKey} />
              )}
            </div>
          </div>
        </main>
      </div>
      
      {activeTab !== 'ai' && <Footer />}

      {/* Mobile bottom navigation (phones / small tablets only) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        watchlistCount={watchlist.length}
        portfolioCount={portfolio.length}
        onPreferencesSaved={() => setPrefVersion(v => v + 1)}
      />

      {/* Fund Detail Modal */}
      <FundDetailModal
        fund={selectedFundForModal}
        sectorData={modalSectorData}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToPortfolio={handleAddToPortfolio}
        userRiskProfile={profile?.risk_tolerance || undefined}
        isBookmarked={selectedFundForModal ? isInWatchlist(selectedFundForModal.id) : false}
        onBookmarkToggle={toggleWatchlist}
      />

      {/* Add to Portfolio Dialog */}
      <Dialog open={isAddToPortfolioOpen} onOpenChange={setIsAddToPortfolioOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Portfolio</DialogTitle>
            <DialogDescription>
              {portfolioFundToAdd?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invested-amount">Invested Amount (₹)</Label>
              <Input
                id="invested-amount"
                type="number"
                placeholder="e.g., 50000"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-sip"
                checked={isSip}
                onChange={(e) => setIsSip(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="is-sip">This is a SIP investment</Label>
            </div>
            {isSip && (
              <div className="space-y-2">
                <Label htmlFor="sip-amount">Monthly SIP Amount (₹)</Label>
                <Input
                  id="sip-amount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={sipAmount}
                  onChange={(e) => setSipAmount(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddToPortfolioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAddToPortfolio}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Portfolio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Portfolio Fund Detail Modal */}
      <PortfolioFundModal
        fund={selectedPortfolioFund}
        portfolioItem={selectedPortfolioItem}
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        insight={selectedPortfolioItem ? getPortfolioInsight(selectedPortfolioItem) : null}
      />

      {/* Add Mutual Fund manual flow */}
      <AddFundDialog
        open={isAddFundOpen}
        onClose={() => setIsAddFundOpen(false)}
        funds={funds}
        onAdd={async (fund, details) => {
          await addToPortfolio(fund, details);
        }}
      />

      {/* Preferences / Questionnaire Modal */}
      <PreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        onSaved={() => {
          setPrefVersion(v => v + 1);
          setIsPreferencesModalOpen(false);
        }}
      />
    </div>
  );
};

export default Index;
