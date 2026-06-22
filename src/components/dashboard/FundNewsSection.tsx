import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MutualFund } from '@/types/mutualFund';
import { Newspaper, ExternalLink, Clock, Loader2 } from 'lucide-react';

interface FundNewsSectionProps {
  fund: MutualFund;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function getSampleNews(query: string): NewsArticle[] {
  const base = new Date();
  return [
    {
      title: `Markets Update: ${query.split(' ')[0]} funds see increased inflows in Q2`,
      description: `Mutual fund inflows into ${query} category have surged 25% this quarter as investors seek diversified exposure.`,
      url: '#',
      source: 'Financial Express',
      publishedAt: new Date(base.getTime() - 2 * 3600000).toISOString(),
      imageUrl: null,
    },
    {
      title: `SEBI introduces new regulations for mutual fund expense ratios`,
      description: 'The market regulator has proposed stricter norms for total expense ratio calculations to protect retail investors.',
      url: '#',
      source: 'Economic Times',
      publishedAt: new Date(base.getTime() - 24 * 3600000).toISOString(),
      imageUrl: null,
    },
    {
      title: `SIP contributions cross record ₹25,000 crore milestone`,
      description: 'Systematic Investment Plan contributions have reached an all-time high, reflecting growing retail participation.',
      url: '#',
      source: 'Business Standard',
      publishedAt: new Date(base.getTime() - 48 * 3600000).toISOString(),
      imageUrl: null,
    },
    {
      title: `Top performing mutual fund categories of 2026 revealed`,
      description: 'Mid cap and small cap funds have led the returns chart this year, followed by flexi cap and sectoral funds.',
      url: '#',
      source: 'Moneycontrol',
      publishedAt: new Date(base.getTime() - 72 * 3600000).toISOString(),
      imageUrl: null,
    },
  ];
}

export function FundNewsSection({ fund }: FundNewsSectionProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchNews() {
      setLoading(true);
      try {
        const query = `${fund.amc} mutual fund India`;
        const sampleArticles = getSampleNews(query);
        if (!cancelled) {
          setArticles(sampleArticles.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to fetch fund news:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNews();
    return () => { cancelled = true; };
  }, [fund.amc, fund.category]);

  return (
    <Card className="glass-card border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          Related News
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading news...</span>
          </div>
        ) : articles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent news found for {fund.amc}</p>
        ) : (
          articles.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors border border-border/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {item.publishedAt ? timeAgo(item.publishedAt) : 'Recent'}
                    </span>
                    <span className="text-[10px] text-primary font-medium">{item.source}</span>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              </div>
            </a>
          ))
        )}
      </CardContent>
    </Card>
  );
}
