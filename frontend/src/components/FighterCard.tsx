import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { Mail, Heart } from "lucide-react";
import { getFlagComponent } from "@/hooks/getFlagComponent";
import { useTranslation } from "react-i18next";

interface FighterCardProps {
  id: string;
  name: string;
  country: string;
  division: string;
  record: string;
  image: string;
  ranking?: number;
  user_id?: number;
}

export const FighterCard = ({
  id,
  name,
  country,
  division,
  record,
  image,
  user_id,
}: FighterCardProps) => {
  const { t } = useTranslation();
  const supabaseAnonKey = import.meta.env
    .VITE_SUPABASE_FIGHTER_IMAGES as string;
  const userType = useAuthStore((s) => s.userType);
  const navigate = useNavigate();

  return (
    <Card className="group relative overflow-hidden border-border bg-gradient-stripe hover:shadow-gold transition-all duration-300">
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={
            image === "https://i.imgur.com/LpaY82x.png"
              ? image
              : supabaseAnonKey + image
          }
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      <div className="p-4 bg-card">
        <div className="mb-3">
          <h3 className="text-xl font-bold mb-1">{name}</h3>

          <div className="flex items-center justify-center gap-2">
            {getFlagComponent(country)}

            <p className="text-sm text-muted-foreground">{country}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <div>
            <p className="text-muted-foreground">{t("division_label")}</p>
            <p className="font-semibold">
              {t(`division_${division.toLowerCase().replace(/[^a-z0-9]/g, "_")}`, {
                defaultValue: division,
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">{t("record_label")}</p>
            <p className="font-semibold text-primary">{record}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to={`/fighter/${id}`}>
            <Button className="w-full bg-gradient-gold hover:opacity-90 transition-opacity">
              {t("view_profile_btn")}
            </Button>
          </Link>
          {userType === "SPONSOR" ? (
            <Link to={`#`}>
              <Button className="w-full bg-gradient-gold hover:opacity-90 transition-opacity">
                {t("sponsor_fighter_btn")}
              </Button>
            </Link>
          ) : (
            <></>
          )}
          {userType && userType !== "GUEST" ? (
            <Button
              className="w-full bg-gradient-gold hover:opacity-90 transition-opacity"
              onClick={() => {
                navigate(`/dashboard/messages?contactId=${user_id}`);
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              {t("message_btn")}
            </Button>
          ) : (
            <></>
          )}

          {userType && userType === "DONOR" ? (
            <Button className="w-full bg-gradient-gold hover:opacity-90 transition-opacity">
              <Heart className="w-4 h-4 mr-2" />
              {t("donate_btn")}
            </Button>
          ) : (
            <></>
          )}
        </div>
      </div>
    </Card>
  );
};
