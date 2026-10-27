import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
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

interface TopBarProps {
  onStudentAdded?: () => void;
  onSettingsChanged?: () => void;
}

export function TopBar({ onStudentAdded, onSettingsChanged }: TopBarProps) {
  const { isLoggedIn, user, logout } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex items-center justify-end px-6 py-3">
      {isLoggedIn && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="outline-none"
            render={<button />}
          >
              <Avatar className="h-9 w-9 cursor-pointer border border-[#e5e7eb] transition-opacity hover:opacity-80">
                <AvatarFallback
                  className="text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--theme-primary)" }}
                >
                  {user.role === "super_admin" ? "S" : "A"}
                </AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 border-[#e5e7eb] bg-white"
          >
            <DropdownMenuItem
              className="text-[#1f2937] focus:bg-[#f3f4f6] focus:text-[#1f2937] cursor-pointer"
              onClick={() => setShowAddStudent(true)}
            >
              Add Student
            </DropdownMenuItem>
            {user.role === "super_admin" && (
              <DropdownMenuItem
                className="text-[#1f2937] focus:bg-[#f3f4f6] focus:text-[#1f2937] cursor-pointer"
                onClick={() => setShowSettings(true)}
              >
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-[#e5e7eb]" />
            <DropdownMenuItem
              className="text-[#ef4444] focus:bg-[#f3f4f6] focus:text-[#ef4444] cursor-pointer"
              onClick={logout}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#1f2937]"
          onClick={() => setShowLogin(true)}
        >
          Sign In
        </Button>
      )}

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
    </div>
  );
}
