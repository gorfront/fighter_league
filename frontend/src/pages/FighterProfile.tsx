import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import apiClient from "@/api/apiClient";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Award, Mail, ShieldCheck } from "lucide-react";
import { Fighter } from "@/types/fighter";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "@/components/Loaders/Loader2";

import countryData from "@/assets/country.json";
import { getFlagComponent } from "@/hooks/getFlagComponent";

const FighterProfile = () => {
  const supabaseAnonKey = import.meta.env
    .VITE_SUPABASE_FIGHTER_IMAGES as string;
  const navigate = useNavigate();

  const { id } = useParams();
  const userType = useAuthStore((s) => s.userType);

  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchFighter = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<Fighter>(`/fighters/${id}`);
        setFighter(response.data);
      } catch (err) {
        console.error(err);
        setError("Fighter not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchFighter();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span className="text-xl font-medium">Loading Fighter...</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !fighter) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">
              {error ? "An Error Occurred" : "Fighter Not Found"}
            </h1>
            {error && <p className="text-muted-foreground mb-4">{error}</p>}
            <Link to="/fighters">
              <Button>Back to Fighters</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalFights = fighter.wins + fighter.losses + fighter.draws;
  const winRate =
    totalFights === 0 ? 0 : Math.round((fighter.wins / totalFights) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="py-4 bg-card border-b border-border sticky top-16 z-20">
          <div className="container">
            <Link to="/fighters">
              <Button
                variant="ghost"
                className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Fighters
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-8 md:py-12 bg-gradient-stripe">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <div className="relative aspect-[3/4] w-full max-w-[320px] lg:max-w-md mx-auto lg:mx-0 overflow-hidden rounded-xl shadow-2xl border-4 border-white dark:border-gray-800">
                <img
                  src={
                    fighter.image === "https://i.imgur.com/LpaY82x.png"
                      ? fighter.image
                      : supabaseAnonKey + fighter.image
                  }
                  alt={fighter.name}
                  className="w-full h-full object-cover bg-muted"
                />
              </div>

              <div className="text-center lg:text-left">
                {fighter.ranking && (
                  <Badge className="bg-primary text-primary-foreground mb-3 text-sm md:text-lg px-3 py-1">
                    Rank #{fighter.ranking}
                  </Badge>
                )}

                <h1 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight">
                  {fighter.name}
                </h1>

                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6 md:mb-8">
                  {getFlagComponent(fighter.country)}
                  <span className="text-lg md:text-2xl text-muted-foreground font-medium">
                    {fighter.country}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-6 mb-8">
                  <Card className="p-4 md:p-6 bg-card/80 backdrop-blur border-none shadow-sm">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1 uppercase tracking-wider">
                      Division
                    </p>
                    <p
                      className="text-lg md:text-2xl font-bold truncate"
                      title={fighter.division}
                    >
                      {fighter.division}
                    </p>
                  </Card>

                  <Card className="p-4 md:p-6 bg-card/80 backdrop-blur border-none shadow-sm">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1 uppercase tracking-wider">
                      Weight
                    </p>
                    <p className="text-lg md:text-2xl font-bold">
                      {fighter.weight}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        lbs
                      </span>
                    </p>
                  </Card>

                  <Card className="p-4 md:p-6 bg-card/80 backdrop-blur border-none shadow-sm">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1 uppercase tracking-wider">
                      Record
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-primary">
                      {fighter.record}
                    </p>
                  </Card>

                  <Card className="p-4 md:p-6 bg-card/80 backdrop-blur border-none shadow-sm">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1 uppercase tracking-wider">
                      Win Rate
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-green-600">
                      {winRate}%
                    </p>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="bg-gradient-gold hover:opacity-90 transition-opacity w-full sm:w-auto"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Sponsor Fighter
                  </Button>

                  {userType && userType !== "GUEST" && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10"
                      onClick={() =>
                        navigate(
                          `/dashboard/messages?contactId=${fighter.user_id}`
                        )
                      }
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {fighter.bio && (
          <section className="py-8 md:py-12 bg-card">
            <div className="container max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">
                Biography
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {fighter.bio}
                </p>
              </div>
            </div>
          </section>
        )}

        {fighter.achievements && fighter.achievements.length > 0 && (
          <section className="py-8 md:py-12">
            <div className="container max-w-4xl">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold">Achievements</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {fighter.achievements.map((achievement, index) => (
                  <Card
                    key={index}
                    className="p-4 flex items-start gap-3 bg-card/50 hover:bg-card transition-colors"
                  >
                    <Award className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="font-medium text-sm md:text-base leading-snug">
                      {achievement}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {fighter.sponsors && fighter.sponsors.length > 0 && (
          <section className="py-8 md:py-12 bg-card/50 border-t">
            <div className="container max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Current Sponsors
              </h2>
              <div className="flex flex-wrap gap-3">
                {fighter.sponsors.map((sponsor) => (
                  <Badge
                    key={sponsor.id}
                    variant="outline"
                    className="text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2 border-primary/20 bg-primary/5"
                  >
                    {sponsor.name} <span className="opacity-50 mx-2">•</span>{" "}
                    <span className="text-primary font-medium">
                      {sponsor.tier}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FighterProfile;
