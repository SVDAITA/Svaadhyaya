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
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { SectionLabel } from "../../components/shared/AreaComponents";
import ThemeSettingsPanel from "../../components/shared/ThemeSettingsPanel";
import dayjs from "dayjs";
import { getAreaSubtitle, saveAreaSubtitles, AREA_SUBTITLE_DEFAULTS } from "../../hooks/useAreaSubtitles";
import { getVisibility, saveVisibility } from "../../hooks/useVisibility";

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
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
    }
    if (profile?.mantra) setMantra(profile.mantra);
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
      setCurrentPw("");
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

              {/* Account info */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: isDark ? "rgba(255,255,255,0.03)" : "#FAF9F6",
                  border: `1px solid ${border}`,
                  mb: 3,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    color: textS,
                    mb: 0.25,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Account email
                </Typography>
                <Typography
                  sx={{ fontSize: 13, color: textP, fontWeight: 500 }}
                >
                  {user?.email}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: isDark ? "rgba(255,255,255,0.03)" : "#FAF9F6",
                  border: `1px solid ${border}`,
                  mb: 3,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    color: textS,
                    mb: 0.25,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Location
                </Typography>
                <Typography
                  sx={{ fontSize: 13, color: textP, fontWeight: 500 }}
                >
                  Hyderabad, India
                </Typography>
                <Typography sx={{ fontSize: 10, color: textS, mt: 0.25 }}>
                  Used for Panchangam calculations
                </Typography>
              </Box>

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
    </Box>
  );
}
