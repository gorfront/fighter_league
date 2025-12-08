import { useEffect, useState } from "react";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/authStore";

interface FighterListing {
  id: number;
  name: string;
  country: string;
  division: string;
  weight: number;
  gender: "male" | "female";
}

const AdminDashboard = () => {
  const { toast } = useToast();

  const token = useAuthStore((s) => s.token);

  const [pending, setPending] = useState<FighterListing[]>([]);
  const [verified, setVerified] = useState<FighterListing[]>([]);

  const [pendingLoading, setPendingLoading] = useState(true);
  const [verifiedLoading, setVerifiedLoading] = useState(false);

  const [hasFetchedVerified, setHasFetchedVerified] = useState(false);

  const authHeaders = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

  const fetchPendingFighters = async () => {
    if (!token) {
      toast({
        title: "Not Authorized",
        description: "You must be logged in to view this page.",
        variant: "destructive",
      });
      setPendingLoading(false);
      return;
    }

    try {
      setPendingLoading(true);
      const res = await apiClient.get<FighterListing[]>(
        "dashboard/admin/fighters/pending",
        authHeaders
      );
      setPending(res.data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch pending fighters.",
        variant: "destructive",
      });
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchVerifiedFighters = async () => {
    try {
      setVerifiedLoading(true);
      const res = await apiClient.get<FighterListing[]>(
        "dashboard/admin/fighters/verified",
        authHeaders
      );
      setVerified(res.data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch verified fighters.",
        variant: "destructive",
      });
    } finally {
      setVerifiedLoading(false);
      setHasFetchedVerified(true);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingFighters();
    }
  }, [token]);

  const onTabChange = (value: string) => {
    if (value === "approved" && !hasFetchedVerified && token) {
      fetchVerifiedFighters();
    }
  };

  const handleApprove = async (id: number) => {
    const fighterToApprove = pending.find((f) => f.id === id);

    try {
      setPending((prev) => prev.filter((f) => f.id !== id));

      if (fighterToApprove && hasFetchedVerified) {
        setVerified((prev) => [fighterToApprove, ...prev]);
      }

      await apiClient.patch(
        `dashboard/admin/fighters/${id}/approve`,
        {},
        authHeaders
      );

      toast({ title: "Success", description: "Fighter approved." });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to approve fighter.",
        variant: "destructive",
      });

      if (fighterToApprove) {
        setPending((p) => [fighterToApprove, ...p]);
        setVerified((p) => p.filter((f) => f.id !== id));
      }
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiClient.delete(`dashboard/admin/fighters/${id}`, authHeaders);

      toast({
        title: "Success",
        description: "Fighter rejected.",
      });

      setPending((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reject fighter.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVerified = async (id: number) => {
    try {
      await apiClient.delete(`dashboard/admin/fighters/${id}`, authHeaders);

      toast({ title: "Success", description: "Fighter deleted." });
      setVerified((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete fighter.",
        variant: "destructive",
      });
    }
  };

  const FighterList = ({
    fighters,
    isLoading,
    emptyMessage,
    onDelete,
    onApprove,
  }: {
    fighters: FighterListing[];
    isLoading: boolean;
    emptyMessage: string;
    onDelete: (id: number) => void;
    onApprove?: (id: number) => void;
  }) => {
    if (isLoading) return <p>Loading...</p>;

    if (fighters.length === 0)
      return <p className="text-muted-foreground">{emptyMessage}</p>;

    return (
      <div className="space-y-4">
        {fighters.map((fighter) => (
          <div
            key={fighter.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-bold text-lg">{fighter.name}</p>
              <p className="text-sm text-muted-foreground">
                {fighter.country} | {fighter.division} | {fighter.weight} lbs
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="icon"
                variant="destructive"
                onClick={() => onDelete(fighter.id)}
              >
                <X className="h-4 w-4" />
              </Button>

              {onApprove && (
                <Button
                  size="icon"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove(fighter.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

          <Tabs defaultValue="pending" onValueChange={onTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Fighter Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  {!token ? (
                    <p className="text-destructive">Please log in.</p>
                  ) : (
                    <FighterList
                      fighters={pending}
                      isLoading={pendingLoading}
                      emptyMessage="No pending fighters."
                      onDelete={handleReject}
                      onApprove={handleApprove}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approved">
              <Card>
                <CardHeader>
                  <CardTitle>Approved Fighters</CardTitle>
                </CardHeader>
                <CardContent>
                  {!token ? (
                    <p className="text-destructive">Please log in.</p>
                  ) : (
                    <FighterList
                      fighters={verified}
                      isLoading={verifiedLoading}
                      emptyMessage="No approved fighters."
                      onDelete={handleDeleteVerified}
                    />
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
