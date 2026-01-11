import { Link } from "react-router-dom";
import { UserCog, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TFunction } from "i18next";

interface RoleBasedLinkProps {
  userType: string | null;
  t: TFunction;
  isMobile?: boolean;
}

export const RoleBasedLink = ({ userType, t, isMobile = false }: RoleBasedLinkProps) => {
  const commonClass = isMobile
    ? "text-lg font-medium flex items-center justify-center"
    : "";
  const iconClass = isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2";

  const renderLink = (path: string, icon: React.ReactNode, label: string) => (
    <Button variant="ghost" asChild>
      <Link to={path} className={commonClass}>
        {icon}
        {label}
      </Link>
    </Button>
  );

  switch (userType) {
    case "ADMIN":
      return renderLink("/dashboard/admin", <UserCog className={iconClass} />, t("header_admin", "Admin"));
    case "FIGHTER":
      return renderLink("/dashboard/fighter", <User className={iconClass} />, t("header_my_profile", "My Profile"));
    case "SPONSOR":
      return renderLink("/dashboard/sponsor", <User className={iconClass} />, t("header_sponsor_hub", "Sponsor Hub"));
    case "DONOR":
      return renderLink("/dashboard/donor", <User className={iconClass} />, t("header_my_page", "My Page"));
    case "GUEST":
      return renderLink("/dashboard/guest", <User className={iconClass} />, t("header_select_role", "Select Role"));
    default:
      return null;
  }
};