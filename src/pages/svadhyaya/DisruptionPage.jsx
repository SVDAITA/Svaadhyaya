import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControl,
  Switch,
  Snackbar,
  IconButton,
} from "@mui/material";
import {
  Waves,
  BeachAccess,
  CheckCircleOutline,
  Tune,
  Info,
  Close,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

// ── SYSTEM TASK DEFINITIONS ────────────────────────────────────────────────────
// These are the permanent sacred task IDs and their display metadata.
// IDs match the locked task ids in TodayPage DEFAULT_SACRED/EVENING.
// User data (required flag, minimum text) lives in Supabase — not here.
const SYSTEM_SACRED_TASKS = [
  { id: "anushthanam",   label: "Anushthanam",          emoji: "🪔" },
  { id: "riyaz",         label: "Naada Saadhana",        emoji: "🎵" },
  { id: "walk",          label: "Vyaayamam",             emoji: "🏃" },
  { id: "reading",       label: "Pustaka Pathanam",      emoji: "📖" },
  { id: "eat_healthy",   label: "Eat healthy (80% full)", emoji: "🥗" },
  { id: "sleep_healthy", label: "Sleep healthy",          emoji: "🌙" },
];

// Default baselines — only used when user has never saved their own.
// Sensible starting point: first 3 required on holiday, first 1 on vacation.
// All minimum texts start empty — user defines their own.
const buildDefaultBaselines = () => ({
  holiday:  SYSTEM_SACRED_TASKS.slice(0, 3).map((t) => ({ id: t.id, required: true,  minimum: "" })),
  vacation: SYSTEM_SACRED_TASKS.slice(0, 1).map((t) => ({ id: t.id, required: true,  minimum: "" })),
});

// ── DISRUPTION REASON OPTIONS ──────────────────────────────────────────────────
const DISRUPTION_REASONS = [
  { id: "wedding",  icon: "💒", label: "Wedding / celebration" },
  { id: "travel",   icon: "✈️", label: "Travel" },
  { id: "illness",  icon: "🤒", label: "Illness" },
  { id: "family",   icon: "👨‍👩‍👧",  label: "Family emergency" },
  { id: "work",     icon: "💼", label: "Work crisis" },
  { id: "festival", icon: "🎊", label: "Festival / occasion" },
  { id: "guests",   icon: "🏠", label: "Guests at home" },
  { id: "power",    icon: "⚡", label: "Power / connectivity" },
  { id: "other",    icon: "🌊", label: "Other" },
];

// ── VACATION TYPE OPTIONS ──────────────────────────────────────────────────────
const VAC_TYPES = [
  { id: "family_vac",      icon: "🏖",  label: "Family vacation" },
  { id: "pilgrimage",      icon: "🙏",  label: "Pilgrimage / temple trip" },
  { id: "extended_family", icon: "👨‍👩‍👧‍👦", label: "Extended family visit" },
  { id: "music_event",     icon: "🎵",  label: "Music event / concert" },
  { id: "work_travel",     icon: "💼",  label: "Work travel" },
  { id: "medical",         icon: "🏥",  label: "Medical / recovery" },
  { id: "wedding_trip",    icon: "💒",  label: "Wedding / celebration trip" },
  { id: "festival_break",  icon: "🎊",  label: "Festival break" },
  { id: "custom",          icon: "✏️",  label: "Custom" },
];

// ── VACATION MODES ─────────────────────────────────────────────────────────────
// Descriptions use no hardcoded task names — refer to user's saved baselines.
const VAC_MODES = [
  {
    id: "full",
    label: "Full pause",
    desc: "All habits suspended · streaks frozen · goals paused",
  },
  {
    id: "sacred",
    label: "Sacred only",
    desc: "Only your required baselines active · everything else paused",
    recommended: true,
  },
  {
    id: "flexible",
    label: "Flexible",
    desc: "All habits optional · no penalties · full trust",
  },
];

// ── SETTINGS ROW KEY ──────────────────────────────────────────────────────────
const SETTINGS_DATE = "2000-01-01";

// ── BASELINE EDITOR (sub-component) ───────────────────────────────────────────
function BaselineEditor({ mode, baselines, onChange, heroColor, isDark, textP, textS, border }) {
  const entries = baselines[mode] || [];

  const getEntry = (id) =>
    entries.find((e) => e.id === id) || { id, required: false, minimum: "" };

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
              mb: 1.25,
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${entry.required ? `${heroColor}40` : border}`,
              background: entry.required
                ? `${heroColor}06`
                : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
              transition: "all 0.15s",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography sx={{ fontSize: 18, flexShrink: 0 }}>{task.emoji}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: textP, flex: 1 }}>
                {task.label}
              </Typography>
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
                fullWidth
                size="small"
                variant="standard"
                placeholder={`Minimum version of ${task.label}…`}
                value={entry.minimum}
                onChange={(e) => update(task.id, { minimum: e.target.value })}
                sx={{
                  mt: 1,
                  pl: 4,
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

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function DisruptionPage() {
  const { user } = useAuth();
  const { heroColor, mode } = useThemeMode();
  const isDark = mode === "dark";

  // ── Tab state
  const [tab, setTab] = useState("disrupt");

  // ── Disrupted-day state
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");

  // ── Vacation state
  const [vacType, setVacType] = useState("");
  const [vacMode, setVacMode] = useState("sacred");
  const [vacFrom, setVacFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [vacTo, setVacTo] = useState(dayjs().add(4, "day").format("YYYY-MM-DD"));

  // ── Baselines state (user-defined, loaded from Supabase)
  const [baselines, setBaselines] = useState(buildDefaultBaselines());
  const [baselinesLoading, setBaselinesLoading] = useState(true);
  const [baselinesSaving, setBaselinesSaving] = useState(false);

  // ── Shared UI state
  const [error, setError] = useState("");
  const [snack, setSnack] = useState("");

  // ── Theme tokens
  const bg = isDark
    ? `radial-gradient(ellipse 90% 35% at 50% -5%, ${heroColor}08 0%, #0D0C0A 65%)`
    : `radial-gradient(ellipse 90% 35% at 50% -5%, ${heroColor}10 0%, #F8FAFC 65%)`;
  const cardBg   = isDark ? "#1A1916" : "#FFFFFF";
  const border   = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const textP    = isDark ? "#F0EDE8" : "#0f172a";
  const textS    = isDark ? "#9C9A94" : "#64748b";
  const unselBorder = isDark ? "rgba(255,255,255,0.10)" : "#E2E8F0";

  // ── Load baselines from settings row
  const loadBaselines = useCallback(async () => {
    if (!user) { setBaselinesLoading(false); return; }
    setBaselinesLoading(true);
    const { data } = await supabase
      .from("days")
      .select("disruption_baselines")
      .eq("user_id", user.id)
      .eq("day_date", SETTINGS_DATE)
      .maybeSingle();
    if (data?.disruption_baselines) {
      setBaselines(data.disruption_baselines);
    }
    setBaselinesLoading(false);
  }, [user]);

  useEffect(() => { loadBaselines(); }, [loadBaselines]);

  // ── Save baselines to settings row
  const saveBaselines = async () => {
    if (!user) return;
    setBaselinesSaving(true);
    const { error } = await supabase
      .from("days")
      .upsert(
        { user_id: user.id, day_date: SETTINGS_DATE, disruption_baselines: baselines },
        { onConflict: "user_id,day_date" },
      );
    setBaselinesSaving(false);
    setSnack(error ? "Failed to save baselines" : "Baselines saved");
  };

  // ── Required tasks for current disruption mode (derived from baselines)
  const requiredOnHoliday  = (baselines.holiday  || []).filter((e) => e.required);
  const requiredOnVacation = (baselines.vacation  || []).filter((e) => e.required);

  const getTaskMeta = (id) => SYSTEM_SACRED_TASKS.find((t) => t.id === id);

  // ── Mark today as disrupted
  const markDisrupted = async () => {
    if (!reason) { setError("Please select a reason."); return; }
    setError("");
    setLoading(true);
    try {
      await supabase.from("days").upsert(
        {
          user_id: user.id,
          day_date: dayjs().format("YYYY-MM-DD"),
          disrupted: true,
          disruption_mode: "holiday",
          disruption_reason: reason,
          disruption_note: note || null,
        },
        { onConflict: "user_id,day_date" },
      );
      setDoneMsg("Your streak is preserved. Sacred baselines activated. Come back when you can.");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Save vacation
  const saveVacation = async () => {
    if (!vacType) { setError("Please select a vacation type."); return; }
    setError("");
    setLoading(true);
    try {
      await supabase.from("vacations").insert({
        user_id: user.id,
        type: vacType,
        mode: vacMode,
        from_date: vacFrom,
        to_date: vacTo,
      });
      setDoneMsg("Vacation marked. Your streaks are frozen and will resume when you return.");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Done state
  if (done)
    return (
      <Box
        sx={{
          p: { xs: 2, md: "28px 36px" },
          maxWidth: 600,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 10,
          textAlign: "center",
          minHeight: "100vh",
          background: bg,
        }}
      >
        <CheckCircleOutline sx={{ fontSize: 52, color: "#2D7A4F", mb: 2 }} />
        <Typography
          sx={{ fontFamily: '"Fraunces",serif', fontWeight: 300, fontSize: 28, color: textP, mb: 1 }}
        >
          Noted.
        </Typography>
        <Typography sx={{ color: textS, mb: 4, lineHeight: 1.8, maxWidth: 380 }}>
          {doneMsg}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => { setDone(false); setReason(""); setNote(""); }}
          sx={{ borderColor: heroColor, color: heroColor, textTransform: "none", px: 3 }}
        >
          Mark another
        </Button>
      </Box>
    );

  // ── Tab config
  const TABS = [
    { id: "disrupt",  icon: <Waves sx={{ fontSize: 15 }} />,       label: "Today is disrupted" },
    { id: "vacation", icon: <BeachAccess sx={{ fontSize: 15 }} />,  label: "Vacation / time off" },
    { id: "baselines",icon: <Tune sx={{ fontSize: 15 }} />,         label: "Set baselines" },
  ];

  return (
    <Box
      sx={{
        p: { xs: 2, md: "28px 36px" },
        maxWidth: 680,
        mx: "auto",
        minHeight: "100vh",
        background: bg,
      }}
    >
      {/* ── Page Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          sx={{ letterSpacing: 2, textTransform: "uppercase", fontSize: 10, color: heroColor, fontWeight: 600 }}
        >
          Life management
        </Typography>
        <Typography
          sx={{ fontFamily: '"Fraunces",serif', fontWeight: 300, fontSize: 30, color: textP, lineHeight: 1.2, mt: 0.25 }}
        >
          Life happened
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 14, color: textS, lineHeight: 1.7 }}>
          Mark today honestly. Your streak and goals adjust. You are always in control.
        </Typography>
      </Box>

      {/* ── Tabs ── */}
      <Box sx={{ display: "flex", gap: 0.75, mb: 2.5, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <Chip
            key={t.id}
            icon={t.icon}
            label={t.label}
            onClick={() => { setTab(t.id); setError(""); }}
            clickable
            sx={{
              fontWeight: tab === t.id ? 700 : 400,
              border: `1.5px solid ${tab === t.id ? heroColor : border}`,
              background: tab === t.id ? `${heroColor}15` : "transparent",
              color: tab === t.id ? heroColor : textS,
              "& .MuiChip-icon": { color: tab === t.id ? heroColor : textS },
            }}
          />
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ════════════════════════════════════════════════════
          TAB 1 — DISRUPTED DAY
      ════════════════════════════════════════════════════ */}
      {tab === "disrupt" && (
        <Card sx={{ border: `1px solid ${border}`, borderRadius: 3, background: cardBg, boxShadow: "none" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>

            {/* Reason grid */}
            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", letterSpacing: 1.5, fontSize: 10, color: textS, fontWeight: 700, display: "block", mb: 1.5 }}
            >
              What happened today?
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2.5 }}>
              {DISRUPTION_REASONS.map((r) => (
                <Grid item xs={6} sm={4} key={r.id}>
                  <Box
                    onClick={() => setReason(r.id)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      cursor: "pointer",
                      textAlign: "center",
                      border: `1.5px solid ${reason === r.id ? heroColor : unselBorder}`,
                      background: reason === r.id
                        ? `${heroColor}12`
                        : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                      transition: "all 0.15s",
                      "&:hover": { borderColor: `${heroColor}60`, background: `${heroColor}08` },
                    }}
                  >
                    <Typography sx={{ fontSize: 20, mb: 0.5 }}>{r.icon}</Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontSize: 11, color: reason === r.id ? heroColor : textS, fontWeight: reason === r.id ? 600 : 400 }}
                    >
                      {r.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <TextField
              fullWidth
              size="small"
              label="Optional note"
              placeholder="A few words about today…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{ mb: 2.5 }}
            />

            <Divider sx={{ borderColor: border, mb: 2 }} />

            {/* User-defined baselines — dynamic, not hardcoded */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{ textTransform: "uppercase", letterSpacing: 1.5, fontSize: 10, color: textS, fontWeight: 700 }}
              >
                Your sacred baselines — minimum active
              </Typography>
              <Typography
                onClick={() => setTab("baselines")}
                sx={{ fontSize: 10, color: heroColor, cursor: "pointer", fontWeight: 600, "&:hover": { opacity: 0.75 } }}
              >
                Edit →
              </Typography>
            </Box>

            {requiredOnHoliday.length === 0 ? (
              <Box
                sx={{ p: 2, borderRadius: 2, border: `1px dashed ${border}`, textAlign: "center" }}
              >
                <Typography sx={{ fontSize: 12, color: textS, fontStyle: "italic" }}>
                  No baselines set. Tap "Set baselines" to define your minimums.
                </Typography>
                <Button size="small" onClick={() => setTab("baselines")} sx={{ mt: 1, color: heroColor, fontSize: 11 }}>
                  Set baselines →
                </Button>
              </Box>
            ) : (
              requiredOnHoliday.map((entry) => {
                const meta = getTaskMeta(entry.id);
                if (!meta) return null;
                return (
                  <Box
                    key={entry.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      px: 1.5,
                      py: 0.9,
                      borderRadius: 2,
                      mb: 0.75,
                      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${border}`,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: textS, fontSize: 13 }}>
                      {meta.emoji} {meta.label}
                    </Typography>
                    {entry.minimum ? (
                      <Typography variant="caption" sx={{ color: heroColor, fontWeight: 600, fontSize: 11 }}>
                        {entry.minimum}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: textS, fontStyle: "italic", fontSize: 10 }}>
                        No minimum set
                      </Typography>
                    )}
                  </Box>
                );
              })
            )}

            <Button
              variant="contained"
              fullWidth
              onClick={markDisrupted}
              disabled={loading}
              sx={{
                mt: 2.5, py: 1.3,
                background: heroColor,
                "&:hover": { background: heroColor, opacity: 0.88 },
                boxShadow: "none", textTransform: "none", fontSize: 13, borderRadius: 2,
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : "Mark day as disrupted · preserve streak"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════
          TAB 2 — VACATION
      ════════════════════════════════════════════════════ */}
      {tab === "vacation" && (
        <Card sx={{ border: `1px solid ${border}`, borderRadius: 3, background: cardBg, boxShadow: "none" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>

            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", letterSpacing: 1.5, fontSize: 10, color: textS, fontWeight: 700, display: "block", mb: 1.5 }}
            >
              Type of time off
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2.5 }}>
              {VAC_TYPES.map((v) => (
                <Grid item xs={6} sm={4} key={v.id}>
                  <Box
                    onClick={() => setVacType(v.id)}
                    sx={{
                      p: 1.25, borderRadius: 2, cursor: "pointer", textAlign: "center",
                      border: `1.5px solid ${vacType === v.id ? heroColor : unselBorder}`,
                      background: vacType === v.id
                        ? `${heroColor}12`
                        : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                      transition: "all 0.15s",
                      "&:hover": { borderColor: `${heroColor}60`, background: `${heroColor}08` },
                    }}
                  >
                    <Typography sx={{ fontSize: 18, mb: 0.25 }}>{v.icon}</Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontSize: 10, color: vacType === v.id ? heroColor : textS, fontWeight: vacType === v.id ? 600 : 400 }}
                    >
                      {v.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
              <TextField
                fullWidth type="date" label="From" value={vacFrom}
                onChange={(e) => setVacFrom(e.target.value)}
                InputLabelProps={{ shrink: true }} size="small"
              />
              <TextField
                fullWidth type="date" label="To" value={vacTo}
                onChange={(e) => setVacTo(e.target.value)}
                InputLabelProps={{ shrink: true }} size="small"
              />
            </Box>

            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", letterSpacing: 1.5, fontSize: 10, color: textS, fontWeight: 700, display: "block", mb: 1.5 }}
            >
              Choose mode
            </Typography>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup value={vacMode} onChange={(e) => setVacMode(e.target.value)}>
                {VAC_MODES.map((m) => (
                  <Box
                    key={m.id}
                    onClick={() => setVacMode(m.id)}
                    sx={{
                      p: 1.5, borderRadius: 2, mb: 0.75, cursor: "pointer",
                      border: `1.5px solid ${vacMode === m.id ? heroColor : unselBorder}`,
                      background: vacMode === m.id
                        ? `${heroColor}10`
                        : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                      transition: "all 0.15s",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Radio
                        value={m.id} size="small"
                        sx={{ p: 0, color: vacMode === m.id ? heroColor : undefined, "&.Mui-checked": { color: heroColor } }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: textP }}>
                            {m.label}
                          </Typography>
                          {m.recommended && (
                            <Chip
                              label="Recommended" size="small"
                              sx={{ fontSize: 9, height: 18, background: `${heroColor}20`, color: heroColor }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: textS }}>{m.desc}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </RadioGroup>
            </FormControl>

            {/* Show the user's vacation baselines if Sacred mode chosen */}
            {vacMode === "sacred" && requiredOnVacation.length > 0 && (
              <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, background: `${heroColor}06`, border: `1px solid ${heroColor}20` }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: heroColor, letterSpacing: 1, textTransform: "uppercase", mb: 1 }}>
                  Your vacation baselines
                </Typography>
                {requiredOnVacation.map((entry) => {
                  const meta = getTaskMeta(entry.id);
                  if (!meta) return null;
                  return (
                    <Box key={entry.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                      <Typography sx={{ fontSize: 12, color: textS }}>
                        {meta.emoji} {meta.label}
                      </Typography>
                      {entry.minimum && (
                        <Typography sx={{ fontSize: 11, color: heroColor, fontWeight: 600 }}>
                          {entry.minimum}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            <Button
              variant="contained" fullWidth onClick={saveVacation} disabled={loading}
              sx={{
                mt: 2.5, py: 1.3,
                background: heroColor, "&:hover": { background: heroColor, opacity: 0.88 },
                boxShadow: "none", textTransform: "none", fontSize: 13, borderRadius: 2,
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : "Save vacation · freeze streaks"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════
          TAB 3 — SET BASELINES (user-defined, no hardcoded minimums)
      ════════════════════════════════════════════════════ */}
      {tab === "baselines" && (
        <Box>
          {/* Info banner */}
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
              Define your minimum versions of each sacred task — what you commit to
              even on hard days. These replace the defaults on your disrupted-day view.
            </Typography>
          </Box>

          {baselinesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={24} sx={{ color: heroColor }} />
            </Box>
          ) : (
            <>
              {/* Disrupted day baselines */}
              <Card sx={{ border: `1px solid ${border}`, borderRadius: 3, background: cardBg, boxShadow: "none", mb: 2 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="caption"
                    sx={{ textTransform: "uppercase", letterSpacing: 1.5, fontSize: 10, color: textS, fontWeight: 700, display: "block", mb: 0.5 }}
                  >
                    🌊 Disrupted day
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: textS, mb: 2, lineHeight: 1.6 }}>
                    Toggle which tasks are still required, and write your minimum version.
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
                </CardContent>
              </Card>

              {/* Vacation baselines */}
              <Card sx={{ border: `1px solid ${border}`, borderRadius: 3, background: cardBg, boxShadow: "none", mb: 2 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="caption"
                    sx={{ textTransform: "uppercase", letterSpacing: 1.5, fontSize: 10, color: textS, fontWeight: 700, display: "block", mb: 0.5 }}
                  >
                    🏖️ Vacation (sacred mode)
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: textS, mb: 2, lineHeight: 1.6 }}>
                    When vacation mode is "Sacred only" — which tasks must still happen?
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
                </CardContent>
              </Card>

              <Button
                variant="contained"
                fullWidth
                onClick={saveBaselines}
                disabled={baselinesSaving}
                sx={{
                  py: 1.3,
                  background: heroColor,
                  "&:hover": { background: heroColor, opacity: 0.88 },
                  boxShadow: "none", textTransform: "none", fontSize: 13, borderRadius: 2,
                }}
              >
                {baselinesSaving ? <CircularProgress size={20} color="inherit" /> : "Save my baselines"}
              </Button>
            </>
          )}
        </Box>
      )}

      {/* ── Snackbar ── */}
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
