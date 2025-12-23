/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";

// Matches your Backend Event Model
interface EventData {
  title: string;
  event_date: string;
  location: string;
  division: string;
  status: "upcoming" | "completed" | "live";
}

// Simple interface for Division
interface Division {
  id: number;
  name: string;
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userType, token } = useAuthStore();

  const [isSaving, setIsSaving] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]); // Store divisions

  const [formData, setFormData] = useState<EventData>({
    title: "",
    event_date: "",
    location: "",
    division: "",
    status: "upcoming",
  });

  // 1. Security Check & Fetch Divisions
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

    // Fetch Divisions List
    const fetchDivisions = async () => {
      try {
        const res = await apiClient.get<Division[]>("/divisions");
        setDivisions(res.data);
      } catch (err) {
        console.error("Failed to load divisions", err);
        // Fallback or silent fail (user can still type manually if you kept input,
        // but here we are using Select, so it might be empty)
      }
    };

    fetchDivisions();
  }, [userType, navigate, toast]);

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

      await apiClient.post("/events", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Event Created",
        description: "New event has been successfully scheduled.",
      });

      navigate("/events");
    } catch (error: any) {
      console.error("Creation failed:", error);
      toast({
        title: "Creation Failed",
        description: error.response?.data?.message || "Server error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

        <Card className="shadow-lg border-t-4 border-t-green-600">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-green-600" />
              Create New Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g. Valor Championship 51"
                  required
                />
              </div>

              {/* Date & Location Grid */}
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
                    * Enter time as it should appear (saved as UTC).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="e.g. Las Vegas, NV"
                    required
                  />
                </div>
              </div>

              {/* Division & Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="division">Division / Weight Class</Label>

                  {/* UPDATED: Using Select for Divisions */}
                  <Select
                    value={formData.division}
                    onValueChange={(val) => handleChange("division", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Division" />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((div) => (
                        <SelectItem key={div.id} value={div.name}>
                          {div.name}
                        </SelectItem>
                      ))}
                      {/* Optional: Add 'Open Weight' manually if needed */}
                      <SelectItem value="Open Weight">Open Weight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
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

              {/* Actions */}
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
                  {isSaving ? "Creating..." : "Create Event"}
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
