import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { useAuthStore } from "@/stores/authStore";
import LanguageSwitcher from "./LanguageSwitcher";
import { ModeToggle } from "./mode-toggle";
import { RoleBasedLink } from "./RoleBasedLink";
import { MobileMenu } from "./MobileMenu";
import { useHeaderChat } from "@/hooks/useHeaderChat";
import { MessagesPopover } from "@/provider/MessagesPopover";

export const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const token = useAuthStore((s) => s.token);
  const userType = useAuthStore((s) => s.userType);
  const logout = useAuthStore((s) => s.logout);

  const { totalUnread, sortedContacts, unreadCounts } = useHeaderChat(token);
  
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const navigation = useMemo(() => [
    { name: t("home"), href: "/" },
    { name: t("fighters"), href: "/fighters" },
    { name: t("divisions", { defaultValue: "Divisions" }), href: "/divisions" },
    { name: t("events"), href: "/events" },
    { name: t("sponsors", { defaultValue: "Sponsors" }), href: "/sponsors" },
    { name: t("shop", { defaultValue: "Shop" }), href: "https://fight-store-5307.myshopify.com/", target: "_blank" },
  ], [t]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleContactClick = (contactId: number) => {
    setIsPopoverOpen(false);
    navigate(`/dashboard/messages?contactId=${contactId}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Global League" className="h-10 w-10" />
          <span className="text-xl font-bold">
            <span className="text-foreground">Global </span>
            <span className="text-primary"> League</span>
          </span>
        </Link>

        <div className="hidden sm-md:flex items-center gap-6">
          <nav className="flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                target={item.href.startsWith("http") ? "_blank" : "_self"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-2">
            <ModeToggle />
            <LanguageSwitcher showLabel={false} />
            
            {token ? (
              <>
                <MessagesPopover
                  isPopoverOpen={isPopoverOpen}
                  setIsPopoverOpen={setIsPopoverOpen}
                  totalUnread={totalUnread}
                  t={t}
                  sortedContacts={sortedContacts}
                  unreadCounts={unreadCounts}
                  onContactClick={handleContactClick}
                  onViewAllClick={() => {
                    setIsPopoverOpen(false);
                    navigate("/dashboard/messages");
                  }}
                />

                <RoleBasedLink userType={userType} t={t} />
                
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("logout", { defaultValue: "Logout" })}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">{t("login", { defaultValue: "Login" })}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t("register", { defaultValue: "Register" })}</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <MobileMenu 
          token={token} 
          totalUnread={totalUnread} 
          navigation={navigation}
          userType={userType}
          t={t}
          onLogout={handleLogout}
        />
      </div>
    </header>
  );
};