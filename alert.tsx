import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-full border-border bg-card hover:bg-accent/10"
    >
      {isDark ? (
        <Sun className="h-[1.1rem] w-[1.1rem] text-accent" />
      ) : (
        <Moon className="h-[1.1rem] w-[1.1rem] text-primary" />
      )}
    </Button>
  );
}
