import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { Mail, Heart } from "lucide-react";

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
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_IMAGE_URL as string;
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

      {/* <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent">
        {ranking && (
          <Badge className="bg-primary text-primary-foreground">
            #{ranking}
          </Badge>
        )}
      </div> */}

      <div className="p-4 bg-card">
        <div className="mb-3">
          <h3 className="text-xl font-bold mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">{country}</p>
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <div>
            <p className="text-muted-foreground">Division</p>
            <p className="font-semibold">{division}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Record</p>
            <p className="font-semibold text-primary">{record}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to={`/fighter/${id}`}>
            <Button className="w-full bg-gradient-gold hover:opacity-90 transition-opacity">
              View Profile
            </Button>
          </Link>
          {userType === "SPONSOR" ? (
            <Link to={`#`}>
              <Button className="w-full bg-gradient-gold hover:opacity-90 transition-opacity">
                Sponsor a Fighter
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
              Message
            </Button>
          ) : (
            <></>
          )}

          {userType && userType === "DONOR" ? (
            <Button
              className="w-full bg-gradient-gold hover:opacity-90 transition-opacity"
              // onClick={() => {
              //   navigate(`/dashboard/messages?contactId=${user_id}`);
              // }}
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate
            </Button>
          ) : (
            <></>
          )}
        </div>
      </div>
    </Card>
  );
};
