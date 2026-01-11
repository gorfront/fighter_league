/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Loader2,
  Edit,
  PlusCircle,
  Eye,
  Radio,
  Clock,
  Bell,
  History,
} from "lucide-react";
import { Event } from "@/types/event";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import socket from "@/socket/socket";

const Events = () => {
  const { t } = useTranslation();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const userType = useAuthStore((s) => s.userType);
  const navigate = useNavigate();

  const formatEventDateTime = (dateStr: string, timeStr?: string) => {
    try {
      const dateDisplay = new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });

      let timeDisplay = timeStr || "";
      if (timeStr) {
        const [hours, minutes] = timeStr.split(":");
        const period = parseInt(hours) >= 12 ? "PM" : "AM";
        const adjustedHour = parseInt(hours) % 12 || 12;

        timeDisplay = `${adjustedHour}:${minutes} ${period}`;
      }

      return { dateDisplay, timeDisplay };
    } catch (err) {
      return { dateDisplay: dateStr, timeDisplay: timeStr || "" };
    }
  };

  const fetchEvents = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [liveRes, upcomingRes, pastRes] = await Promise.all([
        apiClient.get<Event[]>("/events?status=live"),
        apiClient.get<Event[]>("/events?status=upcoming"),
        apiClient.get<Event[]>("/events?status=completed"),
      ]);

      setLiveEvents(liveRes.data);
      setUpcomingEvents(upcomingRes.data);
      setPastEvents(pastRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      if (!isSilent) setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    const handleEventUpdate = () => {
      fetchEvents(true);

      toast({
        title: "Event Started!",
        description: "An upcoming event is now LIVE.",
        className: "bg-green-600 text-white",
      });
    };

    socket.on("events_updated", handleEventUpdate);

    return () => {
      socket.off("events_updated", handleEventUpdate);
    };
  }, [fetchEvents]);

  const handleSubscribe = async () => {
    if (!email) {
      toast({ title: "Email Required", variant: "destructive" });
      return;
    }
    setSubscribing(true);
    try {
      const res = await apiClient.post("/newsletter/subscribe", { email });
      toast({ title: "Subscribed!", description: res.data.message });
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Subscription failed.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const EventCard = ({ event }: { event: Event }) => {
    const isLive = event.status === "live";
    const { dateDisplay, timeDisplay } = formatEventDateTime(
      event.event_date,
      (event as any).started_time
    );

    return (
      <Card
        className={`p-5 transition-all duration-300 flex flex-col h-full border 
        ${isLive
            ? "border-green-500 shadow-lg shadow-green-500/20 bg-green-950/5"
            : "border-border bg-card hover:border-primary/50 hover:shadow-md"
          }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            {isLive ? (
              <Badge className="bg-green-600 animate-pulse flex items-center gap-1.5 px-3 py-1 text-white">
                <Radio className="h-3 w-3" /> {t("live")}
              </Badge>
            ) : (
              <Badge
                className={`flex items-center gap-1.5 px-3 py-1 ${event.status === "upcoming"
                  ? "bg-blue-600 text-white"
                  : "bg-muted"
                  }`}
              >
                {event.status === "upcoming" ? (
                  <Bell className="h-3 w-3" />
                ) : (
                  <History className="h-3 w-3" />
                )}
                {event.status === "upcoming" ? t("upcoming") : t("completed")}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-xs font-medium border-primary/20"
            >
              {t(`division_${event.division.toLowerCase().replace(/[^a-z0-9]/g, "_")}`, {
                defaultValue: event.division,
              })}
            </Badge>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-4 line-clamp-2 leading-tight">
          {event.title}
        </h3>

        <div className="space-y-3 flex-1 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm font-medium">{dateDisplay}</span>
          </div>

          {timeDisplay && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-medium">{timeDisplay}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm font-medium truncate">
              {event.location}
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          {(event.status === "upcoming" || event.status === "live") && (
            <Button
              className={`w-full font-bold ${isLive
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gradient-gold text-black"
                }`}
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {isLive ? t("watch_now") : t("view_details")}
            </Button>
          )}

          {userType === "ADMIN" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/events/edit/${event.id}`);
              }}
            >
              <Edit className="mr-2 h-4 w-4" /> {t("edit_event")}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-16 bg-gradient-stripe border-b">
          <div className="container">
            <div
              className={`flex flex-col md:flex-row justify-${userType === "ADMIN" ? "between" : "center"
                } items-center gap-6`}
            >
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <Trans i18nKey="fight_events">
                    Fight <span className="text-primary">Events</span>
                  </Trans>
                </h1>
                <p className="text-lg text-muted-foreground">
                  {t("upcoming_schedules")}
                </p>
              </div>
              {userType === "ADMIN" && (
                <Button
                  onClick={() => navigate("/events/create")}
                  className="bg-green-600 hover:bg-green-700 h-12 px-6 text-lg"
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> {t("create_event")}
                </Button>
              )}
            </div>
          </div>
        </section>

        {loading && (
          <div className="py-20 container flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xl text-muted-foreground">{t("loading_events")}</p>
          </div>
        )}

        {error && (
          <div className="py-12 container text-center text-destructive font-semibold">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-0">
            {liveEvents.length > 0 && (
              <section className="py-12 bg-green-500/5 border-b border-green-500/20">
                <div className="container">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative rounded-full h-4 w-4 bg-green-500"></span>
                    </span>
                    <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {t("live_now")}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {liveEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {upcomingEvents.length > 0 && (
              <section className="py-12 bg-background">
                <div className="container">
                  <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
                    <Calendar className="text-primary h-8 w-8" /> {t("upcoming_events")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcomingEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {pastEvents.length > 0 && (
              <section className="py-12 bg-muted/30 border-t">
                <div className="container">
                  <h2 className="text-3xl font-bold mb-8 text-muted-foreground">
                    {t("past_events")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-80">
                    {pastEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        <section
          className={`${showSubscribe ? "pt-16 pb-4" : "py-16"
            } border-t bg-background`}
        >
          <div className="container max-w-4xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              {t("attend_compete_title")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!userType && (
                <Button
                  size="lg"
                  className="bg-gradient-gold text-black font-bold"
                  onClick={() => navigate("/register")}
                >
                  {t("register_fighter")}
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowSubscribe(!showSubscribe)}
              >
                {t("subscribe_updates")}
              </Button>
            </div>
          </div>
        </section>

        {showSubscribe && (
          <section className="pb-16 px-4">
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t("subscribe_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribing}
              />
              <Button
                className="bg-gradient-gold text-black font-bold"
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  t("subscribe_button")
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
