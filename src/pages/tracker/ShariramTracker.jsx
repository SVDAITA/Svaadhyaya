import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Stack,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  CheckCircle,
  ErrorOutline,
  InfoOutlined,
  Straighten,
  Speed,
  SelfImprovement,
  Timeline,
  CompareArrows,
  TrackChanges,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";

const COLOR_EXCELLENT = "#2D7A4F";
const COLOR_EXCELLENT_DARK = "#5EC98A";
const COLOR_STANDARD = "#4A90E2";
const COLOR_ALERT = "#C07830";
const COLOR_CRITICAL = "#CF4E4E";

// Metric metadata — thresholds are NOT hardcoded; user sets their own targets
const METRIC_META = {
  muscle_mass: { label: "Muscle Mass", unit: "kg", lowerIsBetter: false },
  visceral_fat: { label: "Visceral Fat", unit: "", lowerIsBetter: true },
  weight: { label: "Total Weight", unit: "kg", lowerIsBetter: true },
  body_age: { label: "Body Age", unit: "yrs", lowerIsBetter: true },
  fat_pct: { label: "Fat Ratio", unit: "%", lowerIsBetter: true },
  bmi: { label: "BMI", unit: "", lowerIsBetter: true },
};

const DEFAULT_TARGETS = {
  muscle_mass: { excellent: "", alert: "" },
  visceral_fat: { alert: "" },
  weight: { alert: "" },
  body_age: { alert: "" },
  fat_pct: { alert: "" },
  bmi: { alert: "" },
};

