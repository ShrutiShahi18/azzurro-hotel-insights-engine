import { 
  useGetAnalyticsOverview, 
  useGetRatingTrend, 
  useGetHotelComparison, 
  useGetSentimentDistribution, 
  useGetComplaintCategories, 
  getGetAnalyticsOverviewQueryKey,
  getGetRatingTrendQueryKey,
  getGetHotelComparisonQueryKey,
  getGetSentimentDistributionQueryKey,
  getGetComplaintCategoriesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Star, MessageSquare, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  // Use generic queries for the dashboard (all hotels)
  const { data: overview, isLoading: loadingOverview } = useGetAnalyticsOverview(undefined, { 
    query: { queryKey: getGetAnalyticsOverviewQueryKey() } 
  });
  
  const { data: ratingTrend, isLoading: loadingTrend } = useGetRatingTrend({ months: 6 }, { 
    query: { queryKey: getGetRatingTrendQueryKey({ months: 6 }) } 
  });

  const { data: comparison, isLoading: loadingComp } = useGetHotelComparison({
    query: { queryKey: getGetHotelComparisonQueryKey() }
  });

  const { data: sentiment, isLoading: loadingSent } = useGetSentimentDistribution(undefined, {
    query: { queryKey: getGetSentimentDistributionQueryKey() }
  });

  const { data: complaints, isLoading: loadingCompCats } = useGetComplaintCategories(undefined, {
    query: { queryKey: getGetComplaintCategoriesQueryKey() }
  });

  // Colors for charts
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  const SENTIMENT_COLORS = {
    positive: 'hsl(var(--chart-2))', // Green
    neutral: 'hsl(var(--chart-3))',  // Yellow
    negative: 'hsl(var(--chart-4))'  // Red
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time performance across 4 properties.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{overview?.averageRating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  {overview && overview.weeklyRatingChange >= 0 ? (
                    <span className="text-green-600 flex items-center"><ArrowUpRight className="h-3 w-3 mr-1" /> {overview.weeklyRatingChange.toFixed(1)}</span>
                  ) : (
                    <span className="text-red-600 flex items-center"><ArrowDownRight className="h-3 w-3 mr-1" /> {Math.abs(overview?.weeklyRatingChange || 0).toFixed(1)}</span>
                  )}
                  <span className="ml-2">from last week</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{overview?.totalReviews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime volume
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{overview?.positivePercent.toFixed(0)}%</div>
                <div className="w-full bg-secondary h-1.5 rounded-full mt-2">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${overview?.positivePercent}%` }} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{overview?.negativePercent.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Negative sentiment share
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Rating Trend Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Rating Trend (6 Months)</CardTitle>
            <CardDescription>Aggregate performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrend ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratingTrend} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="averageRating" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} 
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Sentiment Breakdown</CardTitle>
            <CardDescription>Total review distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {loadingSent ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Positive', value: sentiment?.reduce((acc, curr) => acc + curr.positive, 0) || 0 },
                        { name: 'Neutral', value: sentiment?.reduce((acc, curr) => acc + curr.neutral, 0) || 0 },
                        { name: 'Negative', value: sentiment?.reduce((acc, curr) => acc + curr.negative, 0) || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill={SENTIMENT_COLORS.positive} />
                      <Cell fill={SENTIMENT_COLORS.neutral} />
                      <Cell fill={SENTIMENT_COLORS.negative} />
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Hotel Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Property Comparison</CardTitle>
            <CardDescription>Average rating by hotel</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingComp ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 10]} hide />
                    <YAxis 
                      type="category" 
                      dataKey="hotelName" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                      width={120}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Bar dataKey="averageRating" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                      {
                        comparison?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complaint Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Complaint Topics</CardTitle>
            <CardDescription>Negative review themes</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCompCats ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complaints?.slice(0, 5)} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}