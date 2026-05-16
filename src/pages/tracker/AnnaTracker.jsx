import { useState, useEffect, useCallback, useMemo } from "react";
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
  LinearProgress,
  Alert,
  IconButton,
  keyframes,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  CloudUpload,
  Opacity,
  Restaurant,
  AccessTime,
  Bolt,
  FitnessCenter,
  Grass,
  LocalFlorist,
  MonitorWeight,
  Spa,
  Save,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";

const COLOR = "#5A6E1A";

// Default fallback plan
const DEFAULT_PLAN = {
  groceries: [
    "Apples (1kg)",
    "Jowar Flour (1kg)",
    "Cucumber (500g)",
    "Makhana (250g)",
    "Chamomile Tea",
  ],
  monday: [
    {
      id: "m_wake",
      time: "6:30 AM",
      label: "Wake-up detox",
      items: ["Apple cinnamon detox water 500ml"],
      note: "Before Anushthanam",
      calories: 5,
    },
    {
      id: "m_break",
      time: "9:30 AM",
      label: "Breakfast",
      items: ["Ragi malt 250ml OR 2 jowar rotis", "Palakura pappu 1 katori"],
      note: "80% full rule",
      calories: 380,
    },
    {
      id: "m_mid",
      time: "11:00 AM",
      label: "Mid-morning",
      items: ["Makhana chaat 1 bowl"],
      note: "Light only",
      calories: 150,
    },
    {
      id: "m_lunch",
      time: "1:00 PM",
      label: "Lunch",
      items: ["2 jowar rotis", "Dal 1 katori", "Sabzi 1 katori", "Salad"],
      note: "Before work",
      calories: 520,
    },
    {
      id: "m_snack",
      time: "4:00 PM",
      label: "Evening snack",
      items: ["Sprout chaat 1 katori"],
      note: "Keep metabolism active",
      calories: 180,
    },
    {
      id: "m_dinner",
      time: "7:00 PM",
      label: "Dinner",
      items: ["2 multigrain rotis", "Sabzi 1 katori", "Dahi 1 katori"],
      note: "Finish by 9pm",
      calories: 400,
    },
    {
      id: "m_night",
      time: "9:00 PM",
      label: "Night drink",
      items: ["Chamomile tea 1 cup"],
      note: "12:12 fast begins",
      calories: 0,
    },
  ],
};

const DEFAULT_MACROS = {
  calories: 1750,
  protein: 120,
  carbs: 180,
  fats: 55,
  fiber: 35,
  magnesium: 400,
  water: 3000,
};

// --- Animations ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

function TabPanel({ value, index, children }) {
  return value === index ? (
    <Box sx={{ pt: 3, animation: `${fadeInUp} 0.5s ease-out` }}>{children}</Box>
  ) : null;
}

