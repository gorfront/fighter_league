import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import apiClient from "@/api/apiClient";
import { Fighter } from "@/types/fighter";
import { useToast } from "@/hooks/use-toast";
import { Award, BarChart, Edit, MapPin, Weight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_FIGHTER_IMAGES as string;

const FighterDashboard = () => {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const { toast } = useToast();
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchMyProfile = async () => {
      try {
        const response = await apiClient.get<Fighter>("/fighters/me");
        setFighter(response.data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast({
          title: t("error_loading_profile"),
          description:
            error?.response?.data?.message || t("failed_update_status"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMyProfile();
  }, [token, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>{t("loading_profile")}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (fighter?.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12 bg-muted/20 flex flex-col items-center justify-center">
          <Card className="p-8 text-center mb-6">
            <h1 className="text-2xl font-bold mb-4">{t("profile_pending")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("profile_pending_desc")}
            </p>
          </Card>

          <Card className="p-6 text-center w-full max-w-md">
            <img
              src={`${supabaseAnonKey}${fighter.image}`}
              alt={fighter.name}
              className="h-24 w-24 mx-auto rounded-full border-2 border-background shadow-md object-cover mb-4"
            />
            <h2 className="text-xl font-semibold">{fighter.name}</h2>
            <p className="text-muted-foreground">{fighter.division}</p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (fighter?.status === "not_found") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">{t("profile_not_found")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("profile_not_found_desc")}
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const StatItem = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
  }) => (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 bg-muted/20">
        <div className="container max-w-4xl">
          <Card className="mb-6 overflow-hidden">
            <div className="relative h-48 w-full bg-gradient-stripe">
              <img
                src={`${supabaseAnonKey}${fighter.image}`}
                alt={fighter.name}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full border-4 border-background shadow-lg object-cover"
              />
            </div>

            <div className="text-center p-6 pt-20">
              <h1 className="text-4xl font-bold">{fighter.name}</h1>
              <p className="text-2xl text-primary font-semibold">
                {fighter.record}
              </p>
              <p className="text-lg text-muted-foreground">
                {fighter.division}
              </p>
            </div>

            <div className="border-t p-4 flex justify-end">
              <Button variant="outline" asChild>
                <Link to="/dashboard/fighter/edit">
                  <Edit className="h-4 w-4 mr-2" />
                  {t("edit_profile")}
                </Link>
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("my_stats")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatItem
                  icon={<MapPin />}
                  label={t("country_label")}
                  value={fighter.country}
                />
                <StatItem
                  icon={<BarChart />}
                  label={t("gender_label")}
                  value={t(fighter.gender.toLowerCase())}
                />
                <StatItem
                  icon={<Weight />}
                  label={t("weight_label")}
                  value={`${fighter.weight} ${t("lbs_suffix")}`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("my_achievements")}</CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(fighter?.achievements) &&
                  fighter.achievements.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2">
                    {fighter.achievements.map((ach, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        {ach}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    {t("no_achievements")}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("my_sponsors")}</CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(fighter?.sponsors) &&
                  fighter.sponsors.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2">
                    {fighter.sponsors.map((sponsor, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span>
                          {sponsor.name} ({sponsor.tier})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    {t("no_sponsors_list")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FighterDashboard;
