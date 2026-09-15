import { useState } from "react";
import { 
  useListInsights,
  useGenerateInsights,
  useListHotels,
  getListInsightsQueryKey,
  getListHotelsQueryKey,
  InsightType
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, AlertTriangle, ListChecks, Wand2, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Insights() {
  const [hotelId, setHotelId] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: hotels } = useListHotels({
    query: { queryKey: getListHotelsQueryKey() }
  });

  const queryParams = hotelId !== "all" ? { hotelId: Number(hotelId) } : {};
  
  const { data: insights, isLoading } = useListInsights(queryParams, {
    query: { queryKey: getListInsightsQueryKey(queryParams) }
  });

  const generateInsights = useGenerateInsights();

  const handleGenerate = () => {
    if (hotelId === "all") {
      toast({
        title: "Select a property",
        description: "Please select a specific hotel to generate insights.",
        variant: "destructive"
      });
      return;
    }
    
    generateInsights.mutate({ data: { hotelId: Number(hotelId) } }, {
      onSuccess: () => {
        toast({
          title: "Insights Generated",
          description: "New AI analysis is ready.",
        });
        queryClient.invalidateQueries({ queryKey: getListInsightsQueryKey(queryParams) });
      },
      onError: () => {
        toast({
          title: "Generation failed",
          description: "Could not generate insights at this time.",
          variant: "destructive"
        });
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case InsightType.trend_alert: return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case InsightType.recommendation: return <ListChecks className="h-5 w-5 text-blue-500" />;
      case InsightType.summary: return <Lightbulb className="h-5 w-5 text-green-500" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch(type) {
      case InsightType.trend_alert: return "neutral"; // Maps to amber
      case InsightType.recommendation: return "default"; // Maps to blue
      case InsightType.summary: return "positive"; // Maps to green
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground mt-1">Actionable intelligence extracted from guest feedback.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select 
            value={hotelId} 
            onChange={(e) => setHotelId(e.target.value)}
            className="w-full sm:w-[250px]"
          >
            <option value="all">All Properties</option>
            {hotels?.map(h => (
              <option key={h.id} value={h.id.toString()}>{h.name}</option>
            ))}
          </Select>
          
          <Button 
            onClick={handleGenerate} 
            disabled={generateInsights.isPending}
            className="whitespace-nowrap"
          >
            {generateInsights.isPending ? (
              <span className="flex items-center">Generating...</span>
            ) : (
              <span className="flex items-center"><Wand2 className="mr-2 h-4 w-4" /> Run Analysis</span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : insights?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg border border-dashed">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">No insights available</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Run analysis on a specific property to generate AI insights.</p>
            <Button variant="outline" onClick={() => setHotelId(hotels?.[0]?.id.toString() || "all")}>
              Select a property first
            </Button>
          </div>
        ) : (
          insights?.map((insight) => (
            <Card key={insight.id} className="overflow-hidden border-l-4" style={{ 
              borderLeftColor: 
                insight.type === InsightType.trend_alert ? 'hsl(var(--chart-3))' :
                insight.type === InsightType.recommendation ? 'hsl(var(--primary))' :
                'hsl(var(--chart-2))'
            }}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md hidden sm:block">
                      {getTypeIcon(insight.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {insight.title}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <span className="font-semibold text-foreground">{insight.hotelName}</span>
                        <span>•</span>
                        <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                        {insight.metric && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{insight.metric}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getBadgeVariant(insight.type) as any} className="capitalize hidden sm:inline-flex shrink-0">
                    {insight.type.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="pl-0 sm:pl-14">
                  <p className="text-sm leading-relaxed text-foreground/90">{insight.content}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}