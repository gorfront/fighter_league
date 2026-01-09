import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ContactUs = () => {
    const { t } = useTranslation();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t("contact_us_success"),
            variant: "default",
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1 container py-12 max-w-5xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">{t("contact_us_title")}</h1>
                    <p className="text-muted-foreground text-lg">
                        {t("contact_us_subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                {t("contact_us_form_title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t("full_name_label")}</Label>
                                    <Input id="name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t("email")}</Label>
                                    <Input id="email" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">{t("description")}</Label>
                                    <Textarea id="message" rows={5} required />
                                </div>
                                <Button type="submit" className="w-full gap-2 text-white">
                                    <Send className="h-4 w-4" />
                                    {t("subscribe_button")}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    {t("contact_us_info_title")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="flex items-center gap-3 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    {t("contact_us_email")}
                                </p>
                                <p className="flex items-center gap-3 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    {t("contact_us_address")}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ContactUs;
