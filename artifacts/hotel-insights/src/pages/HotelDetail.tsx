import { useParams } from "wouter";
import { 
  useGetHotel,
  getGetHotelQueryKey,
  useGetRatingTrend,
  getGetRatingTrendQueryKey,
  useGetAnalyticsOverview,
  getGetAnalyticsOverviewQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from "recharts";
import { Star, MapPin, ArrowLeft, MessageSquare, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const hotelId = Number(id);

  const { data: hotel, isLoading: loadingHotel } = useGetHotel(hotelId, {
    query: { enabled: !!hotelId, queryKey: getGetHotelQueryKey(hotelId) }
  });

  const { data: overview, isLoading: loadingOverview } = useGetAnalyticsOverview({ hotelId }, {
    query: { enabled: !!hotelId, queryKey: getGetAnalyticsOverviewQueryKey({ hotelId }) }
  });

  const { data: ratingTrend, isLoading: loadingTrend } = useGetRatingTrend({ hotelId, months: 12 }, {
    query: { enabled: !!hotelId, queryKey: getGetRatingTrendQueryKey({ hotelId, months: 12 }) }
  });

  if (loadingHotel) {
    return <div className="space-y-6"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!hotel) return <div>Hotel not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/hotels" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to properties
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{hotel.name}</h1>
          <p className="text-muted-foreground mt-1 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {hotel.location}
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="px-3 py-1 font-mono text-sm bg-background">
            ID: {hotel.slug}
          </Badge>
          <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-transparent bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition-colors">
            View Listing
          </a>
        </div>
      </div>

      <p className="max-w-3xl text-sm leading-relaxed">{hotel.description}</p>

      {/* KPI Cards (Scoped to Hotel) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{overview?.averageRating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">Current score</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{overview?.totalReviews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Guest feedback collected</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{overview?.positivePercent.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Happy guests</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Ratio</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{overview?.negativePercent.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Unhappy guests</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historical Performance (12 Months)</CardTitle>
          <CardDescription>Monthly average rating vs review volume</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTrend ? <Skeleton className="h-[350px] w-full" /> : (
            <div className="h-[350px] w-full mt-4">
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
                    yAxisId="left"
                    domain={[0, 10]} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="averageRating" 
                    name="Avg Rating"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} 
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="step" 
                    dataKey="reviewCount" 
                    name="Reviews"
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="pt-6">
        <Link href={`/reviews?hotelId=${hotel.id}`} className="inline-flex items-center text-primary font-medium hover:underline">
          View all reviews for this property <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}