const COLOR_HEALTH = "#2D7A4F";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function ShariramHealthOS() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [targetsSnapshot, setTargetsSnapshot] = useState(null);
  const [compA, setCompA] = useState("");
  const [compB, setCompB] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [snapshotToDelete, setSnapshotToDelete] = useState(null);
  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  // Movement tracking
  const [activityLogs, setActivityLogs] = useState([]);
  const [movDate, setMovDate]       = useState(dayjs().format("YYYY-MM-DD"));
  const [movSteps, setMovSteps]     = useState("");
  const [movKm, setMovKm]           = useState("");
  const [movCalories, setMovCalories] = useState("");
  const [movSleep, setMovSleep]     = useState("");
  const [movSleepQ, setMovSleepQ]   = useState(0);
  const [savingMov, setSavingMov]   = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const thirtyAgo = dayjs().subtract(30, "day").format("YYYY-MM-DD");
      const [logsRes, settingsRes, activityRes] = await Promise.all([
        supabase.from("health_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("days").select("habits").eq("user_id", user.id).eq("day_date", "2000-01-01").maybeSingle(),
        supabase.from("daily_activity").select("*").eq("user_id", user.id).gte("date", thirtyAgo).order("date", { ascending: false }),
      ]);
      if (!logsRes.error) setLogs(logsRes.data || []);
      if (settingsRes.data?.habits?.health_targets) {
        setTargets({ ...DEFAULT_TARGETS, ...settingsRes.data.habits.health_targets });
      }
      if (!activityRes.error) {
        setActivityLogs(activityRes.data || []);
        const todayEntry = activityRes.data?.find((a) => a.date === dayjs().format("YYYY-MM-DD"));
        if (todayEntry) {
          setMovSteps(todayEntry.steps != null ? String(todayEntry.steps) : "");
          setMovKm(todayEntry.km_walked != null ? String(todayEntry.km_walked) : "");
          setMovCalories(todayEntry.calories_burned != null ? String(todayEntry.calories_burned) : "");
          setMovSleep(todayEntry.sleep_hours != null ? String(todayEntry.sleep_hours) : "");
          setMovSleepQ(todayEntry.sleep_quality ?? 0);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveMovement = async () => {
    if (!movSteps && !movKm && !movCalories && !movSleep) {
      showSnack("Enter at least one value to save.", "error");
      return;
    }
    setSavingMov(true);
    const payload = {
      user_id: user.id,
      date: movDate,
      steps: movSteps ? parseInt(movSteps, 10) : null,
      km_walked: movKm ? parseFloat(movKm) : null,
      calories_burned: movCalories ? parseInt(movCalories, 10) : null,
      sleep_hours: movSleep ? parseFloat(movSleep) : null,
      sleep_quality: movSleepQ || null,
    };
    const { error } = await supabase.from("daily_activity").upsert(payload, { onConflict: "user_id,date" });
    setSavingMov(false);
    if (error) { showSnack("Failed to save movement.", "error"); return; }
    showSnack("Saved.");
    fetchLogs();
  };

  const saveTargets = async (newTargets) => {
    setTargets(newTargets);
    const { data: existing } = await supabase.from("days").select("habits").eq("user_id", user.id).eq("day_date", "2000-01-01").maybeSingle();
    const { error } = await supabase.from("days").upsert(
      { user_id: user.id, day_date: "2000-01-01", habits: { ...(existing?.habits || {}), health_targets: newTargets } },
      { onConflict: "user_id,day_date" },
    );
    if (error) { showSnack("Failed to save targets.", "error"); return; }
    setTargetsOpen(false);
    showSnack("Targets saved.");
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Process data for UI
  const snapshots = useMemo(() => {
    return logs.reduce((acc, log) => {
      if (!acc[log.date]) acc[log.date] = { date: log.date, metrics: {} };
      acc[log.date].metrics[log.type] = log.value;
      return acc;
    }, {});
  }, [logs]);

  const sortedDates = useMemo(() => {
    return Object.keys(snapshots).sort((a, b) => dayjs(b).diff(dayjs(a)));
  }, [snapshots]);

  const latest = sortedDates.length > 0 ? snapshots[sortedDates[0]] : null;

  // Set default comparison months if available
  useEffect(() => {
    if (sortedDates.length >= 2 && !compA && !compB) {
      setCompA(sortedDates[1]); // Previous month
      setCompB(sortedDates[0]); // Current month
    }
  }, [sortedDates, compA, compB]);

  // Chart Data Preparation (Reverse for chronological order)
  const chartData = useMemo(() => {
    return sortedDates
      .slice()
      .reverse()
      .map((date) => ({
        date: dayjs(date).format("MMM YY"),
        weight: snapshots[date].metrics.weight || 0,
        muscle: snapshots[date].metrics.muscle_mass || 0,
      }));
  }, [sortedDates, snapshots]);

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const entries = Object.entries(data.metrics).map(([key, val]) => ({
          user_id: user.id,
          type: key,
          value: Number(val),
          date: data.date || dayjs().format("YYYY-MM-DD"),
          unit: METRIC_META[key]?.unit || "",
        }));
        const { error } = await supabase.from("health_logs").insert(entries);
        if (error) throw error;
        setUploadOpen(false);
        showSnack("Snapshot imported successfully.");
        fetchLogs();
      } catch (err) {
        showSnack("Invalid JSON format.", "error");
      }
    };
    reader.readAsText(file);
  };

  // Reusable Component for Diagnostics
  const MetricStatus = ({ id, value }) => {
    const meta = METRIC_META[id];
    if (!meta || value === undefined) return null;
    const t = targets[id] || {};

    let status = {
      label: "Logged",
      color: isDark ? alpha(COLOR_STANDARD, 0.8) : COLOR_STANDARD,
      icon: <InfoOutlined fontSize="small" />,
    };

    const excellent = t.excellent !== "" && t.excellent != null ? Number(t.excellent) : null;
    const alertVal = t.alert !== "" && t.alert != null ? Number(t.alert) : null;

    if (id === "muscle_mass" && excellent !== null && value >= excellent) {
      status = {
        label: "Excellent",
        color: isDark ? COLOR_EXCELLENT_DARK : COLOR_EXCELLENT,
        icon: <CheckCircle fontSize="small" />,
      };
    } else if (alertVal !== null && (meta.lowerIsBetter ? value >= alertVal : value < alertVal)) {
      status = {
        label: meta.lowerIsBetter ? "High" : "Below Target",
        color: isDark ? alpha(COLOR_ALERT, 0.8) : COLOR_ALERT,
        icon: <ErrorOutline fontSize="small" />,
      };
    }

    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: `1px solid ${alpha(status.color, 0.3)}`,
          bgcolor: alpha(status.color, 0.05),
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 4px 12px ${alpha(status.color, 0.15)}`,
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {meta.label}
          </Typography>
          <Chip
            label={status.label}
            size="small"
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 800,
              bgcolor: status.color,
              color: "#fff",
            }}
          />
        </Stack>
        <Typography
          variant="h4"
          sx={{ fontFamily: "Fraunces, serif", color: status.color }}
        >
          {value}
          <Typography
            component="span"
            variant="caption"
            sx={{ ml: 0.5, fontWeight: 500 }}
          >
            {meta.unit}
          </Typography>
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress color="primary" size={60} thickness={2} />
      </Box>
    );
  }

  // Calculate Deltas for Comparison Engine
  const getComparisonDeltas = () => {
    if (!compA || !compB || !snapshots[compA] || !snapshots[compB]) return [];
    const metricsToCompare = [
      "weight",
      "muscle_mass",
      "visceral_fat",
      "fat_pct",
    ];

    return metricsToCompare.map((key) => {
      const valA = snapshots[compA].metrics[key] || 0;
      const valB = snapshots[compB].metrics[key] || 0;
      const diff = (valB - valA).toFixed(1);
      const meta = METRIC_META[key];

      let isGood = meta.lowerIsBetter ? diff <= 0 : diff >= 0;
      if (diff == 0) isGood = true;

      return {
        key,
        label: meta.label,
        diff: diff > 0 ? `+${diff}` : diff,
        unit: meta.unit,
        color:
          diff == 0
            ? "text.secondary"
            : isGood
              ? (isDark ? COLOR_EXCELLENT_DARK : COLOR_EXCELLENT)
              : COLOR_CRITICAL,
      };
    });
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        minHeight: "100vh",
        color: "text.primary",
      }}
    >
      <Box
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        sx={{ maxWidth: 1200, mx: "auto" }}
      >
        {/* ── HEADER ── */}
        <Box
          component={motion.div}
          variants={itemVariants}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 6,
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <SelfImprovement fontSize="large" />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: "Fraunces, serif",
                  fontSize: { xs: 28, md: 36 },
                  fontWeight: 400,
                }}
              >
                Sharīram Health OS
              </Typography>
              <Typography
                variant="overline"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  letterSpacing: 2,
                }}
              >
                Sharīram · Biometric Records
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<TrackChanges />}
              onClick={() => { setTargetsSnapshot(targets); setTargetsOpen(true); }}
              sx={{ borderRadius: 8, px: 2.5, py: 1.5 }}
            >
              Set Targets
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setUploadOpen(true)}
              sx={{
                borderRadius: 8,
                px: 3,
                py: 1.5,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              Import Snapshot
            </Button>
          </Stack>
        </Box>

        {/* ── CURRENT MONTH BEAUTIFUL ANALYTICS ── */}
        {latest ? (
          <Box component={motion.div} variants={itemVariants} sx={{ mb: 6 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontFamily: "Fraunces, serif",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Speed color="primary" /> Diagnostic Analysis:{" "}
              {dayjs(latest.date).format("MMMM YYYY")}
            </Typography>
            <Grid container spacing={3}>
              {/* Primary Diagnostic Metrics */}
              <Grid item xs={12} md={8}>
                <Card
                  sx={{
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={2}>
                      {[
                        "weight",
                        "visceral_fat",
                        "muscle_mass",
                        "body_age",
                        "fat_pct",
                        "bmi",
                      ].map((m) => (
                        <Grid item xs={6} sm={4} key={m}>
                          <MetricStatus id={m} value={latest.metrics[m]} />
                        </Grid>
                      ))}
                    </Grid>

                    <Divider sx={{ my: 4 }} />

                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: "text.secondary",
                        mb: 3,
                        letterSpacing: 1,
                      }}
                    >
                      WEIGHT MANAGEMENT TRAJECTORY
                    </Typography>
                    <Grid container spacing={4}>
                      {[
                        {
                          label: "Fat Alert",
                          value: targets.visceral_fat?.alert ? `${targets.visceral_fat.alert}` : "—",
                          color: isDark ? alpha(COLOR_ALERT, 0.8) : COLOR_ALERT,
                          desc: "Visceral fat alert threshold.",
                        },
                        {
                          label: "Muscle Goal",
                          value: targets.muscle_mass?.excellent ? `${targets.muscle_mass.excellent}kg` : "—",
                          color: isDark ? COLOR_EXCELLENT_DARK : COLOR_EXCELLENT,
                          desc: "Preserve functional strength.",
                        },
                        {
                          label: "Weight Target",
                          value: targets.weight?.alert ? `${targets.weight.alert}kg` : "—",
                          color: theme.palette.primary.main,
                          desc: "Long-term weight goal.",
                        },
                      ].map((g, i) => (
                        <Grid item xs={12} sm={4} key={i}>
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 900,
                              color: g.color,
                              mb: 0.5,
                            }}
                          >
                            {g.label.toUpperCase()}
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: "Fraunces, serif",
                              fontWeight: 500,
                            }}
                          >
                            {g.value}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "text.secondary",
                              mt: 0.5,
                            }}
                          >
                            {g.desc}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Vitals & Measurements List */}
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    borderRadius: 4,
                    height: "100%",
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: "text.secondary",
                        mb: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        letterSpacing: 1,
                      }}
                    >
                      <Straighten fontSize="small" /> PHYSICAL VITALS
                    </Typography>
                    <Stack spacing={2.5}>
                      {[
                        "waist",
                        "belly",
                        "neck",
                        "bust",
                        "hip",
                        "thigh",
                        "calf",
                      ].map(
                        (v) =>
                          latest.metrics[v] && (
                            <Box
                              key={v}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                pb: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 14,
                                  textTransform: "capitalize",
                                  color: "text.secondary",
                                }}
                              >
                                {v}
                              </Typography>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontFamily: "Fraunces, serif",
                                }}
                              >
                                {latest.metrics[v]}"
                              </Typography>
                            </Box>
                          ),
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box
            component={motion.div}
            variants={itemVariants}
            sx={{
              p: 5,
              textAlign: "center",
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              borderRadius: 4,
              mb: 6,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No biometric data found.
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              Import a snapshot to begin your tracking journey.
            </Typography>
          </Box>
        )}

        {/* ── HISTORICAL TRENDS CHART ── */}
        {sortedDates.length > 1 && (
          <Box component={motion.div} variants={itemVariants} sx={{ mb: 6 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontFamily: "Fraunces, serif",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Timeline color="primary" /> Biometric Evolution
            </Typography>
            <Card
              sx={{
                borderRadius: 4,
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: "blur(10px)",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 4 }, height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={theme.palette.text.secondary}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke={theme.palette.text.secondary}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={["dataMin - 5", "dataMax + 5"]}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={theme.palette.text.secondary}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={["dataMin - 2", "dataMax + 2"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 8,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                      itemStyle={{ fontWeight: 600 }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      name="Weight (kg)"
                      dataKey="weight"
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      name="Muscle (kg)"
                      dataKey="muscle"
                      stroke={isDark ? COLOR_EXCELLENT_DARK : COLOR_EXCELLENT}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* ── DAILY MOVEMENT ── */}
        <Box component={motion.div} variants={itemVariants}>
          <Card sx={{ mb: 6, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: "blur(10px)", border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography variant="h6" sx={{ mb: 0.5, fontFamily: "Fraunces, serif", display: "flex", alignItems: "center", gap: 1 }}>
                🏃 Daily Activity & Sleep
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                Log data from Apple Watch / Apple Health · Steps auto-estimate calories if manual calories are blank
              </Typography>
              <Grid container spacing={3} alignItems="flex-start">
                {/* Input panel */}
                <Grid item xs={12} md={5}>
                  <Stack spacing={2}>
                    <TextField
                      label="Date"
                      type="date"
                      size="small"
                      value={movDate}
                      onChange={(e) => {
                        const d = e.target.value;
                        setMovDate(d);
                        const ex = activityLogs.find((a) => a.date === d);
                        setMovSteps(ex?.steps != null ? String(ex.steps) : "");
                        setMovKm(ex?.km_walked != null ? String(ex.km_walked) : "");
                        setMovCalories(ex?.calories_burned != null ? String(ex.calories_burned) : "");
                        setMovSleep(ex?.sleep_hours != null ? String(ex.sleep_hours) : "");
                        setMovSleepQ(ex?.sleep_quality ?? 0);
                      }}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />

                    {/* Movement group */}
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, pt: 0.5 }}>
                      Movement
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                      <TextField
                        label="Steps"
                        type="number"
                        size="small"
                        placeholder="e.g. 8000"
                        value={movSteps}
                        onChange={(e) => setMovSteps(e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="km Walked"
                        type="number"
                        size="small"
                        placeholder="e.g. 5.2"
                        value={movKm}
                        onChange={(e) => setMovKm(e.target.value)}
                        inputProps={{ min: 0, step: 0.1 }}
                        sx={{ flex: 1 }}
                      />
                    </Stack>
                    <TextField
                      label="Active Calories (kcal)"
                      type="number"
                      size="small"
                      placeholder="From Apple Health → Active Calories"
                      helperText="Leave blank to auto-estimate from steps"
                      value={movCalories}
                      onChange={(e) => setMovCalories(e.target.value)}
                      inputProps={{ min: 0 }}
                      fullWidth
                    />

                    {/* Sleep group */}
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, pt: 0.5 }}>
                      Sleep
                    </Typography>
                    <TextField
                      label="Sleep Duration (hrs)"
                      type="number"
                      size="small"
                      placeholder="e.g. 7.5"
                      helperText="From Apple Health → Sleep"
                      value={movSleep}
                      onChange={(e) => setMovSleep(e.target.value)}
                      inputProps={{ min: 0, max: 24, step: 0.25 }}
                      fullWidth
                    />
                    {/* Sleep quality dots */}
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.75 }}>
                        Sleep Quality
                      </Typography>
                      <Stack direction="row" spacing={0.75}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Box
                            key={n}
                            onClick={() => setMovSleepQ(movSleepQ === n ? 0 : n)}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              cursor: "pointer",
                              border: `2px solid ${n <= movSleepQ ? "#6AAEE8" : theme.palette.divider}`,
                              bgcolor: n <= movSleepQ ? alpha("#6AAEE8", 0.15) : "transparent",
                              transition: "all 0.15s",
                              userSelect: "none",
                            }}
                          >
                            {["😴", "😐", "🙂", "😊", "🌟"][n - 1]}
                          </Box>
                        ))}
                      </Stack>
                      {movSleepQ > 0 && (
                        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                          {["Poor", "Fair", "Good", "Great", "Excellent"][movSleepQ - 1]}
                        </Typography>
                      )}
                    </Box>

                    <Button
                      variant="contained"
                      onClick={saveMovement}
                      disabled={savingMov}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, mt: 0.5 }}
                    >
                      {savingMov ? "Saving…" : "Save"}
                    </Button>
                  </Stack>
                </Grid>

                {/* Recent log */}
                <Grid item xs={12} md={7}>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>Last 10 entries · click a row to edit</Typography>
                  {activityLogs.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>No activity logged yet.</Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Date</TableCell>
                            <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700 }}>Steps</TableCell>
                            <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700 }}>kcal</TableCell>
                            <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700 }}>Sleep</TableCell>
                            <TableCell align="center" sx={{ fontSize: 11, fontWeight: 700 }}>Quality</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {activityLogs.slice(0, 10).map((row) => (
                            <TableRow
                              key={row.date}
                              hover
                              onClick={() => {
                                setMovDate(row.date);
                                setMovSteps(row.steps != null ? String(row.steps) : "");
                                setMovKm(row.km_walked != null ? String(row.km_walked) : "");
                                setMovCalories(row.calories_burned != null ? String(row.calories_burned) : "");
                                setMovSleep(row.sleep_hours != null ? String(row.sleep_hours) : "");
                                setMovSleepQ(row.sleep_quality ?? 0);
                              }}
                              sx={{ cursor: "pointer" }}
                            >
                              <TableCell sx={{ fontSize: 12 }}>{dayjs(row.date).format("D MMM")}</TableCell>
                              <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>{row.steps?.toLocaleString() ?? "—"}</TableCell>
                              <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600, color: row.calories_burned ? (isDark ? "#F59E6A" : "#C07830") : "text.secondary" }}>
                                {row.calories_burned?.toLocaleString() ?? "—"}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 12 }}>{row.sleep_hours != null ? `${row.sleep_hours}h` : "—"}</TableCell>
                              <TableCell align="center" sx={{ fontSize: 14 }}>
                                {row.sleep_quality ? ["😴", "😐", "🙂", "😊", "🌟"][row.sleep_quality - 1] : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* ── COMPARISON ENGINE ── */}
        <Box component={motion.div} variants={itemVariants}>
          <Card
            sx={{
              mb: 6,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: "blur(10px)",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontFamily: "Fraunces, serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CompareArrows color="primary" /> Diagnostic Comparison Matrix
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }} alignItems="center">
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="base-month-label">Base Snapshot</InputLabel>
                    <Select
                      labelId="base-month-label"
                      label="Base Snapshot"
                      value={compA}
                      onChange={(e) => setCompA(e.target.value)}
                    >
                      {sortedDates.map((d) => (
                        <MenuItem key={d} value={d}>
                          {dayjs(d).format("MMMM YYYY")}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2} sx={{ textAlign: "center" }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: 800 }}
                  >
                    VERSUS
                  </Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="compare-month-label">
                      Comparison Snapshot
                    </InputLabel>
                    <Select
                      labelId="compare-month-label"
                      label="Comparison Snapshot"
                      value={compB}
                      onChange={(e) => setCompB(e.target.value)}
                    >
                      {sortedDates.map((d) => (
                        <MenuItem key={d} value={d}>
                          {dayjs(d).format("MMMM YYYY")}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Display Comparison Deltas */}
              {compA && compB && compA !== compB && (
                <Grid container spacing={2}>
                  {getComparisonDeltas().map((delta, idx) => (
                    <Grid item xs={6} sm={3} key={idx}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.background.default, 0.5),
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {delta.label} Shift
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            color: delta.color,
                            fontFamily: "Fraunces, serif",
                            mt: 0.5,
                          }}
                        >
                          {delta.diff}
                          <Typography component="span" variant="caption">
                            {delta.unit}
                          </Typography>
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* ── LOG HISTORY TABLE ── */}
        <Box component={motion.div} variants={itemVariants}>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: "blur(10px)",
              boxShadow: "none",
            }}
          >
            <Table>
              <TableHead
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
              >
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>
                    WEIGHT
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>
                    V. FAT
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>
                    MUSCLE
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>
                    BELLY
                  </TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedDates.map((date) => (
                  <TableRow
                    key={date}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      {dayjs(date).format("MMM D, YYYY")}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 500,
                        color:
                          snapshots[date].metrics.weight > 85
                            ? isDark
                              ? alpha(COLOR_CRITICAL, 0.9)
                              : COLOR_CRITICAL
                            : "inherit",
                      }}
                    >
                      {snapshots[date].metrics.weight || "-"} kg
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 500,
                        color:
                          snapshots[date].metrics.visceral_fat > 9
                            ? isDark
                              ? alpha(COLOR_ALERT, 0.9)
                              : COLOR_ALERT
                            : isDark ? COLOR_EXCELLENT_DARK : COLOR_EXCELLENT,
                      }}
                    >
                      {snapshots[date].metrics.visceral_fat || "-"}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 600,
                        color: isDark ? COLOR_EXCELLENT_DARK : COLOR_EXCELLENT,
                      }}
                    >
                      {snapshots[date].metrics.muscle_mass || "-"} kg
                    </TableCell>
                    <TableCell align="center" sx={{ color: "text.secondary" }}>
                      {snapshots[date].metrics.belly
                        ? `${snapshots[date].metrics.belly}"`
                        : "-"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setSnapshotToDelete(date)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ── IMPORT SNAPSHOT DIALOG ── */}
        <Dialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontFamily: "Fraunces, serif" }}>
            Import Data Snapshot
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
              JSON format: {"{ \"date\": \"YYYY-MM-DD\", \"metrics\": { \"weight\": 80, \"muscle_mass\": 62, ... } }"}
            </Typography>
            <Box
              sx={{
                p: 4,
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                textAlign: "center",
                bgcolor: alpha(theme.palette.background.default, 0.5),
              }}
            >
              <input
                type="file"
                accept=".json"
                onChange={handleJsonUpload}
                style={{ width: "100%" }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setUploadOpen(false)} color="inherit">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── SET TARGETS DIALOG ── */}
        <Dialog
          open={targetsOpen}
          onClose={() => { if (targetsSnapshot) setTargets(targetsSnapshot); setTargetsOpen(false); }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontFamily: "Fraunces, serif" }}>
            Configure Personal Targets
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 1 }}>
              Set your personal targets for each metric. Leave blank to show values without status coloring.
            </Typography>
            <Stack spacing={2.5}>
              {Object.entries(METRIC_META).map(([key, meta]) => (
                <Box key={key}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                    {meta.label} {meta.unit ? `(${meta.unit})` : ""}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
                    {key === "muscle_mass" && (
                      <TextField
                        label="Excellent ≥"
                        type="number"
                        size="small"
                        value={targets[key]?.excellent ?? ""}
                        onChange={(e) => setTargets((t) => ({ ...t, [key]: { ...t[key], excellent: e.target.value } }))}
                        sx={{ flex: 1 }}
                      />
                    )}
                    <TextField
                      label={meta.lowerIsBetter ? "Alert if ≥" : "Alert if <"}
                      type="number"
                      size="small"
                      value={targets[key]?.alert ?? ""}
                      onChange={(e) => setTargets((t) => ({ ...t, [key]: { ...t[key], alert: e.target.value } }))}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => { if (targetsSnapshot) setTargets(targetsSnapshot); setTargetsOpen(false); }} color="inherit">Cancel</Button>
            <Button variant="contained" onClick={() => saveTargets(targets)} sx={{ borderRadius: 2 }}>
              Save Targets
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

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

      <Dialog
        open={!!snapshotToDelete}
        onClose={() => setSnapshotToDelete(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: "Fraunces, serif", fontWeight: 400, fontSize: 20 }}>
          Remove snapshot?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
            Delete the health snapshot for <strong>{snapshotToDelete}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSnapshotToDelete(null)} color="inherit" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const date = snapshotToDelete;
              setSnapshotToDelete(null);
              const { error } = await supabase.from("health_logs").delete().eq("user_id", user.id).eq("date", date);
              showSnack(error ? "Failed to delete." : "Snapshot removed.", error ? "error" : "success");
              if (!error) fetchLogs();
            }}
            variant="contained"
            sx={{ background: "#D32F2F", "&:hover": { background: "#A03535" }, textTransform: "none", boxShadow: "none" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
