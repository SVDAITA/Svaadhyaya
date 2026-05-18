import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Tabs,
  Tab,
  Stack,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  WhatsApp,
  CheckCircle,
  RadioButtonUnchecked,
  CurrencyRupee,
  HistoryEdu,
  SelfImprovement,
  Close,
  EmojiEvents,
  AutoAwesome,
  Flag,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

// ── COLORS ────────────────────────────────────────────────────────────────────
const SAFFRON = "#C07830"; // Purohitam tab
const INDIGO = "#3B3A8A"; // Anushtanam tab
const SACRED_GREEN = "#2D6B4A";

const FREQ_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly — specific date" },
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const JAPA_FILTER_OPTS = [
  "Week",
  "Month",
  "Quarter",
  "Year",
  "5 Years",
  "10 Years",
  "50 Years",
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatINR(n) {
  if (!n) return "₹0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatCount(n) {
  if (!n) return "0";
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString("en-IN");
}

// Checks if a daily_item should show today based on frequency
function isVisibleToday(item) {
  const today = dayjs();
  if (item.frequency === "daily") return true;
  if (item.frequency === "weekly")
    return today.day() === (item.frequency_day ?? 0);
  if (item.frequency === "monthly")
    return today.date() === (item.frequency_day ?? 1);
  return true;
}

// Filter japa logs by time window
function filterJapaByWindow(logs, window) {
  const now = dayjs();
  const ranges = {
    Week: now.subtract(7, "day"),
    Month: now.subtract(1, "month"),
    Quarter: now.subtract(3, "month"),
    Year: now.subtract(1, "year"),
    "5 Years": now.subtract(5, "year"),
    "10 Years": now.subtract(10, "year"),
    "50 Years": now.subtract(50, "year"),
  };
  const from = ranges[window] || ranges["Year"];
  return logs.filter((l) => dayjs(l.day_date).isAfter(from));
}

// ── SAFFRON SVG BG ────────────────────────────────────────────────────────────
function SaffronBg() {
  return (
    <svg
      width="320"
      height="320"
      viewBox="0 0 320 320"
      fill="none"
      style={{
        position: "absolute",
        bottom: -20,
        right: -20,
        pointerEvents: "none",
        opacity: 0.04,
      }}
    >
      <circle
        cx="160"
        cy="160"
        r="140"
        stroke={SAFFRON}
        strokeWidth="1"
        fill="none"
      />
      <circle
        cx="160"
        cy="160"
        r="100"
        stroke={SAFFRON}
        strokeWidth="1"
        fill="none"
      />
      <circle
        cx="160"
        cy="160"
        r="60"
        stroke={SAFFRON}
        strokeWidth="1"
        fill="none"
      />
      <circle cx="160" cy="160" r="20" fill={SAFFRON} />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
        const r = (Math.PI * deg) / 180;
        return (
          <line
            key={i}
            x1={160 + 22 * Math.cos(r)}
            y1={160 + 22 * Math.sin(r)}
            x2={160 + 138 * Math.cos(r)}
            y2={160 + 138 * Math.sin(r)}
            stroke={SAFFRON}
            strokeWidth="0.5"
          />
        );
      })}
      <path
        d="M160 20 L300 160 L160 300 L20 160 Z"
        stroke={SAFFRON}
        strokeWidth="0.75"
        fill="none"
      />
    </svg>
  );
}

function IndigoBg() {
  return (
    <svg
      width="280"
      height="280"
      viewBox="0 0 280 280"
      fill="none"
      style={{
        position: "absolute",
        bottom: -10,
        right: -10,
        pointerEvents: "none",
        opacity: 0.05,
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          cx="140"
          cy="140"
          r={40 + i * 24}
          stroke={INDIGO}
          strokeWidth="0.75"
          fill="none"
        />
      ))}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const r = (Math.PI * deg) / 180;
        return (
          <line
            key={i}
            x1={140 + 42 * Math.cos(r)}
            y1={140 + 42 * Math.sin(r)}
            x2={140 + 136 * Math.cos(r)}
            y2={140 + 136 * Math.sin(r)}
            stroke={INDIGO}
            strokeWidth="0.5"
          />
        );
      })}
      <circle cx="140" cy="140" r="8" fill={INDIGO} opacity="0.6" />
    </svg>
  );
}

