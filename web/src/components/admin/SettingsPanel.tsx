import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
 Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  getActivitySettings,
  updateActivitySettings,
  uploadLogo,
 uploadBackground,
} from "@/api/activity";
import {
 getThemePresets,
 createThemePreset,
  deleteThemePreset,
 applyThemePreset,
  applyBuiltinPreset,
} from "@/api/themePresets";
import { setAdminPasskey } from "@/api/auth";
import { notifyActionError } from "@/lib/notify";
import { getHouses, updateHouseColor } from "@/api/houses";
import type { ActivitySettings, House, ThemePreset, BuiltinThemePreset } from "@/types";
import { ChevronDown, ChevronRight, X, Save, Download, Upload, Database } from "lucide-react";
import { exportRankings } from "@/api/export";
import { getAutocompleteStatus, uploadAutocompleteDB, downloadAutocompleteTemplate, type AutocompleteStatus } from "@/api/autocomplete";
const BUILTIN_PRESETS: BuiltinThemePreset[] = [
  { slug: "default", name: "Default", is_builtin: true, primary_color: "#7CB99A", accent_color: "#9ABBE0", dark_primary_color: "#8ECFAB", dark_accent_color: "#A8C8E8" },
 { slug: "ocean", name: "Ocean", is_builtin: true, primary_color: "#00897B", accent_color: "#0288D1", dark_primary_color: "#4DB6AC", dark_accent_color: "#4FC3F7" },
  { slug: "spring", name: "Spring", is_builtin: true, primary_color: "#66BB6A", accent_color: "#AED581", dark_primary_color: "#81C784", dark_accent_color: "#C5E1A5" },
  { slug: "sakura", name: "Sakura", is_builtin: true, primary_color: "#EC407A", accent_color: "#CE93D8", dark_primary_color: "#F06292", dark_accent_color: "#CE93D8" },
];

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChanged?: () => void;
}

