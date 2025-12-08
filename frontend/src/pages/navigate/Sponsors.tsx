import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, LinkIcon, Mail } from "lucide-react";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

interface PublicSponsor {
  id: number;
  user_id?: number;
  company_name: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze" | "Partner";
}

const SUPABASE_IMAGE_URL =
  "https://eumlexrcxqgaudtsmavc.supabase.co/storage/v1/object/public/sponsor-logos/";

const Sponsors = () => {
  const [sponsors, setSponsors] = useState<PublicSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const userType = useAuthStore((s) => s.userType);
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get("/sponsors");
        setSponsors(
          Array.isArray(response.data) ? response.data : response.data.sponsors
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError("Failed to fetch data. Please try again later.");
        console.error("Error fetching sponsors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSponsors = sponsors.filter((sponsor) => {
    if (userType === "SPONSOR" && currentUser?.id === sponsor.user_id) {
      return false;
    }
    return true;
  });

  const groupedSponsors = filteredSponsors.reduce((acc, sponsor) => {
    const tier = sponsor.tier || "Partner";
    if (!acc[tier]) {
      acc[tier] = [];
    }
    acc[tier].push(sponsor);
    return acc;
  }, {} as Record<string, PublicSponsor[]>);

  const tierOrder = ["Platinum", "Gold", "Silver", "Bronze", "Partner"];

  const tierStyles: Record<string, { color: string; ring: string }> = {
    Platinum: { color: "text-gray-900", ring: "ring-gray-300" },
    Gold: { color: "text-yellow-600", ring: "ring-yellow-500" },
    Silver: { color: "text-gray-500", ring: "ring-gray-400" },
    Bronze: { color: "text-amber-700", ring: "ring-amber-600" },
    Partner: { color: "text-blue-600", ring: "ring-blue-500" },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Loading sponsors list...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl text-red-600">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4 flex items-center gap-3 text-foreground">
            <DollarSign className="h-10 w-10 text-primary" />
            Our Valued Sponsors
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            We are proud to partner with these leading organizations who support
            the Valor League and our fighters.
          </p>

          <div className="space-y-12">
            {tierOrder.map((tier) => {
              const sponsorsInTier = groupedSponsors[tier];
              if (!sponsorsInTier || sponsorsInTier.length === 0) return null;

              const { color, ring } = tierStyles[tier];

              return (
                <div key={tier}>
                  <h2
                    className={`text-3xl font-bold mb-6 pb-2 border-b-2 ${color} border-primary`}
                  >
                    {tier} Tier Sponsors ({sponsorsInTier.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sponsorsInTier.map((sponsor) => (
                      <Card
                        key={sponsor.id}
                        className={`shadow-lg ring-2 ${ring} transition-shadow duration-300 hover:shadow-2xl flex flex-col`}
                      >
                        <CardHeader className="flex flex-col items-center p-6 border-b">
                          {sponsor.logo_url ? (
                            <img
                              src={SUPABASE_IMAGE_URL + sponsor.logo_url}
                              alt={sponsor.company_name}
                              className="h-20 w-auto object-contain mb-3"
                            />
                          ) : (
                            <div className="h-20 w-full flex items-center justify-center text-xl font-semibold border rounded-md bg-gray-50">
                              {sponsor.company_name}
                            </div>
                          )}
                          <CardTitle className="text-xl mt-2 text-center">
                            {sponsor.company_name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                          <p className="text-sm text-gray-700 h-16 overflow-hidden">
                            {sponsor.description ||
                              "Official sponsor of the Valor League."}
                          </p>

                          {sponsor.website && (
                            <a
                              href={
                                sponsor.website.startsWith("http")
                                  ? sponsor.website
                                  : `https://${sponsor.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-primary hover:underline mb-2"
                            >
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Visit Website
                            </a>
                          )}

                          <div className="mt-auto pt-2">
                            {userType &&
                            userType !== "GUEST" &&
                            sponsor.user_id ? (
                              <Button
                                className="w-full bg-gradient-gold hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  navigate(
                                    `/dashboard/messages?contactId=${sponsor.user_id}`
                                  );
                                }}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Message
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredSponsors.length === 0 && !loading && (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">
                  We are currently looking for new partners!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sponsors;
