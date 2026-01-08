import { useTranslation, Trans } from "react-i18next";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Trophy, Briefcase } from "lucide-react";

import FighterForm from "@/components/RegisterForms/FighterForm";
import SponsorForm from "@/components/RegisterForms/SponsorForm";
import DonorForm from "@/components/RegisterForms/DonorForm";

import { useAuthStore } from "@/stores/authStore";

const RoleSection = ({ icon, title, children }) => (
  <div className="flex flex-col items-center space-y-4 p-6 bg-card border rounded-lg">
    <div className="flex items-center space-x-3">
      {icon}
      <h2 className="text-2xl font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);

const FighterUpgrade = ({ name, email }) => {
  const { t } = useTranslation();
  return (
    <RoleSection
      icon={<Trophy className="w-6 h-6 text-yellow-600" />}
      title={t("become_fighter")}
    >
      <FighterForm name={name} email={email} />
    </RoleSection>
  );
};

const SponsorUpgrade = ({ name, email }) => {
  const { t } = useTranslation();
  return (
    <RoleSection
      icon={<Briefcase className="w-6 h-6 text-green-600" />}
      title={t("become_sponsor")}
    >
      <SponsorForm name={name} email={email} />
    </RoleSection>
  );
};

const DonorUpgrade = ({ name, email }) => {
  const { t } = useTranslation();
  return (
    <RoleSection
      icon={<Briefcase className="w-6 h-6 text-blue-600" />}
      title={t("become_donor")}
    >
      <DonorForm name={name} email={email} />
    </RoleSection>
  );
};

const RoleSelectionPage = () => {
  const { t } = useTranslation();
  const { userType, currentUser } = useAuthStore();

  const isAlreadyUpgraded =
    userType && userType !== "GUEST" && userType !== "FAN";

  if (isAlreadyUpgraded) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold">{t("access_granted")}</h1>
        <p>
          <Trans
            i18nKey="already_logged_in_as"
            values={{ role: userType }}
            components={{ strong: <strong /> }}
          />
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold">{t("user_not_found")}</h1>
        <p>{t("please_login_continue")}</p>
      </div>
    );
  }

  const roles = [
    { value: "Fighter", title: t("become_fighter") },
    { value: "Sponsor", title: t("become_sponsor") },
    { value: "Donor", title: t("become_donor") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader className="text-center border-b pb-4">
            <CardTitle className="text-3xl font-extrabold text-primary flex justify-center items-center gap-2">
              <User className="h-7 w-7" />
              {t("welcome_select_role")}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              <Trans
                i18nKey="current_account_is"
                values={{ role: userType || "GUEST" }}
                components={{ strong: <strong /> }}
              />
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs defaultValue="Fighter">
              <TabsList className="grid w-full grid-cols-3">
                {roles.map((role) => (
                  <TabsTrigger key={role.value} value={role.value}>
                    {role.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="Fighter">
                <FighterUpgrade
                  name={currentUser.name}
                  email={currentUser.email}
                />
              </TabsContent>

              <TabsContent value="Sponsor">
                <SponsorUpgrade
                  name={currentUser.name}
                  email={currentUser.email}
                />
              </TabsContent>

              <TabsContent value="Donor">
                <DonorUpgrade
                  name={currentUser.name}
                  email={currentUser.email}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default RoleSelectionPage;
