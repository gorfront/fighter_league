import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/api/apiClient";
import UploadPhoto from "@/components/UploadPhoto";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

const DonorForm = ({ name, email }: { name: string; email: string }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email,
    walletAddress: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.walletAddress) {
      toast({
        title: "Missing fields",
        description: "Wallet Address is required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let logoUrl = "";

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${name.replace(
          / /g,
          "_"
        )}_logo_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("donor_images")
          .upload(filePath, imageFile);

        if (uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`);
        logoUrl = uploadData.path;
      }

      const registerPayload = {
        user_type: "DONOR",
        logo_url: logoUrl || undefined,
        email,
        walletAddress: formData.walletAddress,
      };

      const registerRes = await apiClient.post(
        "/donor/register",
        registerPayload
      );

      if (registerRes.data.token && registerRes.data.user) {
        setToken(registerRes.data.token);
        setUser(registerRes.data.user);
      }

      toast({
        title: "Success!",
        description: "You are now logged in as a Donor.",
      });

      navigate("/dashboard/donor");

      setFormData({ email, walletAddress: "" });
      setPreview(null);
      setImageFile(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      const message =
        error.response?.data?.message || error.message || "Error occurred.";
      toast({ title: "Error", description: message, variant: "destructive" });
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
          <Label>Profile Image (Optional)</Label>
          <UploadPhoto
            preview={preview}
            removeImage={removeImage}
            handleFileChange={handleFileChange}
          />
        </div>
        <div className="space-y-2 flex flex-col items-start">
          <Label htmlFor="walletAddress">Wallet Address *</Label>
          <Input
            id="walletAddress"
            value={formData.walletAddress ?? ""}
            onChange={(e) => handleChange("walletAddress", e.target.value)}
            placeholder="Your 0x... wallet address"
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default DonorForm;
