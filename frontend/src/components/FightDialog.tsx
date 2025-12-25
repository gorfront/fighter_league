/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import apiClient from "@/api/apiClient";
import { Fighter } from "@/types/fighter";

interface FightDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fightData: any) => void;
  fightToEdit?: any;
  eventId: string;
}

interface Division {
  id: number;
  name: string;
}

export const FightDialog = ({
  isOpen,
  onClose,
  onSave,
  fightToEdit,
  eventId,
}: FightDialogProps) => {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [redId, setRedId] = useState("");
  const [blueId, setBlueId] = useState("");
  const [weight, setWeight] = useState("");
  const [isTitle, setIsTitle] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [fightersRes, divisionsRes] = await Promise.all([
          apiClient.get<Fighter[]>(`/events/${eventId}/fighters`),
          apiClient.get<Division[]>("/divisions"),
        ]);

        setFighters(fightersRes.data);
        setDivisions(divisionsRes.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, [isOpen, eventId]);

  useEffect(() => {
    if (fightToEdit) {
      setWeight(fightToEdit.weight_class);
      setRedId(fightToEdit.red_corner_id.toString());
      setBlueId(fightToEdit.blue_corner_id.toString());
      setIsTitle(fightToEdit.is_title_fight);
    } else {
      setRedId("");
      setBlueId("");
      setWeight("");
      setIsTitle(false);
    }
  }, [fightToEdit, isOpen]);

  const filteredFighters = useMemo(() => {
    if (!weight || weight === "Open Weight") return fighters;
    return fighters.filter((f) => f.division === weight);
  }, [fighters, weight]);

  const handleWeightChange = (newWeight: string) => {
    setWeight(newWeight);
    if (!fightToEdit || newWeight !== fightToEdit.weight_class) {
      setRedId("");
      setBlueId("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const redFighter = fighters.find((f) => f.id.toString() === redId);
    const blueFighter = fighters.find((f) => f.id.toString() === blueId);

    const fightData = {
      id: fightToEdit?.id,
      red_corner_id: parseInt(redId),
      blue_corner_id: parseInt(blueId),
      weight_class: weight,
      is_title_fight: isTitle,
      redCorner: redFighter,
      blueCorner: blueFighter,
    };

    onSave(fightData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {fightToEdit ? "Edit Fight" : "Add New Fight"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Weight Class / Division</Label>
            <Select value={weight} onValueChange={handleWeightChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Division First" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((div) => (
                  <SelectItem key={div.id} value={div.name}>
                    {div.name}
                  </SelectItem>
                ))}
                <SelectItem value="Open Weight">Open Weight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Red Corner</Label>
            <Select value={redId} onValueChange={setRedId} disabled={!weight}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    fighters.length === 0
                      ? "No approved fighters found"
                      : weight
                      ? "Select Fighter"
                      : "Select Division First"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredFighters.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {fighters.length === 0
                      ? "No approved fighters for this event"
                      : "No fighters in this division"}
                  </div>
                ) : (
                  filteredFighters.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Blue Corner</Label>
            <Select value={blueId} onValueChange={setBlueId} disabled={!weight}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    fighters.length === 0
                      ? "No approved fighters found"
                      : weight
                      ? "Select Fighter"
                      : "Select Division First"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredFighters.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {fighters.length === 0
                      ? "No approved fighters for this event"
                      : "No fighters in this division"}
                  </div>
                ) : (
                  filteredFighters.map((f) => (
                    <SelectItem
                      key={f.id}
                      value={f.id.toString()}
                      disabled={f.id.toString() === redId}
                    >
                      {f.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="title"
              checked={isTitle}
              onCheckedChange={(c) => setIsTitle(!!c)}
            />
            <Label htmlFor="title">Title Fight?</Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!redId || !blueId}>
              {fightToEdit ? "Update (Local)" : "Add (Local)"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
