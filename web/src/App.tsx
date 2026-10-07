import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRankings } from "@/hooks/useRankings";
import { useTheme } from "@/hooks/useTheme";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Sidebar } from "@/components/layout/Sidebar";
import { IndividualPodium } from "@/components/ranking/IndividualPodium";
import { RankingList } from "@/components/ranking/RankingList";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Menu, X } from "lucide-react";

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "124, 185, 154";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function App() {
  const { init } = useAuthStore();
  const { isDark } = useDarkMode();
  const { settings, refreshTheme } = useTheme();
  const { houses, students, stats, refresh } = useRankings();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    document.title = settings.activity_name || "Event Panel";
  }, [settings.activity_name]);

  useEffect(() => {
    if (settings.logo_path) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.logo_path;
    }
  }, [settings.logo_path]);

  const backgroundStyle = useMemo(() => {
    const mode = isDark ? (settings.dark_bg_mode || "gradient") : settings.bg_mode;
    const color = isDark ? (settings.dark_bg_color || "#0f1117") : (settings.bg_color || "#f8fafc");
    const gradStart = isDark ? (settings.dark_bg_gradient_start || "#1a1c25") : (settings.bg_gradient_start || "#fcfeff");
    const gradEnd = isDark ? (settings.dark_bg_gradient_end || "#0f1117") : (settings.bg_gradient_end || "#f2f7ff");
    const imgPath = isDark ? settings.dark_bg_image_path : settings.bg_image_path;
    const primary = isDark ? (settings.dark_primary_color || settings.primary_color) : settings.primary_color;
    const accent = isDark ? (settings.dark_accent_color || settings.accent_color) : settings.accent_color;

    switch (mode) {
      case "gradient":
        return {
          background: [
            `radial-gradient(circle at 16% 22%, rgba(${hexToRgb(isDark ? primary : accent)}, ${isDark ? 0.08 : 0.2}), transparent 36%)`,
            `radial-gradient(circle at 85% 0%, rgba(${hexToRgb(isDark ? accent : "#FFB74D")}, ${isDark ? 0.06 : 0.15}), transparent 42%)`,
            `linear-gradient(180deg, ${gradStart}, ${gradEnd} 60%, ${gradEnd})`,
          ].join(", "),
        };
      case "image":
        return imgPath
          ? {
              backgroundImage: `url(${imgPath})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { backgroundColor: color };
      default:
        return { backgroundColor: color };
    }
  }, [isDark, settings]);

  const showBlur = isDark ? settings.dark_bg_blur : settings.bg_blur;

  const sidebarContent = (
    <Sidebar settings={settings} stats={stats} houses={houses} onStudentAdded={refresh} onSettingsChanged={() => { refresh(); refreshTheme(); }} />
  );

  return (
    <TooltipProvider>
      <Toaster theme={isDark ? "dark" : "light"} position="top-center" richColors />
      <div className="relative min-h-screen w-full overflow-hidden" style={backgroundStyle}>
        {showBlur && (
          <div className="absolute inset-0 backdrop-blur-xl bg-black/30 z-0" />
        )}

        {/* Mobile menu button - only on small screens (below md) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden fixed top-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl glass-card border border-[var(--border-color)] text-[var(--text-primary)]"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Mobile drawer overlay + panel - only on small screens */}
        <div
          className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />

          {/* Close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white/80 hover:bg-white/25 hover:text-white transition-colors"
            style={{ left: 'calc(min(85vw, 320px) + 12px)' }}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Drawer panel */}
          <div
            className={`
              relative z-10 h-full w-[85vw] max-w-80
              overflow-y-auto p-4
              bg-[var(--card-bg)]/95 backdrop-blur-xl
              rounded-r-2xl shadow-2xl
              transform transition-transform duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            {sidebarContent}
          </div>
        </div>

        {/* Main layout */}
        {/* From md up: 2x2 grid; sidebar and main content span both rows via subgrid so their rows line up */}
        <div className="relative z-10 flex h-screen gap-2 p-2 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)] md:gap-3 md:p-3 max-w-[1920px] mx-auto">
          {/* Tablet sidebar - narrower, visible at md */}
          <div className="hidden md:grid lg:hidden row-span-2 grid-rows-subgrid min-h-0 w-60">
            {sidebarContent}
          </div>

          {/* Desktop sidebar - full width, visible at lg */}
          <div className="hidden lg:grid row-span-2 grid-rows-subgrid min-h-0">
            {sidebarContent}
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col gap-2 overflow-hidden pt-14 md:grid md:row-span-2 md:grid-rows-subgrid md:gap-3 md:pt-0">
            <IndividualPodium students={students} onLapChange={refresh} />
            <RankingList students={students} onLapChange={refresh} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
