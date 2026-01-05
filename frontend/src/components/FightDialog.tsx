// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useState, useMemo } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import apiClient from "@/api/apiClient";
// import { Fighter } from "@/types/fighter";

// interface FightDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (fightData: any) => void;
//   fightToEdit?: any;
//   eventId: string;
// }

// interface Division {
//   id: number;
//   name: string;
// }

// export const FightDialog = ({
//   isOpen,
//   onClose,
//   onSave,
//   fightToEdit,
//   eventId,
// }: FightDialogProps) => {
//   const [fighters, setFighters] = useState<Fighter[]>([]);
//   const [divisions, setDivisions] = useState<Division[]>([]);

//   const [redId, setRedId] = useState("");
//   const [blueId, setBlueId] = useState("");
//   const [weight, setWeight] = useState("");
//   const [isTitle, setIsTitle] = useState(false);

//   useEffect(() => {
//     if (!isOpen) return;

//     const fetchData = async () => {
//       try {
//         const [fightersRes, divisionsRes] = await Promise.all([
//           apiClient.get<Fighter[]>(`/events/${eventId}/fighters`),
//           apiClient.get<Division[]>("/divisions"),
//         ]);

//         setFighters(fightersRes.data);
//         setDivisions(divisionsRes.data);
//       } catch (error) {
//         console.error("Failed to fetch data", error);
//       }
//     };
//     fetchData();
//   }, [isOpen, eventId]);

//   useEffect(() => {
//     if (fightToEdit) {
//       setWeight(fightToEdit.weight_class);
//       setRedId(fightToEdit.red_corner_id.toString());
//       setBlueId(fightToEdit.blue_corner_id.toString());
//       setIsTitle(fightToEdit.is_title_fight);
//     } else {
//       setRedId("");
//       setBlueId("");
//       setWeight("");
//       setIsTitle(false);
//     }
//   }, [fightToEdit, isOpen]);

//   const filteredFighters = useMemo(() => {
//     if (!weight || weight === "Open Weight") return fighters;
//     return fighters.filter((f) => f.division === weight);
//   }, [fighters, weight]);

//   const handleWeightChange = (newWeight: string) => {
//     setWeight(newWeight);
//     if (!fightToEdit || newWeight !== fightToEdit.weight_class) {
//       setRedId("");
//       setBlueId("");
//     }
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     const redFighter = fighters.find((f) => f.id.toString() === redId);
//     const blueFighter = fighters.find((f) => f.id.toString() === blueId);

//     const fightData = {
//       id: fightToEdit?.id,
//       red_corner_id: parseInt(redId),
//       blue_corner_id: parseInt(blueId),
//       weight_class: weight,
//       is_title_fight: isTitle,
//       redCorner: redFighter,
//       blueCorner: blueFighter,
//     };

//     onSave(fightData);
//     onClose();
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>
//             {fightToEdit ? "Edit Fight" : "Add New Fight"}
//           </DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="grid gap-4 py-4">
//           <div className="grid gap-2">
//             <Label>Weight Class / Division</Label>
//             <Select value={weight} onValueChange={handleWeightChange}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select Division First" />
//               </SelectTrigger>
//               <SelectContent>
//                 {divisions.map((div) => (
//                   <SelectItem key={div.id} value={div.name}>
//                     {div.name}
//                   </SelectItem>
//                 ))}
//                 <SelectItem value="Open Weight">Open Weight</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid gap-2">
//             <Label>Red Corner</Label>
//             <Select value={redId} onValueChange={setRedId} disabled={!weight}>
//               <SelectTrigger>
//                 <SelectValue
//                   placeholder={
//                     fighters.length === 0
//                       ? "No approved fighters found"
//                       : weight
//                       ? "Select Fighter"
//                       : "Select Division First"
//                   }
//                 />
//               </SelectTrigger>
//               <SelectContent>
//                 {filteredFighters.length === 0 ? (
//                   <div className="p-2 text-sm text-muted-foreground">
//                     {fighters.length === 0
//                       ? "No approved fighters for this event"
//                       : "No fighters in this division"}
//                   </div>
//                 ) : (
//                   filteredFighters.map((f) => (
//                     <SelectItem key={f.id} value={f.id.toString()}>
//                       {f.name}
//                     </SelectItem>
//                   ))
//                 )}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid gap-2">
//             <Label>Blue Corner</Label>
//             <Select value={blueId} onValueChange={setBlueId} disabled={!weight}>
//               <SelectTrigger>
//                 <SelectValue
//                   placeholder={
//                     fighters.length === 0
//                       ? "No approved fighters found"
//                       : weight
//                       ? "Select Fighter"
//                       : "Select Division First"
//                   }
//                 />
//               </SelectTrigger>
//               <SelectContent>
//                 {filteredFighters.length === 0 ? (
//                   <div className="p-2 text-sm text-muted-foreground">
//                     {fighters.length === 0
//                       ? "No approved fighters for this event"
//                       : "No fighters in this division"}
//                   </div>
//                 ) : (
//                   filteredFighters.map((f) => (
//                     <SelectItem
//                       key={f.id}
//                       value={f.id.toString()}
//                       disabled={f.id.toString() === redId}
//                     >
//                       {f.name}
//                     </SelectItem>
//                   ))
//                 )}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="flex items-center space-x-2">
//             <Checkbox
//               id="title"
//               checked={isTitle}
//               onCheckedChange={(c) => setIsTitle(!!c)}
//             />
//             <Label htmlFor="title">Title Fight?</Label>
//           </div>

