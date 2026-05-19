import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  keyframes,
  Divider,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  CloudUpload,
  Opacity,
  AccessTime,
  Bolt,
  FitnessCenter,
  Grass,
  LocalFlorist,
  MonitorWeight,
  Spa,
  Save,
  Add,
  Delete,
  Restaurant,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";

const COLOR = "#5A6E1A";

const FASTING_OPTIONS = ["12:12", "14:10", "16:8", "18:6", "20:4", "OMAD", "Custom"];

const DEFAULT_MACROS = {
  calories: 1750,
  protein: 120,
  carbs: 180,
  fats: 55,
  fiber: 35,
  magnesium: 400,
  water: 3000,
};

const MEAL_SLOTS = [
  { id: "breakfast",   label: "Breakfast",   emoji: "🌅", defaultTime: "08:00" },
  { id: "mid_morning", label: "Mid Morning",  emoji: "☕", defaultTime: "10:30" },
  { id: "lunch",       label: "Lunch",        emoji: "🌿", defaultTime: "13:00" },
  { id: "snack",       label: "Snack",        emoji: "🍎", defaultTime: "16:00" },
  { id: "dinner",      label: "Dinner",       emoji: "🌙", defaultTime: "19:30" },
];

const PANTRY_CATEGORIES = [
  "Grains", "Vegetables", "Fruits", "Proteins", "Dairy",
  "Oils & Fats", "Spices & Herbs", "Beverages", "Snacks", "Other",
];

