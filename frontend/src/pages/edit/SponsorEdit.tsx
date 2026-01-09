import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft, UploadCloud } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const IMAGE_BASE_URL = import.meta.env.VITE_SUPABASE_SPONSOR_IMAGES as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SponsorFormData {
  company_name: string;
  email: string;
  description: string;
  logo_url?: string | File;
}

const SponsorEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<SponsorFormData>({
    company_name: "",
    email: "",
    description: "",
    logo_url: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/dashboard/sponsor/me");
        const data = response.data;

        setFormData({
          company_name: data.company_name || "",
          email: data.email || "",
          description: data.description || "",
          logo_url: data.logo_url || "",
        });

        if (data.logo_url) {
          const isExternal = data.logo_url.startsWith("http");
          setImagePreview(
            isExternal ? data.logo_url : IMAGE_BASE_URL + data.logo_url
          );
        }
      } catch (error) {
        console.error("Failed to load profile", error);
        toast({
          variant: "destructive",
          title: t("error_title"),
          description: t("load_profile_error"),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [toast, t]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo_url: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalLogoUrl = formData.logo_url;

      if (formData.logo_url instanceof File) {
        const file = formData.logo_url;
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-logo.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("sponsor-logos")
          .upload(filePath, file);

        if (uploadError)
          throw new Error("Logo upload failed: " + uploadError.message);

        finalLogoUrl = filePath;
      }

      const payload = {
        company_name: formData.company_name,
        email: formData.email,
        description: formData.description,
        logo_url: typeof finalLogoUrl === "string" ? finalLogoUrl : undefined,
      };

      await apiClient.put("/dashboard/sponsor/me", payload);

      toast({ title: t("success_title"), description: t("profile_update_success") });
      navigate("/dashboard/sponsor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Update failed", error);
      toast({
        variant: "destructive",
        title: t("update_failed"),
        description: error.message || t("update_failed"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container max-w-3xl py-10">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/sponsor")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t("edit_company_profile")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("company_details_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-white flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Logo Preview"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <UploadCloud className="h-10 w-10 text-gray-300" />
                  )}
                </div>
                <div className="w-full">
                  <Label htmlFor="logo" className="mb-2 block">
                    {t("company_logo_label")}
                  </Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("upload_logo_hint")}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">{t("company_name_label")}</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("contact_email_label")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("company_description_label")}</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder={t("brand_description_placeholder")}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/sponsor")}
            >
              {t("cancel_btn")}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("processing")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> {t("save_changes")}
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default SponsorEdit;
