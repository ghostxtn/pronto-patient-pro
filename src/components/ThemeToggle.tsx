import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = isDark ? t.switchToLightMode : t.switchToDarkMode;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(className)}
          title={label}
          aria-label={label}
          onClick={() => setTheme(nextTheme)}
        >
          {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
