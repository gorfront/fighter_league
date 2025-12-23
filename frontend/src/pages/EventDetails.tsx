import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  MapPin,
  Users,
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Share2,
} from "lucide-react";
import { Event } from "@/types/event";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userType, token } = useAuthStore();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await apiClient.get<Event>(`/events/${id}`);
        setEvent(response.data);
      } catch (err) {
        console.error(err);
        setError("Event not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This cannot be undone."
      )
    )
      return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Event Deleted",
        description: "The event has been removed.",
      });
      navigate("/events");
    } catch (err) {
      console.error(err);
      toast({
        title: "Delete Failed",
        description: "Could not delete the event.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground">{error || "Event not found"}</p>
          <Button variant="outline" onClick={() => navigate("/events")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const dateString = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const timeString = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="relative bg-gradient-stripe py-16 border-b">
          <div className="container max-w-5xl">
            <Button
              variant="ghost"
              className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
              onClick={() => navigate("/events")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <Badge
                  className={`mb-4 px-3 py-1 text-sm ${
                    event.status === "upcoming"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-500"
                  }`}
                >
                  {event.status.toUpperCase()}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                  {event.title}
                </h1>
                <div className="flex flex-col gap-2 text-lg text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>
                      {dateString} at {timeString}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link Copied",
                      description: "Event link copied to clipboard.",
                    });
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>

                {userType === "ADMIN" && (
                  <>
                    <Button
                      onClick={() => navigate(`/events/edit/${event.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-5xl py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Event Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Join us for {event.title}, featuring top-tier fighters from
                  around the globe competing in the {event.division || "Open"}{" "}
                  division. This event promises high-octane action and technique
                  display at {event.location}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground block mb-1">
                      Division
                    </span>
                    <div className="font-semibold flex items-center justify-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {event.division || "Open Weight"}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground block mb-1">
                      Status
                    </span>
                    <span className="font-semibold capitalize">
                      {event.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fight Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <h3 className="font-medium text-lg">
                    Matches Announced Soon
                  </h3>
                  <p className="text-muted-foreground">
                    The official match-ups for this event are currently being
                    finalized.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Attend Live</h3>
                <p className="opacity-90 mb-6">
                  Don't miss the action. Get your tickets now or subscribe for
                  updates.
                </p>
                <Button variant="secondary" className="w-full font-bold">
                  Get Tickets
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Location Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
                  Map View Unavailable
                </div>

                <p className="mt-4 text-sm font-medium">{event.location}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventDetails;
