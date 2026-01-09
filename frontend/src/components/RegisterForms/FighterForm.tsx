import { useState, ChangeEvent, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/api/apiClient";
import UploadPhoto from "@/components/UploadPhoto";
import { Division, Fighter } from "@/types/fighter";
import { supabase } from "@/lib/supabaseClient";
import { X, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FighterFormData extends Partial<Fighter> {
  age?: number;
  height?: string;
  reach?: string;
  knockouts?: number;
}

const FighterForm = ({ name, email }: { name: string; email: string }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const initialFormState: FighterFormData = {
    name,
    email,
    country: "",
    walletAddress: "",
    weight: undefined,
    gender: undefined,
    division: "",
    wins: 0,
    losses: 0,
    draws: 0,
    knockouts: 0,
    age: undefined,
    height: "",
    reach: "",
    image: "",
    bio: "",
  };

  const [formData, setFormData] = useState<FighterFormData>(initialFormState);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [achievements, setAchievements] = useState<string[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState("");
  const navigation = useNavigate();

  useEffect(() => {
    apiClient
      .get<Division[]>("/divisions")
      .then((res) => setDivisions(res.data))
      .catch((err) => console.error("Failed to fetch divisions", err));
  }, []);

  useEffect(() => {
    if (formData.weight && formData.gender && divisions.length > 0) {
      const weight = Number(formData.weight);

      const matchingDivision = divisions.find((div) => {
        if (div.gender !== formData.gender) return false;
        const min = Number(div.min_weight);
        const max = Number(div.max_weight);
        return weight >= min && weight <= max;
      });

      if (matchingDivision) {
        setFormData((prev) => ({ ...prev, division: matchingDivision.name }));
      } else {
        setFormData((prev) => ({ ...prev, division: "" }));
      }
    }
  }, [formData.weight, formData.gender, divisions]);

  const handleChange = (field: string, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleAddAchievement = () => {
    if (currentAchievement.trim() === "") return;
    setAchievements([...achievements, currentAchievement.trim()]);
    setCurrentAchievement("");
  };

  const handleRemoveAchievement = (indexToRemove: number) => {
    setAchievements(achievements.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (
      !formData.country ||
      !formData.gender ||
      !formData.weight ||
      !formData.division ||
      !imageFile
    ) {
      toast({
        title: t("missing_fields_error"),
        description: t("fill_required_fields"),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const wins = Number(formData.wins || 0);
    const knockouts = Number(formData.knockouts || 0);

    if (knockouts > wins) {
      toast({
        title: t("invalid_stats_error"),
        description: t("ko_higher_than_wins", { ko: knockouts, wins: wins }),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrl = "";

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${name.replace(/ /g, "_")}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("fighter-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        imageUrl = uploadData.path;
      }

      const payload = {
        ...formData,
        weight: Number(formData.weight),
        wins: wins,
        losses: Number(formData.losses || 0),
        draws: Number(formData.draws || 0),
        knockouts: knockouts,
        age: formData.age ? Number(formData.age) : null,
        height: formData.height,
        reach: formData.reach,
        image: imageUrl,
        achievements: achievements,
      };

      const response = await apiClient.post("/fighters/register", payload);

      toast({
        title: t("registration_submitted"),
        description:
          response.data.message || t("reg_success_fighter"),
      });

      setFormData(initialFormState);
      setPreview(null);
      setImageFile(null);
      setAchievements([]);
      navigation("/dashboard/fighter");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "An unknown error occurred.";

      toast({
        title: t("registration_failed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableDivisions = divisions.filter(
    (d) => !formData.gender || d.gender === formData.gender
  );

  return (
    <Card className="p-8 shadow-md">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            {t("basic_info_title")}
          </h3>

          <div className="space-y-2 flex flex-col items-start">
            <Label htmlFor="walletAddress">{t("wallet_address_label")}</Label>
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
            <Label htmlFor="country">{t("country_label")} *</Label>
            <Input
              id="country"
              value={formData.country ?? ""}
              onChange={(e) => handleChange("country", e.target.value)}
              placeholder={t("country_placeholder")}
              required
            />
          </div>

          <div className="space-y-2 flex flex-col items-start">
            <Label htmlFor="gender">{t("gender_label")} *</Label>
            <Select
              value={formData.gender ?? ""}
              onValueChange={(value) => handleChange("gender", value)}
              required
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder={t("select_gender_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("male")}</SelectItem>
                <SelectItem value="female">{t("female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            {t("physical_attributes_title")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="age">{t("stat_age")} *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age ?? ""}
                onChange={(e) => handleChange("age", Number(e.target.value))}
                placeholder={t("age_placeholder")}
                className="pr-3"
              />
            </div>

            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="height">{t("stat_height")} *</Label>
              <Input
                id="height"
                value={formData.height ?? ""}
                onChange={(e) => handleChange("height", e.target.value)}
                placeholder={t("height_placeholder")}
                className="pr-3"
              />
            </div>

            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="reach">{t("stat_reach")} *</Label>
              <Input
                id="reach"
                value={formData.reach ?? ""}
                onChange={(e) => handleChange("reach", e.target.value)}
                placeholder={t("reach_placeholder")}
                className="pr-3"
              />
            </div>

            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="weight">{t("weight_hint_lbs")}</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight ?? ""}
                onChange={(e) => handleChange("weight", Number(e.target.value))}
                placeholder={t("weight_placeholder")}
                className="pr-3"
                required
              />
            </div>
          </div>

          <div className="space-y-2 flex flex-col items-start">
            <Label htmlFor="division">{t("division_auto_label")}</Label>
            <Select
              value={formData.division ?? ""}
              onValueChange={(value) => handleChange("division", value)}
              disabled={true}
              required
            >
              <SelectTrigger id="division" className="bg-muted/50">
                <SelectValue
                  placeholder={
                    !formData.weight
                      ? t("enter_weight_division")
                      : formData.division || t("no_matching_division")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableDivisions.map((division) => (
                  <SelectItem key={division.id} value={division.name}>
                    {division.name} ({Number(division.min_weight)} -{" "}
                    {Number(division.max_weight)} lbs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.weight && !formData.division && (
              <p className="text-xs text-red-500 mt-1">
                {t("weight_mismatch_error")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">{t("fight_record_title")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="wins">{t("wins_label")} *</Label>
              <Input
                id="wins"
                type="number"
                value={formData.wins ?? 0}
                onChange={(e) => handleChange("wins", Number(e.target.value))}
                className="pr-3"
                required
              />
            </div>
            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="losses">{t("losses_label")} *</Label>
              <Input
                id="losses"
                type="number"
                value={formData.losses ?? 0}
                onChange={(e) => handleChange("losses", Number(e.target.value))}
                className="pr-3"
                required
              />
            </div>
            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="draws">{t("draws_label")} *</Label>
              <Input
                id="draws"
                type="number"
                value={formData.draws ?? 0}
                onChange={(e) => handleChange("draws", Number(e.target.value))}
                className="pr-3"
                required
              />
            </div>
            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="knockouts" className="flex items-center gap-1">
                {t("knockouts_label")}
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input
                id="knockouts"
                type="number"
                value={formData.knockouts ?? 0}
                onChange={(e) =>
                  handleChange("knockouts", Number(e.target.value))
                }
                className="pr-3"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">{t("media_bio_title")}</h3>
          <div className="space-y-2 flex flex-col items-start">
            <Label htmlFor="fileUpload">{t("profile_image_label")}</Label>
            <UploadPhoto
              preview={preview}
              removeImage={removeImage}
              handleFileChange={handleFileChange}
            />
          </div>

          <div className="space-y-2 flex flex-col items-start">
            <Label htmlFor="bio">{t("biography_title")}</Label>
            <Textarea
              id="bio"
              value={formData.bio ?? ""}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder={t("bio_placeholder")}
              rows={5}
            />
          </div>

          <div className="space-y-4 flex flex-col items-start">
            <Label>{t("achievements_title")}</Label>
            <div className="flex gap-2 w-full">
              <Input
                value={currentAchievement}
                onChange={(e) => setCurrentAchievement(e.target.value)}
                placeholder={t("achievement_placeholder")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddAchievement}
              >
                {t("add_btn")}
              </Button>
            </div>
            <div className="flex items-start justify-start gap-1 flex-wrap">
              {achievements?.map((ach, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 text-sm bg-muted rounded-md"
                >
                  <span>{ach}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAchievement(index)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-gold hover:opacity-90 transition-opacity"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("submitting_btn") : t("submit_reg_btn")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {t("terms_agreement")}
        </p>
      </form>
    </Card>
  );
};

export default FighterForm;
