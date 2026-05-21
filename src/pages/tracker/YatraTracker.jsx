import { useState, useEffect, useCallback } from "react";
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
  Rating,
  InputAdornment,
  Fade,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add,
  Delete,
  Flight,
  Place,
  Search,
  FlightTakeoff,
  Event,
  Nightlight,
  AccountBalanceWallet,
  Commute,
  Hotel,
  Restaurant,
  LocalActivity,
  Close,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";

const COLOR = "#1A5FB0";
const ACCENT = "#D4AF37"; // Subtle gold for premium accents

const TRIP_TYPES = [
  "Family vacation",
  "Pilgrimage / temple",
  "Work travel",
  "Music event / concert",
  "Medical",
  "Extended family visit",
  "Wedding / celebration",
  "Festival break",
  "Solo",
  "Other",
];

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Unforgettable",
};

function formatINR(n) {
  if (!n) return "₹0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function TripCard({ trip, onDelete, isDark }) {
  const safeColor = isDark ? "#6AAEE8" : COLOR;
  const border = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const cardBg = isDark ? "#161616" : "#FFFFFF";
  const textP = isDark ? "#F5F5F5" : "#1A1A1A";
  const textS = isDark ? "#A3A3A3" : "#6B6B6B";
  const shadow = isDark
    ? "0 8px 32px rgba(0,0,0,0.4)"
    : "0 12px 40px rgba(0,0,0,0.03)";

  const totalCost =
    (trip.transport || 0) +
    (trip.stay || 0) +
    (trip.food || 0) +
    (trip.other || 0);
  const nights = dayjs(trip.to_date).diff(dayjs(trip.from_date), "day");

  const costIcons = {
    Transport: <Commute sx={{ fontSize: 14 }} />,
    Stay: <Hotel sx={{ fontSize: 14 }} />,
    Food: <Restaurant sx={{ fontSize: 14 }} />,
    Other: <LocalActivity sx={{ fontSize: 14 }} />,
  };

  return (
    <Card
      sx={{
        border: `1px solid ${border}`,
        borderRadius: 4,
        background: cardBg,
        boxShadow: shadow,
        mb: 3,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: isDark
            ? "0 12px 48px rgba(0,0,0,0.6)"
            : "0 16px 48px rgba(0,0,0,0.06)",
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, "&:last-child": { pb: 3 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${COLOR}15, ${COLOR}30)`,
                border: `1px solid ${COLOR}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Place sx={{ fontSize: 24, color: safeColor }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: textP,
                  letterSpacing: "-0.01em",
                }}
              >
                {trip.destination}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: textS,
                  mt: 0.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Event sx={{ fontSize: 14, opacity: 0.7 }} />
                {dayjs(trip.from_date).format("D MMM")} –{" "}
                {dayjs(trip.to_date).format("D MMM YYYY")}
                <Box component="span" sx={{ mx: 0.5, opacity: 0.5 }}>
                  •
                </Box>
                {nights} night{nights !== 1 ? "s" : ""}
              </Typography>
              {trip.trip_type && (
                <Chip
                  label={trip.trip_type}
                  size="small"
                  sx={{
                    mt: 1,
                    fontSize: 11,
                    fontWeight: 500,
                    height: 22,
                    background: isDark ? "rgba(255,255,255,0.06)" : "#F5F5F5",
                    color: textS,
                    border: `1px solid ${border}`,
                  }}
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {trip.rating > 0 && (
              <Rating
                value={trip.rating}
                readOnly
                size="small"
                sx={{ "& .MuiRating-iconFilled": { color: ACCENT } }}
              />
            )}
            <IconButton
              size="small"
              onClick={() => onDelete(trip)}
              sx={{
                background: isDark ? "rgba(255,255,255,0.05)" : "#F8F8F8",
                "&:hover": { background: "#FFF0F0", color: "#D32F2F" },
                transition: "0.2s",
              }}
            >
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Cost breakdown */}
        {totalCost > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              mb: 2,
              background: isDark ? "rgba(0,0,0,0.2)" : "#FAFAFA",
              p: 1.5,
              borderRadius: 3,
              border: `1px solid ${border}`,
            }}
          >
            {[
              { label: "Transport", value: trip.transport },
              { label: "Stay", value: trip.stay },
              { label: "Food", value: trip.food },
              { label: "Other", value: trip.other },
            ]
              .filter((c) => c.value > 0)
              .map((c) => (
                <Box
                  key={c.label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    pr: 2,
                    borderRight: `1px solid ${border}`,
                    "&:last-of-type": { borderRight: "none" },
                  }}
                >
                  <Box sx={{ color: textS, display: "flex" }}>
                    {costIcons[c.label]}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: textS,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {c.label}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, color: textP }}
                    >
                      {formatINR(c.value)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            <Box
              sx={{
                ml: "auto",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                pl: 2,
                borderLeft: `1px dashed ${border}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: safeColor,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontWeight: 700,
                }}
              >
                Total
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: safeColor }}>
                {formatINR(totalCost)}
              </Typography>
            </Box>
          </Box>
        )}

        {trip.notes && (
          <Typography
            sx={{
              fontSize: 14,
              color: textS,
              fontStyle: "italic",
              lineHeight: 1.6,
              pt: 1,
            }}
          >
            "{trip.notes}"
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

let _yatraCache = null;

export default function PravesaPage() {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const [trips, setTrips] = useState(_yatraCache?.trips || []);
  const [loading, setLoading] = useState(_yatraCache === null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    destination: "",
    from_date: dayjs().format("YYYY-MM-DD"),
    to_date: dayjs().add(3, "day").format("YYYY-MM-DD"),
    trip_type: "",
    notes: "",
    rating: 0,
    transport: "",
    stay: "",
    food: "",
    other: "",
  });

  const resetForm = () => setForm({ destination: "", from_date: dayjs().format("YYYY-MM-DD"), to_date: dayjs().add(3, "day").format("YYYY-MM-DD"), trip_type: "", notes: "", rating: 0, transport: "", stay: "", food: "", other: "" });

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });
  const [tripToDelete, setTripToDelete] = useState(null);

  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const cardBg = isDark ? "#161616" : "#FFFFFF";
  const textP = isDark ? "#F5F5F5" : "#1A1A1A";
  const textS = isDark ? "#A3A3A3" : "#6B6B6B";
  const safeColor = isDark ? "#6AAEE8" : COLOR;

  const load = useCallback(async () => {
    if (!user) return;
    if (_yatraCache !== null) return; // cache warm
    setLoading(true);
    try {
      const { data } = await supabase
        .from("travel_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("from_date", { ascending: false });
      _yatraCache = { trips: data || [] };
      setTrips(data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const saveTrip = async () => {
    if (!form.destination || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("travel_logs").insert({
        user_id: user.id,
        destination: form.destination,
        from_date: form.from_date,
        to_date: form.to_date,
        trip_type: form.trip_type || null,
        notes: form.notes || null,
        rating: form.rating || 0,
        transport: Number(form.transport) || 0,
        stay: Number(form.stay) || 0,
        food: Number(form.food) || 0,
        other: Number(form.other) || 0,
      });
      if (error) throw error;
      setForm({
        destination: "",
        from_date: dayjs().format("YYYY-MM-DD"),
        to_date: dayjs().add(3, "day").format("YYYY-MM-DD"),
        trip_type: "",
        notes: "",
        rating: 0,
        transport: "",
        stay: "",
        food: "",
        other: "",
      });
      setAddOpen(false);
      showSnack("Journey recorded.");
      load();
    } catch {
      showSnack("Failed to save journey.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteTrip = async () => {
    const id = tripToDelete?.id;
    setTripToDelete(null);
    if (!id) return;
    const { error } = await supabase.from("travel_logs").delete().eq("id", id);
    if (error) { showSnack("Failed to delete.", "error"); return; }
    showSnack("Journey removed.");
    load();
  };

  const filtered = trips.filter(
    (t) =>
      !search ||
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      t.notes?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalTrips = trips.length;
  const totalNights = trips.reduce(
    (s, t) => s + dayjs(t.to_date).diff(dayjs(t.from_date), "day"),
    0,
  );
  const totalSpend = trips.reduce(
    (s, t) =>
      s + (t.transport || 0) + (t.stay || 0) + (t.food || 0) + (t.other || 0),
    0,
  );
  const thisYear = trips.filter((t) =>
    t.from_date?.startsWith(dayjs().year().toString()),
  ).length;

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress sx={{ color: safeColor }} thickness={2} size={60} />
      </Box>
    );

  return (
    <Box
      sx={{
        p: { xs: 2, md: "40px" },
        maxWidth: 1000,
        mx: "auto",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 5,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              letterSpacing: 3,
              textTransform: "uppercase",
              fontSize: 11,
              color: safeColor,
              fontWeight: 700,
              mb: 1,
            }}
          >
            Pravesa Tracker
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Fraunces","Lora",serif',
              fontWeight: 400,
              fontSize: { xs: 32, md: 40 },
              color: textP,
              lineHeight: 1.1,
            }}
          >
            Journey Log
          </Typography>
          <Typography
            sx={{ fontSize: 15, color: textS, mt: 1, fontWeight: 300 }}
          >
            Every journey worth taking is worth remembering.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddOpen(true)}
          sx={{
            background: `linear-gradient(135deg, ${COLOR}, #1348A0)`,
            boxShadow: `0 8px 24px ${COLOR}40`,
            borderRadius: 8,
            px: 3,
            py: 1.2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 15,
            transition: "all 0.3s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 12px 32px ${COLOR}60`,
            },
          }}
        >
          Log Trip
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          {
            label: "Total Trips",
            value: totalTrips,
            color: safeColor,
            icon: <FlightTakeoff />,
          },
          {
            label: "This Year",
            value: thisYear,
            color: "#2E7D32",
            icon: <Event />,
          },
          {
            label: "Nights Away",
            value: totalNights,
            color: "#5E35B1",
            icon: <Nightlight />,
          },
          {
            label: "Total Spent",
            value: formatINR(totalSpend),
            color: ACCENT,
            icon: <AccountBalanceWallet />,
          },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card
              sx={{
                border: `1px solid ${border}`,
                borderRadius: 4,
                background: cardBg,
                boxShadow: isDark
                  ? "0 4px 20px rgba(0,0,0,0.2)"
                  : "0 4px 24px rgba(0,0,0,0.02)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -15,
                  right: -15,
                  opacity: 0.05,
                  transform: "scale(2)",
                  color: s.color,
                }}
              >
                {s.icon}
              </Box>
              <CardContent sx={{ p: "20px !important" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Box sx={{ color: s.color, display: "flex", opacity: 0.8 }}>
                    {s.icon}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: textS,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {s.label}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Fraunces",serif',
                    fontSize: { xs: 28, md: 32 },
                    fontWeight: 500,
                    color: textP,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search destinations, memories, or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              background: cardBg,
              boxShadow: isDark
                ? "0 4px 20px rgba(0,0,0,0.2)"
                : "0 8px 32px rgba(0,0,0,0.03)",
              "& fieldset": { borderColor: border },
              "&:hover fieldset": { borderColor: COLOR },
              "&.Mui-focused fieldset": { borderColor: COLOR, borderWidth: 2 },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: textS }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Trip list */}
      <Fade in timeout={500}>
        <Box>
          {filtered.length === 0 ? (
            <Card
              sx={{
                border: `2px dashed ${border}`,
                borderRadius: 4,
                background: "transparent",
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 8 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: isDark ? "rgba(255,255,255,0.05)" : "#F5F5F5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <Flight
                    sx={{
                      fontSize: 40,
                      color: isDark ? "rgba(255,255,255,0.2)" : "#D1D0CF",
                    }}
                  />
                </Box>
                <Typography
                  sx={{ fontSize: 16, color: textP, fontWeight: 500, mb: 1 }}
                >
                  {search ? "No journeys found" : "Your travel map is blank"}
                </Typography>
                <Typography sx={{ fontSize: 14, color: textS, mb: 3 }}>
                  {search
                    ? "Try adjusting your search terms."
                    : "Start logging your adventures to see your stats grow."}
                </Typography>
                {!search && (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setAddOpen(true)}
                    sx={{
                      borderColor: border,
                      color: textP,
                      textTransform: "none",
                      borderRadius: 6,
                      px: 3,
                      "&:hover": {
                        background: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "#F5F5F5",
                        borderColor: textP,
                      },
                    }}
                  >
                    Log your first trip
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filtered.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={(trip) => setTripToDelete(trip)}
                isDark={isDark}
              />
            ))
          )}
        </Box>
      </Fade>

      {/* Add trip dialog */}
      <Dialog
        open={addOpen}
        onClose={() => { setAddOpen(false); resetForm(); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: cardBg,
            border: `1px solid ${border}`,
            boxShadow: isDark
              ? "0 24px 64px rgba(0,0,0,0.6)"
              : "0 24px 64px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            pb: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Fraunces",serif',
              fontSize: 24,
              fontWeight: 500,
              color: textP,
            }}
          >
            Log a Journey
          </Typography>
          <IconButton
            onClick={() => { setAddOpen(false); resetForm(); }}
            size="small"
            sx={{ color: textS }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 0 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <TextField
              fullWidth
              label="Destination"
              value={form.destination}
              onChange={(e) =>
                setForm((p) => ({ ...p, destination: e.target.value }))
              }
              autoFocus
              placeholder="e.g. Tirupati, Goa, Hyderabad → Bangalore"
              variant="outlined"
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Departure"
                value={form.from_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, from_date: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="date"
                label="Return"
                value={form.to_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, to_date: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Primary Purpose</InputLabel>
              <Select
                value={form.trip_type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, trip_type: e.target.value }))
                }
                label="Primary Purpose"
              >
                <MenuItem value="">
                  <em>None selected</em>
                </MenuItem>
                {TRIP_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${border}`,
                background: isDark ? "rgba(0,0,0,0.2)" : "#FAFAFA",
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color: textS,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  mb: 2,
                }}
              >
                Financial Breakdown
              </Typography>
              <Grid container spacing={2}>
                {[
                  { field: "transport", icon: <Commute fontSize="small" /> },
                  { field: "stay", icon: <Hotel fontSize="small" /> },
                  { field: "food", icon: <Restaurant fontSize="small" /> },
                  { field: "other", icon: <LocalActivity fontSize="small" /> },
                ].map(({ field, icon }) => (
                  <Grid item xs={6} key={field}>
                    <TextField
                      fullWidth
                      size="small"
                      label={field.charAt(0).toUpperCase() + field.slice(1)}
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment
                            position="start"
                            sx={{ color: textS }}
                          >
                            {icon}
                          </InputAdornment>
                        ),
                      }}
                      value={form[field]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [field]: e.target.value }))
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  color: textS,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  mb: 1,
                }}
              >
                Overall Experience
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  border: `1px solid ${border}`,
                  borderRadius: 3,
                }}
              >
                <Rating
                  value={form.rating}
                  onChange={(_, v) =>
                    setForm((p) => ({ ...p, rating: v || 0 }))
                  }
                  size="large"
                  sx={{ "& .MuiRating-iconFilled": { color: ACCENT } }}
                />
                {form.rating > 0 && (
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 500, color: ACCENT }}
                  >
                    {RATING_LABELS[form.rating]}
                  </Typography>
                )}
              </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Journal Notes"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Highlights, memories, or lessons learned..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => { setAddOpen(false); resetForm(); }}
            sx={{ color: textS, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveTrip}
            disabled={saving || !form.destination}
            sx={{
              background: `linear-gradient(135deg, ${COLOR}, #1348A0)`,
              borderRadius: 6,
              px: 3,
              boxShadow: `0 4px 12px ${COLOR}40`,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save Journey"
            )}
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

      <Dialog
        open={!!tripToDelete}
        onClose={() => setTripToDelete(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 400, fontSize: 20 }}>
          Remove journey?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
            Delete <strong>{tripToDelete?.destination}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setTripToDelete(null)} color="inherit" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={confirmDeleteTrip} variant="contained" sx={{ background: "#D32F2F", "&:hover": { background: "#A03535" }, textTransform: "none", boxShadow: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
