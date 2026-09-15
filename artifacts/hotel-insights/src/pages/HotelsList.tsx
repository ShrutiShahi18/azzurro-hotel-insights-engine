import { Link } from "wouter";
import { 
  useListHotels,
  getListHotelsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, MapPin, ArrowRight, ExternalLink } from "lucide-react";

export default function HotelsList() {
  const { data: hotels, isLoading } = useListHotels({
    query: { queryKey: getListHotelsQueryKey() }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
        <p className="text-muted-foreground mt-1">Manage your connected hotel properties.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : hotels?.map(hotel => (
          <Card key={hotel.id} className="flex flex-col hover-elevate transition-all group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{hotel.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {hotel.location}
                  </CardDescription>
                </div>
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Building className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {hotel.description || "No description available for this property."}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 border-t bg-muted/20 pt-4">
              <Button className="w-full group/btn" asChild>
                <Link href={`/hotels/${hotel.id}`} className="w-full">
                  View Insights <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer">
                  Booking.com <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}