// ── SECTION LABEL ─────────────────────────────────────────────────────────────
function SL({ children, color }) {
  return (
    <Typography
      sx={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: color || "text.secondary",
        display: "block",
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PUROHITAM TAB
// ═══════════════════════════════════════════════════════════════════
function PurohitamTab({ user, isDark }) {
  const border = isDark ? "rgba(255,255,255,0.08)" : "#E8E5DF";
  const cardBg = isDark ? "#1A1510" : "#FFFBF5";
  const textP = isDark ? "#F5EFE0" : "#2C2010";
  const textS = isDark ? "#A09070" : "#7A6040";

  const [bookings, setBookings] = useState([]);
  const [rituals, setRituals] = useState([]);
  const [learning, setLearning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState("");

  // Dialogs
  const [bookingOpen, setBookingOpen] = useState(false);
  const [ritualOpen, setRitualOpen] = useState(false);
  const [ritualDetail, setRitualDetail] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [editRitual, setEditRitual] = useState(null);
  const [learnOpen, setLearnOpen] = useState(false);

  // Forms
  const emptyBooking = {
    program_name: "",
    dakshina: "",
    log_date: dayjs().format("YYYY-MM-DD"),
    location: "",
    ritual_type: "",
    notes: "",
  };
  const emptyRitual = { name: "", items: [], sequence: [], notes: "" };
  const [bForm, setBForm] = useState(emptyBooking);
  const [rForm, setRForm] = useState(emptyRitual);
  const [lForm, setLForm] = useState({ title: "", notes: "" });

  // Ritual item/step input
  const [newItem, setNewItem] = useState("");
  const [newStep, setNewStep] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [bks, rts, lrn] = await Promise.all([
        supabase
          .from("purohitam_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("log_date", { ascending: false }),
        supabase
          .from("ritual_templates")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at"),
        supabase
          .from("anshs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at"),
      ]);
      setBookings(bks.data || []);
      setRituals(rts.data || []);
      setLearning(lrn.data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Booking save/edit ──────────────────────────────────────────────
  const saveBooking = async () => {
    if (!bForm.program_name) return;
    setSaving(true);
    if (editBooking) {
      await supabase
        .from("purohitam_logs")
        .update({ ...bForm, dakshina: Number(bForm.dakshina) || 0 })
        .eq("id", editBooking.id);
    } else {
      await supabase.from("purohitam_logs").insert({
        ...bForm,
        user_id: user.id,
        dakshina: Number(bForm.dakshina) || 0,
      });
    }
    setBookingOpen(false);
    setEditBooking(null);
    setBForm(emptyBooking);
    setSaving(false);
    setSnack(editBooking ? "Booking updated" : "Booking logged");
    load();
  };

  const deleteBooking = async (id) => {
    await supabase.from("purohitam_logs").delete().eq("id", id);
    setSnack("Booking deleted");
    load();
  };

  const openEditBooking = (b) => {
    setBForm({
      program_name: b.program_name,
      dakshina: b.dakshina || "",
      log_date: b.log_date,
      location: b.location || "",
      ritual_type: b.ritual_type || "",
      notes: b.notes || "",
    });
    setEditBooking(b);
    setBookingOpen(true);
  };

  // ── Ritual save/edit ───────────────────────────────────────────────
  const saveRitual = async () => {
    if (!rForm.name) return;
    setSaving(true);
    if (editRitual) {
      await supabase
        .from("ritual_templates")
        .update({ ...rForm, updated_at: new Date().toISOString() })
        .eq("id", editRitual.id);
    } else {
      await supabase
        .from("ritual_templates")
        .insert({ ...rForm, user_id: user.id });
    }
    setRitualOpen(false);
    setEditRitual(null);
    setRForm(emptyRitual);
    setSaving(false);
    setSnack(editRitual ? "Template updated" : "Template created");
    load();
  };

  const deleteRitual = async (id) => {
    await supabase.from("ritual_templates").delete().eq("id", id);
    setSnack("Template deleted");
    load();
  };

  const openEditRitual = (r) => {
    setRForm({
      name: r.name,
      items: r.items || [],
      sequence: r.sequence || [],
      notes: r.notes || "",
    });
    setEditRitual(r);
    setRitualOpen(true);
  };

  // ── Learning ───────────────────────────────────────────────────────
  const saveLearning = async () => {
    if (!lForm.title) return;
    setSaving(true);
    await supabase.from("anshs").insert({
      user_id: user.id,
      title: lForm.title,
      description: lForm.notes || null,
      status: "active",
    });
    setLearnOpen(false);
    setLForm({ title: "", notes: "" });
    setSaving(false);
    setSnack("Added to learning ledger");
    load();
  };

  const toggleLearning = async (item) => {
    const next = item.status === "completed" ? "active" : "completed";
    await supabase
      .from("anshs")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    load();
  };

  const deleteLearning = async (id) => {
    await supabase.from("anshs").delete().eq("id", id);
    setSnack("Item removed");
    load();
  };

  // ── WhatsApp share ─────────────────────────────────────────────────
  const shareWhatsApp = (rit) => {
    const items = (rit.items || []).join(", ");
    const steps = (rit.sequence || [])
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n");
    const msg = `*${rit.name}*\n\n*Samagri:*\n${items}\n\n*Sequence:*\n${steps}`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  // Stats
  const totalDakshina = bookings.reduce(
    (s, b) => s + Number(b.dakshina || 0),
    0,
  );
  const thisMonth = bookings.filter((b) =>
    b.log_date?.startsWith(dayjs().format("YYYY-MM")),
  ).length;
  const completed = learning.filter((l) => l.status === "completed").length;

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: SAFFRON }} />
      </Box>
    );

  return (
    <Box>
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "Total Dakshina",
            value: formatINR(totalDakshina),
            color: SAFFRON,
          },
          { label: "Bookings this month", value: thisMonth, color: SAFFRON },
          {
            label: "Rituals in library",
            value: rituals.length,
            color: SAFFRON,
          },
          {
            label: "Syllabus completed",
            value: `${completed}/${learning.length}`,
            color: SACRED_GREEN,
          },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card
              sx={{
                border: `1px solid ${border}`,
                borderRadius: 2.5,
                background: cardBg,
                boxShadow: "none",
                borderTop: `3px solid ${s.color}`,
              }}
            >
              <CardContent sx={{ p: "14px 16px !important" }}>
                <Typography
                  sx={{
                    fontFamily: '"Fraunces",serif',
                    fontSize: 24,
                    fontWeight: 300,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </Typography>
                <Typography sx={{ fontSize: 11, color: textS, mt: 0.25 }}>
                  {s.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* Left — Ritual Library + Bookings */}
        <Grid item xs={12} md={7.5}>
          {/* Ritual Library */}
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 2.5,
              background: cardBg,
              boxShadow: "none",
              mb: 2.5,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <SaffronBg />
            <CardContent
              sx={{ p: "20px !important", position: "relative", zIndex: 1 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <SL color={SAFFRON}>Ritual Library · Agenda Builder</SL>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => {
                    setRForm(emptyRitual);
                    setEditRitual(null);
                    setRitualOpen(true);
                  }}
                  sx={{
                    fontSize: 11,
                    color: SAFFRON,
                    border: `1px solid ${SAFFRON}40`,
                    borderRadius: 2,
                    textTransform: "none",
                    px: 1.25,
                    py: 0.4,
                  }}
                >
                  Add Template
                </Button>
              </Box>

              {rituals.length === 0 ? (
                <Typography
                  sx={{
                    fontSize: 13,
                    color: textS,
                    fontStyle: "italic",
                    textAlign: "center",
                    py: 2,
                  }}
                >
                  No ritual templates yet. Add your first one.
                </Typography>
              ) : (
                <Grid container spacing={1.5}>
                  {rituals.map((rit) => (
                    <Grid item xs={12} sm={6} key={rit.id}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${SAFFRON}30`,
                          background: isDark ? `${SAFFRON}08` : `${SAFFRON}06`,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          "&:hover": {
                            borderColor: SAFFRON,
                            background: `${SAFFRON}12`,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Box
                            sx={{ flex: 1 }}
                            onClick={() => setRitualDetail(rit)}
                          >
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: textP,
                                fontFamily: '"Fraunces",serif',
                              }}
                            >
                              {rit.name}
                            </Typography>
                            <Typography
                              sx={{ fontSize: 11, color: textS, mt: 0.2 }}
                            >
                              {rit.sequence?.length || 0} steps ·{" "}
                              {rit.items?.length || 0} samagri items
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 0.25 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditRitual(rit);
                              }}
                              sx={{
                                p: 0.3,
                                opacity: 0.5,
                                "&:hover": { opacity: 1, color: SAFFRON },
                              }}
                            >
                              <Edit sx={{ fontSize: 13 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRitual(rit.id);
                              }}
                              sx={{
                                p: 0.3,
                                opacity: 0.4,
                                "&:hover": { opacity: 1, color: "#CF4E4E" },
                              }}
                            >
                              <Delete sx={{ fontSize: 13 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                shareWhatsApp(rit);
                              }}
                              sx={{
                                p: 0.3,
                                opacity: 0.5,
                                "&:hover": { opacity: 1, color: "#25D366" },
                              }}
                            >
                              <WhatsApp sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Bookings */}
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 2.5,
              background: cardBg,
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                p: "14px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid ${border}`,
              }}
            >
              <SL color={SAFFRON}>Booking Log</SL>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setBForm(emptyBooking);
                  setEditBooking(null);
                  setBookingOpen(true);
                }}
                sx={{
                  fontSize: 11,
                  color: SAFFRON,
                  border: `1px solid ${SAFFRON}40`,
                  borderRadius: 2,
                  textTransform: "none",
                  px: 1.25,
                  py: 0.4,
                }}
              >
                Log Booking
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Date", "Program", "Location", "Dakshina", ""].map(
                      (h, i) => (
                        <TableCell
                          key={i}
                          sx={{
                            fontSize: 10,
                            color: textS,
                            fontWeight: 700,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            py: 1,
                            borderBottom: `1px solid ${border}`,
                          }}
                        >
                          {h}
                        </TableCell>
                      ),
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{
                          textAlign: "center",
                          py: 3,
                          color: textS,
                          fontStyle: "italic",
                          fontSize: 13,
                        }}
                      >
                        No bookings yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((b) => (
                      <TableRow
                        key={b.id}
                        sx={{
                          "&:hover": {
                            background: isDark
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(0,0,0,0.01)",
                          },
                        }}
                      >
                        <TableCell sx={{ fontSize: 12, color: textS, py: 1 }}>
                          {dayjs(b.log_date).format("D MMM YY")}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: textP,
                            py: 1,
                          }}
                        >
                          {b.program_name}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: textS, py: 1 }}>
                          {b.location || "—"}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: SAFFRON,
                            py: 1,
                          }}
                        >
                          {formatINR(b.dakshina)}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Box sx={{ display: "flex", gap: 0.25 }}>
                            <IconButton
                              size="small"
                              onClick={() => openEditBooking(b)}
                              sx={{
                                p: 0.3,
                                opacity: 0.5,
                                "&:hover": { opacity: 1, color: SAFFRON },
                              }}
                            >
                              <Edit sx={{ fontSize: 13 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteBooking(b.id)}
                              sx={{
                                p: 0.3,
                                opacity: 0.4,
                                "&:hover": { opacity: 1, color: "#CF4E4E" },
                              }}
                            >
                              <Delete sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Right — Smartham Syllabus */}
        <Grid item xs={12} md={4.5}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 2.5,
              background: cardBg,
              boxShadow: "none",
              height: "100%",
            }}
          >
            <Box
              sx={{
                p: "14px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid ${border}`,
              }}
            >
              <SL color={SAFFRON}>Smartham Syllabus</SL>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => setLearnOpen(true)}
                sx={{
                  fontSize: 11,
                  color: SAFFRON,
                  border: `1px solid ${SAFFRON}40`,
                  borderRadius: 2,
                  textTransform: "none",
                  px: 1.25,
                  py: 0.4,
                }}
              >
                Add
              </Button>
            </Box>
            <CardContent sx={{ p: "16px 20px !important" }}>
              {learning.length === 0 ? (
                <Typography
                  sx={{ fontSize: 13, color: textS, fontStyle: "italic" }}
                >
                  No items yet.
                </Typography>
              ) : (
                learning.map((item) => {
                  const done = item.status === "completed";
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        py: 0.9,
                        borderBottom: `1px solid ${border}`,
                      }}
                    >
                      <Box
                        onClick={() => toggleLearning(item)}
                        sx={{
                          cursor: "pointer",
                          flexShrink: 0,
                          color: done ? SACRED_GREEN : border,
                        }}
                      >
                        {done ? (
                          <CheckCircle sx={{ fontSize: 18 }} />
                        ) : (
                          <RadioButtonUnchecked
                            sx={{ fontSize: 18, color: textS }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: 13,
                            color: done ? textS : textP,
                            textDecoration: done ? "line-through" : "none",
                            fontWeight: done ? 400 : 500,
                          }}
                        >
                          {item.title}
                        </Typography>
                        {item.description && (
                          <Typography sx={{ fontSize: 11, color: textS }}>
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => deleteLearning(item.id)}
                        sx={{
                          p: 0.3,
                          opacity: 0.3,
                          "&:hover": { opacity: 1, color: "#CF4E4E" },
                        }}
                      >
                        <Delete sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                  );
                })
              )}
              <Box
                sx={{
                  mt: 2,
                  p: 1.25,
                  borderRadius: 2,
                  background: `${SAFFRON}10`,
                  border: `1px solid ${SAFFRON}25`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    color: SAFFRON,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {completed} of {learning.length} prayogas mastered
                </Typography>
                {learning.length > 0 && (
                  <LinearProgress
                    variant="determinate"
                    value={
                      learning.length > 0
                        ? (completed / learning.length) * 100
                        : 0
                    }
                    sx={{
                      mt: 0.75,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: `${SAFFRON}20`,
                      "& .MuiLinearProgress-bar": { background: SAFFRON },
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── DIALOGS ── */}

      {/* Booking dialog */}
      <Dialog
        open={bookingOpen}
        onClose={() => { setBookingOpen(false); setEditBooking(null); setBForm(emptyBooking); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fraunces",serif',
            fontWeight: 400,
            color: SAFFRON,
          }}
        >
          {editBooking ? "Edit Booking" : "Log Booking"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}
          >
            <TextField
              fullWidth
              label="Program name"
              value={bForm.program_name}
              onChange={(e) =>
                setBForm((p) => ({ ...p, program_name: e.target.value }))
              }
              autoFocus
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={bForm.log_date}
                onChange={(e) =>
                  setBForm((p) => ({ ...p, log_date: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Dakshina (₹)"
                type="number"
                value={bForm.dakshina}
                onChange={(e) =>
                  setBForm((p) => ({ ...p, dakshina: e.target.value }))
                }
              />
            </Box>
            <TextField
              fullWidth
              label="Location"
              value={bForm.location}
              onChange={(e) =>
                setBForm((p) => ({ ...p, location: e.target.value }))
              }
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes (optional)"
              value={bForm.notes}
              onChange={(e) =>
                setBForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => { setBookingOpen(false); setEditBooking(null); setBForm(emptyBooking); }}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveBooking}
            disabled={saving || !bForm.program_name}
            sx={{
              background: SAFFRON,
              "&:hover": { background: "#A05A20" },
              boxShadow: "none",
              textTransform: "none",
            }}
          >
            {saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : editBooking ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ritual template dialog */}
      <Dialog
        open={ritualOpen}
        onClose={() => { setRitualOpen(false); setEditRitual(null); setRForm(emptyRitual); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fraunces",serif',
            fontWeight: 400,
            color: SAFFRON,
          }}
        >
          {editRitual ? "Edit Template" : "Add Ritual Template"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}
          >
            <TextField
              fullWidth
              label="Ritual name"
              value={rForm.name}
              onChange={(e) =>
                setRForm((p) => ({ ...p, name: e.target.value }))
              }
              autoFocus
              placeholder="e.g. Satyanarayana Swamy Vratam"
            />

            {/* Samagri */}
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  color: SAFFRON,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  mb: 0.75,
                }}
              >
                Samagri (puja items)
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add item..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newItem.trim()) {
                      setRForm((p) => ({
                        ...p,
                        items: [...p.items, newItem.trim()],
                      }));
                      setNewItem("");
                    }
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    if (newItem.trim()) {
                      setRForm((p) => ({
                        ...p,
                        items: [...p.items, newItem.trim()],
                      }));
                      setNewItem("");
                    }
                  }}
                  sx={{
                    background: SAFFRON,
                    boxShadow: "none",
                    minWidth: 0,
                    px: 1.5,
                  }}
                >
                  <Add sx={{ fontSize: 16 }} />
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {rForm.items.map((item, i) => (
                  <Chip
                    key={i}
                    label={item}
                    size="small"
                    onDelete={() =>
                      setRForm((p) => ({
                        ...p,
                        items: p.items.filter((_, j) => j !== i),
                      }))
                    }
                    sx={{ background: `${SAFFRON}15`, color: SAFFRON }}
                  />
                ))}
              </Box>
            </Box>

            {/* Sequence */}
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  color: SAFFRON,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  mb: 0.75,
                }}
              >
                Procedure / Steps
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add step..."
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newStep.trim()) {
                      setRForm((p) => ({
                        ...p,
                        sequence: [...p.sequence, newStep.trim()],
                      }));
                      setNewStep("");
                    }
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    if (newStep.trim()) {
                      setRForm((p) => ({
                        ...p,
                        sequence: [...p.sequence, newStep.trim()],
                      }));
                      setNewStep("");
                    }
                  }}
                  sx={{
                    background: SAFFRON,
                    boxShadow: "none",
                    minWidth: 0,
                    px: 1.5,
                  }}
                >
                  <Add sx={{ fontSize: 16 }} />
                </Button>
              </Box>
              {rForm.sequence.map((step, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0.5,
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: SAFFRON,
                      fontWeight: 700,
                      minWidth: 20,
                    }}
                  >
                    {i + 1}.
                  </Typography>
                  <Typography sx={{ fontSize: 13, flex: 1 }}>{step}</Typography>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setRForm((p) => ({
                        ...p,
                        sequence: p.sequence.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    <Close sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes (optional)"
              value={rForm.notes}
              onChange={(e) =>
                setRForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => { setRitualOpen(false); setEditRitual(null); setRForm(emptyRitual); }}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveRitual}
            disabled={saving || !rForm.name}
            sx={{
              background: SAFFRON,
              "&:hover": { background: "#A05A20" },
              boxShadow: "none",
              textTransform: "none",
            }}
          >
            {saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : editRitual ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ritual detail modal */}
      <Dialog
        open={!!ritualDetail}
        onClose={() => setRitualDetail(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {ritualDetail && (
          <>
            <DialogTitle
              sx={{
                fontFamily: '"Fraunces",serif',
                fontWeight: 400,
                color: SAFFRON,
                pb: 1,
              }}
            >
              {ritualDetail.name}
            </DialogTitle>
            <DialogContent>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: SAFFRON,
                  textTransform: "uppercase",
                  mb: 1,
                }}
              >
                Samagri
              </Typography>
              <Box
                sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 2.5 }}
              >
                {(ritualDetail.items || []).map((it, i) => (
                  <Chip
                    key={i}
                    label={it}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: `${SAFFRON}40`, color: SAFFRON }}
                  />
                ))}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: SAFFRON,
                  textTransform: "uppercase",
                  mb: 1.5,
                }}
              >
                Procedure
              </Typography>
              {(ritualDetail.sequence || []).map((step, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    py: 0.75,
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: `${SAFFRON}15`,
                      border: `1px solid ${SAFFRON}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      sx={{ fontSize: 10, color: SAFFRON, fontWeight: 700 }}
                    >
                      {i + 1}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>
                    {step}
                  </Typography>
                </Box>
              ))}
              {ritualDetail.notes && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 2,
                    background: `${SAFFRON}08`,
                    border: `1px solid ${SAFFRON}20`,
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: SAFFRON }}>
                    {ritualDetail.notes}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button
                startIcon={<WhatsApp />}
                variant="contained"
                onClick={() => shareWhatsApp(ritualDetail)}
                sx={{
                  background: "#25D366",
                  "&:hover": { background: "#1DA851" },
                  boxShadow: "none",
                  textTransform: "none",
                  fontSize: 12,
                }}
              >
                Share Samagri
              </Button>
              <Button
                onClick={() => {
                  openEditRitual(ritualDetail);
                  setRitualDetail(null);
                }}
                variant="outlined"
                sx={{
                  borderColor: SAFFRON,
                  color: SAFFRON,
                  textTransform: "none",
                  fontSize: 12,
                }}
              >
                Edit
              </Button>
              <Button
                onClick={() => setRitualDetail(null)}
                color="inherit"
                sx={{ textTransform: "none" }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Learning add dialog */}
      <Dialog
        open={learnOpen}
        onClose={() => { setLearnOpen(false); setLForm({ title: "", notes: "" }); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fraunces",serif',
            fontWeight: 400,
            color: SAFFRON,
          }}
        >
          Add to Smartham Syllabus
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}
          >
            <TextField
              fullWidth
              label="Prayoga / topic"
              value={lForm.title}
              onChange={(e) =>
                setLForm((p) => ({ ...p, title: e.target.value }))
              }
              autoFocus
              placeholder="e.g. Vivaham — Naandi Sraadham"
            />
            <TextField
              fullWidth
              label="Notes (optional)"
              value={lForm.notes}
              onChange={(e) =>
                setLForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => { setLearnOpen(false); setLForm({ title: "", notes: "" }); }}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveLearning}
            disabled={saving || !lForm.title}
            sx={{
              background: SAFFRON,
              boxShadow: "none",
              textTransform: "none",
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack("")}
        message={snack}
        ContentProps={{ sx: { background: "#2D6B4A", borderRadius: 2 } }}
      />
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANUSHTANAM TAB
// ═══════════════════════════════════════════════════════════════════
function AnushtanamTab({ user, isDark }) {
  const border = isDark ? "rgba(255,255,255,0.08)" : "#DDE0F0";
  const cardBg = isDark ? "#0F0E1A" : "#F8F8FF";
  const textP = isDark ? "#E8E8F8" : "#1A1A3A";
  const textS = isDark ? "#8080AA" : "#5A5A7A";

  const [sequence, setSequence] = useState([]);
  const [completions, setCompletions] = useState({});
  const [japaLogs, setJapaLogs] = useState([]);
  const [japaGoals, setJapaGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState("");
  const [japaFilter, setJapaFilter] = useState("Month");
  const [selectedJapa, setSelectedJapa] = useState("");
  const japaNames = [
    ...new Set([
      ...japaLogs.map((l) => l.japa_name),
      ...japaGoals.map((g) => g.japa_name),
    ]),
  ];

  useEffect(() => {
    if (
      japaNames.length > 0 &&
      (!selectedJapa || !japaNames.includes(selectedJapa))
    ) {
      setSelectedJapa(japaNames[0]); // picks first real name from data
    }
  }, [japaNames, selectedJapa]);

  // Dialogs
  const [seqOpen, setSeqOpen] = useState(false);
  const [editSeq, setEditSeq] = useState(null);
  const [japaOpen, setJapaOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  // Forms
  const emptySeq = {
    label: "",
    category: "anushtanam",
    emoji: "🪔",
    frequency: "daily",
    frequency_day: 0,
  };
  const emptyGoal = { japa_name: "", target_count: "", deadline_years: "", notes: "" };
  const emptyJapa = { japa_name: "", count: "", notes: "" };

  const [sForm, setSForm] = useState(emptySeq);
  const [japaForm, setJapaForm] = useState(emptyJapa);
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [saving, setSaving] = useState(false);
  const today = dayjs().format("YYYY-MM-DD");
  const todayLabel = dayjs().format("dddd, D MMMM YYYY");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [items, comps, japa, goals] = await Promise.all([
      supabase
        .from("daily_items")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index"),
      supabase
        .from("daily_item_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("completion_date", today),
      supabase
        .from("japa_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("day_date", { ascending: false }),
      supabase
        .from("japa_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true),
    ]);
    setSequence(items.data || []);
    setCompletions(
      comps.data?.reduce(
        (acc, c) => ({ ...acc, [c.daily_item_id]: c.is_completed }),
        {},
      ) || {},
    );
    setJapaLogs(japa.data || []);
    setJapaGoals(goals.data || []);
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Sequence CRUD ──────────────────────────────────────────────────
  const saveSeqItem = async () => {
    if (!sForm.label) return;
    setSaving(true);
    const maxIdx = sequence.reduce(
      (m, s) => Math.max(m, s.order_index || 0),
      0,
    );
    if (editSeq) {
      await supabase
        .from("daily_items")
        .update({ ...sForm })
        .eq("id", editSeq.id);
    } else {
      await supabase
        .from("daily_items")
        .insert({ ...sForm, user_id: user.id, order_index: maxIdx + 1 });
    }
    setSeqOpen(false);
    setEditSeq(null);
    setSForm(emptySeq);
    setSaving(false);
    setSnack(editSeq ? "Item updated" : "Item added to sequence");
    load();
  };

  const deleteSeqItem = async (id) => {
    await supabase.from("daily_items").delete().eq("id", id);
    setSnack("Item removed");
    load();
  };

  const toggleStep = async (itemId) => {
    const isDone = !completions[itemId];
    setCompletions((p) => ({ ...p, [itemId]: isDone }));
    await supabase.from("daily_item_completions").upsert(
      {
        user_id: user.id,
        daily_item_id: itemId,
        completion_date: today,
        is_completed: isDone,
      },
      { onConflict: "user_id,daily_item_id,completion_date" },
    );
  };

  // ── Japa log ───────────────────────────────────────────────────────
  const saveJapa = async () => {
    if (!japaForm.count || !japaForm.japa_name) return;
    setSaving(true);
    await supabase.from("japa_logs").upsert(
      {
        user_id: user.id,
        japa_name: japaForm.japa_name,
        count: parseInt(japaForm.count),
        day_date: today,
        notes: japaForm.notes || null,
      },
      { onConflict: "user_id,japa_name,day_date" },
    );
    setJapaOpen(false);
    setJapaForm({ japa_name: "", count: "", notes: "" });
    setSaving(false);
    setSnack("Japa count saved");
    load();
  };

  // ── Japa goal ──────────────────────────────────────────────────────
  const saveGoal = async () => {
    if (!goalForm.target_count || !goalForm.japa_name) return;
    setSaving(true);
    if (editGoal) {
      await supabase
        .from("japa_goals")
        .update({
          japa_name: goalForm.japa_name,
          target_count: Number(goalForm.target_count),
          deadline_years: Number(goalForm.deadline_years),
          notes: goalForm.notes || null,
        })
        .eq("id", editGoal.id);
    } else {
      await supabase.from("japa_goals").insert({
        user_id: user.id,
        japa_name: goalForm.japa_name,
        target_count: Number(goalForm.target_count),
        deadline_years: Number(goalForm.deadline_years),
        start_date: today,
        notes: goalForm.notes || null,
        is_active: true,
      });
    }
    setGoalOpen(false);
    setEditGoal(null);
    setGoalForm(emptyGoal);
    setSaving(false);
    setSnack(editGoal ? "Sankalpam updated" : "Mahasankalpam set");
    load();
  };

  const openEditGoal = (g) => {
    setGoalForm({
      japa_name: g.japa_name,
      target_count: String(g.target_count),
      deadline_years: String(g.deadline_years),
      notes: g.notes || "",
    });
    setEditGoal(g);
    setGoalOpen(true);
  };

  const deleteGoal = async (id) => {
    await supabase.from("japa_goals").update({ is_active: false }).eq("id", id);
    setSnack("Goal removed");
    load();
  };
  const deleteJapaLog = async (id) => {
    await supabase.from("japa_logs").delete().eq("id", id);
    load();
  };

  // ── Japa stats ─────────────────────────────────────────────────────
  const filteredLogs = useMemo(
    () =>
      filterJapaByWindow(japaLogs, japaFilter).filter(
        (l) => l.japa_name === selectedJapa,
      ),
    [japaLogs, japaFilter, selectedJapa],
  );
  const totalInWindow = filteredLogs.reduce((s, l) => s + l.count, 0);
  const allTimeTotal = japaLogs
    .filter((l) => l.japa_name === selectedJapa)
    .reduce((s, l) => s + l.count, 0);
  const activeGoal = japaGoals.find((g) => g.japa_name === selectedJapa);

  // Visible sequence items for today
  const visibleToday = sequence.filter(isVisibleToday);
  const doneToday = visibleToday.filter((s) => completions[s.id]).length;
  const compliancePct =
    visibleToday.length > 0
      ? Math.round((doneToday / visibleToday.length) * 100)
      : 0;

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: INDIGO }} />
      </Box>
    );

  return (
    <Box>
      {/* Today header */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2.5,
          background: isDark ? `${INDIGO}15` : `${INDIGO}08`,
          border: `1px solid ${INDIGO}30`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: '"Fraunces",serif',
              fontSize: 18,
              color: textP,
              fontWeight: 400,
            }}
          >
            {todayLabel}
          </Typography>
          <Typography sx={{ fontSize: 12, color: textS }}>
            {doneToday} of {visibleToday.length} rituals complete ·{" "}
            {compliancePct}% resonance
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={compliancePct}
          sx={{
            width: 160,
            height: 6,
            borderRadius: 3,
            bgcolor: `${INDIGO}20`,
            "& .MuiLinearProgress-bar": {
              background: compliancePct === 100 ? SACRED_GREEN : INDIGO,
              borderRadius: 3,
            },
          }}
        />
      </Box>

      <Grid container spacing={2.5}>
        {/* Left — Daily Sequence */}
        <Grid item xs={12} md={5.5}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 2.5,
              background: cardBg,
              boxShadow: "none",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <IndigoBg />
            <Box
              sx={{
                p: "14px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid ${border}`,
                position: "relative",
                zIndex: 1,
              }}
            >
              <SL color={INDIGO}>Daily Sequence · {dayjs().format("D MMM")}</SL>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setSForm(emptySeq);
                  setEditSeq(null);
                  setSeqOpen(true);
                }}
                sx={{
                  fontSize: 11,
                  color: INDIGO,
                  border: `1px solid ${INDIGO}40`,
                  borderRadius: 2,
                  textTransform: "none",
                  px: 1.25,
                  py: 0.4,
                }}
              >
                Add
              </Button>
            </Box>
            <CardContent
              sx={{
                p: "16px 20px !important",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Group by frequency */}
              {["daily", "weekly", "monthly"].map((freq) => {
                const items = sequence.filter((s) => s.frequency === freq);
                if (items.length === 0) return null;
                // For the checklist, only show items due today
                // But always show all items so user can manage them
                const visible = items;
                if (visible.length === 0) return null;
                return (
                  <Box key={freq} sx={{ mb: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 2,
                        color: INDIGO,
                        textTransform: "uppercase",
                        mb: 1,
                        opacity: 0.7,
                      }}
                    >
                      {freq === "daily"
                        ? "Daily Nitya Karma"
                        : freq === "weekly"
                          ? "Weekly Rituals"
                          : "Monthly Rituals"}
                    </Typography>
                    {visible.map((item) => {
                      const done = !!completions[item.id];
                      return (
                        <Box
                          key={item.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            py: 1,
                            borderBottom: `1px solid ${border}`,
                            cursor: "pointer",
                            "&:hover": {
                              background: isDark
                                ? "rgba(255,255,255,0.02)"
                                : "rgba(59,58,138,0.03)",
                            },
                            borderRadius: 1,
                            transition: "all 0.12s",
                          }}
                        >
                          <Box
                            onClick={() => toggleStep(item.id)}
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: done ? INDIGO : `${INDIGO}10`,
                              border: `1.5px solid ${done ? INDIGO : `${INDIGO}40`}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s",
                            }}
                          >
                            {done && (
                              <CheckCircle
                                sx={{ fontSize: 14, color: "#fff" }}
                              />
                            )}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 13,
                              flex: 1,
                              color: done ? textS : textP,
                              textDecoration: done ? "line-through" : "none",
                            }}
                          >
                            {item.emoji || ""} {item.label}
                          </Typography>
                          {freq !== "daily" && (
                            <Chip
                              label={
                                freq === "weekly"
                                  ? DOW[item.frequency_day || 0]
                                  : `${item.frequency_day || 1}th`
                              }
                              size="small"
                              sx={{
                                fontSize: 9,
                                height: 16,
                                background: `${INDIGO}12`,
                                color: INDIGO,
                              }}
                            />
                          )}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.1,
                              opacity: 0.4,
                              "&:hover": { opacity: 1 },
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSForm({
                                  label: item.label,
                                  category: item.category || "anushtanam",
                                  emoji: item.emoji || "",
                                  frequency: item.frequency || "daily",
                                  frequency_day: item.frequency_day || 0,
                                });
                                setEditSeq(item);
                                setSeqOpen(true);
                              }}
                              sx={{ p: 0.2 }}
                            >
                              <Edit sx={{ fontSize: 12 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteSeqItem(item.id)}
                              sx={{ p: 0.2 }}
                            >
                              <Delete sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
              {sequence.length === 0 && (
                <Typography
                  sx={{
                    fontSize: 13,
                    color: textS,
                    fontStyle: "italic",
                    textAlign: "center",
                    py: 3,
                  }}
                >
                  No sequence items yet. Add your Nitya Karma above.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right — Japa Dashboard */}
        <Grid item xs={12} md={6.5}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 2.5,
              background: cardBg,
              boxShadow: "none",
              mb: 2,
            }}
          >
            <CardContent sx={{ p: "16px 20px !important" }}>
              {/* Header row */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                <SL color={INDIGO}>Japa Dashboard</SL>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    disabled={japaGoals.length === 0}
                    title={japaGoals.length === 0 ? "Add a Japa goal first" : ""}
                    onClick={() => {
                      setJapaForm({ japa_name: selectedJapa || japaGoals[0]?.japa_name || "", count: "", notes: "" });
                      setJapaOpen(true);
                    }}
                    sx={{ fontSize: 11, color: INDIGO, border: `1px solid ${INDIGO}40`, borderRadius: 2, textTransform: "none", px: 1.25, py: 0.4 }}
                  >
                    Log Count
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Flag />}
                    onClick={() => { setGoalForm(emptyGoal); setEditGoal(null); setGoalOpen(true); }}
                    sx={{ fontSize: 11, color: SACRED_GREEN, border: `1px solid ${SACRED_GREEN}40`, borderRadius: 2, textTransform: "none", px: 1.25, py: 0.4 }}
                  >
                    Add Goal
                  </Button>
                </Box>
              </Box>

              {/* Japa type selector — only when multiple goals */}
              {japaNames.length > 1 && (
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5 }}>
                  {japaNames.map((name) => (
                    <Chip key={name} label={name} size="small" clickable onClick={() => setSelectedJapa(name)}
                      sx={{ fontSize: 11, background: selectedJapa === name ? INDIGO : "transparent", color: selectedJapa === name ? "#fff" : INDIGO, border: `1px solid ${INDIGO}40` }}
                    />
                  ))}
                </Box>
              )}

              {/* Time filter pills */}
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
                {JAPA_FILTER_OPTS.map((f) => (
                  <Box key={f} onClick={() => setJapaFilter(f)}
                    sx={{ px: 1.25, py: 0.4, borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: japaFilter === f ? 700 : 400, background: japaFilter === f ? INDIGO : "transparent", color: japaFilter === f ? "#fff" : textS, border: `1px solid ${japaFilter === f ? INDIGO : border}`, transition: "all 0.15s", userSelect: "none" }}
                  >
                    {f}
                  </Box>
                ))}
              </Box>

              {/* Per-goal radial progress rings */}
              {japaGoals.length === 0 ? (
                <Box sx={{ py: 3, textAlign: "center" }}>
                  <SelfImprovement sx={{ fontSize: 40, color: `${INDIGO}30`, mb: 1 }} />
                  <Typography sx={{ fontSize: 13, color: textS }}>No Mahasankalpam set yet</Typography>
                  <Typography sx={{ fontSize: 11, color: textS, fontStyle: "italic", mt: 0.5 }}>
                    Add a goal above to start tracking your japa journey
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center", mb: 2 }}>
                  {japaGoals.map((g) => {
                    const logged = japaLogs.filter((l) => l.japa_name === g.japa_name).reduce((s, l) => s + l.count, 0);
                    const pct = Math.min((logged / g.target_count) * 100, 100);
                    const r = 36;
                    const circ = 2 * Math.PI * r;
                    const dash = (pct / 100) * circ;
                    const isSelected = selectedJapa === g.japa_name;
                    return (
                      <Box key={g.id} onClick={() => setSelectedJapa(g.japa_name)}
                        sx={{ cursor: "pointer", textAlign: "center", p: 1.25, borderRadius: 2.5, border: `1.5px solid ${isSelected ? INDIGO : border}`, background: isSelected ? `${INDIGO}0D` : "transparent", transition: "all 0.2s", minWidth: 90 }}
                      >
                        <svg width="90" height="90" viewBox="0 0 90 90">
                          <circle cx="45" cy="45" r={r} fill="none" stroke={isDark ? "#1C1C3A" : "#E8E8F8"} strokeWidth="6" />
                          <circle cx="45" cy="45" r={r} fill="none" stroke={INDIGO} strokeWidth="6"
                            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                            transform="rotate(-90 45 45)" style={{ transition: "stroke-dasharray 0.6s ease" }}
                          />
                          <text x="45" y="42" textAnchor="middle" fontSize="12" fontWeight="700" fill={INDIGO} fontFamily="Fraunces,serif">{pct.toFixed(0)}%</text>
                          <text x="45" y="56" textAnchor="middle" fontSize="8" fill={isDark ? "#8080AA" : "#5A5A7A"} fontFamily="sans-serif">{formatCount(logged)}</text>
                        </svg>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: isSelected ? INDIGO : textS, mt: 0.25, maxWidth: 80, mx: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.japa_name}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Selected japa detail stats */}
              {selectedJapa && activeGoal && (
                <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                  <Box sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, background: `${INDIGO}10`, border: `1px solid ${INDIGO}20`, flex: 1 }}>
                    <Typography sx={{ fontSize: 10, color: textS }}>{japaFilter}</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: INDIGO }}>{formatCount(totalInWindow)}</Typography>
                  </Box>
                  <Box sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, background: `${INDIGO}10`, border: `1px solid ${INDIGO}20`, flex: 1 }}>
                    <Typography sx={{ fontSize: 10, color: textS }}>All time</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: INDIGO }}>{formatCount(allTimeTotal)}</Typography>
                  </Box>
                  <Box sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, background: `${SACRED_GREEN}10`, border: `1px solid ${SACRED_GREEN}20`, flex: 1 }}>
                    <Typography sx={{ fontSize: 10, color: textS }}>Today</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: SACRED_GREEN }}>
                      {formatCount(japaLogs.find((l) => l.japa_name === selectedJapa && l.day_date === today)?.count || 0)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Mahasankalpam Goals Table — always visible */}
              <Box sx={{ pt: 1.5, borderTop: `1px solid ${border}` }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: textS, textTransform: "uppercase", mb: 1 }}>
                  Mahasankalpam Goals
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {[["Goal", "left"], ["Target", "right"], ["Logged", "right"], ["Progress", "right"], ["Yrs", "right"], ["Started", "right"], ["", "right"]].map(([h, align]) => (
                          <TableCell key={h} align={align} sx={{ fontSize: 10, color: textS, fontWeight: 700, borderColor: border, pb: 0.5, whiteSpace: "nowrap" }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {japaGoals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ borderColor: border, py: 3 }}>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                              <AutoAwesome sx={{ fontSize: 28, color: `${INDIGO}35` }} />
                              <Typography sx={{ fontSize: 12, color: textS }}>No goals added yet</Typography>
                              <Typography sx={{ fontSize: 11, color: textS, fontStyle: "italic" }}>Click "Add Goal" to set your first Mahasankalpam</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        japaGoals.map((g) => {
                          const logged = japaLogs.filter((l) => l.japa_name === g.japa_name).reduce((s, l) => s + l.count, 0);
                          const pct = Math.min((logged / g.target_count) * 100, 100);
                          return (
                            <TableRow key={g.id} sx={{ "&:last-child td": { border: 0 } }}>
                              <TableCell sx={{ fontSize: 12, color: textP, borderColor: border }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                  <EmojiEvents sx={{ fontSize: 13, color: INDIGO }} />
                                  {g.japa_name}
                                </Box>
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 11, color: textS, borderColor: border, whiteSpace: "nowrap" }}>{formatCount(g.target_count)}</TableCell>
                              <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700, color: INDIGO, borderColor: border }}>{formatCount(logged)}</TableCell>
                              <TableCell align="right" sx={{ borderColor: border, minWidth: 90 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                  <LinearProgress variant="determinate" value={pct}
                                    sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: `${INDIGO}15`, "& .MuiLinearProgress-bar": { background: INDIGO, borderRadius: 3 } }}
                                  />
                                  <Typography sx={{ fontSize: 10, color: INDIGO, fontWeight: 700, minWidth: 34 }}>{pct.toFixed(1)}%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: 11, color: textS, borderColor: border }}>{g.deadline_years}yr</TableCell>
                              <TableCell align="right" sx={{ fontSize: 11, color: textS, borderColor: border, whiteSpace: "nowrap" }}>{dayjs(g.start_date).format("D MMM YY")}</TableCell>
                              <TableCell align="right" sx={{ borderColor: border, p: 0.5 }}>
                                <Box sx={{ display: "flex", gap: 0.25 }}>
                                  <IconButton size="small" onClick={() => openEditGoal(g)} sx={{ p: 0.3, opacity: 0.45, "&:hover": { opacity: 1, color: INDIGO } }}>
                                    <Edit sx={{ fontSize: 12 }} />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => deleteGoal(g.id)} sx={{ p: 0.3, opacity: 0.35, "&:hover": { opacity: 1, color: "#CF4E4E" } }}>
                                    <Delete sx={{ fontSize: 12 }} />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Full japa log table */}
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 2.5,
              background: cardBg,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ p: "16px 20px !important" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <SL color={INDIGO}>Japa Log — All Entries</SL>
                <Typography sx={{ fontSize: 11, color: textS }}>
                  {japaLogs.length} record{japaLogs.length !== 1 ? "s" : ""}
                </Typography>
              </Box>

              {japaLogs.length === 0 ? (
                <Typography
                  sx={{ fontSize: 13, color: textS, fontStyle: "italic" }}
                >
                  No entries yet. Log your first japa count above.
                </Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 420 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {["Date", "Japa", "Count", "Notes", ""].map((h) => (
                          <TableCell
                            key={h}
                            align={h === "Count" ? "right" : "left"}
                            sx={{
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: 1,
                              textTransform: "uppercase",
                              color: textS,
                              borderColor: border,
                              bgcolor: isDark ? "#16140F" : "#F8FAFC",
                              py: 1,
                            }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {japaLogs.map((l, idx) => (
                        <TableRow
                          key={l.id}
                          sx={{
                            bgcolor:
                              idx % 2 === 0
                                ? "transparent"
                                : isDark
                                  ? "rgba(255,255,255,0.015)"
                                  : "rgba(0,0,0,0.013)",
                            "&:last-child td": { border: 0 },
                          }}
                        >
                          <TableCell
                            sx={{
                              fontSize: 12,
                              color: textS,
                              borderColor: border,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {dayjs(l.day_date).format("D MMM YYYY")}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, borderColor: border }}>
                            <Chip
                              label={l.japa_name}
                              size="small"
                              sx={{
                                fontSize: 10,
                                height: 18,
                                background: `${INDIGO}12`,
                                color: INDIGO,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: INDIGO,
                              borderColor: border,
                              fontFamily: '"Fraunces",serif',
                            }}
                          >
                            {formatCount(l.count)}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              color: textS,
                              borderColor: border,
                              maxWidth: 200,
                            }}
                          >
                            <Typography
                              noWrap
                              sx={{ fontSize: 12, color: textS, maxWidth: 180 }}
                            >
                              {l.notes || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ borderColor: border, p: 0.5 }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => deleteJapaLog(l.id)}
                              sx={{
                                p: 0.3,
                                opacity: 0.35,
                                "&:hover": { opacity: 1, color: "#CF4E4E" },
                              }}
                            >
                              <Delete sx={{ fontSize: 13 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── DIALOGS ── */}

      {/* Sequence item dialog */}
      <Dialog
        open={seqOpen}
        onClose={() => { setSeqOpen(false); setEditSeq(null); setSForm(emptySeq); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fraunces",serif',
            fontWeight: 400,
            color: INDIGO,
          }}
        >
          {editSeq ? "Edit item" : "Add to daily sequence"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}
          >
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                label="Emoji"
                value={sForm.emoji}
                onChange={(e) =>
                  setSForm((p) => ({ ...p, emoji: e.target.value }))
                }
                sx={{ width: 80 }}
              />
              <TextField
                fullWidth
                label="Label"
                value={sForm.label}
                onChange={(e) =>
                  setSForm((p) => ({ ...p, label: e.target.value }))
                }
                autoFocus
                placeholder="e.g. Shiva Abhishekam"
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={sForm.frequency}
                onChange={(e) =>
                  setSForm((p) => ({ ...p, frequency: e.target.value }))
                }
                label="Frequency"
              >
                {FREQ_OPTIONS.map((f) => (
                  <MenuItem key={f.value} value={f.value}>
                    {f.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {sForm.frequency === "weekly" && (
              <FormControl fullWidth>
                <InputLabel>Day of week</InputLabel>
                <Select
                  value={sForm.frequency_day}
                  onChange={(e) =>
                    setSForm((p) => ({
                      ...p,
                      frequency_day: Number(e.target.value),
                    }))
                  }
                  label="Day of week"
                >
                  {DOW.map((d, i) => (
                    <MenuItem key={i} value={i}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {sForm.frequency === "monthly" && (
              <TextField
                fullWidth
                label="Day of month (1–31)"
                type="number"
                value={sForm.frequency_day}
                onChange={(e) =>
                  setSForm((p) => ({
                    ...p,
                    frequency_day: Number(e.target.value),
                  }))
                }
                inputProps={{ min: 1, max: 31 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setSeqOpen(false)}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveSeqItem}
            disabled={saving || !sForm.label}
            sx={{
              background: INDIGO,
              boxShadow: "none",
              textTransform: "none",
            }}
          >
            {saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : editSeq ? (
              "Update"
            ) : (
              "Add"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log japa dialog */}
      <Dialog
        open={japaOpen}
        onClose={() => { setJapaOpen(false); setJapaForm(emptyJapa); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 400, color: INDIGO }}>
          Log Japa Count
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}>
            <FormControl fullWidth>
              <InputLabel>Japa goal</InputLabel>
              <Select
                value={japaForm.japa_name}
                onChange={(e) => setJapaForm((p) => ({ ...p, japa_name: e.target.value }))}
                label="Japa goal"
                autoFocus
              >
                {japaGoals.map((g) => (
                  <MenuItem key={g.id} value={g.japa_name}>{g.japa_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Count today"
              type="number"
              value={japaForm.count}
              onChange={(e) => setJapaForm((p) => ({ ...p, count: e.target.value }))}
              helperText="Today's count — existing entry for this Japa will be replaced"
            />
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {[108, 216, 324, 1008].map((n) => (
                <Chip key={n} label={n} size="small" clickable
                  onClick={() => setJapaForm((p) => ({ ...p, count: String(n) }))}
                  sx={{ fontSize: 11, background: `${INDIGO}12`, color: INDIGO, cursor: "pointer" }}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              label="Notes (optional)"
              value={japaForm.notes}
              onChange={(e) => setJapaForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setJapaOpen(false); setJapaForm(emptyJapa); }} color="inherit" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveJapa} disabled={saving || !japaForm.count || !japaForm.japa_name}
            sx={{ background: INDIGO, boxShadow: "none", textTransform: "none" }}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : "Save Japa"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mahasankalpam goal dialog */}
      <Dialog
        open={goalOpen}
        onClose={() => { setGoalOpen(false); setEditGoal(null); setGoalForm(emptyGoal); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 400, color: SACRED_GREEN }}>
          {editGoal ? "Edit Mahasankalpam" : "New Mahasankalpam"}
        </DialogTitle>
        <DialogContent>
          {!editGoal && (
            <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
              A long-term commitment to a count. Track progress across years.
            </Alert>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: editGoal ? 0.5 : 0 }}>
            <TextField
              fullWidth
              label="Japa name"
              value={goalForm.japa_name}
              onChange={(e) => setGoalForm((p) => ({ ...p, japa_name: e.target.value }))}
              autoFocus
              placeholder="e.g. Gayatri, Om Namah Shivaya"
            />
            <TextField
              fullWidth
              label="Target count"
              type="number"
              value={goalForm.target_count}
              onChange={(e) => setGoalForm((p) => ({ ...p, target_count: e.target.value }))}
              helperText="e.g. 10000000 = 1 Crore"
            />
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {[100000, 1000000, 10000000, 100000000].map((n) => (
                <Chip key={n} size="small" clickable
                  label={n >= 10000000 ? `${n / 10000000}Cr` : n >= 100000 ? `${n / 100000}L` : n}
                  onClick={() => setGoalForm((p) => ({ ...p, target_count: String(n) }))}
                  sx={{ fontSize: 11, background: `${SACRED_GREEN}12`, color: SACRED_GREEN, cursor: "pointer" }}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              label="Time horizon (years)"
              type="number"
              value={goalForm.deadline_years}
              onChange={(e) => setGoalForm((p) => ({ ...p, deadline_years: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Sankalpam notes (optional)"
              value={goalForm.notes}
              onChange={(e) => setGoalForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Dedicated to Sri Rama charana seva"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setGoalOpen(false); setEditGoal(null); setGoalForm(emptyGoal); }} color="inherit" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveGoal} disabled={saving || !goalForm.target_count || !goalForm.japa_name}
            sx={{ background: SACRED_GREEN, boxShadow: "none", textTransform: "none" }}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : editGoal ? "Update" : "Set Sankalpam"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack("")}
        message={snack}
        ContentProps={{ sx: { background: INDIGO, borderRadius: 2 } }}
      />
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function PurohitamTracker() {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const [tab, setTab] = useState(0);

  const bgSaffron = isDark
    ? `radial-gradient(ellipse 90% 35% at 50% -5%, ${SAFFRON}10 0%, #0D0B08 65%)`
    : `radial-gradient(ellipse 90% 35% at 50% -5%, ${SAFFRON}12 0%, #F8FAFC 65%)`;
  const bgIndigo = isDark
    ? `radial-gradient(ellipse 90% 35% at 50% -5%, ${INDIGO}12 0%, #0A0A12 65%)`
    : `radial-gradient(ellipse 90% 35% at 50% -5%, ${INDIGO}09 0%, #F8FAFC 65%)`;

  const bg = tab === 0 ? bgSaffron : bgIndigo;
  const accent = tab === 0 ? SAFFRON : INDIGO;
  // In dark mode INDIGO (#3B3A8A) is invisible against dark bg — use a bright variant
  const accentText = isDark
    ? tab === 0 ? "#E8A050" : "#8888DD"
    : accent;
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#9C9A94" : "#5F5F5F";

  return (
    <Box
      sx={{
        p: { xs: 2, md: "28px 36px" },
        maxWidth: 1100,
        mx: "auto",
        minHeight: "100vh",
        background: bg,
        transition: "background 0.4s ease",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          mb: 3.5,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              letterSpacing: 2,
              textTransform: "uppercase",
              fontSize: 10,
              color: accentText,
              fontWeight: 700,
            }}
          >
            Sacred Practice
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Fraunces","Lora",serif',
              fontWeight: 300,
              fontSize: 30,
              color: textP,
              lineHeight: 1.2,
              mt: 0.25,
            }}
          >
            {tab === 0 ? "Purohitam Tracker" : "Anushtanam Tracker"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: textS, mt: 0.25 }}>
            {tab === 0
              ? "Vocation · Ritual Library · Earnings · Smartham Syllabus"
              : `${dayjs().format("dddd")} · Daily Sequence · Japa Mahasankalpam`}
          </Typography>
        </Box>

        {/* Tab switcher */}
        <Box
          sx={{
            display: "flex",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : `${accent}40`}`,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {[
            { icon: <HistoryEdu sx={{ fontSize: 16 }} />, label: "Purohitam", color: SAFFRON },
            { icon: <SelfImprovement sx={{ fontSize: 16 }} />, label: "Anushtanam", color: INDIGO },
          ].map((t, i) => (
            <Box
              key={i}
              onClick={() => setTab(i)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 2,
                py: 1,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: tab === i ? 700 : 500,
                background: tab === i ? t.color : "transparent",
                color: tab === i ? "#fff" : textS,
                borderRight: i === 0 ? `1px solid ${isDark ? "rgba(255,255,255,0.1)" : `${accent}20`}` : "none",
                transition: "all 0.2s",
                userSelect: "none",
              }}
            >
              {t.icon}
              {t.label}
            </Box>
          ))}
        </Box>
      </Box>

      {tab === 0 ? (
        <PurohitamTab user={user} isDark={isDark} />
      ) : (
        <AnushtanamTab user={user} isDark={isDark} />
      )}
    </Box>
  );
}
