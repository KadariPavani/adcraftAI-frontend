import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, MessageCircle, Instagram, Globe, ExternalLink } from "lucide-react";

interface ClickData {
  source: string;
  count: number;
}

interface ProductAnalyticsProps {
  productLinkId: string;
}

export function ProductAnalytics({ productLinkId }: ProductAnalyticsProps) {
  const [clicks, setClicks] = useState<ClickData[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [productLinkId]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('link_clicks')
        .select('source')
        .eq('product_link_id', productLinkId);

      if (error) throw error;

      // Aggregate by source
      const sourceMap = new Map<string, number>();
      (data || []).forEach(click => {
        const source = click.source || 'direct';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const clickData = Array.from(sourceMap.entries()).map(([source, count]) => ({
        source,
        count
      })).sort((a, b) => b.count - a.count);

      setClicks(clickData);
      setTotalClicks(data?.length || 0);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'website':
        return <Globe className="w-4 h-4 text-accent" />;
      case 'marketplace':
        return <ExternalLink className="w-4 h-4 text-tertiary" />;
      default:
        return <Eye className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source.toLowerCase()) {
      case 'direct':
        return 'Direct Link';
      case 'whatsapp':
        return 'WhatsApp';
      case 'instagram':
        return 'Instagram';
      case 'website':
        return 'Website';
      case 'marketplace':
        return 'Marketplace';
      default:
        return source.charAt(0).toUpperCase() + source.slice(1);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary rounded"></div>
            <div className="h-4 bg-secondary rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Link Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-bold">{totalClicks}</p>
          <p className="text-sm text-muted-foreground">Total clicks</p>
        </div>

        {clicks.length > 0 ? (
          <div className="space-y-2">
            {clicks.map((click) => (
              <div 
                key={click.source} 
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  {getSourceIcon(click.source)}
                  <span className="text-sm">{getSourceLabel(click.source)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="h-2 bg-primary/20 rounded-full overflow-hidden"
                    style={{ width: '80px' }}
                  >
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(click.count / totalClicks) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{click.count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No clicks yet. Share your link to start tracking!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
