import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-muted">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 mb-4"
            >
              <img
                src={logo}
                alt="Global Fighter League"
                className="h-12 w-12"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("footer_desc")}
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">{t("quick_links")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/fighters"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("fighters")}
                </Link>
              </li>
              <li>
                <Link
                  to="/divisions"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("divisions")}
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("events")}
                </Link>
              </li>
              <li>
                <Link
                  to="/sponsors"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("sponsors")}
                </Link>
              </li>
              <li>
                <Link
                  to="/sponsors"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("shop")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">{t("support")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("privacy_policy")}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("terms_of_service")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer_contact_us")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">{t("follow_us")}</h3>
            <div className="flex gap-4 items-center justify-center">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Global Fighter League. {t("all_rights_reserved")}
          </p>
        </div>
      </div>
    </footer>
  );
};
