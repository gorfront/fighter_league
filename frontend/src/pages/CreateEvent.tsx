/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  ArrowLeft,
  PlusCircle,
  MapPin,
  Trophy,
  Globe,
} from "lucide-react";

interface EventData {
  title: string;
  event_date: string;
  started_time: string;
  location: string;
  division: string;
  status: "upcoming";
  timezone?: string;
}

interface Division {
  id: number;
  name: string;
}

const CreateEvent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userType, token } = useAuthStore();

  const [isSaving, setIsSaving] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [formData, setFormData] = useState<EventData>({
    title: "",
    event_date: "",
    started_time: "",
    location: "",
    division: "",
    status: "upcoming",
  });

  useEffect(() => {
    if (userType !== "ADMIN") {
      navigate("/events");
      return;
    }
    const fetchDivisions = async () => {
      try {
        const res = await apiClient.get<Division[]>("/divisions");
        setDivisions(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDivisions();
  }, [userType, navigate]);

  const handleChange = (field: keyof EventData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      ...formData,
      timezone: userTimezone,
    };

    try {
      await apiClient.post("/events", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: t("event_created_title"),
        description: t("event_created_desc"),
      });
      navigate("/events");
    } catch (error: any) {
      toast({ title: t("error_title"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900">
      <Header />
      <main className="flex-1 py-12 container max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_events")}
        </Button>

        <Card className="shadow-lg border-t-4 border-t-green-600">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-green-600" />
              {t("create_new_event")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t("event_title_label")}</Label>
                <div className="relative">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder={t("event_title_placeholder")}
                    required
                    className="pr-10"
                  />
                  <Trophy className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) =>
                        handleChange("event_date", e.target.value)
                      }
                      required
                      className="pr-3 block"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">{t("start_time_label")}</Label>
                  <div className="relative">
                    <Input
                      id="time"
                      type="time"
                      value={formData.started_time}
                      onChange={(e) =>
                        handleChange("started_time", e.target.value)
                      }
                      required
                      className="pr-3 block"
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span>{t("timezone_label", { timezone: userTimezone })}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">{t("location_label")}</Label>
                  <div className="relative">
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      placeholder="e.g. Las Vegas, NV"
                      required
                      className="pr-10"
                    />
                    <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="division">{t("division_label")}</Label>
                  <Select
                    value={formData.division}
                    onValueChange={(val) => handleChange("division", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((div) => (
                        <SelectItem key={div.id} value={div.name}>
                          {div.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Open Weight">{t("open_weight")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">
                {t("event_status_auto_hint")}
              </p>

              <div className="pt-4 flex items-center justify-end">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white gap-2 min-w-[150px]"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  {isSaving ? t("creating_btn") : t("create_new_event")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CreateEvent;
