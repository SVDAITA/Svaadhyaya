import React, { useState, useEffect, useCallback } from "react";
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
  DialogContent,
  Snackbar,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Slide,
  useMediaQuery,
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
  AccessTime,
  SentimentSatisfiedAlt,
  Delete,
  AutoAwesome,
  Flag,
  LinkOutlined,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { usePanchang } from "../../hooks/usePanchang";
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
  },
  {
    id: "saadhana",
    label: "Naada Saadhana",
    emoji: "🎵",
    locked: true,
    deep: true,
  },
  {
    id: "walk",
    label: "Vyaayamam",
    emoji: "🏃",
    locked: true,
    deep: true,
  },
  {
    id: "reading",
    label: "Pustaka Pathanam",
    emoji: "📖",
    locked: true,
    deep: true,
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
    deep: true,
  },
  {
    id: "vidya",
    label: "Vidya",
    emoji: "📚",
    locked: true,
    deep: true,
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

const DAY_TYPES = ["working day", "holiday", "vacation"];

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
}) {
  const [hours, setHours] = useState(1);
  const [satisfaction, setSatisfaction] = useState(4);

  if (!item) return null;
  const currentSiddhi = ASHTA_SIDDHI_SCALE.find(
    (s) => s.value === satisfaction,
  );

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

        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: heroColor,
            mb: 2,
          }}
        >
          Time Invested
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            mb: 4,
          }}
        >
          <IconButton
            onClick={() => setHours(Math.max(0.5, hours - 0.5))}
            sx={{ border: `1px solid ${heroColor}40`, color: heroColor }}
          >
            <Remove />
          </IconButton>
          <Typography sx={{ fontSize: 24, fontWeight: 300, width: 60 }}>
            {hours}h
          </Typography>
          <IconButton
            onClick={() => setHours(hours + 0.5)}
            sx={{ border: `1px solid ${heroColor}40`, color: heroColor }}
          >
            <Add />
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

        <Button
          variant="contained"
          fullWidth
          onClick={() => onConfirm(item, hours, satisfaction)}
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

// ── MORNING FLOW MODAL ─────────────────────────────────────────────────────────
function MorningFlowModal({
  open,
  onClose,
  onComplete,
  heroColor,
  isDark,
  pendingSacred,
}) {
  const [intention, setIntention] = useState("");
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
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              display: "inline-flex",
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `${heroColor}15`,
              border: `1px solid ${heroColor}30`,
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <WbSunny sx={{ fontSize: 28, color: heroColor }} />
          </Box>
          <Typography
            sx={{
              fontFamily: '"Lora","Fraunces",serif',
              fontSize: 22,
              fontWeight: 600,
              color: textP,
              mb: 0.5,
            }}
          >
            Morning Flow
          </Typography>
          <Typography sx={{ fontSize: 13, color: textS, lineHeight: 1.7 }}>
            {dayjs().format("dddd, D MMMM")} · Begin with clarity
          </Typography>
        </Box>
        {pendingSacred.length > 0 && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: `${heroColor}08`,
              border: `1px solid ${heroColor}20`,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: heroColor,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              Sacred foundations for today
            </Typography>
            {pendingSacred.map((s) => (
              <Box
                key={s.id}
                sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}
              >
                <Typography sx={{ fontSize: 14 }}>{s.emoji || "·"}</Typography>
                <Typography sx={{ fontSize: 13, color: textP }}>
                  {s.label}
                </Typography>
                {s.lakshyaTitle && (
                  <Typography sx={{ fontSize: 11, color: heroColor, ml: 0.5 }}>
                    · {s.lakshyaTitle}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: textS,
              letterSpacing: 1,
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            The one thing today
          </Typography>
          <Box
            sx={{
              background: isDark ? "#0F0E0C" : "#FAF9F6",
              border: `1px solid ${border}`,
              borderRadius: 2,
              px: 2,
              py: 1.25,
            }}
          >
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
                  fontSize: 16,
                  color: textP,
                  lineHeight: 1.6,
                  "&::placeholder": {
                    color: isDark ? "#3C3A36" : "#C8C6C0",
                    fontStyle: "italic",
                  },
                },
              }}
            />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              flex: 1,
              py: 1.2,
              borderColor: border,
              color: textS,
              fontSize: 13,
            }}
          >
            Skip for now
          </Button>
          <Button
            variant="contained"
            onClick={() => onComplete(intention)}
            sx={{
              flex: 2,
              py: 1.2,
              background: heroColor,
              "&:hover": { background: heroColor, opacity: 0.88 },
              boxShadow: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Begin the day ☀️
          </Button>
        </Box>
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
                <TextField
                  key={i}
                  fullWidth
                  size="small"
                  placeholder={`Task ${i + 1}…`}
                  value={t}
                  onChange={(e) => {
                    const n = [...tomorrowTasks];
                    n[i] = e.target.value;
                    setTomorrowTasks(n);
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
                onClick={() => {
                  onSave();
                  setStep(1);
                }}
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
                Save & Close Day
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
            Close day 🌙
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
}) {
  const border = isDark ? "rgba(255,255,255,0.06)" : "#E8E6E0";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.25,
        borderBottom: `1px solid ${border}`,
        "&:last-child": { borderBottom: "none" },
        transition: "all 0.12s",
        borderRadius: 0.5,
      }}
    >
      <Box
        onClick={onToggle}
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
          transition: "all 0.15s",
          cursor: "pointer",
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
        sx={{ flex: 1, cursor: "pointer", minWidth: 0, overflow: "hidden" }}
        onClick={onToggle}
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

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function TodayPage() {
  const { user } = useAuth();
  const { heroColor, mode } = useThemeMode();
  const isDark = mode === "dark";
  const { data: panchangam, loading: panchLoading } = usePanchang();
  const today = dayjs().format("YYYY-MM-DD");
  const hour = dayjs().hour();
  const isMorning = hour >= 5 && hour < 11;
  const isEvening = hour >= 21;

  const [habits, setHabits] = useState({});
  const [habitsData, setHabitsData] = useState({});
  const [dayType, setDayType] = useState("working");
  const [oneThing, setOneThing] = useState("");
  const [wins, setWins] = useState(["", "", ""]);
  const [tomorrowTasks, setTomorrowTasks] = useState(["", "", ""]);
  const [dayClosed, setDayClosed] = useState(false);
  const [morningDone, setMorningDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [customSacred, setCustomSacred] = useState([]);
  const [customCore, setCustomCore] = useState([]);
  const [customEvening, setCustomEvening] = useState([]);

  const [lakshyas, setLakshyas] = useState([]);
  const [taskLakshyaLinks, setTaskLakshyaLinks] = useState({});
  const [anshs, setAnshs] = useState([]);
  const [linkingTask, setLinkingTask] = useState(null);

  const [showMorningFlow, setShowMorningFlow] = useState(false);
  const [showEveningFlow, setShowEveningFlow] = useState(false);
  const [showSunset, setShowSunset] = useState(false);
  const [showDisrupt, setShowDisrupt] = useState(false);
  const [addTaskFor, setAddTaskFor] = useState(null);
  const [completionItem, setCompletionItem] = useState(null);
  const [undoSnack, setUndoSnack] = useState(false);
  const [dismissMorning, setDismissMorning] = useState(false);

  const isGrace = dayType === "holiday" || dayType === "vacation";

  const enrichWithLakshya = (tasks) =>
    tasks.map((t) => ({
      ...t,
      lakshyaTitle: taskLakshyaLinks[t.id]?.title || null,
      siddhiTitle: taskLakshyaLinks[t.id]?.siddhi_title || null,
    }));

  const allSacred = enrichWithLakshya(DEFAULT_SACRED).concat(customSacred);
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
    const { data: dayData } = await supabase
      .from("days")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_date", today)
      .maybeSingle();

    if (dayData) {
      setHabits(dayData.habits || {});
      setHabitsData(dayData.habits_data || {});
      setDayType(dayData.disruption_mode || "working");
      setOneThing(dayData.one_thing || "");
      setWins(dayData.wins?.length ? dayData.wins : ["", "", ""]);
      setTomorrowTasks(
        dayData.tomorrow_tasks?.length ? dayData.tomorrow_tasks : ["", "", ""],
      );
      setDayClosed(!!dayData.last_close);
      setMorningDone(!!dayData.morning_flow_done);
      setCustomSacred(dayData.custom_sacred || []);
      setCustomCore(dayData.custom_core || []);
      setCustomEvening(dayData.custom_evening || []);
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

    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async (patch) => {
    setSyncing(true);
    await supabase
      .from("days")
      .upsert(
        { user_id: user.id, day_date: today, ...patch },
        { onConflict: "user_id,day_date" },
      );
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

  const handleCompletionConfirm = (item, hours, satisfaction) => {
    if (!item) return;
    const nextHabits = { ...habits, [item.id]: true };
    const nextData = {
      ...habitsData,
      [item.id]: { hours, satisfaction, completedAt: new Date().toISOString() },
    };
    setHabits(nextHabits);
    setHabitsData(nextData);
    sync({ habits: nextHabits, habits_data: nextData });
    setCompletionItem(null);
  };

  const handleMorningComplete = async (intention) => {
    setMorningDone(true);
    setShowMorningFlow(false);
    const patch = { morning_flow_done: true };
    if (intention) {
      setOneThing(intention);
      patch.one_thing = intention;
    }
    await sync(patch);
  };

  const handleSaveDay = async () => {
    await sync({
      wins: wins.filter(Boolean),
      tomorrow_tasks: tomorrowTasks.filter(Boolean),
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

  const handleAddTask = ({
    label,
    lakshya_id,
    lakshyaTitle,
    siddhi_id,
    siddhiTitle,
    deep,
  }) => {
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

  const renderItem = (item, section) => {
    const meta = habitsData[item.id];
    const richItem = meta ? { ...item, ...meta } : item;
    const isDeletable = !item.locked && section !== null;
    return (
      <TaskRow
        key={item.id}
        item={richItem}
        checked={!!habits[item.id]}
        onToggle={() => handleToggle(richItem)}
        onDelete={
          isDeletable ? () => handleDeleteTask(section, item.id) : undefined
        }
        onLink={item.locked ? () => setLinkingTask(richItem) : undefined}
        heroColor={heroColor}
        isDark={isDark}
        locked={!!item.locked}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

      <Box sx={{ display: "flex", gap: 0.75, mb: 2.5 }}>
        {DAY_TYPES.map((type) => {
          const active = dayType === type;
          return (
            <Box
              key={type}
              onClick={() => changeDayType(type)}
              sx={{
                px: 1.75,
                py: 0.5,
                borderRadius: 20,
                cursor: "pointer",
                border: `1px solid ${active ? (isDark ? "#F0EDE8" : "#2C2C2C") : border}`,
                background: active
                  ? isDark
                    ? "#F0EDE8"
                    : "#2C2C2C"
                  : "transparent",
                transition: "all 0.15s",
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: active ? (isDark ? "#2C2C2C" : "#fff") : "#9C9A94",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                {type}
              </Typography>
            </Box>
          );
        })}
      </Box>
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
                    {anshs.map((ansh) =>
                      renderItem(
                        {
                          id: ansh.id,
                          label: ansh.title,
                          lakshyaTitle: ansh.lakshya?.title || null,
                          siddhiTitle: ansh.siddhi?.title || null,
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
          <Button
            variant="contained"
            fullWidth
            onClick={() => setShowSunset(true)}
            disabled={dayClosed}
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              background: dayClosed
                ? isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)"
                : heroColor,
              color: dayClosed ? (isDark ? "#9C9A94" : "#64748b") : "#fff",
              "&:hover": { background: heroColor, opacity: 0.88 },
              boxShadow: "none",
            }}
          >
            {dayClosed ? "✓ Day Closed — Rest Well" : "Close Day"}
          </Button>
          <Box
            onClick={() => setShowDisrupt(true)}
            sx={{
              border: `1.5px dashed ${heroColor}50`,
              borderRadius: 2,
              py: 1.25,
              px: 2,
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s",
              "&:hover": {
                background: `${heroColor}06`,
                borderColor: heroColor,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <MandalaSVG size={14} color={heroColor} />
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: heroColor,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Life Happened — Handle Disruption
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <MorningFlowModal
        open={showMorningFlow}
        onClose={() => setShowMorningFlow(false)}
        onComplete={handleMorningComplete}
        heroColor={heroColor}
        isDark={isDark}
        pendingSacred={allSacred.filter((s) => !habits[s.id])}
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
      <Snackbar
        open={undoSnack}
        autoHideDuration={8000}
        onClose={() => setUndoSnack(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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
    </Box>
  );
}
