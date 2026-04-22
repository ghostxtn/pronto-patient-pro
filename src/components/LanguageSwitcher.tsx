import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageFlag from "@/components/LanguageFlag";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/i18n/config";
import { Languages } from "lucide-react";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  const currentLanguage = LANGUAGE_OPTIONS.find((option) => option.code === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          title={t.switchLanguage}
          aria-label={t.switchLanguage}
        >
          <div className="flex items-center gap-1.5">
            <Languages className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase">
              {currentLanguage?.shortLabel ?? lang}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuRadioGroup
          value={lang}
          onValueChange={(value) => setLang(value as typeof lang)}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.code} value={option.code} className="gap-2">
              <LanguageFlag lang={option.code} className="h-4 w-5 shrink-0 rounded-[3px]" />
              <span>{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
