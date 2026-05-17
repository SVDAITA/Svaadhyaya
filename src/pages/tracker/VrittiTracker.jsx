import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Chip,
  LinearProgress,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Stack,
  Rating,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Snackbar,
  Alert,
  Fade,
  Collapse,
  Avatar,
} from "@mui/material";
import {
  Add,
  Delete,
  CheckCircle,
  BusinessCenter,
  School,
  BarChart,
  AutoAwesome,
  WorkspacePremium,
  KeyboardArrowDown,
  KeyboardArrowUp,
  TipsAndUpdates,
  Category,
  Code,
  Psychology,
  Dns,
  Build,
  Groups,
  EmojiEvents,
  Lightbulb,
  TrendingUp,
  FilterNone,
  BookmarkBorder,
  Timeline,
  Star,
  Verified,
  Rocket,
  Close,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";

// ─── BUG FIX: moved defaults outside component to avoid stale closure issues ──
const DEFAULT_PROJ_FORM = {
  title: "",
  client: "",
  company: "",
  type: "official",
  learnings: "",
  tech: "",
  journal: "",
};
const DEFAULT_SKILL_FORM = { name: "", category: "Technical", rating: 3 };
const DEFAULT_CERT_FORM = { title: "", issuer: "", progress: 0 };

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  blue: "#1A5FB0",
  blueLight: "#4A8FE0",
  blueDim: "#1A5FB018",
  purple: "#7C4DAB",
  purpleLight: "#9B6CC4",
  purpleDim: "#7C4DAB18",
  green: "#2D7A4F",
  greenLight: "#3A9A64",
  greenDim: "#2D7A4F18",
  gold: "#C5972E",
  goldDim: "#C5972E18",
  red: "#CF4E4E",
  teal: "#1A7A7A",
  tealDim: "#1A7A7A18",
  orange: "#C0622E",
};

const SKILL_CATEGORIES = [
  { key: "Technical", icon: <Code sx={{ fontSize: 14 }} />, color: C.blue, colorDark: C.blueLight },
  { key: "Soft Skills", icon: <Psychology sx={{ fontSize: 14 }} />, color: C.purple, colorDark: C.purpleLight },
  { key: "Domain", icon: <Dns sx={{ fontSize: 14 }} />, color: C.teal, colorDark: "#4DC4C4" },
  { key: "Tools", icon: <Build sx={{ fontSize: 14 }} />, color: C.gold, colorDark: "#D4A830" },
  { key: "Leadership", icon: <Groups sx={{ fontSize: 14 }} />, color: C.green, colorDark: C.greenLight },
];

const SKILL_CATEGORY_KEYS = SKILL_CATEGORIES.map((c) => c.key);

const PROFICIENCY_LABELS = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];
const PROFICIENCY_COLORS = ["", C.red, C.orange, C.gold, C.blue, C.green];
const PROFICIENCY_COLORS_DARK = ["", "#FF7070", "#E08A4A", "#D4A830", C.blueLight, C.greenLight];

// ─── Helper ──────────────────────────────────────────────────────────────────
function safeParseNotes(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function getCategoryMeta(key) {
  return SKILL_CATEGORIES.find((c) => c.key === key) || {
    key,
    icon: <Category sx={{ fontSize: 14 }} />,
    color: C.blue,
  };
}

// ─── Radar / Skill Chart ─────────────────────────────────────────────────────
function SkillRadar({ skills, isDark }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;

  const catData = SKILL_CATEGORIES.map((cat) => {
    const catSkills = skills.filter((s) => s.type === cat.key);
    const avg = catSkills.length
      ? catSkills.reduce((sum, s) => sum + Math.min(5, Math.max(0, Number(s.note) || 0)), 0) / catSkills.length
      : 0;
    return { ...cat, avg, count: catSkills.length };
  });

  const n = catData.length;
  const points = catData.map((d, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const val = (d.avg / 5) * r;
    return {
      x: cx + val * Math.cos(angle),
      y: cy + val * Math.sin(angle),
      lx: cx + (r + 22) * Math.cos(angle),
      ly: cy + (r + 22) * Math.sin(angle),
      ...d,
    };
  });

  const gridPoints = (factor) =>
    catData.map((_, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      return `${cx + r * factor * Math.cos(angle)},${cy + r * factor * Math.sin(angle)}`;
    }).join(" ");

  const polyPath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const axisColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  if (skills.length === 0) return null;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={gridPoints(f)}
            fill="none"
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {catData.map((_, i) => {
          const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke={axisColor}
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={polyPath}
          fill={`${C.blue}30`}
          stroke={C.blue}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={p.color} />
        ))}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.lx}
            y={p.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="'DM Sans', sans-serif"
            fontWeight={600}
            fill={isDark ? "#aaa" : "#666"}
          >
            {p.key.split(" ")[0]}
          </text>
        ))}
      </svg>
    </Box>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function TabPanel({ value, index, children }) {
  // BUG FIX: Always render children to avoid remount cost, but hide with CSS
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{
        display: value === index ? "block" : "none",
        pt: 3,
        animation: value === index ? "fadeIn 0.25s ease" : "none",
        "@keyframes fadeIn": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "none" } },
      }}
    >
      {children}
    </Box>
  );
}

