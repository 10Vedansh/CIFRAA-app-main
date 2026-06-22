import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ExternalLink, Search, Loader2, Newspaper } from 'lucide-react';
import { FundexLogo } from '@/components/landing/FundexLogo';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

function getAllSampleNews(): NewsArticle[] {
  const now = Date.now();
  const h = (n: number) => new Date(now - n * 3600000).toISOString();
  return [
    { title: 'Mutual fund AUM crosses ₹70 lakh crore milestone', description: 'The Indian mutual fund industry has achieved a new milestone with assets under management crossing ₹70 lakh crore, driven by retail participation.', url: '#', source: 'Economic Times', publishedAt: h(2), imageUrl: '' },
    { title: 'SEBI tightens norms for small cap fund categorisation', description: 'SEBI has introduced stricter criteria for categorising small cap funds to prevent misclassification and protect investor interests.', url: '#', source: 'Business Standard', publishedAt: h(5), imageUrl: '' },
    { title: 'SIP inflows hit record ₹26,000 crore in May 2026', description: 'Systematic investment plan inflows reached an all-time high of ₹26,000 crore in May, reflecting strong retail investor confidence.', url: '#', source: 'Moneycontrol', publishedAt: h(8), imageUrl: '' },
    { title: 'Gold ETFs see highest inflows in 3 years amid market uncertainty', description: 'Investors flocked to gold ETFs as a safe haven, with inflows reaching their highest level since 2023.', url: '#', source: 'Financial Express', publishedAt: h(12), imageUrl: '' },
    { title: 'Large cap funds deliver steady 14% returns in FY26', description: 'Large cap mutual funds have delivered consistent returns of around 14% in the current fiscal year, providing stability to investors.', url: '#', source: 'Hindu Business Line', publishedAt: h(18), imageUrl: '' },
    { title: 'New fund offers (NFO) pipeline strong with 30+ launches this quarter', description: 'Asset management companies are launching over 30 new fund offers this quarter, focusing on thematic and sectoral opportunities.', url: '#', source: 'Livemint', publishedAt: h(24), imageUrl: '' },
    { title: 'Mid cap funds outperform with 22% average returns YTD', description: 'Mid cap funds have emerged as the best performing category in 2026, delivering average returns of 22% year-to-date.', url: '#', source: 'Economic Times', publishedAt: h(30), imageUrl: '' },
    { title: 'Passive investing gains traction; index fund AUM doubles', description: 'Assets under management for index funds and ETFs have doubled over the past year as more investors embrace passive strategies.', url: '#', source: 'Business Standard', publishedAt: h(36), imageUrl: '' },
    { title: 'ELSS tax saving funds see surge in Q4 investments', description: 'Equity Linked Savings Scheme (ELSS) funds witnessed a significant surge in investments during the fourth quarter as tax season approached.', url: '#', source: 'Moneycontrol', publishedAt: h(48), imageUrl: '' },
    { title: 'International mutual funds attract Indian investors despite global headwinds', description: 'Indian investors continue to allocate to international mutual funds, diversifying their portfolios across global markets.', url: '#', source: 'Financial Express', publishedAt: h(60), imageUrl: '' },
    { title: 'Debt mutual funds see renewed interest as interest rates stabilise', description: 'Debt mutual funds are witnessing renewed interest from investors as interest rates show signs of stabilisation after the recent cycle.', url: '#', source: 'Hindu Business Line', publishedAt: h(72), imageUrl: '' },
    { title: 'ESG investing in India: AUM grows to ₹50,000 crore', description: 'Environment, Social and Governance (ESG) focused mutual funds in India have seen their AUM grow to ₹50,000 crore.', url: '#', source: 'Livemint', publishedAt: h(84), imageUrl: '' },
    { title: 'Flexi cap funds offer best of both worlds for investors', description: 'Flexi cap funds continue to be popular among investors seeking the flexibility to invest across market capitalisations based on market conditions.', url: '#', source: 'Economic Times', publishedAt: h(96), imageUrl: '' },
    { title: 'NPS and mutual funds: Understanding the tax implications', description: 'A comprehensive guide to understanding the tax implications of investing in NPS versus mutual funds for retirement planning.', url: '#', source: 'Business Standard', publishedAt: h(108), imageUrl: '' },
    { title: 'Hybrid funds gain popularity as balanced investment option', description: 'Hybrid mutual funds are gaining traction among conservative investors looking for a balanced approach to equity and debt investing.', url: '#', source: 'Moneycontrol', publishedAt: h(120), imageUrl: '' },
  ];
}

export default function News() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<NewsArticle[]>(() => getAllSampleNews());
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const filteredArticles = search
    ? articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.description?.toLowerCase().includes(search.toLowerCase())
      )
    : articles;

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      setHasMore(false);
      setLoadingMore(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <FundexLogo size="sm" className="!h-8" />
          </div>
          <h1 className="text-lg font-semibold">Market News</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search news articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 bg-secondary/40 border-border/40 text-base"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading latest news...</p>
          </div>
        ) : error ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button variant="outline">Retry</Button>
            </CardContent>
          </Card>
        ) : filteredArticles.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No articles found.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, idx) => (
                <a
                  key={idx}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="glass-card h-full border-border/30 hover:border-primary/40 transition-all duration-300 overflow-hidden">
                    {article.imageUrl && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          {article.source}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                        {article.description}
                      </p>
                      <span className="text-xs text-primary flex items-center gap-1">
                        Read more <ExternalLink className="h-3 w-3" />
                      </span>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            {!search && hasMore && (
              <div className="flex justify-center mt-10">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading more...
                    </>
                  ) : (
                    'Load More News'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
