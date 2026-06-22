import { useState, useEffect, useMemo } from 'react';
import { RawAnswers, FinalPortfolio } from '@/types/engine';
import { loadNormalisedUniverse } from '@/data/dataLoader';
import { NormalisedFundUniverse } from '@/data/normalisedFundUniverse';
import { buildPortfolio } from '@/engine/layer9-portfolio/portfolioConstructor';

interface UseNewRecommendationsResult {
  portfolio: FinalPortfolio | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that loads the normalised fund universe and builds a portfolio
 * from raw questionnaire answers using the v2 engine pipeline.
 */
export function useNewRecommendations(answers: RawAnswers | null): UseNewRecommendationsResult {
  const [universe, setUniverse] = useState<NormalisedFundUniverse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadNormalisedUniverse()
      .then((u) => {
        if (!cancelled) {
          setUniverse(u);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err));
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const portfolio = useMemo(() => {
    if (!universe || !answers) {
      console.log("USE NEW RECOMMENDATIONS — skip (universe:" + !!universe + ", answers:" + !!answers + ")");
      return null;
    }
    console.log("USE NEW RECOMMENDATIONS — starting buildPortfolio with goal:", answers.goal, "horizon:", answers.horizon);
    try {
      const result = buildPortfolio(answers, universe);
      console.log("USE NEW RECOMMENDATIONS — result portfolio. recommendedFunds:", result.recommendedFunds.length);
      return result;
    } catch (err) {
      console.error("USE NEW RECOMMENDATIONS — error", err);
      setError(String(err));
      return null;
    }
  }, [universe, answers]);

  return { portfolio, isLoading, error };
}
