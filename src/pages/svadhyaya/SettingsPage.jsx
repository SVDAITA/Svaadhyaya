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
  Grid,
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
  { id: "saadhana",      label: "Naada Saadhana",         emoji: "🎵" },
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
    try {
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
    } catch (err) {
      console.error("SettingsPage loadSettings error:", err.message);
    }
  };

  const saveDisruptionBaselines = async () => {
    if (!user) return;
    setBaselinesSaving(true);
    const { error } = await supabase.from("days").upsert(
      { user_id: user.id, day_date: SETTINGS_DATE, disruption_baselines: baselines },
      { onConflict: "user_id,day_date" },
    );
    setBaselinesSaving(false);
    setSnack(error ? "Failed to save baselines" : "Baselines saved");
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
            <Box sx={{ maxWidth: 680 }}>

              {/* ── Taglines section ── */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: textP }}>Area Taglines</Typography>
                  <Typography sx={{ fontSize: 11, color: textS, mt: 0.25 }}>
                    Subtitle shown under each area's title. Leave blank to restore default.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveAreaSubtitles}
                  sx={{
                    background: heroColor,
                    "&:hover": { background: heroColor, opacity: 0.88 },
                    boxShadow: "none",
                    textTransform: "none",
                    fontSize: 12,
                    px: 2.5,
                    borderRadius: 2,
                  }}
                >
                  Save
                </Button>
              </Box>

              <Grid container spacing={1.5} sx={{ mb: 4 }}>
                {AREA_INFO.map(({ key, emoji, name }) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Box
                      sx={{
                        border: `1px solid ${border}`,
                        borderRadius: 2,
                        p: 1.25,
                        background: inputBg,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                      }}
                    >
                      <Typography sx={{ fontSize: 15, flexShrink: 0 }}>{emoji}</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: textS, textTransform: "uppercase", letterSpacing: 0.8 }}>
                          {name}
                        </Typography>
                        <TextField
                          fullWidth
                          variant="standard"
                          size="small"
                          value={areaSubtitles[key]}
                          onChange={(e) => setAreaSubtitles((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder={AREA_SUBTITLE_DEFAULTS[key]}
                          InputProps={{ disableUnderline: false }}
                          sx={{
                            "& .MuiInput-root": { fontSize: 12, color: textP },
                            "& .MuiInput-underline:before": { borderBottomColor: border },
                            "& .MuiInput-underline:hover:before": { borderBottomColor: heroColor },
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* ── Visibility section ── */}
              <Divider sx={{ mb: 3, borderColor: border }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: textP }}>Visibility</Typography>
                  <Typography sx={{ fontSize: 11, color: textS, mt: 0.25 }}>
                    Toggle areas and trackers on/off. Hidden items leave data intact.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveVisibility}
                  sx={{
                    background: heroColor,
                    "&:hover": { background: heroColor, opacity: 0.88 },
                    boxShadow: "none",
                    textTransform: "none",
                    fontSize: 12,
                    px: 2.5,
                    borderRadius: 2,
                  }}
                >
                  Save
                </Button>
              </Box>

              <Typography sx={{ fontSize: 10, fontWeight: 700, color: textS, textTransform: "uppercase", letterSpacing: 1, mb: 1 }}>
                Life Areas
              </Typography>
              <Grid container spacing={1} sx={{ mb: 3 }}>
                {AREA_INFO.map(({ key, emoji, name }) => (
                  <Grid item xs={6} sm={4} key={key}>
                    <Box
                      sx={{
                        border: `1px solid ${border}`,
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.75,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: visibility.areas[key] !== false ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : "transparent",
                        opacity: visibility.areas[key] !== false ? 1 : 0.5,
                      }}
                    >
                      <Typography sx={{ fontSize: 12, color: textP }}>
                        {emoji} {name}
                      </Typography>
                      <Switch
                        size="small"
                        checked={visibility.areas[key] !== false}
                        onChange={() => toggleArea(key)}
                        sx={{ "& .MuiSwitch-thumb": { bgcolor: heroColor }, "& .Mui-checked + .MuiSwitch-track": { bgcolor: `${heroColor}80` } }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Typography sx={{ fontSize: 10, fontWeight: 700, color: textS, textTransform: "uppercase", letterSpacing: 1, mb: 1 }}>
                Trackers
              </Typography>
              <Grid container spacing={1}>
                {TRACKER_INFO.map(({ key, emoji, name }) => (
                  <Grid item xs={6} sm={4} key={key}>
                    <Box
                      sx={{
                        border: `1px solid ${border}`,
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.75,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: visibility.trackers[key] !== false ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : "transparent",
                        opacity: visibility.trackers[key] !== false ? 1 : 0.5,
                      }}
                    >
                      <Typography sx={{ fontSize: 12, color: textP }}>
                        {emoji} {name}
                      </Typography>
                      <Switch
                        size="small"
                        checked={visibility.trackers[key] !== false}
                        onChange={() => toggleTracker(key)}
                        sx={{ "& .MuiSwitch-thumb": { bgcolor: heroColor }, "& .Mui-checked + .MuiSwitch-track": { bgcolor: `${heroColor}80` } }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>

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
                  { label: "Morning flow", desc: "Open Today → review flagged items → confirm your one intention → start the day. When you log sleep hours in the morning flow, they are written to yesterday's activity record — so last night's sleep is always attributed to the day it affected." },
                  { label: "Night flow", desc: "Open Today → log three wins → flag tomorrow's items → mark the day complete." },
                  { label: "Grace mode", desc: "If the day was hard, use Disruption mode. It marks the day, preserves your streak, and activates sacred minimums." },
                  { label: "Weekends", desc: "On weekends the Core section still shows your Vṛtti (office) task — it's just optional. Tap it to mark done whenever you're ready, without needing to complete any sub-tasks first. All other core tasks remain visible too." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.5, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Lakshya & Milestones */}
              <SectionLabel>Lakshya &amp; Milestones</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                Svaadhyaya uses a two-level vision structure to connect daily practice to long-range destinations.
              </Typography>
              <Box sx={{ mb: 2 }}>
                {[
                  { label: "Lakshya (लक्ष्य) — the Vision", desc: "A long-range destination in any life area. Not a task — a direction. Add one from any area page by tapping ‘New Vision’. Choose a goal type, set a target date, write your why, and optionally add a Sanskrit mantra." },
                  { label: "Goal types", desc: "Each Lakshya has a type that shapes how progress is shown. Habit — build consistency over time (streak + 30-day %). Completion — finish X of Y discrete things. Outcome — hit a measurable number (current → target). Mastery — reach a quality level on the 8-point Ashtasiddhi scale." },
                  { label: "Milestone — the Waypoint", desc: "Binary checkpoints under a Lakshya. Add them from inside any Lakshya card. Mark one complete when you reach it — the card’s progress bar updates automatically." },
                  { label: "Milestone progress hints", desc: "Under each active milestone, Svaadhyaya shows a live hint telling you how far you are from reaching it — automatically computed from your current progress. For this to work, include the target number somewhere in the milestone title. The app reads it intelligently: ‘Complete 90 days’ → tracks days done vs 90. ‘Reach Level 5’ → tracks your Ashtasiddhi level vs 5. ‘Save 10L’ → tracks your outcome value vs 10. ‘Finish 50 sessions’ → tracks streak vs 50. Use plain language — the app looks for numbers after words like reach, level, save, hit, complete, finish, achieve, days, sessions, books, hours, and more. If no number is found, no hint is shown (which is fine for qualitative milestones like ‘Land my first freelance client’)." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 2, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Today’s connection */}
              <SectionLabel>Today’s connection to your Lakshyas</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                The Today page shows a <strong style={{ color: textP }}>"Today you’re working toward"</strong> banner above your habit sections — chips for every active Lakshya that has at least one tracker item linked to it. When you check off a habit, any Lakshya linked to that area’s tracker glows green — real-time feedback that practice and vision are aligned.
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "How it lights up", desc: "When you mark today’s Anushthanam, Nāda, exercise, office work, or study done, every Lakshya linked to those tracker items glows green in the banner. No manual setup needed — linking happens inside the tracker dialogs." },
                  { label: "Multiple areas, one vision", desc: "If you have a Lakshya that spans areas (e.g. a health vision linked to both a workout routine and a dietary goal), all linked trackers contribute. The chip glows green as soon as any one of them is checked today." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.5, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Linking tasks to Lakshyas */}
              <SectionLabel>Linking tasks to Lakshyas</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                Tasks in Today can be linked to a Lakshya so your daily actions visibly pull forward your long-term visions.
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "Locked (sacred) tasks", desc: "Tap the 🔗 icon on any locked task row. A dialog opens — choose the life area and pick the Lakshya this task serves. The task row will show the Lakshya title beneath it." },
                  { label: "Custom tasks", desc: "When adding a custom task via ‘Add Task’, you’ll see a Lakshya dropdown directly in the form. You can also link later using the 🔗 icon on the task row." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.5, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Tracker → Lakshya links */}
              <SectionLabel>Linking tracker items to Lakshyas</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                When you create or edit an item in any tracker — a daily sequence, a japa goal, a project, a music course, a book, or a study course — you’ll see a <strong style={{ color: textP }}>"Serves Vision"</strong> dropdown at the bottom of the form. Pick the Lakshya this item is working toward. That’s all it takes.
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "Anushthanam (Spirit)", desc: "Link any sequence item or japa goal to a Lakshya. E.g. your ‘Morning puja’ sequence item can serve a ‘90-day Nitya Anushthanam’ Lakshya." },
                  { label: "Vṛtti (Career)", desc: "Link any project to a Lakshya. E.g. a ‘Build portfolio site’ project can serve a ‘Land a senior role’ Lakshya." },
                  { label: "Nādam (Music)", desc: "Link any music course or examination to a Lakshya. E.g. a ‘Sangeeta Visharada’ course can serve a ‘Complete formal training’ Lakshya." },
                  { label: "Vidyā (Reading)", desc: "Link any book or online course to a Lakshya. E.g. ‘Atomic Habits’ can serve a ‘Build reading discipline’ Lakshya." },
                  { label: "Streak & consistency", desc: "For habit-type Lakshyas, the streak and 30-day consistency % on the Lakshya card are computed directly from your linked tracker’s activity table — no manual entry needed." },
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
                When adding a custom task, toggle <strong style={{ color: textP }}>Deep work</strong> on. When you complete the task, Svaadhyaya will ask for hours spent and an Ashtasiddhi quality rating (1–8). These entries build your deep work log — visible in the Vṛtti tracker. Use this for any task that demands sustained, focused attention.
              </Typography>

              {/* Section: Dashboard constellation */}
              <SectionLabel>Dashboard constellation</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                The Dashboard shows a constellation of your six life areas. Each node shows:
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "Progress ring", desc: "Fills as your Lakshyas move forward. Completed milestones drive the ring." },
                  { label: "Milestone count", desc: "X / Y milestones complete across all active Lakshyas in that area." },
                  { label: "Active milestone", desc: "↳ The name of the current waypoint you're working toward (the earliest incomplete milestone)." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.25, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: Ashtasiddhi & Resonance Mass */}
              <SectionLabel>Ashtasiddhi &amp; Resonance Mass</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                The sidebar shows your current practice level — e.g. <strong style={{ color: textP }}>Saadhana · Level 5</strong>. This is your Ashtasiddhi level, a 1–8 scale derived from how you rate each habit when you complete it. The eight levels are:
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 0.75,
                  mb: 2.5,
                  pl: 0.5,
                }}
              >
                {[
                  { v: 1, name: "Sthiti",  emoji: "🌱", label: "Presence"   },
                  { v: 2, name: "Prayas",  emoji: "🌿", label: "Effort"     },
                  { v: 3, name: "Nishtha", emoji: "🌳", label: "Steadiness" },
                  { v: 4, name: "Bodha",   emoji: "💡", label: "Awareness"  },
                  { v: 5, name: "Saadhana",emoji: "🔥", label: "Practice"   },
                  { v: 6, name: "Prajna",  emoji: "⚡", label: "Insight"    },
                  { v: 7, name: "Samadhi", emoji: "🌟", label: "Absorption" },
                  { v: 8, name: "Siddhi",  emoji: "✨", label: "Mastery"    },
                ].map(({ v, name, emoji, label }) => (
                  <Box
                    key={v}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${border}`,
                      borderRadius: 1.5,
                      px: 1.25,
                      py: 0.6,
                    }}
                  >
                    <Typography sx={{ fontSize: 14, lineHeight: 1 }}>{emoji}</Typography>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: textP, lineHeight: 1.2 }}>
                        {v}. {name}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: textS, lineHeight: 1.3 }}>{label}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mb: 2.5 }}>
                {[
                  { label: "How the level is computed", desc: "With fewer than 30 days of data, your level = yesterday's average quality rating across all completed habits. Once you have 30+ days, it switches to a rolling average across the past 30 days — smoothing out spikes and reflecting sustained practice." },
                  { label: "Rating each habit", desc: "After completing any habit, the completion dialog asks for an Ashtasiddhi quality (1–8). Be honest — rating 8 every day will inflate your level without reflecting real depth. The scale is designed to make 5–6 the natural zone for a strong consistent practice." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.5, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              <Typography sx={{ fontSize: 13, color: textS, mb: 1.5, lineHeight: 1.85 }}>
                <strong style={{ color: textP }}>Resonance Mass</strong> is the raw score behind the level. Every completed habit adds <strong style={{ color: textP }}>2 pts base</strong> plus a quality bonus. The bonus curve is intentionally nonlinear — deeper practice is rewarded exponentially:
              </Typography>
              <Box
                sx={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "#F4F3EC",
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                  p: 2,
                  mb: 1.5,
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: textS,
                  lineHeight: 1.8,
                  whiteSpace: "pre",
                }}
              >{`Level  Quality bonus  Total per habit
  1    + 1 pt         3 pts
  2    + 2 pts        4 pts
  3    + 4 pts        6 pts
  4    + 7 pts        9 pts
  5    +12 pts       14 pts
  6    +18 pts       20 pts
  7    +25 pts       27 pts
  8    +35 pts       37 pts`}</Box>
              <Typography sx={{ fontSize: 12, color: textS, mb: 2.5, lineHeight: 1.75 }}>
                A day where every habit is rated 8 contributes 37× more mass per habit than a day rated 1. The Dashboard constellation's orbit radius is driven by Resonance Mass — higher mass means a wider, more energetic orbit. A perfect-quality day of habits alone reaches ~100 mass; combined with strong physical activity it can reach 145.
              </Typography>

              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                <strong style={{ color: textP }}>Activity bonuses</strong> add up to +21 pts of Resonance Mass on top of habit scores:
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "Steps", desc: "≥ 10 000 steps → +8 pts · ≥ 7 500 → +5 pts · ≥ 5 000 → +2 pts. Log steps daily in the Sharīram tracker, or via the morning flow." },
                  { label: "Sleep", desc: "≥ 7.5 h → +7 pts · ≥ 7.0 h → +4 pts · ≥ 6.0 h → +1 pt. Sleep is logged in the morning flow (written to yesterday's record)." },
                  { label: "Calories burned", desc: "≥ 500 kcal → +6 pts · ≥ 300 → +3 pts · ≥ 150 → +1 pt. Log in Sharīram tracker → Activity. Set your daily targets under Sharīram → Set Targets." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.5, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
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
                  { label: "Required vs optional", desc: "Each task in the baseline can be toggled 'Required' (must be done) or given a minimum count. Tasks not in the baseline are silently skipped on disruption days." },
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
              <Typography sx={{ fontSize: 13, color: textS, mb: 2, lineHeight: 1.85 }}>
                Trackers handle day-to-day logging and are separate from life area pages. Go to the Trackers section in the sidebar. Each tracker is purpose-built:
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  { label: "Anna", desc: "Food & macros — log meals, track against your vital macro targets, manage your pantry." },
                  { label: "Sharīram", desc: "Body metrics — weight, measurements, daily activity (steps, calories, sleep). Set your activity targets under Sharīram → Set Targets." },
                  { label: "Vidyā", desc: "Learning — Books tab, Courses tab, and Study Log tab. Log study sessions with hours, source (book or course), and notes. Link any book or course to a Lakshya to track contribution toward your vision." },
                  { label: "Nāda", desc: "Music — practice sessions and Courses tab for structured music courses. Link courses to a Lakshya on the Nādam Sankalpa tab." },
                  { label: "Vṛtti", desc: "Career — projects with work-log sessions (hours + Ashtasiddhi quality). Link projects to a Lakshya on the Vṛtti Sankalpa tab." },
                  { label: "Artha", desc: "Finance — transactions, loans, asset tracking." },
                  { label: "Purohitam", desc: "Sacred practice — rituals and observances log." },
                  { label: "Yatra", desc: "Journeys — travel and pilgrimage records." },
                ].map(({ label, desc }) => (
                  <Box key={label} sx={{ mb: 1.25, pl: 2, borderLeft: `2px solid ${heroColor}40` }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: textS, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Section: JSON Formats */}
              <SectionLabel>JSON upload formats</SectionLabel>
              <Typography sx={{ fontSize: 12, color: textS, mb: 2, lineHeight: 1.75 }}>
                Some trackers accept JSON uploads to sync your data. Use these formats exactly.
              </Typography>

              {/* Anna Tracker — Vital Macros */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: textP, mb: 0.75 }}>
                🥗 Anna Tracker — Vital Macros (Calibrate tab → JSON update)
              </Typography>
              <Box
                sx={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "#F4F3EC",
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                  p: 2,
                  mb: 1.5,
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: textS,
                  overflowX: "auto",
                  whiteSpace: "pre",
                  lineHeight: 1.7,
                }}
              >{`{
  "calories": 1750,
  "protein": 120,
  "carbs": 180,
  "fats": 55,
  "fiber": 35,
  "magnesium": 400,
  "water": 3000,
  "fasting_window": "16:8"
}`}</Box>
              <Typography sx={{ fontSize: 11, color: textS, mb: 2.5, lineHeight: 1.7 }}>
                All values are numbers. <strong style={{ color: textP }}>water</strong> is in ml, <strong style={{ color: textP }}>magnesium</strong> in mg, all others in g or kcal. <strong style={{ color: textP }}>fasting_window</strong> is a string like <code style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#EEE", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>"16:8"</code>.
              </Typography>

              {/* Anna Tracker — Pantry List */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: textP, mb: 0.75 }}>
                🥗 Anna Tracker — Pantry List (bulk import)
              </Typography>
              <Box
                sx={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "#F4F3EC",
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                  p: 2,
                  mb: 1.5,
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: textS,
                  overflowX: "auto",
                  whiteSpace: "pre",
                  lineHeight: 1.7,
                }}
              >{`[
  { "name": "Brown Rice",    "quantity": "2",   "unit": "kg", "category": "Grains"    },
  { "name": "Spinach",       "quantity": "500", "unit": "g",  "category": "Vegetables"},
  { "name": "Almonds",       "quantity": "250", "unit": "g",  "category": "Proteins"  },
  { "name": "Turmeric",      "quantity": "100", "unit": "g",  "category": "Spices & Herbs" },
  { "name": "Coconut Oil",   "quantity": "1",   "unit": "L",  "category": "Oils & Fats"   }
]`}</Box>
              <Typography sx={{ fontSize: 11, color: textS, mb: 2.5, lineHeight: 1.7 }}>
                Must be an array. <strong style={{ color: textP }}>name</strong> is required. Valid categories: Grains, Vegetables, Fruits, Proteins, Dairy, Oils &amp; Fats, Spices &amp; Herbs, Beverages, Snacks, Other. Imports are additive — existing items are preserved.
              </Typography>

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
  "date": "2026-05-01",
  "metrics": {
    "weight": 82.5,
    "muscle_mass": 64.2,
    "visceral_fat": 9,
    "fat_pct": 22.1,
    "bmi": 24.8,
    "body_age": 32,
    "waist": 34,
    "belly": 36,
    "neck": 15,
    "bust": 40,
    "hip": 38,
    "thigh": 22,
    "calf": 14
  }
}`}</Box>

              {/* Artha Tracker format */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: textP, mb: 0.75 }}>
                💰 Artha Tracker — Finance log (transactions)
              </Typography>
              <Box
                sx={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "#F4F3EC",
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                  p: 2,
                  mb: 1.5,
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: textS,
                  overflowX: "auto",
                  whiteSpace: "pre",
                  lineHeight: 1.7,
                }}
              >{`[
  {
    "amount": 5000,
    "description": "Salary",
    "category": "Salary",
    "type": "needed",
    "is_income": true,
    "date": "2026-05-01"
  },
  {
    "amount": 800,
    "description": "Groceries — Big Basket",
    "category": "Groceries",
    "type": "needed",
    "is_income": false,
    "date": "2026-05-02"
  }
]`}</Box>
              <Typography sx={{ fontSize: 11, color: textS, mb: 2.5, lineHeight: 1.7 }}>
                <strong style={{ color: textP }}>type</strong> must be <code style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#EEE", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>"needed"</code>, <code style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#EEE", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>"wanted"</code>, or <code style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#EEE", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>"investment"</code>.
                {" "}<strong style={{ color: textP }}>is_income</strong> = true for income, false for expense.
              </Typography>

              <Typography sx={{ fontSize: 12, fontWeight: 700, color: textP, mb: 0.75 }}>
                💰 Artha Tracker — Loans
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
    "label": "Home Loan — SBI",
    "principal": 3000000,
    "current_balance": 2650000,
    "rate": 8.5,
    "emi": 27500,
    "start_date": "2022-06-01",
    "target_close_date": "2037-06-01"
  }
]`}</Box>

              {/* Section: Data export */}
              <SectionLabel>Exporting your data</SectionLabel>
              <Typography sx={{ fontSize: 13, color: textS, mb: 3, lineHeight: 1.85 }}>
                Go to Settings → Security → "Export Svaadhyaya data". You'll receive a full JSON file containing all your days, logs, books, Lakshyas, milestones, and tracker activity. This is your backup — keep it safe.
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
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
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
