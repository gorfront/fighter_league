import { Link } from "react-router-dom";
import { Menu, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "./mode-toggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { RoleBasedLink } from "./RoleBasedLink";
import { TFunction } from "i18next";

interface NavigationItem {
  name: string;
  href: string;
}

interface MobileMenuProps {
  token: string | null;
  totalUnread: number;
  navigation: NavigationItem[];
  userType: string | null;
  t: TFunction;
  onLogout: () => void;
}

export const MobileMenu = ({ token, totalUnread, navigation, userType, t, onLogout }: MobileMenuProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild className="sm-md:hidden">
        <Button variant="ghost" size="icon">
          <div className="relative">
            <Menu className="h-5 w-5" />
            {token && totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
            )}
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <nav className="flex flex-col gap-4 mt-8">
          {navigation.map((item) => (
            <Link key={item.name} to={item.href} className="text-lg font-medium transition-colors hover:text-primary">
              {item.name}
            </Link>
          ))}
        </nav>
        <hr className="my-6 border-border" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-center items-center gap-4">
            <ModeToggle showLabel={true} />
            <LanguageSwitcher />
          </div>
          {token ? (
            <>
              <Button variant="ghost" asChild className="text-lg font-medium flex items-center justify-center w-full">
                <Link to="/dashboard/messages">
                  <div className="relative flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    {t("header_messages_title")}
                    {totalUnread > 0 && (
                      <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                  </div>
                </Link>
              </Button>

              <RoleBasedLink userType={userType} t={t} isMobile={true} />
              
              <Button variant="outline" onClick={onLogout} className="text-lg font-medium w-full">
                <LogOut className="h-5 w-5 mr-2" />
                {t("logout", { defaultValue: "Logout" })}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-lg font-medium w-full">
                <Link to="/login">{t("login", { defaultValue: "Login" })}</Link>
              </Button>
              <Button asChild className="text-lg font-medium w-full">
                <Link to="/register">{t("register", { defaultValue: "Register" })}</Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};