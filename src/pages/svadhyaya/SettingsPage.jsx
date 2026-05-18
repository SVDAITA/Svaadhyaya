import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Tooltip,
  Avatar,
  Switch,
  Snackbar,
} from "@mui/material";
import {
  Delete,
  Download,
  Logout,
  Fingerprint,
  Palette,
  Lock,
  CameraAlt,
  Visibility,
  VisibilityOff,
  Tune,
  MenuBook,
  Edit as EditIcon,
  Check,
  Close,
  Waves,
  Info,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { SectionLabel } from "../../components/shared/AreaComponents";
import ThemeSettingsPanel from "../../components/shared/ThemeSettingsPanel";
import dayjs from "dayjs";
import { getAreaSubtitle, saveAreaSubtitles, AREA_SUBTITLE_DEFAULTS } from "../../hooks/useAreaSubtitles";
import { getVisibility, saveVisibility } from "../../hooks/useVisibility";

const SETTINGS_DATE = "2000-01-01";

const SYSTEM_SACRED_TASKS = [
  { id: "anushthanam",   label: "Anushthanam",           emoji: "🪔" },
  { id: "riyaz",         label: "Naada Saadhana",         emoji: "🎵" },
  { id: "walk",          label: "Vyaayamam",              emoji: "🏃" },
  { id: "reading",       label: "Pustaka Pathanam",       emoji: "📖" },
  { id: "eat_healthy",   label: "Eat healthy (80% full)", emoji: "🥗" },
  { id: "sleep_healthy", label: "Sleep healthy",           emoji: "🌙" },
];

const buildDefaultBaselines = () => ({
  holiday:  SYSTEM_SACRED_TASKS.slice(0, 3).map((t) => ({ id: t.id, required: true,  minimum: "" })),
  vacation: SYSTEM_SACRED_TASKS.slice(0, 1).map((t) => ({ id: t.id, required: true,  minimum: "" })),
});

function BaselineEditor({ mode, baselines, onChange, heroColor, isDark, textP, textS, border }) {
  const entries = baselines[mode] || [];
  const getEntry = (id) => entries.find((e) => e.id === id) || { id, required: false, minimum: "" };
  const update = (id, patch) => {
    const existing = entries.find((e) => e.id === id);
    const next = existing
      ? entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
      : [...entries, { id, required: false, minimum: "", ...patch }];
    onChange({ ...baselines, [mode]: next });
  };
  return (
    <Box>
      {SYSTEM_SACRED_TASKS.map((task) => {
        const entry = getEntry(task.id);
        return (
          <Box
            key={task.id}
            sx={{
              mb: 1.25, p: 1.5, borderRadius: 2,
              border: `1px solid ${entry.required ? `${heroColor}40` : border}`,
              background: entry.required
                ? `${heroColor}06`
                : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
              transition: "all 0.15s",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography sx={{ fontSize: 18, flexShrink: 0 }}>{task.emoji}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: textP, flex: 1 }}>{task.label}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography sx={{ fontSize: 10, color: textS }}>Required</Typography>
                <Switch
                  size="small"
                  checked={entry.required}
                  onChange={(e) => update(task.id, { required: e.target.checked })}
                  sx={{
                    "& .MuiSwitch-thumb": { bgcolor: entry.required ? heroColor : undefined },
                    "& .Mui-checked + .MuiSwitch-track": { bgcolor: `${heroColor}80` },
                  }}
                />
              </Box>
            </Box>
            {entry.required && (
              <TextField
                fullWidth size="small" variant="standard"
                placeholder={`Minimum version of ${task.label}…`}
                value={entry.minimum}
                onChange={(e) => update(task.id, { minimum: e.target.value })}
                sx={{
                  mt: 1, pl: 4,
                  "& input": { fontSize: 12, color: heroColor },
                  "& .MuiInput-underline:before": { borderBottomColor: `${heroColor}30` },
                  "& .MuiInput-underline:after":  { borderBottomColor: heroColor },
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

const AREA_INFO = [
  { key: "spirit",  emoji: "🪔", name: "Anushthanam" },
  { key: "music",   emoji: "🎵", name: "Nādam" },
  { key: "health",  emoji: "💪", name: "Sharīram" },
  { key: "finance", emoji: "💰", name: "Artha" },
  { key: "career",  emoji: "🚀", name: "Vṛtti" },
  { key: "reading", emoji: "📖", name: "Vidyā" },
];

function TabPanel({ children, value, index }) {
  return (
    <Box hidden={value !== index} sx={{ mt: 3 }}>
      {value === index && children}
    </Box>
  );
}


export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { mode, toggleTheme, setHeroColor, heroColor } = useThemeMode();
  const isDark = mode === "dark";
  const fileRef = useRef(null);

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mantra, setMantra] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(
    () => localStorage.getItem("sv_avatar") || "",
  );

  // ── Email edit
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  // ── Security / Password
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  // ── Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Export
  const [exporting, setExporting] = useState(false);

  // ── Logout confirm
  const [logoutOpen, setLogoutOpen] = useState(false);

  // ── Disruption baselines
  const [baselines, setBaselines] = useState(buildDefaultBaselines());
  const [baselinesLoading, setBaselinesLoading] = useState(false);
  const [baselinesSaving, setBaselinesSaving] = useState(false);
  const [snack, setSnack] = useState("");

  // ── Area taglines
  const [areaSubtitles, setAreaSubtitles] = useState(() => {
    const out = {};
    AREA_INFO.forEach(({ key }) => { out[key] = getAreaSubtitle(key); });
    return out;
  });

  const handleSaveAreaSubtitles = () => {
    saveAreaSubtitles(areaSubtitles);
    setSuccess("Area taglines saved");
    setTimeout(() => setSuccess(""), 3000);
  };

  // ── Visibility
  const [visibility, setVisibility] = useState(() => getVisibility());

  const toggleArea = (key) =>
    setVisibility((v) => ({ ...v, areas: { ...v.areas, [key]: !v.areas[key] } }));

  const toggleTracker = (key) =>
    setVisibility((v) => ({ ...v, trackers: { ...v.trackers, [key]: !v.trackers[key] } }));

  const handleEmailChange = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setEmailLoading(true);
    setError("");
    const { error: emailErr } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);
    if (emailErr) {
      setError(emailErr.message);
    } else {
      setEmailMsg(`Verification sent to ${newEmail}. Click the link in both emails to confirm the change.`);
      setEditingEmail(false);
      setNewEmail("");
    }
  };

  const handleSaveVisibility = () => {
    saveVisibility(visibility);
    setSuccess("Visibility saved");
    setTimeout(() => setSuccess(""), 3000);
  };

  const TRACKER_INFO = [
    { key: "finance", emoji: "💰", name: "Artha Tracker" },
    { key: "health",  emoji: "💪", name: "Sharīram Tracker" },
    { key: "diet",    emoji: "🥗", name: "Anna Tracker" },
    { key: "reading", emoji: "📖", name: "Pathanam Tracker" },
    { key: "career",  emoji: "🚀", name: "Vṛtti Tracker" },
    { key: "sacred",  emoji: "🪔", name: "Purohitam Tracker" },
    { key: "journey", emoji: "✈️",  name: "Yatra Tracker" },
  ];

  const border = isDark ? "rgba(255,255,255,0.08)" : "#D1D0CF";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#5F5F5F";
  const inputBg = isDark ? "rgba(255,255,255,0.03)" : "#FAF9F6";

  // Derived
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const initials =
    [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "S";

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    const [{ data: profile }, { data: settingsRow }] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("days").select("disruption_baselines").eq("user_id", user.id).eq("day_date", SETTINGS_DATE).maybeSingle(),
    ]);
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
    }
    if (profile?.mantra) setMantra(profile.mantra);
    if (settingsRow?.disruption_baselines) setBaselines(settingsRow.disruption_baselines);
  };

  const saveDisruptionBaselines = async () => {
    if (!user) return;
    setBaselinesSaving(true);
    await supabase.from("days").upsert(
      { user_id: user.id, day_date: SETTINGS_DATE, disruption_baselines: baselines },
      { onConflict: "user_id,day_date" },
    );
    setBaselinesSaving(false);
    setSnack("Baselines saved");
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          full_name: fullName,
          mantra,
          hero_color: heroColor,
          theme_mode: mode,
        },
        { onConflict: "user_id" },
      );
      setSuccess("Profile updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setAvatarUrl(url);
      localStorage.setItem("sv_avatar", url);
      setSuccess("Profile picture updated");
      setTimeout(() => setSuccess(""), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    localStorage.removeItem("sv_avatar");
  };

  const handleChangePassword = async () => {
    if (!newPw) {
      setError("Enter a new password");
      return;
    }
    if (newPw.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    setPwLoading(true);
    setError("");
    const { error: pwErr } = await supabase.auth.updateUser({
      password: newPw,
    });
    if (pwErr) {
      setError(pwErr.message);
    } else {
      setPwSuccess(true);
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 4000);
    }
    setPwLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [
        { data: days },
        { data: logs },
        { data: books },
        { data: milestones },
        { data: lakshyas },
        { data: siddhis },
      ] = await Promise.all([
        supabase.from("days").select("*").eq("user_id", user.id),
        supabase.from("logs").select("*").eq("user_id", user.id),
        supabase.from("books").select("*").eq("user_id", user.id),
        supabase.from("milestones").select("*").eq("user_id", user.id),
        supabase.from("lakshyas").select("*").eq("user_id", user.id),
        supabase.from("siddhis").select("*").eq("user_id", user.id),
      ]);
      const payload = {
        days,
        logs,
        books,
        milestones,
        lakshyas,
        siddhis,
        exported_at: new Date().toISOString(),
        user_email: user.email,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `svaadhyaya-export-${dayjs().format("YYYY-MM-DD")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("Export downloaded");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Export failed: " + err.message);
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) return;
    setDeleteLoading(true);
    try {
      // Delete all user data
      await Promise.all([
        supabase.from("days").delete().eq("user_id", user.id),
        supabase.from("logs").delete().eq("user_id", user.id),
        supabase.from("books").delete().eq("user_id", user.id),
        supabase.from("milestones").delete().eq("user_id", user.id),
        supabase.from("lakshyas").delete().eq("user_id", user.id),
        supabase.from("weekly_goals").delete().eq("user_id", user.id),
        supabase.from("user_profiles").delete().eq("user_id", user.id),
      ]);
      localStorage.clear();
      await signOut();
    } catch (err) {
      setError(err.message);
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: "28px 36px" }, maxWidth: 780, mx: "auto" }}>
      {/* Page header */}
      <Typography
        sx={{
          fontFamily: '"Fraunces", serif',
          fontSize: 32,
          fontWeight: 400,
          mb: 0.5,
          color: textP,
        }}
      >
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Your personal operating system.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Card
        sx={{
          border: "1px solid",
          borderColor: border,
          borderRadius: 3,
          background: isDark ? "#1A1916" : "#FCFBF9",
          boxShadow: "none",
        }}
      >
        <Box sx={{ borderBottom: "1px solid", borderColor: border }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              px: 2,
              "& .MuiTab-root": {
                fontSize: 12,
                textTransform: "none",
                fontWeight: 700,
                minHeight: 56,
              },
            }}
          >
            <Tab
              icon={<Fingerprint sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label="Identity"
            />
            <Tab
              icon={<Palette sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label="Aesthetics"
            />
            <Tab
              icon={<Lock sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label="Security"
            />
            <Tab
              icon={<Tune sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label="Areas"
            />
            <Tab
              icon={<Waves sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label="Disruption"
            />
            <Tab
              icon={<MenuBook sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label="Guide"
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* ── IDENTITY TAB ── */}
          <TabPanel value={tab} index={0}>
            <Box sx={{ maxWidth: 480 }}>
              {/* Avatar */}
              <SectionLabel>Profile picture</SectionLabel>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3 }}
              >
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                  <Avatar
                    src={avatarUrl || undefined}
                    sx={{
                      width: 72,
                      height: 72,
                      fontSize: 24,
                      bgcolor: heroColor,
                      border: `2px solid ${heroColor}40`,
                    }}
                  >
                    {!avatarUrl && initials}
                  </Avatar>
                  <IconButton
                    size="small"
                    onClick={() => fileRef.current?.click()}
                    sx={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      width: 24,
                      height: 24,
                      bgcolor: heroColor,
                      color: "#fff",
                      border: "2px solid",
                      borderColor: isDark ? "#1A1916" : "#FCFBF9",
                      "&:hover": { bgcolor: heroColor, opacity: 0.85 },
                    }}
                  >
                    <CameraAlt sx={{ fontSize: 12 }} />
                  </IconButton>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarUpload}
                  />
                </Box>
                <Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => fileRef.current?.click()}
                    sx={{
                      fontSize: 12,
                      textTransform: "none",
                      borderColor: border,
                      color: textS,
                      mb: 0.75,
                      display: "block",
                    }}
                  >
                    Upload photo
                  </Button>
                  {avatarUrl && (
                    <Button
                      size="small"
                      onClick={handleRemoveAvatar}
                      sx={{
                        fontSize: 11,
                        textTransform: "none",
                        color: "#CF4E4E",
                        p: 0,
                      }}
                    >
                      Remove
                    </Button>
                  )}
                  <Typography sx={{ fontSize: 10, color: textS, mt: 0.5 }}>
                    JPG, PNG or GIF · stored locally
                  </Typography>
                </Box>
              </Box>

              {/* Name */}
              <SectionLabel>Name</SectionLabel>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { background: inputBg } }}
                />
                <TextField
                  fullWidth
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { background: inputBg } }}
                />
              </Box>

              {/* Mantra */}
              <SectionLabel>Identity anchor</SectionLabel>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Mantra"
                value={mantra}
                onChange={(e) => setMantra(e.target.value)}
                placeholder="e.g., Ecstatic and humbler at 45."
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": { background: inputBg },
                }}
              />

              {/* Account email */}
              <SectionLabel>Account email</SectionLabel>
              {emailMsg && (
                <Alert severity="info" sx={{ mb: 2, fontSize: 12, borderRadius: 2 }} onClose={() => setEmailMsg("")}>
                  {emailMsg}
                </Alert>
              )}
              {editingEmail ? (
                <Box sx={{ display: "flex", gap: 1, mb: 3, alignItems: "center" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="New email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { background: inputBg } }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleEmailChange}
                    disabled={emailLoading}
                    sx={{ color: heroColor, flexShrink: 0 }}
                  >
                    {emailLoading ? <CircularProgress size={16} /> : <Check sx={{ fontSize: 18 }} />}
                  </IconButton>
                  <IconButton size="small" onClick={() => { setEditingEmail(false); setNewEmail(""); }} sx={{ flexShrink: 0 }}>
                    <Close sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: isDark ? "rgba(255,255,255,0.03)" : "#FAF9F6",
                    border: `1px solid ${border}`,
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: textP, fontWeight: 500 }}>
                    {user?.email}
                  </Typography>
                  <IconButton size="small" onClick={() => setEditingEmail(true)} sx={{ color: textS }}>
                    <EditIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
              )}

              <Button
                variant="contained"
                onClick={handleSaveProfile}
                disabled={loading}
                sx={{
                  background: heroColor,
                  "&:hover": { background: heroColor, opacity: 0.88 },
                  boxShadow: "none",
                  px: 4,
                  textTransform: "none",
                  fontSize: 13,
                }}
              >
                {loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  "Save profile"
                )}
              </Button>
            </Box>
          </TabPanel>

          {/* ── AESTHETICS TAB ── */}
          <TabPanel value={tab} index={1}>
            <ThemeSettingsPanel />
          </TabPanel>

          {/* ── SECURITY TAB ── */}
          <TabPanel value={tab} index={2}>
            <Box sx={{ maxWidth: 440 }}>
              {/* Change Password */}
              <SectionLabel>Change password</SectionLabel>
              {pwSuccess && (
                <Alert
                  severity="success"
                  sx={{ mb: 2, fontSize: 12, borderRadius: 2 }}
                >
                  Password updated successfully ✓
                </Alert>
              )}
              <TextField
                fullWidth
                size="small"
                label="New password"
                type={showPw ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                helperText="Minimum 8 characters"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      size="small"
                      onClick={() => setShowPw((p) => !p)}
                      edge="end"
                    >
                      {showPw ? (
                        <VisibilityOff sx={{ fontSize: 16 }} />
                      ) : (
                        <Visibility sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  ),
                }}
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": { background: inputBg },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Confirm new password"
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": { background: inputBg },
                }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleChangePassword}
                disabled={pwLoading || !newPw || !confirmPw}
                sx={{
                  background: heroColor,
                  "&:hover": { background: heroColor, opacity: 0.88 },
                  boxShadow: "none",
                  fontSize: 13,
                  textTransform: "none",
                  mb: 4,
                }}
              >
                {pwLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  "Update password"
                )}
              </Button>

              <Divider sx={{ borderColor: border, mb: 4 }} />

              {/* Data Export */}
              <SectionLabel>Data portability</SectionLabel>
              <Typography
                sx={{ fontSize: 12, color: textS, mb: 1.5, lineHeight: 1.7 }}
              >
                Export all your Svaadhyaya data — days, logs, books, milestones,
                Lakshyas — as JSON.
              </Typography>
              <Button
                variant="outlined"
                startIcon={
                  exporting ? <CircularProgress size={14} /> : <Download />
                }
                fullWidth
                onClick={handleExport}
                disabled={exporting}
                sx={{
                  textTransform: "none",
                  fontSize: 13,
                  borderColor: border,
                  color: textS,
                  mb: 4,
                  "&:hover": { borderColor: heroColor, color: heroColor },
                }}
              >
                {exporting ? "Exporting…" : "Export Svaadhyaya data"}
              </Button>

              <Divider sx={{ borderColor: border, mb: 4 }} />

              {/* Sign out */}
              <SectionLabel>Session</SectionLabel>
              <Button
                variant="outlined"
                startIcon={<Logout />}
                fullWidth
                onClick={() => setLogoutOpen(true)}
                sx={{
                  textTransform: "none",
                  fontSize: 13,
                  borderColor: border,
                  color: textS,
                  mb: 4,
                  "&:hover": { borderColor: heroColor, color: heroColor },
                }}
              >
                Sign out
              </Button>

              <Divider sx={{ borderColor: border, mb: 4 }} />

              {/* Danger zone */}
              <SectionLabel>Danger zone</SectionLabel>
              <Typography
                sx={{ fontSize: 12, color: textS, mb: 2, lineHeight: 1.7 }}
              >
                Permanently delete your account and all practice data. This
                cannot be undone.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                fullWidth
                onClick={() => setDeleteOpen(true)}
                sx={{ textTransform: "none", fontSize: 13 }}
              >
                Delete account
              </Button>
            </Box>
          </TabPanel>
          {/* ── AREAS TAB ── */}
          <TabPanel value={tab} index={3}>
            <Box sx={{ maxWidth: 520 }}>
              <Typography sx={{ fontSize: 12, color: textS, mb: 3, lineHeight: 1.7 }}>
                Edit the tagline shown under each life area's title. Leave blank to restore the default.
              </Typography>
              {AREA_INFO.map(({ key, emoji, name }) => (
                <Box key={key} sx={{ mb: 2.5 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: textP, mb: 0.75 }}>
                    {emoji} {name}
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={areaSubtitles[key]}
                    onChange={(e) => setAreaSubtitles((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={AREA_SUBTITLE_DEFAULTS[key]}
                    sx={{ "& .MuiOutlinedInput-root": { background: inputBg, fontSize: 13 } }}
                  />
                </Box>
              ))}
              <Button
                variant="contained"
                onClick={handleSaveAreaSubtitles}
                sx={{
                  mt: 1,
                  background: heroColor,
                  "&:hover": { background: heroColor, opacity: 0.88 },
                  boxShadow: "none",
                  px: 4,
                  textTransform: "none",
                  fontSize: 13,
                }}
              >
                Save taglines
              </Button>

              {/* ── Visibility ── */}
              <Divider sx={{ my: 4, borderColor: border }} />
              <SectionLabel>Visibility</SectionLabel>
              <Typography sx={{ fontSize: 12, color: textS, mb: 3, lineHeight: 1.7 }}>
                Hide life areas or trackers you don't use. They'll disappear from the sidebar and tracker list.
              </Typography>

              <Typography sx={{ fontSize: 11, fontWeight: 700, color: textS, textTransform: "uppercase", letterSpacing: 1, mb: 1.5 }}>
                Life Areas
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 3 }}>
                {AREA_INFO.map(({ key, emoji, name }) => (
                  <Box key={key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
                    <Typography sx={{ fontSize: 13, color: textP }}>
                      {emoji} {name}
                    </Typography>
                    <Switch
                      size="small"
                      checked={visibility.areas[key] !== false}
                      onChange={() => toggleArea(key)}
                      sx={{ "& .MuiSwitch-thumb": { bgcolor: heroColor }, "& .Mui-checked + .MuiSwitch-track": { bgcolor: `${heroColor}80` } }}
                    />
                  </Box>
                ))}
              </Box>

              <Typography sx={{ fontSize: 11, fontWeight: 700, color: textS, textTransform: "uppercase", letterSpacing: 1, mb: 1.5 }}>
                Trackers
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 3 }}>
                {TRACKER_INFO.map(({ key, emoji, name }) => (
                  <Box key={key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
                    <Typography sx={{ fontSize: 13, color: textP }}>
                      {emoji} {name}
                    </Typography>
                    <Switch
                      size="small"
                      checked={visibility.trackers[key] !== false}
                      onChange={() => toggleTracker(key)}
                      sx={{ "& .MuiSwitch-thumb": { bgcolor: heroColor }, "& .Mui-checked + .MuiSwitch-track": { bgcolor: `${heroColor}80` } }}
                    />
                  </Box>
                ))}
              </Box>

              <Button
                variant="contained"
                onClick={handleSaveVisibility}
                sx={{
                  background: heroColor,
                  "&:hover": { background: heroColor, opacity: 0.88 },
                  boxShadow: "none",
                  px: 4,
                  textTransform: "none",
                  fontSize: 13,
                }}
              >
                Save visibility
              </Button>
            </Box>
          </TabPanel>
          {/* ── DISRUPTION TAB ── */}
          <TabPanel value={tab} index={4}>
            <Box sx={{ maxWidth: 520 }}>
              <Box
                sx={{
                  mb: 2.5, p: 2, borderRadius: 2,
                  background: `${heroColor}08`,
                  border: `1px solid ${heroColor}25`,
                  display: "flex", gap: 1.5, alignItems: "flex-start",
                }}
              >
                <Info sx={{ fontSize: 16, color: heroColor, mt: 0.2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.7 }}>
                  Define your minimum versions of each sacred task for disrupted days and vacations. These replace the defaults on the Disruption page.
                </Typography>
              </Box>

              {baselinesLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress size={24} sx={{ color: heroColor }} />
                </Box>
              ) : (
                <>
                  <SectionLabel>🌊 Disrupted day</SectionLabel>
                  <Typography sx={{ fontSize: 12, color: textS, mb: 2, lineHeight: 1.6 }}>
                    Toggle which tasks must still happen, and describe the minimum version.
                  </Typography>
                  <BaselineEditor
                    mode="holiday"
                    baselines={baselines}
                    onChange={setBaselines}
                    heroColor={heroColor}
                    isDark={isDark}
                    textP={textP}
                    textS={textS}
                    border={border}
                  />

                  <Divider sx={{ my: 3, borderColor: border }} />

                  <SectionLabel>🏖️ Vacation (sacred mode)</SectionLabel>
                  <Typography sx={{ fontSize: 12, color: textS, mb: 2, lineHeight: 1.6 }}>
                    When on vacation in "Sacred only" mode — what still needs to happen?
                  </Typography>
                  <BaselineEditor
                    mode="vacation"
                    baselines={baselines}
                    onChange={setBaselines}
                    heroColor={heroColor}
                    isDark={isDark}
                    textP={textP}
                    textS={textS}
                    border={border}
                  />

                  <Button
                    variant="contained"
                    onClick={saveDisruptionBaselines}
                    disabled={baselinesSaving}
                    sx={{
                      mt: 3,
                      background: heroColor,
                      "&:hover": { background: heroColor, opacity: 0.88 },
                      boxShadow: "none", px: 4, textTransform: "none", fontSize: 13,
                    }}
                  >
                    {baselinesSaving ? <CircularProgress size={18} color="inherit" /> : "Save baselines"}
                  </Button>
                </>
              )}
            </Box>
          </TabPanel>

          {/* ── GUIDE TAB ── */}
          <TabPanel value={tab} index={5}>
            <Box
              sx={{
                maxWidth: 560,
                maxHeight: { xs: "calc(100vh - 260px)", md: 560 },
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": {
                  borderRadius: 4,
                  background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)",
                },
                "&::-webkit-scrollbar-track": { background: "transparent" },
              }}
            >
              <Typography sx={{ fontSize: 12, color: textS, mb: 4, lineHeight: 1.8 }}>
                Everything you need to get the most out of Svaadhyaya.
              </Typography>

              {/* Section: Philosophy */}
              <SectionLabel>What is Svaadhyaya?</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 3, lineHeight: 1.85 }}>
                Svaadhyaya (स्वाध्याय) means self-study — the practice of turning attention inward. This app is your personal intentionality system across six life areas: Anushthanam (spirit), Nādam (music), Sharīram (body), Artha (finance), Vṛtti (career), and Vidyā (learning). Each area has a dedicated space for long-range visions, milestone tracking, journaling, and weekly goals.
              </Typography>

              {/* Section: Daily Flows */}
              <SectionLabel>Daily flows</SectionLabel>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "Morning flow", desc: "Open Today → review flagged items → confirm your one intention → start the day." },
                  { label: "Night flow", desc: "Open Today → log three wins → flag tomorrow's items → mark the day complete." },
                  { label: "Grace mode", desc: "If the day was hard, use Disruption mode. It marks the day, preserves your streak, and activates sacred minimums." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.5, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Lakshya → Siddhi → Ansh */}
              <SectionLabel>Lakshya → Siddhi → Ansh</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                Svaadhyaya uses a three-level goal hierarchy to connect daily work to long-range visions.
              </Typography>
              <Box sx={{ mb: 2 }}>
                {[
                  { label: "Lakshya (लक्ष्य) — the Vision", desc: "A long-range destination in any life area. Not a task — a direction. Add one from any area page by tapping “Add Lakshya”. Set a target date, write your why, and optionally add a Sanskrit mantra. Each Lakshya has a progress ring on the Dashboard." },
                  { label: "Siddhi (सिद्धि) — the Milestone", desc: "A waypoint that proves you're moving toward your Lakshya. Add Siddhis from inside any Lakshya card. Each Siddhi can have its own Anshs (micro-tasks). Mark a Siddhi complete when you hit it — the Lakshya progress ring updates automatically." },
                  { label: "Ansh (अंश) — the Micro-task", desc: "The smallest unit — a daily or weekly action that serves a Siddhi. Add Anshs inside any Siddhi. When you complete all Anshs under a Siddhi, the Siddhi is ready to be marked done." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 2, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Linking tasks to Lakshyas */}
              <SectionLabel>Linking tasks to Lakshyas</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                Every task in Today can be linked to a Lakshya and Siddhi, so your daily actions pull forward your long-term visions.
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "Locked (sacred) tasks", desc: "Tap the 🔗 icon on any locked task row. A dialog opens — choose the life area, pick your Lakshya, then pick the specific Siddhi this task serves. Save. The task row will show the Lakshya title and ↳ Siddhi name beneath it." },
                  { label: "Custom tasks", desc: "When adding a custom task via “Add Task”, you’ll see Lakshya and Siddhi dropdowns directly in the form. Select them there. You can also link later using the 🔗 icon on the task row." },
                  { label: "Ansh tasks", desc: "Anshs are created from within a Siddhi card on any area page. They appear as micro-tasks linked automatically — no extra linking step needed." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.5, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Deep Work */}
              <SectionLabel>Deep work</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 3, lineHeight: 1.85 }}>
                When adding a custom task, toggle <strong style={{ color: textP }}>Deep work</strong> on. When you complete the task, Svaadhyaya will ask for hours spent and an Ashta Siddhi quality rating (1–8). These entries build your deep work log — visible in the Vṛtti tracker. Use this for any task that demands sustained, focused attention.
              </Typography>

              {/* Section: Dashboard constellation */}
              <SectionLabel>Dashboard constellation</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                The Dashboard shows a constellation of your six life areas. Each node shows:
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "Progress ring", desc: "Fills as your Lakshyas move forward. Completed Siddhis drive the ring." },
                  { label: "Milestone count", desc: "X / Y Siddhis complete across all active Lakshyas in that area." },
                  { label: "Ansh count", desc: "X / Y Anshs complete — shows daily micro-task momentum." },
                  { label: "Active Siddhi", desc: "↳ The name of the current milestone you're working toward (the earliest incomplete Siddhi)." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.25, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Disruption baselines */}
              <SectionLabel>Disruption baselines</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                On a holiday or vacation, Svaadhyaya can enforce minimum sacred practices instead of full task lists. Configure these in <strong style={{ color: textP }}>Settings → Disruption</strong>.
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "Holiday baseline", desc: "On days marked as Holiday disruption, only the tasks you mark here are required. Everything else is optional. Typical choice: Anushthanam, Naada Saadhana, Vyaayamam." },
                  { label: "Vacation baseline", desc: "On Vacation disruption days, an even smaller set is required — usually just Anushthanam. The rest of the day is truly free." },
                  { label: "Required vs optional", desc: "Each task in the baseline can be toggled “Required” (must be done) or given a minimum count. Tasks not in the baseline are silently skipped on disruption days." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.5, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Vacation streak immunity */}
              <SectionLabel>Vacation streak immunity</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 3, lineHeight: 1.85 }}>
                Go to <strong style={{ color: textP }}>Disruption → Vacations</strong> and add a date range for any upcoming or past vacation. Svaadhyaya will treat every day inside that range as exempt — your habit streaks will not break, even if you didn't log tasks on those days. Vacation ranges are separate from daily disruption mode: you don't need to mark each day individually.
              </Typography>

              {/* Section: Trackers */}
              <SectionLabel>Trackers</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 3, lineHeight: 1.85 }}>
                Trackers handle day-to-day logging and are separate from life area pages. Go to the Trackers section in the sidebar. Each tracker is purpose-built: Anna (food & macros), Sharīram (body metrics), Pathanam (books & library), Artha (finance), Vṛtti (career tasks), Purohitam (sacred practice), and Yatra (journeys).
              </Typography>

              {/* Section: JSON Formats */}
              <SectionLabel>JSON upload formats</SectionLabel>
              <Typography sx={{ fontSize: 12, color: textS, mb: 2, lineHeight: 1.75 }}>
                Some trackers accept JSON uploads to sync your data. Use these formats exactly.
              </Typography>

              {/* Anna Tracker format */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: textP, mb: 0.75 }}>
                🥗 Anna Tracker — Weekly meal plan
              </Typography>
              <Box
                sx={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "#F4F3EC",
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                  p: 2,
                  mb: 2.5,
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: textS,
                  overflowX: "auto",
                  whiteSpace: "pre",
                  lineHeight: 1.7,
                }}
              >{`{
  "monday": "Breakfast: Oats | Lunch: Dal Rice | Dinner: Khichdi",
  "tuesday": "Breakfast: Idli | Lunch: Rajma Rice | Dinner: Soup",
  "wednesday": "Breakfast: Poha | Lunch: Curd Rice | Dinner: Roti Sabzi",
  "thursday": "Breakfast: Upma | Lunch: Dal Rice | Dinner: Khichdi",
  "friday": "Breakfast: Dosa | Lunch: Pulao | Dinner: Soup",
  "saturday": "Breakfast: Oats | Lunch: Chole Rice | Dinner: Salad",
  "sunday": "Breakfast: Idli | Lunch: Biryani | Dinner: Light",
  "groceries": ["Oats", "Dal", "Rice", "Vegetables"]
}`}</Box>

              {/* Pathanam Tracker format */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: textP, mb: 0.75 }}>
                📖 Pathanam Tracker — Book library
              </Typography>
              <Box
                sx={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "#F4F3EC",
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                  p: 2,
                  mb: 2.5,
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: textS,
                  overflowX: "auto",
                  whiteSpace: "pre",
                  lineHeight: 1.7,
                }}
              >{`[
  {
    "Title": "The Bhagavad Gita",
    "Author": "Swami Sivananda",
    "Pages": 560,
    "Genre": "Philosophy",
    "Language": "English",
    "Read Status": "Read",
    "Short Description": "Classic translation with commentary.",
    "Price": "₹350",
    "Location": "Home shelf — Row 2",
    "Condition": "Good",
    "Date Added": "2024-01-15"
  }
]`}</Box>
              <Typography sx={{ fontSize: 11, color: textS, mb: 3, lineHeight: 1.7 }}>
                <strong style={{ color: textP }}>Read Status</strong> must be exactly <code style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#EEE", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>"Read"</code> or <code style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#EEE", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>"Unread"</code>. All other fields except Title and Author are optional.
              </Typography>

              {/* Shariram Tracker format */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: textP, mb: 0.75 }}>
                💪 Sharīram Tracker — Body snapshot
              </Typography>
              <Box
                sx={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "#F4F3EC",
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                  p: 2,
                  mb: 3,
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: textS,
                  overflowX: "auto",
                  whiteSpace: "pre",
                  lineHeight: 1.7,
                }}
              >{`{
  "date": "2026-05-17",
  "weight": 82.5,
  "bmi": 24.2,
  "muscle_mass": 61.3,
  "fat_pct": 21.4,
  "visceral_fat": 8,
  "body_age": 34
}`}</Box>

              {/* Section: Data export */}
              <SectionLabel>Exporting your data</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 3, lineHeight: 1.85 }}>
                Go to Settings → Security → "Export Svaadhyaya data". You'll receive a full JSON file containing all your days, logs, books, milestones, Lakshyas, Siddhis, and Anshs. This is your backup — keep it safe.
              </Typography>

              {/* Section: Visibility */}
              <SectionLabel>Hiding areas & trackers</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, lineHeight: 1.85 }}>
                Go to the Areas tab in Settings to toggle life areas and trackers on or off. Hidden items disappear from the sidebar but your data is preserved.
              </Typography>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* ── LOGOUT CONFIRM ── */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${border}`,
            background: isDark ? "#1A1916" : "#FCFBF9",
            boxShadow: "none",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fraunces", serif',
            fontWeight: 400,
            color: textP,
          }}
        >
          Sign out?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: textS }}>
            You'll be returned to the login screen. Your data is safe.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setLogoutOpen(false)}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={signOut}
            variant="contained"
            sx={{
              background: heroColor,
              "&:hover": { background: heroColor, opacity: 0.88 },
              boxShadow: "none",
              textTransform: "none",
              px: 3,
            }}
          >
            Sign out
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DELETE CONFIRM ── */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${border}`,
            background: isDark ? "#1A1916" : "#FCFBF9",
            boxShadow: "none",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fraunces", serif',
            fontWeight: 400,
            color: "#CF4E4E",
          }}
        >
          Delete account
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>
            This is irreversible. All your practice data, Lakshyas, streaks, and
            logs will be permanently deleted.
          </Alert>
          <Typography sx={{ mb: 2, fontSize: 13, color: textS }}>
            Type your email to confirm:{" "}
            <strong style={{ color: textP }}>{user?.email}</strong>
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder={user?.email}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { background: inputBg } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteOpen(false)}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== user?.email || deleteLoading}
            variant="contained"
            color="error"
            sx={{ textTransform: "none", px: 3 }}
          >
            {deleteLoading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "Delete permanently"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack("")}
        message={snack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        action={
          <IconButton size="small" onClick={() => setSnack("")} sx={{ color: "#fff" }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        }
        ContentProps={{ sx: { background: "#2C2C2C", borderRadius: 2, fontSize: 13 } }}
      />
    </Box>
  );
}
