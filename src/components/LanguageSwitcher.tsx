import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/i18n/config";
import { Languages } from "lucide-react";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

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
          <div className="flex items-center gap-1">
            <Languages className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase">
              {LANGUAGE_OPTIONS.find((option) => option.code === lang)?.shortLabel ?? lang}
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
            <DropdownMenuRadioItem key={option.code} value={option.code}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
