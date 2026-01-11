/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "@/components/Loaders/Loader2";
import { getFlagComponent } from "@/hooks/getFlagComponent";

import {
  Calendar,
  MapPin,
  ArrowLeft,
  Edit,
  Trash2,
  Share2,
  Swords,
  Trophy,
  UserPlus,
  Clock,
  PartyPopper,
  Info,
  StopCircle,
  Users,
  Radio,
  CheckCircle2,
  Bell,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import { Event } from "@/types/event";

interface EventWithStatus extends Event {
  application_status?: "pending" | "approved" | "rejected" | null;
  started_time?: string;
  finished_time?: string | null;
}

const EventDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userType, token } = useAuthStore();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventWithStatus | null>(null);
  const [fights, setFights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [appStatus, setAppStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [eventRes, fightsRes] = await Promise.all([
        apiClient.get<EventWithStatus>(`/events/${id}`),
        apiClient.get(`/fights/event/${id}`),
      ]);
      setEvent(eventRes.data);
      setFights(fightsRes.data);

      if (eventRes.data.application_status) {
        setAppStatus(eventRes.data.application_status);
      }
    } catch (err) {
      console.error(err);
      setError("Event not found or failed to load.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handleJoinEvent = async () => {
    if (!token) return;
    setIsJoining(true);
    try {
      await apiClient.post(
        `/events/${id}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: t("event_join_success_title"),
        description: t("event_join_success_desc"),
      });
      setAppStatus("pending");
    } catch (error: any) {
      const msg = error.response?.data?.message || t("event_join_failed_desc");
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  const handleEndEvent = async () => {
    if (
      !confirm(
        t("event_end_confirm")
      )
    )
      return;
    setIsEnding(true);
    try {
      await apiClient.post(
        `/events/${id}/end`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: t("event_ended_title"),
        description: t("event_ended_desc"),
      });
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to end event", variant: "destructive" });
    } finally {
      setIsEnding(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm(t("event_delete_confirm"))) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: t("event_deleted_title") });
      navigate("/events");
    } catch (err) {
      toast({ title: t("event_delete_failed"), variant: "destructive" });
      setIsDeleting(false);
    }
  };

  const renderStatusSection = () => {
    if (userType !== "FIGHTER" && userType !== "ADMIN") return null;
    if (isJoining)
      return (
        <Button
          disabled
          className="w-full md:w-auto min-w-[140px] bg-gradient-gold text-black"
        >
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("event_sending")}
        </Button>
      );
    if (appStatus === "pending")
      return (
        <Button
          disabled
          className="w-full md:w-auto min-w-[140px] bg-yellow-500 text-black opacity-100 cursor-default"
        >
          <Clock className="h-4 w-4 mr-2" /> {t("event_app_pending")}
        </Button>
      );
    if (appStatus === "approved")
      return (
        <div className="w-full bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-lg p-4 mb-4 flex items-start gap-3 shadow-sm">
          <div className="bg-green-500/20 dark:bg-green-600/20 p-2 rounded-full text-green-700 dark:text-green-400 mt-1">
            <PartyPopper className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-green-800 dark:text-green-400 text-lg">
              {t("event_app_approved_title")}
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
              {t("event_app_approved_desc")}
            </p>
          </div>
        </div>
      );
    if (appStatus === "rejected")
      return (
        <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 mb-4 flex items-start gap-3 shadow-sm">
          <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-full text-red-600 dark:text-red-400 mt-1">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-red-500 text-lg">
              {t("event_app_rejected_title")}
            </h4>
            <p className="text-sm text-red-400 leading-relaxed">
              {t("event_app_rejected_desc")}
            </p>
          </div>
        </div>
      );
    if (event?.status === "upcoming" && userType === "FIGHTER")
      return (
        <Button
          onClick={handleJoinEvent}
          className="w-full md:w-auto min-w-[140px] font-bold bg-gradient-gold hover:opacity-90 text-black shadow-lg"
        >
          <UserPlus className="h-4 w-4 mr-2" /> {t("event_apply_btn")}
        </Button>
      );
    return null;
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (error || !event) return <div>Error: {error}</div>;

  const eventDate = new Date(event.event_date);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="relative bg-gradient-stripe py-12 md:py-16 border-b">
          <div className="container max-w-5xl">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate("/events")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_events")}
            </Button>

            {renderStatusSection()}

            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="w-full">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge
                    className={`px-3 py-1 text-sm border-none ${event.status === "upcoming"
                      ? "bg-blue-600"
                      : event.status === "live"
                        ? "bg-green-600 animate-pulse"
                        : "bg-gray-500"
                      }`}
                  >
                    {event.status === "live" ? (
                      <Radio className="h-3 w-3 mr-1.5" />
                    ) : (
                      <Bell className="h-3 w-3 mr-1.5" />
                    )}
                    {event.status.toUpperCase()}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm bg-muted"
                  >
                    {event.division || t("open_weight")}
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight text-left">
                  {event.title}
                </h1>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-lg text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {eventDate.toLocaleDateString()}
                  </div>
                  {event.started_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      {event.started_time}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {event.location}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[200px]">
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({ title: t("link_copy_title") });
                    }}
                    className="w-full sm:flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" /> {t("share_btn")}
                  </Button>
                  {userType === "ADMIN" && (
                    <>
                      {event.status === "live" && (
                        <Button
                          onClick={handleEndEvent}
                          disabled={isEnding}
                          className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isEnding ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <StopCircle className="h-4 w-4 mr-2" />
                          )}
                          <span>{t("end_event_btn")}</span>
                        </Button>
                      )}

                      <Button
                        onClick={() => navigate(`/events/edit/${event.id}`)}
                        className="w-full sm:flex-1 flex items-center justify-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>{t("edit_btn")}</span>
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={handleDeleteEvent}
                        disabled={isDeleting}
                        className="w-full sm:flex-1 flex items-center justify-center gap-2"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span>{t("delete_btn")}</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-6xl py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden border-t-4 border-t-primary shadow-md">
              <CardHeader className="bg-muted/20 pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Swords className="h-6 w-6 text-primary" />
                  {t("official_fight_card")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {fights.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {t("no_fights_announced")}
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                          <tr>
                            <th className="px-4 py-3 text-right w-[35%]">
                              {t("red_corner_th")}
                            </th>

                            <th className="px-4 py-3 text-center w-[15%]">
                              VS
                            </th>

                            <th className="px-4 py-3 text-left w-[35%]">
                              {t("blue_corner_th")}
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y">
                          {fights.map((fight) => (
                            <tr
                              key={fight.id}
                              className="hover:bg-muted/5 transition-colors group cursor-pointer"
                              onClick={() => navigate(`/fights/${fight.id}`)}
                            >
                              <td className="px-4 py-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-lg text-red-700 dark:text-red-400 flex items-center gap-2">
                                    {fight.redCorner?.rank && (
                                      <span className="text-xs text-muted-foreground bg-muted px-1 rounded">
                                        #{fight.redCorner.rank}
                                      </span>
                                    )}

                                    {fight.redCorner?.name}

                                    {getFlagComponent(
                                      fight.redCorner?.country || ""
                                    )}
                                  </span>

                                  <span className="text-xs text-muted-foreground">
                                    {fight.redCorner?.record} •{" "}
                                    {fight.redCorner?.country}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-4 text-center align-middle">
                                <div className="flex flex-col items-center justify-center h-full">
                                  {fight.is_title_fight && (
                                    <Trophy className="h-4 w-4 text-yellow-500 mb-1 animate-pulse" />
                                  )}

                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] uppercase px-1.5 py-0.5 mb-1 bg-muted"
                                  >
                                    {fight.weight_class}
                                  </Badge>

                                  <span className="text-xs font-bold text-muted-foreground">
                                    VS
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-4 text-left">
                                <div className="flex flex-col items-start">
                                  <span className="font-bold text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                    {getFlagComponent(
                                      fight.blueCorner?.country || ""
                                    )}

                                    {fight.blueCorner?.name}

                                    {fight.blueCorner?.rank && (
                                      <span className="text-xs text-muted-foreground bg-muted px-1 rounded">
                                        #{fight.blueCorner.rank}
                                      </span>
                                    )}
                                  </span>

                                  <span className="text-xs text-muted-foreground">
                                    {fight.blueCorner?.record} •{" "}
                                    {fight.blueCorner?.country}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden divide-y">
                      {fights.map((fight) => (
                        <div
                          key={fight.id}
                          className="p-4 flex flex-col items-center gap-2 relative"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                              {fight.weight_class}
                            </span>

                            {fight.is_title_fight && (
                              <Badge
                                variant="outline"
                                className="bg-yellow-500/10 text-yellow-600 border-yellow-200 gap-1.5 py-0 h-6"
                              >
                                <Trophy className="h-3 w-3 fill-yellow-600/20" />{" "}
                                {t("title_fight_badge")}
                              </Badge>
                            )}
                          </div>

                          <div className="w-full flex justify-between items-start px-2 mt-2">
                            <div className="text-center w-[40%] flex flex-col items-center">
                              <div className="mb-2 scale-125 shadow-sm rounded-sm overflow-hidden">
                                {getFlagComponent(
                                  fight.redCorner?.country || ""
                                )}
                              </div>

                              <div className="font-bold text-red-600 leading-tight text-sm">
                                {fight.redCorner?.name}
                              </div>

                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {fight.redCorner?.record}
                              </div>
                            </div>

                            <div className="flex flex-col items-center justify-center pt-1 w-[20%]">
                              {fight.is_title_fight ? (
                                <Trophy className="h-5 w-5 text-yellow-500 mb-1 animate-pulse drop-shadow-md" />
                              ) : (
                                <div className="h-5 w-5" />
                              )}

                              <div className="font-black text-xl text-muted-foreground/30 italic leading-none">
                                VS
                              </div>
                            </div>

                            <div className="text-center w-[40%] flex flex-col items-center">
                              <div className="mb-2 scale-125 shadow-sm rounded-sm overflow-hidden">
                                {getFlagComponent(
                                  fight.blueCorner?.country || ""
                                )}
                              </div>

                              <div className="font-bold text-blue-600 leading-tight text-sm">
                                {fight.blueCorner?.name}
                              </div>

                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {fight.blueCorner?.record}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("event_overview_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {t("event_join_us_desc", {
                    title: event.title,
                    location: event.location,
                  })}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground block mb-1">
                      {t("division_label")}
                    </span>
                    <div className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {event.division || t("open_weight")}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground block mb-1">
                      {t("start_time_label")}
                    </span>
                    <div className="font-semibold flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {event.started_time || t("tba_label")}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground block mb-1">
                      {t("status_label")}
                    </span>
                    <div className="font-semibold flex items-center justify-center gap-2">
                      {event.status === "live" ? (
                        <Radio className="h-4 w-4 text-primary" />
                      ) : (
                        <Bell className="h-4 w-4 text-primary" />
                      )}
                      {event.status}
                    </div>
                  </div>
                </div>

                {event.status === "completed" && event.finished_time && (
                  <div className="p-4 bg-green-500/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                    <div>
                      <span className="text-xs text-green-600 dark:text-green-500 font-bold uppercase tracking-wider">
                        {t("event_concluded_title")}
                      </span>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {t("event_finished_at")}{" "}
                        {new Date(event.finished_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">{t("attend_live_title")}</h3>
                <p className="opacity-90 mb-6 text-sm">
                  {t("attend_live_desc")}
                </p>
                <Button
                  variant="secondary"
                  className="w-full font-bold shadow-sm hover:bg-muted text-primary"
                >
                  {t("get_tickets_btn")}
                </Button>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">{t("venue_map_title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video w-full bg-muted relative">
                  {event.location ? (
                    <iframe
                      title="Event Location"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        event.location
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      <MapPin className="h-6 w-6 mr-2 opacity-50" /> {t("no_location_provided")}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <p className="text-sm font-medium flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    {event.location}
                  </p>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          event.location
                        )}`,
                        "_blank"
                      )
                    }
                  >
                    <MapPin className="mr-2 h-4 w-4" /> {t("get_directions_btn")}
                  </Button>
                </div>
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



