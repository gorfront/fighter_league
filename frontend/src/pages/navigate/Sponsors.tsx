import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, LinkIcon, Mail, Search } from "lucide-react";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useDebounce } from "@/hooks/debounce";

interface PublicSponsor {
  id: number;
  user_id?: number;
  company_name: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze" | "Partner";
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SPONSOR_IMAGES as string;

const Sponsors = () => {
  const [sponsors, setSponsors] = useState<PublicSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const userType = useAuthStore((s) => s.userType);
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);

        const response = await apiClient.get(`/sponsors?${params.toString()}`);

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.sponsors;

        setSponsors(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.response?.status !== 404) {
          setError("Failed to fetch sponsors.");
        } else {
          setSponsors([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearch]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center justify-center md:justify-start gap-3 text-foreground">
              <DollarSign className="h-10 w-10 text-primary" />
              Our Partners
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Proudly supported by leading organizations committed to the future
              of combat sports.
            </p>
          </div>

          <div className="mb-12 sticky top-20 z-10 bg-background/95 p-4 rounded-xl border shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="relative max-w-full">
              <Input
                placeholder="Search sponsors by company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {loading && (
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Connecting with partners...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-20 text-red-500">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-16">
              {tierOrder.map((tier) => {
                const sponsorsInTier = groupedSponsors[tier];
                if (!sponsorsInTier || sponsorsInTier.length === 0) return null;

                const { color, ring } = tierStyles[tier];

                return (
                  <div
                    key={tier}
                    className="animate-in fade-in duration-500 slide-in-from-bottom-4"
                  >
                    <h2
                      className={`text-2xl font-bold mb-6 pb-2 border-b-2 ${color} border-opacity-20 flex items-center gap-2`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${color.replace(
                          "text-",
                          "bg-"
                        )}`}
                      ></span>
                      {tier} Sponsors
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {sponsorsInTier.map((sponsor) => (
                        <Card
                          key={sponsor.id}
                          className={`group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ring-1 hover:ring-2 ${ring} flex flex-col h-full`}
                        >
                          <CardHeader className="flex flex-col items-center p-6 bg-muted/20 border-b">
                            <div className="h-24 w-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-300">
                              {sponsor.logo_url ? (
                                <img
                                  src={
                                    sponsor.logo_url.startsWith("http")
                                      ? sponsor.logo_url
                                      : supabaseAnonKey + sponsor.logo_url
                                  }
                                  alt={sponsor.company_name}
                                  className="max-h-full max-w-full object-contain drop-shadow-sm"
                                />
                              ) : (
                                <span className="text-xl font-bold text-gray-400">
                                  {sponsor.company_name}
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-lg text-center truncate w-full">
                              {sponsor.company_name}
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="p-5 flex-1 flex flex-col justify-between bg-card">
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                              {sponsor.description ||
                                "Official sponsor of the Valor League."}
                            </p>

                            <div className="space-y-3 mt-auto">
                              {sponsor.website && (
                                <a
                                  href={
                                    sponsor.website.startsWith("http")
                                      ? sponsor.website
                                      : `https://${sponsor.website}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center text-sm font-medium text-primary hover:underline w-full py-1"
                                >
                                  <LinkIcon className="h-3.5 w-3.5 mr-2" />
                                  Visit Website
                                </a>
                              )}

                              {userType &&
                                userType !== "GUEST" &&
                                sponsor.user_id && (
                                  <Button
                                    className="w-full gap-2"
                                    variant="secondary"
                                    onClick={() =>
                                      navigate(
                                        `/dashboard/messages?contactId=${sponsor.user_id}`
                                      )
                                    }
                                  >
                                    <Mail className="w-4 h-4" />
                                    Contact
                                  </Button>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredSponsors.length === 0 && (
                <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <h3 className="text-xl font-semibold text-gray-700">
                    No sponsors found
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Try adjusting your search terms.
                  </p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery("")}
                      className="mt-2"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sponsors;
