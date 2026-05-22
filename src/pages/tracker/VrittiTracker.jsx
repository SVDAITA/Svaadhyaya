import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Tabs, Tab, Stack, Pagination, ToggleButtonGroup,
  ToggleButton, Tooltip, LinearProgress, Divider,
} from "@mui/material";
import {
  Add, Delete, Edit, Close, CheckCircle, RadioButtonUnchecked,
  Work, Group, Code, Psychology, Dns, Build, TrendingUp,
  EmojiEvents, Flag, AutoAwesome, Lightbulb, Article,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { useLakshyaSiddhis } from "../../hooks/useLakshyaSiddhis";
import SiddhiPicker from "../../components/shared/SiddhiPicker";
import dayjs from "dayjs";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const VRITTI_BLUE    = "#1A5FB0";
const VRITTI_INDIGO  = "#3D3A8A";
const VRITTI_TEAL    = "#1A7A7A";

const PROJ_STATUS = [
  { value: "active",    label: "Active",    color: VRITTI_BLUE,  emoji: "🚀" },
  { value: "paused",    label: "Paused",    color: "#DDA74F",    emoji: "⏸️" },
  { value: "completed", label: "Completed", color: "#2D7A4F",    emoji: "✅" },
  { value: "archived",  label: "Archived",  color: "#888",       emoji: "📦" },
];
const PRIORITIES = [
  { value: 3, label: "High",   color: "#CF4E4E", emoji: "🔴" },
  { value: 2, label: "Medium", color: "#DDA74F", emoji: "🟡" },
  { value: 1, label: "Low",    color: "#2D7A4F", emoji: "🟢" },
];
const CLIENT_TYPES = ["employer", "client", "collaborator"];
const SKILL_CATS = [
  { key: "Technical",    icon: "💻", color: VRITTI_BLUE },
  { key: "Architecture", icon: "🏗️", color: VRITTI_INDIGO },
  { key: "Soft Skills",  icon: "🧠", color: "#7C4DAB" },
  { key: "Domain",       icon: "📊", color: VRITTI_TEAL },
  { key: "Tools",        icon: "🔧", color: "#C07830" },
  { key: "Leadership",   icon: "👥", color: "#2D7A4F" },
];
const PROF_LABELS = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];
const MOODS = ["Focused 🎯", "Creative 💡", "Grinding ⚙️", "Inspired ✨", "Tired 😓", "Overwhelmed 😰"];
const PER_PAGE = 10;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const haptic = (ms = 8) => { try { if (navigator?.vibrate) navigator.vibrate(ms); } catch (_) {} };

// ── CACHE ─────────────────────────────────────────────────────────────────────
let _vrittiCache = null;

// ── STARS ─────────────────────────────────────────────────────────────────────
function Stars({ value, onChange, size = 16 }) {
  return (
    <Stack direction="row" spacing={0.2}>
      {[1,2,3,4,5].map((n) => (
        <Box key={n} onClick={() => onChange?.(n)}
          sx={{ cursor: onChange ? "pointer" : "default", color: n <= value ? VRITTI_BLUE : "#888", fontSize: size, lineHeight: 1 }}>
          {n <= value ? "★" : "☆"}
        </Box>
      ))}
    </Stack>
  );
}

// ── STATUS CHIP ───────────────────────────────────────────────────────────────
function ProjStatusChip({ status }) {
  const s = PROJ_STATUS.find((x) => x.value === status) || PROJ_STATUS[0];
  return (
    <Chip label={`${s.emoji} ${s.label}`} size="small"
      sx={{ bgcolor: `${s.color}22`, color: s.color, fontWeight: 700, fontSize: 10, height: 20, border: `1px solid ${s.color}44` }} />
  );
}

