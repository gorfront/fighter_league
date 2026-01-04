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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { FightDialog } from "@/components/FightDialog";
import { getFlagComponent } from "@/hooks/getFlagComponent";

import {
  Loader2,
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Edit,
  Swords,
  GripVertical,
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { convertTo24Hour } from "@/hooks/convertTo24Hour";

interface EventData {
  title: string;
  event_date: string;
  started_time: string;
  location: string;
  division: string;
  status: "upcoming" | "completed" | "live";
}

interface Division {
  id: number;
  name: string;
}

const SortableFightItem = ({
  fight,
  onEdit,
  onDelete,
}: {
  fight: any;
  onEdit: (f: any) => void;
  onDelete: (id: any) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fight.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col md:flex-row items-center justify-between p-4 bg-card border rounded hover:shadow-md gap-4 ${
        isDragging ? "opacity-50 shadow-xl border-primary/50" : ""
      }`}
    >
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm uppercase text-muted-foreground">
            {fight.weight_class}
            {fight.is_title_fight && (
              <span className="text-yellow-600 ml-2">🏆 Title</span>
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 flex-1">
        <div className="text-right font-bold text-red-700">
          {fight.redCorner?.name} {getFlagComponent(fight.redCorner?.country)}
        </div>
        <span className="text-xs font-bold text-muted-foreground">VS</span>
        <div className="text-left font-bold text-blue-700">
          {getFlagComponent(fight.blueCorner?.country)} {fight.blueCorner?.name}
        </div>
      </div>
      {typeof fight.id === "string" && (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          New
        </Badge>
      )}
      <div className="flex gap-2 w-full md:w-auto justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(fight)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onDelete(fight.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userType, token } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [fights, setFights] = useState<any[]>([]);
  const [deletedFightIds, setDeletedFightIds] = useState<number[]>([]);
  const [isFightModalOpen, setIsFightModalOpen] = useState(false);
  const [selectedFight, setSelectedFight] = useState<any>(null);

  const [formData, setFormData] = useState<EventData>({
    title: "",
    event_date: "",
    started_time: "",
    location: "",
    division: "",
    status: "upcoming",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (userType !== "ADMIN") {
      navigate("/events");
      return;
    }

    const initData = async () => {
      try {
        const [eventRes, divRes, fightsRes] = await Promise.all([
          apiClient.get(`/events/${id}`),
          apiClient.get<Division[]>("/divisions"),
          apiClient.get(`/fights/event/${id}`),
        ]);

        setDivisions(divRes.data);
        setFights(fightsRes.data);

        const event = eventRes.data;

        const safeTime = convertTo24Hour(event.started_time || "");

        setFormData({
          title: event.title,
          event_date: event.event_date || "",
          started_time: safeTime,
          location: event.location,
          division: event.division,
          status: event.status,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/events");
      } finally {
        setIsLoading(false);
      }
    };

    if (id && token) initData();
  }, [id, userType, navigate, token]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setFights((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveFightLocally = (fightData: any) => {
    if (fightData.id) {
      setFights((prev) =>
        prev.map((f) => (f.id === fightData.id ? { ...f, ...fightData } : f))
      );
    } else {
      const tempId = `temp-${Date.now()}`;
      setFights((prev) => [...prev, { ...fightData, id: tempId }]);
    }
  };

  const handleDeleteFightLocally = (fightId: string | number) => {
    setFights((prev) => prev.filter((f) => f.id !== fightId));
    if (typeof fightId === "number") {
      setDeletedFightIds((prev) => [...prev, fightId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await apiClient.put(`/events/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const promises: Promise<any>[] = [];
      deletedFightIds.forEach((delId) => {
        promises.push(apiClient.delete(`/fights/${delId}`));
      });

      fights.forEach((f, index) => {
        const payload = {
          event_id: id,
          red_corner_id: f.red_corner_id,
          blue_corner_id: f.blue_corner_id,
          weight_class: f.weight_class,
          is_title_fight: f.is_title_fight,
          order_index: index,
        };
        if (typeof f.id === "number") {
          promises.push(apiClient.put(`/fights/${f.id}`, payload));
        } else {
          promises.push(apiClient.post(`/fights`, payload));
        }
      });

      await Promise.all(promises);

      toast({
        title: "Success",
        description: "Event and Fights saved successfully.",
      });

      const refreshedFights = await apiClient.get(`/fights/event/${id}`);
      setFights(refreshedFights.data);
      setDeletedFightIds([]);
    } catch (error: any) {
      console.error("Batch Update failed:", error);
      toast({ title: "Update Failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof EventData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleCreateFight = () => {
    setSelectedFight(null);
    setIsFightModalOpen(true);
  };
  const handleEditFight = (fight: any) => {
    setSelectedFight(fight);
    setIsFightModalOpen(true);
  };

  if (isLoading)
    return (
      <div className="h-screen flex center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 container max-w-4xl">
        <div className="mb-6 flex justify-between">
          <Button variant="ghost" onClick={() => navigate("/events")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button variant="outline" onClick={() => navigate(`/events/${id}`)}>
            View Public Page
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8">
          <Card className="shadow-lg border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle>Edit Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md-sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleChange("event_date", e.target.value)}
                    className="block pr-3"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.started_time}
                    onChange={(e) =>
                      handleChange("started_time", e.target.value)
                    }
                    className="block pr-3"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md-sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Division</Label>
                  <Select
                    value={formData.division}
                    onValueChange={(val) => handleChange("division", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((d) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Open Weight">Open Weight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-t-red-600">
            <CardHeader className="flex flex-row justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <Swords className="text-red-600" /> Fight Card
              </CardTitle>
              <Button
                type="button"
                onClick={handleCreateFight}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Bout
              </Button>
            </CardHeader>
            <CardContent>
              {fights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded">
                  No fights added.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={fights.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {fights.map((fight) => (
                        <SortableFightItem
                          key={fight.id}
                          fight={fight}
                          onEdit={handleEditFight}
                          onDelete={handleDeleteFightLocally}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          <div className="sticky bottom-6 z-10 flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="bg-primary shadow-xl w-full md:w-auto"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Save className="mr-2" />
              )}
              Save All Changes
            </Button>
          </div>
        </form>
      </main>
      <Footer />

      <FightDialog
        isOpen={isFightModalOpen}
        onClose={() => setIsFightModalOpen(false)}
        onSave={handleSaveFightLocally}
        fightToEdit={selectedFight}
        eventId={id!}
      />
    </div>
  );
};

export default EditEvent;
