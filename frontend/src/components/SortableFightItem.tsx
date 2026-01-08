/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFlagComponent } from "@/hooks/getFlagComponent";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Badge, Edit, Trash2 } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export const SortableFightItem = ({
  fight,
  onEdit,
  onDelete,
}: {
  fight: any;
  onEdit: (f: any) => void;
  onDelete: (id: any) => void;
}) => {
  const { t } = useTranslation();
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
      className={`flex flex-col md:flex-row items-center justify-between p-4 bg-card border rounded hover:shadow-md gap-4 ${isDragging ? "opacity-50 shadow-xl border-primary/50" : ""
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
              <span className="text-yellow-600 ml-2">🏆 {t("fight_title")}</span>
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 flex-1">
        <div className="text-right font-bold text-red-700">
          {fight.redCorner?.name} {getFlagComponent(fight.redCorner?.country)}
        </div>
        <span className="text-xs font-bold text-muted-foreground">{t("fight_vs")}</span>
        <div className="text-left font-bold text-blue-700">
          {getFlagComponent(fight.blueCorner?.country)} {fight.blueCorner?.name}
        </div>
      </div>
      {typeof fight.id === "string" && (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {t("fight_new")}
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