// Custom Macro Progress Ring Component
const MacroRing = ({ value, max, label, color, icon, unit }) => {
  const percentage = Math.min((value / max) * 100, 100) || 0;
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Box sx={{ position: "relative", display: "inline-flex", mb: 1 }}>
        <CircularProgress
          variant="determinate"
          value={100}
          sx={{ color: `${color}20` }}
          size={80}
          thickness={4}
        />
        <CircularProgress
          variant="determinate"
          value={percentage}
          sx={{
            color: color,
            position: "absolute",
            left: 0,
            strokeLinecap: "round",
          }}
          size={80}
          thickness={4}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography
        sx={{
          fontSize: 18,
          fontFamily: '"Fraunces",serif',
          fontWeight: 600,
          color: color,
        }}
      >
        {value}{" "}
        <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>
          {unit}
        </span>
      </Typography>
      <Typography
        sx={{
          fontSize: 11,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: 1,
          mt: 0.5,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default function DietPage() {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const [tab, setTab] = useState(0);
  const [checked, setChecked] = useState({});
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [loading, setLoading] = useState(true);

  const [weeklyPlan, setWeeklyPlan] = useState(DEFAULT_PLAN);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [macros, setMacros] = useState(DEFAULT_MACROS);
  const [editingMacros, setEditingMacros] = useState(false);

  // Memoize dates to prevent unnecessary re-renders and stabilize hooks
  const todayDate = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const dayOfWeek = useMemo(() => dayjs().format("dddd").toLowerCase(), []);

  // Theme Variables - Digital Ashram Vibes
  const patternOpacity = isDark ? "0.03" : "0.04";
  const bg = isDark ? `#0D0C0A` : `#FAF5EE`;

  // Subtle mandala/ashram texture
  const bgTexture = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%235A6E1A' fill-opacity='${patternOpacity}' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`;

  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(90, 110, 26, 0.15)";
  const cardBg = isDark ? "rgba(26, 25, 22, 0.8)" : "rgba(252, 251, 249, 0.8)";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#9C9A94" : "#6E6D6A";

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: dayData } = await supabase
      .from("days")
      .select("habits, journal")
      .eq("user_id", user.id)
      .eq("day_date", todayDate)
      .maybeSingle();

    if (dayData) {
      const dietHabits = {};
      Object.entries(dayData.habits || {}).forEach(([k, v]) => {
        if (k.startsWith("diet_") || k.startsWith("groc_")) dietHabits[k] = v;
      });
      setChecked(dietHabits);
      setNotes(dayData.journal || "");
    }

    const { data: settingsData } = await supabase
      .from("days")
      .select("habits")
      .eq("user_id", user.id)
      .eq("day_date", "2000-01-01")
      .maybeSingle();

    if (settingsData?.habits?.weekly_plan)
      setWeeklyPlan(settingsData.habits.weekly_plan);
    if (settingsData?.habits?.macros) setMacros(settingsData.habits.macros);

    setLoading(false);
  }, [user, todayDate]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCheck = async (prefix, id) => {
    const key = `${prefix}_${id}`;
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);

    const { data: existing } = await supabase
      .from("days")
      .select("habits")
      .eq("user_id", user.id)
      .eq("day_date", todayDate)
      .maybeSingle();

    const merged = { ...(existing?.habits || {}), ...next };
    await supabase
      .from("days")
      .upsert(
        { user_id: user.id, day_date: todayDate, habits: merged },
        { onConflict: "user_id,day_date" },
      );
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await supabase
      .from("days")
      .upsert(
        { user_id: user.id, day_date: todayDate, journal: notes },
        { onConflict: "user_id,day_date" },
      );
    setSavingNotes(false);
  };

  const handleJsonUpload = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.groceries)
        throw new Error("JSON must contain a 'groceries' array.");

      setWeeklyPlan(parsed);
      setJsonError("");
      setJsonInput("");
      setTab(0);

      const { data: existing } = await supabase
        .from("days")
        .select("habits")
        .eq("user_id", user.id)
        .eq("day_date", "2000-01-01")
        .maybeSingle();

      const merged = { ...(existing?.habits || {}), weekly_plan: parsed };
      await supabase
        .from("days")
        .upsert(
          { user_id: user.id, day_date: "2000-01-01", habits: merged },
          { onConflict: "user_id,day_date" },
        );
    } catch (err) {
      setJsonError("Invalid JSON format. Please check the structure.");
    }
  };

  const handleMacroSave = async () => {
    setEditingMacros(false);
    const { data: existing } = await supabase
      .from("days")
      .select("habits")
      .eq("user_id", user.id)
      .eq("day_date", "2000-01-01")
      .maybeSingle();

    const merged = { ...(existing?.habits || {}), macros: macros };
    await supabase
      .from("days")
      .upsert(
        { user_id: user.id, day_date: "2000-01-01", habits: merged },
        { onConflict: "user_id,day_date" },
      );
  };

  const handleMacroChange = (key, val) => {
    setMacros((prev) => ({ ...prev, [key]: Number(val) }));
  };

  const todaysMeals = weeklyPlan[dayOfWeek] || [];
  const completedMeals = todaysMeals.filter(
    (m) => checked[`diet_${m.id}`],
  ).length;
  const compliancePct =
    todaysMeals.length > 0
      ? Math.round((completedMeals / todaysMeals.length) * 100)
      : 0;

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: bg,
        }}
      >
        <CircularProgress sx={{ color: COLOR }} />
      </Box>
    );

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        background: bg,
        backgroundImage: bgTexture,
        overflow: "hidden",
      }}
    >
      {/* Decorative Glow */}
      <Box
        sx={{
          position: "absolute",
          top: -150,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          background: `radial-gradient(ellipse at center, ${COLOR}25 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          p: { xs: 2.5, md: 4 },
          maxWidth: 900,
          mx: "auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mb: 4,
            animation: `${fadeInUp} 0.6s ease-out`,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Spa sx={{ color: COLOR, fontSize: 18 }} />
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontSize: 11,
                  color: COLOR,
                  fontWeight: 700,
                }}
              >
                Anna & Arogya
              </Typography>
            </Box>
            <Typography
              sx={{
                fontFamily: '"Fraunces","Lora",serif',
                fontWeight: 400,
                fontSize: { xs: 32, md: 40 },
                color: textP,
                lineHeight: 1.1,
              }}
            >
              Diet Tracker
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: textS,
                mt: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <MonitorWeight sx={{ fontSize: 16 }} /> Fitelo Weekly Plan{" "}
              <span style={{ opacity: 0.5 }}>|</span> 12:12 Fasting
            </Typography>
          </Box>
        </Box>

        {/* Custom Tabs */}
        <Box sx={{ borderBottom: `1px solid ${border}`, mb: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                fontSize: 13,
                fontWeight: 600,
                textTransform: "none",
                minHeight: 48,
                minWidth: 0,
                px: 2.5,
                color: textS,
              },
              "& .Mui-selected": { color: `${COLOR} !important` },
              "& .MuiTabs-indicator": {
                background: COLOR,
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              },
            }}
          >
            <Tab label="Today's Journey" />
            <Tab label="Vital Macros" />
            <Tab label="Pantry List" />
            <Tab label="Sync Plan" />
          </Tabs>
        </Box>

        {/* ── 1. TODAY TAB ── */}
        <TabPanel value={tab} index={0}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 4,
              background: cardBg,
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.02)",
              mb: 4,
              overflow: "visible",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              {/* Progress Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 4,
                }}
              >
                <Box sx={{ width: "65%" }}>
                  <Typography
                    sx={{
                      fontSize: 16,
                      color: textP,
                      fontWeight: 600,
                      textTransform: "capitalize",
                      mb: 1.5,
                    }}
                  >
                    {dayOfWeek}'s Path
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={compliancePct}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(90, 110, 26, 0.1)",
                      "& .MuiLinearProgress-bar": {
                        background: compliancePct >= 80 ? "#3A8050" : COLOR,
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography
                    sx={{ fontSize: 12, color: textS, mt: 1, fontWeight: 500 }}
                  >
                    {completedMeals} out of {todaysMeals.length} nourishing
                    meals completed
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Fraunces",serif',
                    fontSize: { xs: 36, md: 48 },
                    fontWeight: 300,
                    color: compliancePct >= 80 ? "#3A8050" : COLOR,
                    lineHeight: 1,
                  }}
                >
                  {compliancePct}%
                </Typography>
              </Box>

              <Divider sx={{ mb: 4, borderColor: border }} />

              {/* Meals Timeline */}
              {todaysMeals.length === 0 ? (
                <Alert
                  icon={<LocalFlorist />}
                  severity="info"
                  sx={{
                    background: isDark ? `${COLOR}20` : `${COLOR}10`,
                    color: textP,
                    borderRadius: 3,
                  }}
                >
                  Your ashram is quiet today. No meals found for {dayOfWeek}.
                </Alert>
              ) : (
                <Box sx={{ position: "relative", ml: 2 }}>
                  {/* Timeline Line */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 11,
                      top: 20,
                      bottom: 20,
                      width: 2,
                      background: border,
                      zIndex: 0,
                    }}
                  />

                  {todaysMeals.map((meal, idx) => {
                    const done = !!checked[`diet_${meal.id}`];
                    return (
                      <Box
                        key={meal.id}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          mb: 3,
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {/* Timeline Node & Checkbox */}
                        <Box
                          onClick={() => toggleCheck("diet", meal.id)}
                          sx={{
                            cursor: "pointer",
                            flexShrink: 0,
                            mr: 2.5,
                            background: cardBg,
                            borderRadius: "50%",
                            p: 0.5,
                            transition: "transform 0.2s",
                            "&:active": { transform: "scale(0.9)" },
                          }}
                        >
                          {done ? (
                            <CheckCircle sx={{ fontSize: 26, color: COLOR }} />
                          ) : (
                            <RadioButtonUnchecked
                              sx={{
                                fontSize: 26,
                                color: isDark
                                  ? "rgba(255,255,255,0.2)"
                                  : "#C4C2BE",
                              }}
                            />
                          )}
                        </Box>

                        {/* Meal Content */}
                        <Box
                          sx={{
                            flex: 1,
                            p: 2,
                            borderRadius: 3,
                            border: `1px solid ${done ? `${COLOR}40` : "transparent"}`,
                            background: done
                              ? isDark
                                ? `${COLOR}10`
                                : `${COLOR}08`
                              : "transparent",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                              flexWrap: "wrap",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 15,
                                  fontWeight: 700,
                                  color: done ? textS : textP,
                                  textDecoration: done
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {meal.label}
                              </Typography>
                              {meal.calories && (
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: COLOR,
                                    background: `${COLOR}15`,
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                  }}
                                >
                                  {meal.calories} kcal
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              icon={
                                <AccessTime
                                  sx={{ fontSize: "14px !important" }}
                                />
                              }
                              label={meal.time}
                              size="small"
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                background: isDark
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.04)",
                                color: textS,
                                border: "none",
                              }}
                            />
                          </Box>

                          {meal.note && (
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: textS,
                                fontStyle: "italic",
                                mb: 1.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Spa sx={{ fontSize: 12, opacity: 0.7 }} />{" "}
                              {meal.note}
                            </Typography>
                          )}

                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
                          >
                            {meal.items.map((item, j) => (
                              <Chip
                                key={j}
                                label={item}
                                size="small"
                                variant={done ? "outlined" : "filled"}
                                sx={{
                                  fontSize: 12,
                                  borderRadius: 2,
                                  color: done ? textS : textP,
                                  borderColor: done ? border : "transparent",
                                  background: done
                                    ? "transparent"
                                    : isDark
                                      ? "rgba(255,255,255,0.03)"
                                      : "rgba(0,0,0,0.03)",
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Daily Reflections / Journal */}
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 4,
              background: cardBg,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: textP,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <LocalFlorist sx={{ color: COLOR, fontSize: 18 }} /> Daily
                  Reflections
                </Typography>
                <Button
                  size="small"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  startIcon={
                    savingNotes ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <Save />
                    )
                  }
                  sx={{ color: COLOR, textTransform: "none", fontWeight: 600 }}
                >
                  {savingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="How is your body feeling today? Any cravings or high energy moments?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 14,
                    color: textP,
                    background: isDark
                      ? "rgba(0,0,0,0.2)"
                      : "rgba(255,255,255,0.5)",
                    "& fieldset": { borderColor: border },
                    "&:hover fieldset": { borderColor: `${COLOR}50` },
                    "&.Mui-focused fieldset": { borderColor: COLOR },
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabPanel>

        {/* ── 2. MACROS TAB ── */}
        <TabPanel value={tab} index={1}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 20,
                  fontFamily: '"Fraunces",serif',
                  color: textP,
                  fontWeight: 400,
                }}
              >
                Nutrition Architecture
              </Typography>
              <Typography sx={{ fontSize: 13, color: textS, mt: 0.5 }}>
                Calibrated for Fat Loss & Muscle Preservation
              </Typography>
            </Box>
            <Button
              variant={editingMacros ? "contained" : "outlined"}
              onClick={() =>
                editingMacros ? handleMacroSave() : setEditingMacros(true)
              }
              sx={{
                borderColor: COLOR,
                color: editingMacros ? "#fff" : COLOR,
                background: editingMacros ? COLOR : "transparent",
                textTransform: "none",
                borderRadius: 3,
                fontWeight: 600,
                px: 3,
                "&:hover": {
                  background: editingMacros ? "#4a5b14" : `${COLOR}10`,
                },
              }}
            >
              {editingMacros ? "Lock Architecture" : "Calibrate"}
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Main KPI: Calories */}
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  height: "100%",
                  border: `1px solid ${border}`,
                  borderRadius: 4,
                  background: isDark
                    ? `linear-gradient(135deg, ${cardBg}, #111)`
                    : `linear-gradient(135deg, ${cardBg}, #fff)`,
                  boxShadow: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  p: 3,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: textS,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Bolt sx={{ color: COLOR }} /> Daily Energy
                </Typography>
                {editingMacros ? (
                  <TextField
                    fullWidth
                    type="number"
                    value={macros.calories}
                    onChange={(e) =>
                      handleMacroChange("calories", e.target.value)
                    }
                    sx={{
                      input: {
                        fontSize: 40,
                        fontFamily: '"Fraunces",serif',
                        color: COLOR,
                        textAlign: "center",
                      },
                    }}
                  />
                ) : (
                  <Typography
                    sx={{
                      fontFamily: '"Fraunces",serif',
                      fontSize: 64,
                      fontWeight: 300,
                      color: COLOR,
                      lineHeight: 1,
                      textAlign: "center",
                    }}
                  >
                    {macros.calories}{" "}
                    <span
                      style={{
                        fontSize: 20,
                        color: textS,
                        fontFamily: "sans-serif",
                      }}
                    >
                      kcal
                    </span>
                  </Typography>
                )}
              </Card>
            </Grid>

            {/* Core Macros (Protein, Carbs, Fats) */}
            <Grid item xs={12} md={7}>
              <Card
                sx={{
                  height: "100%",
                  border: `1px solid ${border}`,
                  borderRadius: 4,
                  background: cardBg,
                  boxShadow: "none",
                  p: 3,
                }}
              >
                <Grid
                  container
                  spacing={2}
                  justifyContent="space-around"
                  alignItems="center"
                  sx={{ height: "100%" }}
                >
                  <Grid item>
                    {editingMacros ? (
                      <TextField
                        label="Protein (g)"
                        type="number"
                        size="small"
                        value={macros.protein}
                        onChange={(e) =>
                          handleMacroChange("protein", e.target.value)
                        }
                        sx={{ width: 80 }}
                      />
                    ) : (
                      <MacroRing
                        value={macros.protein}
                        max={200}
                        label="Protein"
                        color="#D46B4E"
                        icon={<FitnessCenter sx={{ color: "#D46B4E" }} />}
                        unit="g"
                      />
                    )}
                  </Grid>
                  <Grid item>
                    {editingMacros ? (
                      <TextField
                        label="Carbs (g)"
                        type="number"
                        size="small"
                        value={macros.carbs}
                        onChange={(e) =>
                          handleMacroChange("carbs", e.target.value)
                        }
                        sx={{ width: 80 }}
                      />
                    ) : (
                      <MacroRing
                        value={macros.carbs}
                        max={300}
                        label="Carbs"
                        color="#DDA74F"
                        icon={<Grass sx={{ color: "#DDA74F" }} />}
                        unit="g"
                      />
                    )}
                  </Grid>
                  <Grid item>
                    {editingMacros ? (
                      <TextField
                        label="Fats (g)"
                        type="number"
                        size="small"
                        value={macros.fats}
                        onChange={(e) =>
                          handleMacroChange("fats", e.target.value)
                        }
                        sx={{ width: 80 }}
                      />
                    ) : (
                      <MacroRing
                        value={macros.fats}
                        max={100}
                        label="Fats"
                        color="#6B8A9E"
                        icon={<Opacity sx={{ color: "#6B8A9E" }} />}
                        unit="g"
                      />
                    )}
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* Micros & Water */}
            {[
              { key: "fiber", label: "Fiber", unit: "g", icon: <Grass /> },
              {
                key: "magnesium",
                label: "Magnesium",
                unit: "mg",
                icon: <Spa />,
              },
              {
                key: "water",
                label: "Hydration",
                unit: "ml",
                icon: <Opacity />,
              },
            ].map((m) => (
              <Grid item xs={12} sm={4} key={m.key}>
                <Card
                  sx={{
                    border: `1px solid ${border}`,
                    borderRadius: 4,
                    background: cardBg,
                    boxShadow: "none",
                  }}
                >
                  <CardContent
                    sx={{
                      p: "20px !important",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: textS,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          mb: 0.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        {m.label}
                      </Typography>
                      {editingMacros ? (
                        <TextField
                          variant="standard"
                          type="number"
                          value={macros[m.key]}
                          onChange={(e) =>
                            handleMacroChange(m.key, e.target.value)
                          }
                          sx={{
                            input: {
                              fontSize: 24,
                              fontFamily: '"Fraunces",serif',
                              color: textP,
                            },
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Fraunces",serif',
                            fontSize: 24,
                            fontWeight: 400,
                            color: textP,
                          }}
                        >
                          {macros[m.key]}{" "}
                          <span
                            style={{
                              fontSize: 13,
                              color: textS,
                              fontFamily: "sans-serif",
                            }}
                          >
                            {m.unit}
                          </span>
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

        {/* ── 3. GROCERIES TAB ── */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: 20,
                fontFamily: '"Fraunces",serif',
                color: textP,
              }}
            >
              Weekly Provisions
            </Typography>
            <Typography sx={{ fontSize: 13, color: textS, mt: 0.5 }}>
              Check items off as you stock your ashram kitchen.
            </Typography>
          </Box>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 4,
              background: cardBg,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {weeklyPlan.groceries?.map((item, i) => {
                const done = !!checked[`groc_${i}`];
                return (
                  <Box
                    key={i}
                    onClick={() => toggleCheck("groc", i)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2.5,
                      borderBottom:
                        i < weeklyPlan.groceries.length - 1
                          ? `1px solid ${border}`
                          : "none",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      "&:hover": {
                        background: isDark
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(0,0,0,0.02)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        color: done
                          ? COLOR
                          : isDark
                            ? "rgba(255,255,255,0.15)"
                            : "#D1D0CF",
                        mt: 0.5,
                      }}
                    >
                      {done ? <CheckCircle /> : <RadioButtonUnchecked />}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 15,
                        color: done ? textS : textP,
                        textDecoration: done ? "line-through" : "none",
                        fontWeight: done ? 400 : 500,
                      }}
                    >
                      {item}
                    </Typography>
                  </Box>
                );
              })}
              {(!weeklyPlan.groceries || weeklyPlan.groceries.length === 0) && (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Restaurant
                    sx={{ fontSize: 40, color: `${COLOR}40`, mb: 1 }}
                  />
                  <Typography sx={{ fontSize: 14, color: textS }}>
                    No provisions required for this week.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* ── 4. UPLOAD PLAN TAB ── */}
        <TabPanel value={tab} index={3}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 4,
              background: cardBg,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}
              >
                <CloudUpload sx={{ color: COLOR }} />
                <Typography
                  sx={{
                    fontSize: 18,
                    fontFamily: '"Fraunces",serif',
                    color: textP,
                  }}
                >
                  Sync New Protocol
                </Typography>
              </Box>
              <Typography
                sx={{ fontSize: 13, color: textS, mb: 3, lineHeight: 1.6 }}
              >
                Paste your updated weekly JSON payload here. Ensure keys are
                lowercase days of the week (monday, tuesday) and an array for
                groceries.
              </Typography>

              {jsonError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {jsonError}
                </Alert>
              )}

              <TextField
                fullWidth
                multiline
                rows={12}
                variant="outlined"
                placeholder='{\n  "monday": [...],\n  "groceries": [...]\n}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                sx={{
                  mb: 3,
                  "& textarea": {
                    fontSize: 13,
                    fontFamily: "'Fira Code', monospace",
                    color: textP,
                  },
                  "& .MuiOutlinedInput-root": {
                    background: isDark ? "rgba(0,0,0,0.3)" : "#fff",
                    borderRadius: 2,
                  },
                }}
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleJsonUpload}
                disabled={!jsonInput.trim()}
                sx={{
                  background: COLOR,
                  color: "#fff",
                  textTransform: "none",
                  borderRadius: 3,
                  fontWeight: 600,
                  px: 4,
                  "&:hover": { background: "#4a5b14" },
                  "&.Mui-disabled": {
                    background: isDark ? "#333" : "#e0e0e0",
                    color: textS,
                  },
                }}
              >
                Parse & Initiate Plan
              </Button>
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
    </Box>
  );
}