// ── SECTION HEAD ──────────────────────────────────────────────────────────────
function SectionHead({ title, onAdd, color, isDark, addLabel = "Add" }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
      <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontSize: 17, fontWeight: 600,
        color: isDark ? "#F0EDE8" : "#1A1A1A" }}>{title}</Typography>
      {onAdd && (
        <Button size="small" startIcon={<Add sx={{ fontSize: 14 }} />} onClick={() => { haptic(); onAdd(); }}
          sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, color: "#fff", bgcolor: color,
            px: 1.5, py: 0.5, borderRadius: 2, "&:hover": { bgcolor: color, opacity: 0.88 } }}>
          {addLabel}
        </Button>
      )}
    </Box>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, sub, color, isDark }) {
  const bg   = isDark ? `${color}18` : `${color}10`;
  const bdr  = isDark ? `${color}35` : `${color}28`;
  return (
    <Card sx={{ borderRadius: 3, bgcolor: bg, border: `1px solid ${bdr}`, boxShadow: "none" }}>
      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
        <Typography sx={{ fontFamily: '"Fraunces",serif', fontSize: 28, fontWeight: 600, color, lineHeight: 1.1 }}>{value}</Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color, mt: 0.2 }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: 10, color: isDark ? "#7C7A74" : "#9C9A94", mt: 0.1 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function VrittiTracker({ embedded = false }) {
  const { user }    = useAuth();
  const { mode }    = useThemeMode();
  const isDark      = mode === "dark";
  const today       = dayjs().format("YYYY-MM-DD");

  const { siddhis: allSiddhis } = useLakshyaSiddhis();

  const blue   = VRITTI_BLUE;
  const textP  = isDark ? "#F0EDE8" : "#0A1628";
  const textS  = isDark ? "#8A9AB8" : "#5A7090";
  const cardBg = isDark ? "#0E1420" : "#F8FAFE";
  const bdr    = isDark ? `rgba(26,95,176,0.22)` : `rgba(26,95,176,0.18)`;

  // ── GLOBAL STATE ──────────────────────────────────────────────────────────
  const [tab,     setTab]     = useState(0);
  const [loading, setLoading] = useState(_vrittiCache === null);
  const [snack,   setSnack]   = useState({ open: false, msg: "", sev: "success" });
  const [delDlg,  setDelDlg]  = useState({ open: false, title: "", fn: null });

  const ok  = (msg) => setSnack({ open: true, msg, sev: "success" });
  const err = (msg) => setSnack({ open: true, msg, sev: "error" });
  const confirmDel = (title, fn) => { haptic(15); setDelDlg({ open: true, title, fn }); };

  // ── PROJECTS STATE ────────────────────────────────────────────────────────
  const emptyProj = { title: "", description: "", client_id: "", status: "active", tech_stack: "", start_date: today, target_date: "", priority: 2, notes: "", siddhi_id: "" };
  const [projects,    setProjects]    = useState(_vrittiCache?.projects || []);
  const [projForm,    setProjForm]    = useState(emptyProj);
  const [editProj,    setEditProj]    = useState(null);
  const [projDlg,     setProjDlg]     = useState(false);
  const [projFilter,  setProjFilter]  = useState("active");
  const [projPage,    setProjPage]    = useState(1);

  // ── DAILY LOG STATE ───────────────────────────────────────────────────────
  const emptyLog = { date: today, project_id: "", hours: "", notes: "" };
  const [logs,    setLogs]    = useState(_vrittiCache?.logs || []);
  const [logForm, setLogForm] = useState(emptyLog);
  const [logDlg,  setLogDlg]  = useState(false);
  const [logPage, setLogPage] = useState(1);

  // ── CLIENTS STATE ─────────────────────────────────────────────────────────
  const emptyClient = { name: "", company: "", type: "client", role: "", start_date: "", notes: "", is_active: true };
  const [clients,     setClients]     = useState(_vrittiCache?.clients || []);
  const [clientForm,  setClientForm]  = useState(emptyClient);
  const [editClient,  setEditClient]  = useState(null);
  const [clientDlg,   setClientDlg]   = useState(false);

  // ── SKILLS STATE ──────────────────────────────────────────────────────────
  const emptySkill = { category: "Technical", name: "", proficiency: 3, notes: "" };
  const [skills,     setSkills]    = useState(_vrittiCache?.skills || []);
  const [skillForm,  setSkillForm] = useState(emptySkill);
  const [editSkill,  setEditSkill] = useState(null);
  const [skillDlg,   setSkillDlg]  = useState(false);
  const [skillPage,  setSkillPage] = useState(1);

  // ── JOURNAL STATE ─────────────────────────────────────────────────────────
  const emptyJ = { date: today, content: "", mood: "Focused 🎯", wins: "", challenges: "" };
  const [journals, setJournals]  = useState(_vrittiCache?.journals || []);
  const [jForm,    setJForm]     = useState(emptyJ);
  const [editJ,    setEditJ]     = useState(null);
  const [jDlg,     setJDlg]      = useState(false);
  const [jPage,    setJPage]     = useState(1);

  // ── LOAD ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    if (_vrittiCache !== null) return; // cache warm
    setLoading(true);
    try {
      const [projR, logR, clientR, skillR, jR] = await Promise.all([
        supabase.from("vritti_projects").select("*").eq("user_id", user.id).order("order_index").order("created_at", { ascending: false }),
        supabase.from("vritti_daily_log").select("*,vritti_projects(title)").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("vritti_clients").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vritti_skills").select("*").eq("user_id", user.id).order("category").order("name"),
        supabase.from("vritti_journal").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      ]);
      const data = {
        projects: projR.data || [],
        logs:     logR.data  || [],
        clients:  clientR.data || [],
        skills:   skillR.data  || [],
        journals: jR.data      || [],
      };
      _vrittiCache = data;
      setProjects(data.projects);
      setLogs(data.logs);
      setClients(data.clients);
      setSkills(data.skills);
      setJournals(data.journals);
    } catch (e) {
      err("Load failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const bust = () => { _vrittiCache = null; load(); };

  // ── PROJECT CRUD ──────────────────────────────────────────────────────────
  const saveProject = async () => {
    if (!projForm.title.trim()) return;
    haptic(10);
    const payload = {
      user_id:     user.id,
      title:       projForm.title.trim(),
      description: projForm.description || null,
      client_id:   projForm.client_id   || null,   // empty string → null (UUID FK)
      status:      projForm.status      || "active",
      tech_stack:  projForm.tech_stack  || null,
      start_date:  projForm.start_date  || null,
      target_date: projForm.target_date || null,   // empty string → null (date)
      priority:    projForm.priority != null ? Number(projForm.priority) : 2,
      notes:       projForm.notes       || null,
      siddhi_id:   projForm.siddhi_id   || null,
    };
    if (editProj) {
      const { error } = await supabase.from("vritti_projects").update(payload).eq("id", editProj);
      if (error) { err("Save failed"); return; }
      ok("Project updated");
    } else {
      const { error } = await supabase.from("vritti_projects").insert(payload);
      if (error) { err("Save failed"); return; }
      ok("Project added");
    }
    setProjDlg(false); setProjForm(emptyProj); setEditProj(null); bust();
  };

  const deleteProject = async (id, title) => {
    confirmDel(`Delete "${title}"?`, async () => {
      await supabase.from("vritti_projects").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── LOG CRUD ──────────────────────────────────────────────────────────────
  const saveLog = async () => {
    if (!logForm.notes?.trim() && !logForm.hours) return;
    haptic(10);
    const logPayload = {
      user_id:    user.id,
      date:       logForm.date,
      project_id: logForm.project_id || null,   // empty string → null (UUID FK)
      hours:      logForm.hours !== "" ? Number(logForm.hours) : null,
      notes:      logForm.notes || null,
    };
    const { error } = await supabase.from("vritti_daily_log").insert(logPayload);
    if (error) { err("Save failed"); return; }
    ok("Log added"); setLogDlg(false); setLogForm(emptyLog); bust();
  };

  const deleteLog = async (id) => {
    confirmDel("Delete this log entry?", async () => {
      await supabase.from("vritti_daily_log").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── CLIENT CRUD ───────────────────────────────────────────────────────────
  const saveClient = async () => {
    if (!clientForm.name.trim()) return;
    haptic(10);
    const payload = {
      user_id:    user.id,
      name:       clientForm.name.trim(),
      company:    clientForm.company  || null,
      type:       clientForm.type     || "client",
      role:       clientForm.role     || null,
      start_date: clientForm.start_date || null,   // empty string → null (date)
      notes:      clientForm.notes    || null,
      is_active:  clientForm.is_active ?? true,
    };
    if (editClient) {
      const { error } = await supabase.from("vritti_clients").update(payload).eq("id", editClient);
      if (error) { err("Save failed"); return; }
      ok("Client updated");
    } else {
      const { error } = await supabase.from("vritti_clients").insert(payload);
      if (error) { err("Save failed"); return; }
      ok("Client added");
    }
    setClientDlg(false); setClientForm(emptyClient); setEditClient(null); bust();
  };

  const deleteClient = async (id, name) => {
    confirmDel(`Delete "${name}"?`, async () => {
      await supabase.from("vritti_clients").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── SKILL CRUD ────────────────────────────────────────────────────────────
  const saveSkill = async () => {
    if (!skillForm.name.trim()) return;
    haptic(10);
    const payload = {
      user_id:     user.id,
      category:    skillForm.category    || "Technical",
      name:        skillForm.name.trim(),
      proficiency: skillForm.proficiency != null ? Number(skillForm.proficiency) : 3,
      notes:       skillForm.notes       || null,
    };
    if (editSkill) {
      const { error } = await supabase.from("vritti_skills").update(payload).eq("id", editSkill);
      if (error) { err("Save failed"); return; }
      ok("Skill updated");
    } else {
      const { error } = await supabase.from("vritti_skills").upsert(payload, { onConflict: "user_id,category,name" });
      if (error) { err("Save failed"); return; }
      ok("Skill added");
    }
    setSkillDlg(false); setSkillForm(emptySkill); setEditSkill(null); bust();
  };

  const deleteSkill = async (id, name) => {
    confirmDel(`Delete "${name}"?`, async () => {
      await supabase.from("vritti_skills").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── JOURNAL CRUD ──────────────────────────────────────────────────────────
  const saveJournal = async () => {
    if (!jForm.content?.trim()) return;
    haptic(10);
    const payload = {
      user_id:    user.id,
      date:       jForm.date,
      content:    jForm.content    || null,
      mood:       jForm.mood       || null,
      wins:       jForm.wins       || null,
      challenges: jForm.challenges || null,
    };
    if (editJ) {
      const { error } = await supabase.from("vritti_journal").update(payload).eq("id", editJ);
      if (error) { err("Save failed"); return; }
      ok("Journal updated");
    } else {
      const { error } = await supabase.from("vritti_journal").upsert(payload, { onConflict: "user_id,date" });
      if (error) { err("Save failed"); return; }
      ok("Journal saved");
    }
    setJDlg(false); setJForm(emptyJ); setEditJ(null); bust();
  };

  const deleteJournal = async (id) => {
    confirmDel("Delete this journal entry?", async () => {
      await supabase.from("vritti_journal").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── STATS ─────────────────────────────────────────────────────────────────
  const activeProjects   = projects.filter((p) => p.status === "active").length;
  const completedProjects= projects.filter((p) => p.status === "completed").length;
  const activeClients    = clients.filter((c) => c.is_active).length;
  const totalHoursMonth  = logs
    .filter((l) => dayjs(l.date).isAfter(dayjs().subtract(30, "day")))
    .reduce((s, l) => s + (Number(l.hours) || 0), 0);

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading && !embedded)
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: blue }} />
          <Typography sx={{ color: textS, fontSize: 13 }}>Loading Vṛtti…</Typography>
        </Stack>
      </Box>
    );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Box sx={embedded ? { color: textP } : { p: { xs: 2, md: 3 }, minHeight: "100vh", color: textP }}>
      {/* ── PAGE HEADER (standalone only) ── */}
      {!embedded && (
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: `${blue}20`, border: `2px solid ${blue}60`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: `0 0 18px ${blue}30` }}>
            🚀
          </Box>
          <Box>
            <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontSize: { xs: 24, md: 30 }, fontWeight: 500, color: textP, lineHeight: 1.1 }}>
              Vṛtti Tracker
            </Typography>
            <Typography sx={{ fontSize: 11, color: blue, fontWeight: 600, letterSpacing: 0.8 }}>
              वृत्ति — Your Professional Practice
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── TABS ── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 3, borderBottom: `1px solid ${bdr}`,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 500, fontSize: 13, color: textS, minWidth: "unset", px: 2 },
          "& .Mui-selected": { color: `${blue} !important`, fontWeight: 700 },
          "& .MuiTabs-indicator": { bgcolor: blue },
        }}>
        {[["🚀","Projects"],["📋","Daily Log"],["🤝","Clients"],["🎯","Skills"],["📓","Journal"]].map(([e,l],i) => (
          <Tab key={i} label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}><span>{e}</span><span>{l}</span></Box>} />
        ))}
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0 — PROJECTS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Stats */}
          <Grid item xs={6} sm={3}><StatCard value={activeProjects} label="Active" sub="Projects" color={blue} isDark={isDark} /></Grid>
          <Grid item xs={6} sm={3}><StatCard value={completedProjects} label="Completed" sub="All time" color="#2D7A4F" isDark={isDark} /></Grid>
          <Grid item xs={6} sm={3}><StatCard value={activeClients} label="Active" sub="Clients / Orgs" color={VRITTI_TEAL} isDark={isDark} /></Grid>
          <Grid item xs={6} sm={3}><StatCard value={`${totalHoursMonth.toFixed(0)}h`} label="Hours logged" sub="Last 30 days" color="#C07830" isDark={isDark} /></Grid>

          {/* Projects list */}
          <Grid item xs={12}>
            <SectionHead title="Projects" onAdd={() => { setProjForm(emptyProj); setEditProj(null); setProjDlg(true); }} color={blue} isDark={isDark} addLabel="New Project" />

            {/* Filter chips */}
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 0.5 }}>
              {["all", ...PROJ_STATUS.map((s) => s.value)].map((f) => (
                <Chip key={f} label={f === "all" ? "All" : PROJ_STATUS.find((s) => s.value === f)?.label || f}
                  size="small" onClick={() => { haptic(6); setProjFilter(f); setProjPage(1); }}
                  sx={{ cursor: "pointer", fontWeight: 600, fontSize: 11,
                    bgcolor: projFilter === f ? `${blue}22` : "transparent",
                    color: projFilter === f ? blue : textS,
                    border: `1px solid ${projFilter === f ? blue : bdr}` }} />
              ))}
            </Stack>

            {(() => {
              const filtered = projects.filter((p) => projFilter === "all" || p.status === projFilter);
              const paged    = filtered.slice((projPage - 1) * PER_PAGE, projPage * PER_PAGE);
              if (filtered.length === 0)
                return <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>No projects yet. Add your first project →</Typography>;
              return (
                <>
                  <Stack spacing={1.5}>
                    {paged.map((p) => {
                      const pri = PRIORITIES.find((x) => x.value === p.priority) || PRIORITIES[1];
                      const client = clients.find((c) => c.id === p.client_id);
                      return (
                        <Card key={p.id} sx={{ borderRadius: 3, bgcolor: cardBg, border: `1px solid ${bdr}`, boxShadow: "none",
                          "&:hover": { borderColor: blue, boxShadow: `0 0 0 1px ${blue}30` }, transition: "all 0.15s" }}>
                          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: textP }}>{p.title}</Typography>
                                  <ProjStatusChip status={p.status} />
                                  <Chip label={pri.emoji} size="small"
                                    sx={{ height: 18, fontSize: 10, bgcolor: `${pri.color}18`, color: pri.color, border: `1px solid ${pri.color}40` }} />
                                </Box>
                                {p.description && (
                                  <Typography sx={{ fontSize: 12, color: textS, mt: 0.3, lineHeight: 1.5 }}>{p.description}</Typography>
                                )}
                                <Stack direction="row" spacing={1.5} sx={{ mt: 0.8, flexWrap: "wrap", gap: 0.5 }}>
                                  {client && <Typography sx={{ fontSize: 11, color: VRITTI_TEAL }}>🤝 {client.name}{client.company ? ` · ${client.company}` : ""}</Typography>}
                                  {p.tech_stack && <Typography sx={{ fontSize: 11, color: textS }}>🔧 {p.tech_stack}</Typography>}
                                  {p.target_date && <Typography sx={{ fontSize: 11, color: "#DDA74F" }}>📅 {dayjs(p.target_date).format("D MMM YY")}</Typography>}
                                  {p.siddhi_id && (() => { const s = allSiddhis.find((x) => x.id === p.siddhi_id); return s ? <Chip label={`🎯 ${s.title}`} size="small" sx={{ height: 18, fontSize: 10, bgcolor: `${blue}14`, color: blue, border: `1px solid ${blue}35`, fontWeight: 600 }} /> : null; })()}
                                </Stack>
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton size="small" onClick={() => { haptic(); setProjForm({ ...p, client_id: p.client_id || "", siddhi_id: p.siddhi_id || "" }); setEditProj(p.id); setProjDlg(true); }}
                                  sx={{ color: textS, "&:hover": { color: blue } }}><Edit sx={{ fontSize: 15 }} /></IconButton>
                                <IconButton size="small" onClick={() => deleteProject(p.id, p.title)}
                                  sx={{ color: textS, "&:hover": { color: "#CF4E4E" } }}><Delete sx={{ fontSize: 15 }} /></IconButton>
                              </Stack>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                  {filtered.length > PER_PAGE && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                      <Pagination count={Math.ceil(filtered.length / PER_PAGE)} page={projPage} onChange={(_, v) => setProjPage(v)}
                        size="small" sx={{ "& .MuiPaginationItem-root": { color: textS }, "& .Mui-selected": { bgcolor: `${blue}22 !important`, color: blue } }} />
                    </Box>
                  )}
                </>
              );
            })()}
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — DAILY LOG
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionHead title="Daily Work Log" onAdd={() => { setLogForm(emptyLog); setLogDlg(true); }} color={blue} isDark={isDark} addLabel="Log Today" />

            {logs.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>No work logs yet. Start tracking your daily progress →</Typography>
            ) : (
              <>
                <Stack spacing={1}>
                  {logs.slice((logPage - 1) * PER_PAGE, logPage * PER_PAGE).map((l) => (
                    <Card key={l.id} sx={{ borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${bdr}`, boxShadow: "none" }}>
                      <CardContent sx={{ py: 1.25, px: 2, "&:last-child": { pb: 1.25 } }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: blue }}>
                                {dayjs(l.date).format("ddd, D MMM")}
                              </Typography>
                              {l.vritti_projects && (
                                <Chip label={l.vritti_projects.title} size="small"
                                  sx={{ height: 18, fontSize: 10, bgcolor: `${blue}15`, color: blue, border: `1px solid ${blue}30` }} />
                              )}
                              {l.hours && (
                                <Typography sx={{ fontSize: 11, color: "#2D7A4F" }}>⏱ {l.hours}h</Typography>
                              )}
                            </Box>
                            {l.notes && <Typography sx={{ fontSize: 12.5, color: textP, mt: 0.4, lineHeight: 1.5 }}>{l.notes}</Typography>}
                          </Box>
                          <IconButton size="small" onClick={() => deleteLog(l.id)}
                            sx={{ color: textS, "&:hover": { color: "#CF4E4E" } }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
                {logs.length > PER_PAGE && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Pagination count={Math.ceil(logs.length / PER_PAGE)} page={logPage} onChange={(_, v) => setLogPage(v)}
                      size="small" sx={{ "& .MuiPaginationItem-root": { color: textS }, "& .Mui-selected": { bgcolor: `${blue}22 !important`, color: blue } }} />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — CLIENTS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionHead title="Clients & Organisations" onAdd={() => { setClientForm(emptyClient); setEditClient(null); setClientDlg(true); }} color={VRITTI_TEAL} isDark={isDark} addLabel="Add Client" />

            {clients.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>No clients yet. Add your employer or clients →</Typography>
            ) : (
              <Grid container spacing={2}>
                {clients.map((c) => (
                  <Grid item xs={12} sm={6} key={c.id}>
                    <Card sx={{ borderRadius: 3, bgcolor: cardBg, border: `1px solid ${bdr}`, boxShadow: "none",
                      opacity: c.is_active ? 1 : 0.6, "&:hover": { borderColor: VRITTI_TEAL }, transition: "border-color 0.15s" }}>
                      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: 14, color: textP }}>{c.name}</Typography>
                              <Chip label={c.type} size="small"
                                sx={{ height: 18, fontSize: 10, bgcolor: `${VRITTI_TEAL}18`, color: VRITTI_TEAL, border: `1px solid ${VRITTI_TEAL}40` }} />
                              {!c.is_active && <Chip label="Inactive" size="small" sx={{ height: 18, fontSize: 10, bgcolor: "#88888820", color: "#888" }} />}
                            </Box>
                            {c.company && <Typography sx={{ fontSize: 12, color: textS, mt: 0.3 }}>🏢 {c.company}</Typography>}
                            {c.role && <Typography sx={{ fontSize: 12, color: textS, mt: 0.2 }}>👤 {c.role}</Typography>}
                            {c.start_date && <Typography sx={{ fontSize: 11, color: textS, mt: 0.3 }}>Since {dayjs(c.start_date).format("MMM YYYY")}</Typography>}
                            {c.notes && <Typography sx={{ fontSize: 11, color: textS, mt: 0.4, fontStyle: "italic" }}>{c.notes}</Typography>}
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" onClick={() => { haptic(); setClientForm(c); setEditClient(c.id); setClientDlg(true); }}
                              sx={{ color: textS, "&:hover": { color: VRITTI_TEAL } }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                            <IconButton size="small" onClick={() => deleteClient(c.id, c.name)}
                              sx={{ color: textS, "&:hover": { color: "#CF4E4E" } }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — SKILLS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionHead title="Professional Skills" onAdd={() => { setSkillForm(emptySkill); setEditSkill(null); setSkillDlg(true); }} color={blue} isDark={isDark} addLabel="Add Skill" />

            {skills.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>No skills tracked yet →</Typography>
            ) : (
              <>
                {SKILL_CATS.map((cat) => {
                  const catSkills = skills.filter((s) => s.category === cat.key);
                  if (catSkills.length === 0) return null;
                  return (
                    <Box key={cat.key} sx={{ mb: 3 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: cat.color, mb: 1.5, letterSpacing: 0.5,
                        textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.8 }}>
                        <span>{cat.icon}</span> {cat.key}
                      </Typography>
                      <Stack spacing={1}>
                        {catSkills.slice((skillPage - 1) * 20, skillPage * 20).map((s) => (
                          <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, px: 1.5, borderRadius: 2,
                            bgcolor: cardBg, border: `1px solid ${bdr}`,
                            "&:hover": { borderColor: cat.color, boxShadow: `0 0 0 1px ${cat.color}25` }, transition: "all 0.12s" }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP }}>{s.name}</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}>
                                <Stars value={s.proficiency} size={13} />
                                <Typography sx={{ fontSize: 10, color: textS }}>{PROF_LABELS[s.proficiency]}</Typography>
                              </Box>
                              {s.notes && <Typography sx={{ fontSize: 11, color: textS, mt: 0.2, fontStyle: "italic" }}>{s.notes}</Typography>}
                            </Box>
                            <Stack direction="row" spacing={0.3}>
                              <IconButton size="small" onClick={() => { haptic(); setSkillForm(s); setEditSkill(s.id); setSkillDlg(true); }}
                                sx={{ color: textS, "&:hover": { color: cat.color } }}><Edit sx={{ fontSize: 13 }} /></IconButton>
                              <IconButton size="small" onClick={() => deleteSkill(s.id, s.name)}
                                sx={{ color: textS, "&:hover": { color: "#CF4E4E" } }}><Delete sx={{ fontSize: 13 }} /></IconButton>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
                {skills.length > 20 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                    <Pagination count={Math.ceil(skills.length / 20)} page={skillPage} onChange={(_, v) => setSkillPage(v)}
                      size="small" sx={{ "& .Mui-selected": { bgcolor: `${blue}22 !important`, color: blue } }} />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4 — JOURNAL
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionHead title="Career Journal" onAdd={() => { setJForm({ ...emptyJ, date: today }); setEditJ(null); setJDlg(true); }} color={blue} isDark={isDark} addLabel="New Entry" />

            {journals.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>No journal entries yet. Start reflecting on your work →</Typography>
            ) : (
              <>
                <Stack spacing={2}>
                  {journals.slice((jPage - 1) * PER_PAGE, jPage * PER_PAGE).map((j) => (
                    <Card key={j.id} sx={{ borderRadius: 3, bgcolor: cardBg, border: `1px solid ${bdr}`, boxShadow: "none" }}>
                      <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 1 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: blue }}>
                                {dayjs(j.date).format("ddd, D MMM YYYY")}
                              </Typography>
                              <Chip label={j.mood} size="small"
                                sx={{ height: 20, fontSize: 10, bgcolor: `${blue}15`, color: blue, border: `1px solid ${blue}30` }} />
                            </Box>
                            {j.content && <Typography sx={{ fontSize: 13, color: textP, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{j.content}</Typography>}
                            {j.wins && (
                              <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: `#2D7A4F18`, border: `1px solid #2D7A4F30` }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#2D7A4F", mb: 0.5 }}>✅ Wins</Typography>
                                <Typography sx={{ fontSize: 12, color: textP }}>{j.wins}</Typography>
                              </Box>
                            )}
                            {j.challenges && (
                              <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: `#CF4E4E12`, border: `1px solid #CF4E4E25` }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#CF4E4E", mb: 0.5 }}>🔍 Challenges</Typography>
                                <Typography sx={{ fontSize: 12, color: textP }}>{j.challenges}</Typography>
                              </Box>
                            )}
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" onClick={() => { haptic(); setJForm(j); setEditJ(j.id); setJDlg(true); }}
                              sx={{ color: textS, "&:hover": { color: blue } }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                            <IconButton size="small" onClick={() => deleteJournal(j.id)}
                              sx={{ color: textS, "&:hover": { color: "#CF4E4E" } }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
                {journals.length > PER_PAGE && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Pagination count={Math.ceil(journals.length / PER_PAGE)} page={jPage} onChange={(_, v) => setJPage(v)}
                      size="small" sx={{ "& .Mui-selected": { bgcolor: `${blue}22 !important`, color: blue } }} />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      )}

      {/* ═══════════════════════════════ DIALOGS ════════════════════════════ */}

      {/* Project Dialog */}
      <Dialog open={projDlg} onClose={() => setProjDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#0E1420" : "#FAFCFF", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>
          {editProj ? "Edit Project" : "New Project"} 🚀
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Project title *" fullWidth size="small" value={projForm.title} onChange={(e) => setProjForm((f) => ({ ...f, title: e.target.value }))} />
            <TextField label="Description" fullWidth size="small" multiline minRows={2} value={projForm.description} onChange={(e) => setProjForm((f) => ({ ...f, description: e.target.value }))} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select value={projForm.status} label="Status" onChange={(e) => setProjForm((f) => ({ ...f, status: e.target.value }))}>
                  {PROJ_STATUS.map((s) => <MenuItem key={s.value} value={s.value}>{s.emoji} {s.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Priority</InputLabel>
                <Select value={projForm.priority} label="Priority" onChange={(e) => setProjForm((f) => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map((p) => <MenuItem key={p.value} value={p.value}>{p.emoji} {p.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Client / Organisation</InputLabel>
              <Select value={projForm.client_id} label="Client / Organisation" onChange={(e) => setProjForm((f) => ({ ...f, client_id: e.target.value }))}>
                <MenuItem value="">None</MenuItem>
                {clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Tech stack / Tools" fullWidth size="small" placeholder="React, Node, AWS…" value={projForm.tech_stack} onChange={(e) => setProjForm((f) => ({ ...f, tech_stack: e.target.value }))} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Start date" type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} value={projForm.start_date} onChange={(e) => setProjForm((f) => ({ ...f, start_date: e.target.value }))} />
              <TextField label="Target date" type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} value={projForm.target_date} onChange={(e) => setProjForm((f) => ({ ...f, target_date: e.target.value }))} />
            </Box>
            <TextField label="Notes" fullWidth size="small" multiline minRows={2} value={projForm.notes} onChange={(e) => setProjForm((f) => ({ ...f, notes: e.target.value }))} />
            <SiddhiPicker value={projForm.siddhi_id} onChange={(v) => setProjForm((f) => ({ ...f, siddhi_id: v }))} isDark={isDark} label="Link to Milestone (Siddhi)" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setProjDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveProject} sx={{ bgcolor: blue, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: blue, opacity: 0.88 } }}>
            {editProj ? "Update" : "Add Project"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log Dialog */}
      <Dialog open={logDlg} onClose={() => setLogDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#0E1420" : "#FAFCFF", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>Log Work 📋</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Date" type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} value={logForm.date} onChange={(e) => setLogForm((f) => ({ ...f, date: e.target.value }))} />
              <TextField label="Hours" type="number" size="small" sx={{ flex: 1 }} inputProps={{ min: 0, max: 24, step: 0.5 }} value={logForm.hours} onChange={(e) => setLogForm((f) => ({ ...f, hours: e.target.value }))} />
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Project (optional)</InputLabel>
              <Select value={logForm.project_id} label="Project (optional)" onChange={(e) => setLogForm((f) => ({ ...f, project_id: e.target.value }))}>
                <MenuItem value="">None</MenuItem>
                {projects.filter((p) => p.status === "active").map((p) => <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="What did you work on? *" fullWidth size="small" multiline minRows={3} value={logForm.notes} onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setLogDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveLog} sx={{ bgcolor: blue, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: blue, opacity: 0.88 } }}>Log It ✓</Button>
        </DialogActions>
      </Dialog>

      {/* Client Dialog */}
      <Dialog open={clientDlg} onClose={() => setClientDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#0E1420" : "#FAFCFF", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>
          {editClient ? "Edit Client" : "Add Client / Organisation"} 🤝
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name *" fullWidth size="small" value={clientForm.name} onChange={(e) => setClientForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label="Company" fullWidth size="small" value={clientForm.company} onChange={(e) => setClientForm((f) => ({ ...f, company: e.target.value }))} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select value={clientForm.type} label="Type" onChange={(e) => setClientForm((f) => ({ ...f, type: e.target.value }))}>
                  {CLIENT_TYPES.map((t) => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Your role" size="small" sx={{ flex: 1 }} value={clientForm.role} onChange={(e) => setClientForm((f) => ({ ...f, role: e.target.value }))} />
            </Box>
            <TextField label="Engagement start" type="date" size="small" InputLabelProps={{ shrink: true }} value={clientForm.start_date} onChange={(e) => setClientForm((f) => ({ ...f, start_date: e.target.value }))} />
            <TextField label="Notes" fullWidth size="small" multiline minRows={2} value={clientForm.notes} onChange={(e) => setClientForm((f) => ({ ...f, notes: e.target.value }))} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ToggleButtonGroup size="small" exclusive value={String(clientForm.is_active)}
                onChange={(_, v) => { if (v !== null) setClientForm((f) => ({ ...f, is_active: v === "true" })); }}>
                <ToggleButton value="true" sx={{ textTransform: "none", fontSize: 12 }}>Active</ToggleButton>
                <ToggleButton value="false" sx={{ textTransform: "none", fontSize: 12 }}>Inactive</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setClientDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveClient} sx={{ bgcolor: VRITTI_TEAL, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: VRITTI_TEAL, opacity: 0.88 } }}>
            {editClient ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={skillDlg} onClose={() => setSkillDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#0E1420" : "#FAFCFF", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>
          {editSkill ? "Edit Skill" : "Add Skill"} 🎯
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={skillForm.category} label="Category" onChange={(e) => setSkillForm((f) => ({ ...f, category: e.target.value }))}>
                {SKILL_CATS.map((c) => <MenuItem key={c.key} value={c.key}>{c.icon} {c.key}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Skill name *" fullWidth size="small" value={skillForm.name} onChange={(e) => setSkillForm((f) => ({ ...f, name: e.target.value }))} />
            <Box>
              <Typography sx={{ fontSize: 12, color: textS, mb: 1 }}>Proficiency: {PROF_LABELS[skillForm.proficiency]}</Typography>
              <Stars value={skillForm.proficiency} onChange={(v) => setSkillForm((f) => ({ ...f, proficiency: v }))} size={22} />
            </Box>
            <TextField label="Notes" fullWidth size="small" multiline minRows={2} value={skillForm.notes} onChange={(e) => setSkillForm((f) => ({ ...f, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSkillDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveSkill} sx={{ bgcolor: blue, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: blue, opacity: 0.88 } }}>
            {editSkill ? "Update" : "Add Skill"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Journal Dialog */}
      <Dialog open={jDlg} onClose={() => setJDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#0E1420" : "#FAFCFF", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>
          {editJ ? "Edit Entry" : "New Journal Entry"} 📓
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Date" type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} value={jForm.date} onChange={(e) => setJForm((f) => ({ ...f, date: e.target.value }))} />
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Mood</InputLabel>
                <Select value={jForm.mood} label="Mood" onChange={(e) => setJForm((f) => ({ ...f, mood: e.target.value }))}>
                  {MOODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <TextField label="Reflection *" fullWidth size="small" multiline minRows={4} placeholder="How was today's work? What are you thinking about?" value={jForm.content} onChange={(e) => setJForm((f) => ({ ...f, content: e.target.value }))} />
            <TextField label="Wins 🏆" fullWidth size="small" multiline minRows={2} placeholder="What went well?" value={jForm.wins} onChange={(e) => setJForm((f) => ({ ...f, wins: e.target.value }))} />
            <TextField label="Challenges 🔍" fullWidth size="small" multiline minRows={2} placeholder="What needs improvement?" value={jForm.challenges} onChange={(e) => setJForm((f) => ({ ...f, challenges: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setJDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveJournal} sx={{ bgcolor: blue, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: blue, opacity: 0.88 } }}>
            {editJ ? "Update" : "Save Entry"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={delDlg.open} onClose={() => setDelDlg({ open: false, title: "", fn: null })}
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#0E1420" : "#fff", maxWidth: 360 } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>{delDlg.title}</Typography>
          <Typography sx={{ fontSize: 12, color: textS, mt: 0.5 }}>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setDelDlg({ open: false, title: "", fn: null })} sx={{ textTransform: "none", color: textS }}>Cancel</Button>
          <Button variant="contained" onClick={() => { delDlg.fn?.(); setDelDlg({ open: false, title: "", fn: null }); }}
            sx={{ bgcolor: "#CF4E4E", textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "#B03A3A" } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
