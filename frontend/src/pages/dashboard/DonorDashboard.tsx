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
import { Loader2, Mail, Wallet, Edit, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { Link } from "react-router-dom";

interface DonorProfile {
  id: number;
  email: string;
  logo_url: string;
  wallet_address: string;
}

const DonorDashboard = () => {
  const { t } = useTranslation();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_DONOR_IMAGES as string;

  const userType = useAuthStore((s) => s.userType);
  const token = useAuthStore((s) => s.token);
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(true);

  useEffect(() => {
    if (userType !== "DONOR") {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/donor/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileData(response.data);
        setProfileExists(true);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setProfileExists(false);
        } else {
          toast({
            title: t("error_loading_profile"),
            description: t("failed_update_status"),
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [userType, token, toast]);

  if (userType !== "DONOR") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold">{t("access_denied")}</h1>
        <p>{t("access_denied_donor")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">{t("loading_donor_profile")}</p>
      </div>
    );
  }

  if (!profileExists) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="p-8 text-center max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4">{t("welcome_donor")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("setup_profile_prompt")}
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard/donor/edit">{t("create_profile")}</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col ">
      <Header />

      <main className="flex-1 container mx-auto py-12 px-4">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader className="border-b flex flex-row items-center justify-between p-6 bg-gradient-stripe rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              {t("donor_dashboard_title")}
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/donor/edit">
                <Edit className="h-4 w-4 mr-2" />
                {t("edit_profile")}
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-40 w-40 rounded-full border-4 border-gray-100 overflow-hidden shadow-sm bg-white flex items-center justify-center">
                {profileData?.logo_url ? (
                  <img
                    src={
                      profileData.logo_url.startsWith("http")
                        ? profileData.logo_url
                        : supabaseAnonKey + profileData.logo_url
                    }
                    alt={t("logo_alt", { name: "Donor" })}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-gray-300" />
                )}
              </div>
              {!profileData?.logo_url && (
                <p className="text-sm text-muted-foreground">
                  {t("no_logo")}
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-1 max-w-lg mx-auto">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border">
                <Mail className="h-5 w-5 text-gray-500 mr-4" />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-500">
                    {t("email_address_label")}
                  </p>
                  <p className="text-base font-semibold truncate text-primary">
                    {profileData?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg border">
                <Wallet className="h-5 w-5 text-gray-500 mr-4" />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-500">
                    {t("wallet_address_label")}
                  </p>
                  <p
                    className="text-sm font-mono font-semibold truncate text-primary"
                    title={profileData?.wallet_address}
                  >
                    {profileData?.wallet_address || t("no_wallet_connected")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50 p-4 rounded-b-lg border-t text-center justify-center">
            <p className="text-xs text-muted-foreground">
              {t("thank_you_support")}
            </p>
          </CardFooter>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default DonorDashboard;
