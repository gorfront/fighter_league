import { useState, useEffect } from "react";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Loader2,
  Edit,
  PlusCircle,
  Eye,
} from "lucide-react";
import { Event } from "@/types/event";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

const Events = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const userType = useAuthStore((s) => s.userType);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const [upcomingRes, pastRes] = await Promise.all([
          apiClient.get<Event[]>("/events?status=upcoming"),
          apiClient.get<Event[]>("/events?status=completed"),
        ]);

        setUpcomingEvents(upcomingRes.data);
        setPastEvents(pastRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleSubscribe = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setSubscribing(true);
    try {
      const res = await apiClient.post("/newsletter/subscribe", { email });

      toast({
        title: "Subscribed!",
        description: res.data.message || "You will now receive fight updates.",
      });

      setEmail("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const msg = error.response?.data?.message || "Subscription failed.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="p-6 bg-gradient-stripe hover:shadow-gold transition-all duration-300 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="w-full flex items-start justify-between gap-2">
          <h3 className="text-2xl font-bold mb-2 line-clamp-2">
            {event.title}
          </h3>
          <Badge
            className={
              event.status === "upcoming"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }
          >
            {event.status === "upcoming" ? "Upcoming" : "Completed"}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {new Date(event.event_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" />
          <span>{event.division}</span>
        </div>
      </div>

      {/* Buttons Area - Pushed to bottom */}
      <div className="mt-6 flex flex-col gap-3">
        {event.status === "upcoming" && (
          <Button
            className="w-full bg-gradient-gold hover:opacity-90 transition-opacity"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Button>
        )}

        {/* 🛠️ ADMIN EDIT BUTTON (Visible on Mobile) */}
        {userType === "ADMIN" && (
          <Button
            variant="secondary"
            className="w-full border border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/events/edit/${event.id}`);
            }}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Event
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-16 bg-gradient-stripe border-b border-border">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Fight <span className="text-primary">Events</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Upcoming championships and competition schedules
            </p>
          </div>
        </section>

        {loading && (
          <section className="py-12">
            <div className="container flex justify-center items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-xl text-muted-foreground">Loading Events...</p>
            </div>
          </section>
        )}

        {error && (
          <section className="py-12">
            <div className="container text-center">
              <p className="text-xl text-destructive">{error}</p>
            </div>
          </section>
        )}

        {/* Upcoming Events Section */}
        {!loading && !error && (
          <section className="py-12">
            <div className="container">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold">Upcoming Events</h2>

                {/* Global Create Button for Admin */}
                {userType === "ADMIN" && (
                  <Button
                    onClick={() => navigate("/events/create")}
                    className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                  </Button>
                )}
              </div>

              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No upcoming events scheduled.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Past Events Section */}
        {!loading && !error && pastEvents.length > 0 && (
          <section className="py-12 bg-card">
            <div className="container">
              <h2 className="text-3xl font-bold mb-8">Past Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Subscription Section */}
        <section
          className={`${show ? "pt-16 pb-4" : "py-16"} border-t border-border`}
        >
          <div className="container max-w-4xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Want to Attend or Compete?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Stay updated on all our events and be part of the Valor Fighting
              community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {userType === "GUEST" || !userType ? (
                <Button
                  size="lg"
                  className="bg-gradient-gold hover:opacity-90 transition-opacity"
                  onClick={() => navigate("/register")}
                >
                  Register as Fighter
                </Button>
              ) : null}

              <Button
                size="lg"
                variant="outline"
                onClick={() => setShow(!show)}
              >
                Subscribe to Updates
              </Button>
            </div>
          </div>
        </section>

        {show && (
          <section className="pb-16 px-4">
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribing}
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
              />
              <Button
                className="bg-gradient-gold hover:opacity-90 transition-opacity"
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wait...
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Events;
