import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Check,
  X,
  Trash2,
  Shield,
  User,
  Loader2,
  Calendar,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";

interface FighterListing {
  id: number;
  name: string;
  country: string;
  division: string;
  weight: number;
}

interface SponsorListing {
  id: number;
  company_name: string;
  email: string;
  tier: string;
}

interface DonorListing {
  id: number;
  email: string;
  wallet_address: string;
}

interface EventApplication {
  id: number;
  status: string;
  createdAt: string;
  Event: {
    title: string;
    event_date: string;
  };
  User: {
    email: string;
    Fighter?: {
      name: string;
      wins: number;
      losses: number;
      draws: number;
      country: string;
    };
  };
}

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const token = useAuthStore((s) => s.token);

  const [pending, setPending] = useState<FighterListing[]>([]);
  const [verified, setVerified] = useState<FighterListing[]>([]);
  const [sponsors, setSponsors] = useState<SponsorListing[]>([]);
  const [donors, setDonors] = useState<DonorListing[]>([]);
  const [applications, setApplications] = useState<EventApplication[]>([]);

  const [loading, setLoading] = useState({
    pending: true,
    verified: false,
    sponsors: false,
    donors: false,
    applications: false,
  });

  const [fetched, setFetched] = useState({
    verified: false,
    sponsors: false,
    donors: false,
    applications: false,
  });

  const authHeaders = useMemo(() =>
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    [token]
  );

  const fetchPendingFighters = useCallback(async () => {
    if (!token) return;
    try {
      setLoading((prev) => ({ ...prev, pending: true }));
      const res = await apiClient.get<FighterListing[]>(
        "dashboard/admin/fighters/pending",
        authHeaders
      );
      setPending(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, pending: false }));
    }
  }, [token, authHeaders]);

  const fetchVerifiedFighters = async () => {
    try {
      setLoading((prev) => ({ ...prev, verified: true }));
      const res = await apiClient.get<FighterListing[]>(
        "dashboard/admin/fighters/verified",
        authHeaders
      );
      setVerified(res.data);
      setFetched((prev) => ({ ...prev, verified: true }));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load fighters.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, verified: false }));
    }
  };

  const fetchSponsors = async () => {
    try {
      setLoading((prev) => ({ ...prev, sponsors: true }));
      const res = await apiClient.get<SponsorListing[]>(
        "dashboard/admin/sponsors",
        authHeaders
      );
      setSponsors(res.data);
      setFetched((prev) => ({ ...prev, sponsors: true }));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load sponsors.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, sponsors: false }));
    }
  };

  const fetchDonors = async () => {
    try {
      setLoading((prev) => ({ ...prev, donors: true }));
      const res = await apiClient.get<DonorListing[]>(
        "dashboard/admin/donors",
        authHeaders
      );
      setDonors(res.data);
      setFetched((prev) => ({ ...prev, donors: true }));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load donors.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, donors: false }));
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading((prev) => ({ ...prev, applications: true }));
      const res = await apiClient.get<EventApplication[]>(
        "dashboard/admin/applications",
        authHeaders
      );
      setApplications(res.data);
      setFetched((prev) => ({ ...prev, applications: true }));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, applications: false }));
    }
  };

  const handleApproveFighter = async (id: number) => {
    try {
      await apiClient.patch(
        `dashboard/admin/fighters/${id}/approve`,
        {},
        authHeaders
      );
      const approved = pending.find((f) => f.id === id);
      setPending((prev) => prev.filter((f) => f.id !== id));
      if (approved && fetched.verified)
        setVerified((prev) => [approved, ...prev]);
      toast({ title: t("success_title"), description: t("fighter_approved") });
    } catch (err) {
      toast({
        title: t("error_title"),
        description: t("registration_failed"),
        variant: "destructive",
      });
    }
  };

  const handleRejectFighter = async (id: number) => {
    try {
      await apiClient.delete(`dashboard/admin/fighters/${id}`, authHeaders);
      setPending((prev) => prev.filter((f) => f.id !== id));
      toast({ title: t("success_title"), description: t("fighter_rejected") });
    } catch (err) {
      toast({
        title: t("error_title"),
        description: t("registration_failed"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteVerified = async (id: number) => {
    try {
      await apiClient.delete(`dashboard/admin/fighters/${id}`, authHeaders);
      setVerified((prev) => prev.filter((f) => f.id !== id));
      toast({ title: t("success_title"), description: t("fighter_deleted") });
    } catch (err) {
      toast({
        title: t("error_title"),
        description: t("event_delete_failed"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteSponsor = async (id: number) => {
    try {
      await apiClient.delete(`dashboard/admin/sponsors/${id}`, authHeaders);
      setSponsors((prev) => prev.filter((s) => s.id !== id));
      toast({ title: t("success_title"), description: t("sponsor_deleted") });
    } catch (err) {
      toast({
        title: t("error_title"),
        description: t("event_delete_failed"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteDonor = async (id: number) => {
    try {
      await apiClient.delete(`dashboard/admin/donors/${id}`, authHeaders);
      setDonors((prev) => prev.filter((d) => d.id !== id));
      toast({ title: t("success_title"), description: t("donor_deleted") });
    } catch (err) {
      toast({
        title: t("error_title"),
        description: t("event_delete_failed"),
        variant: "destructive",
      });
    }
  };

  const handleReviewApplication = async (
    id: number,
    status: "approved" | "rejected"
  ) => {
    try {
      await apiClient.patch(
        `dashboard/admin/applications/${id}`,
        { status },
        authHeaders
      );
      setApplications((prev) => prev.filter((app) => app.id !== id));
      toast({
        title: status === "approved" ? t("approved") : t("rejected"),
        description: t("application_updated", { status: t(status) }),
      });
    } catch (err) {
      toast({
        title: t("error_title"),
        description: t("failed_update_status"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (token) fetchPendingFighters();
  }, [token, fetchPendingFighters]);

  const onTabChange = (value: string) => {
    if (value === "fighters" && !fetched.verified) fetchVerifiedFighters();
    if (value === "sponsors" && !fetched.sponsors) fetchSponsors();
    if (value === "donors" && !fetched.donors) fetchDonors();
    if (value === "applications" && !fetched.applications) fetchApplications();
  };

  const EmptyState = ({ message }: { message: string }) => (
    <p className="text-muted-foreground text-center py-8">{message}</p>
  );

  const tierColors: Record<string, string> = {
    Platinum: "bg-muted text-foreground",
    Gold: "bg-yellow-500 text-black",
    Silver: "bg-muted/50 text-foreground",
    Bronze: "bg-amber-700 text-white",
    Partner: "bg-blue-600 text-white",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <h1 className="text-3xl font-bold mb-8">{t("admin_dashboard")}</h1>

          <Tabs
            defaultValue="pending"
            onValueChange={onTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="pending">{t("pending_tab")}</TabsTrigger>
              <TabsTrigger value="applications">{t("event_requests_tab")}</TabsTrigger>
              <TabsTrigger value="fighters">{t("fighters_tab")}</TabsTrigger>
              <TabsTrigger value="sponsors">{t("sponsors_tab")}</TabsTrigger>
              <TabsTrigger value="donors">{t("donors_tab")}</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card className="bg-transparent border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("pending_registrations")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.pending ? (
                    <div className="flex flex-col items-center py-8">
                      <Loader2 className="animate-spin text-primary" />
                    </div>
                  ) : pending.length === 0 ? (
                    <EmptyState message={t("no_pending_registrations")} />
                  ) : (
                    <div className="space-y-3">
                      {pending.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-primary text-start">{f.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {f.country} • {f.division} • {f.weight}lbs
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectFighter(f.id)}
                            >
                              <X className="w-4 h-4 mr-1" /> {t("reject")}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveFighter(f.id)}
                            >
                              <Check className="w-4 h-4 mr-1" /> {t("approve")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications">
              <Card className="bg-transparent border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("event_fight_requests")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.applications ? (
                    <div className="flex flex-col items-center py-8">
                      <Loader2 className="animate-spin text-primary" />
                    </div>
                  ) : applications.length === 0 ? (
                    <EmptyState message={t("no_pending_applications")} />
                  ) : (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card border rounded-lg shadow-sm gap-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center justify-center bg-muted p-2 rounded w-16 text-center">
                              <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                              <span className="text-[10px] font-bold">
                                {new Date(app.createdAt).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-lg text-primary">
                                  {app.User.Fighter?.name || t("unknown_fighter")}
                                </p>

                                <Badge variant="outline">
                                  {app.User.Fighter
                                    ? `${app.User.Fighter.wins}-${app.User.Fighter.losses}-${app.User.Fighter.draws}`
                                    : "0-0-0"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {t("applied_for")}{" "}
                                <span className="font-semibold text-foreground">
                                  {app.Event.title}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {app.User.email} • {app.User.Fighter?.country}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400"
                              onClick={() =>
                                handleReviewApplication(app.id, "rejected")
                              }
                            >
                              <X className="w-4 h-4 mr-1" /> {t("reject")}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                handleReviewApplication(app.id, "approved")
                              }
                            >
                              <Check className="w-4 h-4 mr-1" /> {t("approve")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fighters">
              <Card className="bg-transparent border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("approved_fighters")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.verified ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : verified.length === 0 ? (
                    <EmptyState message={t("no_approved_fighters")} />
                  ) : (
                    <div className="space-y-3">
                      {verified.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-primary text-start">{f.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {f.country} • {f.division}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteVerified(f.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sponsors">
              <Card className="bg-transparent border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("registered_sponsors")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.sponsors ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : sponsors.length === 0 ? (
                    <EmptyState message={t("no_sponsors_registered")} />
                  ) : (
                    <div className="space-y-3">
                      {sponsors.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-500 bg-blue-50 dark:bg-blue-500/10 p-1.5 rounded-full" />
                            <div>
                              <p className="font-bold text-primary text-start">
                                {s.company_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {s.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${tierColors[s.tier]
                                }`}
                            >
                              {t(`tier_${s.tier.toLowerCase()}`)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSponsor(s.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donors">
              <Card className="bg-transparent border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("registered_donors")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.donors ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : donors.length === 0 ? (
                    <EmptyState message={t("no_donors_registered")} />
                  ) : (
                    <div className="space-y-3">
                      {donors.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <User className="w-8 h-8 text-green-500 bg-green-50 dark:bg-green-500/10 p-1.5 rounded-full" />
                            <div>
                              <p className="font-bold text-primary text-start">
                                {d.email}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono text-start">
                                {d.wallet_address || t("no_wallet")}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteDonor(d.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
