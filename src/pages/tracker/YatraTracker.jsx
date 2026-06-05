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
  Rating,
  InputAdornment,
  Collapse,
  Pagination,
  Snackbar,
  Alert,
  Divider,
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
  ExpandMore,
  ExpandLess,
  Star,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";

const COLOR = "#1A5FB0";
const ACCENT = "#D4AF37";
const PER_PAGE = 10;

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

const TYPE_EMOJI = {
  "Family vacation":       "👨‍👩‍👧",
  "Pilgrimage / temple":   "🛕",
  "Work travel":           "💼",
  "Music event / concert": "🎵",
  "Medical":               "🏥",
  "Extended family visit": "🏠",
  "Wedding / celebration": "💒",
  "Festival break":        "🎉",
  "Solo":                  "🧍",
  "Other":                 "✈️",
};

const RATING_LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Unforgettable" };

function formatINR(n) {
  if (!n) return "₹0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// ── Compact Trip Row ──────────────────────────────────────────────────────────
function TripRow({ trip, onDelete, isDark, index }) {
  const [expanded, setExpanded] = useState(false);

  const border    = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const rowBg     = isDark ? "rgba(255,255,255,0.025)" : "#FFFFFF";
  const expandBg  = isDark ? "rgba(255,255,255,0.03)"  : "#FAFAFA";
  const textP     = isDark ? "#F0EDE8" : "#1A1A1A";
  const textS     = isDark ? "#9C9A94" : "#6B6B6B";
  const safeColor = isDark ? "#6AAEE8" : COLOR;

  const nights    = dayjs(trip.to_date).diff(dayjs(trip.from_date), "day");
  const totalCost = (trip.transport || 0) + (trip.stay || 0) + (trip.food || 0) + (trip.other || 0);
  const hasCost   = totalCost > 0;
  const hasNotes  = !!trip.notes;
  const hasDetails = hasCost || hasNotes;

  return (
    <Box
      sx={{
        border: `1px solid ${border}`,
        borderRadius: 2.5,
        background: rowBg,
        mb: 1,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        "&:hover": {
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 16px rgba(0,0,0,0.06)",
        },
      }}
    >
      {/* Main row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: { xs: 1.5, md: 2 },
          py: 1.5,
          gap: { xs: 1, md: 2 },
          cursor: hasDetails ? "pointer" : "default",
          userSelect: "none",
        }}
        onClick={() => hasDetails && setExpanded((p) => !p)}
      >
        {/* Index bubble */}
        <Box
          sx={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: isDark ? "rgba(255,255,255,0.07)" : `${COLOR}12`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: safeColor }}>{index}</Typography>
        </Box>

        {/* Destination + dates */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography
              sx={{ fontSize: 14, fontWeight: 700, color: textP, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: { xs: 130, sm: 260, md: 320 } }}
            >
              {trip.destination}
            </Typography>
            {trip.trip_type && (
              <Chip
                label={`${TYPE_EMOJI[trip.trip_type] || "✈️"} ${trip.trip_type}`}
                size="small"
                sx={{
                  height: 20, fontSize: 10, fontWeight: 600, flexShrink: 0,
                  background: isDark ? "rgba(255,255,255,0.07)" : `${COLOR}0F`,
                  color: safeColor,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : `${COLOR}25`}`,
                }}
              />
            )}
          </Box>
          <Typography sx={{ fontSize: 11, color: textS, mt: 0.3, display: "flex", alignItems: "center", gap: 0.5 }}>
            <Event sx={{ fontSize: 11 }} />
            {dayjs(trip.from_date).format("D MMM")} – {dayjs(trip.to_date).format("D MMM YYYY")}
            <Box component="span" sx={{ mx: 0.5, opacity: 0.4 }}>·</Box>
            {nights} night{nights !== 1 ? "s" : ""}
          </Typography>
        </Box>

        {/* Rating */}
        {trip.rating > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            <Star sx={{ fontSize: 13, color: ACCENT }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{trip.rating}</Typography>
          </Box>
        )}

        {/* Cost */}
        {hasCost && (
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: safeColor, flexShrink: 0, minWidth: 52, textAlign: "right" }}>
            {formatINR(totalCost)}
          </Typography>
        )}

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          {hasDetails && (
            <IconButton size="small" sx={{ color: textS, p: 0.4 }} onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}>
              {expanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(trip); }}
            sx={{ color: textS, p: 0.4, "&:hover": { color: "#D32F2F", bgcolor: "#FFF0F0" } }}
          >
            <Delete sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Expanded details */}
      {hasDetails && (
        <Collapse in={expanded}>
          <Box sx={{ px: { xs: 1.5, md: 2 }, pb: 2, pt: 0.5, background: expandBg, borderTop: `1px solid ${border}` }}>
            {hasCost && (
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: hasNotes ? 1.5 : 0 }}>
                {[
                  { label: "Transport", value: trip.transport, icon: <Commute sx={{ fontSize: 13 }} /> },
                  { label: "Stay",      value: trip.stay,      icon: <Hotel sx={{ fontSize: 13 }} /> },
                  { label: "Food",      value: trip.food,      icon: <Restaurant sx={{ fontSize: 13 }} /> },
                  { label: "Other",     value: trip.other,     icon: <LocalActivity sx={{ fontSize: 13 }} /> },
                ].filter((c) => c.value > 0).map((c) => (
                  <Box key={c.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ color: textS, display: "flex" }}>{c.icon}</Box>
                    <Typography sx={{ fontSize: 11, color: textS }}>{c.label}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: textP, ml: 0.25 }}>{formatINR(c.value)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            {hasNotes && (
              <Typography sx={{ fontSize: 12, color: textS, fontStyle: "italic", lineHeight: 1.7, pl: 0.5, borderLeft: `2px solid ${isDark ? "rgba(255,255,255,0.1)" : COLOR + "30"}` }}>
                "{trip.notes}"
              </Typography>
            )}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

// ── Cache ─────────────────────────────────────────────────────────────────────
let _yatraCache = null;

// ── Main Component ────────────────────────────────────────────────────────────
export default function PravesaPage() {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const [trips, setTrips] = useState(_yatraCache?.trips || []);
  const [loading, setLoading] = useState(_yatraCache === null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

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

  const resetForm = () => setForm({
    destination: "", from_date: dayjs().format("YYYY-MM-DD"),
    to_date: dayjs().add(3, "day").format("YYYY-MM-DD"),
    trip_type: "", notes: "", rating: 0,
    transport: "", stay: "", food: "", other: "",
  });

  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const border    = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const cardBg    = isDark ? "#161616" : "#FFFFFF";
  const textP     = isDark ? "#F0EDE8" : "#1A1A1A";
  const textS     = isDark ? "#9C9A94" : "#6B6B6B";
  const safeColor = isDark ? "#6AAEE8" : COLOR;
  const pageBg    = isDark
    ? "radial-gradient(ellipse 90% 35% at 50% -5%, #1A5FB018 0%, #0A0A0A 65%)"
    : "radial-gradient(ellipse 90% 35% at 50% -5%, #1A5FB010 0%, #F8FAFC 65%)";

  // ── Data ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (force = false) => {
    if (!user) return;
    if (!force && _yatraCache !== null) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("travel_logs").select("*").eq("user_id", user.id)
        .order("from_date", { ascending: false });
      _yatraCache = { trips: data || [] };
      setTrips(data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalTrips  = trips.length;
  const totalNights = trips.reduce((s, t) => s + dayjs(t.to_date).diff(dayjs(t.from_date), "day"), 0);
  const totalSpend  = trips.reduce((s, t) => s + (t.transport || 0) + (t.stay || 0) + (t.food || 0) + (t.other || 0), 0);
  const thisYear    = trips.filter((t) => t.from_date?.startsWith(dayjs().year().toString())).length;
  const avgRating   = trips.filter((t) => t.rating > 0).length
    ? (trips.filter((t) => t.rating > 0).reduce((s, t) => s + t.rating, 0) / trips.filter((t) => t.rating > 0).length).toFixed(1)
    : null;

  // ── Filtering + pagination ────────────────────────────────────────────────
  const uniqueTypes = useMemo(() => ["All", ...Array.from(new Set(trips.map((t) => t.trip_type).filter(Boolean)))], [trips]);

  const filtered = useMemo(() => trips.filter((t) => {
    const matchSearch = !search ||
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      t.notes?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || t.trip_type === filterType;
    return matchSearch && matchType;
  }), [trips, search, filterType]);

  const pageCount  = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset to page 1 on filter change
  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleType   = (v) => { setFilterType(v); setPage(1); };

  // ── Save / Delete ─────────────────────────────────────────────────────────
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
      resetForm();
      setAddOpen(false);
      showSnack("Journey recorded ✓");
      _yatraCache = null;
      await load(true);
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
    _yatraCache = null;
    await load(true);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: safeColor }} thickness={2} size={56} />
      </Box>
    );

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)" },
      "&:hover fieldset": { borderColor: `${COLOR}80` },
      "&.Mui-focused fieldset": { borderColor: COLOR },
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", background: pageBg, pb: 6 }}>
      <Box sx={{ p: { xs: 2, md: "36px 40px" }, maxWidth: 900, mx: "auto" }}>

        {/* ── Header ── */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography sx={{ letterSpacing: 3, textTransform: "uppercase", fontSize: 11, color: safeColor, fontWeight: 700, mb: 0.75 }}>
              Pravesa Tracker
            </Typography>
            <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 400, fontSize: { xs: 28, md: 36 }, color: textP, lineHeight: 1.1 }}>
              Journey Log
            </Typography>
            <Typography sx={{ fontSize: 13, color: textS, mt: 0.75 }}>
              Every journey worth taking is worth remembering.
            </Typography>
          </Box>
          <Button
            variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}
            sx={{
              background: `linear-gradient(135deg, ${COLOR}, #1348A0)`,
              boxShadow: `0 8px 24px ${COLOR}40`, borderRadius: 8,
              px: 3, py: 1.1, textTransform: "none", fontWeight: 600, fontSize: 14,
              "&:hover": { transform: "translateY(-2px)", boxShadow: `0 12px 32px ${COLOR}60` },
              transition: "all 0.3s",
            }}
          >
            Log Trip
          </Button>
        </Box>

        {/* ── Stats ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Trips", value: totalTrips,        color: safeColor, icon: <FlightTakeoff sx={{ fontSize: 18 }} /> },
            { label: "This Year", value: thisYear,      color: "#2E7D32", icon: <Event sx={{ fontSize: 18 }} /> },
            { label: "Nights",    value: totalNights,   color: "#5E35B1", icon: <Nightlight sx={{ fontSize: 18 }} /> },
            { label: "Spent",     value: formatINR(totalSpend), color: ACCENT, icon: <AccountBalanceWallet sx={{ fontSize: 18 }} /> },
            ...(avgRating ? [{ label: "Avg Rating", value: `${avgRating}★`, color: ACCENT, icon: <Star sx={{ fontSize: 18 }} /> }] : []),
          ].map((s, i) => (
            <Grid item xs={6} sm={avgRating ? 2.4 : 3} key={i}>
              <Card sx={{
                border: `1px solid ${border}`, borderRadius: 3, background: cardBg,
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.03)",
              }}>
                <CardContent sx={{ p: "16px !important" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Box sx={{ color: s.color, opacity: 0.8, display: "flex" }}>{s.icon}</Box>
                    <Typography sx={{ fontSize: 11, color: textS, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {s.label}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontFamily: '"Fraunces",serif', fontSize: { xs: 24, md: 28 }, fontWeight: 500, color: textP, lineHeight: 1 }}>
                    {s.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ── Search + Filter ── */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search destinations or notes…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200, ...inputSx }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: textS }} /></InputAdornment>,
            }}
          />
          {uniqueTypes.length > 2 && (
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
              {uniqueTypes.map((t) => (
                <Chip
                  key={t}
                  label={t === "All" ? "All types" : `${TYPE_EMOJI[t] || "✈️"} ${t}`}
                  size="small" onClick={() => handleType(t)}
                  sx={{
                    height: 28, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: filterType === t ? `${COLOR}18` : (isDark ? "rgba(255,255,255,0.05)" : "#F5F5F5"),
                    color: filterType === t ? safeColor : textS,
                    border: `1px solid ${filterType === t ? `${COLOR}40` : border}`,
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* ── Trip List ── */}
        {filtered.length === 0 ? (
          <Card sx={{ border: `2px dashed ${border}`, borderRadius: 3, background: "transparent", boxShadow: "none" }}>
            <CardContent sx={{ textAlign: "center", py: 7 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.05)" : "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                <Flight sx={{ fontSize: 32, color: isDark ? "rgba(255,255,255,0.2)" : "#D1D0CF" }} />
              </Box>
              <Typography sx={{ fontSize: 15, color: textP, fontWeight: 600, mb: 0.75 }}>
                {search || filterType !== "All" ? "No journeys match" : "Your travel map is blank"}
              </Typography>
              <Typography sx={{ fontSize: 13, color: textS, mb: 2.5 }}>
                {search || filterType !== "All" ? "Try adjusting your filters." : "Start logging your adventures."}
              </Typography>
              {!search && filterType === "All" && (
                <Button variant="outlined" startIcon={<Add />} onClick={() => setAddOpen(true)}
                  sx={{ borderColor: border, color: textS, textTransform: "none", borderRadius: 6, px: 3, "&:hover": { background: isDark ? "rgba(255,255,255,0.05)" : "#F5F5F5", borderColor: textP } }}>
                  Log your first trip
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Result count */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography sx={{ fontSize: 12, color: textS, fontWeight: 500 }}>
                {filtered.length} {filtered.length === 1 ? "journey" : "journeys"}
                {pageCount > 1 && ` · page ${page} of ${pageCount}`}
              </Typography>
            </Box>

            {/* Rows */}
            {paginated.map((trip, i) => (
              <TripRow
                key={trip.id}
                trip={trip}
                index={(page - 1) * PER_PAGE + i + 1}
                onDelete={(t) => setTripToDelete(t)}
                isDark={isDark}
              />
            ))}

            {/* Pagination */}
            {pageCount > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={pageCount} page={page} onChange={(_, p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  size="small"
                  sx={{
                    "& .MuiPaginationItem-root": { color: textS, fontSize: 13 },
                    "& .Mui-selected": { background: `${COLOR}18 !important`, color: safeColor, fontWeight: 700 },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ── Add Trip Dialog ── */}
      <Dialog
        open={addOpen} onClose={() => { setAddOpen(false); resetForm(); }}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,0,0,0.1)" } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3, pb: 2 }}>
          <Typography sx={{ fontFamily: '"Fraunces",serif', fontSize: 22, fontWeight: 500, color: textP }}>Log a Journey</Typography>
          <IconButton onClick={() => { setAddOpen(false); resetForm(); }} size="small" sx={{ color: textS }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 0 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
            <TextField
              fullWidth label="Destination" value={form.destination} autoFocus
              onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
              placeholder="e.g. Tirupati, Goa, Hyderabad → Bangalore"
              sx={inputSx}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField fullWidth type="date" label="Departure" value={form.from_date}
                onChange={(e) => setForm((p) => ({ ...p, from_date: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={inputSx}
              />
              <TextField fullWidth type="date" label="Return" value={form.to_date}
                onChange={(e) => setForm((p) => ({ ...p, to_date: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={inputSx}
              />
            </Box>
            <FormControl fullWidth sx={inputSx}>
              <InputLabel>Primary Purpose</InputLabel>
              <Select value={form.trip_type} onChange={(e) => setForm((p) => ({ ...p, trip_type: e.target.value }))} label="Primary Purpose">
                <MenuItem value=""><em>None selected</em></MenuItem>
                {TRIP_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{TYPE_EMOJI[t] || "✈️"} {t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Cost breakdown */}
            <Box sx={{ p: 2, borderRadius: 2.5, border: `1px solid ${border}`, background: isDark ? "rgba(0,0,0,0.2)" : "#FAFAFA" }}>
              <Typography sx={{ fontSize: 11, color: textS, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", mb: 1.75 }}>
                Financial Breakdown
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { field: "transport", icon: <Commute fontSize="small" /> },
                  { field: "stay",      icon: <Hotel fontSize="small" /> },
                  { field: "food",      icon: <Restaurant fontSize="small" /> },
                  { field: "other",     icon: <LocalActivity fontSize="small" /> },
                ].map(({ field, icon }) => (
                  <Grid item xs={6} key={field}>
                    <TextField
                      fullWidth size="small"
                      label={field.charAt(0).toUpperCase() + field.slice(1)}
                      type="number"
                      InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: textS }}>{icon}</InputAdornment> }}
                      value={form[field]}
                      onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                      sx={inputSx}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Rating */}
            <Box>
              <Typography sx={{ fontSize: 11, color: textS, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", mb: 1 }}>
                Overall Experience
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, border: `1px solid ${border}`, borderRadius: 2.5 }}>
                <Rating value={form.rating} onChange={(_, v) => setForm((p) => ({ ...p, rating: v || 0 }))}
                  size="large" sx={{ "& .MuiRating-iconFilled": { color: ACCENT } }} />
                {form.rating > 0 && (
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>{RATING_LABELS[form.rating]}</Typography>
                )}
              </Box>
            </Box>

            <TextField fullWidth multiline rows={3} label="Journal Notes" value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Highlights, memories, or lessons learned…"
              sx={inputSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
          <Button onClick={() => { setAddOpen(false); resetForm(); }} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveTrip} disabled={saving || !form.destination}
            sx={{ background: `linear-gradient(135deg, ${COLOR}, #1348A0)`, borderRadius: 6, px: 3, boxShadow: `0 4px 12px ${COLOR}40`, textTransform: "none", fontWeight: 600 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : "Save Journey"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!tripToDelete} onClose={() => setTripToDelete(null)}
        PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${border}`, background: cardBg, p: 1 } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 400, fontSize: 20, color: textP }}>Remove journey?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: textS, fontSize: 14 }}>
            Delete <strong style={{ color: textP }}>{tripToDelete?.destination}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setTripToDelete(null)} color="inherit" sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={confirmDeleteTrip} variant="contained"
            sx={{ background: "#D32F2F", "&:hover": { background: "#A03535" }, textTransform: "none", boxShadow: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast ── */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
