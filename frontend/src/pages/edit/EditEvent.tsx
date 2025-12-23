/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Loader2, ArrowLeft, Save, Trash2 } from "lucide-react";

interface EventData {
  title: string;
  event_date: string;
  location: string;
  division: string;
  status: "upcoming" | "completed" | "live";
}

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userType, token } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<EventData>({
    title: "",
    event_date: "",
    location: "",
    division: "",
    status: "upcoming",
  });

  useEffect(() => {
    if (userType !== "ADMIN") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      });
      navigate("/events");
      return;
    }

    const fetchEvent = async () => {
      try {
        const response = await apiClient.get(`/events/${id}`);
        const event = response.data;

        let formattedDate = "";
        if (event.event_date) {
          const dateObj = new Date(event.event_date);
          formattedDate = dateObj.toISOString().slice(0, 16);
        }

        setFormData({
          title: event.title,
          event_date: formattedDate,
          location: event.location,
          division: event.division,
          status: event.status,
        });
      } catch (error) {
        console.error("Error fetching event:", error);
        toast({
          title: "Error",
          description: "Could not load event details.",
          variant: "destructive",
        });
        navigate("/events");
      } finally {
        setIsLoading(false);
      }
    };

    if (id && token) fetchEvent();
  }, [id, userType, navigate, toast, token]);

  const handleChange = (field: keyof EventData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const safeDate = new Date(formData.event_date + ":00Z").toISOString();

      const payload = {
        ...formData,
        event_date: safeDate,
      };

      await apiClient.put(`/events/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Event Updated",
        description: "Event details saved successfully.",
      });
      navigate("/events");
    } catch (error: any) {
      console.error("Update failed:", error);
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Server error occurred.",
        variant: "destructive",
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-1 py-12 container max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>

        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g. Valor Championship 50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time (UTC)</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => handleChange("event_date", e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    * Times are saved in UTC to prevent timezone shifts.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="e.g. London, UK"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="division">Division / Weight Class</Label>
                  <Input
                    id="division"
                    value={formData.division}
                    onChange={(e) => handleChange("division", e.target.value)}
                    placeholder="e.g. Heavyweight"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: any) => handleChange("status", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="live">Live Now</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => {
                    navigate("/events");
                    setFormData({
                      title: "",
                      event_date: "",
                      location: "",
                      division: "",
                      status: "upcoming",
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Cancel
                </Button>

                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground gap-2 min-w-[150px]"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
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

export default EditEvent;
