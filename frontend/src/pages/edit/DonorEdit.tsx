/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft, UploadCloud } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@supabase/supabase-js";

// --- SUPABASE CONFIG ---
const SUPABASE_URL = "https://eumlexrcxqgaudtsmavc.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
// Make sure you create a 'donor_images' bucket in Supabase
const IMAGE_BASE_URL =
  "https://eumlexrcxqgaudtsmavc.supabase.co/storage/v1/object/public/donor_images/";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface DonorFormData {
  email: string;
  wallet_address: string;
  logo_url?: string | File;
}

const DonorEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<DonorFormData>({
    email: "",
    wallet_address: "",
    logo_url: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/donor/me");
        const data = response.data;

        setFormData({
          email: data.email || "",
          wallet_address: data.wallet_address || "",
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
        // It's okay if it fails (404) for a new donor
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // 1. Upload to Supabase if new file
      if (formData.logo_url instanceof File) {
        const file = formData.logo_url;
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-donor.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("donor_images") // Ensure this bucket exists
          .upload(filePath, file);

        if (uploadError)
          throw new Error("Logo upload failed: " + uploadError.message);

        finalLogoUrl = filePath;
      }

      // 2. Send to Backend
      const payload = {
        email: formData.email,
        wallet_address: formData.wallet_address,
        logo_url: typeof finalLogoUrl === "string" ? finalLogoUrl : undefined,
      };

      await apiClient.put("/donor/me", payload);

      toast({ title: "Success", description: "Donor profile updated!" });
      navigate("/dashboard/donor");
    } catch (error: any) {
      console.error("Update failed", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not save changes.",
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
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 container max-w-2xl py-10">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/donor")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Donor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border bg-white flex items-center justify-center shadow-sm">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UploadCloud className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <div className="w-full">
                  <Label htmlFor="logo" className="mb-2 block">
                    Avatar / Logo
                  </Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet_address">Wallet Address</Label>
                <Input
                  id="wallet_address"
                  name="wallet_address"
                  value={formData.wallet_address}
                  onChange={handleChange}
                  placeholder="0x..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/donor")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
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

export default DonorEdit;
