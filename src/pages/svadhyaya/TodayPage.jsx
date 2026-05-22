import React, { useState, useEffect, useCallback, useMemo } from "react";
import MandalaSVG from "../../components/shared/MandalaSVG";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Fade,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Slide,
  useMediaQuery,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  Lock,
  Sync,
  Add,
  Remove,
  WbSunny,
  Nightlight,
  WavingHand,
  BeachAccess,
  Close,
  SentimentSatisfiedAlt,
  Delete,
  AutoAwesome,
  Flag,
  LinkOutlined,
  ReportProblem,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { usePanchang } from "../../hooks/usePanchang";
import { QUOTES, getAllQuotesAsync } from "../../lib/quotes";
import { bustLakshyaSiddhisCache } from "../../hooks/useLakshyaSiddhis";
import dayjs from "dayjs";
import { ASHTA_SIDDHI_SCALE } from "../../components/shared/AreaComponents";

// ── CONSTANTS ──────────────────────────────────────────────────────────────────

const DEFAULT_SACRED = [
  {
    id: "anushthanam",
    label: "Anushthanam",
    emoji: "🪔",
    locked: true,
    deep: true,
    readOnly: true,
    navTo: "/tracker/sacred",
  },
  {
    id: "saadhana",
    label: "Naada Saadhana",
    emoji: "🎵",
    locked: true,
    readOnly: true,
  },
  {
    id: "walk",
    label: "Vyaayamam",
    emoji: "🏃",
    locked: true,
    readOnly: true,
  },
  {
    id: "reading",
    label: "Pustaka Pathanam",
    emoji: "📖",
    locked: true,
    readOnly: true,
  },
  {
    id: "eat_healthy",
    label: "Eat healthy (80% full)",
    emoji: "🥗",
    locked: true,
    deep: true,
  },
  {
    id: "sleep_healthy",
    label: "Sleep healthy",
    emoji: "🌙",
    locked: true,
    deep: true,
  },
];

const DEFAULT_CORE = [
  {
    id: "office",
    label: "Vritti",
    emoji: "🚀",
    locked: true,
    readOnly: true,
  },
  {
    id: "vidya",
    label: "Vidya",
    emoji: "📚",
    locked: true,
    readOnly: true,
  },
];

const DEFAULT_EVENING = [
  {
    id: "saayam_sandhya",
    label: "Sāyam Sandhyā",
    emoji: "🪔",
    locked: true,
    deep: true,
  },
  {
    id: "dinner_before_8",
    label: "Dinner before 8",
    emoji: "🍽️",
    locked: true,
    deep: true,
  },
  {
    id: "next_day_prep",
    label: "Preparing for next day",
    emoji: "📋",
    locked: true,
    deep: true,
  },
  {
    id: "update_trackers",
    label: "Update trackers",
    emoji: "📊",
    locked: true,
    deep: true,
  },
];

// Weekend = Saturday (6) or Sunday (0)
const isWeekendDay = (d = dayjs()) => d.day() === 0 || d.day() === 6;

// ── CLOCK ──────────────────────────────────────────────────────────────────────
function useRunningClock() {
  const [t, setT] = useState(dayjs().format("hh:mm:ss A"));
  useEffect(() => {
    const i = setInterval(() => setT(dayjs().format("hh:mm:ss A")), 1000);
    return () => clearInterval(i);
  }, []);
  return t;
}

// ── SVG ────────────────────────────────────────────────────────────────────────

// Dharmachakra — 8-spoked wheel, bold strokes, fully visible in dark mode
function KalachakraSVG({ size = 20, color = "#A65D2E" }) {
  const CX = 32, CY = 32;
  const spokeAngles = Array.from({ length: 8 }, (_, i) => (i * 45 * Math.PI) / 180);

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Outer rim — bold */}
      <circle cx={CX} cy={CY} r="27" stroke={color} strokeWidth="3.5" opacity="0.9" />

      {/* Subtle inner track */}
      <circle cx={CX} cy={CY} r="20" stroke={color} strokeWidth="0.8" opacity="0.35" strokeDasharray="2 3" />

      {/* 8 spokes */}
      {spokeAngles.map((angle, i) => (
        <line
          key={i}
          x1={CX + 10 * Math.cos(angle)}
          y1={CY + 10 * Math.sin(angle)}
          x2={CX + 23 * Math.cos(angle)}
          y2={CY + 23 * Math.sin(angle)}
          stroke={color}
          strokeWidth="2.8"
          strokeLinecap="round"
          opacity="0.9"
        />
      ))}

      {/* Lotus petal tips at rim — between spokes */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = ((i * 45 + 22.5) * Math.PI) / 180;
        const tx = CX + 22 * Math.cos(angle);
        const ty = CY + 22 * Math.sin(angle);
        return (
          <ellipse
            key={`p${i}`}
            cx={tx} cy={ty}
            rx="2" ry="3.5"
            fill={color} opacity="0.5"
            transform={`rotate(${i * 45 + 22.5}, ${tx}, ${ty})`}
          />
        );
      })}

      {/* Hub outer ring */}
      <circle cx={CX} cy={CY} r="10" stroke={color} strokeWidth="2.5" opacity="0.9" />

      {/* Hub fill */}
      <circle cx={CX} cy={CY} r="6.5" fill={color} opacity="0.92" />

      {/* Center highlight dot */}
      <circle cx={CX} cy={CY} r="2.5" fill="white" opacity="0.65" />
    </svg>
  );
}

