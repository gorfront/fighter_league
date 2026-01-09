import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
    const { t } = useTranslation();
    const lastUpdated = "2026-01-09";

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1 container py-12 max-w-4xl">
                <h1 className="text-4xl font-bold mb-2 text-center">{t("terms_of_service_title")}</h1>
                <p className="text-muted-foreground text-center mb-10">
                    {t("terms_of_service_last_updated", { date: lastUpdated })}
                </p>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("terms_of_service_section_1_title")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">
                                {t("terms_of_service_section_1_content")}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