//           <DialogFooter>
//             <Button type="submit" disabled={!redId || !blueId}>
//               {fightToEdit ? "Update (Local)" : "Add (Local)"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";

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
  const [loadingFighters, setLoadingFighters] = useState(false); // Add loading state

  const [redId, setRedId] = useState("");
  const [blueId, setBlueId] = useState("");
  const [weight, setWeight] = useState("");
  const [isTitle, setIsTitle] = useState(false);

  // 1. Fetch Divisions ONLY ONCE when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchDivisions = async () => {
      try {
        const res = await apiClient.get<Division[]>("/divisions");
        setDivisions(res.data);
      } catch (error) {
        console.error("Failed to fetch divisions", error);
      }
    };
    fetchDivisions();
  }, [isOpen]);

  // 2. Fetch Fighters EVERY TIME "weight" or "eventId" changes
  useEffect(() => {
    if (!isOpen) return;

    // ... inside useEffect
    const fetchFighters = async () => {
      setLoadingFighters(true);
      try {
        // 🔥 UPDATE URL to match the new backend route
        const res = await apiClient.get<Fighter[]>(
          `/events/${eventId}/available-fighters`,
          {
            params: { division: weight === "Open Weight" ? undefined : weight },
          }
        );
        setFighters(res.data);
      } catch (error) {
        console.error("Failed to fetch fighters", error);
        setFighters([]);
      } finally {
        setLoadingFighters(false);
      }
    };

    // Only fetch if a weight is selected (or if you want to load all initially, remove this check)
    if (weight) {
      fetchFighters();
    } else {
      // If no weight selected, maybe clear fighters or fetch all?
      // setFighters([]);
      // OR fetch all:
      fetchFighters();
    }
  }, [isOpen, eventId, weight]); // 🔥 weight is now a dependency

  // 3. Handle Edit Mode Initialization
  useEffect(() => {
    if (fightToEdit) {
      setWeight(fightToEdit.weight_class);
      setRedId(fightToEdit.red_corner_id.toString());
      setBlueId(fightToEdit.blue_corner_id.toString());
      setIsTitle(fightToEdit.is_title_fight);
    } else {
      setRedId("");
      setBlueId("");
      // Don't clear weight here if you want to persist it, otherwise:
      setWeight("");
      setIsTitle(false);
    }
  }, [fightToEdit, isOpen]);

  const handleWeightChange = (newWeight: string) => {
    setWeight(newWeight);
    // Reset selections when changing division
    setRedId("");
    setBlueId("");
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
          {/* DIVISION SELECT */}
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

          {/* RED CORNER */}
          <div className="grid gap-2">
            <Label className="text-red-600">Red Corner</Label>
            <Select
              value={redId}
              onValueChange={setRedId}
              disabled={!weight || loadingFighters}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingFighters
                      ? "Loading..."
                      : fighters.length === 0
                      ? "No approved fighters found"
                      : "Select Fighter"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {/* Render Fighters directly (Backend has already filtered them) */}
                {fighters.map((f) => (
                  <SelectItem
                    key={f.id}
                    value={f.id.toString()}
                    disabled={f.id.toString() === blueId} // Prevent selecting same fighter
                  >
                    {f.name} ({f.wins}-{f.losses})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* BLUE CORNER */}
          <div className="grid gap-2">
            <Label className="text-blue-600">Blue Corner</Label>
            <Select
              value={blueId}
              onValueChange={setBlueId}
              disabled={!weight || loadingFighters}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingFighters
                      ? "Loading..."
                      : fighters.length === 0
                      ? "No approved fighters found"
                      : "Select Fighter"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {fighters.map((f) => (
                  <SelectItem
                    key={f.id}
                    value={f.id.toString()}
                    disabled={f.id.toString() === redId} // Prevent selecting same fighter
                  >
                    {f.name} ({f.wins}-{f.losses})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TITLE FIGHT CHECKBOX */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="title"
              checked={isTitle}
              onCheckedChange={(c) => setIsTitle(!!c)}
            />
            <Label htmlFor="title">Title Fight?</Label>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!redId || !blueId || loadingFighters}
            >
              {loadingFighters && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {fightToEdit ? "Update Fight" : "Add Fight"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
