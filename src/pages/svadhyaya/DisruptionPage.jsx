import { useState } from "react";
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
} from "@mui/material";
import { Waves, BeachAccess, CheckCircleOutline } from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";

const DISRUPTION_REASONS = [
  { id: "wedding", icon: "💒", label: "Wedding / celebration" },
  { id: "travel", icon: "✈️", label: "Travel" },
  { id: "illness", icon: "🤒", label: "Illness" },
  { id: "family", icon: "👨‍👩‍👧", label: "Family emergency" },
  { id: "work", icon: "💼", label: "Work crisis" },
  { id: "festival", icon: "🎊", label: "Festival / occasion" },
  { id: "guests", icon: "🏠", label: "Guests at home" },
  { id: "power", icon: "⚡", label: "Power / connectivity" },
  { id: "other", icon: "🌊", label: "Other" },
];

const VAC_TYPES = [
  { id: "family_vac", icon: "🏖", label: "Family vacation" },
  { id: "pilgrimage", icon: "🙏", label: "Pilgrimage / temple trip" },
  { id: "extended_family", icon: "👨‍👩‍👧‍👦", label: "Extended family visit" },
  { id: "music_event", icon: "🎵", label: "Music event / concert" },
  { id: "work_travel", icon: "💼", label: "Work travel" },
  { id: "medical", icon: "🏥", label: "Medical / recovery" },
  { id: "wedding_trip", icon: "💒", label: "Wedding / celebration trip" },
  {
    id: "festival_break",
    icon: "🎊",
    label: "Festival break (Ugadi, Diwali...)",
  },
  { id: "custom", icon: "✏️", label: "Custom" },
];

const VAC_MODES = [
  {
    id: "full",
    label: "Full pause",
    desc: "All habits suspended · streaks frozen · goals paused",
  },
  {
    id: "sacred",
    label: "Sacred only",
    desc: "Minimum Anushthanam, riyaz, walk only · everything else paused",
    recommended: true,
  },
  {
    id: "flexible",
    label: "Flexible",
    desc: "All habits optional · no penalties · full trust",
  },
];

const SACRED_MINIMUMS = [
  { icon: "🪔", label: "Anushthanam", min: "5 min Gayatri + deepam" },
  { icon: "🎵", label: "Naada Saadhana", min: "2 min voice culture" },
  { icon: "🚶", label: "Vyaayamam", min: "10 min gentle walk" },
];

