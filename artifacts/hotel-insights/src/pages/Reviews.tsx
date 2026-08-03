import { useState } from "react";
import { 
  useListReviews,
  useListHotels,
  getListReviewsQueryKey,
  getListHotelsQueryKey,
  ReviewSentiment,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Search, Filter, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function Reviews() {
  const [page, setPage] = useState(1);
  const [hotelId, setHotelId] = useState<string>("all");
  const [sentiment, setSentiment] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: hotels } = useListHotels({
    query: { queryKey: getListHotelsQueryKey() }
  });

  const queryParams = {
    page,
    pageSize: 10,
    ...(hotelId !== "all" && { hotelId: Number(hotelId) }),
    ...(sentiment !== "all" && { sentiment: sentiment as ReviewSentiment }),
    ...(search && { search })
  };

  const { data: reviewPage, isLoading, isFetching } = useListReviews(queryParams, {
    query: { 
      queryKey: getListReviewsQueryKey(queryParams),
      keepPreviousData: true
    }
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1); // Reset page on search
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Feed</h1>
          <p className="text-muted-foreground mt-1">Raw guest feedback across all properties.</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end md:items-center">
          <form onSubmit={handleSearch} className="relative w-full md:w-96 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search reviews..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select 
              value={hotelId} 
              onChange={(e) => { setHotelId(e.target.value); setPage(1); }}
              className="w-full md:w-[200px]"
            >
              <option value="all">All Properties</option>
              {hotels?.map(h => (
                <option key={h.id} value={h.id.toString()}>{h.name}</option>
              ))}
            </Select>

            <Select 
              value={sentiment} 
              onChange={(e) => { setSentiment(e.target.value); setPage(1); }}
              className="w-full md:w-[150px]"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : reviewPage?.reviews.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-dashed">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">No reviews found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviewPage?.reviews.map((review) => (
              <Card key={review.id} className={`transition-all hover-elevate ${isFetching ? 'opacity-70' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Left Sidebar (Meta) */}
                    <div className="sm:w-48 flex-shrink-0 space-y-4">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-bold text-xl">{review.rating.toFixed(1)}</span>
                          <Star className="h-5 w-5 fill-primary text-primary" />
                        </div>
                        <Badge variant={review.sentiment as any} className="capitalize">{review.sentiment}</Badge>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div className="font-medium">{review.reviewerName}</div>
                        {review.reviewerCountry && (
                          <div className="text-muted-foreground">{review.reviewerCountry}</div>
                        )}
                        <div className="text-muted-foreground text-xs mt-2 flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {new Date(review.reviewDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Right Content (Review Text) */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-muted text-xs font-mono">{review.hotelName}</Badge>
                        {review.stayType && <span className="text-xs text-muted-foreground">{review.stayType}</span>}
                      </div>
                      <p className="text-sm leading-relaxed mb-4">
                        {review.text}
                      </p>
                      
                      {(review.positives || review.negatives) && (
                        <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm bg-muted/50 p-3 rounded-md">
                          {review.positives && (
                            <div>
                              <span className="font-semibold text-green-700 dark:text-green-400 block mb-1">Pros:</span>
                              <span className="text-muted-foreground">{review.positives}</span>
                            </div>
                          )}
                          {review.negatives && (
                            <div>
                              <span className="font-semibold text-red-700 dark:text-red-400 block mb-1">Cons:</span>
                              <span className="text-muted-foreground">{review.negatives}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {review.topics && review.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {review.topics.map((t, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] font-normal px-2 py-0">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {reviewPage && reviewPage.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(reviewPage.page - 1) * reviewPage.pageSize + 1} to {Math.min(reviewPage.page * reviewPage.pageSize, reviewPage.total)} of {reviewPage.total}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={page >= reviewPage.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}