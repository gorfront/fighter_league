/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Swords, Trophy, ExternalLink } from "lucide-react";
import { getFlagComponent } from "@/hooks/getFlagComponent";

// Helper component for stats rows (defined outside to prevent re-renders)
const StatRow = ({ label, redValue, blueValue }: any) => (
  <div className="grid grid-cols-3 py-3 border-b border-border/50 text-center items-center hover:bg-muted/10 transition-colors">
    <div className="font-bold text-red-600 dark:text-red-400 text-lg font-mono">
      {redValue ?? "-"}
    </div>
    <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">
      {label}
    </div>
    <div className="font-bold text-blue-600 dark:text-blue-400 text-lg font-mono">
      {blueValue ?? "-"}
    </div>
  </div>
);

const FightDetails = () => {
  // 🔥 1. Get the Supabase URL from your environment variables (Same as FighterProfile)
  const supabaseAnonKey = import.meta.env
    .VITE_SUPABASE_FIGHTER_IMAGES as string;

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fight, setFight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const PLACEHOLDER_IMAGE = "/images/fighter-placeholder.png";

  useEffect(() => {
    const fetchFight = async () => {
      try {
        const res = await apiClient.get(`/fights/${id}`);
        setFight(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchFight();
  }, [id]);

  // 🔥 2. Helper function to determine image source (Same logic as FighterProfile)
  const getFighterImage = (imagePath: string | null | undefined) => {
    if (!imagePath) return PLACEHOLDER_IMAGE;

    // If it is the specific Imgur link (or any absolute URL), return it as is
    if (
      imagePath === "https://i.imgur.com/LpaY82x.png" ||
      imagePath.startsWith("http")
    ) {
      return imagePath;
    }

    // Otherwise, prepend the Supabase Storage URL
    return supabaseAnonKey + imagePath;
  };

  // Prevent Infinite Loop if placeholder is missing
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.currentTarget;
    if (target.src.includes("fighter-placeholder.png")) {
      return;
    }
    target.src = PLACEHOLDER_IMAGE;
  };

  const getRecord = (fighter: any) => {
    if (!fighter) return "-";
    return `${fighter.wins}-${fighter.losses}-${fighter.draws}`;
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  if (!fight) return <div className="p-20 text-center">Fight not found.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-5xl py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event
        </Button>

        {/* Fight Header */}
        <div className="text-center mb-10">
          <Badge
            variant="outline"
            className="mb-4 uppercase tracking-widest px-4 py-1 border-primary/20"
          >
            {fight.weight_class} Division
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black italic uppercase flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
            <span className="text-red-600 dark:text-red-500">
              {fight.redCorner?.name}
            </span>
            <span className="text-primary not-italic text-2xl font-serif">
              VS
            </span>
            <span className="text-blue-600 dark:text-blue-500">
              {fight.blueCorner?.name}
            </span>
          </h1>
          {fight.is_title_fight && (
            <div className="mt-4 flex items-center justify-center gap-2 text-yellow-500 font-bold bg-yellow-500/10 py-2 px-4 rounded-full inline-flex mx-auto">
              <Trophy className="h-5 w-5" /> WORLD TITLE BOUT
            </div>
          )}
        </div>

        {/* Tale of the Tape */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mt-12">
          {/* --- RED CORNER CARD --- */}
          <Card
            className="border-t-4 border-t-red-600 shadow-lg overflow-hidden relative group cursor-pointer hover:border-red-400 transition-all duration-300 hover:shadow-2xl"
            onClick={() => navigate(`/fighter/${fight.redCorner?.id}`)}
          >
            <div className="h-2 bg-gradient-to-r from-red-600 to-red-800" />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>

            <CardContent className="pt-8 text-center pb-8">
              <div className="relative mx-auto w-48 h-48 mb-6 rounded-full overflow-hidden border-4 border-red-600 shadow-xl group-hover:scale-105 transition-transform duration-300 bg-muted">
                <img
                  // 🔥 3. Use the helper function here
                  src={getFighterImage(fight.redCorner?.image)}
                  alt={fight.redCorner?.name}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-4xl mb-2">
                {getFlagComponent(fight.redCorner?.country)}
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight group-hover:text-red-600 transition-colors">
                {fight.redCorner?.name}
              </h2>
              <p className="text-red-600 font-semibold mt-1">
                {fight.redCorner?.country}
              </p>
            </CardContent>
          </Card>

          {/* --- STATS COMPARISON (CENTER) --- */}
          <Card className="md:col-span-1 shadow-2xl border-primary/20 relative z-10 md:mt-12">
            <CardContent className="pt-6 px-0 pb-2">
              <h3 className="text-center font-black mb-6 flex items-center justify-center gap-2 text-primary">
                <Swords className="h-5 w-5" /> TALE OF THE TAPE
              </h3>

              <StatRow
                label="Record"
                redValue={getRecord(fight.redCorner)}
                blueValue={getRecord(fight.blueCorner)}
              />

              <StatRow
                label="Knockouts"
                redValue={fight.redCorner?.knockouts}
                blueValue={fight.blueCorner?.knockouts}
              />

              <StatRow
                label="Rank"
                redValue={
                  fight.redCorner?.ranking
                    ? `#${fight.redCorner.ranking}`
                    : "NR"
                }
                blueValue={
                  fight.blueCorner?.ranking
                    ? `#${fight.blueCorner.ranking}`
                    : "NR"
                }
              />

              <StatRow
                label="Age"
                redValue={fight.redCorner?.age}
                blueValue={fight.blueCorner?.age}
              />

              <StatRow
                label="Height"
                redValue={fight.redCorner?.height}
                blueValue={fight.blueCorner?.height}
              />

              <StatRow
                label="Reach"
                redValue={fight.redCorner?.reach}
                blueValue={fight.blueCorner?.reach}
              />

              <StatRow
                label="Weight"
                redValue={`${fight.redCorner?.weight} lbs`}
                blueValue={`${fight.blueCorner?.weight} lbs`}
              />
            </CardContent>
          </Card>

          {/* --- BLUE CORNER CARD --- */}
          <Card
            className="border-t-4 border-t-blue-600 shadow-lg overflow-hidden relative group cursor-pointer hover:border-blue-400 transition-all duration-300 hover:shadow-2xl"
            onClick={() => navigate(`/fighter/${fight.blueCorner?.id}`)}
          >
            <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-800" />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>

            <CardContent className="pt-8 text-center pb-8">
              <div className="relative mx-auto w-48 h-48 mb-6 rounded-full overflow-hidden border-4 border-blue-600 shadow-xl group-hover:scale-105 transition-transform duration-300 bg-muted">
                <img
                  // 🔥 3. Use the helper function here
                  src={getFighterImage(fight.blueCorner?.image)}
                  alt={fight.blueCorner?.name}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-4xl mb-2">
                {getFlagComponent(fight.blueCorner?.country)}
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                {fight.blueCorner?.name}
              </h2>
              <p className="text-blue-600 font-semibold mt-1">
                {fight.blueCorner?.country}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FightDetails;
