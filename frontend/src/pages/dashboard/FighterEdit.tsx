import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@supabase/supabase-js";

// --- SUPABASE CONFIGURATION ---
// You should ideally have these in your .env file
const SUPABASE_URL = "https://eumlexrcxqgaudtsmavc.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const IMAGE_BASE_URL = import.meta.env.VITE_SUPABASE_IMAGE_URL as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface FighterData {
  id?: number;
  name: string;
  country: string;
  division_id: number;
  division: string;
  weight: number;
  gender: "male" | "female";
  image?: string | File;
  bio: string;
  achievements: string[];
}

const FighterEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [divisions, setDivisions] = useState<{ id: number; name: string }[]>(
    []
  );

  const [formData, setFormData] = useState<FighterData>({
    name: "",
    country: "",
    division_id: 0,
    division: "",
    weight: 0,
    gender: "male",
    bio: "",
    achievements: [],
    image: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const divRes = await apiClient.get("/divisions");
        setDivisions(divRes.data);

        const profileRes = await apiClient.get("/fighters/me");
        const data = profileRes.data;

        setFormData({
          id: data.id,
          name: data.name,
          country: data.country,
          division_id: data.division_id,
          division: data.division,
          weight: data.weight,
          gender: data.gender,
          bio: data.bio || "",
          achievements: data.achievements || [],
          image: data.image,
        });

        if (data.image) {
          // If image is a full URL, use it; otherwise prepend Supabase base URL
          const isExternal = data.image.startsWith("http");
          setImagePreview(
            isExternal ? data.image : IMAGE_BASE_URL + data.image
          );
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDivisionChange = (value: string) => {
    const selectedDiv = divisions.find((d) => d.id?.toString() === value);
    if (selectedDiv) {
      setFormData((prev) => ({
        ...prev,
        division_id: selectedDiv.id,
        division: selectedDiv.name,
      }));
    }
  };

  const handleGenderChange = (value: "male" | "female") => {
    setFormData((prev) => ({ ...prev, gender: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Achievements Logic
  const addAchievement = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, ""],
    }));
  };
  const updateAchievement = (index: number, value: string) => {
    const newArr = [...formData.achievements];
    newArr[index] = value;
    setFormData((prev) => ({ ...prev, achievements: newArr }));
  };
  const removeAchievement = (index: number) => {
    const newArr = formData.achievements.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, achievements: newArr }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalImageName = formData.image;

      // 1. Upload to Supabase if 'image' is a File object
      if (formData.image instanceof File) {
        const file = formData.image;
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Path inside the bucket

        const { error: uploadError } = await supabase.storage
          .from("fighter-images") // Make sure this bucket exists and is public
          .upload(filePath, file);

        if (uploadError) {
          throw new Error("Image upload failed: " + uploadError.message);
        }

        finalImageName = filePath; // Save just the filename to DB
      }

      // 2. Prepare JSON Payload (Backend now expects JSON, not FormData)
      const payload = {
        name: formData.name,
        country: formData.country,
        division_id: formData.division_id || null, // Send null if 0/undefined
        division: formData.division,
        weight: formData.weight || null,
        gender: formData.gender,
        bio: formData.bio,
        achievements: JSON.stringify(formData.achievements), // Stringify array
        image: typeof finalImageName === "string" ? finalImageName : undefined,
      };

      // 3. Send to Backend
      await apiClient.put("/fighters/me", payload);

      toast({ title: "Success", description: "Profile updated successfully!" });
      navigate("/dashboard/fighter");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl py-10">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ... (Rest of the JSX remains exactly the same as before) ... */}
          {/* Just ensure your Input for image onChange calls handleImageChange */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="w-full max-w-sm">
                  <Label htmlFor="image">Profile Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              {/* ... Inputs for Name, Country, etc ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  />
                </div>
                {/* ... Division, Weight, Gender ... */}
                <div className="space-y-2">
                  <Label>Division</Label>
                  <Select
                    value={formData.division_id?.toString()}
                    onValueChange={handleDivisionChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Division" />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((div) => (
                        <SelectItem key={div.id} value={div.id?.toString()}>
                          {div.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input
                    name="weight"
                    type="number"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={handleGenderChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biography</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Achievements</CardTitle>
              <Button type="button" size="sm" onClick={addAchievement}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.achievements.map((ach, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={ach}
                    onChange={(e) => updateAchievement(i, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeAchievement(i)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/fighter")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-gold"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default FighterEdit;