// ── PANCHANGAM ─────────────────────────────────────────────────────────────────
function PanchangamCard({ data, loading, heroColor, isDark }) {
  const clock = useRunningClock();
  const cardBg = isDark ? "#1A1916" : "#FCFBF9";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";

  const fields = data
    ? [
        { label: "Samvatsara", value: data.samvatsara || "—" },
        { label: "Masam", value: data.masam || "—" },
        { label: "Tithi", value: data.tithi || "—" },
        { label: "Paksham", value: data.paksha || "—" },
        { label: "Varam", value: data.varam || "—" },
        { label: "Nakshatram", value: data.nakshatra || "—" },
        { label: "Ayana", value: data.ayana || "—" },
        { label: "Ritu", value: data.ritu || "—" },
      ]
    : [];

  return (
    <Card
      sx={{
        mb: 2.5,
        border: `1px solid ${border}`,
        borderRadius: 3,
        background: cardBg,
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: "0 !important" }}>
        {/* ── Header ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            pt: 1.75,
            pb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: `${heroColor}12`,
                border: `1px solid ${heroColor}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <KalachakraSVG size={16} color={heroColor} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: 9,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: textS,
                  fontWeight: 700,
                }}
              >
                Panchangam · Hyderabad
              </Typography>
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: textP,
                  fontWeight: 500,
                  lineHeight: 1.3,
                  fontFamily: '"Lora","Fraunces",serif',
                }}
              >
                {data?.varam ? `${data.varam} · ` : ""}
                {dayjs().format("D MMMM YYYY")}
              </Typography>
            </Box>
          </Box>
          <Typography
            sx={{
              fontVariantNumeric: "tabular-nums",
              fontSize: 17,
              fontWeight: 700,
              color: heroColor,
              letterSpacing: 1,
              fontFamily: "monospace",
            }}
          >
            {clock}
          </Typography>
        </Box>

        {/* ── Fields ── */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pb: 2.5 }}>
            <CircularProgress size={16} sx={{ color: heroColor }} />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(4, 1fr)",
              },
              gap: 0,
              borderTop: `1px solid ${border}`,
              mx: 2.5,
              mb: 1.75,
              pt: 1.5,
            }}
          >
            {fields.map(({ label, value }) => (
              <Box key={label} sx={{ pr: 2, pb: 1.25 }}>
                <Typography
                  sx={{
                    fontSize: 8.5,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: textS,
                    fontWeight: 700,
                    display: "block",
                    mb: 0.35,
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontFamily: '"Lora","Fraunces",serif',
                    color: textP,
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function CompletionDialog({
  open,
  item,
  onConfirm,
  onClose,
  heroColor,
  isDark,
  anshSiddhiId,   // set when this item is a DB-backed ansh linked to a siddhi
}) {
  const [minutes, setMinutes] = useState(60);
  const [satisfaction, setSatisfaction] = useState(4);
  const [markDone, setMarkDone] = useState(false);

  if (!item) return null;
  const currentSiddhi = ASHTA_SIDDHI_SCALE.find((s) => s.value === satisfaction);

  const fmtTime = (m) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  };
  const QUICK_TIMES = [10, 20, 30, 45, 60, 90, 120, 180];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          background: isDark ? "#1A1916" : "#FFFFFF",
          borderRadius: 3,
          p: 1,
          width: "100%",
          maxWidth: 340,
        },
      }}
    >
      <DialogContent sx={{ textAlign: "center", p: 3 }}>
        <Typography sx={{ fontSize: 40, mb: 1 }}>
          {item.emoji || "🎯"}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Fraunces",serif',
            fontSize: 20,
            color: isDark ? "#F0EDE8" : "#2C2C2C",
            mb: 0.5,
          }}
        >
          {item.label}
        </Typography>
        <Typography
          sx={{ fontSize: 13, color: isDark ? "#9C9A94" : "#5F5F5F", mb: 4 }}
        >
          Log your deep work metrics.
        </Typography>

        <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: heroColor, mb: 1.5 }}>
          Time Invested
        </Typography>
        {/* Quick-select chips */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center", mb: 2 }}>
          {QUICK_TIMES.map((m) => (
            <Box
              key={m}
              onClick={() => setMinutes(m)}
              sx={{
                px: 1.25, py: 0.4, borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600,
                border: `1px solid ${heroColor}60`,
                background: minutes === m ? heroColor : "transparent",
                color: minutes === m ? "#fff" : heroColor,
                transition: "all 0.15s",
              }}
            >
              {fmtTime(m)}
            </Box>
          ))}
        </Box>
        {/* Fine-tune ±10 min */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 3 }}>
          <IconButton
            onClick={() => setMinutes((p) => Math.max(10, p - 10))}
            sx={{ border: `1px solid ${heroColor}40`, color: heroColor, width: 36, height: 36 }}
          >
            <Remove fontSize="small" />
          </IconButton>
          <Typography sx={{ fontSize: 22, fontWeight: 600, minWidth: 72, textAlign: "center", color: heroColor }}>
            {fmtTime(minutes)}
          </Typography>
          <IconButton
            onClick={() => setMinutes((p) => p + 10)}
            sx={{ border: `1px solid ${heroColor}40`, color: heroColor, width: 36, height: 36 }}
          >
            <Add fontSize="small" />
          </IconButton>
        </Box>

        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: heroColor,
            mb: 1,
          }}
        >
          Resonance (Ashta Siddhi)
        </Typography>
        <Typography sx={{ fontSize: 28, mb: 0.5 }}>
          {currentSiddhi?.emoji}
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: isDark ? "#F0EDE8" : "#2C2C2C",
          }}
        >
          {currentSiddhi?.name}
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: isDark ? "#9C9A94" : "#5F5F5F", mb: 2 }}
        >
          {currentSiddhi?.label}
        </Typography>

        <Slider
          value={satisfaction}
          min={1}
          max={8}
          step={1}
          onChange={(e, v) => setSatisfaction(v)}
          sx={{
            color: heroColor,
            "& .MuiSlider-thumb": { width: 20, height: 20 },
            mb: 2,
          }}
        />

        {/* Mark as permanently done — only shown for ansh items linked to a Siddhi */}
        {anshSiddhiId && (
          <FormControlLabel
            control={
              <Checkbox
                checked={markDone}
                onChange={(e) => setMarkDone(e.target.checked)}
                size="small"
                sx={{ color: heroColor, "&.Mui-checked": { color: heroColor } }}
              />
            }
            label={
              <Typography sx={{ fontSize: 12, color: isDark ? "#9C9A94" : "#5F5F5F" }}>
                Mark this task as <strong>permanently done</strong> — advances milestone progress
              </Typography>
            }
            sx={{ mt: 1, mb: 0, textAlign: "left" }}
          />
        )}

        <Button
          variant="contained"
          fullWidth
          onClick={() => onConfirm(item, minutes / 60, satisfaction, markDone)}
          sx={{
            background: heroColor,
            "&:hover": { background: heroColor, opacity: 0.9 },
            py: 1.5,
            borderRadius: 2,
            mt: 2,
          }}
        >
          Complete Session
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ── ADD TASK DIALOG ───────────────────────────────────────────────────────────
function AddTaskDialog({
  open,
  section,
  onAdd,
  onClose,
  heroColor,
  isDark,
  lakshyas,
}) {
  const [label, setLabel] = useState("");
  const [lakshyaId, setLakshyaId] = useState("");
  const [siddhiId, setSiddhiId] = useState("");
  const [isDeep, setIsDeep] = useState(false);
  const bg = isDark ? "#1A1916" : "#FCFBF9";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#D1D0CF";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const names = {
    sacred: "Sacred Foundation",
    core: "Core Task",
    evening: "Wind Down",
  };

  const handleLakshyaChange = (id) => {
    setLakshyaId(id);
    setSiddhiId("");
  };

  const activeSiddhis = lakshyaId
    ? (lakshyas.find((l) => l.id === lakshyaId)?.siddhis || []).filter(
        (s) => s.status !== "completed",
      )
    : [];

  const handle = () => {
    if (!label.trim()) return;
    const chosenLakshya = lakshyas.find((l) => l.id === lakshyaId);
    const chosenSiddhi = activeSiddhis.find((s) => s.id === siddhiId);
    onAdd({
      label: label.trim(),
      lakshya_id: lakshyaId || null,
      lakshyaTitle: chosenLakshya?.title || null,
      siddhi_id: siddhiId || null,
      siddhiTitle: chosenSiddhi?.title || null,
      deep: isDeep || undefined,
    });
    setLabel("");
    setLakshyaId("");
    setSiddhiId("");
    setIsDeep(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${border}`,
          boxShadow: "none",
          background: bg,
        },
      }}
    >
      <DialogContent sx={{ p: "24px 28px !important" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 9,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: textS,
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              Add to {names[section]}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Lora","Fraunces",serif',
                fontSize: 17,
                fontWeight: 600,
                color: textP,
              }}
            >
              New task
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: textS }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <TextField
          autoFocus
          fullWidth
          label="Task name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handle()}
          size="small"
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth size="small" sx={{ mb: lakshyaId ? 1.5 : 2.5 }}>
          <InputLabel>Link to Lakshya (optional)</InputLabel>
          <Select
            value={lakshyaId}
            onChange={(e) => handleLakshyaChange(e.target.value)}
            label="Link to Lakshya (optional)"
          >
            <MenuItem value="">
              <em>No link</em>
            </MenuItem>
            {lakshyas.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                <Box>
                  <Typography sx={{ fontSize: 13 }}>{l.title}</Typography>
                  {l.pillar && (
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: textS,
                        textTransform: "capitalize",
                      }}
                    >
                      {l.pillar}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Siddhi dropdown — only visible once a Lakshya is chosen */}
        {lakshyaId && (
          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <InputLabel>Link to Milestone (optional)</InputLabel>
            <Select
              value={siddhiId}
              onChange={(e) => setSiddhiId(e.target.value)}
              label="Link to Milestone (optional)"
            >
              <MenuItem value="">
                <em>No milestone</em>
              </MenuItem>
              {activeSiddhis.length === 0 ? (
                <MenuItem disabled>
                  <Typography
                    sx={{ fontSize: 12, fontStyle: "italic", color: textS }}
                  >
                    No active milestones on this goal
                  </Typography>
                </MenuItem>
              ) : (
                activeSiddhis.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Typography sx={{ fontSize: 13 }}>{s.title}</Typography>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        )}

        <Box
          onClick={() => setIsDeep((p) => !p)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            border: `1px solid ${isDeep ? heroColor + "50" : border}`,
            background: isDeep ? `${heroColor}08` : "transparent",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: isDeep ? heroColor : textP,
                lineHeight: 1.3,
              }}
            >
              Deep work
            </Typography>
            <Typography sx={{ fontSize: 10, color: textS, lineHeight: 1.4 }}>
              Log hours & Ashta Siddhi on completion
            </Typography>
          </Box>
          <Switch
            size="small"
            checked={isDeep}
            onChange={() => setIsDeep((p) => !p)}
            onClick={(e) => e.stopPropagation()}
            sx={{
              "& .MuiSwitch-thumb": { bgcolor: isDeep ? heroColor : undefined },
              "& .Mui-checked + .MuiSwitch-track": {
                bgcolor: `${heroColor}80`,
              },
            }}
          />
        </Box>
        <Button
          fullWidth
          variant="contained"
          onClick={handle}
          disabled={!label.trim()}
          sx={{
            py: 1.2,
            background: heroColor,
            "&:hover": { background: heroColor, opacity: 0.88 },
            boxShadow: "none",
            borderRadius: 2,
            fontSize: 13,
          }}
        >
          Add Task
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ── LINK LAKSHYA DIALOG ────────────────────────────────────────────────────────
function LinkLakshyaDialog({
  open,
  task,
  lakshyas,
  currentLink,
  onSave,
  onClose,
  heroColor,
  isDark,
}) {
  const [lakshyaId, setLakshyaId] = useState("");
  const [siddhiId, setSiddhiId] = useState("");
  const bg = isDark ? "#1A1916" : "#FCFBF9";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#D1D0CF";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";

  useEffect(() => {
    if (open) {
      setLakshyaId(currentLink?.lakshya_id || "");
      setSiddhiId(currentLink?.siddhi_id || "");
    }
  }, [open, currentLink]);

  // When lakshya changes, reset siddhi selection
  const handleLakshyaChange = (id) => {
    setLakshyaId(id);
    setSiddhiId("");
  };

  const activeSiddhis = lakshyaId
    ? (lakshyas.find((l) => l.id === lakshyaId)?.siddhis || []).filter(
        (s) => s.status !== "completed",
      )
    : [];

  if (!task) return null;

  const handle = () => {
    const chosenLakshya = lakshyas.find((l) => l.id === lakshyaId);
    const chosenSiddhi = activeSiddhis.find((s) => s.id === siddhiId);
    onSave(
      task.id,
      lakshyaId || null,
      chosenLakshya?.title || null,
      siddhiId || null,
      chosenSiddhi?.title || null,
    );
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${border}`,
          boxShadow: "none",
          background: bg,
        },
      }}
    >
      <DialogContent sx={{ p: "24px 28px !important" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 9,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: textS,
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              {task.emoji} {task.label}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Lora","Fraunces",serif',
                fontSize: 17,
                fontWeight: 600,
                color: textP,
              }}
            >
              Link to Hierarchy
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: textS }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Step 1 — Lakshya */}
        <Typography
          sx={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: heroColor,
            mb: 0.75,
          }}
        >
          Step 1 · Choose Lakshya
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Lakshya (Goal)</InputLabel>
          <Select
            value={lakshyaId}
            onChange={(e) => handleLakshyaChange(e.target.value)}
            label="Lakshya (Goal)"
          >
            <MenuItem value="">
              <em>No link</em>
            </MenuItem>
            {lakshyas.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                <Box>
                  <Typography sx={{ fontSize: 13 }}>{l.title}</Typography>
                  {l.pillar && (
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: textS,
                        textTransform: "capitalize",
                      }}
                    >
                      {l.pillar}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Step 2 — Siddhi (only shown when a Lakshya is selected) */}
        {lakshyaId && (
          <>
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: heroColor,
                mb: 0.75,
              }}
            >
              Step 2 · Choose Milestone (optional)
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
              <InputLabel>Siddhi (Milestone)</InputLabel>
              <Select
                value={siddhiId}
                onChange={(e) => setSiddhiId(e.target.value)}
                label="Siddhi (Milestone)"
              >
                <MenuItem value="">
                  <em>No milestone</em>
                </MenuItem>
                {activeSiddhis.length === 0 ? (
                  <MenuItem disabled>
                    <Typography
                      sx={{ fontSize: 12, fontStyle: "italic", color: textS }}
                    >
                      No active milestones on this goal
                    </Typography>
                  </MenuItem>
                ) : (
                  activeSiddhis.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      <Typography sx={{ fontSize: 13 }}>{s.title}</Typography>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </>
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handle}
          sx={{
            py: 1.2,
            background: heroColor,
            "&:hover": { background: heroColor, opacity: 0.88 },
            boxShadow: "none",
            borderRadius: 2,
            fontSize: 13,
          }}
        >
          {lakshyaId ? "Save Link" : "Clear Link"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ── HAPTIC HELPER ──────────────────────────────────────────────────────────────
// Short pulse on mobile (Android Chrome/Firefox); silently ignored on iOS/desktop
const haptic = (ms = 10) => {
  try { if (navigator?.vibrate) navigator.vibrate(ms); } catch (_) {}
};

// ── MORNING FLOW MODAL ─────────────────────────────────────────────────────────
const SLEEP_LABELS = ["Poor", "Fair", "Good", "Great", "Excellent"];
const SLEEP_COLORS = ["#CF4E4E", "#DDA74F", "#6AAEE8", "#5A6E1A", "#6B8A9E"];

function MorningFlowModal({
  open,
  onClose,
  onComplete,
  heroColor,
  isDark,
  pendingSacred,
  yesterdayTasks,
}) {
  const hasCarryOvers = yesterdayTasks?.length > 0;
  // Steps: sleep is always first, then optionally carry-overs, then intention, then foundations
  const STEPS = ["sleep", ...(hasCarryOvers ? ["carryover"] : []), "intention", "foundations"];

  const [stepIdx, setStepIdx] = useState(0);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(0);
  const [intention, setIntention] = useState("");
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setSleepHours("");
      setSleepQuality(0);
      setIntention("");
      setSelected({});
    }
  }, [open]);

  const bg = isDark ? "#1A1916" : "#FCFBF9";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#D1D0CF";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#5F5F5F";
  const currentStep = STEPS[stepIdx];
  const totalSteps = STEPS.length;

  const next = () => setStepIdx((i) => Math.min(i + 1, totalSteps - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));

  const handleFinish = () => {
    const carryOvers = hasCarryOvers
      ? (yesterdayTasks || []).filter((_, i) => selected[i])
      : [];
    const sleepData = {
      hours: sleepHours ? parseFloat(sleepHours) : null,
      quality: sleepQuality || null,
    };
    onComplete(intention, carryOvers, sleepData);
    setStepIdx(0);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${border}`,
          boxShadow: "none",
          background: bg,
        },
      }}
    >
      <DialogContent sx={{ p: "32px 36px !important" }}>
        {/* progress bar */}
        <Box sx={{ display: "flex", gap: 0.75, mb: 3 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: stepIdx > i ? heroColor : isDark ? "#2C2C2C" : "#E8E6E0",
                transition: "background 0.3s",
              }}
            />
          ))}
        </Box>

        {/* Step: Sleep check-in */}
        {currentStep === "sleep" && (
          <Fade in>
            <Box>
              <Typography sx={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#9C9A94", fontWeight: 700, mb: 0.5 }}>
                Morning flow · Step 1
              </Typography>
              <Typography sx={{ fontFamily: '"Lora","Fraunces",serif', fontSize: 20, fontWeight: 600, color: textP, mb: 0.5 }}>
                How did you sleep?
              </Typography>
              <Typography sx={{ fontSize: 12, color: textS, mb: 3 }}>
                {dayjs().subtract(1, "day").format("dddd")} night · Last night's rest
              </Typography>

              {/* Hours */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: textS, textTransform: "uppercase", letterSpacing: 1, mb: 1.5 }}>
                  Sleep duration
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <TextField
                    type="number"
                    placeholder="7.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    inputProps={{ min: 0, max: 14, step: 0.5 }}
                    sx={{
                      width: 110,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "& fieldset": { borderColor: border },
                        "&:hover fieldset": { borderColor: heroColor + "80" },
                        "&.Mui-focused fieldset": { borderColor: heroColor },
                      },
                      "& input": { fontSize: 22, fontFamily: '"Fraunces",serif', color: textP, textAlign: "center", p: "10px 14px" },
                    }}
                  />
                  <Typography sx={{ fontSize: 14, color: textS }}>hours</Typography>
                </Box>
              </Box>

              {/* Quality dots */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: textS, textTransform: "uppercase", letterSpacing: 1, mb: 1.5 }}>
                  Sleep quality
                </Typography>
                <Box sx={{ display: "flex", gap: 1.25 }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const c = SLEEP_COLORS[n - 1];
                    const active = n <= sleepQuality;
                    return (
                      <Box
                        key={n}
                        onClick={() => setSleepQuality(sleepQuality === n ? 0 : n)}
                        sx={{
                          flex: 1,
                          py: 1.5,
                          borderRadius: 2,
                          border: `2px solid ${active ? c : (isDark ? "#2C2C2C" : "#E0DDD8")}`,
                          background: active ? `${c}18` : "transparent",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.15s",
                          "&:hover": { borderColor: `${c}80` },
                        }}
                      >
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: active ? c : textS, letterSpacing: 0.3 }}>
                          {SLEEP_LABELS[n - 1]}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={next}
                sx={{ py: 1.2, background: heroColor, "&:hover": { background: heroColor, opacity: 0.88 }, boxShadow: "none", fontSize: 13, fontWeight: 600 }}
              >
                Continue →
              </Button>
              <Button fullWidth onClick={onClose} sx={{ mt: 0.75, fontSize: 12, color: "#9C9A94" }}>
                Not yet
              </Button>
            </Box>
          </Fade>
        )}

        {/* Step: Carry-overs from yesterday */}
        {currentStep === "carryover" && (
          <Fade in>
            <Box>
              <Typography sx={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#9C9A94", fontWeight: 700, mb: 0.5 }}>
                Morning flow · Step {stepIdx + 1}
              </Typography>
              <Typography sx={{ fontFamily: '"Lora","Fraunces",serif', fontSize: 20, fontWeight: 600, color: textP, mb: 0.5 }}>
                From yesterday's plan
              </Typography>
              <Typography sx={{ fontSize: 12, color: textS, mb: 2.5 }}>
                Select what carries into today's core
              </Typography>
              {yesterdayTasks.map((t, i) => {
                const isOn = !!selected[i];
                return (
                  <Box
                    key={i}
                    onClick={() => setSelected((s) => ({ ...s, [i]: !s[i] }))}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      mb: 1,
                      borderRadius: 2,
                      border: `1px solid ${isOn ? heroColor + "60" : border}`,
                      background: isOn ? `${heroColor}10` : isDark ? "#0F0E0C" : "#FAF9F6",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Box sx={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${isOn ? heroColor : (isDark ? "#3C3A36" : "#D1D0CF")}`,
                      background: isOn ? heroColor : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}>
                      {isOn && <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </Box>
                    <Typography sx={{ fontSize: 13, color: textP, flex: 1 }}>{t.label}</Typography>
                    {t.deep && (
                      <Box sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: heroColor, background: `${heroColor}15`, px: 0.75, py: 0.25, borderRadius: 1 }}>
                        DEEP
                      </Box>
                    )}
                  </Box>
                );
              })}
              <Button
                variant="contained"
                fullWidth
                onClick={next}
                sx={{ mt: 1.5, py: 1.2, background: heroColor, "&:hover": { background: heroColor, opacity: 0.88 }, boxShadow: "none", fontSize: 13, fontWeight: 600 }}
              >
                Continue →
              </Button>
              <Button variant="outlined" onClick={prev} sx={{ mt: 0.75, width: "100%", borderColor: border, color: textS, fontSize: 12 }}>Back</Button>
            </Box>
          </Fade>
        )}

        {/* Step: The one thing */}
        {currentStep === "intention" && (
          <Fade in>
            <Box>
              <Typography sx={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#9C9A94", fontWeight: 700, mb: 0.5 }}>
                Morning flow · Step {stepIdx + 1}
              </Typography>
              <Typography sx={{ fontFamily: '"Lora","Fraunces",serif', fontSize: 20, fontWeight: 600, color: textP, mb: 0.5 }}>
                The one thing today
              </Typography>
              <Typography sx={{ fontSize: 12, color: textS, mb: 2.5 }}>
                {dayjs().format("dddd, D MMMM")} · Begin with clarity
              </Typography>
              <Box sx={{ background: isDark ? "#0F0E0C" : "#FAF9F6", border: `1px solid ${border}`, borderRadius: 2, px: 2, py: 1.5, mb: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  variant="standard"
                  placeholder="What is the single most important thing I must complete today?"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    "& textarea": {
                      fontFamily: '"Lora","Fraunces",serif',
                      fontStyle: "italic",
                      fontSize: 15,
                      color: textP,
                      lineHeight: 1.7,
                      "&::placeholder": { color: isDark ? "#3C3A36" : "#C8C6C0", fontStyle: "italic" },
                    },
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="outlined" onClick={prev} sx={{ flex: 1, borderColor: border, color: textS, fontSize: 12 }}>Back</Button>
                <Button
                  variant="contained"
                  onClick={next}
                  sx={{ flex: 2, py: 1.2, background: heroColor, "&:hover": { background: heroColor, opacity: 0.88 }, boxShadow: "none", fontSize: 13, fontWeight: 600 }}
                >
                  Continue →
                </Button>
              </Box>
              <Button fullWidth onClick={onClose} sx={{ mt: 0.75, fontSize: 12, color: "#9C9A94" }}>Not yet</Button>
            </Box>
          </Fade>
        )}

        {/* Step: Sacred reminder + begin */}
        {currentStep === "foundations" && (
          <Fade in>
            <Box>
              <Typography sx={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#9C9A94", fontWeight: 700, mb: 0.5 }}>
                Morning flow · Step {stepIdx + 1}
              </Typography>
              <Typography sx={{ fontFamily: '"Lora","Fraunces",serif', fontSize: 20, fontWeight: 600, color: textP, mb: 0.5 }}>
                Today's foundations
              </Typography>
              <Typography sx={{ fontSize: 12, color: textS, mb: 2.5 }}>Begin with these — everything else follows</Typography>
              {pendingSacred.slice(0, 4).map((s) => (
                <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.75, px: 1.5, mb: 0.75, borderRadius: 2, background: isDark ? "#0F0E0C" : "#FAF9F6", border: `1px solid ${border}` }}>
                  <Typography sx={{ fontSize: 16 }}>{s.emoji || "·"}</Typography>
                  <Typography sx={{ fontSize: 13, color: textP, flex: 1 }}>{s.label}</Typography>
                </Box>
              ))}
              {pendingSacred.length === 0 && (
                <Box sx={{ textAlign: "center", py: 2 }}>
                  <Typography sx={{ fontSize: 24, mb: 0.5 }}>✨</Typography>
                  <Typography sx={{ fontSize: 13, color: textS }}>All foundations complete</Typography>
                </Box>
              )}
              <Button
                variant="contained"
                fullWidth
                onClick={handleFinish}
                sx={{ mt: 2, py: 1.3, background: heroColor, "&:hover": { background: heroColor, opacity: 0.88 }, boxShadow: "none", fontSize: 13, fontWeight: 600, borderRadius: 2 }}
              >
                Begin the day ☀️
              </Button>
              <Button variant="outlined" onClick={prev} sx={{ mt: 1, width: "100%", borderColor: border, color: textS, fontSize: 12 }}>Back</Button>
            </Box>
          </Fade>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── EVENING FLOW MODAL ─────────────────────────────────────────────────────────
function EveningFlowModal({
  open,
  onClose,
  heroColor,
  isDark,
  onSave,
  wins,
  setWins,
  tomorrowTasks,
  setTomorrowTasks,
}) {
  const [step, setStep] = useState(1);

  // Reset to step 1 whenever the modal closes so it's fresh next time
  useEffect(() => { if (!open) setStep(1); }, [open]);
  const bg = isDark ? "#1A1916" : "#FCFBF9";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#D1D0CF";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#5F5F5F";
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${border}`,
          boxShadow: "none",
          background: bg,
        },
      }}
    >
      <DialogContent sx={{ p: "32px 36px !important" }}>
        <Box sx={{ display: "flex", gap: 0.75, mb: 3 }}>
          {[1, 2, 3].map((s) => (
            <Box
              key={s}
              sx={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background:
                  step >= s ? heroColor : isDark ? "#2C2C2C" : "#E8E6E0",
                transition: "background 0.3s",
              }}
            />
          ))}
        </Box>
        {step === 1 && (
          <Fade in>
            <Box>
              <Typography
                sx={{
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#9C9A94",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                Night flow · Step 1
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Lora","Fraunces",serif',
                  fontSize: 20,
                  fontWeight: 600,
                  color: textP,
                  mb: 2.5,
                }}
              >
                Three wins from today
              </Typography>
              {wins.map((w, i) => (
                <TextField
                  key={i}
                  fullWidth
                  size="small"
                  placeholder={`Win ${i + 1}…`}
                  value={w}
                  onChange={(e) => {
                    const n = [...wins];
                    n[i] = e.target.value;
                    setWins(n);
                  }}
                  sx={{
                    mb: 1.25,
                    "& .MuiOutlinedInput-root": {
                      background: isDark ? "#0F0E0C" : "#FAF9F6",
                      fontSize: 13,
                    },
                  }}
                />
              ))}
              <Button
                variant="contained"
                fullWidth
                onClick={() => setStep(2)}
                sx={{
                  mt: 1,
                  py: 1.2,
                  background: heroColor,
                  "&:hover": { background: heroColor, opacity: 0.88 },
                  boxShadow: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Continue →
              </Button>
              <Button
                fullWidth
                onClick={onClose}
                sx={{ mt: 0.75, fontSize: 12, color: "#9C9A94" }}
              >
                Not yet
              </Button>
            </Box>
          </Fade>
        )}
        {step === 2 && (
          <Fade in>
            <Box>
              <Typography
                sx={{
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#9C9A94",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                Night flow · Step 2
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Lora","Fraunces",serif',
                  fontSize: 20,
                  fontWeight: 600,
                  color: textP,
                  mb: 0.5,
                }}
              >
                Flag 3 tasks for tomorrow
              </Typography>
              <Typography sx={{ fontSize: 12, color: textS, mb: 2 }}>
                These appear in tomorrow's morning flow
              </Typography>
              {tomorrowTasks.map((t, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1.25 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`Task ${i + 1}…`}
                    value={t.label}
                    onChange={(e) => {
                      const n = [...tomorrowTasks];
                      n[i] = { ...n[i], label: e.target.value };
                      setTomorrowTasks(n);
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { background: isDark ? "#0F0E0C" : "#FAF9F6", fontSize: 13 } }}
                  />
                  <Tooltip title={t.deep ? "Deep work (click to unset)" : "Mark as deep work"}>
                    <Box
                      onClick={() => {
                        const n = [...tomorrowTasks];
                        n[i] = { ...n[i], deep: !n[i].deep };
                        setTomorrowTasks(n);
                      }}
                      sx={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        border: `1px solid ${t.deep ? heroColor + "80" : border}`,
                        background: t.deep ? `${heroColor}18` : "transparent",
                        fontSize: 16,
                        transition: "all 0.2s",
                        userSelect: "none",
                      }}
                    >
                      🧠
                    </Box>
                  </Tooltip>
                </Box>
              ))}
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setStep(1)}
                  sx={{
                    flex: 1,
                    borderColor: border,
                    color: textS,
                    fontSize: 12,
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setStep(3)}
                  sx={{
                    flex: 2,
                    py: 1.2,
                    background: heroColor,
                    "&:hover": { background: heroColor, opacity: 0.88 },
                    boxShadow: "none",
                    fontSize: 13,
                  }}
                >
                  Continue →
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
        {step === 3 && (
          <Fade in>
            <Box sx={{ textAlign: "center", py: 1 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: `${heroColor}15`,
                  border: `1px solid ${heroColor}30`,
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Nightlight sx={{ fontSize: 30, color: heroColor }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Lora","Fraunces",serif',
                  fontSize: 22,
                  fontWeight: 600,
                  color: textP,
                  mb: 0.75,
                }}
              >
                Phone down. Rest well.
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: textS, mb: 1, lineHeight: 1.8 }}
              >
                Tomorrow begins at 6:00am. <br /> {dayjs().format("dddd")} is
                complete.
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Lora",serif',
                  fontStyle: "italic",
                  color: isDark ? "#5C5A54" : "#C8C6C0",
                  fontSize: 13,
                  mb: 3,
                }}
              >
                स्वाध्यायान्मा प्रमदः
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={onSave}
                sx={{
                  py: 1.3,
                  background: heroColor,
                  "&:hover": { background: heroColor, opacity: 0.88 },
                  boxShadow: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Save & close the day
              </Button>
              <Button
                fullWidth
                onClick={onClose}
                sx={{ mt: 0.75, fontSize: 12, color: "#9C9A94" }}
              >
                Not yet
              </Button>
            </Box>
          </Fade>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── SUNSET DIALOG ──────────────────────────────────────────────────────────────
// eslint-disable-next-line react/display-name
const SlideUp = React.forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function SunsetDialog({
  open,
  onConfirm,
  onClose,
  heroColor,
  isDark,
  resonanceScore,
}) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const bg = isDark ? "#1A1916" : "#FCFBF9";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#D1D0CF";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#5F5F5F";
  const currentSiddhi =
    ASHTA_SIDDHI_SCALE.find(
      (s) => s.value === Math.ceil(resonanceScore / (100 / 8)),
    ) || ASHTA_SIDDHI_SCALE[0];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={isMobile ? SlideUp : undefined}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? "20px 20px 0 0" : 3,
          border: `1px solid ${border}`,
          boxShadow: "none",
          background: bg,
          ...(isMobile && {
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            m: 0,
            width: "100%",
            maxWidth: "100% !important",
          }),
        },
      }}
      sx={isMobile ? { alignItems: "flex-end" } : {}}
    >
      <DialogContent sx={{ p: "32px 28px !important", textAlign: "center" }}>
        <Typography sx={{ fontSize: 40, mb: 1 }}>
          {currentSiddhi.emoji}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Lora","Fraunces",serif',
            fontSize: 20,
            fontWeight: 600,
            color: textP,
            mb: 0.75,
          }}
        >
          Is your resonance complete?
        </Typography>
        <Typography
          sx={{ fontSize: 13, color: textS, lineHeight: 1.7, mb: 0.75 }}
        >
          Today's harmony score
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Lora",serif',
            fontSize: 36,
            fontWeight: 700,
            color: heroColor,
            mb: 2.5,
          }}
        >
          {resonanceScore}%
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            fullWidth
            sx={{ py: 1.2, borderColor: border, color: textS, fontSize: 13 }}
          >
            Not yet
          </Button>
          <Button
            variant="contained"
            onClick={onConfirm}
            fullWidth
            sx={{
              py: 1.2,
              background: heroColor,
              "&:hover": { background: heroColor, opacity: 0.88 },
              boxShadow: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Close the day 🌙
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── DISRUPTION MODAL ──────────────────────────────────────────────────────────
function DisruptModal({ open, onClose, onSelect, heroColor, isDark }) {
  const bg = isDark ? "#1A1916" : "#FCFBF9";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#D1D0CF";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const opts = [
    {
      type: "holiday",
      icon: "🌊",
      label: "Grace mode",
      sub: "Streak preserved · Sacred foundations only · Core tasks paused",
    },
    {
      type: "vacation",
      icon: "🏖️",
      label: "Vacation / time off",
      sub: "Streaks frozen · Goals paused · Only sacred required",
    },
    {
      type: "working",
      icon: "⚡",
      label: "Back to working mode",
      sub: "Resume full daily structure",
    },
  ];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${border}`,
          boxShadow: "none",
          background: bg,
        },
      }}
    >
      <DialogContent sx={{ p: "24px 28px !important" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: '"Lora","Fraunces",serif',
                fontSize: 18,
                fontWeight: 600,
                color: textP,
              }}
            >
              Life happened today
            </Typography>
            <Typography sx={{ fontSize: 12, color: textS, mt: 0.25 }}>
              How do you want to handle today?
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: textS }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        {opts.map((opt) => (
          <Box
            key={opt.type}
            onClick={() => {
              onSelect(opt.type);
              onClose();
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${border}`,
              mb: 1,
              cursor: "pointer",
              background: isDark ? "#0F0E0C" : "#FAF9F6",
              transition: "all 0.15s",
              "&:hover": {
                background: `${heroColor}08`,
                borderColor: heroColor,
              },
            }}
          >
            <Typography sx={{ fontSize: 22 }}>{opt.icon}</Typography>
            <Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: textP,
                  lineHeight: 1.3,
                }}
              >
                {opt.label}
              </Typography>
              <Typography sx={{ fontSize: 11, color: textS, mt: 0.25 }}>
                {opt.sub}
              </Typography>
            </Box>
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
}

// ── SECTION HEADER ─────────────────────────────────────────────────────────────
function SectionHeader({ label, heroColor, isDark, onAdd, locked }) {
  const textS = isDark ? "#7A7874" : "#9C9A94";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <MandalaSVG size={13} color={heroColor} />
        <Typography
          sx={{
            fontSize: 10,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: textS,
            fontWeight: 700,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {locked && (
          <Lock sx={{ fontSize: 13, color: isDark ? "#5C5A54" : "#C8C6C0" }} />
        )}
        {onAdd && (
          <Tooltip title="Add task">
            <IconButton
              size="small"
              onClick={onAdd}
              sx={{ color: textS, "&:hover": { color: heroColor }, p: 0.3 }}
            >
              <Add sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

// ── TASK ROW ───────────────────────────────────────────────────────────────────
function TaskRow({
  item,
  checked,
  onToggle,
  onDelete,
  onLink,
  heroColor,
  isDark,
  locked,
  isAnsh,
  subtitle,
}) {
  const border = isDark ? "rgba(255,255,255,0.06)" : "#E8E6E0";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";

  return (
    <Box
      onClick={() => { haptic(8); onToggle?.(); }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.25,
        px: 0.5,
        borderBottom: `1px solid ${border}`,
        "&:last-child": { borderBottom: "none" },
        borderRadius: 1.5,
        cursor: "pointer",
        transition: "background 0.12s, transform 0.1s",
        "&:hover": {
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
          "& .task-circle": {
            borderColor: heroColor,
            boxShadow: `0 0 0 3px ${heroColor}18`,
          },
        },
        "&:active": {
          transform: "scale(0.985)",
          background: isDark ? "rgba(255,255,255,0.05)" : `${heroColor}08`,
        },
      }}
    >
      <Box
        className="task-circle"
        sx={{
          width: item.emoji ? 30 : 22,
          height: item.emoji ? 30 : 22,
          borderRadius: "50%",
          background: checked
            ? item.emoji
              ? heroColor
              : isDark ? "#5EC98A" : "#2D7A4F"
            : isDark
              ? "#1F1E1B"
              : "#F0EDE8",
          border: `1px solid ${checked ? (item.emoji ? heroColor : (isDark ? "#5EC98A" : "#2D7A4F")) : isDark ? "#3C3C3C" : "#D1D0CF"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
          pointerEvents: "none",
        }}
      >
        {item.emoji && !checked && (
          <Typography sx={{ fontSize: 12 }}>{item.emoji}</Typography>
        )}
        {item.emoji && checked && (
          <CheckCircle sx={{ fontSize: 13, color: "#fff" }} />
        )}
        {!item.emoji && checked && (
          <CheckCircle sx={{ fontSize: 14, color: "#fff" }} />
        )}
        {!item.emoji && !checked && (
          <RadioButtonUnchecked
            sx={{ fontSize: 14, color: isDark ? "#5C5A54" : "#C8C6C0" }}
          />
        )}
      </Box>

      <Box
        sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexWrap: "nowrap",
          }}
        >
          <Tooltip title={item.label} placement="top" disableInteractive>
            <Typography
              noWrap
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: checked ? (isDark ? "#5C5A54" : "#9C9A94") : textP,
                textDecoration: checked ? "line-through" : "none",
                lineHeight: 1.2,
                display: "block",
              }}
            >
              {item.label}
            </Typography>
          </Tooltip>
          {isAnsh && (
            <Box
              sx={{
                px: 0.75,
                py: 0.1,
                borderRadius: 4,
                background: `${heroColor}18`,
                border: `1px solid ${heroColor}30`,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: 9,
                  color: heroColor,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Ansh
              </Typography>
            </Box>
          )}
        </Box>
        {subtitle && (
          <Typography
            sx={{
              fontSize: 10,
              color: heroColor,
              opacity: 0.8,
              fontWeight: 500,
              mt: 0.2,
              letterSpacing: 0.2,
            }}
          >
            {subtitle}
          </Typography>
        )}
        {item.lakshyaTitle && (
          <Box sx={{ mt: 0.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              <Flag
                sx={{
                  fontSize: 10,
                  color: heroColor,
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontSize: 10,
                  color: heroColor,
                  opacity: 0.85,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.lakshyaTitle}
              </Typography>
            </Box>
            {item.siddhiTitle && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  pl: 1.8,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 9,
                    color: heroColor,
                    opacity: 0.55,
                    fontWeight: 500,
                    letterSpacing: 0.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  ↳ {item.siddhiTitle}
                </Typography>
              </Box>
            )}
          </Box>
        )}
        {checked && item.hours && (
          <Typography
            sx={{
              fontSize: 10,
              color: isDark ? `${heroColor}99` : heroColor,
              mt: 0.2,
            }}
          >
            {item.hours < 1
              ? `${Math.round(item.hours * 60)}m`
              : `${item.hours}h`}{" "}
            ·{" "}
            {ASHTA_SIDDHI_SCALE.find((s) => s.value === item.satisfaction)
              ?.emoji || "✨"}{" "}
            {ASHTA_SIDDHI_SCALE.find((s) => s.value === item.satisfaction)
              ?.name || "Resonance"}
          </Typography>
        )}
      </Box>

      {!locked && !checked && onDelete && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{
            color: isDark ? "#5C5A54" : "#C8C6C0",
            "&:hover": { color: "#CF4E4E", background: "rgba(207,78,78,0.08)" },
            p: 0.3,
            flexShrink: 0,
            transition: "color 0.15s",
          }}
        >
          <Delete sx={{ fontSize: 14 }} />
        </IconButton>
      )}
      {locked && onLink && (
        <Tooltip
          title={item.lakshyaTitle ? "Change Lakshya link" : "Link to Lakshya"}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onLink();
            }}
            sx={{
              color: item.lakshyaTitle
                ? heroColor
                : isDark
                  ? "#5C5A54"
                  : "#C8C6C0",
              "&:hover": { color: heroColor, background: `${heroColor}12` },
              p: 0.3,
              flexShrink: 0,
              transition: "color 0.15s",
            }}
          >
            <LinkOutlined sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

// ── EMPTY STATE ────────────────────────────────────────────────────────────────
function EmptyState({ message, heroColor, isDark, onAdd }) {
  const textS = isDark ? "#5C5A54" : "#C8C6C0";
  return (
    <Box sx={{ py: 2, textAlign: "center" }}>
      <Typography
        sx={{
          fontSize: 12,
          color: textS,
          fontStyle: "italic",
          mb: onAdd ? 1 : 0,
        }}
      >
        {message}
      </Typography>
      {onAdd && (
        <Button
          size="small"
          startIcon={<Add />}
          onClick={onAdd}
          sx={{ color: heroColor, fontSize: 11, textTransform: "none" }}
        >
          Add one now
        </Button>
      )}
    </Box>
  );
}

// ── MODULE-LEVEL CACHE ─────────────────────────────────────────────────────────
// Persists across in-session navigation so TodayPage never shows a spinner again
// after the first load. Keyed to today's date — auto-invalidates at midnight.
let _todayCache = null;

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function TodayPage() {
  const { user } = useAuth();
  const { heroColor, mode } = useThemeMode();
  const navigate = useNavigate();
  const [seqDone, setSeqDone] = useState(_todayCache?.seqDone ?? 0);
  const [seqTotal, setSeqTotal] = useState(_todayCache?.seqTotal ?? 0);
  const [seqItems, setSeqItems] = useState(_todayCache?.seqItems ?? []);
  const [seqCompletions, setSeqCompletions] = useState(_todayCache?.seqCompletions ?? {});
  const [seqOpen, setSeqOpen] = useState(false);

  // Naada Saadhana popup
  const [naadaSeqOpen, setNaadaSeqOpen] = useState(false);
  const [naadaSeqItems, setNaadaSeqItems] = useState(_todayCache?.naadaSeqItems ?? []);
  const [naadaSeqCompletions, setNaadaSeqCompletions] = useState(_todayCache?.naadaSeqCompletions ?? {});
  const [naadaSeqDone, setNaadaSeqDone] = useState(_todayCache?.naadaSeqDone ?? 0);
  const [naadaSeqTotal, setNaadaSeqTotal] = useState(_todayCache?.naadaSeqTotal ?? 0);

  // Vritti popup
  const [vrittiOpen, setVrittiOpen] = useState(false);
  const [vrittiProjects, setVrittiProjects] = useState(_todayCache?.vrittiProjects ?? []);

  // Reading/Vidya popup
  const [readingOpen, setReadingOpen] = useState(false);
  const [currentBooks, setCurrentBooks] = useState(_todayCache?.currentBooks ?? []);
  const [vidyaPracItems, setVidyaPracItems] = useState(_todayCache?.vidyaPracItems ?? []);
  const [vidyaPracComps, setVidyaPracComps] = useState(_todayCache?.vidyaPracComps ?? {});

  // Vidya study log popup
  const [vidyaOpen, setVidyaOpen] = useState(false);
  const [vidyaTodayLogs, setVidyaTodayLogs] = useState(_todayCache?.vidyaTodayLogs ?? []);
  const [vidyaCourses, setVidyaCourses] = useState(_todayCache?.vidyaCourses ?? []);
  const [vidyaLogForm, setVidyaLogForm] = useState({ hours: "", source_type: "book", source_id: "", notes: "" });
  const [vidyaLogSaving, setVidyaLogSaving] = useState(false);

  // Vyaayamam popup
  const [walkOpen, setWalkOpen] = useState(false);
  const [walkExType, setWalkExType] = useState(_todayCache?.walkExType ?? "walk");
  const [walkSteps, setWalkSteps] = useState(_todayCache?.walkSteps ?? "");
  const [walkKm, setWalkKm] = useState(_todayCache?.walkKm ?? "");
  const [walkCalories, setWalkCalories] = useState(_todayCache?.walkCalories ?? "");
  const [walkSavingMov, setWalkSavingMov] = useState(false);
  const [walkActivityLogs, setWalkActivityLogs] = useState(_todayCache?.walkActivityLogs ?? []);
  const WALK_TARGETS = { steps: 10000, km: 6, calories: 500 };
  const isDark = mode === "dark";
  const { data: panchangam, loading: panchLoading } = usePanchang();
  const today = dayjs().format("YYYY-MM-DD");
  const hour = dayjs().hour();
  const isMorning = hour >= 5 && hour < 11;
  const isEvening = hour >= 21;

  const [habits, setHabits] = useState(_todayCache?.habits ?? {});
  const [habitsData, setHabitsData] = useState(_todayCache?.habitsData ?? {});
  const [dayType, setDayType] = useState(_todayCache?.dayType ?? "working");
  const [oneThing, setOneThing] = useState(_todayCache?.oneThing ?? "");
  const [wins, setWins] = useState(_todayCache?.wins ?? ["", "", ""]);
  const [tomorrowTasks, setTomorrowTasks] = useState(
    _todayCache?.tomorrowTasks ?? [{ label: "", deep: false }, { label: "", deep: false }, { label: "", deep: false }],
  );
  const [yesterdayTasks, setYesterdayTasks] = useState(_todayCache?.yesterdayTasks ?? []);
  const [dayClosed, setDayClosed] = useState(_todayCache?.dayClosed ?? false);
  const [morningDone, setMorningDone] = useState(_todayCache?.morningDone ?? false);
  const [loading, setLoading] = useState(_todayCache === null);
  const [syncing, setSyncing] = useState(false);

  const [customSacred, setCustomSacred] = useState(_todayCache?.customSacred ?? []);
  const [customCore, setCustomCore] = useState(_todayCache?.customCore ?? []);
  const [customEvening, setCustomEvening] = useState(_todayCache?.customEvening ?? []);

  const [lakshyas, setLakshyas] = useState(_todayCache?.lakshyas ?? []);
  const [taskLakshyaLinks, setTaskLakshyaLinks] = useState(_todayCache?.taskLakshyaLinks ?? {});
  const [anshs, setAnshs] = useState(_todayCache?.anshs ?? []);
  const [linkingTask, setLinkingTask] = useState(null);

  const [showMorningFlow, setShowMorningFlow] = useState(false);
  const [showEveningFlow, setShowEveningFlow] = useState(false);
  const [showSunset, setShowSunset] = useState(false);
  const [showDisrupt, setShowDisrupt] = useState(false);
  const [confirmDisrupt, setConfirmDisrupt] = useState(false);
  const [addTaskFor, setAddTaskFor] = useState(null);
  const [completionItem, setCompletionItem] = useState(null);
  const [undoSnack, setUndoSnack] = useState(false);
  const [errSnack, setErrSnack] = useState(false);
  const [dismissMorning, setDismissMorning] = useState(false);
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState({ open: false, section: null, id: null, label: "" });

  // Pick a stable daily quote (changes once per day)
  const [dailyQuote, setDailyQuote] = useState(() => {
    const dayIndex = dayjs().diff(dayjs("2024-01-01"), "day");
    return QUOTES[((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length];
  });
  useEffect(() => {
    getAllQuotesAsync(supabase).then((quotes) => {
      const dayIndex = dayjs().diff(dayjs("2024-01-01"), "day");
      setDailyQuote(quotes[((dayIndex % quotes.length) + quotes.length) % quotes.length]);
    });
  }, []);

  const isWeekend = isWeekendDay();
  const isDisrupted = dayType === "disrupted";
  // Keep grace for backward-compat with old holiday/vacation entries
  const isGrace = isDisrupted || dayType === "holiday" || dayType === "vacation";

  const enrichWithLakshya = (tasks) =>
    tasks.map((t) => ({
      ...t,
      lakshyaTitle: taskLakshyaLinks[t.id]?.title || null,
      siddhiTitle: taskLakshyaLinks[t.id]?.siddhi_title || null,
    }));

  const allSacred = enrichWithLakshya(DEFAULT_SACRED).concat(customSacred);
  // Core always includes all DEFAULT_CORE items — weekend doesn't remove office
  const allCore = enrichWithLakshya(DEFAULT_CORE).concat(customCore);
  const allEvening = enrichWithLakshya(DEFAULT_EVENING).concat(customEvening);

  const cardBg = isDark ? "#1A1916" : "#FCFBF9";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#D1D0CF";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    // Cache is warm for today — skip the network round-trip entirely
    if (_todayCache !== null && _todayCache._date === today) {
      setLoading(false);
      return;
    }
    try {
      const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      const sevenAgo = dayjs().subtract(7, "day").format("YYYY-MM-DD");
      const [{ data: dayData }, { data: yData }, { data: seqItems }, { data: seqComps }, { data: actData }, { data: naadaItems }, { data: naadaComps }, { data: vProjects }, { data: rBooks }, { data: vPracItems }, { data: vPracComps }, { data: vidyaLogs }, { data: vidyaCoursesData }] = await Promise.all([
        supabase.from("days").select("*").eq("user_id", user.id).eq("day_date", today).maybeSingle(),
        supabase.from("days").select("tomorrow_tasks").eq("user_id", user.id).eq("day_date", yesterday).maybeSingle(),
        supabase.from("daily_items").select("*").eq("user_id", user.id).order("order_index"),
        supabase.from("daily_item_completions").select("daily_item_id,is_completed").eq("user_id", user.id).eq("completion_date", today),
        supabase.from("daily_activity").select("*").eq("user_id", user.id).gte("date", sevenAgo).order("date", { ascending: false }),
        supabase.from("naada_sequence_items").select("*").eq("user_id", user.id).order("order_index"),
        supabase.from("naada_sequence_completions").select("naada_item_id,is_completed").eq("user_id", user.id).eq("completion_date", today),
        supabase.from("vritti_projects").select("id,title,status,priority").eq("user_id", user.id).eq("status", "active").order("order_index"),
        supabase.from("books").select("id,title,author,pages_read,total_pages,status").eq("user_id", user.id).eq("status", "reading").limit(5),
        supabase.from("vidya_practice_items").select("*").eq("user_id", user.id).order("order_index"),
        supabase.from("vidya_practice_completions").select("vidya_item_id,is_completed").eq("user_id", user.id).eq("completion_date", today),
        supabase.from("vidya_study_log").select("*").eq("user_id", user.id).eq("date", today).order("created_at", { ascending: false }),
        supabase.from("vidya_courses").select("id,title,status").eq("user_id", user.id).neq("status", "archived").order("title"),
      ]);
      // Load walk popup data
      if (actData) {
        setWalkActivityLogs(actData);
        const todayAct = actData.find((a) => a.date === today);
        if (todayAct) {
          setWalkSteps(todayAct.steps != null ? String(todayAct.steps) : "");
          setWalkKm(todayAct.km_walked != null ? String(todayAct.km_walked) : "");
          setWalkCalories(todayAct.calories_burned != null ? String(todayAct.calories_burned) : "");
          setWalkExType(todayAct.exercise_type || "walk");
        }
      }
      // Compute visible-today sequence stats
      if (seqItems) {
        const todayDay = dayjs();
        const visible = seqItems.filter((s) => {
          if (s.frequency === "daily") return true;
          if (s.frequency === "weekly") return todayDay.day() === (s.frequency_day ?? 0);
          if (s.frequency === "monthly") return todayDay.date() === (s.frequency_day ?? 1);
          return true;
        });
        const compMap = Object.fromEntries((seqComps || []).map((c) => [c.daily_item_id, c.is_completed]));
        setSeqItems(seqItems);
        setSeqCompletions(compMap);
        setSeqTotal(visible.length);
        setSeqDone(visible.filter((s) => compMap[s.id]).length);
      }
      // Naada sequence stats
      if (naadaItems) {
        const todayDay2 = dayjs();
        const naadaVisible = naadaItems.filter((s) => {
          if (s.frequency === "daily") return true;
          if (s.frequency === "weekly") return todayDay2.day() === (s.frequency_day ?? 0);
          if (s.frequency === "monthly") return todayDay2.date() === (s.frequency_day ?? 1);
          return true;
        });
        const naadaCompMap = Object.fromEntries((naadaComps || []).map((c) => [c.naada_item_id, c.is_completed]));
        setNaadaSeqItems(naadaItems);
        setNaadaSeqCompletions(naadaCompMap);
        setNaadaSeqTotal(naadaVisible.length);
        setNaadaSeqDone(naadaVisible.filter((s) => naadaCompMap[s.id]).length);
      }
      // Vritti active projects
      if (vProjects) setVrittiProjects(vProjects);
      // Vidya study log
      if (vidyaLogs) setVidyaTodayLogs(vidyaLogs);
      if (vidyaCoursesData) setVidyaCourses(vidyaCoursesData);
      // Reading / Vidya
      if (rBooks) setCurrentBooks(rBooks);
      if (vPracItems) {
        setVidyaPracItems(vPracItems);
        setVidyaPracComps(Object.fromEntries((vPracComps || []).map((c) => [c.vidya_item_id, c.is_completed])));
      }

      if (dayData) {
        setHabits(dayData.habits || {});
        setHabitsData(dayData.habits_data || {});
        setDayType(dayData.disruption_mode || "working");
        setOneThing(dayData.one_thing || "");
        setWins(dayData.wins?.length ? dayData.wins : ["", "", ""]);
        const raw = dayData.tomorrow_tasks || [];
        const parseTask = (t) => {
          if (typeof t === "string") {
            try { const p = JSON.parse(t); return typeof p === "object" && p !== null ? p : { label: t, deep: false }; }
            catch { return { label: t, deep: false }; }
          }
          return t;
        };
        setTomorrowTasks(
          raw.length
            ? raw.map(parseTask)
            : [{ label: "", deep: false }, { label: "", deep: false }, { label: "", deep: false }],
        );
        setDayClosed(!!dayData.last_close);
        setMorningDone(!!dayData.morning_flow_done);
        setCustomSacred(dayData.custom_sacred || []);
        setCustomCore(dayData.custom_core || []);
        setCustomEvening(dayData.custom_evening || []);
      }

      if (yData?.tomorrow_tasks?.length) {
        setYesterdayTasks(
          yData.tomorrow_tasks
            .map((t) => {
              if (typeof t === "string") {
                try { const p = JSON.parse(t); return typeof p === "object" && p !== null ? p : { label: t, deep: false }; }
                catch { return { label: t, deep: false }; }
              }
              return t;
            })
            .filter((t) => t.label?.trim()),
        );
      }

      await supabase.from("days").upsert(
        {
          user_id: user.id,
          day_date: today,
          first_open: new Date().toISOString(),
        },
        { onConflict: "user_id,day_date", ignoreDuplicates: true },
      );

      const { data: allLakshyas } = await supabase
        .from("lakshyas")
        .select("id, title, pillar, siddhis(id, title, status)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at");
      setLakshyas(allLakshyas || []);

      const { data: anshData } = await supabase
        .from("anshs")
        .select("*, siddhi:siddhis(title), lakshya:lakshyas(title)")
        .eq("user_id", user.id)
        .eq("status", "active");
      if (anshData) setAnshs(anshData);

      const { data: settingsRow } = await supabase
        .from("days")
        .select("task_lakshya_links")
        .eq("user_id", user.id)
        .eq("day_date", "2000-01-01")
        .maybeSingle();
      if (settingsRow?.task_lakshya_links) {
        setTaskLakshyaLinks(settingsRow.task_lakshya_links);
      }

      // ── WRITE CACHE so next navigation is instant ──────────────────────────
      const _seqCMap = Object.fromEntries((seqComps||[]).map((c)=>[c.daily_item_id,c.is_completed]));
      const _todDay = dayjs();
      const _seqVis = (seqItems||[]).filter((s)=>{
        if(s.frequency==="daily") return true;
        if(s.frequency==="weekly") return _todDay.day()===(s.frequency_day??0);
        if(s.frequency==="monthly") return _todDay.date()===(s.frequency_day??1);
        return true;
      });
      const _naadaCMap = Object.fromEntries((naadaComps||[]).map((c)=>[c.naada_item_id,c.is_completed]));
      const _naadaVis = (naadaItems||[]).filter((s)=>{
        if(s.frequency==="daily") return true;
        if(s.frequency==="weekly") return _todDay.day()===(s.frequency_day??0);
        if(s.frequency==="monthly") return _todDay.date()===(s.frequency_day??1);
        return true;
      });
      const _act = (actData||[]).find((a)=>a.date===today);
      const _vPMap = Object.fromEntries((vPracComps||[]).map((c)=>[c.vidya_item_id,c.is_completed]));
      const _pt = (t) => {
        if(typeof t==="string"){try{const p=JSON.parse(t);return typeof p==="object"&&p!==null?p:{label:t,deep:false};}catch{return{label:t,deep:false};}}
        return t;
      };
      _todayCache = {
        _date: today,
        seqItems: seqItems||[], seqCompletions: _seqCMap,
        seqDone: _seqVis.filter((s)=>_seqCMap[s.id]).length, seqTotal: _seqVis.length,
        naadaSeqItems: naadaItems||[], naadaSeqCompletions: _naadaCMap,
        naadaSeqDone: _naadaVis.filter((s)=>_naadaCMap[s.id]).length, naadaSeqTotal: _naadaVis.length,
        vrittiProjects: vProjects||[], currentBooks: rBooks||[],
        vidyaTodayLogs: vidyaLogs||[], vidyaCourses: vidyaCoursesData||[],
        vidyaPracItems: vPracItems||[], vidyaPracComps: _vPMap,
        walkActivityLogs: actData||[],
        walkExType: _act?.exercise_type||"walk",
        walkSteps: _act?.steps!=null?String(_act.steps):"",
        walkKm: _act?.km_walked!=null?String(_act.km_walked):"",
        walkCalories: _act?.calories_burned!=null?String(_act.calories_burned):"",
        habits: dayData?.habits||{}, habitsData: dayData?.habits_data||{},
        dayType: dayData?.disruption_mode||"working", oneThing: dayData?.one_thing||"",
        wins: dayData?.wins?.length?dayData.wins:["","",""],
        tomorrowTasks: (dayData?.tomorrow_tasks||[]).map(_pt).length
          ? (dayData?.tomorrow_tasks||[]).map(_pt)
          : [{label:"",deep:false},{label:"",deep:false},{label:"",deep:false}],
        yesterdayTasks: (yData?.tomorrow_tasks||[]).map(_pt).filter((t)=>t.label?.trim()),
        dayClosed: !!dayData?.last_close, morningDone: !!dayData?.morning_flow_done,
        customSacred: dayData?.custom_sacred||[], customCore: dayData?.custom_core||[], customEvening: dayData?.custom_evening||[],
        lakshyas: allLakshyas||[], anshs: anshData||[],
        taskLakshyaLinks: settingsRow?.task_lakshya_links||{},
      };
    } catch (err) {
      console.error("TodayPage load error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the module cache fresh on every mutation so revisiting shows current data
  const _patchCache = (dbPatch) => {
    if (!_todayCache) return;
    const map = { habits:"habits", habits_data:"habitsData", disruption_mode:"dayType",
      one_thing:"oneThing", wins:"wins", tomorrow_tasks:"tomorrowTasks",
      morning_flow_done:"morningDone", custom_sacred:"customSacred",
      custom_core:"customCore", custom_evening:"customEvening" };
    const update = {};
    for (const [db, cache] of Object.entries(map)) {
      if (db in dbPatch) update[cache] = dbPatch[db];
    }
    if ("last_close" in dbPatch) update.dayClosed = !!dbPatch.last_close;
    _todayCache = { ..._todayCache, ...update };
  };

  const sync = async (patch) => {
    _patchCache(patch);
    setSyncing(true);
    const doUpsert = () =>
      supabase
        .from("days")
        .upsert(
          { user_id: user.id, day_date: today, ...patch },
          { onConflict: "user_id,day_date" },
        );
    let { error: syncErr } = await doUpsert();
    // If the JWT has expired, refresh the session and retry once
    if (syncErr && (syncErr.code === "PGRST301" || syncErr.message?.includes("JWT") || syncErr.message?.includes("security policy"))) {
      const { error: refreshErr } = await supabase.auth.refreshSession();
      if (!refreshErr) {
        ({ error: syncErr } = await doUpsert());
      }
    }
    if (syncErr) {
      console.error("sync error:", syncErr.message);
      setErrSnack(true);
    }
    setTimeout(() => setSyncing(false), 700);
  };

  const saveTaskLakshyaLink = async (
    taskId,
    lakshyaId,
    lakshyaTitle,
    siddhiId,
    siddhiTitle,
  ) => {
    const next = lakshyaId
      ? {
          ...taskLakshyaLinks,
          [taskId]: {
            lakshya_id: lakshyaId,
            title: lakshyaTitle,
            ...(siddhiId
              ? { siddhi_id: siddhiId, siddhi_title: siddhiTitle }
              : {}),
          },
        }
      : Object.fromEntries(
          Object.entries(taskLakshyaLinks).filter(([k]) => k !== taskId),
        );
    setTaskLakshyaLinks(next);
    await supabase
      .from("days")
      .upsert(
        { user_id: user.id, day_date: "2000-01-01", task_lakshya_links: next },
        { onConflict: "user_id,day_date" },
      );
  };

  const allItems = [
    ...allSacred,
    ...(isGrace ? [] : allCore),
    ...allEvening,
    ...anshs,
  ];
  const resonanceScore =
    allItems.length > 0
      ? Math.round(
          (allItems.filter((i) => habits[i.id]).length / allItems.length) * 100,
        )
      : 0;

  const handleToggle = (item) => {
    if (dayClosed) return;
    if (item.readOnly) {
      if (item.id === "walk")     { setWalkOpen(true);    return; }
      if (item.id === "saadhana") { setNaadaSeqOpen(true); return; }
      if (item.id === "office")   { setVrittiOpen(true);  return; }
      if (item.id === "reading")  { setReadingOpen(true); return; }
      if (item.id === "vidya")    { setVidyaOpen(true);   return; }
      setSeqOpen(true); return;
    }
    if (!habits[item.id]) {
      if (item.deep) {
        setCompletionItem(item);
      } else {
        const nextHabits = { ...habits, [item.id]: true };
        setHabits(nextHabits);
        sync({ habits: nextHabits });
      }
    } else {
      const next = { ...habits, [item.id]: false };
      setHabits(next);
      sync({ habits: next });
    }
  };

  const handleSeqToggle = async (itemId) => {
    const isDone = !seqCompletions[itemId];
    const newComps = { ...seqCompletions, [itemId]: isDone };
    setSeqCompletions(newComps);
    // Update done count
    const visible = seqItems.filter((s) => {
      if (s.frequency === "daily") return true;
      const td = dayjs();
      if (s.frequency === "weekly") return td.day() === (s.frequency_day ?? 0);
      if (s.frequency === "monthly") return td.date() === (s.frequency_day ?? 1);
      return true;
    });
    const done = visible.filter((s) => newComps[s.id]).length;
    setSeqDone(done);
    // Persist completion
    await supabase.from("daily_item_completions").upsert(
      { user_id: user.id, daily_item_id: itemId, completion_date: today, is_completed: isDone },
      { onConflict: "user_id,daily_item_id,completion_date" },
    );
    // Update day's anushthanam habit flag
    const allDone = visible.length > 0 && visible.every((s) => newComps[s.id]);
    const { data: dayRow } = await supabase.from("days").select("habits").eq("user_id", user.id).eq("day_date", today).maybeSingle();
    await supabase.from("days").upsert(
      { user_id: user.id, day_date: today, habits: { ...(dayRow?.habits || {}), anushthanam: allDone } },
      { onConflict: "user_id,day_date" },
    );
    if (allDone) {
      setHabits((prev) => ({ ...prev, anushthanam: true }));
    }
  };

  const handleNaadaSeqToggle = async (itemId) => {
    const isDone = !naadaSeqCompletions[itemId];
    const newComps = { ...naadaSeqCompletions, [itemId]: isDone };
    setNaadaSeqCompletions(newComps);
    const visible = naadaSeqItems.filter((s) => {
      if (s.frequency === "daily") return true;
      const td = dayjs();
      if (s.frequency === "weekly") return td.day() === (s.frequency_day ?? 0);
      if (s.frequency === "monthly") return td.date() === (s.frequency_day ?? 1);
      return true;
    });
    const done = visible.filter((s) => newComps[s.id]).length;
    setNaadaSeqDone(done);
    await supabase.from("naada_sequence_completions").upsert(
      { user_id: user.id, naada_item_id: itemId, completion_date: today, is_completed: isDone },
      { onConflict: "user_id,naada_item_id,completion_date" },
    );
    const allDone = visible.length > 0 && visible.every((s) => newComps[s.id]);
    const { data: dayRow } = await supabase.from("days").select("habits").eq("user_id", user.id).eq("day_date", today).maybeSingle();
    await supabase.from("days").upsert(
      { user_id: user.id, day_date: today, habits: { ...(dayRow?.habits || {}), saadhana: allDone } },
      { onConflict: "user_id,day_date" },
    );
    if (allDone) {
      setHabits((prev) => ({ ...prev, saadhana: true }));
    }
  };

  const handleWalkSave = async () => {
    if (!walkSteps && !walkKm && !walkCalories) return;
    setWalkSavingMov(true);
    const payload = {
      user_id: user.id,
      date: today,
      steps: walkSteps ? parseInt(walkSteps, 10) : null,
      km_walked: walkKm ? parseFloat(walkKm) : null,
      calories_burned: walkCalories ? parseInt(walkCalories, 10) : null,
      exercise_type: walkExType || "walk",
    };
    const { error } = await supabase.from("daily_activity").upsert(payload, { onConflict: "user_id,date" });
    setWalkSavingMov(false);
    if (error) return;
    // Mark Vyaayamam done for today
    const nextHabits = { ...habits, walk: true };
    setHabits(nextHabits);
    sync({ habits: nextHabits });
    setWalkOpen(false);
  };

  const handleCompletionConfirm = async (item, hours, satisfaction, markDone = false) => {
    if (!item) return;
    const nextHabits = { ...habits, [item.id]: true };
    const nextData = {
      ...habitsData,
      [item.id]: { hours, satisfaction, completedAt: new Date().toISOString() },
    };
    setHabits(nextHabits);
    setHabitsData(nextData);
    sync({ habits: nextHabits, habits_data: nextData });

    // Phase 4 — permanently complete an ansh and advance siddhi progress
    if (markDone && item.siddhi_id) {
      // Mark this ansh as completed in the DB
      await supabase.from("anshs").update({ status: "completed" }).eq("id", item.id);
      // Remove from local active anshs list
      setAnshs((prev) => prev.filter((a) => a.id !== item.id));

      // Recalculate progress_percent for the linked siddhi:
      // count all non-archived anshs for this siddhi, ratio completed/total
      const { data: siblingAnshs } = await supabase
        .from("anshs")
        .select("status")
        .eq("user_id", user.id)
        .eq("siddhi_id", item.siddhi_id)
        .neq("status", "archived");

      if (siblingAnshs && siblingAnshs.length > 0) {
        const total     = siblingAnshs.length;
        const completed = siblingAnshs.filter((a) => a.status === "completed").length;
        const newPct    = Math.round((completed / total) * 100);
        await supabase.from("siddhis").update({ progress_percent: newPct }).eq("id", item.siddhi_id);
        bustLakshyaSiddhisCache(); // force picker + dashboard to re-fetch
      }
    }

    setCompletionItem(null);
  };

  const handleMorningComplete = async (intention, carryOverTasks, sleepData) => {
    setMorningDone(true);
    setShowMorningFlow(false);
    const patch = { morning_flow_done: true };
    if (intention) {
      setOneThing(intention);
      patch.one_thing = intention;
    }
    if (carryOverTasks?.length) {
      const newItems = carryOverTasks.map((t) => ({
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        label: t.label,
        emoji: "🎯",
        ...(t.deep ? { deep: true } : {}),
      }));
      const n = [...customCore, ...newItems];
      setCustomCore(n);
      patch.custom_core = n;
    }
    if (sleepData?.hours || sleepData?.quality) {
      const nextHabits = { ...habits, sleep_log: sleepData };
      setHabits(nextHabits);
      patch.habits = nextHabits;
      // Sync to daily_activity under yesterday — morning flow captures last night's sleep
      const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      const { data: existingAct } = await supabase
        .from("daily_activity")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", yesterday)
        .maybeSingle();
      await supabase.from("daily_activity").upsert(
        {
          ...(existingAct || {}),
          user_id: user.id,
          date: yesterday,
          sleep_hours: sleepData.hours ?? null,
          sleep_quality: sleepData.quality ?? null,
        },
        { onConflict: "user_id,date" },
      );
    }
    await sync(patch);
  };

  const handleSaveDay = async () => {
    await sync({
      wins: wins.filter(Boolean),
      tomorrow_tasks: tomorrowTasks.filter((t) => t.label?.trim()),
      one_thing: oneThing,
      last_close: new Date().toISOString(),
    });
    setDayClosed(true);
    setShowEveningFlow(false);
    setShowSunset(false);
    setUndoSnack(true);
  };

  const handleUndoClose = async () => {
    await sync({ last_close: null });
    setDayClosed(false);
    setUndoSnack(false);
  };

  const handleAddTask = async ({
    label,
    lakshya_id,
    lakshyaTitle,
    siddhi_id,
    siddhiTitle,
    deep,
  }) => {
    // If a Siddhi is linked, create a proper ansh record in the DB
    if (siddhi_id && lakshya_id && user) {
      const { data, error } = await supabase.from("anshs").insert({
        user_id: user.id,
        lakshya_id,
        siddhi_id,
        title: label,
        status: "active",
      }).select("*, siddhi:siddhis(title), lakshya:lakshyas(title)").single();
      if (!error && data) {
        setAnshs((prev) => [...prev, data]);
      }
      setAddTaskFor(null);
      return;
    }

    const DEFAULT_SECTION_EMOJI = {
      sacred: "⭐",
      core: "🎯",
      evening: "🌙",
    };
    const item = {
      id: `custom_${Date.now()}`,
      label,
      emoji: DEFAULT_SECTION_EMOJI[addTaskFor] || "📌",
      lakshya_id: lakshya_id || null,
      lakshyaTitle: lakshyaTitle || null,
      siddhi_id: siddhi_id || null,
      siddhiTitle: siddhiTitle || null,
      ...(deep ? { deep: true } : {}),
    };
    if (addTaskFor === "sacred") {
      const n = [...customSacred, item];
      setCustomSacred(n);
      sync({ custom_sacred: n });
    }
    if (addTaskFor === "core") {
      const n = [...customCore, item];
      setCustomCore(n);
      sync({ custom_core: n });
    }
    if (addTaskFor === "evening") {
      const n = [...customEvening, item];
      setCustomEvening(n);
      sync({ custom_evening: n });
    }
    setAddTaskFor(null);
  };

  const handleDeleteTask = (section, id) => {
    const ansh = anshs.find((a) => a.id === id);
    const customArr = section === "sacred" ? customSacred : section === "core" ? customCore : customEvening;
    const task = ansh || customArr.find((t) => t.id === id);
    setDeleteTaskConfirm({ open: true, section, id, label: task?.title || task?.label || "this task" });
  };

  const confirmDeleteTask = async () => {
    const { section, id } = deleteTaskConfirm;
    setDeleteTaskConfirm({ open: false, section: null, id: null, label: "" });
    if (anshs.some((a) => a.id === id)) {
      const { error } = await supabase.from("anshs").delete().eq("id", id);
      if (!error) setAnshs((prev) => prev.filter((a) => a.id !== id));
      return;
    }
    if (section === "sacred") {
      const n = customSacred.filter((t) => t.id !== id);
      setCustomSacred(n);
      sync({ custom_sacred: n });
    }
    if (section === "core") {
      const n = customCore.filter((t) => t.id !== id);
      setCustomCore(n);
      sync({ custom_core: n });
    }
    if (section === "evening") {
      const n = customEvening.filter((t) => t.id !== id);
      setCustomEvening(n);
      sync({ custom_evening: n });
    }
  };

  const changeDayType = async (type) => {
    setDayType(type);
    await sync({ disruption_mode: type });
  };

  const markDisrupted = async () => {
    setConfirmDisrupt(false);
    setDayType("disrupted");
    await sync({ disruption_mode: "disrupted" });
  };

  const unmarkDisrupted = async () => {
    setDayType("working");
    await sync({ disruption_mode: "working" });
  };

  const renderItem = (item, section) => {
    const meta = habitsData[item.id];
    const richItem = meta ? { ...item, ...meta } : item;
    const isDeletable = !item.locked && section !== null;
    let subtitle = null;
    if (item.id === "anushthanam") {
      subtitle = seqTotal > 0 ? `${seqDone} of ${seqTotal} rituals complete` : "Open daily sequence →";
    } else if (item.id === "saadhana") {
      subtitle = naadaSeqTotal > 0 ? `${naadaSeqDone} of ${naadaSeqTotal} complete` : "Open music practice →";
    } else if (item.id === "office") {
      subtitle = vrittiProjects.length > 0
        ? `${vrittiProjects.length} active project${vrittiProjects.length > 1 ? "s" : ""} → log today's work`
        : "Log today's work →";
    } else if (item.id === "reading") {
      const book = currentBooks[0];
      if (book) {
        const prog = book.total_pages > 0 ? `${book.pages_read || 0}/${book.total_pages} pages` : null;
        subtitle = [book.title, prog].filter(Boolean).join(" · ");
      } else {
        subtitle = "Open reading tracker →";
      }
    } else if (item.id === "vidya") {
      const todayHours = vidyaTodayLogs.reduce((s, l) => s + (Number(l.hours) || 0), 0);
      subtitle = vidyaTodayLogs.length > 0
        ? `${todayHours.toFixed(1)}h logged today · ${vidyaTodayLogs.length} session${vidyaTodayLogs.length > 1 ? "s" : ""}`
        : "Log today's study →";
    } else if (item.id === "walk") {
      const todayAct = walkActivityLogs.find((a) => a.date === today);
      if (todayAct) {
        const typeLabel = todayAct.exercise_type === "strength" ? "💪 Strength" : todayAct.exercise_type === "both" ? "🔥 Both" : "🚶 Walk";
        const parts = [typeLabel];
        if (todayAct.steps) parts.push(`${(todayAct.steps / 1000).toFixed(1)}k steps`);
        if (todayAct.calories_burned) parts.push(`${todayAct.calories_burned} kcal`);
        subtitle = parts.join(" · ");
      } else {
        subtitle = "Log today's exercise →";
      }
    }
    return (
      <TaskRow
        key={item.id}
        item={richItem}
        checked={!!habits[item.id]}
        onToggle={() => handleToggle(richItem)}
        onDelete={
          isDeletable ? () => handleDeleteTask(section, item.id) : undefined
        }
        onLink={!item.locked && !item.siddhi_id ? () => setLinkingTask(richItem) : undefined}
        heroColor={heroColor}
        isDark={isDark}
        locked={!!item.locked}
        subtitle={subtitle}
      />
    );
  };

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress sx={{ color: heroColor }} />
      </Box>
    );

  return (
    <Box
      sx={{
        p: { xs: 2, md: "28px 36px" },
        maxWidth: 1100,
        mx: "auto",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 2,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Lora","Fraunces",serif',
            fontSize: 32,
            fontWeight: 600,
            color: textP,
            lineHeight: 1,
          }}
        >
          Today
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              border: `1px solid ${heroColor}40`,
              borderRadius: 12,
              px: 1.25,
              py: 0.4,
              background: `${heroColor}10`,
            }}
          >
            <AutoAwesome sx={{ fontSize: 12, color: heroColor }} />
            <Typography
              sx={{ fontSize: 11, color: heroColor, fontWeight: 600 }}
            >
              {resonanceScore}% resonance
            </Typography>
          </Box>
          {!isDisrupted && (
            <Tooltip title="Mark today as disrupted — streaks protected">
              <Box
                onClick={() => setConfirmDisrupt(true)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  border: `1px solid rgba(207,78,78,0.35)`,
                  borderRadius: 12,
                  px: 1.25,
                  py: 0.4,
                  background: "rgba(207,78,78,0.06)",
                  cursor: "pointer",
                  "&:hover": { background: "rgba(207,78,78,0.12)" },
                }}
              >
                <ReportProblem sx={{ fontSize: 11, color: "#CF4E4E" }} />
                <Typography sx={{ fontSize: 11, color: "#CF4E4E", fontWeight: 600 }}>
                  Mark Disrupted
                </Typography>
              </Box>
            </Tooltip>
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              border: `1px solid ${border}`,
              borderRadius: 12,
              px: 1.25,
              py: 0.4,
              background: cardBg,
            }}
          >
            <Sync
              sx={{
                fontSize: 13,
                color: syncing ? heroColor : "#9C9A94",
                transition: "color 0.3s",
              }}
            />
            <Typography
              sx={{
                fontSize: 11,
                color: syncing ? heroColor : "#9C9A94",
                fontWeight: 500,
              }}
            >
              {syncing ? "Saving…" : "Synced"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── DAILY QUOTE ── */}
      {dailyQuote && (
        <Box
          sx={{
            mb: 2.5,
            px: 2,
            py: 1.5,
            borderLeft: `3px solid ${heroColor}60`,
            background: `${heroColor}08`,
            borderRadius: "0 8px 8px 0",
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontFamily: '"Lora", serif',
              fontStyle: "italic",
              color: textP,
              lineHeight: 1.6,
              mb: dailyQuote.translation ? 0.4 : 0,
            }}
          >
            "{dailyQuote.text}"
          </Typography>
          {dailyQuote.translation && (
            <Typography sx={{ fontSize: 12, color: isDark ? "#9C9A94" : "#6B6962", mb: 0.3 }}>
              {dailyQuote.translation}
            </Typography>
          )}
          {dailyQuote.source && (
            <Typography sx={{ fontSize: 10, color: heroColor, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
              — {dailyQuote.source}
            </Typography>
          )}
        </Box>
      )}

      {/* ── DISRUPTION BANNER ── */}
      {isDisrupted && (
        <Fade in>
          <Box
            sx={{
              mb: 2.5,
              p: "14px 20px",
              borderRadius: 3,
              background: isDark
                ? "rgba(207,78,78,0.12)"
                : "rgba(207,78,78,0.08)",
              border: "2px solid #CF4E4E",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <ReportProblem sx={{ color: "#CF4E4E", fontSize: 22, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#CF4E4E",
                  letterSpacing: 0.3,
                }}
              >
                Disrupted Day
              </Typography>
              <Typography sx={{ fontSize: 12, color: isDark ? "#CF4E4E99" : "#CF4E4Ecc" }}>
                This day has been marked as disrupted. Core tasks are paused — streaks are protected.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={unmarkDisrupted}
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: "#CF4E4E",
                borderColor: "#CF4E4E",
                borderRadius: 2,
                px: 2,
                flexShrink: 0,
                "&:hover": { background: "#CF4E4E15", borderColor: "#CF4E4E" },
              }}
            >
              Unmark
            </Button>
          </Box>
        </Fade>
      )}

      {/* ── WEEKEND NOTICE ── */}
      {isWeekend && !isDisrupted && (
        <Fade in>
          <Box
            sx={{
              mb: 2.5,
              px: 2,
              py: 1.25,
              borderRadius: 2.5,
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${border}`,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: 16 }}>🌿</Typography>
            <Typography sx={{ fontSize: 13, color: isDark ? "#9C9A94" : "#64748b", flex: 1 }}>
              Weekend — Vritti is optional today. Tap it to mark done whenever you're ready.
            </Typography>
          </Box>
        </Fade>
      )}


      {/* ── CONFIRM DISRUPT DIALOG ── */}
      <Dialog
        open={confirmDisrupt}
        onClose={() => setConfirmDisrupt(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif', fontWeight: 400, fontSize: 20 }}>
          Mark Today as Disrupted?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.7 }}>
            This will flag today as a disrupted day. Core work tasks will be paused and your streaks will be protected from breaking.
            <br /><br />
            You can unmark this at any time.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmDisrupt(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={markDisrupted}
            variant="contained"
            sx={{ bgcolor: "#CF4E4E", "&:hover": { bgcolor: "#b03535" }, boxShadow: "none" }}
          >
            Yes, Mark Disrupted
          </Button>
        </DialogActions>
      </Dialog>
      <PanchangamCard
        data={panchangam}
        loading={panchLoading}
        heroColor={heroColor}
        isDark={isDark}
      />

      {!morningDone && !dayClosed && (
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setShowMorningFlow(true)}
          startIcon={<WbSunny sx={{ fontSize: 16 }} />}
          sx={{
            mb: 2.5,
            py: 1,
            borderColor: `${heroColor}40`,
            color: heroColor,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            borderRadius: 2,
            "&:hover": { background: `${heroColor}06`, borderColor: heroColor },
          }}
        >
          Start Morning Flow
        </Button>
      )}
      {morningDone && (
        <Box
          sx={{
            mb: 2.5,
            py: 0.75,
            px: 2,
            borderRadius: 2,
            border: `1px solid ${heroColor}30`,
            background: `${heroColor}08`,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CheckCircle sx={{ fontSize: 14, color: heroColor }} />
          <Typography
            sx={{
              fontSize: 12,
              color: heroColor,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Morning Flow Complete
          </Typography>
        </Box>
      )}

      {isMorning && !dismissMorning && !morningDone && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            background: `${heroColor}08`,
            border: `1px solid ${heroColor}25`,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <WbSunny sx={{ fontSize: 18, color: heroColor, flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP }}>
              Good morning — begin with the sacred
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#9C9A94" }}>
              {allSacred.filter((s) => habits[s.id]).length}/{allSacred.length}{" "}
              foundations complete
            </Typography>
          </Box>
          <Typography
            onClick={() => setDismissMorning(true)}
            sx={{
              fontSize: 11,
              color: "#9C9A94",
              cursor: "pointer",
              "&:hover": { color: textP },
            }}
          >
            Dismiss
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1.35fr" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 2,
              background: cardBg,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ px: 2, py: "14px !important" }}>
              <SectionHeader
                label="Sacred Foundations"
                heroColor={heroColor}
                isDark={isDark}
                locked
                onAdd={() => setAddTaskFor("sacred")}
              />
              {allSacred.map((item) =>
                renderItem(item, item.locked ? null : "sacred"),
              )}
            </CardContent>
          </Card>
          {!isGrace && (
            <Card
              sx={{
                border: `1px solid ${border}`,
                borderRadius: 2,
                background: cardBg,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ px: 2, py: "14px !important" }}>
                <SectionHeader
                  label="The Core of the Day"
                  heroColor={heroColor}
                  isDark={isDark}
                  onAdd={() => setAddTaskFor("core")}
                />
                {allCore.length === 0 && anshs.length === 0 ? (
                  <EmptyState
                    message="No core tasks — add one or create a Lakshya"
                    heroColor={heroColor}
                    isDark={isDark}
                    onAdd={() => setAddTaskFor("core")}
                  />
                ) : (
                  <>
                    {allCore.map((item) => renderItem(item, item.locked ? null : "core"))}
                    {anshs.length > 0 && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, mb: 0.5, px: 0.5 }}>
                        <Box sx={{ flex: 1, height: "1px", bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
                        <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: heroColor, opacity: 0.7 }}>
                          Milestone Tasks
                        </Typography>
                        <Box sx={{ flex: 1, height: "1px", bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
                      </Box>
                    )}
                    {anshs.map((ansh) =>
                      renderItem(
                        {
                          id: ansh.id,
                          label: ansh.title,
                          lakshyaTitle: ansh.lakshya?.title || null,
                          siddhiTitle: ansh.siddhi?.title || null,
                          siddhi_id: ansh.siddhi_id || null,
                          lakshya_id: ansh.lakshya_id || null,
                          deep: true,
                        },
                        "core",
                      ),
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 2,
              background: cardBg,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ px: 2.5, py: "18px !important" }}>
              <SectionHeader
                label="The One Thing Today"
                heroColor={heroColor}
                isDark={isDark}
              />
              <TextField
                fullWidth
                multiline
                minRows={3}
                variant="standard"
                placeholder="The single most important task?"
                value={oneThing}
                onChange={(e) => setOneThing(e.target.value)}
                onBlur={() => sync({ one_thing: oneThing })}
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& textarea": {
                    fontFamily: '"Lora","Fraunces",serif',
                    fontStyle: "italic",
                    fontSize: 17,
                    color: textP,
                    lineHeight: 1.6,
                    "&::placeholder": {
                      color: isDark ? "#3C3A36" : "#C8C6C0",
                      fontStyle: "italic",
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 2,
              background: cardBg,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ px: 2, py: "14px !important" }}>
              <SectionHeader
                label="Wind Down"
                heroColor={heroColor}
                isDark={isDark}
                onAdd={() => setAddTaskFor("evening")}
              />
              {allEvening.length === 0 ? (
                <EmptyState
                  message="No evening habits"
                  heroColor={heroColor}
                  isDark={isDark}
                  onAdd={() => setAddTaskFor("evening")}
                />
              ) : (
                allEvening.map((item) => renderItem(item, "evening"))
              )}
            </CardContent>
          </Card>
          {dayClosed ? (
            <Box
              sx={{
                borderRadius: 2,
                border: `1px solid ${heroColor}35`,
                background: isDark ? `${heroColor}08` : `${heroColor}06`,
                p: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Nightlight sx={{ fontSize: 16, color: heroColor }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: heroColor, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Day Closed
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={handleUndoClose}
                  sx={{ fontSize: 11, color: isDark ? "#9C9A94" : "#64748b", py: 0.25, px: 1, minWidth: 0, textTransform: "none" }}
                >
                  Reopen
                </Button>
              </Box>
              <Typography sx={{ fontSize: 12.5, color: isDark ? "#7A7874" : "#5F5F5F", mb: 2, fontFamily: '"Lora",serif', fontStyle: "italic" }}>
                Rest well. Tomorrow begins fresh.
              </Typography>
              {wins.filter(Boolean).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: isDark ? "#5C5A52" : "#9C9A94", mb: 1 }}>
                    Today's wins
                  </Typography>
                  {wins.filter(Boolean).map((w, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 0.75 }}>
                      <Typography sx={{ fontSize: 11, color: heroColor, mt: 0.15, flexShrink: 0 }}>✦</Typography>
                      <Typography sx={{ fontSize: 13, color: isDark ? "#D0CEC8" : "#2C2C2C", lineHeight: 1.5 }}>{w}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {tomorrowTasks.filter((t) => t.label?.trim()).length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: isDark ? "#5C5A52" : "#9C9A94", mb: 1 }}>
                    Flagged for tomorrow
                  </Typography>
                  {tomorrowTasks.filter((t) => t.label?.trim()).map((t, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.75 }}>
                      <Typography sx={{ fontSize: 11, color: isDark ? "#5C5A52" : "#9C9A94", flexShrink: 0 }}>→</Typography>
                      <Typography sx={{ fontSize: 13, color: isDark ? "#D0CEC8" : "#2C2C2C", flex: 1, lineHeight: 1.5 }}>{t.label}</Typography>
                      {t.deep && (
                        <Box sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: heroColor, background: `${heroColor}15`, px: 0.75, py: 0.2, borderRadius: 1, flexShrink: 0 }}>
                          DEEP
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={() => setShowSunset(true)}
              sx={{
                py: 1.4,
                borderRadius: 2,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                background: heroColor,
                color: "#fff",
                "&:hover": { background: heroColor, opacity: 0.88 },
                boxShadow: "none",
              }}
            >
              Close the day
            </Button>
          )}
        </Box>
      </Box>

      <MorningFlowModal
        open={showMorningFlow}
        onClose={() => setShowMorningFlow(false)}
        onComplete={handleMorningComplete}
        heroColor={heroColor}
        isDark={isDark}
        pendingSacred={allSacred.filter((s) => !habits[s.id])}
        yesterdayTasks={yesterdayTasks}
      />
      <EveningFlowModal
        open={showEveningFlow}
        onClose={() => setShowEveningFlow(false)}
        heroColor={heroColor}
        isDark={isDark}
        onSave={handleSaveDay}
        wins={wins}
        setWins={setWins}
        tomorrowTasks={tomorrowTasks}
        setTomorrowTasks={setTomorrowTasks}
      />
      <SunsetDialog
        open={showSunset}
        onClose={() => setShowSunset(false)}
        onConfirm={() => {
          setShowSunset(false);
          setShowEveningFlow(true);
        }}
        heroColor={heroColor}
        isDark={isDark}
        resonanceScore={resonanceScore}
      />
      <DisruptModal
        open={showDisrupt}
        onClose={() => setShowDisrupt(false)}
        onSelect={changeDayType}
        heroColor={heroColor}
        isDark={isDark}
      />
      <CompletionDialog
        open={!!completionItem}
        item={completionItem}
        onConfirm={handleCompletionConfirm}
        onClose={() => setCompletionItem(null)}
        heroColor={heroColor}
        isDark={isDark}
        anshSiddhiId={
          completionItem
            ? (anshs.find((a) => a.id === completionItem.id)?.siddhi_id ?? completionItem.siddhi_id ?? null)
            : null
        }
      />
      <AddTaskDialog
        open={!!addTaskFor}
        section={addTaskFor}
        onAdd={handleAddTask}
        onClose={() => setAddTaskFor(null)}
        heroColor={heroColor}
        isDark={isDark}
        lakshyas={lakshyas}
      />
      <LinkLakshyaDialog
        open={!!linkingTask}
        task={linkingTask}
        lakshyas={lakshyas}
        currentLink={linkingTask ? taskLakshyaLinks[linkingTask.id] : null}
        onSave={saveTaskLakshyaLink}
        onClose={() => setLinkingTask(null)}
        heroColor={heroColor}
        isDark={isDark}
      />
      {/* ── TASK DELETE CONFIRM ── */}
      <Dialog
        open={deleteTaskConfirm.open}
        onClose={() => setDeleteTaskConfirm({ open: false, section: null, id: null, label: "" })}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 360 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif', fontWeight: 400, fontSize: 20, color: textP }}>
          Remove task?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: isDark ? "#9C9A94" : "#6B6962" }}>
            Remove <strong>"{deleteTaskConfirm.label}"</strong> from today's list?{" "}
            {anshs.some((a) => a.id === deleteTaskConfirm.id)
              ? "This is a permanent ansh — it will be deleted from the system entirely."
              : "This is a custom task for today only."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteTaskConfirm({ open: false, section: null, id: null, label: "" })}
            sx={{ color: isDark ? "#9C9A94" : "#6B6962", textTransform: "none", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmDeleteTask}
            sx={{ bgcolor: "#CF4E4E", color: "#fff", textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "#B03030" } }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={errSnack}
        autoHideDuration={5000}
        onClose={() => setErrSnack(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        message="⚠️ Save failed — check your connection"
        ContentProps={{
          sx: { background: "#7F1D1D", borderRadius: 2, fontSize: 13 },
        }}
      />
      <Snackbar
        open={undoSnack}
        autoHideDuration={8000}
        onClose={() => setUndoSnack(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        message="Day closed 🌙"
        action={
          <Button
            size="small"
            onClick={handleUndoClose}
            sx={{ color: heroColor, fontWeight: 700, fontSize: 12 }}
          >
            Undo
          </Button>
        }
        ContentProps={{
          sx: { background: "#2C2C2C", borderRadius: 2, fontSize: 13 },
        }}
      />

      {/* ── VYAAYAMAM POPUP ── */}
      <Dialog
        open={walkOpen}
        onClose={() => setWalkOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: isDark ? "#1A1916" : "#FDFCFA",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2DDD6"}`,
            overflow: "hidden",
          },
        }}
      >
        {/* header */}
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: "flex", alignItems: "center", gap: 1.5, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#EAE6E0"}` }}>
          <Typography sx={{ fontSize: 18 }}>🏃</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 600, fontSize: 17, color: isDark ? "#F0EDE8" : "#2C2C2C", lineHeight: 1.2 }}>
              Vyaayamam
            </Typography>
            {(() => {
              const streak = (() => {
                let s = 0;
                for (let i = 0; i < 7; i++) {
                  const d = dayjs().subtract(i, "day").format("YYYY-MM-DD");
                  if (walkActivityLogs.find((a) => a.date === d)) s++;
                  else break;
                }
                return s;
              })();
              return streak > 1 ? (
                <Typography sx={{ fontSize: 11, color: "#C07830", fontWeight: 500, mt: 0.2 }}>🔥 {streak} day streak</Typography>
              ) : null;
            })()}
          </Box>
          <IconButton size="small" onClick={() => setWalkOpen(false)} sx={{ color: isDark ? "#7C7A74" : "#9C9A94" }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2.5, pt: 2, pb: 1 }}>
          {/* 7-day dot strip */}
          <Box sx={{ display: "flex", gap: 0.75, mb: 2.5, justifyContent: "center" }}>
            {[6,5,4,3,2,1,0].map((daysAgo) => {
              const d = dayjs().subtract(daysAgo, "day");
              const entry = walkActivityLogs.find((a) => a.date === d.format("YYYY-MM-DD"));
              const typeEmoji = entry ? (entry.exercise_type === "strength" ? "💪" : entry.exercise_type === "both" ? "🔥" : "🚶") : null;
              const isToday = daysAgo === 0;
              return (
                <Box key={daysAgo} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.3 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: entry ? 14 : 10,
                    background: entry ? (isDark ? "rgba(192,120,48,0.2)" : "rgba(192,120,48,0.12)") : (isDark ? "#1F1E1B" : "#F0EDE8"),
                    border: isToday ? `2px solid #C07830` : `1px solid ${isDark ? "#3C3C3C" : "#D1D0CF"}`,
                  }}>
                    {entry ? typeEmoji : <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: isDark ? "#3C3C3C" : "#D1D0CF" }} />}
                  </Box>
                  <Typography sx={{ fontSize: 9, color: isDark ? "#5C5A54" : "#B0AEA8", fontWeight: isToday ? 700 : 400 }}>
                    {d.format("dd")[0]}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Exercise type chips */}
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: isDark ? "#7C7A74" : "#9C9A94", textTransform: "uppercase", letterSpacing: 0.8, mb: 1 }}>
            What did you do today?
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            {[
              { value: "walk", label: "🚶 Walk", note: "Daily non-negotiable" },
              { value: "strength", label: "💪 Strength", note: "Walk substitute" },
              { value: "both", label: "🔥 Both", note: "Full day" },
            ].map((opt) => (
              <Box
                key={opt.value}
                onClick={() => setWalkExType(opt.value)}
                sx={{
                  flex: 1, py: 1, px: 0.5, borderRadius: 2, textAlign: "center",
                  border: `1.5px solid ${walkExType === opt.value ? "#C07830" : isDark ? "#3C3C3C" : "#D1D0CF"}`,
                  background: walkExType === opt.value ? (isDark ? "rgba(192,120,48,0.12)" : "rgba(192,120,48,0.08)") : "transparent",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <Typography sx={{ fontSize: 15 }}>{opt.label.split(" ")[0]}</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: walkExType === opt.value ? "#C07830" : isDark ? "#7C7A74" : "#9C9A94", mt: 0.2 }}>
                  {opt.label.split(" ")[1]}
                </Typography>
                <Typography sx={{ fontSize: 9, color: isDark ? "#5C5A54" : "#B0AEA8" }}>{opt.note}</Typography>
              </Box>
            ))}
          </Box>

          {/* Steps + km — dimmed for strength */}
          {walkExType !== "strength" && (
            <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
              {[
                { label: "Steps", val: walkSteps, set: setWalkSteps, placeholder: "e.g. 8000", step: 100 },
                { label: "km", val: walkKm, set: setWalkKm, placeholder: "e.g. 5.2", step: 0.1 },
              ].map((f) => (
                <Box key={f.label} sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: isDark ? "#9C9A94" : "#6B6962", mb: 0.5 }}>{f.label}</Typography>
                  <Box
                    component="input"
                    type="number"
                    placeholder={f.placeholder}
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    sx={{
                      width: "100%", boxSizing: "border-box",
                      px: 1.5, py: 1, borderRadius: 1.5,
                      border: `1px solid ${isDark ? "#3C3C3C" : "#D1D0CF"}`,
                      background: isDark ? "#141312" : "#F8F6F2",
                      color: isDark ? "#F0EDE8" : "#2C2C2C",
                      fontSize: 14, fontFamily: "inherit",
                      outline: "none", "&:focus": { borderColor: "#C07830" },
                    }}
                  />
                  {/* progress bar */}
                  {(() => {
                    const target = f.label === "Steps" ? WALK_TARGETS.steps : WALK_TARGETS.km;
                    const val = f.label === "Steps" ? (walkSteps ? parseInt(walkSteps) : 0) : (walkKm ? parseFloat(walkKm) : 0);
                    if (!val) return null;
                    const pct = Math.min(val / target, 1);
                    const clr = pct >= 1 ? "#2D7A4F" : pct >= 0.7 ? "#4A90E2" : pct >= 0.4 ? "#DDA74F" : "#CF4E4E";
                    return (
                      <Box sx={{ mt: 0.75 }}>
                        <Box sx={{ height: 4, borderRadius: 2, bgcolor: isDark ? "#2A2926" : "#EAE6E0", overflow: "hidden" }}>
                          <Box sx={{ width: `${pct * 100}%`, height: "100%", bgcolor: clr, borderRadius: 2, transition: "width 0.3s" }} />
                        </Box>
                        <Typography sx={{ fontSize: 9, color: clr, mt: 0.3 }}>{Math.round(pct * 100)}% of target</Typography>
                      </Box>
                    );
                  })()}
                </Box>
              ))}
            </Box>
          )}

          {/* Calories */}
          <Box sx={{ mb: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: isDark ? "#9C9A94" : "#6B6962", mb: 0.5 }}>🔥 Active Calories (kcal)</Typography>
            <Box
              component="input"
              type="number"
              placeholder="e.g. 450"
              value={walkCalories}
              onChange={(e) => setWalkCalories(e.target.value)}
              sx={{
                width: "100%", boxSizing: "border-box",
                px: 1.5, py: 1, borderRadius: 1.5,
                border: `1px solid ${isDark ? "#3C3C3C" : "#D1D0CF"}`,
                background: isDark ? "#141312" : "#F8F6F2",
                color: isDark ? "#F0EDE8" : "#2C2C2C",
                fontSize: 14, fontFamily: "inherit",
                outline: "none",
              }}
            />
            {walkCalories && parseInt(walkCalories) > 0 && (() => {
              const pct = Math.min(parseInt(walkCalories) / WALK_TARGETS.calories, 1);
              const clr = pct >= 1 ? "#2D7A4F" : pct >= 0.7 ? "#4A90E2" : pct >= 0.4 ? "#DDA74F" : "#CF4E4E";
              return (
                <Box sx={{ mt: 0.75 }}>
                  <Box sx={{ height: 4, borderRadius: 2, bgcolor: isDark ? "#2A2926" : "#EAE6E0", overflow: "hidden" }}>
                    <Box sx={{ width: `${pct * 100}%`, height: "100%", bgcolor: clr, borderRadius: 2, transition: "width 0.3s" }} />
                  </Box>
                  <Typography sx={{ fontSize: 9, color: clr, mt: 0.3 }}>{Math.round(pct * 100)}% of {WALK_TARGETS.calories} kcal target</Typography>
                </Box>
              );
            })()}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2, pt: 1 }}>
          <Button size="small" onClick={() => setWalkOpen(false)} sx={{ color: isDark ? "#7C7A74" : "#9C9A94", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={walkSavingMov || (!walkSteps && !walkKm && !walkCalories)}
            onClick={handleWalkSave}
            sx={{ background: "#2D7A4F", color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, fontSize: 13, "&:hover": { background: "#1A5F3A" }, ml: "auto" }}
          >
            {walkSavingMov ? "Saving…" : "Log it ✓"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── VRITTI POPUP ── */}
      <Dialog open={vrittiOpen} onClose={() => setVrittiOpen(false)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, background: isDark ? "#0E1420" : "#F8FAFE", border: `1px solid ${isDark ? "rgba(26,95,176,0.22)" : "rgba(26,95,176,0.18)"}`, overflow: "hidden" } }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: "flex", alignItems: "center", gap: 1.5, borderBottom: `1px solid ${isDark ? "rgba(26,95,176,0.15)" : "#E0E8F8"}` }}>
          <Typography sx={{ fontSize: 18 }}>🚀</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 600, fontSize: 17, color: isDark ? "#F0EDE8" : "#0A1628", lineHeight: 1.2 }}>
              Vṛtti
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#1A5FB0", fontWeight: 500, mt: 0.2 }}>
              {vrittiProjects.length > 0 ? `${vrittiProjects.length} active project${vrittiProjects.length > 1 ? "s" : ""}` : "No active projects"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setVrittiOpen(false)} sx={{ color: isDark ? "#7C7A74" : "#9C9A94" }}><Close sx={{ fontSize: 18 }} /></IconButton>
        </Box>
        <DialogContent sx={{ px: 2.5, py: 1.5 }}>
          {vrittiProjects.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography sx={{ fontSize: 13, color: isDark ? "#7C7A74" : "#9C9A94" }}>No active projects.</Typography>
              <Typography sx={{ fontSize: 12, color: isDark ? "#5C5A54" : "#B0AEA8", mt: 0.5 }}>Add projects in the Vṛtti tracker.</Typography>
            </Box>
          ) : vrittiProjects.map((p) => (
            <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.25, px: 1, borderRadius: 2,
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#EEF2FA"}`, "&:last-child": { borderBottom: "none" } }}>
              <Typography sx={{ fontSize: 16, lineHeight: 1 }}>{p.priority === 3 ? "🔴" : p.priority === 1 ? "🟢" : "🟡"}</Typography>
              <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 500, color: isDark ? "#E0E8F8" : "#0A1628" }}>{p.title}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, pt: 0.5, justifyContent: "space-between" }}>
          <Button size="small" onClick={() => { setVrittiOpen(false); navigate("/svadhyaya/vrutti", { state: { tab: 1 } }); }}
            sx={{ color: isDark ? "#7C7A74" : "#9C9A94", textTransform: "none", fontSize: 12 }}>Open full tracker →</Button>
          <Button variant="contained" size="small" onClick={() => {
            const nextHabits = { ...habits, office: true };
            setHabits(nextHabits);
            sync({ habits: nextHabits });
            setVrittiOpen(false);
          }}
            sx={{ background: "#1A5FB0", color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, fontSize: 13, "&:hover": { background: "#1050A0" } }}>
            Mark Done ✓
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── VIDYA STUDY LOG POPUP ── */}
      <Dialog open={vidyaOpen} onClose={() => { setVidyaOpen(false); setVidyaLogForm({ hours: "", source_type: "book", source_id: "", notes: "" }); }}
        fullWidth maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, background: isDark ? "#1A1210" : "#FDF8F5", border: `1px solid ${isDark ? "rgba(139,58,47,0.25)" : "rgba(139,58,47,0.20)"}`, overflow: "hidden" } }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: "flex", alignItems: "center", gap: 1.5, borderBottom: `1px solid ${isDark ? "rgba(139,58,47,0.15)" : "#F0E0DC"}` }}>
          <Typography sx={{ fontSize: 18 }}>📚</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 600, fontSize: 17, color: isDark ? "#F0EDE8" : "#2C1210", lineHeight: 1.2 }}>
              Vidyā
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#8B3A2F", fontWeight: 500, mt: 0.2 }}>
              {vidyaTodayLogs.length > 0
                ? `${vidyaTodayLogs.reduce((s, l) => s + (Number(l.hours) || 0), 0).toFixed(1)}h logged today`
                : "Log today's learning"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setVidyaOpen(false)} sx={{ color: isDark ? "#7C7A74" : "#9C9A94" }}><Close sx={{ fontSize: 18 }} /></IconButton>
        </Box>
        <DialogContent sx={{ px: 2.5, py: 1.5 }}>
          {/* Past sessions today */}
          {vidyaTodayLogs.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {vidyaTodayLogs.map((log) => (
                <Box key={log.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.9, px: 1, borderRadius: 2,
                  borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F4EAE8"}`, "&:last-child": { borderBottom: "none" } }}>
                  <Box sx={{ minWidth: 36, height: 36, borderRadius: 2, bgcolor: isDark ? "rgba(139,58,47,0.18)" : "rgba(139,58,47,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#8B3A2F" }}>{Number(log.hours).toFixed(1)}h</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, color: isDark ? "#F0EDE8" : "#2C1210" }}>
                      {log.source_title || (log.source_type === "book" ? "Book study" : "Course study")}
                    </Typography>
                    {log.notes && <Typography noWrap sx={{ fontSize: 11, color: isDark ? "#8C7A74" : "#9C8A84", mt: 0.1 }}>{log.notes}</Typography>}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
          {/* Quick log form */}
          <Box sx={{ bgcolor: isDark ? "rgba(139,58,47,0.08)" : "rgba(139,58,47,0.05)", borderRadius: 2, p: 1.5, border: `1px solid ${isDark ? "rgba(139,58,47,0.18)" : "rgba(139,58,47,0.14)"}` }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#8B3A2F", letterSpacing: 0.5, textTransform: "uppercase", mb: 1.25 }}>Log a session</Typography>
            {/* Source type toggle */}
            <Box sx={{ display: "flex", gap: 1, mb: 1.25 }}>
              {["book", "course"].map((t) => (
                <Box key={t} onClick={() => setVidyaLogForm((f) => ({ ...f, source_type: t, source_id: "" }))}
                  sx={{ flex: 1, py: 0.6, borderRadius: 1.5, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    bgcolor: vidyaLogForm.source_type === t ? "#8B3A2F" : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                    color: vidyaLogForm.source_type === t ? "#fff" : (isDark ? "#9C8A84" : "#7A6A64"),
                    border: `1px solid ${vidyaLogForm.source_type === t ? "#8B3A2F" : (isDark ? "rgba(255,255,255,0.08)" : "#E0D8D4")}`,
                    transition: "all 0.15s" }}>
                  {t === "book" ? "📖 Book" : "🎓 Course"}
                </Box>
              ))}
            </Box>
            {/* Source picker */}
            {(vidyaLogForm.source_type === "book" ? currentBooks : vidyaCourses).length > 0 && (
              <Box component="select"
                value={vidyaLogForm.source_id}
                onChange={(e) => setVidyaLogForm((f) => ({ ...f, source_id: e.target.value }))}
                sx={{ width: "100%", mb: 1.25, p: "6px 10px", borderRadius: 1.5, fontSize: 13,
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                  color: isDark ? "#F0EDE8" : "#2C1210",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#D8CCC8"}`,
                  outline: "none" }}>
                <option value="">— pick {vidyaLogForm.source_type} —</option>
                {(vidyaLogForm.source_type === "book" ? currentBooks : vidyaCourses).map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </Box>
            )}
            {/* Hours */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1.25 }}>
              <Typography sx={{ fontSize: 12, color: isDark ? "#9C8A84" : "#7A6A64", minWidth: 40 }}>Hours</Typography>
              <Box component="input" type="number" min="0.25" max="12" step="0.25"
                value={vidyaLogForm.hours}
                onChange={(e) => setVidyaLogForm((f) => ({ ...f, hours: e.target.value }))}
                placeholder="e.g. 1.5"
                sx={{ flex: 1, p: "5px 10px", borderRadius: 1.5, fontSize: 13,
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                  color: isDark ? "#F0EDE8" : "#2C1210",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#D8CCC8"}`,
                  outline: "none" }} />
            </Box>
            {/* Notes */}
            <Box component="textarea" rows={2}
              value={vidyaLogForm.notes}
              onChange={(e) => setVidyaLogForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notes (optional)"
              sx={{ width: "100%", p: "6px 10px", borderRadius: 1.5, fontSize: 12, resize: "none",
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                color: isDark ? "#F0EDE8" : "#2C1210",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#D8CCC8"}`,
                outline: "none", boxSizing: "border-box" }} />
            <Button fullWidth variant="contained" size="small" disabled={!vidyaLogForm.hours || vidyaLogSaving}
              onClick={async () => {
                if (!vidyaLogForm.hours) return;
                setVidyaLogSaving(true);
                const src = (vidyaLogForm.source_type === "book" ? currentBooks : vidyaCourses).find((s) => s.id === vidyaLogForm.source_id);
                const { data: newLog } = await supabase.from("vidya_study_log").insert({
                  user_id: user.id,
                  date: today,
                  hours: Number(vidyaLogForm.hours),
                  source_type: vidyaLogForm.source_id ? vidyaLogForm.source_type : "manual",
                  source_id: vidyaLogForm.source_id || null,
                  source_title: src?.title || null,
                  notes: vidyaLogForm.notes || null,
                }).select().single();
                if (newLog) setVidyaTodayLogs((prev) => [newLog, ...prev]);
                setVidyaLogForm({ hours: "", source_type: "book", source_id: "", notes: "" });
                setVidyaLogSaving(false);
              }}
              sx={{ mt: 1.25, background: "#8B3A2F", color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, fontSize: 13, "&:hover": { background: "#6A2A1F" }, "&:disabled": { opacity: 0.5 } }}>
              {vidyaLogSaving ? "Saving…" : "Log Session"}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, pt: 0.5, justifyContent: "space-between" }}>
          <Button size="small" onClick={() => { setVidyaOpen(false); navigate("/tracker/vidya"); }}
            sx={{ color: isDark ? "#7C7A74" : "#9C9A94", textTransform: "none", fontSize: 12 }}>Open full tracker →</Button>
          <Button variant="contained" size="small" onClick={() => {
            const nextHabits = { ...habits, vidya: true };
            setHabits(nextHabits);
            sync({ habits: nextHabits });
            setVidyaOpen(false);
          }}
            sx={{ background: "#8B3A2F", color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, fontSize: 13, "&:hover": { background: "#6A2A1F" } }}>
            Mark Done ✓
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── READING / VIDYA POPUP ── */}
      <Dialog open={readingOpen} onClose={() => setReadingOpen(false)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, background: isDark ? "#1A1610" : "#FDFAF5", border: `1px solid ${isDark ? "rgba(160,82,45,0.22)" : "rgba(160,82,45,0.20)"}`, overflow: "hidden" } }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: "flex", alignItems: "center", gap: 1.5, borderBottom: `1px solid ${isDark ? "rgba(160,82,45,0.15)" : "#F0E8E0"}` }}>
          <Typography sx={{ fontSize: 18 }}>📖</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 600, fontSize: 17, color: isDark ? "#F0EDE8" : "#2C2C2C", lineHeight: 1.2 }}>
              Pustaka Pathanam
            </Typography>
            {currentBooks[0] && (
              <Typography sx={{ fontSize: 11, color: "#C07830", fontWeight: 500, mt: 0.2 }}>{currentBooks[0].title}</Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setReadingOpen(false)} sx={{ color: isDark ? "#7C7A74" : "#9C9A94" }}><Close sx={{ fontSize: 18 }} /></IconButton>
        </Box>
        <DialogContent sx={{ px: 2.5, py: 1.5 }}>
          {/* Current books */}
          {currentBooks.map((b) => {
            const prog = b.total_pages > 0 ? Math.round(((b.pages_read || 0) / b.total_pages) * 100) : 0;
            const barColor = prog >= 90 ? "#2D7A4F" : prog >= 60 ? "#C07830" : "#A0522D";
            return (
              <Box key={b.id} sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: isDark ? "rgba(160,82,45,0.08)" : "rgba(160,82,45,0.06)", border: `1px solid ${isDark ? "rgba(160,82,45,0.18)" : "rgba(160,82,45,0.15)"}` }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: isDark ? "#F0EDE8" : "#2C2C2C" }}>{b.title}</Typography>
                {b.author && <Typography sx={{ fontSize: 11, color: isDark ? "#9C8A74" : "#7A5A3A", mt: 0.2 }}>by {b.author}</Typography>}
                {b.total_pages > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
                      <Typography sx={{ fontSize: 10, color: isDark ? "#9C8A74" : "#7A5A3A" }}>Page {b.pages_read || 0} of {b.total_pages}</Typography>
                      <Typography sx={{ fontSize: 10, color: barColor, fontWeight: 700 }}>{prog}%</Typography>
                    </Box>
                    <Box sx={{ height: 4, borderRadius: 2, bgcolor: `${barColor}22`, overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: `${prog}%`, bgcolor: barColor, borderRadius: 2, transition: "width 0.3s" }} />
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
          {/* Today's vidya practice */}
          {vidyaPracItems.filter((s) => {
            const t = dayjs();
            if (s.frequency === "daily") return true;
            if (s.frequency === "weekly") return t.day() === (s.frequency_day ?? 0);
            if (s.frequency === "monthly") return t.date() === (s.frequency_day ?? 1);
            return true;
          }).map((item) => {
            const done = !!vidyaPracComps[item.id];
            return (
              <Box key={item.id} onClick={() => {
                haptic(8);
                const isDone = !vidyaPracComps[item.id];
                setVidyaPracComps((prev) => ({ ...prev, [item.id]: isDone }));
                supabase.from("vidya_practice_completions").upsert(
                  { user_id: user.id, vidya_item_id: item.id, completion_date: today, is_completed: isDone },
                  { onConflict: "user_id,vidya_item_id,completion_date" }
                );
              }} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.1, px: 1, borderRadius: 2, cursor: "pointer",
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F0EDE8"}`, "&:last-child": { borderBottom: "none" },
                "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }, opacity: done ? 0.6 : 1 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: done ? "#C07830" : isDark ? "#1F1E1B" : "#F0EDE8", border: `1.5px solid ${done ? "#C07830" : isDark ? "#3C3C3C" : "#D1D0CF"}`, transition: "all 0.15s" }}>
                  {done ? <CheckCircle sx={{ fontSize: 13, color: "#fff" }} /> : <RadioButtonUnchecked sx={{ fontSize: 13, color: isDark ? "#5C5A54" : "#C8C6C0" }} />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, color: done ? (isDark ? "#5C5A54" : "#9C9A94") : (isDark ? "#F0EDE8" : "#2C2C2C"),
                    textDecoration: done ? "line-through" : "none" }}>
                    {item.emoji ? `${item.emoji} ` : ""}{item.label}
                  </Typography>
                  {item.duration_minutes && <Typography sx={{ fontSize: 10, color: isDark ? "#6C6A64" : "#B0AEA8", mt: 0.1 }}>{item.duration_minutes} min</Typography>}
                </Box>
              </Box>
            );
          })}
          {currentBooks.length === 0 && vidyaPracItems.length === 0 && (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography sx={{ fontSize: 13, color: isDark ? "#7C7A74" : "#9C9A94" }}>Nothing set up yet.</Typography>
              <Typography sx={{ fontSize: 12, color: isDark ? "#5C5A54" : "#B0AEA8", mt: 0.5 }}>Add books and practice items in the Vidyā tracker.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, pt: 0.5, justifyContent: "space-between" }}>
          <Button size="small" onClick={() => { setReadingOpen(false); navigate("/svadhyaya/vidya", { state: { tab: 1 } }); }}
            sx={{ color: isDark ? "#7C7A74" : "#9C9A94", textTransform: "none", fontSize: 12 }}>Open full tracker →</Button>
          <Button variant="contained" size="small" onClick={() => {
            const nextHabits = { ...habits, reading: true };
            setHabits(nextHabits);
            sync({ habits: nextHabits });
            setReadingOpen(false);
          }}
            sx={{ background: "#C07830", color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, fontSize: 13, "&:hover": { background: "#A0621A" } }}>
            Mark Done ✓
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── NAADA SAADHANA POPUP ── */}
      <Dialog
        open={naadaSeqOpen}
        onClose={() => setNaadaSeqOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: isDark ? "#1A1916" : "#FDFCFA",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2DDD6"}`,
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#EAE6E0"}`,
          }}
        >
          <Typography sx={{ fontSize: 18 }}>🎵</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontFamily: '"Fraunces","Lora",serif',
                fontWeight: 600,
                fontSize: 17,
                color: isDark ? "#F0EDE8" : "#2C2C2C",
                lineHeight: 1.2,
              }}
            >
              Naada Saadhana
            </Typography>
            {naadaSeqTotal > 0 && (
              <Typography sx={{ fontSize: 11, color: "#C07830", fontWeight: 500, mt: 0.2 }}>
                {naadaSeqDone} of {naadaSeqTotal} practice items complete
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setNaadaSeqOpen(false)} sx={{ color: isDark ? "#7C7A74" : "#9C9A94" }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2.5, py: 1.5 }}>
          {(() => {
            const todayDay = dayjs();
            const visibleNaada = naadaSeqItems.filter((s) => {
              if (s.frequency === "daily") return true;
              if (s.frequency === "weekly") return todayDay.day() === (s.frequency_day ?? 0);
              if (s.frequency === "monthly") return todayDay.date() === (s.frequency_day ?? 1);
              return true;
            });
            if (visibleNaada.length === 0) {
              return (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 13, color: isDark ? "#7C7A74" : "#9C9A94" }}>
                    No practice items scheduled for today.
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: isDark ? "#5C5A54" : "#B0AEA8", mt: 0.5 }}>
                    Add items in the Naada Saadhana tracker.
                  </Typography>
                </Box>
              );
            }
            return visibleNaada.map((item) => {
              const done = !!naadaSeqCompletions[item.id];
              return (
                <Box
                  key={item.id}
                  onClick={() => { haptic(8); handleNaadaSeqToggle(item.id); }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 1.25,
                    px: 1,
                    borderRadius: 2,
                    cursor: "pointer",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F0EDE8"}`,
                    "&:last-child": { borderBottom: "none" },
                    "&:hover": { background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" },
                    transition: "background 0.12s",
                    opacity: done ? 0.6 : 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: done ? "#C07830" : isDark ? "#1F1E1B" : "#F0EDE8",
                      border: `1.5px solid ${done ? "#C07830" : isDark ? "#3C3C3C" : "#D1D0CF"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    {done
                      ? <CheckCircle sx={{ fontSize: 14, color: "#fff" }} />
                      : <RadioButtonUnchecked sx={{ fontSize: 14, color: isDark ? "#5C5A54" : "#C8C6C0" }} />
                    }
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: done ? (isDark ? "#5C5A54" : "#9C9A94") : (isDark ? "#F0EDE8" : "#2C2C2C"),
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {item.emoji ? `${item.emoji} ` : ""}{item.label}
                    </Typography>
                    {item.duration_minutes && (
                      <Typography sx={{ fontSize: 10, color: isDark ? "#6C6A64" : "#B0AEA8", mt: 0.1 }}>
                        {item.duration_minutes} min
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            });
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2, pt: 0.5, justifyContent: "space-between" }}>
          <Button
            size="small"
            onClick={() => { setNaadaSeqOpen(false); navigate("/svadhyaya/nadam", { state: { tab: 1 } }); }}
            sx={{ color: isDark ? "#7C7A74" : "#9C9A94", textTransform: "none", fontSize: 12 }}
          >
            Open full tracker →
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              const nextHabits = { ...habits, saadhana: true };
              setHabits(nextHabits);
              sync({ habits: nextHabits });
              setNaadaSeqOpen(false);
            }}
            sx={{
              background: "#C07830",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              fontSize: 13,
              "&:hover": { background: "#A0621A" },
            }}
          >
            Mark Done ✓
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DAILY SEQUENCE POPUP ── */}
      <Dialog
        open={seqOpen}
        onClose={() => setSeqOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: isDark ? "#1A1916" : "#FDFCFA",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2DDD6"}`,
            overflow: "hidden",
          },
        }}
      >
        {/* header */}
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#EAE6E0"}`,
          }}
        >
          <Typography sx={{ fontSize: 18 }}>🪔</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontFamily: '"Fraunces","Lora",serif',
                fontWeight: 600,
                fontSize: 17,
                color: isDark ? "#F0EDE8" : "#2C2C2C",
                lineHeight: 1.2,
              }}
            >
              Daily Sequence
            </Typography>
            {seqTotal > 0 && (
              <Typography sx={{ fontSize: 11, color: "#C07830", fontWeight: 500, mt: 0.2 }}>
                {seqDone} of {seqTotal} rituals complete
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setSeqOpen(false)} sx={{ color: isDark ? "#7C7A74" : "#9C9A94" }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2.5, py: 1.5 }}>
          {(() => {
            const todayDay = dayjs();
            const visibleSeq = seqItems.filter((s) => {
              if (s.frequency === "daily") return true;
              if (s.frequency === "weekly") return todayDay.day() === (s.frequency_day ?? 0);
              if (s.frequency === "monthly") return todayDay.date() === (s.frequency_day ?? 1);
              return true;
            });
            if (visibleSeq.length === 0) {
              return (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 13, color: isDark ? "#7C7A74" : "#9C9A94" }}>
                    No rituals scheduled for today.
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: isDark ? "#5C5A54" : "#B0AEA8", mt: 0.5 }}>
                    Add rituals in the Sacred tracker.
                  </Typography>
                </Box>
              );
            }
            return visibleSeq.map((item) => {
              const done = !!seqCompletions[item.id];
              return (
                <Box
                  key={item.id}
                  onClick={() => { haptic(8); handleSeqToggle(item.id); }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 1.25,
                    px: 1,
                    borderRadius: 2,
                    cursor: "pointer",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F0EDE8"}`,
                    "&:last-child": { borderBottom: "none" },
                    "&:hover": { background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" },
                    transition: "background 0.12s",
                    opacity: done ? 0.6 : 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: done ? "#C07830" : isDark ? "#1F1E1B" : "#F0EDE8",
                      border: `1.5px solid ${done ? "#C07830" : isDark ? "#3C3C3C" : "#D1D0CF"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    {done
                      ? <CheckCircle sx={{ fontSize: 14, color: "#fff" }} />
                      : <RadioButtonUnchecked sx={{ fontSize: 14, color: isDark ? "#5C5A54" : "#C8C6C0" }} />
                    }
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: done ? (isDark ? "#5C5A54" : "#9C9A94") : (isDark ? "#F0EDE8" : "#2C2C2C"),
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {item.emoji ? `${item.emoji} ` : ""}{item.label}
                    </Typography>
                    {item.duration_minutes && (
                      <Typography sx={{ fontSize: 10, color: isDark ? "#6C6A64" : "#B0AEA8", mt: 0.1 }}>
                        {item.duration_minutes} min
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            });
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2, pt: 0.5, justifyContent: "space-between" }}>
          <Button
            size="small"
            onClick={() => { setSeqOpen(false); navigate("/svadhyaya/anushthanam", { state: { tab: 1 } }); }}
            sx={{ color: isDark ? "#7C7A74" : "#9C9A94", textTransform: "none", fontSize: 12 }}
          >
            Open full tracker →
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setSeqOpen(false)}
            sx={{
              background: "#C07830",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              fontSize: 13,
              "&:hover": { background: "#A0621A" },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