export function SettingsPanel({ open, onOpenChange, onSettingsChanged }: SettingsPanelProps) {
 const [settings, setSettings] = useState<ActivitySettings | null>(null);
 const [houses, setHouses] = useState<House[]>([]);
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>([]);
  const [newAdminPasskey, setNewAdminPasskey] = useState("");
  const [savingPasskey, setSavingPasskey] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
 const [saving, setSaving] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [directoryStatus, setDirectoryStatus] = useState<AutocompleteStatus | null>(null);
  const [uploadingDirectory, setUploadingDirectory] = useState(false);

  useEffect(() => {
    if (open) {
      getActivitySettings().then(setSettings);
    getHouses().then(setHouses);
   getThemePresets().then(setCustomPresets);
      getAutocompleteStatus().then(setDirectoryStatus).catch(() => {});
    }
  }, [open]);

  const saveField = async (field: string, value: unknown) => {
    if (!settings) return;
    setSaving(true);
   try {
   const updated = await updateActivitySettings({ [field]: value });
      setSettings(updated);
     onSettingsChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
    if (!file) return;
    const { path } = await uploadLogo(file);
    await saveField("logo_path", path);
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
  if (!file) return;
    const { path } = await uploadBackground(file);
    await saveField(field, path);
  };

  const handleSetAdminPasskey = async () => {
    setSavingPasskey(true);
    try {
      await setAdminPasskey(newAdminPasskey);
      setNewAdminPasskey("");
      toast.success("Admin passkey updated. Admins must sign in again.");
    } catch (error) {
      notifyActionError(error, "Couldn't update the admin passkey");
    } finally {
      setSavingPasskey(false);
    }
  };

  const handleApplyBuiltin = async (slug: string) => {
    setSaving(true);
   try {
    const updated = await applyBuiltinPreset(slug);
      setSettings(updated);
   onSettingsChanged?.();
    } finally {
     setSaving(false);
    }
 };

  const handleApplyCustom = async (id: number) => {
    setSaving(true);
  try {
      const updated = await applyThemePreset(id);
     setSettings(updated);
    onSettingsChanged?.();
  } finally {
      setSaving(false);
    }
  };

  const handleSaveAsPreset = async () => {
    if (!newPresetName.trim()) return;
    setSavingPreset(true);
   try {
      const preset = await createThemePreset(newPresetName.trim());
    setCustomPresets([...customPresets, preset]);
      setNewPresetName("");
    } finally {
      setSavingPreset(false);
    }
  };

 const handleDeletePreset = async (id: number) => {
  try {
      await deleteThemePreset(id);
   setCustomPresets(customPresets.filter((p) => p.id !== id));
    } catch {
   // ignore
    }
 };

 const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

 if (!settings) return null;

 const renderBgSection = (
   _prefix: "" | "dark_",
    modeKey: "bg_mode" | "dark_bg_mode",
    colorKey: "bg_color" | "dark_bg_color",
    gradStartKey: "bg_gradient_start" | "dark_bg_gradient_start",
   gradEndKey: "bg_gradient_end" | "dark_bg_gradient_end",
   gradAngleKey: "bg_gradient_angle" | "dark_bg_gradient_angle",
    imgKey: "bg_image_path" | "dark_bg_image_path",
   blurKey: "bg_blur" | "dark_bg_blur",
  defaultColor: string,
  defaultGradStart: string,
    defaultGradEnd: string,
  ) => {
    const mode = settings[modeKey] || "solid";
  return (
      <>
     <div className="space-y-2">
         <Label className="text-[var(--text-secondary)]">Mode</Label>
     <div className="flex gap-2">
     {(["solid", "gradient", "image"] as const).map((m) => (
         <Button
           key={m}
        size="sm"
         variant={mode === m ? "default" : "outline"}
         onClick={() => saveField(modeKey, m)}
        className={
         mode === m
          ? ""
          : "border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--card-bg-secondary)]"
         }
          style={mode === m ? { backgroundColor: "var(--theme-primary)" } : undefined}
       >
        {{ solid: "Solid", gradient: "Gradient", image: "Image" }[m]}
            </Button>
         ))}
      </div>
        </div>
       {mode === "solid" && (
      <div className="space-y-2">
     <Label className="text-[var(--text-secondary)]">Color</Label>
          <div className="flex items-center gap-2">
       <input
        type="color"
          value={settings[colorKey] || defaultColor}
        onChange={(e) => setSettings({ ...settings, [colorKey]: e.target.value })}
      className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
           />
        <Input
        value={settings[colorKey] || defaultColor}
       onChange={(e) => setSettings({ ...settings, [colorKey]: e.target.value })}
          className="w-28 border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] font-mono text-sm"
        />
        <Button size="sm" disabled={saving} onClick={() => saveField(colorKey, settings[colorKey])} style={{ backgroundColor: "var(--theme-primary)" }}>Save</Button>
        </div>
     </div>
      )}

        {mode === "gradient" && (
        <>
      <div className="space-y-2">
          <Label className="text-[var(--text-secondary)]">Start Color</Label>
          <div className="flex items-center gap-2">
      <input type="color" value={settings[gradStartKey] || defaultGradStart} onChange={(e) => setSettings({ ...settings, [gradStartKey]: e.target.value })} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent" />
        <Input value={settings[gradStartKey] || ""} onChange={(e) => setSettings({ ...settings, [gradStartKey]: e.target.value })} className="w-28 border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] font-mono text-sm" />
        </div>
      </div>
        <div className="space-y-2">
          <Label className="text-[var(--text-secondary)]">End Color</Label>
          <div className="flex items-center gap-2">
          <input type="color" value={settings[gradEndKey] || defaultGradEnd} onChange={(e) => setSettings({ ...settings, [gradEndKey]: e.target.value })} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent" />
      <Input value={settings[gradEndKey] || ""} onChange={(e) => setSettings({ ...settings, [gradEndKey]: e.target.value })} className="w-28 border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] font-mono text-sm" />
         </div>
        </div>
       <div className="space-y-2">
       <Label className="text-[var(--text-secondary)]">Angle: {settings[gradAngleKey]}&deg;</Label>
        <input type="range" min="0" max="360" value={settings[gradAngleKey]} onChange={(e) => setSettings({ ...settings, [gradAngleKey]: parseInt(e.target.value) })} className="w-full" />
       </div>
            <Button
     size="sm"
          disabled={saving}
      onClick={async () => {
           await saveField(gradStartKey, settings[gradStartKey]);
          await saveField(gradEndKey, settings[gradEndKey]);
         await saveField(gradAngleKey, settings[gradAngleKey]);
           }}
        style={{ backgroundColor: "var(--theme-primary)" }}
     >
         Save Gradient
        </Button>
      </>
        )}

     {mode === "image" && (
       <div className="space-y-2">
           <Label className="text-[var(--text-secondary)]">Image</Label>
          {settings[imgKey] && (
       <img src={settings[imgKey]} alt="Background" className="h-24 w-full rounded-lg object-cover border border-[var(--border-color)]" />
         )}
     <Input type="file" accept="image/*" onChange={(e) => handleBgUpload(e, imgKey)} className="border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)]" />
     </div>
       )}

       <div className="flex items-center justify-between">
    <Label className="text-[var(--text-secondary)]">Blur</Label>
        <button
          onClick={() => saveField(blurKey, !settings[blurKey])}
            className={`relative h-6 w-11 rounded-full transition-colors ${settings[blurKey] ? "" : "bg-[var(--border-color)]"}`}
       style={settings[blurKey] ? { backgroundColor: "var(--theme-primary)" } : undefined}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings[blurKey] ? "translate-x-5" : ""}`} />
      </button>
    </div>
      </>
    );
  };

  const renderColorSection = (
    items: { key: keyof ActivitySettings; label: string }[],
    fallback: string,
  ) => (
    <>
   {items.map(({ key, label }) => (
        <div key={key} className="space-y-2">
     <Label className="text-[var(--text-secondary)]">{label}</Label>
      <div className="flex items-center gap-2">
       <input
       type="color"
       value={(settings[key] as string) || fallback}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
          />
     <Input
          value={(settings[key] as string) || ""}
           onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
        className="w-28 border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] font-mono text-sm"
          />
      <Button size="sm" disabled={saving} onClick={() => saveField(key, settings[key])} style={{ backgroundColor: "var(--theme-primary)" }}>Save</Button>
          </div>
       </div>
    ))}
    </>
  );

  const renderCollapsibleHeader = (title: string, section: string) => (
  <button
      onClick={() => toggleSection(section)}
      className="flex w-full items-center gap-2 py-2 text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--theme-primary)] transition-colors"
   >
   {expandedSection === section ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
      <ChevronRight className="h-4 w-4" />
      )}
   {title}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] sm:max-h-[85vh] overflow-y-auto border-[var(--border-color)] bg-[var(--card-bg)] w-[calc(100vw-1rem)] sm:w-full sm:max-w-2xl rounded-xl">
       <DialogHeader>
         <DialogTitle className="text-[var(--text-primary)]">Settings</DialogTitle>
     </DialogHeader>

        <Tabs defaultValue="activity" className="mt-2">
          <TabsList className="w-full bg-[var(--card-bg-secondary)] h-auto">
      <TabsTrigger value="activity" className="flex-1 text-xs py-2.5 data-[state=active]:bg-[var(--card-bg)]">Activity</TabsTrigger>
       <TabsTrigger value="theme" className="flex-1 text-xs py-2.5 data-[state=active]:bg-[var(--card-bg)]">Theme</TabsTrigger>
      <TabsTrigger value="houses" className="flex-1 text-xs py-2.5 data-[state=active]:bg-[var(--card-bg)]">Houses</TabsTrigger>
         <TabsTrigger value="admins" className="flex-1 text-xs py-2.5 data-[state=active]:bg-[var(--card-bg)]">Admins</TabsTrigger>
            <TabsTrigger value="data" className="flex-1 text-xs py-2.5 data-[state=active]:bg-[var(--card-bg)]">Data</TabsTrigger>
       </TabsList>

    {/* Activity Tab */}
    <TabsContent value="activity" className="space-y-4 mt-4">
    <div className="space-y-2">
        <Label className="text-[var(--text-secondary)]">Activity Name</Label>
         <div className="flex gap-2">
         <Input
           value={settings.activity_name}
       onChange={(e) => setSettings({ ...settings, activity_name: e.target.value })}
         className="border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)]"
          />
        <Button size="sm" disabled={saving} onClick={() => saveField("activity_name", settings.activity_name)} style={{ backgroundColor: "var(--theme-primary)" }}>Save</Button>
          </div>
        </div>
          <div className="space-y-2">
     <Label className="text-[var(--text-secondary)]">Logo</Label>
       {settings.logo_path && (
          <div className="relative inline-block">
            <img src={settings.logo_path} alt="Logo" className="h-16 w-16 rounded-lg object-contain border border-[var(--border-color)]" />
            <button
              onClick={() => saveField("logo_path", "")}
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E57373] text-white hover:bg-[#EF5350] transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
         )}
        <Input type="file" accept="image/*" onChange={handleLogoUpload} className="border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)]" />
        </div>
          <div className="space-y-2">
            <Label className="text-[var(--text-secondary)]">Weather Location</Label>
            <div className="flex gap-2">
              <Input
                list="weather-locations"
                value={settings.weather_location || ""}
                onChange={(e) => setSettings({ ...settings, weather_location: e.target.value })}
                className="border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="Auto (IP-based)"
              />
              <datalist id="weather-locations">
                <option value="">Auto (IP-based)</option>
                <option value="Beijing" />
                <option value="Shanghai" />
                <option value="Guangzhou" />
                <option value="Shenzhen" />
                <option value="Chengdu" />
                <option value="Hangzhou" />
                <option value="Wuhan" />
                <option value="Nanjing" />
                <option value="Chongqing" />
                <option value="Xi'an" />
                <option value="Suzhou" />
                <option value="Tianjin" />
                <option value="Hong Kong" />
                <option value="Taipei" />
                <option value="Tokyo" />
                <option value="Seoul" />
                <option value="Singapore" />
                <option value="London" />
                <option value="New York" />
              </datalist>
              <Button size="sm" disabled={saving} onClick={() => saveField("weather_location", settings.weather_location || "")} style={{ backgroundColor: "var(--theme-primary)" }}>Save</Button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Select a city or type any location.</p>
          </div>
         </TabsContent>

       {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-4 mt-4">
      {/* Preset Selector */}
         <div className="space-y-2">
           <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Presets</Label>
        <div className="flex gap-2 overflow-x-auto pb-2">
           {BUILTIN_PRESETS.map((preset) => (
     <button
       key={preset.slug}
      onClick={() => handleApplyBuiltin(preset.slug)}
       disabled={saving}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-secondary)] p-2.5 hover:border-[var(--theme-primary)] transition-colors shrink-0 min-w-[72px] disabled:opacity-50"
        >
       <div className="flex h-6 w-14 overflow-hidden rounded">
        <div className="flex-1" style={{ backgroundColor: preset.primary_color }} />
        <div className="flex-1" style={{ backgroundColor: preset.accent_color }} />
           </div>
          <span className="text-xs font-medium text-[var(--text-primary)]">{preset.name}</span>
        </button>
      ))}

           {customPresets.map((preset) => (
           <div
         key={preset.id}
      className="relative flex flex-col items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-secondary)] p-2.5 hover:border-[var(--theme-primary)] transition-colors shrink-0 min-w-[72px] group"
           >
          <button
            onClick={() => handleDeletePreset(preset.id)}
      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-[#E57373] text-white"
          >
           <X className="h-2.5 w-2.5" />
          </button>
         <button
        onClick={() => handleApplyCustom(preset.id)}
          disabled={saving}
        className="flex flex-col items-center gap-1.5 disabled:opacity-50"
           >
            <div className="flex h-6 w-14 overflow-hidden rounded">
      <div className="flex-1" style={{ backgroundColor: preset.primary_color }} />
          <div className="flex-1" style={{ backgroundColor: preset.accent_color }} />
            </div>
       <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[64px]">{preset.name}</span>
            </button>
        </div>
        ))}
     </div>
        </div>

      {/* Save as Theme */}
            <div className="flex gap-2">
            <Input
       value={newPresetName}
      onChange={(e) => setNewPresetName(e.target.value)}
        placeholder="Theme name..."
         className="border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm"
         onKeyDown={(e) => e.key === "Enter" && handleSaveAsPreset()}
         />
         <Button
        size="sm"
         disabled={!newPresetName.trim() || savingPreset}
            onClick={handleSaveAsPreset}
      style={{ backgroundColor: "var(--theme-primary)" }}
          className="shrink-0"
          >
        <Save className="h-3.5 w-3.5 mr-1.5" />
          Save
          </Button>
        </div>

      <Separator className="bg-[var(--border-color)]" />

      {/* Collapsible: Background */}
           {renderCollapsibleHeader("Background", "background")}
      {expandedSection === "background" && (
           <div className="space-y-4 pl-6">
         <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Light Mode</Label>
            {renderBgSection("", "bg_mode", "bg_color", "bg_gradient_start", "bg_gradient_end", "bg_gradient_angle", "bg_image_path", "bg_blur", "#f8fafc", "#ffff", "#f3f4f6")}
         <Separator className="bg-[var(--border-color)]" />
       <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Dark Mode</Label>
        {renderBgSection("dark_", "dark_bg_mode", "dark_bg_color", "dark_bg_gradient_start", "dark_bg_gradient_end", "dark_bg_gradient_angle", "dark_bg_image_path", "dark_bg_blur", "#0f1117", "#1a1c25", "#0f1117")}
         </div>
      )}

        {/* Collapsible: Colors */}
         {renderCollapsibleHeader("Colors", "colors")}
         {expandedSection === "colors" && (
     <div className="space-y-4 pl-6">
    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Light Mode</Label>
         {renderColorSection([
        { key: "primary_color", label: "Primary" },
         { key: "secondary_color", label: "Secondary" },
     { key: "accent_color", label: "Accent" },
        { key: "muted_color", label: "Muted" },
     ], "#7CB99A")}
            <Separator className="bg-[var(--border-color)]" />
      <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Dark Mode</Label>
        {renderColorSection([
         { key: "dark_primary_color", label: "Primary" },
        { key: "dark_secondary_color", label: "Secondary" },
      { key: "dark_accent_color", label: "Accent" },
         { key: "dark_muted_color", label: "Muted" },
          ], "#8ECFAB")}
     </div>
       )}

      {/* Collapsible: Effects */}
         {renderCollapsibleHeader("Effects", "effects")}
       {expandedSection === "effects" && (
        <div className="space-y-4 pl-6">
        <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Light Mode</Label>
           <div className="space-y-4">
       <div className="space-y-2">
           <Label className="text-[var(--text-secondary)]">Card Opacity: {settings.card_opacity ?? 90}%</Label>
           <input type="range" min="50" max="100" value={settings.card_opacity ?? 90} onChange={(e) => setSettings({ ...settings, card_opacity: parseInt(e.target.value) })} className="w-full" />
           <Button size="sm" disabled={saving} onClick={() => saveField("card_opacity", settings.card_opacity)} style={{ backgroundColor: "var(--theme-primary)" }}>Save</Button>
        </div>
        <div className="space-y-2">
            <Label className="text-[var(--text-secondary)]">Card Blur: {settings.card_blur ?? 12}px</Label>
           <input type="range" min="0" max="24" value={settings.card_blur ?? 12} onChange={(e) => setSettings({ ...settings, card_blur: parseInt(e.target.value) })} className="w-full" />
          <Button size="sm" disabled={saving} onClick={() => saveField("card_blur", settings.card_blur)} style={{ backgroundColor: "var(--theme-primary)" }}>Save</Button>
         </div>
       </div>      <Separator className="bg-[var(--border-color)]" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Dark Mode</Label>
         <div className="space-y-4">
         <div className="space-y-2">
           <Label className="text-[var(--text-secondary)]">Card Opacity: {settings.dark_card_opacity ?? 85}%</Label>
           <input type="range" min="50" max="100" value={settings.dark_card_opacity ?? 85} onChange={(e) => setSettings({ ...settings, dark_card_opacity: parseInt(e.target.value) })} className="w-full" />
       <Button size="sm" disabled={saving} onClick={() => saveField("dark_card_opacity", settings.dark_card_opacity)} style={{ backgroundColor: "var(--theme-primary)" }}>Save</Button>
            </div>
            <div className="space-y-2">
          <Label className="text-[var(--text-secondary)]">Card Blur: {settings.dark_card_blur ?? 16}px</Label>
          <input type="range" min="0" max="24" value={settings.dark_card_blur ?? 16} onChange={(e) => setSettings({ ...settings, dark_card_blur: parseInt(e.target.value) })} className="w-full" />
         <Button size="sm" disabled={saving} onClick={() => saveField("dark_card_blur", settings.dark_card_blur)} style={{ backgroundColor: "var(--theme-primary)" }}>Save</Button>
        </div>
      </div>
     </div>
         )}
      </TabsContent>

       {/* Houses Tab */}
      <TabsContent value="houses" className="space-y-4 mt-4">
      {houses.map((house) => (
      <div key={house.id} className="space-y-2">
           <Label className="text-[var(--text-secondary)]">{house.name}</Label>
       <div className="flex items-center gap-2">
            <input
       type="color"
           value={house.color}
      onChange={(e) => setHouses(houses.map((h) => h.id === house.id ? { ...h, color: e.target.value } : h))}
      className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
        />
       <Input
        value={house.color}
         onChange={(e) => setHouses(houses.map((h) => h.id === house.id ? { ...h, color: e.target.value } : h))}
         className="w-28 border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] font-mono text-sm"
         />
        <Button
          size="sm"
        disabled={saving}
         onClick={async () => {
         setSaving(true);
         try {
           await updateHouseColor(house.id, house.color);
            onSettingsChanged?.();
           } finally {
         setSaving(false);
         }
      }}
           style={{ backgroundColor: "var(--theme-primary)" }}
        >
         Save
        </Button>
        </div>
           </div>
      ))}
        </TabsContent>

       {/* Admins Tab */}
     <TabsContent value="admins" className="space-y-3 mt-4">
          <Label htmlFor="admin-passkey" className="text-[var(--text-secondary)]">Admin Passkey</Label>
          <p className="text-xs text-[var(--text-muted)]">
            Everyone who enters this passkey signs in as an admin. Changing it signs all admins out.
          </p>
          <Input id="admin-passkey" type="password" autoComplete="new-password" placeholder="New passkey (min 6 chars)" value={newAdminPasskey} onChange={(e) => setNewAdminPasskey(e.target.value)} className="border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
          <Button className="w-full" disabled={savingPasskey || newAdminPasskey.length < 6} onClick={handleSetAdminPasskey} style={{ backgroundColor: "var(--theme-primary)" }}>Set Passkey</Button>
          </TabsContent>

       {/* Data Tab */}
        <TabsContent value="data" className="space-y-4 mt-4">
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Student Directory
            </Label>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Database className="h-4 w-4" />
              {directoryStatus?.loaded
                ? `${directoryStatus.count} students loaded`
                : "No directory uploaded"}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--card-bg-secondary)]"
                onClick={async () => {
                  try { await downloadAutocompleteTemplate(); } catch { /* ignore */ }
                }}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download Template
              </Button>
              <Button
                size="sm"
                className="flex-1 text-white relative"
                style={{ backgroundColor: "var(--theme-primary)" }}
                disabled={uploadingDirectory}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".db";
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    setUploadingDirectory(true);
                    try {
                      const result = await uploadAutocompleteDB(file);
                      setDirectoryStatus({ loaded: true, count: result.count });
                    } catch { /* ignore */ }
                    finally { setUploadingDirectory(false); }
                  };
                  input.click();
                }}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {uploadingDirectory ? "Uploading..." : "Upload Directory"}
              </Button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Upload a SQLite database with student info to enable name/ID autocomplete when adding students.
            </p>
          </div>

          <Separator className="bg-[var(--border-color)]" />

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Export
            </Label>
            <p className="text-sm text-[var(--text-secondary)]">
              Download all student and house rankings as an Excel spreadsheet.
            </p>
            <Button
              className="w-full text-white"
              style={{ backgroundColor: "var(--theme-primary)" }}
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                try {
                  await exportRankings();
                } catch {
                  // ignore
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Exporting..." : "Export Rankings (.xlsx)"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
  );
}
