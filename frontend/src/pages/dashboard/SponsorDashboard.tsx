/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/api/apiClient";
import {
  ShieldCheck,
  Loader2,
  LinkIcon,
  Mail,
  User,
  Trophy,
  Eye,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { Link } from "react-router-dom";

interface MyFighters {
  id: string;
  name: string;
}

interface SponsorProfile {
  company_name: string;
  website: string;
  logo_url: string;
  email: string;
  description: string;
  tier: "Gold" | "Silver" | "Bronze" | "Partner";
  my_fighters: MyFighters[];
}

const SponsorDashboard = () => {
  const { t } = useTranslation();
  const supabaseAnonKey = import.meta.env
    .VITE_SUPABASE_SPONSOR_IMAGES as string;

  const userType = useAuthStore((s) => s.userType);
  const token = useAuthStore((s) => s.token);

  const { toast } = useToast();

  const [profileData, setProfileData] = useState<SponsorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(true);

  useEffect(() => {
    if (userType !== "SPONSOR") {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/dashboard/sponsor/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfileData(response.data);
        setProfileExists(true);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setProfileExists(false);
        } else {
          toast({
            title: t("error_loading_profile"),
            description:
              error.response?.data?.message || t("failed_update_status"),
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [userType, token, toast, t]);

  if (userType !== "SPONSOR") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold">{t("access_denied")}</h1>
        <p>{t("access_denied_sponsor")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">{t("loading_sponsor_hub")}</p>
      </div>
    );
  }

  if (!profileExists) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">{t("profile_incomplete")}</h1>
            <p className="text-muted-foreground mb-4">
              {t("profile_incomplete_desc")}
            </p>
            <p className="text-sm">
              {t("complete_info_prompt")}
            </p>
            <Button className="mt-4" asChild>
              <Link to="/dashboard/sponsor/edit">{t("go_to_profile_creation")}</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const tierColors = {
    Platinum: "bg-gray-200 text-black",
    Gold: "bg-yellow-500 text-black",
    Silver: "bg-gray-400 text-black",
    Bronze: "bg-amber-700 text-white",
    Partner: "bg-blue-600 text-white",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardHeader className="border-b flex-row flex-wrap items-center justify-between p-6">
            <CardTitle className="text-3xl flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-primary" />
              {t("sponsor_dashboard_title")}: {profileData?.company_name}
            </CardTitle>

            <div className="flex items-center gap-4">
              {profileData?.tier && (
                <span
                  className={`px-4 py-1 text-sm font-semibold uppercase rounded-full ${tierColors[profileData.tier]
                    }`}
                >
                  {t(`tier_${profileData.tier.toLowerCase()}`)} {t("tier_label")}
                </span>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/sponsor/edit">
                  <Edit className="h-4 w-4 mr-2" />
                  {t("edit_profile")}
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                {t("public_profile")}
              </h3>

              {profileData?.logo_url ? (
                <img
                  src={
                    profileData.logo_url.startsWith("http")
                      ? profileData.logo_url
                      : supabaseAnonKey + profileData.logo_url
                  }
                  alt={t("logo_alt", { name: profileData.company_name })}
                  className="w-full h-auto max-h-48 object-contain border rounded-lg p-2 bg-gray-50"
                />
              ) : (
                <div className="h-48 w-full flex items-center justify-center border rounded-lg bg-gray-100 text-muted-foreground">
                  {t("no_logo_uploaded")}
                </div>
              )}

              <div className="space-y-1">
                <h4 className="font-medium text-gray-800">
                  {t("company_description")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {profileData?.description ||
                    t("no_description")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                {t("contact_links")}
              </h3>

              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-500" />
                <div className="text-sm">
                  <p className="font-medium">{t("company_name_label")}</p>
                  <p className="text-muted-foreground">
                    {profileData?.company_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div className="text-sm">
                  <p className="font-medium">{t("contact_email_label")}</p>
                  <p className="text-muted-foreground">{profileData?.email}</p>
                </div>
              </div>

              {profileData?.website && (
                <div className="flex items-center space-x-3">
                  <LinkIcon className="w-5 h-5 text-gray-500" />
                  <div className="text-sm">
                    <p className="font-medium">{t("website_label")}</p>
                    <a
                      href={
                        profileData.website.startsWith("http")
                          ? profileData.website
                          : `https://${profileData.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profileData.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <Card className="shadow-sm border">
                <CardHeader className="border-b p-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {t("sponsored_fighters")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {profileData?.my_fighters &&
                    profileData.my_fighters.length > 0 ? (
                    profileData.my_fighters.map((fighter) => (
                      <div
                        key={fighter.id}
                        className="flex items-center justify-between border-b last:border-b-0 py-2"
                      >
                        <span className="font-medium">{fighter.name}</span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/fighter/${fighter.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            {t("view_button")}
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {t("no_active_sponsorships")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>

          <CardFooter className="justify-end p-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t("data_verified")}
            </p>
          </CardFooter>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default SponsorDashboard;