export default function DisruptionPage() {
  const { user } = useAuth();
  const { heroColor, mode } = useThemeMode();
  const isDark = mode === "dark";

  const [tab, setTab] = useState("disrupt");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [vacType, setVacType] = useState("");
  const [vacMode, setVacMode] = useState("sacred");
  const [vacFrom, setVacFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [vacTo, setVacTo] = useState(
    dayjs().add(4, "day").format("YYYY-MM-DD"),
  );
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Theme tokens
  const bg = isDark
    ? `radial-gradient(ellipse 90% 35% at 50% -5%, ${heroColor}08 0%, #0D0C0A 65%)`
    : `radial-gradient(ellipse 90% 35% at 50% -5%, ${heroColor}10 0%, #F8FAFC 65%)`;
  const cardBg = isDark ? "#1A1916" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const textP = isDark ? "#F0EDE8" : "#0f172a";
  const textS = isDark ? "#9C9A94" : "#64748b";

  // Unselected card border — visible in both modes
  const unselBorder = isDark ? "rgba(255,255,255,0.10)" : "#E2E8F0";

  const markDisrupted = async () => {
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const today = dayjs().format("YYYY-MM-DD");
      await supabase.from("days").upsert(
        {
          user_id: user.id,
          day_date: today,
          disrupted: true,
          disruption_mode: "holiday",
          disruption_reason: reason,
          disruption_note: note || null,
        },
        { onConflict: "user_id,day_date" },
      );
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveVacation = async () => {
    if (!vacType) {
      setError("Please select a vacation type.");
      return;
    }
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
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done)
    return (
      <Box
        sx={{
          p: { xs: 2, md: 3 },
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
          sx={{
            fontFamily: '"Fraunces",serif',
            fontWeight: 300,
            fontSize: 28,
            color: textP,
            mb: 1,
          }}
        >
          Noted.
        </Typography>
        <Typography
          sx={{ color: textS, mb: 4, lineHeight: 1.8, maxWidth: 380 }}
        >
          {tab === "disrupt"
            ? "Your streak is preserved. Sacred minimums activated. Come back when you can."
            : "Vacation marked. Your streaks are frozen and will resume when you return."}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            setDone(false);
            setReason("");
            setNote("");
          }}
          sx={{
            borderColor: heroColor,
            color: heroColor,
            textTransform: "none",
            px: 3,
          }}
        >
          Mark another
        </Button>
      </Box>
    );

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
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          sx={{
            letterSpacing: 2,
            textTransform: "uppercase",
            fontSize: 10,
            color: heroColor,
            fontWeight: 600,
          }}
        >
          Life management
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Fraunces",serif',
            fontWeight: 300,
            fontSize: 30,
            color: textP,
            lineHeight: 1.2,
            mt: 0.25,
          }}
        >
          Life happened
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 14, color: textS }}>
          Mark today honestly. Your streak and goals adjust. You are always in
          control.
        </Typography>
      </Box>

      {/* Tab switcher */}
      <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
        {[
          {
            id: "disrupt",
            icon: <Waves sx={{ fontSize: 15 }} />,
            label: "Today is disrupted",
          },
          {
            id: "vacation",
            icon: <BeachAccess sx={{ fontSize: 15 }} />,
            label: "Set vacation / time off",
          },
        ].map((t) => (
          <Chip
            key={t.id}
            icon={t.icon}
            label={t.label}
            onClick={() => setTab(t.id)}
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
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── DISRUPTED TAB ── */}
      {tab === "disrupt" && (
        <Card
          sx={{
            border: `1px solid ${border}`,
            borderRadius: 3,
            background: cardBg,
            boxShadow: "none",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontSize: 10,
                color: textS,
                fontWeight: 700,
                display: "block",
                mb: 1.5,
              }}
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
                      background:
                        reason === r.id
                          ? `${heroColor}12`
                          : isDark
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(0,0,0,0.01)",
                      transition: "all 0.15s",
                      "&:hover": {
                        borderColor: `${heroColor}60`,
                        background: `${heroColor}08`,
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: 20, mb: 0.5 }}>
                      {r.icon}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 11,
                        color: reason === r.id ? heroColor : textS,
                        fontWeight: reason === r.id ? 600 : 400,
                      }}
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
              placeholder="A few words about today..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{ mb: 2.5 }}
            />

            <Divider sx={{ borderColor: border, mb: 2 }} />

            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontSize: 10,
                color: textS,
                fontWeight: 700,
                display: "block",
                mb: 1.5,
              }}
            >
              Sacred habits — minimum versions activated
            </Typography>
            {SACRED_MINIMUMS.map((h) => (
              <Box
                key={h.label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 1.5,
                  py: 0.9,
                  borderRadius: 2,
                  mb: 0.75,
                  background: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
                  border: `1px solid ${border}`,
                }}
              >
                <Typography variant="body2" sx={{ color: textS, fontSize: 13 }}>
                  {h.icon} {h.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: heroColor, fontWeight: 600 }}
                >
                  {h.min}
                </Typography>
              </Box>
            ))}

            <Button
              variant="contained"
              fullWidth
              onClick={markDisrupted}
              disabled={loading}
              sx={{
                mt: 2.5,
                py: 1.3,
                background: heroColor,
                "&:hover": { background: heroColor, opacity: 0.88 },
                boxShadow: "none",
                textTransform: "none",
                fontSize: 13,
                borderRadius: 2,
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Mark day as disrupted · preserve streak"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── VACATION TAB ── */}
      {tab === "vacation" && (
        <Card
          sx={{
            border: `1px solid ${border}`,
            borderRadius: 3,
            background: cardBg,
            boxShadow: "none",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontSize: 10,
                color: textS,
                fontWeight: 700,
                display: "block",
                mb: 1.5,
              }}
            >
              Type of time off
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2.5 }}>
              {VAC_TYPES.map((v) => (
                <Grid item xs={6} sm={4} key={v.id}>
                  <Box
                    onClick={() => setVacType(v.id)}
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      cursor: "pointer",
                      textAlign: "center",
                      border: `1.5px solid ${vacType === v.id ? heroColor : unselBorder}`,
                      background:
                        vacType === v.id
                          ? `${heroColor}12`
                          : isDark
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(0,0,0,0.01)",
                      transition: "all 0.15s",
                      "&:hover": {
                        borderColor: `${heroColor}60`,
                        background: `${heroColor}08`,
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: 18, mb: 0.25 }}>
                      {v.icon}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 10,
                        color: vacType === v.id ? heroColor : textS,
                        fontWeight: vacType === v.id ? 600 : 400,
                      }}
                    >
                      {v.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
              <TextField
                fullWidth
                type="date"
                label="From"
                value={vacFrom}
                onChange={(e) => setVacFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <TextField
                fullWidth
                type="date"
                label="To"
                value={vacTo}
                onChange={(e) => setVacTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Box>

            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontSize: 10,
                color: textS,
                fontWeight: 700,
                display: "block",
                mb: 1.5,
              }}
            >
              Choose mode
            </Typography>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={vacMode}
                onChange={(e) => setVacMode(e.target.value)}
              >
                {VAC_MODES.map((m) => (
                  <Box
                    key={m.id}
                    onClick={() => setVacMode(m.id)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      mb: 0.75,
                      cursor: "pointer",
                      border: `1.5px solid ${vacMode === m.id ? heroColor : unselBorder}`,
                      background:
                        vacMode === m.id
                          ? `${heroColor}10`
                          : isDark
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(0,0,0,0.01)",
                      transition: "all 0.15s",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Radio
                        value={m.id}
                        size="small"
                        sx={{
                          p: 0,
                          color: vacMode === m.id ? heroColor : undefined,
                          "&.Mui-checked": { color: heroColor },
                        }}
                      />
                      <Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, color: textP }}
                          >
                            {m.label}
                          </Typography>
                          {m.recommended && (
                            <Chip
                              label="Recommended"
                              size="small"
                              sx={{
                                fontSize: 9,
                                height: 18,
                                background: `${heroColor}20`,
                                color: heroColor,
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: textS }}>
                          {m.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </RadioGroup>
            </FormControl>

            <Button
              variant="contained"
              fullWidth
              onClick={saveVacation}
              disabled={loading}
              sx={{
                mt: 2.5,
                py: 1.3,
                background: heroColor,
                "&:hover": { background: heroColor, opacity: 0.88 },
                boxShadow: "none",
                textTransform: "none",
                fontSize: 13,
                borderRadius: 2,
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Save vacation · freeze streaks"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
