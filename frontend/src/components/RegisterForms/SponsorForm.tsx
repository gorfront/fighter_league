import { useState, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/api/apiClient";
import UploadPhoto from "@/components/UploadPhoto";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Textarea } from "../ui/textarea";
import { useAuthStore } from "@/stores/authStore";

interface SponsorProfile {
  company_name: string;
  logo_url: string;
  description: string;
  tier: "Gold" | "Silver" | "Bronze" | "Partner";
}

const SponsorForm = ({ name, email }: { name: string; email: string }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name,
    websiteUrl: "",
    description: "",
    walletAddress: "",
    tier: "Partner" as SponsorProfile["tier"],
  });

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tier: value as SponsorProfile["tier"] }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !imageFile) {
      toast({
        title: t("missing_fields_error"),
        description: t("fill_company_logo"),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${formData.name.replace(
        / /g,
        "_"
      )}_logo_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sponsor-logos")
        .upload(filePath, imageFile);

      if (uploadError) {
        throw new Error(`Logo upload failed: ${uploadError.message}`);
      }
      const logoUrl = uploadData.path;

      const registerPayload = {
        companyName: formData.name,
        email,
        description: formData.description,
        walletAddress: formData.walletAddress || undefined,
        user_type: "SPONSOR",
        logoUrl,
        tier: formData.tier,
      };

      const registerRes = await apiClient.post(
        "/sponsors/register",
        registerPayload
      );

      if (registerRes.data.token && registerRes.data.user) {
        setToken(registerRes.data.token);
        setUser(registerRes.data.user);
      }

      toast({
        title: t("registration_submitted"),
        description: t("login_success_sponsor"),
      });

      navigate("/dashboard/sponsor");

      setFormData({
        name: "",
        websiteUrl: "",
        description: "",
        walletAddress: "",
        tier: "Partner",
      });
      setPreview(null);
      setImageFile(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      const message =
        error.response?.data?.message ||
        error.message ||
        t("registration_failed");
      toast({ title: t("error_title"), description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const removeImage = () => {
    setPreview(null);
    setImageFile(null);
  };

  return (
    <Card className="p-8 w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 flex flex-col items-start">
          <Label htmlFor="companyName">{t("company_name_label")} *</Label>
          <Input
            id="companyName"
            placeholder={t("company_name_placeholder")}
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2 flex flex-col items-start">
          <Label htmlFor="companyName">{t("logo_image_label")}</Label>
          <UploadPhoto
            preview={preview}
            removeImage={removeImage}
            handleFileChange={handleFileChange}
          />
        </div>

        <div className="space-y-2 flex flex-col items-start">
          <Label htmlFor="walletAddress">{t("wallet_address_label")} *</Label>
          <Input
            id="walletAddress"
            value={formData.walletAddress ?? ""}
            onChange={(e) => handleChange("walletAddress", e.target.value)}
            placeholder={t("wallet_address_placeholder")}
          />
          <p className="text-xs text-muted-foreground">
            {t("wallet_address_hint")}
          </p>
        </div>
        <div className="space-y-2 flex flex-col items-start">
          <Label htmlFor="sponsorLevel">{t("tier_label")}</Label>
          <Select value={formData.tier} onValueChange={handleSelectChange}>
            <SelectTrigger id="tier">
              <SelectValue placeholder={t("select_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Platinum">{t("tier_platinum")}</SelectItem>
              <SelectItem value="Gold">{t("tier_gold")}</SelectItem>
              <SelectItem value="Silver">{t("tier_silver")}</SelectItem>
              <SelectItem value="Bronze">{t("tier_bronze")}</SelectItem>
              <SelectItem value="Partner">{t("tier_partner")} ({t("default_label")})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex flex-col items-start">
          <Label htmlFor="bio">{t("about_company_title")}</Label>
          <Textarea
            id="bio"
            value={formData.description ?? ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder={t("about_company_placeholder")}
            rows={5}
          />
        </div>
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("submitting_btn") : t("submit_app_btn")}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default SponsorForm;