const EMPTY_MEAL = { time: "", items: "", quantity: "" };
const EMPTY_MEAL_LOGS = Object.fromEntries(MEAL_SLOTS.map((s) => [s.id, { ...EMPTY_MEAL }]));
const REFLECTION_PER_PAGE = 6;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to   { opacity: 1; transform: translateY(0); }
`;

function TabPanel({ value, index, children }) {
  return value === index ? (
    <Box sx={{ pt: 3, animation: `${fadeInUp} 0.5s ease-out` }}>{children}</Box>
  ) : null;
}

const MacroRing = ({ value, max, label, color, icon, unit }) => {
  const percentage = Math.min((value / max) * 100, 100) || 0;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box sx={{ position: "relative", display: "inline-flex", mb: 1 }}>
        <CircularProgress variant="determinate" value={100} sx={{ color: `${color}20` }} size={80} thickness={4} />
        <CircularProgress
          variant="determinate"
          value={percentage}
          sx={{ color: color, position: "absolute", left: 0, strokeLinecap: "round" }}
          size={80}
          thickness={4}
        />
        <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 18, fontFamily: '"Fraunces",serif', fontWeight: 600, color: color }}>
        {value} <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>{unit}</span>
      </Typography>
      <Typography sx={{ fontSize: 11, color: "text.secondary", textTransform: "uppercase", letterSpacing: 1, mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
};

export default function DietPage() {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const safeColor = isDark ? "#9AC833" : COLOR;

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Meal log
  const [mealLogs, setMealLogs] = useState(EMPTY_MEAL_LOGS);
  const mealSaveTimer = useRef(null);

  // Reflection
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [reflectionHistory, setReflectionHistory] = useState([]);
  const [reflectionPage, setReflectionPage] = useState(1);
  const notesTimerRef = useRef(null);

  // Macros
  const [macros, setMacros] = useState(DEFAULT_MACROS);
  const [editingMacros, setEditingMacros] = useState(false);
  const [fastingWindow, setFastingWindow] = useState("12:12");

  // Pantry
  const [pantryItems, setPantryItems] = useState([]);
  const [addPantryOpen, setAddPantryOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", unit: "", category: "Grains" });
  const [pantryJsonInput, setPantryJsonInput] = useState("");
  const [pantryJsonError, setPantryJsonError] = useState("");
  const [showPantryJson, setShowPantryJson] = useState(false);

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const todayDate = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  // Theme
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(90, 110, 26, 0.15)";
  const cardBg = isDark ? "rgba(26, 25, 22, 0.8)" : "rgba(252, 251, 249, 0.8)";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#9C9A94" : "#6E6D6A";
  const fieldSx = {
    "& .MuiInputLabel-root": { color: textS },
    "& .MuiInputLabel-root.Mui-focused": { color: safeColor },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(90,110,26,0.3)",
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: `${COLOR}80` },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: COLOR },
    "& .MuiInputBase-input": { color: textP },
    "& .MuiSelect-select": { color: textP },
  };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: dayData }, { data: settingsData }, { data: historyData }] = await Promise.all([
        supabase
          .from("days")
          .select("habits, journal")
          .eq("user_id", user.id)
          .eq("day_date", todayDate)
          .maybeSingle(),
        supabase
          .from("days")
          .select("habits")
          .eq("user_id", user.id)
          .eq("day_date", "2000-01-01")
          .maybeSingle(),
        supabase
          .from("days")
          .select("day_date, journal")
          .eq("user_id", user.id)
          .not("journal", "is", null)
          .neq("journal", "")
          .neq("day_date", "2000-01-01")
          .order("day_date", { ascending: false })
          .limit(200),
      ]);

      if (dayData) {
        if (dayData.habits?.meal_logs)
          setMealLogs({ ...EMPTY_MEAL_LOGS, ...dayData.habits.meal_logs });
        setNotes(dayData.journal || "");
      }
      if (settingsData?.habits?.macros) setMacros(settingsData.habits.macros);
      if (settingsData?.habits?.fasting_window) setFastingWindow(settingsData.habits.fasting_window);
      if (settingsData?.habits?.pantry_items) setPantryItems(settingsData.habits.pantry_items);
      setReflectionHistory(historyData || []);
    } finally {
      setLoading(false);
    }
  }, [user, todayDate]);

  useEffect(() => { load(); }, [load]);

  const saveMealLogs = useCallback(async (logs) => {
    const { data: existing } = await supabase
      .from("days").select("habits").eq("user_id", user.id).eq("day_date", todayDate).maybeSingle();
    const merged = { ...(existing?.habits || {}), meal_logs: logs };
    await supabase.from("days").upsert(
      { user_id: user.id, day_date: todayDate, habits: merged },
      { onConflict: "user_id,day_date" },
    );
  }, [user, todayDate]);

  const handleMealChange = (slotId, field, value) => {
    const updated = { ...mealLogs, [slotId]: { ...mealLogs[slotId], [field]: value } };
    setMealLogs(updated);
    clearTimeout(mealSaveTimer.current);
    mealSaveTimer.current = setTimeout(() => saveMealLogs(updated), 1000);
  };

  const handleSaveNotes = async (silent = false) => {
    setSavingNotes(true);
    const { error } = await supabase
      .from("days")
      .upsert({ user_id: user.id, day_date: todayDate, journal: notes }, { onConflict: "user_id,day_date" });
    setSavingNotes(false);
    if (error) { showSnack("Failed to save notes.", "error"); return; }
    if (!silent) showSnack("Reflections saved.");
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    setNotesSaved(false);
    clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => handleSaveNotes(true), 1500);
  };

  const handleMacroSave = async () => {
    setEditingMacros(false);
    const { data: existing } = await supabase
      .from("days").select("habits").eq("user_id", user.id).eq("day_date", "2000-01-01").maybeSingle();
    const merged = { ...(existing?.habits || {}), macros, fasting_window: fastingWindow };
    const { error } = await supabase.from("days").upsert(
      { user_id: user.id, day_date: "2000-01-01", habits: merged },
      { onConflict: "user_id,day_date" },
    );
    if (error) { showSnack("Failed to save targets.", "error"); setEditingMacros(true); return; }
    showSnack("Nutrition targets saved.");
  };

  const handleMacroChange = (key, val) => setMacros((prev) => ({ ...prev, [key]: Number(val) }));

  const savePantry = async (items) => {
    const { data: existing } = await supabase
      .from("days").select("habits").eq("user_id", user.id).eq("day_date", "2000-01-01").maybeSingle();
    const merged = { ...(existing?.habits || {}), pantry_items: items };
    const { error } = await supabase.from("days").upsert(
      { user_id: user.id, day_date: "2000-01-01", habits: merged },
      { onConflict: "user_id,day_date" },
    );
    if (error) { showSnack("Failed to save pantry.", "error"); return false; }
    return true;
  };

  const handleAddPantryItem = async () => {
    if (!newItem.name.trim()) return;
    const updated = [...pantryItems, { ...newItem }];
    if (await savePantry(updated)) {
      setPantryItems(updated);
      setNewItem({ name: "", quantity: "", unit: "", category: "Grains" });
      setAddPantryOpen(false);
      showSnack("Item added to pantry.");
    }
  };

  const handleDeletePantryItem = async (idx) => {
    const updated = pantryItems.filter((_, i) => i !== idx);
    if (await savePantry(updated)) setPantryItems(updated);
  };

  const handlePantryJsonUpload = async () => {
    try {
      const parsed = JSON.parse(pantryJsonInput);
      if (!Array.isArray(parsed)) throw new Error();
      const updated = [...pantryItems, ...parsed];
      if (await savePantry(updated)) {
        setPantryItems(updated);
        setPantryJsonInput("");
        setPantryJsonError("");
        setShowPantryJson(false);
        showSnack(`${parsed.length} items imported.`);
      }
    } catch {
      setPantryJsonError("Invalid JSON. Must be an array of {name, quantity, unit, category}.");
    }
  };

  const pantryByCategory = useMemo(() => {
    const groups = {};
    pantryItems.forEach((item) => {
      const cat = item.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [pantryItems]);

  const filledMeals = MEAL_SLOTS.filter((s) => mealLogs[s.id]?.items?.trim()).length;

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: safeColor }} />
      </Box>
    );

  return (
    <Box sx={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* Glow */}
      <Box sx={{ position: "absolute", top: -150, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: `radial-gradient(ellipse at center, ${COLOR}25 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 900, mx: "auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4, animation: `${fadeInUp} 0.6s ease-out` }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Spa sx={{ color: safeColor, fontSize: 18 }} />
              <Typography variant="caption" sx={{ letterSpacing: 2, textTransform: "uppercase", fontSize: 11, color: safeColor, fontWeight: 700 }}>
                Anna & Arogya
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 400, fontSize: { xs: 32, md: 40 }, color: textP, lineHeight: 1.1 }}>
              Diet Tracker
            </Typography>
            <Typography sx={{ fontSize: 14, color: textS, mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <MonitorWeight sx={{ fontSize: 16 }} />
              {filledMeals} of 5 meals logged today
              <span style={{ opacity: 0.5 }}>|</span>
              {fastingWindow} fasting
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${border}`, mb: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": { fontSize: 13, fontWeight: 600, textTransform: "none", minHeight: 48, minWidth: 0, px: 2.5, color: textS },
              "& .Mui-selected": { color: `${safeColor} !important` },
              "& .MuiTabs-indicator": { background: COLOR, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
            }}
          >
            <Tab label="Today's Journey" />
            <Tab label="Vital Macros" />
            <Tab label="Pantry List" />
          </Tabs>
        </Box>

        {/* ── TAB 0: TODAY'S JOURNEY ── */}
        <TabPanel value={tab} index={0}>
          {/* Meal logger */}
          <Card sx={{ border: `1px solid ${border}`, borderRadius: 4, background: cardBg, backdropFilter: "blur(10px)", boxShadow: "none", mb: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: textP, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <Restaurant sx={{ color: safeColor, fontSize: 18 }} />
                Meal Log
                <Chip
                  label={`${filledMeals}/5`}
                  size="small"
                  sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${COLOR}15`, color: safeColor, ml: 0.5 }}
                />
              </Typography>

              {MEAL_SLOTS.map((slot, idx) => {
                const log = mealLogs[slot.id] || EMPTY_MEAL;
                const filled = !!log.items?.trim();
                return (
                  <Box key={slot.id}>
                    {idx > 0 && <Divider sx={{ my: 2.5, borderColor: border }} />}
                    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                      {/* Timeline node */}
                      <Box sx={{ minWidth: 36, display: "flex", flexDirection: "column", alignItems: "center", pt: 0.25 }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: "50%",
                          border: `2px solid ${filled ? COLOR : border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, transition: "all 0.2s",
                          background: filled ? `${COLOR}15` : "transparent",
                        }}>
                          {slot.emoji}
                        </Box>
                        {idx < MEAL_SLOTS.length - 1 && (
                          <Box sx={{ width: 2, flex: 1, minHeight: 28, background: filled ? `${COLOR}30` : border, mt: 0.5 }} />
                        )}
                      </Box>

                      {/* Fields */}
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: filled ? textP : textS, mb: 1.5, letterSpacing: 0.3 }}>
                          {slot.label}
                        </Typography>
                        <Grid container spacing={1.5}>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              size="small"
                              label="Time"
                              type="time"
                              value={log.time || ""}
                              onChange={(e) => handleMealChange(slot.id, "time", e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ ...fieldSx, width: "100%" }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              size="small"
                              label="What did you eat?"
                              value={log.items || ""}
                              onChange={(e) => handleMealChange(slot.id, "items", e.target.value)}
                              sx={{ ...fieldSx, width: "100%" }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              size="small"
                              label="Quantity"
                              placeholder="e.g. 1 bowl"
                              value={log.quantity || ""}
                              onChange={(e) => handleMealChange(slot.id, "quantity", e.target.value)}
                              sx={{ ...fieldSx, width: "100%" }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>

          {/* Daily Reflections write box */}
          <Card sx={{ border: `1px solid ${border}`, borderRadius: 4, background: cardBg, boxShadow: "none", mb: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: textP, display: "flex", alignItems: "center", gap: 1 }}>
                  <LocalFlorist sx={{ color: safeColor, fontSize: 18 }} />
                  Daily Reflections
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {notesSaved && <Typography sx={{ fontSize: 11, color: safeColor, opacity: 0.8 }}>✓ Saved</Typography>}
                  {savingNotes && <CircularProgress size={12} sx={{ color: safeColor }} />}
                  <Button
                    size="small"
                    onClick={() => handleSaveNotes(false)}
                    disabled={savingNotes}
                    startIcon={<Save sx={{ fontSize: "14px !important" }} />}
                    sx={{ color: safeColor, textTransform: "none", fontWeight: 600, fontSize: 12 }}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="How is your body feeling today? Any cravings or high energy moments?"
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 14,
                    color: textP,
                    background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
                    "& fieldset": { borderColor: border },
                    "&:hover fieldset": { borderColor: `${COLOR}50` },
                    "&.Mui-focused fieldset": { borderColor: COLOR },
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Past Reflections – 2-col paginated grid */}
          {reflectionHistory.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
                <AccessTime sx={{ color: safeColor, fontSize: 16 }} />
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: textP }}>
                  Past Reflections
                </Typography>
                <Chip
                  label={reflectionHistory.length}
                  size="small"
                  sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${COLOR}15`, color: safeColor }}
                />
              </Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {reflectionHistory
                  .slice((reflectionPage - 1) * REFLECTION_PER_PAGE, reflectionPage * REFLECTION_PER_PAGE)
                  .map((r) => (
                    <Grid item xs={12} sm={6} key={r.day_date}>
                      <Card sx={{ border: `1px solid ${border}`, borderRadius: 3, background: cardBg, boxShadow: "none", height: "100%" }}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: safeColor, textTransform: "uppercase", letterSpacing: 0.8 }}>
                              {dayjs(r.day_date).format("MMM D, YYYY")}
                            </Typography>
                            <Typography sx={{ fontSize: 10, color: textS }}>
                              · {dayjs(r.day_date).format("ddd")}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: 13, color: textP, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                            {r.journal}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
              {reflectionHistory.length > REFLECTION_PER_PAGE && (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Pagination
                    count={Math.ceil(reflectionHistory.length / REFLECTION_PER_PAGE)}
                    page={reflectionPage}
                    onChange={(_, p) => setReflectionPage(p)}
                    size="small"
                    sx={{
                      "& .MuiPaginationItem-root": { color: textS },
                      "& .MuiPaginationItem-root.Mui-selected": { background: `${COLOR}20`, color: safeColor },
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </TabPanel>

        {/* ── TAB 1: VITAL MACROS ── */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Box>
              <Typography sx={{ fontSize: 20, fontFamily: '"Fraunces",serif', color: textP, fontWeight: 400 }}>
                Nutrition Architecture
              </Typography>
              <Typography sx={{ fontSize: 13, color: textS, mt: 0.5 }}>
                Your personal nutrition targets
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              {editingMacros ? (
                <Box>
                  <Typography sx={{ fontSize: 11, color: textS, mb: 0.5, textTransform: "uppercase", letterSpacing: 1 }}>Fasting window</Typography>
                  <select
                    value={fastingWindow}
                    onChange={(e) => setFastingWindow(e.target.value)}
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: textP, border: `1px solid ${border}`, borderRadius: 8, padding: "6px 12px", fontSize: 14, cursor: "pointer" }}
                  >
                    {FASTING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Box>
              ) : (
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: 11, color: textS, textTransform: "uppercase", letterSpacing: 1 }}>Fasting</Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: safeColor }}>{fastingWindow}</Typography>
                </Box>
              )}
              <Button
                variant={editingMacros ? "contained" : "outlined"}
                onClick={() => editingMacros ? handleMacroSave() : setEditingMacros(true)}
                sx={{ borderColor: COLOR, color: editingMacros ? "#fff" : safeColor, background: editingMacros ? COLOR : "transparent", textTransform: "none", borderRadius: 3, fontWeight: 600, px: 3, "&:hover": { background: editingMacros ? "#4a5b14" : `${COLOR}10` } }}
              >
                {editingMacros ? "Lock Architecture" : "Calibrate"}
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Calories */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: "100%", border: `1px solid ${border}`, borderRadius: 4, background: isDark ? `linear-gradient(135deg, ${cardBg}, #111)` : `linear-gradient(135deg, ${cardBg}, #fff)`, boxShadow: "none", display: "flex", flexDirection: "column", justifyContent: "center", p: 3 }}>
                <Typography sx={{ fontSize: 13, color: textS, textTransform: "uppercase", letterSpacing: 1.5, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Bolt sx={{ color: safeColor }} /> Daily Energy
                </Typography>
                {editingMacros ? (
                  <TextField fullWidth type="number" value={macros.calories} onChange={(e) => handleMacroChange("calories", e.target.value)} sx={{ input: { fontSize: 40, fontFamily: '"Fraunces",serif', color: safeColor, textAlign: "center" } }} />
                ) : (
                  <Typography sx={{ fontFamily: '"Fraunces",serif', fontSize: 64, fontWeight: 300, color: safeColor, lineHeight: 1, textAlign: "center" }}>
                    {macros.calories} <span style={{ fontSize: 20, color: textS, fontFamily: "sans-serif" }}>kcal</span>
                  </Typography>
                )}
              </Card>
            </Grid>

            {/* Protein / Carbs / Fats rings */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: "100%", border: `1px solid ${border}`, borderRadius: 4, background: cardBg, boxShadow: "none", p: 3 }}>
                <Grid container spacing={2} justifyContent="space-around" alignItems="center" sx={{ height: "100%" }}>
                  {[
                    { key: "protein", label: "Protein", color: "#D46B4E", max: 200, icon: <FitnessCenter sx={{ color: "#D46B4E" }} />, unit: "g" },
                    { key: "carbs",   label: "Carbs",   color: "#DDA74F", max: 300, icon: <Grass sx={{ color: "#DDA74F" }} />,      unit: "g" },
                    { key: "fats",    label: "Fats",    color: "#6B8A9E", max: 100, icon: <Opacity sx={{ color: "#6B8A9E" }} />,    unit: "g" },
                  ].map((m) => (
                    <Grid item key={m.key}>
                      {editingMacros ? (
                        <TextField label={`${m.label} (g)`} type="number" size="small" value={macros[m.key]} onChange={(e) => handleMacroChange(m.key, e.target.value)} sx={{ width: 80 }} />
                      ) : (
                        <MacroRing value={macros[m.key]} max={m.max} label={m.label} color={m.color} icon={m.icon} unit={m.unit} />
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>

            {/* Fiber / Magnesium / Water */}
            {[
              { key: "fiber",     label: "Fiber",     unit: "g",  icon: <Grass /> },
              { key: "magnesium", label: "Magnesium", unit: "mg", icon: <Spa /> },
              { key: "water",     label: "Hydration", unit: "ml", icon: <Opacity /> },
            ].map((m) => (
              <Grid item xs={12} sm={4} key={m.key}>
                <Card sx={{ border: `1px solid ${border}`, borderRadius: 4, background: cardBg, boxShadow: "none" }}>
                  <CardContent sx={{ p: "20px !important", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: textS, textTransform: "uppercase", letterSpacing: 1, mb: 0.5 }}>
                        {m.label}
                      </Typography>
                      {editingMacros ? (
                        <TextField variant="standard" type="number" value={macros[m.key]} onChange={(e) => handleMacroChange(m.key, e.target.value)} sx={{ input: { fontSize: 24, fontFamily: '"Fraunces",serif', color: textP } }} />
                      ) : (
                        <Typography sx={{ fontFamily: '"Fraunces",serif', fontSize: 24, fontWeight: 400, color: textP }}>
                          {macros[m.key]} <span style={{ fontSize: 13, color: textS, fontFamily: "sans-serif" }}>{m.unit}</span>
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ color: `${COLOR}50` }}>{m.icon}</Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* ── TAB 2: PANTRY LIST ── */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 20, fontFamily: '"Fraunces",serif', color: textP, fontWeight: 400 }}>
                Pantry List
              </Typography>
              <Typography sx={{ fontSize: 13, color: textS, mt: 0.5 }}>
                {pantryItems.length} items stocked
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
                onClick={() => setShowPantryJson((s) => !s)}
                sx={{ borderColor: border, color: textS, textTransform: "none", fontSize: 12, borderRadius: 2 }}
              >
                Import JSON
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={() => setAddPantryOpen(true)}
                sx={{ background: COLOR, color: "#fff", textTransform: "none", fontSize: 12, fontWeight: 600, borderRadius: 2, "&:hover": { background: "#4a5b14" } }}
              >
                Add Item
              </Button>
            </Box>
          </Box>

          {/* JSON import panel */}
          {showPantryJson && (
            <Card sx={{ border: `1px solid ${border}`, borderRadius: 3, background: cardBg, boxShadow: "none", mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: 13, color: textS, mb: 1.5, lineHeight: 1.6 }}>
                  Paste a JSON array. Each item: <code style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", padding: "1px 4px", borderRadius: 3 }}>&#123;"name","quantity","unit","category"&#125;</code>
                </Typography>
                {pantryJsonError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{pantryJsonError}</Alert>}
                <TextField
                  fullWidth multiline rows={6}
                  placeholder={`[\n  {"name": "Brown Rice", "quantity": "2", "unit": "kg", "category": "Grains"},\n  {"name": "Spinach", "quantity": "500", "unit": "g", "category": "Vegetables"}\n]`}
                  value={pantryJsonInput}
                  onChange={(e) => setPantryJsonInput(e.target.value)}
                  sx={{ mb: 2, "& textarea": { fontSize: 13, fontFamily: "'Fira Code', monospace", color: textP }, "& .MuiOutlinedInput-root": { background: isDark ? "rgba(0,0,0,0.3)" : "#fff", borderRadius: 2 } }}
                />
                <Button
                  variant="contained"
                  onClick={handlePantryJsonUpload}
                  disabled={!pantryJsonInput.trim()}
                  sx={{ background: COLOR, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { background: "#4a5b14" }, "&.Mui-disabled": { background: isDark ? "#333" : "#e0e0e0", color: textS } }}
                >
                  Import
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Items by category */}
          {pantryItems.length === 0 ? (
            <Card sx={{ border: `1px solid ${border}`, borderRadius: 4, background: cardBg, boxShadow: "none" }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: 32, mb: 1 }}>🥬</Typography>
                <Typography sx={{ fontSize: 14, color: textS }}>Your pantry is empty. Add items manually or import via JSON.</Typography>
              </CardContent>
            </Card>
          ) : (
            Object.entries(pantryByCategory).map(([category, items]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: safeColor, textTransform: "uppercase", letterSpacing: 1.2, mb: 1.5 }}>
                  {category}
                </Typography>
                <Card sx={{ border: `1px solid ${border}`, borderRadius: 3, background: cardBg, boxShadow: "none" }}>
                  {items.map((item, localIdx) => {
                    const globalIdx = pantryItems.findIndex((p) => p === item);
                    return (
                      <Box
                        key={localIdx}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          px: 2.5,
                          py: 1.75,
                          borderBottom: localIdx < items.length - 1 ? `1px solid ${border}` : "none",
                          "&:hover": { background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" },
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 14, color: textP, fontWeight: 500 }}>{item.name}</Typography>
                          {(item.quantity || item.unit) && (
                            <Typography sx={{ fontSize: 12, color: textS, mt: 0.25 }}>
                              {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePantryItem(globalIdx)}
                          sx={{ color: textS, opacity: 0.5, "&:hover": { opacity: 1, color: "#CF4E4E" } }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Card>
              </Box>
            ))
          )}
        </TabPanel>
      </Box>

      {/* Add Pantry Item Dialog */}
      <Dialog
        open={addPantryOpen}
        onClose={() => setAddPantryOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, background: isDark ? "#1A1915" : "#FFFDF9", maxWidth: 420, width: "100%" } }}
      >
        <DialogTitle sx={{ fontSize: 18, fontFamily: '"Fraunces",serif', color: textP, pb: 1 }}>Add Pantry Item</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}>
            <TextField
              label="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
              autoFocus
              sx={fieldSx}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Quantity"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
                  sx={{ ...fieldSx, width: "100%" }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Unit"
                  placeholder="kg, g, L, pcs…"
                  value={newItem.unit}
                  onChange={(e) => setNewItem((p) => ({ ...p, unit: e.target.value }))}
                  sx={{ ...fieldSx, width: "100%" }}
                />
              </Grid>
            </Grid>
            <FormControl sx={fieldSx}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newItem.category}
                label="Category"
                onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
              >
                {PANTRY_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAddPantryOpen(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddPantryItem}
            disabled={!newItem.name.trim()}
            sx={{ background: COLOR, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { background: "#4a5b14" } }}
          >
            Add to Pantry
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
