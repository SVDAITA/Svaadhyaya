import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  Collapse,
  CircularProgress,
  Fade,
} from "@mui/material";
import {
  Add,
  Check,
  Delete,
  Edit,
  ExpandMore,
  ExpandLess,
  Flag,
  CheckCircle,
  RadioButtonUnchecked,
  FlashOn,
  AutoAwesome,
  EditNote,
  Spa,
  Timeline,
  Insights,
  SelfImprovement,
  MenuBook,
} from "@mui/icons-material";
import { keyframes } from "@mui/system";
import dayjs from "dayjs";

import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";

export function MilestoneRow() {
  return null;
}
export function AddMilestoneButton() {
  return null;
}

// ── THE ASHTA SIDDHI RESONANCE SCALE ───────────────────────────────────────────
export const ASHTA_SIDDHI_SCALE = [
  {
    value: 1,
    name: "Aṇimā",
    label: "Minimal focus, fragmented effort",
    emoji: "🌱",
  },
  {
    value: 2,
    name: "Mahimā",
    label: "Found rhythm, expanded effort",
    emoji: "🌿",
  },
  {
    value: 3,
    name: "Garimā",
    label: "Heavy, grounded, solid work",
    emoji: "🌳",
  },
  {
    value: 4,
    name: "Laghimā",
    label: "Effortless, light, flowing",
    emoji: "🍃",
  },
  { value: 5, name: "Prāpti", label: "Target state reached", emoji: "🎯" },
  {
    value: 6,
    name: "Prākāmya",
    label: "Overcame immense resistance",
    emoji: "🔥",
  },
  { value: 7, name: "Īśitva", label: "Total command and mastery", emoji: "👑" },
  {
    value: 8,
    name: "Vaśitva",
    label: "Perfect resonance, transcended",
    emoji: "✨",
  },
];

// ── ANIMATIONS & THEME UTILS ───────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// A subtle noise pattern that works on both light and dark modes by using opacity
const ashramBgPattern = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`;

const cardBaseStyles = {
  mb: 2,
  boxShadow: "0 4px 24px -8px rgba(0,0,0,0.04)",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 4,
  backgroundImage: ashramBgPattern,
  backgroundBlendMode: "overlay",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  animation: `${fadeIn} 0.6s ease-out forwards`,
  "&:hover": {
    boxShadow: "0 8px 32px -8px rgba(0,0,0,0.08)",
  },
};

// ── SECTION LABEL ──────────────────────────────────────────────────────────────
export function SectionLabel({ children, icon: Icon, color }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      {Icon && <Icon sx={{ fontSize: 16, color: color || "text.secondary" }} />}
      <Typography
        variant="caption"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 2.5,
          fontSize: 10,
          fontWeight: 700,
          color: color || "text.secondary",
          fontFamily: '"Inter", sans-serif',
        }}
      >
        {children}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: "1px",
          background: `linear-gradient(90deg, ${color || "#ccc"}30 0%, transparent 100%)`,
        }}
      />
    </Box>
  );
}

// ── AREA BANNER ────────────────────────────────────────────────────────────────
export function AreaBanner({ color, emoji, title, subtitle, quote }) {
  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${color}22`,
          borderTop: `3px solid ${color}`,
          background: `linear-gradient(135deg, ${color}08 0%, transparent 80%)`,
          p: { xs: 2, md: 2.5 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle watermark glow */}
        <Box sx={{
          position: "absolute", top: -20, right: -20,
          width: 100, height: 100, borderRadius: "50%",
          background: `${color}18`, filter: "blur(30px)", pointerEvents: "none",
        }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, position: "relative" }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 2,
            background: `${color}14`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
            border: `1px solid ${color}20`,
          }}>
            {emoji}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontFamily: '"Fraunces","Lora",serif',
              fontWeight: 400,
              fontSize: { xs: 18, md: 20 },
              color,
              lineHeight: 1.2,
              letterSpacing: "-0.2px",
            }}>
              {title}
            </Typography>
            <Typography sx={{
              fontSize: 11,
              color: "text.secondary",
              letterSpacing: 0.3,
              mt: 0.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>

        {quote && (
          <Typography sx={{
            mt: 1.75,
            pt: 1.75,
            borderTop: `1px solid ${color}15`,
            fontSize: 13,
            fontFamily: '"Lora","Fraunces",serif',
            fontStyle: "italic",
            color: "text.secondary",
            lineHeight: 1.65,
            opacity: 0.9,
            position: "relative",
          }}>
            "{quote}"
          </Typography>
        )}
      </Box>
    </Fade>
  );
}

