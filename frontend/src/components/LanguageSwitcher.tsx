import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
    showLabel?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ showLabel = true }) => {
    const { i18n } = useTranslation();
    const { t } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    }, [i18n.language]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "flex items-center gap-2 transition-colors hover:text-black",
                        showLabel ? "w-full text-lg font-medium" : "w-auto"
                    )}
                >
                    <Globe className="h-[1.2rem] w-[1.2rem]" />

                    {showLabel && <span>{t("language", { defaultValue: "Language" })}</span>}

                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('ru')}>
                    Русский
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('ar')}>
                    العربية
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageSwitcher;