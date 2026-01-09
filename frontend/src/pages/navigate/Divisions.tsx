import { useState, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import apiClient from "@/api/apiClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Division } from "@/types/fighter";

const Divisions = () => {
  const { t } = useTranslation();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDivisions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<Division[]>("/divisions");
        setDivisions(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load divisions.");
      } finally {
        setLoading(false);
      }
    };
    fetchDivisions();
  }, []);

  const maleDivisions = divisions.filter((d) => d.gender === "male");
  const femaleDivisions = divisions.filter((d) => d.gender === "female");

  const DivisionCard = ({ division }: { division: Division }) => (
    <Card className="p-6 bg-gradient-stripe hover:shadow-gold transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-2xl font-bold">
          {t(`division_${division.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`, {
            defaultValue: division.name,
          })}
        </h3>
        <Badge className="bg-primary text-primary-foreground">
          {division.gender === "male" ? t("men") : t("women")}
        </Badge>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">{t("weight_range")}</p>
          <p className="text-xl font-semibold text-primary">
            {division.min_weight > 0 ? `${division.min_weight} - ` : "≤ "}
            {division.max_weight} lbs
          </p>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">{t("description")}</p>
          <p className="text-sm">
            {division.gender === "male"
              ? t("male_fighters_desc", {
                division: t(
                  `division_${division.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                  { defaultValue: division.name }
                ).toLowerCase(),
              })
              : t("female_fighters_desc", {
                division: t(
                  `division_${division.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                  { defaultValue: division.name }
                ).toLowerCase(),
              })}{" "}
            {t("division_desc_suffix")}
          </p>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold">{t("loading_divisions")}</h1>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-destructive">{error}</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-16 bg-gradient-stripe border-b border-border">
          <div className="container">
            <h1 className="text-5xl font-bold mb-4">
              <Trans i18nKey="weight_divisions_title">
                Weight <span className="text-primary">Divisions</span>
              </Trans>
            </h1>
            <p className="text-xl text-muted-foreground">
              {t("weight_divisions_subtitle")}
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="all">
                  {t("all_divisions")} ({divisions.length})
                </TabsTrigger>
                <TabsTrigger value="male">
                  {t("mens_divisions")} ({maleDivisions.length})
                </TabsTrigger>
                <TabsTrigger value="female">
                  {t("womens_divisions")} ({femaleDivisions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {divisions.map((division) => (
                    <DivisionCard key={division.id} division={division} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="male">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {maleDivisions.map((division) => (
                    <DivisionCard key={division.id} division={division} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="female">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {femaleDivisions.map((division) => (
                    <DivisionCard key={division.id} division={division} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <section className="py-16 bg-card border-t border-border">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">{t("about_divisions_title")}</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                {t("about_divisions_p1")}
              </p>
              <p>
                {t("about_divisions_p2")}
              </p>
              <p>
                {t("about_divisions_p3")}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Divisions;