// ── STAT CARD ──────────────────────────────────────────────────────────────────
export function StatCard({ value, label, color, sub }) {
  return (
    <Box sx={{
      p: { xs: 1.5, md: 2 },
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: "0 3px 12px rgba(0,0,0,0.06)" },
    }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: 2,
        background: `${color}12`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Typography sx={{
          fontFamily: '"Fraunces",serif',
          fontSize: 20,
          fontWeight: 400,
          color: color || "text.primary",
          lineHeight: 1,
        }}>
          {value}
        </Typography>
      </Box>
      <Box>
        <Typography sx={{
          fontSize: 12,
          fontWeight: 600,
          color: "text.primary",
          letterSpacing: 0.3,
          lineHeight: 1.3,
        }}>
          {label}
        </Typography>
        {sub && (
          <Typography sx={{
            fontSize: 10,
            color: "text.disabled",
            fontStyle: "italic",
            mt: 0.25,
          }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ── LAKSHYA HIERARCHY (Lakshya -> Siddhi -> Ansh) ──────────────────────────────
function SiddhiRow({ siddhi, lakshyaId, color, onUpdate }) {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const GREEN_COMPLETE = isDark ? "#5EC98A" : GREEN_COMPLETE;
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState(siddhi.progress_percent || 0);
  const [spawningAnsh, setSpawningAnsh] = useState(false);
  const [anshTitle, setAnshTitle] = useState("");

  const save = async () => {
    const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0));
    const status = safeProgress >= 100 ? "completed" : "active";
    await supabase
      .from("siddhis")
      .update({ progress_percent: safeProgress, status })
      .eq("id", siddhi.id);
    if (onUpdate) onUpdate();
    setEditing(false);
  };

  const remove = async () => {
    await supabase.from("siddhis").delete().eq("id", siddhi.id);
    if (onUpdate) onUpdate();
  };

  const spawnAnsh = async () => {
    if (!anshTitle.trim() || !user) return;
    await supabase.from("anshs").insert({
      user_id: user.id,
      lakshya_id: lakshyaId,
      siddhi_id: siddhi.id,
      title: anshTitle.trim(),
      status: "active",
    });
    setAnshTitle("");
    setSpawningAnsh(false);
    if (onUpdate) onUpdate();
  };

  const isComplete = siddhi.status === "completed" || progress >= 100;
  const overdue =
    siddhi.target_date &&
    dayjs(siddhi.target_date).isBefore(dayjs(), "day") &&
    !isComplete;

  return (
    <Box
      sx={{
        pl: 2,
        mb: 2,
        borderLeft: `2px solid ${isComplete ? GREEN_COMPLETE : `${color}30`}`,
        transition: "all 0.3s ease",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
        {isComplete ? (
          <CheckCircle sx={{ fontSize: 16, color: GREEN_COMPLETE, flexShrink: 0 }} />
        ) : (
          <RadioButtonUnchecked
            sx={{ fontSize: 16, color: `${color}50`, flexShrink: 0 }}
          />
        )}
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: isComplete ? 400 : 500,
            color: isComplete ? "text.disabled" : "text.primary",
            textDecoration: isComplete ? "line-through" : "none",
            flex: 1,
            lineHeight: 1.4,
          }}
        >
          {siddhi.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            fontWeight: 500,
            color: overdue ? "#CF4E4E" : "text.disabled",
            flexShrink: 0,
            background: overdue ? "#CF4E4E15" : "transparent",
            px: overdue ? 1 : 0,
            py: overdue ? 0.25 : 0,
            borderRadius: 1,
          }}
        >
          {siddhi.target_date
            ? dayjs(siddhi.target_date).format("D MMM YYYY")
            : ""}
        </Typography>
        <IconButton
          size="small"
          onClick={() => setEditing((p) => !p)}
          sx={{
            p: 0.5,
            color: "text.disabled",
            "&:hover": { color: "text.primary", background: `${color}10` },
          }}
        >
          <Edit sx={{ fontSize: 14 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={remove}
          sx={{
            p: 0.5,
            color: "text.disabled",
            "&:hover": { color: "#CF4E4E", background: "#CF4E4E10" },
          }}
        >
          <Delete sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", ml: 3, gap: 2 }}>
        <Box sx={{ flex: 1, position: "relative" }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: "rgba(0,0,0,0.04)",
              "& .MuiLinearProgress-bar": {
                background: isComplete
                  ? GREEN_COMPLETE
                  : `linear-gradient(90deg, ${color}80 0%, ${color} 100%)`,
                borderRadius: 2,
              },
            }}
          />
        </Box>
        {!isComplete && (
          <Tooltip title="Spawn a daily Ansh (micro-task)">
            <Button
              size="small"
              onClick={() => setSpawningAnsh((p) => !p)}
              sx={{
                minWidth: 0,
                p: 0.5,
                px: 1,
                fontSize: 10,
                color,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: 700,
                borderRadius: 1.5,
                "&:hover": { background: `${color}15` },
              }}
            >
              <FlashOn sx={{ fontSize: 14, mr: 0.5 }} /> Spawn Ansh
            </Button>
          </Tooltip>
        )}
      </Box>

      <Collapse in={editing}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mt: 1.5,
            ml: 3,
            p: 1,
            bgcolor: "background.paper",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "text.secondary",
              textTransform: "uppercase",
            }}
          >
            Progress
          </Typography>
          <TextField
            type="number"
            size="small"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            inputProps={{ min: 0, max: 100 }}
            sx={{
              width: 80,
              "& input": { py: "6px", fontSize: 13, textAlign: "center" },
            }}
          />
          <Typography sx={{ fontSize: 13, color: "text.disabled", ml: -0.5 }}>
            %
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            onClick={() => setEditing(false)}
            color="inherit"
            sx={{ py: 0.5, fontSize: 12, minWidth: 0 }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={save}
            sx={{
              py: 0.5,
              fontSize: 12,
              minWidth: 0,
              px: 2,
              background: color,
              boxShadow: "none",
            }}
          >
            Save
          </Button>
        </Box>
      </Collapse>

      <Collapse in={spawningAnsh}>
        <Box
          sx={{
            mt: 1.5,
            ml: 3,
            p: 1.5,
            borderRadius: 2,
            background: `${color}06`,
            border: `1px solid ${color}20`,
            display: "flex",
            gap: 1.5,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Define a micro-action for today..."
            value={anshTitle}
            onChange={(e) => setAnshTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && spawnAnsh()}
            sx={{
              "& input": { fontSize: 13, py: "6px" },
              bgcolor: "background.paper",
              borderRadius: 1,
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={spawnAnsh}
            disabled={!anshTitle.trim()}
            sx={{ background: color, minWidth: 0, px: 2, boxShadow: "none" }}
          >
            <Add sx={{ fontSize: 18 }} />
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}

function LakshyaCard({ lakshya, color, onUpdate }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [addingSiddhi, setAddingSiddhi] = useState(false);
  const [siddhiForm, setSiddhiForm] = useState({ title: "", target_date: "" });
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(lakshya.title);
  const [saving, setSaving] = useState(false);

  const siddhis = lakshya.siddhis || [];
  const activeSiddhis = siddhis.filter((s) => s.status !== "completed");
  const doneSiddhis = siddhis.filter((s) => s.status === "completed");
  const avgProgress =
    siddhis.length > 0
      ? Math.round(
          siddhis.reduce((s, d) => s + (d.progress_percent || 0), 0) /
            siddhis.length,
        )
      : 0;

  const saveTitle = async () => {
    if (!titleVal.trim()) return;
    await supabase
      .from("lakshyas")
      .update({ title: titleVal.trim() })
      .eq("id", lakshya.id);
    setEditingTitle(false);
    if (onUpdate) onUpdate();
  };

  const archiveLakshya = async () => {
    await supabase
      .from("lakshyas")
      .update({ status: "archived" })
      .eq("id", lakshya.id);
    if (onUpdate) onUpdate();
  };

  const addSiddhi = async () => {
    if (!siddhiForm.title.trim() || !user) return;
    setSaving(true);
    await supabase
      .from("siddhis")
      .insert({
        user_id: user.id,
        lakshya_id: lakshya.id,
        title: siddhiForm.title.trim(),
        target_date: siddhiForm.target_date || null,
        status: "active",
        progress_percent: 0,
      });
    setSiddhiForm({ title: "", target_date: "" });
    setAddingSiddhi(false);
    setSaving(false);
    if (onUpdate) onUpdate();
  };

  return (
    <Box
      sx={{
        mb: 3,
        border: "1px solid",
        borderColor: `${color}30`,
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: "background.paper",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        transition: "all 0.3s ease",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          background: `linear-gradient(to right, ${color}08, transparent)`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            background: `${color}15`,
            display: "flex",
          }}
        >
          <Flag sx={{ fontSize: 20, color }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                size="small"
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
                autoFocus
                sx={{
                  flex: 1,
                  "& input": {
                    fontSize: 15,
                    py: "6px",
                    fontFamily: '"Fraunces", serif',
                  },
                }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={saveTitle}
                sx={{
                  py: 0.5,
                  fontSize: 12,
                  background: color,
                  minWidth: 0,
                  px: 1.5,
                  boxShadow: "none",
                }}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEditingTitle(false);
                  setTitleVal(lakshya.title);
                }}
                color="inherit"
                sx={{ py: 0.5, fontSize: 12, minWidth: 0 }}
              >
                ✕
              </Button>
            </Box>
          ) : (
            <Typography
              sx={{
                fontFamily: '"Fraunces", serif',
                fontSize: 18,
                fontWeight: 500,
                color: "text.primary",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {lakshya.title}
            </Typography>
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mt: 0.75,
              flexWrap: "wrap",
            }}
          >
            <Chip
              icon={<Timeline sx={{ fontSize: 12 }} />}
              label={`${lakshya.timeline_years}yr Horizon`}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                background: `${color}15`,
                color,
                border: `1px solid ${color}30`,
              }}
            />
            {siddhis.length > 0 && (
              <Typography
                variant="caption"
                sx={{ fontSize: 12, color: "text.secondary", fontWeight: 500 }}
              >
                {doneSiddhis.length}/{siddhis.length} Siddhis Mastered
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0, minWidth: 48 }}>
          <Typography
            sx={{
              fontSize: 22,
              fontFamily: '"Fraunces", serif',
              fontWeight: 400,
              color,
              lineHeight: 1,
            }}
          >
            {avgProgress}%
          </Typography>
        </Box>
        <Tooltip title="Edit Vision">
          <IconButton
            size="small"
            onClick={() => setEditingTitle(true)}
            sx={{
              p: 0.5,
              color: "text.disabled",
              "&:hover": {
                color: "text.primary",
                background: "rgba(0,0,0,0.04)",
              },
            }}
          >
            <Edit sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={
            expanded ? "Collapse Stepping Stones" : "Expand Stepping Stones"
          }
        >
          <IconButton
            size="small"
            onClick={() => setExpanded((p) => !p)}
            sx={{
              p: 0.5,
              background: expanded ? `${color}10` : "transparent",
              color: expanded ? color : "text.disabled",
            }}
          >
            {expanded ? (
              <ExpandLess sx={{ fontSize: 20 }} />
            ) : (
              <ExpandMore sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <LinearProgress
        variant="determinate"
        value={avgProgress}
        sx={{
          height: 4,
          borderRadius: 0,
          bgcolor: `${color}10`,
          "& .MuiLinearProgress-bar": {
            background: `linear-gradient(90deg, ${color}80 0%, ${color} 100%)`,
          },
        }}
      />

      <Collapse in={expanded}>
        <Box sx={{ px: 3, py: 3, background: "rgba(0,0,0,0.01)" }}>
          <Typography
            variant="caption"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2.5,
              textTransform: "uppercase",
              letterSpacing: 2,
              fontSize: 10,
              fontWeight: 700,
              color: "text.secondary",
            }}
          >
            <Spa sx={{ fontSize: 12 }} /> Siddhis · The Stepping Stones
          </Typography>

          {activeSiddhis.length === 0 && doneSiddhis.length === 0 && (
            <Box
              sx={{
                textAlign: "center",
                py: 3,
                background: `${color}04`,
                borderRadius: 2,
                border: `1px dashed ${color}30`,
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                No Siddhis charted yet. Break this grand vision into actionable
                30–90 day milestones.
              </Typography>
            </Box>
          )}

          {activeSiddhis.map((s) => (
            <SiddhiRow
              key={s.id}
              siddhi={s}
              lakshyaId={lakshya.id}
              color={color}
              onUpdate={onUpdate}
            />
          ))}

          {doneSiddhis.length > 0 && (
            <Box
              sx={{
                mt: 3,
                pt: 2,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: 10,
                  color: "text.disabled",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  display: "block",
                  mb: 1.5,
                  fontWeight: 600,
                }}
              >
                Realized Siddhis
              </Typography>
              {doneSiddhis.map((s) => (
                <SiddhiRow
                  key={s.id}
                  siddhi={s}
                  lakshyaId={lakshya.id}
                  color={color}
                  onUpdate={onUpdate}
                />
              ))}
            </Box>
          )}

          {addingSiddhi ? (
            <Fade in>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: `1px solid ${color}30`,
                  boxShadow: `0 4px 20px ${color}10`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    mb: 2,
                  }}
                >
                  Forge New Siddhi
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  autoFocus
                  label="Milestone title (e.g. Master the basics)"
                  value={siddhiForm.title}
                  onChange={(e) =>
                    setSiddhiForm((p) => ({ ...p, title: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && addSiddhi()}
                  sx={{ mb: 2, "& input": { fontSize: 14 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Target convergence date (optional)"
                  value={siddhiForm.target_date}
                  onChange={(e) =>
                    setSiddhiForm((p) => ({
                      ...p,
                      target_date: e.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={addSiddhi}
                    disabled={saving || !siddhiForm.title.trim()}
                    sx={{
                      fontSize: 13,
                      background: color,
                      "&:hover": { background: color, opacity: 0.9 },
                      flex: 1,
                      boxShadow: "none",
                      py: 1,
                    }}
                  >
                    Establish Siddhi
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setAddingSiddhi(false)}
                    color="inherit"
                    sx={{ fontSize: 13, px: 3 }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Fade>
          ) : (
            <Button
              size="small"
              startIcon={<Add sx={{ fontSize: 16 }} />}
              onClick={() => setAddingSiddhi(true)}
              sx={{
                mt: 1,
                fontSize: 13,
                color,
                textTransform: "none",
                borderColor: `${color}40`,
                border: "1px dashed",
                borderRadius: 2,
                px: 2,
                py: 1,
                "&:hover": { background: `${color}05` },
              }}
            >
              Define Next Siddhi
            </Button>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Button
              size="small"
              onClick={archiveLakshya}
              sx={{
                fontSize: 11,
                color: "text.disabled",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                "&:hover": { color: "#CF4E4E", background: "transparent" },
              }}
            >
              Archive Vision
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

export function LakshyaSection({ area, color, lakshyas, onUpdate }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    timeline_years: 1,
    reward_note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const PILLAR_MAP = {
    spirit: "Spiritual",
    music: "Nādam",
    health: "Sharīram",
    career: "Vṛtti",
    finance: "Artha",
    reading: "Vidyā",
  };

  const save = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("lakshyas").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      pillar: area,
      timeline_years: form.timeline_years,
      reward_note: form.reward_note.trim() || null,
      status: "active",
    });
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    setForm({ title: "", description: "", timeline_years: 1, reward_note: "" });
    setOpen(false);
    setSaving(false);
    if (onUpdate) onUpdate();
  };

  return (
    <Card sx={cardBaseStyles}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <SectionLabel icon={Flag} color={color}>
              Lakshyas (Visions)
            </SectionLabel>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 14, fontFamily: '"Lora", serif' }}
            >
              Your long-term anchor points for this pillar.
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color,
              borderColor: `${color}40`,
              border: "1px solid",
              borderRadius: 3,
              py: 1,
              px: 2.5,
              background: `${color}08`,
              "&:hover": { background: `${color}15` },
            }}
          >
            New Vision
          </Button>
        </Box>

        {lakshyas.length === 0 ? (
          <Box
            sx={{
              py: 6,
              textAlign: "center",
              background: `${color}04`,
              borderRadius: 3,
              border: `1px dashed ${color}30`,
            }}
          >
            <AutoAwesome sx={{ fontSize: 40, color: `${color}60`, mb: 2 }} />
            <Typography
              sx={{
                fontSize: 16,
                color: "text.primary",
                fontWeight: 500,
                mb: 1,
                fontFamily: '"Fraunces", serif',
              }}
            >
              No Lakshyas defined for {PILLAR_MAP[area] || area}.
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: "text.secondary",
                maxWidth: 360,
                mx: "auto",
                lineHeight: 1.6,
              }}
            >
              Plant the seed. Define a 1 to 10 year vision. What is the ultimate
              state of resonance you seek here?
            </Typography>
          </Box>
        ) : (
          lakshyas.map((l) => (
            <LakshyaCard
              key={l.id}
              lakshya={l}
              color={color}
              onUpdate={onUpdate}
            />
          ))
        )}

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4, p: 1, backgroundImage: ashramBgPattern },
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: '"Fraunces", serif',
              fontWeight: 400,
              pb: 1,
              fontSize: 24,
            }}
          >
            Define a Lakshya
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 14, mt: 1, fontFamily: '"Lora", serif' }}
            >
              A grand, far-reaching vision for {PILLAR_MAP[area] || area}.
            </Typography>
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2, fontSize: 13, borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              autoFocus
              label="Vision Title"
              placeholder="e.g. Sangeeta Visharada, Financial Independence"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              sx={{ mb: 3, mt: 1 }}
              size="medium"
            />
            <FormControl fullWidth size="medium" sx={{ mb: 3 }}>
              <InputLabel>Horizon</InputLabel>
              <Select
                value={form.timeline_years}
                onChange={(e) =>
                  setForm((p) => ({ ...p, timeline_years: e.target.value }))
                }
                label="Horizon"
              >
                {[1, 2, 3, 5, 8, 10].map((y) => (
                  <MenuItem key={y} value={y}>
                    {y} Year{y > 1 ? "s" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="The Deeper Why (Optional)"
              placeholder="What fundamentally shifts within you when this is achieved?"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              sx={{ mb: 1 }}
              size="medium"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
            <Button
              onClick={() => setOpen(false)}
              color="inherit"
              sx={{ fontSize: 14, px: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={save}
              disabled={saving || !form.title.trim()}
              sx={{
                background: color,
                "&:hover": { background: color, opacity: 0.9 },
                px: 4,
                py: 1,
                fontSize: 14,
                borderRadius: 2,
                boxShadow: "none",
              }}
            >
              Manifest Vision
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ── WEEKLY MICRO GOALS ─────────────────────────────────────────────────────────
export function WeeklyGoals({ area, color }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const weekStart = dayjs().startOf("week").format("YYYY-MM-DD");

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("weekly_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("area", area)
      .eq("week_start", weekStart)
      .order("created_at");
    setGoals(data || []);
  }, [user, area, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!newGoal.trim() || !user) return;
    setLoading(true);
    await supabase
      .from("weekly_goals")
      .insert({
        user_id: user.id,
        area,
        week_start: weekStart,
        title: newGoal.trim(),
      });
    setNewGoal("");
    await load();
    setLoading(false);
  };
  const toggle = async (goal) => {
    // Optimistic UI update
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, done: !g.done } : g)),
    );
    await supabase
      .from("weekly_goals")
      .update({ done: !goal.done })
      .eq("id", goal.id);
    await load();
  };
  const remove = async (id) => {
    await supabase.from("weekly_goals").delete().eq("id", id);
    await load();
  };

  return (
    <Card sx={cardBaseStyles}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <SectionLabel icon={SelfImprovement} color={color}>
          This Week's Focus
        </SectionLabel>

        <Box sx={{ mt: 2 }}>
          {goals.length === 0 && (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{
                mb: 2,
                fontSize: 14,
                fontStyle: "italic",
                fontFamily: '"Lora", serif',
              }}
            >
              No immediate focus set for this week. Flow gracefully into action.
            </Typography>
          )}

          {goals.map((g) => (
            <Box
              key={g.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1,
                p: 1,
                borderRadius: 2,
                transition: "all 0.2s",
                "&:hover": { background: "rgba(0,0,0,0.02)" },
              }}
            >
              <IconButton
                size="small"
                onClick={() => toggle(g)}
                sx={{ p: 0.5, color: g.done ? color : "text.disabled" }}
              >
                {g.done ? (
                  <CheckCircle sx={{ fontSize: 20 }} />
                ) : (
                  <RadioButtonUnchecked sx={{ fontSize: 20 }} />
                )}
              </IconButton>
              <Typography
                variant="body1"
                sx={{
                  flex: 1,
                  textDecoration: g.done ? "line-through" : "none",
                  color: g.done ? "text.disabled" : "text.primary",
                  fontSize: 15,
                  transition: "all 0.3s ease",
                }}
              >
                {g.title}
              </Typography>
              <IconButton
                size="small"
                onClick={() => remove(g.id)}
                sx={{
                  p: 0.5,
                  opacity: 0,
                  transition: "opacity 0.2s",
                  ".MuiBox-root:hover &": { opacity: 0.6 },
                  "&:hover": { opacity: "1 !important", color: "#CF4E4E" },
                }}
              >
                <Delete sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}

          <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add a focused intent for the week..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              sx={{
                "& input": { fontSize: 14, py: "10px", px: "14px" },
                bgcolor: "background.paper",
                borderRadius: 2,
              }}
            />
            <Button
              variant="contained"
              onClick={add}
              disabled={loading || !newGoal.trim()}
              sx={{
                px: 3,
                flexShrink: 0,
                background: color,
                "&:hover": { background: color, opacity: 0.9 },
                boxShadow: "none",
                borderRadius: 2,
              }}
            >
              <Add sx={{ fontSize: 22 }} />
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── AREA JOURNAL (AUTO-SAVING RICH TEXT FIELD) ─────────────────────────────────
export function AreaJournal({ area, color }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [loading, setLoading] = useState(true);

  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchJournal = async () => {
      const { data } = await supabase
        .from("area_journals")
        .select("content, updated_at")
        .eq("user_id", user.id)
        .eq("area", area)
        .maybeSingle();
      if (data) {
        setContent(data.content || "");
        setLastSaved(data.updated_at);
      }
      setLoading(false);
    };
    fetchJournal();
  }, [user, area]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsSaving(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      if (!user) return;
      const now = new Date().toISOString();

      await supabase.from("area_journals").upsert(
        {
          user_id: user.id,
          area: area,
          content: newContent,
          updated_at: now,
        },
        { onConflict: "user_id, area" },
      );

      setLastSaved(now);
      setIsSaving(false);
    }, 1500);
  };

  return (
    <Card
      sx={{
        ...cardBaseStyles,
        background: `linear-gradient(to bottom right, background.paper, ${color}05)`,
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MenuBook sx={{ color, fontSize: 22 }} />
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 2,
                fontSize: 11,
                fontWeight: 700,
                color,
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Chronicles & Reflections
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isSaving && <CircularProgress size={12} sx={{ color }} />}
            <Typography
              variant="caption"
              sx={{
                fontSize: 11,
                color: "text.disabled",
                fontStyle: "italic",
                fontFamily: '"Lora", serif',
              }}
            >
              {isSaving
                ? "Engraving..."
                : lastSaved
                  ? `Preserved ${dayjs(lastSaved).format("h:mm A")}`
                  : "Awaiting ink"}
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={24} sx={{ color }} />
          </Box>
        ) : (
          <Box sx={{ position: "relative" }}>
            {/* Subtle notebook lines effect via background */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none",
                zIndex: 0,
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.03) 31px, rgba(0,0,0,0.03) 32px)",
                backgroundSize: "100% 32px",
                mt: "4px", // align with text line height
              }}
            />
            <TextField
              fullWidth
              multiline
              minRows={6}
              placeholder="Document the ripples of your journey. What resistances did you face? What insights arose?..."
              variant="standard"
              value={content}
              onChange={handleContentChange}
              InputProps={{ disableUnderline: true }}
              sx={{
                position: "relative",
                zIndex: 1,
                "& textarea": {
                  fontFamily: '"Lora", serif',
                  fontSize: 16,
                  lineHeight: "32px", // matches the background lines
                  color: "text.primary",
                  "&::placeholder": {
                    color: "text.disabled",
                    fontStyle: "italic",
                    opacity: 0.7,
                  },
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ── AREA LOG & INSIGHTS ────────────────────────────────────────────────────────
export function AreaLog({ area, color, logTypes }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: logTypes[0]?.id || "",
    value: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("area", area)
      .order("created_at", { ascending: false })
      .limit(15);
    setLogs(data || []);
  }, [user, area]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.type || !user) return;
    setSaving(true);
    await supabase
      .from("logs")
      .insert({
        user_id: user.id,
        area,
        type: form.type,
        value: form.value || null,
        note: form.note || null,
        date: dayjs().format("YYYY-MM-DD"),
      });
    setForm({ type: logTypes[0]?.id || "", value: "", note: "" });
    setSaved(true);
    await load();
    setSaving(false);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1500);
  };

  const currentType = logTypes.find((t) => t.id === form.type);

  // Custom Mini Sparkline Logic for numerical logs
  const numericalLogs = logs
    .filter((l) => l.value && !isNaN(Number(l.value)))
    .slice(0, 7)
    .reverse();
  const hasNumericalData = numericalLogs.length > 2;
  const maxVal = hasNumericalData
    ? Math.max(...numericalLogs.map((l) => Number(l.value)))
    : 1;

  return (
    <Card sx={cardBaseStyles}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <SectionLabel icon={Insights} color={color}>
            Telemetry & Logs
          </SectionLabel>
          <Button
            size="small"
            startIcon={<Add />}
            onClick={() => setOpen((p) => !p)}
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color,
              borderColor: `${color}40`,
              border: "1px solid",
              borderRadius: 2,
              py: 0.75,
              px: 2,
              transition: "all 0.2s",
              "&:hover": { background: `${color}10` },
            }}
          >
            {open ? "Close" : "Record Entry"}
          </Button>
        </Box>

        <Collapse in={open}>
          <Box
            sx={{
              mb: 4,
              p: 2.5,
              borderRadius: 3,
              background: `${color}06`,
              border: `1px solid ${color}20`,
              boxShadow: `inset 0 2px 10px rgba(0,0,0,0.02)`,
            }}
          >
            {saved && (
              <Alert
                severity="success"
                sx={{ mb: 2, fontSize: 13, borderRadius: 2 }}
              >
                Entry recorded successfully into the annals.
              </Alert>
            )}

            <FormControl fullWidth size="medium" sx={{ mb: 2.5 }}>
              <InputLabel>Nature of Entry</InputLabel>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
                label="Nature of Entry"
              >
                {logTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id} sx={{ py: 1.5 }}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {currentType?.hasValue && (
              <TextField
                fullWidth
                label={currentType.valueLabel || "Magnitude / Value"}
                value={form.value}
                onChange={(e) =>
                  setForm((p) => ({ ...p, value: e.target.value }))
                }
                sx={{ mb: 2.5 }}
                size="medium"
                type="number"
                InputProps={{
                  endAdornment: currentType.unit ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1, fontWeight: 600 }}
                    >
                      {currentType.unit}
                    </Typography>
                  ) : null,
                }}
              />
            )}

            <TextField
              fullWidth
              label="Annotations (optional)"
              placeholder="Context matters. What surrounded this entry?"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              size="medium"
              multiline
              rows={2}
              sx={{ mb: 2.5 }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={save}
              disabled={saving}
              sx={{
                background: color,
                "&:hover": { background: color, opacity: 0.9 },
                fontSize: 14,
                py: 1.25,
                borderRadius: 2,
                boxShadow: "none",
              }}
            >
              Seal Entry
            </Button>
          </Box>
        </Collapse>

        {/* Mini Sparkline Visualization */}
        {hasNumericalData && !open && (
          <Box
            sx={{
              mb: 4,
              height: 60,
              display: "flex",
              alignItems: "flex-end",
              gap: "4px",
              p: 1.5,
              borderRadius: 2,
              background: "rgba(0,0,0,0.02)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mr: 2,
                height: "100%",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: 9,
                  color: "text.disabled",
                  textTransform: "uppercase",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                Trend
              </Typography>
            </Box>
            {numericalLogs.map((log, i) => {
              const heightPct = Math.max(
                10,
                (Number(log.value) / maxVal) * 100,
              );
              return (
                <Tooltip
                  key={i}
                  title={`${log.value} on ${dayjs(log.created_at).format("MMM D")}`}
                >
                  <Box
                    sx={{
                      flex: 1,
                      background: `linear-gradient(to top, ${color}90, ${color})`,
                      height: `${heightPct}%`,
                      borderRadius: "3px 3px 0 0",
                      opacity: 0.7,
                      transition: "opacity 0.2s",
                      "&:hover": { opacity: 1 },
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        )}

        {logs.length === 0 && !open && (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{
              fontSize: 14,
              fontStyle: "italic",
              fontFamily: '"Lora", serif',
            }}
          >
            The record is pristine. Awaiting your first mark.
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {logs.slice(0, 7).map((log) => (
            <Box
              key={log.id}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                "&:hover": { background: "rgba(0,0,0,0.02)" },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  mt: 0.75,
                  opacity: 0.5,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "text.primary",
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {logTypes.find((t) => t.id === log.type)?.label || log.type}
                  {log.value && (
                    <span style={{ fontWeight: 600, color }}>
                      {" "}
                      · {log.value}{" "}
                      {logTypes.find((t) => t.id === log.type)?.unit || ""}
                    </span>
                  )}
                </Typography>
                {log.note && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: 13,
                      mt: 0.5,
                      fontFamily: '"Lora", serif',
                      lineHeight: 1.5,
                    }}
                  >
                    {log.note}
                  </Typography>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ fontSize: 11, fontWeight: 500, flexShrink: 0, pt: 0.5 }}
              >
                {dayjs(log.created_at).format("MMM D")}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export function InsightCard({ color, insight }) {
  if (!insight) return null;
  return (
    <Fade in timeout={1000}>
      <Box
        sx={{
          p: 3,
          borderRadius: 4,
          mb: 3,
          background: `linear-gradient(145deg, ${color}15 0%, transparent 100%)`,
          borderLeft: `4px solid ${color}`,
          borderTop: `1px solid ${color}20`,
          borderRight: `1px solid ${color}05`,
          borderBottom: `1px solid ${color}05`,
          boxShadow: `0 8px 24px -10px ${color}20`,
          position: "relative",
        }}
      >
        <AutoAwesome
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: `${color}30`,
            fontSize: 40,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 2,
            fontSize: 10,
            fontWeight: 800,
            color,
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
          }}
        >
          <FlashOn sx={{ fontSize: 14 }} /> Crucial Insight
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: 16,
            lineHeight: 1.7,
            fontFamily: '"Lora", serif',
            color: "text.primary",
            pr: 4,
          }}
        >
          {insight}
        </Typography>
      </Box>
    </Fade>
  );
}
