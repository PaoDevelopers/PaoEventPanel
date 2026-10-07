import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useOnLogout } from "@/hooks/useOnLogout";
import type { ActivitySettings, HouseRanking, Stats } from "@/types";
import { ActivityHeader } from "@/components/activity/ActivityHeader";
import { StatsCards } from "@/components/activity/StatsCards";
import { DateTimeWeather } from "@/components/activity/DateTimeWeather";
import { HousePodium } from "@/components/ranking/HousePodium";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/admin/LoginDialog";
import { AddStudentDialog } from "@/components/admin/AddStudentDialog";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { Sun, Moon, UserPlus } from "lucide-react";

interface SidebarProps {
  settings: ActivitySettings;
  stats: Stats;
  houses: HouseRanking[];
  onStudentAdded?: () => void;
  onSettingsChanged?: () => void;
}

export function Sidebar({ settings, stats, houses, onStudentAdded, onSettingsChanged }: SidebarProps) {
  const { isLoggedIn, isVerifying, user, logout } = useAuthStore();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [showLogin, setShowLogin] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  useOnLogout(() => {
    setShowAddStudent(false);
    setShowSettings(false);
  });

  return (
    // From md up, the two children sit in the page grid's rows (subgrid), so they line up with the podium and ranking list
    <aside className="w-full md:w-60 lg:w-72 shrink-0 h-full flex flex-col gap-2 md:grid md:row-span-2 md:grid-rows-subgrid md:gap-3">
      {/* Top row: aligns with the individual podium */}
      <div className="flex flex-col gap-2 md:gap-3">
        <ActivityHeader settings={settings} />
        <StatsCards stats={stats} />
      </div>

      {/* Bottom row: aligns with the ranking list */}
      <div className="flex-1 min-h-0 flex flex-col gap-2 md:gap-3">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 md:gap-3">
        <HousePodium houses={houses} />
        <DateTimeWeather weatherLocation={settings.weather_location} />
      </div>

      {/* Fixed bottom section */}
      <div className="shrink-0 flex flex-col gap-2 md:gap-3">
        {isLoggedIn && user && (
          <Button
            className="w-full text-white"
            style={{ backgroundColor: "var(--theme-primary)" }}
            onClick={() => setShowAddStudent(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        )}

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]/80 backdrop-blur-sm p-3">
          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="outline-none flex-1"
                  render={<button className="w-full" />}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 cursor-pointer border border-[var(--border-color)]">
                      <AvatarFallback
                        className="text-sm font-medium text-white"
                        style={{ backgroundColor: "var(--theme-primary)" }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{user.username}</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {user.role === "super_admin" ? "Super Admin" : "Admin"}
                      </div>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="top"
                  className="w-52 border-[var(--border-color)] bg-[var(--card-bg)]"
                >
                  {user.role === "super_admin" && (
                    <DropdownMenuItem
                      className="text-[var(--text-primary)] focus:bg-[var(--card-bg-secondary)] focus:text-[var(--text-primary)] cursor-pointer"
                      onClick={() => setShowSettings(true)}
                    >
                      Settings
                    </DropdownMenuItem>
                  )}
                  {user.role === "super_admin" && (
                    <DropdownMenuSeparator className="bg-[var(--border-color)]" />
                  )}
                  <DropdownMenuItem
                    className="text-[#E57373] focus:bg-[var(--card-bg-secondary)] focus:text-[#E57373] cursor-pointer"
                    onClick={logout}
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isVerifying ? (
              // Placeholder while the stored session is checked, so Sign In can't be opened mid-check
              <div className="flex flex-1 items-center gap-3 animate-pulse" aria-busy="true" aria-label="Checking session">
                <div className="h-9 w-9 rounded-full bg-[var(--card-bg-secondary)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 rounded bg-[var(--card-bg-secondary)]" />
                  <div className="h-2.5 w-14 rounded bg-[var(--card-bg-secondary)]" />
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--card-bg-secondary)] hover:text-[var(--text-primary)]"
                onClick={() => setShowLogin(true)}
              >
                Sign In
              </Button>
            )}

            <button
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      </div>

      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
      <AddStudentDialog
        open={showAddStudent}
        onOpenChange={setShowAddStudent}
        onSuccess={onStudentAdded}
      />
      {showSettings && (
        <SettingsPanel
          open={showSettings}
          onOpenChange={setShowSettings}
          onSettingsChanged={onSettingsChanged}
        />
      )}
    </aside>
  );
}
