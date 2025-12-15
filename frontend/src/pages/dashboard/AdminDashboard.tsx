import { useEffect, useState } from "react";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Trash2, Shield, User, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/authStore";

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

const AdminDashboard = () => {
  const { toast } = useToast();
  const token = useAuthStore((s) => s.token);

  const [pending, setPending] = useState<FighterListing[]>([]);
  const [verified, setVerified] = useState<FighterListing[]>([]);
  const [sponsors, setSponsors] = useState<SponsorListing[]>([]);
  const [donors, setDonors] = useState<DonorListing[]>([]);

  const [loading, setLoading] = useState({
    pending: true,
    verified: false,
    sponsors: false,
    donors: false,
  });

  const [fetched, setFetched] = useState({
    verified: false,
    sponsors: false,
    donors: false,
  });

  const authHeaders = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

  const fetchPendingFighters = async () => {
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
  };

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
      toast({ title: "Success", description: "Fighter approved." });
    } catch (err) {
      toast({
        title: "Error",
        description: "Approval failed.",
        variant: "destructive",
      });
    }
  };

  const handleRejectFighter = async (id: number) => {
    try {
      await apiClient.delete(`dashboard/admin/fighters/${id}`, authHeaders);
      setPending((prev) => prev.filter((f) => f.id !== id));
      toast({ title: "Success", description: "Fighter rejected." });
    } catch (err) {
      toast({
        title: "Error",
        description: "Rejection failed.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVerified = async (id: number) => {
    try {
      await apiClient.delete(`dashboard/admin/fighters/${id}`, authHeaders);
      setVerified((prev) => prev.filter((f) => f.id !== id));
      toast({ title: "Success", description: "Fighter deleted." });
    } catch (err) {
      toast({
        title: "Error",
        description: "Deletion failed.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSponsor = async (id: number) => {
    // if (!confirm("Are you sure? This deletes the user account too.")) return;
    try {
      await apiClient.delete(`dashboard/admin/sponsors/${id}`, authHeaders);
      setSponsors((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Success", description: "Sponsor deleted." });
    } catch (err) {
      toast({
        title: "Error",
        description: "Deletion failed.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDonor = async (id: number) => {
    // if (!confirm("Are you sure? This deletes the user account too.")) return;
    try {
      await apiClient.delete(`dashboard/admin/donors/${id}`, authHeaders);
      setDonors((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Success", description: "Donor deleted." });
    } catch (err) {
      toast({
        title: "Error",
        description: "Deletion failed.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (token) fetchPendingFighters();
  }, [token]);

  const onTabChange = (value: string) => {
    if (value === "fighters" && !fetched.verified) fetchVerifiedFighters();
    if (value === "sponsors" && !fetched.sponsors) fetchSponsors();
    if (value === "donors" && !fetched.donors) fetchDonors();
  };

  const EmptyState = ({ message }: { message: string }) => (
    <p className="text-muted-foreground text-center py-8">{message}</p>
  );

  const tierColors = {
    Platinum: "bg-gray-200 text-black",
    Gold: "bg-yellow-500 text-black",
    Silver: "bg-gray-400 text-black",
    Bronze: "bg-amber-700 text-white",
    Partner: "bg-blue-600 text-white",
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          <Tabs
            defaultValue="pending"
            onValueChange={onTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="pending">Pending Fighters</TabsTrigger>
              <TabsTrigger value="fighters">All Fighters</TabsTrigger>
              <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
              <TabsTrigger value="donors">Donors</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.pending ? (
                    <div className="min-h-auto flex flex-col justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2">Loading pending list...</p>
                    </div>
                  ) : pending.length === 0 ? (
                    <EmptyState message="No pending applications." />
                  ) : (
                    <div className="space-y-3">
                      {pending.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-primary">{f.name}</p>
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
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveFighter(f.id)}
                            >
                              <Check className="w-4 h-4 mr-1" /> Approve
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
              <Card>
                <CardHeader>
                  <CardTitle>Approved Fighters</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.verified ? (
                    <div className="min-h-auto flex flex-col justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2">Loading fighters list...</p>
                    </div>
                  ) : verified.length === 0 ? (
                    <EmptyState message="No approved fighters found." />
                  ) : (
                    <div className="space-y-3">
                      {verified.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-primary">{f.name}</p>
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
              <Card>
                <CardHeader>
                  <CardTitle>Registered Sponsors</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.sponsors ? (
                    <div className="min-h-auto flex flex-col justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2">Loading sponsors list...</p>
                    </div>
                  ) : sponsors.length === 0 ? (
                    <EmptyState message="No sponsors registered." />
                  ) : (
                    <div className="space-y-3">
                      {sponsors.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-full" />
                            <div>
                              <p className="font-bold text-primary">
                                {s.company_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {s.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                tierColors[s.tier]
                              }`}
                            >
                              {s.tier}
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
              <Card>
                <CardHeader>
                  <CardTitle>Registered Donors</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.donors ? (
                    <div className="min-h-auto flex flex-col justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2">Loading donors list...</p>
                    </div>
                  ) : donors.length === 0 ? (
                    <EmptyState message="No donors registered." />
                  ) : (
                    <div className="space-y-3">
                      {donors.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <User className="w-8 h-8 text-green-500 bg-green-50 p-1.5 rounded-full" />
                            <div>
                              <p className="font-bold text-primary">
                                {d.email}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {d.wallet_address || "No Wallet Connected"}
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