function StatCard({ label, value, color, icon, subtext, isDark, cardBg, border, trend }) {
  return (
    <Card
      sx={{
        bgcolor: cardBg,
        border: `1px solid ${border}`,
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        transition: "transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: isDark ? `0 12px 40px ${color}25` : `0 8px 28px ${color}20`,
        },
      }}
    >
      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)`, width: "100%" }} />
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography sx={{ color: isDark ? "#9C9A94" : "#5F5F5F", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, mb: 0.5 }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 40, fontWeight: 200, fontFamily: "'DM Serif Display', serif", color, lineHeight: 1 }}>
              {value}
            </Typography>
            {subtext && (
              <Typography sx={{ fontSize: 11, color: isDark ? "#9C9A94" : "#7A7A7A", mt: 0.5, fontWeight: 500 }}>
                {subtext}
              </Typography>
            )}
          </Box>
          <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: `${color}18`, color, mt: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </Box>
        </Box>
        {trend !== undefined && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 12, color: isDark ? C.greenLight : C.green }} />
            <Typography sx={{ fontSize: 10, color: isDark ? C.greenLight : C.green, fontWeight: 600 }}>{trend}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project, onDelete, isDark, cardBg, border, textP, textS }) {
  const [expanded, setExpanded] = useState(false);
  const data = safeParseNotes(project.notes);
  const techs = data.tech
    ? data.tech.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const isPersonal = data.type === "personal";

  return (
    <Card
      sx={{
        bgcolor: cardBg,
        border: `1px solid ${border}`,
        borderRadius: 3,
        overflow: "hidden",
        transition: "box-shadow 0.22s, border-color 0.22s",
        "&:hover": {
          boxShadow: isDark ? "0 6px 32px #00000055" : "0 6px 24px #00000014",
          borderColor: isPersonal ? `${C.gold}40` : `${C.blue}30`,
        },
      }}
    >
      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: 4, flexShrink: 0, background: `linear-gradient(180deg, ${isPersonal ? C.gold : C.blue}, ${isPersonal ? C.orange : C.blueLight})` }} />
        <CardContent sx={{ p: 2.5, flex: 1, "&:last-child": { pb: 2.5 } }}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box sx={{ flex: 1, mr: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                <Chip
                  label={isPersonal ? "Personal" : "Official"}
                  size="small"
                  icon={isPersonal ? <Lightbulb sx={{ fontSize: "12px !important" }} /> : <BusinessCenter sx={{ fontSize: "12px !important" }} />}
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    height: 22,
                    bgcolor: isPersonal ? C.goldDim : C.blueDim,
                    color: isPersonal ? C.gold : C.blue,
                    border: `1px solid ${isPersonal ? C.gold + "40" : C.blue + "40"}`,
                    "& .MuiChip-icon": { color: "inherit" },
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: textP, lineHeight: 1.3, fontFamily: "'DM Serif Display', serif" }}>
                {project.title}
              </Typography>
              {(data.client || data.company) && (
                <Typography sx={{ fontSize: 12, color: textS, mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <BusinessCenter sx={{ fontSize: 11 }} />
                  {[data.client, data.company].filter(Boolean).join(" @ ")}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title={expanded ? "Collapse" : "View Details"}>
                <IconButton
                  size="small"
                  onClick={() => setExpanded((x) => !x)}
                  sx={{
                    color: textS,
                    opacity: 0.5,
                    "&:hover": { opacity: 1, bgcolor: isDark ? "#ffffff10" : "#00000008" },
                    transition: "transform 0.2s",
                    transform: expanded ? "rotate(180deg)" : "none",
                  }}
                >
                  <KeyboardArrowDown fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete project">
                <IconButton
                  size="small"
                  onClick={() => onDelete(project.id)}
                  sx={{ color: C.red, opacity: 0.3, "&:hover": { opacity: 1, bgcolor: `${C.red}15` } }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Tech chips */}
          {techs.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
              {techs.map((t, i) => (
                <Chip
                  key={i}
                  label={t}
                  size="small"
                  sx={{
                    fontSize: 10,
                    height: 20,
                    bgcolor: isDark ? "#ffffff08" : "#f0f0f0",
                    color: textS,
                    fontWeight: 500,
                    border: "none",
                    fontFamily: "'DM Mono', monospace",
                  }}
                />
              ))}
            </Box>
          )}

          {/* Expanded */}
          <Collapse in={expanded}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {data.learnings && (
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: isDark ? "#ffffff06" : `${C.blue}06`,
                      border: `1px solid ${isDark ? "#ffffff10" : `${C.blue}15`}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                      <Lightbulb sx={{ fontSize: 13, color: C.blue }} />
                      <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.blue }}>
                        Key Learnings
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, lineHeight: 1.7, color: textP }}>
                      {data.learnings}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {data.journal && (
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: isDark ? "#ffffff06" : `${C.gold}06`,
                      border: `1px solid ${isDark ? "#ffffff10" : `${C.gold}20`}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                      <TipsAndUpdates sx={{ fontSize: 13, color: C.gold }} />
                      <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.gold }}>
                        Journal
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.7, color: textS }}>
                      {data.journal}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {!data.learnings && !data.journal && (
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: 12, color: textS, fontStyle: "italic", py: 1 }}>
                    No additional notes for this project.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Collapse>
        </CardContent>
      </Box>
    </Card>
  );
}

// ─── Skill Row (extracted to avoid duplication bug) ──────────────────────────
function SkillRow({ skill, onDelete, isDark, textP, textS, border }) {
  const rating = Math.min(5, Math.max(0, Number(skill.note) || 0));
  const profLabel = PROFICIENCY_LABELS[rating] || "";
  const profColor = (isDark ? PROFICIENCY_COLORS_DARK : PROFICIENCY_COLORS)[rating] || (isDark ? C.blueLight : C.blue);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: textP }}>{skill.value}</Typography>
          {profLabel && (
            <Chip
              label={profLabel}
              size="small"
              sx={{
                height: 18,
                fontSize: 9,
                fontWeight: 700,
                bgcolor: `${profColor}18`,
                color: profColor,
                border: `1px solid ${profColor}35`,
              }}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Rating
            value={rating}
            readOnly
            size="small"
            sx={{ "& .MuiRating-iconFilled": { color: profColor }, "& .MuiRating-iconEmpty": { color: isDark ? "#444" : "#DDD" } }}
          />
          <Typography sx={{ fontSize: 11, color: textS, minWidth: 24, textAlign: "right" }}>{rating}/5</Typography>
          <Tooltip title="Remove skill">
            <IconButton
              onClick={() => onDelete("logs", skill.id)}
              size="small"
              sx={{ opacity: 0.2, "&:hover": { opacity: 1, color: C.red } }}
            >
              <Delete sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={rating * 20}
        sx={{
          height: 5,
          borderRadius: 3,
          bgcolor: isDark ? "#2a2a2a" : "#EEECF8",
          "& .MuiLinearProgress-bar": {
            background: `linear-gradient(90deg, ${profColor}CC, ${profColor})`,
            borderRadius: 3,
            transition: "transform 0.8s cubic-bezier(.4,0,.2,1)",
          },
        }}
      />
    </Box>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ icon, title, body, action, color, isDark }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 9,
        px: 3,
        textAlign: "center",
        gap: 2,
        borderRadius: 3,
        border: `1.5px dashed ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
      }}
    >
      <Box sx={{ p: 2.5, borderRadius: "50%", bgcolor: `${color}12`, display: "flex" }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, color: isDark ? "#888" : "#666", mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 13, color: isDark ? "#666" : "#999", maxWidth: 320 }}>
          {body}
        </Typography>
      </Box>
      {action && (
        <Button
          variant="outlined"
          onClick={action.onClick}
          size="small"
          startIcon={<Add />}
          sx={{
            mt: 0.5,
            textTransform: "none",
            borderColor: color,
            color,
            fontWeight: 600,
            borderRadius: 2,
            "&:hover": { bgcolor: `${color}10`, borderColor: color },
          }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}

// ─── Mini progress ring ───────────────────────────────────────────────────────
function ProgressRing({ value, size = 44, color, isDark }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = ((value ?? 0) / 100) * circ;
  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isDark ? "#2a2a2a" : "#EEE"} strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={circ}
          strokeDashoffset={circ - filled}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ fontSize: 9, fontWeight: 800, color, lineHeight: 1 }}>{value ?? 0}%</Typography>
      </Box>
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function VrittiTracker() {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certs, setCerts] = useState([]);

  const [openProj, setOpenProj] = useState(false);
  const [openSkill, setOpenSkill] = useState(false);
  const [openCert, setOpenCert] = useState(false);

  // BUG FIX: use the module-level defaults to avoid stale closures
  const [projForm, setProjForm] = useState(DEFAULT_PROJ_FORM);
  const [skillForm, setSkillForm] = useState(DEFAULT_SKILL_FORM);
  const [certForm, setCertForm] = useState(DEFAULT_CERT_FORM);

  // ─── Theme Tokens ────────────────────────────────────────────────────────
  const bg = isDark
    ? `radial-gradient(ellipse 90% 35% at 50% -5%, ${C.blue}14 0%, #0D0C0A 65%)`
    : `radial-gradient(ellipse 90% 35% at 50% -5%, ${C.blue}09 0%, #F8FAFC 65%)`;
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const cardBg = isDark ? "#1C1A18" : "#FDFCFA";
  const surfaceBg = isDark ? "#16140F" : "#F2EFE9";
  const textP = isDark ? "#F0EDE8" : "#1A1A1A";
  const textS = isDark ? "#9C9A94" : "#636059";
  const dialogBg = isDark ? "#1E1C1A" : "#FDFCFA";
  // Dark-mode safe variants of deep brand colors (dark originals are invisible on dark backgrounds)
  const cBlue = isDark ? C.blueLight : C.blue;
  const cGreen = isDark ? C.greenLight : C.green;
  const cTeal = isDark ? "#4DC4C4" : C.teal;

  // ─── Data Loading ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [p, s, c] = await Promise.all([
        supabase.from("milestones").select("*").eq("user_id", user.id).eq("area", "career_project").order("created_at", { ascending: false }),
        supabase.from("logs").select("*").eq("user_id", user.id).eq("area", "skill").order("created_at", { ascending: false }),
        supabase.from("milestones").select("*").eq("user_id", user.id).eq("area", "certification").order("progress", { ascending: false }),
      ]);
      setProjects(p.data || []);
      setSkills(s.data || []);
      setCerts(c.data || []);
    } catch {
      // silently fail — UI already shows empty state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const showToast = (msg, severity = "success") => setToast({ open: true, msg, severity });

  const saveProject = async () => {
    if (!projForm.title.trim()) return;
    setSaving(true);
    const meta = JSON.stringify({
      learnings: projForm.learnings,
      tech: projForm.tech,
      journal: projForm.journal,
      company: projForm.company,
      client: projForm.client,
      type: projForm.type,
    });
    const { error } = await supabase.from("milestones").insert({
      user_id: user.id,
      area: "career_project",
      title: projForm.title.trim(),
      notes: meta,
    });
    if (error) {
      showToast("Failed to save project", "error");
    } else {
      showToast("Project logged successfully!");
      setOpenProj(false);
      setProjForm(DEFAULT_PROJ_FORM);
      await loadData();
    }
    setSaving(false);
  };

  const saveSkill = async () => {
    if (!skillForm.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("logs").insert({
      user_id: user.id,
      area: "skill",
      type: skillForm.category,
      value: skillForm.name.trim(),
      note: String(skillForm.rating ?? 3),
    });
    if (error) {
      showToast("Failed to save skill", "error");
    } else {
      showToast("Skill added!");
      setOpenSkill(false);
      setSkillForm(DEFAULT_SKILL_FORM);
      await loadData();
    }
    setSaving(false);
  };

  const saveCert = async () => {
    if (!certForm.title.trim()) return;
    setSaving(true);
    // BUG FIX: guard against NaN progress
    const safeProgress = Math.min(100, Math.max(0, Number(certForm.progress) || 0));
    const { error } = await supabase.from("milestones").insert({
      user_id: user.id,
      area: "certification",
      title: certForm.title.trim(),
      issuer: certForm.issuer,
      progress: safeProgress,
    });
    if (error) {
      showToast("Failed to save certification", "error");
    } else {
      showToast("Certification saved!");
      setOpenCert(false);
      setCertForm(DEFAULT_CERT_FORM);
      await loadData();
    }
    setSaving(false);
  };

  const deleteItem = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      showToast("Delete failed", "error");
    } else {
      showToast("Removed", "info");
      await loadData();
    }
  };

  // ─── Derived Stats ────────────────────────────────────────────────────────
  const completedCerts = certs.filter((c) => c.progress === 100).length;
  const inProgressCerts = certs.filter((c) => c.progress > 0 && c.progress < 100).length;
  const avgSkillRating = skills.length
    ? (skills.reduce((sum, s) => sum + Math.min(5, Number(s.note) || 0), 0) / skills.length).toFixed(1)
    : "—";
  const officialProjects = projects.filter((p) => safeParseNotes(p.notes).type !== "personal").length;
  const personalProjects = projects.length - officialProjects;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 2.5 }}>
        <Box sx={{ position: "relative" }}>
          <CircularProgress sx={{ color: C.blue }} size={44} thickness={2} />
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Rocket sx={{ fontSize: 18, color: C.blue }} />
          </Box>
        </Box>
        <Typography sx={{ color: textS, fontSize: 13, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>
          Loading your professional ledger…
        </Typography>
      </Box>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 5 }, maxWidth: 1100, mx: "auto", minHeight: "100vh", background: bg }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: `${C.blue}18`, display: "flex" }}>
              <AutoAwesome sx={{ fontSize: 13, color: C.blue }} />
            </Box>
            <Typography variant="overline" sx={{ color: C.blue, fontWeight: 700, letterSpacing: 2.5, fontSize: 10 }}>
              Vṛtti Tracker
            </Typography>
          </Box>
          <Typography sx={{ fontFamily: "'DM Serif Display', serif", fontSize: { xs: 30, md: 42 }, fontWeight: 400, color: textP, lineHeight: 1.1, letterSpacing: -0.5 }}>
            Professional Ledger
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.75, flexWrap: "wrap" }}>
            {[
              { val: projects.length, label: "projects", color: cBlue },
              { val: skills.length, label: "skills", color: C.purple },
              { val: certs.length, label: "certifications", color: cGreen },
            ].map(({ val, label, color }) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
                <Typography sx={{ fontSize: 12, color: textS, fontWeight: 500 }}>
                  <b style={{ color: textP }}>{val}</b> {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setOpenSkill(true)}
            sx={{ color: C.purple, borderColor: `${C.purple}50`, textTransform: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, "&:hover": { bgcolor: C.purpleDim, borderColor: C.purple } }}
          >
            Skill
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setOpenCert(true)}
            sx={{ color: cGreen, borderColor: `${cGreen}50`, textTransform: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, "&:hover": { bgcolor: C.greenDim, borderColor: cGreen } }}
          >
            Cert
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenProj(true)}
            sx={{ bgcolor: C.blue, textTransform: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, px: 2.5, boxShadow: `0 4px 16px ${C.blue}40`, "&:hover": { bgcolor: C.blueLight, boxShadow: `0 6px 20px ${C.blue}50` } }}
          >
            Add Project
          </Button>
        </Stack>
      </Box>

      {/* ── Stats Grid ── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Projects" value={projects.length} color={cBlue} icon={<BusinessCenter sx={{ fontSize: 20 }} />}
            subtext={`${officialProjects} official · ${personalProjects} personal`} isDark={isDark} cardBg={cardBg} border={border} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Skills" value={skills.length} color={C.purple} icon={<Star sx={{ fontSize: 20 }} />}
            subtext={`avg rating ${avgSkillRating}/5`} isDark={isDark} cardBg={cardBg} border={border} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Certified" value={completedCerts} color={cGreen} icon={<Verified sx={{ fontSize: 20 }} />}
            subtext={`of ${certs.length} total`} isDark={isDark} cardBg={cardBg} border={border} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="In Progress" value={inProgressCerts} color={C.gold} icon={<Timeline sx={{ fontSize: 20 }} />}
            subtext="certifications ongoing" isDark={isDark} cardBg={cardBg} border={border} />
        </Grid>
      </Grid>

      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: `1px solid ${border}`, mb: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 13, minHeight: 46, color: textS, gap: 0.75, px: 2.5 },
            "& .Mui-selected": { color: `${cBlue} !important` },
            "& .MuiTabs-indicator": { bgcolor: cBlue, height: 2.5, borderRadius: "2px 2px 0 0" },
          }}
        >
          <Tab label="Projects" icon={<BusinessCenter sx={{ fontSize: 15 }} />} iconPosition="start" />
          <Tab label="Skills" icon={<BarChart sx={{ fontSize: 15 }} />} iconPosition="start" />
          <Tab label="Certifications" icon={<WorkspacePremium sx={{ fontSize: 15 }} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* ── PROJECTS TAB ── */}
      <TabPanel value={tab} index={0}>
        {projects.length === 0 ? (
          <EmptyState
            icon={<BusinessCenter sx={{ fontSize: 36, color: C.blue }} />}
            title="No projects yet"
            body="Start documenting your work — log the tech stack, key learnings, and reflections from each project."
            action={{ label: "Add First Project", onClick: () => setOpenProj(true) }}
            color={C.blue}
            isDark={isDark}
          />
        ) : (
          <Stack spacing={2}>
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onDelete={(id) => deleteItem("milestones", id)}
                isDark={isDark}
                cardBg={cardBg}
                border={border}
                textP={textP}
                textS={textS}
              />
            ))}
          </Stack>
        )}
      </TabPanel>

      {/* ── SKILLS TAB ── */}
      <TabPanel value={tab} index={1}>
        {skills.length === 0 ? (
          <EmptyState
            icon={<BarChart sx={{ fontSize: 36, color: C.purple }} />}
            title="No skills logged"
            body="Track your technical and soft skills with proficiency ratings to visualize your growth."
            action={{ label: "Add First Skill", onClick: () => setOpenSkill(true) }}
            color={C.purple}
            isDark={isDark}
          />
        ) : (
          <Grid container spacing={3}>
            {/* Radar chart panel */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: cardBg, border: `1px solid ${border}`, borderRadius: 3, p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <FilterNone sx={{ fontSize: 14, color: textS }} />
                  <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: textS }}>
                    Skill Coverage
                  </Typography>
                </Box>
                <SkillRadar skills={skills} isDark={isDark} />
                <Box sx={{ mt: "auto", pt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  {SKILL_CATEGORIES.map((cat) => {
                    const catSkills = skills.filter((s) => s.type === cat.key);
                    if (!catSkills.length) return null;
                    const avg = catSkills.reduce((sum, s) => sum + Math.min(5, Number(s.note) || 0), 0) / catSkills.length;
                    return (
                      <Box key={cat.key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ color: cat.color, display: "flex", width: 14, flexShrink: 0 }}>{cat.icon}</Box>
                        <Typography sx={{ fontSize: 11, color: textS, flex: 1 }}>{cat.key}</Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: cat.color }}>{avg.toFixed(1)}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            </Grid>

            {/* Skills list */}
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button startIcon={<Add />} onClick={() => setOpenSkill(true)} size="small" sx={{ color: C.purple, textTransform: "none", fontWeight: 600 }}>
                  Add Skill
                </Button>
              </Box>
              <Stack spacing={2.5}>
                {/* BUG FIX: unified rendering - no duplicate block */}
                {SKILL_CATEGORY_KEYS.filter((cat) => skills.some((s) => s.type === cat)).map((cat) => {
                  const meta = getCategoryMeta(cat);
                  const catSkills = skills.filter((s) => s.type === cat);
                  return (
                    <Box key={cat}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <Box sx={{ color: meta.color, display: "flex" }}>{meta.icon}</Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: textS }}>
                          {cat}
                        </Typography>
                        <Chip label={catSkills.length} size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, bgcolor: `${meta.color}15`, color: meta.color, border: "none" }} />
                      </Box>
                      <Card sx={{ bgcolor: cardBg, border: `1px solid ${border}`, borderRadius: 3, p: 2.5 }}>
                        <Stack spacing={2.5}>
                          {catSkills.map((s) => (
                            <SkillRow key={s.id} skill={s} onDelete={deleteItem} isDark={isDark} textP={textP} textS={textS} border={border} />
                          ))}
                        </Stack>
                      </Card>
                    </Box>
                  );
                })}
                {/* Ungrouped skills */}
                {skills.filter((s) => !SKILL_CATEGORY_KEYS.includes(s.type)).length > 0 && (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <Category sx={{ fontSize: 14, color: textS }} />
                      <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: textS }}>Other</Typography>
                    </Box>
                    <Card sx={{ bgcolor: cardBg, border: `1px solid ${border}`, borderRadius: 3, p: 2.5 }}>
                      <Stack spacing={2.5}>
                        {skills.filter((s) => !SKILL_CATEGORY_KEYS.includes(s.type)).map((s) => (
                          <SkillRow key={s.id} skill={s} onDelete={deleteItem} isDark={isDark} textP={textP} textS={textS} border={border} />
                        ))}
                      </Stack>
                    </Card>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* ── CERTS TAB ── */}
      <TabPanel value={tab} index={2}>
        {certs.length === 0 ? (
          <EmptyState
            icon={<WorkspacePremium sx={{ fontSize: 36, color: C.green }} />}
            title="No certifications yet"
            body="Track certifications you're pursuing or have completed. Add progress to stay motivated."
            action={{ label: "Add Certification", onClick: () => setOpenCert(true) }}
            color={C.green}
            isDark={isDark}
          />
        ) : (
          <>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <CheckCircle sx={{ fontSize: 14, color: C.green }} />
                  <Typography sx={{ fontSize: 12, color: textS, fontWeight: 600 }}>{completedCerts} completed</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Timeline sx={{ fontSize: 14, color: C.gold }} />
                  <Typography sx={{ fontSize: 12, color: textS, fontWeight: 600 }}>{inProgressCerts} in progress</Typography>
                </Box>
              </Box>
              <Button startIcon={<Add />} onClick={() => setOpenCert(true)} size="small" sx={{ color: C.green, textTransform: "none", fontWeight: 600 }}>
                Add Certification
              </Button>
            </Box>
            <Grid container spacing={2.5}>
              {certs.map((c) => {
                const done = c.progress === 100;
                const certColor = done ? C.green : c.progress > 50 ? C.blue : C.gold;
                return (
                  <Grid item xs={12} sm={6} key={c.id}>
                    <Card
                      sx={{
                        bgcolor: cardBg,
                        border: `1px solid ${done ? `${C.green}30` : border}`,
                        borderRadius: 3,
                        overflow: "hidden",
                        transition: "box-shadow 0.22s, transform 0.22s",
                        "&:hover": {
                          boxShadow: isDark ? `0 8px 32px ${certColor}20` : `0 6px 24px ${certColor}15`,
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${certColor}, ${certColor}60)` }} />
                      <Box sx={{ p: 2.5 }}>
                        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                          <ProgressRing value={c.progress ?? 0} color={certColor} isDark={isDark} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: textP, lineHeight: 1.3, fontFamily: "'DM Serif Display', serif" }}>
                              {c.title}
                            </Typography>
                            {c.issuer && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.4 }}>
                                <BookmarkBorder sx={{ fontSize: 11, color: textS }} />
                                <Typography sx={{ fontSize: 11, color: textS }}>{c.issuer}</Typography>
                              </Box>
                            )}
                            {done && (
                              <Chip
                                label="Completed"
                                size="small"
                                icon={<Verified sx={{ fontSize: "11px !important" }} />}
                                sx={{ height: 20, fontSize: 9, fontWeight: 700, bgcolor: C.greenDim, color: C.green, border: `1px solid ${C.green}35`, mt: 0.75, "& .MuiChip-icon": { color: "inherit" } }}
                              />
                            )}
                          </Box>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => deleteItem("milestones", c.id)}
                              size="small"
                              sx={{ opacity: 0.2, flexShrink: 0, "&:hover": { opacity: 1, color: C.red } }}
                            >
                              <Delete sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        {!done && (
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                              <Typography sx={{ fontSize: 10, fontWeight: 600, color: textS, textTransform: "uppercase", letterSpacing: 0.8 }}>
                                Progress
                              </Typography>
                              <Typography sx={{ fontSize: 10, fontWeight: 700, color: certColor }}>{c.progress ?? 0}%</Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={c.progress ?? 0}
                              sx={{
                                height: 5,
                                borderRadius: 3,
                                bgcolor: isDark ? "#2a2a2a" : "#EEE",
                                "& .MuiLinearProgress-bar": {
                                  background: `linear-gradient(90deg, ${certColor}CC, ${certColor})`,
                                  borderRadius: 3,
                                  transition: "transform 0.8s cubic-bezier(.4,0,.2,1)",
                                },
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </TabPanel>

      {/* ── DIALOG: Add Project ── */}
      <Dialog
        open={openProj}
        onClose={() => { setOpenProj(false); setProjForm(DEFAULT_PROJ_FORM); }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: dialogBg, backgroundImage: "none" } }}
      >
        <DialogTitle sx={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: 24, pb: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Log New Project
          <IconButton onClick={() => { setOpenProj(false); setProjForm(DEFAULT_PROJ_FORM); }} size="small" sx={{ opacity: 0.4, "&:hover": { opacity: 1 } }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <ToggleButtonGroup
            value={projForm.type}
            exclusive
            onChange={(_, v) => v && setProjForm({ ...projForm, type: v })}
            size="small"
            fullWidth
          >
            <ToggleButton value="official" sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, flex: 1, "&.Mui-selected": { bgcolor: C.blueDim, color: C.blue, borderColor: `${C.blue}50` } }}>
              <BusinessCenter sx={{ fontSize: 15, mr: 0.75 }} /> Official
            </ToggleButton>
            <ToggleButton value="personal" sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, flex: 1, "&.Mui-selected": { bgcolor: C.goldDim, color: C.gold, borderColor: `${C.gold}50` } }}>
              <Lightbulb sx={{ fontSize: 15, mr: 0.75 }} /> Personal
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField label="Project Name *" fullWidth autoFocus value={projForm.title} onChange={(e) => setProjForm({ ...projForm, title: e.target.value })} size="small" />
          <Stack direction="row" spacing={2}>
            <TextField label="Company" fullWidth size="small" value={projForm.company} onChange={(e) => setProjForm({ ...projForm, company: e.target.value })} />
            <TextField label="Client" fullWidth size="small" value={projForm.client} onChange={(e) => setProjForm({ ...projForm, client: e.target.value })} />
          </Stack>
          <TextField label="Tech Stack (comma separated)" fullWidth size="small" placeholder="React, Node.js, PostgreSQL" value={projForm.tech} onChange={(e) => setProjForm({ ...projForm, tech: e.target.value })} />
          <TextField label="Key Learnings" multiline rows={3} fullWidth placeholder="What did you learn or improve in this project?" value={projForm.learnings} onChange={(e) => setProjForm({ ...projForm, learnings: e.target.value })} />
          <TextField label="Journal / Observations" multiline rows={2} fullWidth placeholder="Interesting details, war stories, observations…" value={projForm.journal} onChange={(e) => setProjForm({ ...projForm, journal: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setOpenProj(false); setProjForm(DEFAULT_PROJ_FORM); }} color="inherit" sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveProject} disabled={saving || !projForm.title.trim()} sx={{ bgcolor: C.blue, textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: C.blueLight } }}>
            {saving ? "Saving…" : "Save Project"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG: Add Skill ── */}
      <Dialog
        open={openSkill}
        onClose={() => { setOpenSkill(false); setSkillForm(DEFAULT_SKILL_FORM); }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: dialogBg, backgroundImage: "none" } }}
      >
        <DialogTitle sx={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: 24, pb: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Add Skill
          <IconButton onClick={() => { setOpenSkill(false); setSkillForm(DEFAULT_SKILL_FORM); }} size="small" sx={{ opacity: 0.4, "&:hover": { opacity: 1 } }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "12px !important" }}>
          <TextField label="Skill Name *" fullWidth autoFocus size="small" value={skillForm.name} onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })} />
          <Box>
            <Typography sx={{ fontSize: 11, color: textS, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, mb: 1.25 }}>Category</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {SKILL_CATEGORIES.map(({ key, icon, color, colorDark }) => {
                const sc = isDark ? colorDark : color;
                return (
                <Chip
                  key={key}
                  label={key}
                  icon={<Box sx={{ color: "inherit !important", display: "flex", "& svg": { fontSize: "12px !important" } }}>{icon}</Box>}
                  size="small"
                  onClick={() => setSkillForm({ ...skillForm, category: key })}
                  sx={{
                    fontSize: 12,
                    cursor: "pointer",
                    bgcolor: skillForm.category === key ? `${sc}18` : "transparent",
                    color: skillForm.category === key ? sc : textS,
                    border: `1px solid ${skillForm.category === key ? sc + "60" : isDark ? "#444" : "#DDD"}`,
                    fontWeight: skillForm.category === key ? 700 : 400,
                    transition: "all 0.15s",
                    "&:hover": { bgcolor: `${sc}12`, color: sc },
                    "& .MuiChip-icon": { color: "inherit" },
                  }}
                />
                ); })}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: textS, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, mb: 1.25 }}>Proficiency Level</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Rating
                value={skillForm.rating}
                // BUG FIX: null check instead of falsy check (allows rating of 0)
                onChange={(_, v) => v !== null && setSkillForm({ ...skillForm, rating: v })}
                sx={{ "& .MuiRating-iconFilled": { color: (isDark ? PROFICIENCY_COLORS_DARK : PROFICIENCY_COLORS)[skillForm.rating] || C.purple }, "& .MuiRating-iconHover": { color: C.purple } }}
              />
              {skillForm.rating > 0 && (
                <Chip
                  label={PROFICIENCY_LABELS[skillForm.rating]}
                  size="small"
                  sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: `${(isDark ? PROFICIENCY_COLORS_DARK : PROFICIENCY_COLORS)[skillForm.rating]}18`, color: (isDark ? PROFICIENCY_COLORS_DARK : PROFICIENCY_COLORS)[skillForm.rating], border: "none" }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setOpenSkill(false); setSkillForm(DEFAULT_SKILL_FORM); }} color="inherit" sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveSkill} disabled={saving || !skillForm.name.trim()} sx={{ bgcolor: C.purple, textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: C.purpleLight } }}>
            {saving ? "Saving…" : "Add Skill"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG: Add Certification ── */}
      <Dialog
        open={openCert}
        onClose={() => { setOpenCert(false); setCertForm(DEFAULT_CERT_FORM); }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: dialogBg, backgroundImage: "none" } }}
      >
        <DialogTitle sx={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: 24, pb: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Add Certification
          <IconButton onClick={() => { setOpenCert(false); setCertForm(DEFAULT_CERT_FORM); }} size="small" sx={{ opacity: 0.4, "&:hover": { opacity: 1 } }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "12px !important" }}>
          <TextField label="Certification Name *" fullWidth autoFocus size="small" value={certForm.title} onChange={(e) => setCertForm({ ...certForm, title: e.target.value })} />
          <TextField label="Issuing Organization" fullWidth size="small" placeholder="e.g. AWS, Google, Coursera" value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })} />
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ fontSize: 11, color: textS, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Progress</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: certForm.progress === 100 ? C.green : certForm.progress > 50 ? C.blue : C.gold }}>
                {certForm.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={certForm.progress}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 1.5,
                bgcolor: isDark ? "#2a2a2a" : "#EEE",
                "& .MuiLinearProgress-bar": {
                  background: certForm.progress === 100
                    ? `linear-gradient(90deg, ${C.green}, ${C.greenLight})`
                    : certForm.progress > 50
                    ? `linear-gradient(90deg, ${C.blue}, ${C.blueLight})`
                    : `linear-gradient(90deg, ${C.gold}, #E0B050)`,
                  borderRadius: 4,
                  transition: "transform 0.3s ease",
                },
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={certForm.progress}
              // BUG FIX: explicit Number() coercion + fallback to 0
              onChange={(e) => setCertForm({ ...certForm, progress: Number(e.target.value) || 0 })}
              style={{ width: "100%", accentColor: C.green, cursor: "pointer" }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.25 }}>
              <Typography sx={{ fontSize: 10, color: textS }}>Not started</Typography>
              <Typography sx={{ fontSize: 10, color: C.green, fontWeight: 600 }}>Completed ✓</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setOpenCert(false); setCertForm(DEFAULT_CERT_FORM); }} color="inherit" sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveCert} disabled={saving || !certForm.title.trim()} sx={{ bgcolor: C.green, textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: C.greenLight } }}>
            {saving ? "Saving…" : "Save Cert"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{ fontSize: 13, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
