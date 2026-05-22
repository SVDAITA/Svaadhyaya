import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Tabs, Tab, Stack, Pagination, LinearProgress, Divider,
} from "@mui/material";
import {
  Add, Delete, Edit, CheckCircle, RadioButtonUnchecked,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { useLakshyaSiddhis } from "../../hooks/useLakshyaSiddhis";
import SiddhiPicker from "../../components/shared/SiddhiPicker";
import dayjs from "dayjs";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const VIDYA_SIENNA = "#A0522D";
const VIDYA_AMBER  = "#C07830";
const VIDYA_TEAL   = "#1A7A6E";
const VIDYA_BLUE   = "#1A5FB0";

const BOOK_STATUS = [
  { value: "reading",    label: "Reading",   color: VIDYA_SIENNA, emoji: "📖" },
  { value: "completed",  label: "Completed", color: "#2D7A4F",    emoji: "✅" },
  { value: "wishlist",   label: "Wishlist",  color: "#7C4DAB",    emoji: "📌" },
  { value: "abandoned",  label: "Abandoned", color: "#888",       emoji: "🚫" },
];
const COURSE_STATUS = [
  { value: "in_progress", label: "In Progress", color: VIDYA_SIENNA, emoji: "🎓" },
  { value: "completed",   label: "Completed",   color: "#2D7A4F",    emoji: "✅" },
  { value: "wishlist",    label: "Wishlist",    color: "#7C4DAB",    emoji: "📌" },
  { value: "dropped",     label: "Dropped",     color: "#888",       emoji: "🚫" },
];
const SOURCE_TYPES    = ["book","course","article","podcast","video","experience","other"];
const LOG_SOURCE_TYPES = [
  { value: "book",     label: "Book",     emoji: "📖" },
  { value: "course",   label: "Course",   emoji: "🎓" },
  { value: "practice", label: "Practice", emoji: "🕉️" },
  { value: "other",    label: "Other",    emoji: "📝" },
];
const LANG_OPTIONS = ["Telugu","English","Sanskrit","Hindi","Tamil","Other"];
const SKILL_CATS   = ["Technical","Domain","Language","Philosophy","History","Science","Arts","Other"];
const PROF_LABELS  = ["","Beginner","Basic","Intermediate","Advanced","Expert"];
const FREQ_OPTS    = [{ value:"daily",label:"Daily" },{ value:"weekly",label:"Weekly" },{ value:"monthly",label:"Monthly" }];
const DOW          = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PER_PAGE     = 10;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const haptic = (ms = 8) => { try { if (navigator?.vibrate) navigator.vibrate(ms); } catch (_) {} };
const isVisibleToday = (item) => {
  const t = dayjs();
  if (item.frequency === "daily")   return true;
  if (item.frequency === "weekly")  return t.day()  === (item.frequency_day ?? 0);
  if (item.frequency === "monthly") return t.date() === (item.frequency_day ?? 1);
  return true;
};

// ── CACHE ─────────────────────────────────────────────────────────────────────
let _vidyaCache = null;

// ── STARS ─────────────────────────────────────────────────────────────────────
function Stars({ value, onChange, size = 16 }) {
  return (
    <Stack direction="row" spacing={0.2}>
      {[1,2,3,4,5].map((n) => (
        <Box key={n} onClick={() => onChange?.(n)}
          sx={{ cursor: onChange ? "pointer" : "default", color: n <= value ? VIDYA_AMBER : "#888", fontSize: size, lineHeight: 1 }}>
          {n <= value ? "★" : "☆"}
        </Box>
      ))}
    </Stack>
  );
}

// ── STATUS CHIP ───────────────────────────────────────────────────────────────
function StatusChip({ status, opts }) {
  const s = opts.find((x) => x.value === status) || opts[0];
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
  const bg  = isDark ? `${color}18` : `${color}10`;
  const bdr = isDark ? `${color}35` : `${color}28`;
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
export default function VidyaTracker({ embedded = false }) {
  const { user }    = useAuth();
  const { mode }    = useThemeMode();
  const isDark      = mode === "dark";
  const today       = dayjs().format("YYYY-MM-DD");
  const weekAgo     = dayjs().subtract(7,  "day").format("YYYY-MM-DD");
  const monthAgo    = dayjs().subtract(30, "day").format("YYYY-MM-DD");

  const { siddhis: allSiddhis } = useLakshyaSiddhis();

  const gold   = VIDYA_AMBER;
  const textP  = isDark ? "#F0EDE8" : "#1A0800";
  const textS  = isDark ? "#9C8A74" : "#7A5A3A";
  const cardBg = isDark ? "#1A1610" : "#FDFAF5";
  const bdr    = isDark ? `rgba(160,82,45,0.22)` : `rgba(160,82,45,0.20)`;

  // ── STATE ─────────────────────────────────────────────────────────────────
  const [tab,     setTab]     = useState(0);
  const [loading, setLoading] = useState(_vidyaCache === null);
  const [snack,   setSnack]   = useState({ open: false, msg: "", sev: "success" });
  const [delDlg,  setDelDlg]  = useState({ open: false, title: "", fn: null });

  const ok  = (msg) => setSnack({ open: true, msg, sev: "success" });
  const err = (msg) => setSnack({ open: true, msg, sev: "error" });
  const confirmDel = (title, fn) => { haptic(15); setDelDlg({ open: true, title, fn }); };

  // ── BOOKS STATE ───────────────────────────────────────────────────────────
  const emptyBook = { title: "", author: "", genre: "", language: "English", status: "reading", total_pages: "", pages_read: "", notes: "", one_line: "", started_date: today, finished_date: "", siddhi_id: "" };
  const [books,      setBooks]      = useState(_vidyaCache?.books || []);
  const [bookForm,   setBookForm]   = useState(emptyBook);
  const [editBook,   setEditBook]   = useState(null);
  const [bookDlg,    setBookDlg]    = useState(false);
  const [bookFilter, setBookFilter] = useState("reading");
  const [bookPage,   setBookPage]   = useState(1);

  // ── COURSES STATE ─────────────────────────────────────────────────────────
  const emptyCourse = { title: "", platform: "", instructor: "", url: "", status: "in_progress", progress_pct: 0, rating: 3, start_date: today, completed_date: "", notes: "", siddhi_id: "" };
  const [courses,       setCourses]       = useState(_vidyaCache?.courses || []);
  const [courseForm,    setCourseForm]    = useState(emptyCourse);
  const [editCourse,    setEditCourse]    = useState(null);
  const [courseDlg,     setCourseDlg]     = useState(false);
  const [courseFilter,  setCourseFilter]  = useState("all");
  const [coursePage,    setCoursePage]    = useState(1);

  // ── STUDY LOG STATE ───────────────────────────────────────────────────────
  const emptyStudyLog = { date: today, hours: "", source_type: "book", source_id: "", source_title: "", notes: "" };
  const [studyLogs,    setStudyLogs]    = useState(_vidyaCache?.studyLogs || []);
  const [studyLogForm, setStudyLogForm] = useState(emptyStudyLog);
  const [editStudyLog, setEditStudyLog] = useState(null);
  const [studyLogDlg,  setStudyLogDlg]  = useState(false);
  const [studyLogPage, setStudyLogPage] = useState(1);

  // ── INSIGHTS STATE ────────────────────────────────────────────────────────
  const emptyInsight = { date: today, content: "", source: "", source_type: "book" };
  const [insights,    setInsights]    = useState(_vidyaCache?.insights || []);
  const [insightForm, setInsightForm] = useState(emptyInsight);
  const [insightDlg,  setInsightDlg]  = useState(false);
  const [insightPage, setInsightPage] = useState(1);

  // ── PRACTICE STATE ────────────────────────────────────────────────────────
  const emptyPrac = { label: "", emoji: "📚", duration_minutes: "", frequency: "daily", frequency_day: 0, order_index: 0 };
  const [pracItems,   setPracItems]   = useState(_vidyaCache?.pracItems || []);
  const [pracComps,   setPracComps]   = useState(_vidyaCache?.pracComps || {});
  const [pracForm,    setPracForm]    = useState(emptyPrac);
  const [editPrac,    setEditPrac]    = useState(null);
  const [pracDlg,     setPracDlg]     = useState(false);

  // ── SKILLS STATE ──────────────────────────────────────────────────────────
  const emptySkill = { category: "Technical", name: "", proficiency: 3, notes: "" };
  const [skills,     setSkills]     = useState(_vidyaCache?.skills || []);
  const [skillForm,  setSkillForm]  = useState(emptySkill);
  const [editSkill,  setEditSkill]  = useState(null);
  const [skillDlg,   setSkillDlg]   = useState(false);
  const [skillPage,  setSkillPage]  = useState(1);

  // ── LOAD ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    if (_vidyaCache !== null && _vidyaCache._date === today) return; // cache warm for today
    setLoading(true);
    try {
      const [bookR, courseR, insightR, pracR, pracCompR, skillR, studyLogR] = await Promise.all([
        supabase.from("books").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vidya_courses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vidya_insights").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("vidya_practice_items").select("*").eq("user_id", user.id).order("order_index"),
        supabase.from("vidya_practice_completions").select("vidya_item_id,is_completed").eq("user_id", user.id).eq("completion_date", today),
        supabase.from("vidya_skills").select("*").eq("user_id", user.id).order("category").order("name"),
        supabase.from("vidya_study_log").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(300),
      ]);
      const compMap = Object.fromEntries((pracCompR.data || []).map((c) => [c.vidya_item_id, c.is_completed]));
      const data = {
        _date:      today,
        books:      bookR.data      || [],
        courses:    courseR.data    || [],
        insights:   insightR.data   || [],
        pracItems:  pracR.data      || [],
        pracComps:  compMap,
        skills:     skillR.data     || [],
        studyLogs:  studyLogR.data  || [],
      };
      _vidyaCache = data;
      setBooks(data.books);
      setCourses(data.courses);
      setInsights(data.insights);
      setPracItems(data.pracItems);
      setPracComps(data.pracComps);
      setSkills(data.skills);
      setStudyLogs(data.studyLogs);
    } catch (e) {
      err("Load failed");
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => { load(); }, [load]);

  const bust = () => { _vidyaCache = null; load(); };

  // ── PRACTICE TOGGLE ───────────────────────────────────────────────────────
  const togglePrac = async (itemId) => {
    haptic(8);
    const isDone = !pracComps[itemId];
    setPracComps((prev) => ({ ...prev, [itemId]: isDone }));
    await supabase.from("vidya_practice_completions").upsert(
      { user_id: user.id, vidya_item_id: itemId, completion_date: today, is_completed: isDone },
      { onConflict: "user_id,vidya_item_id,completion_date" }
    );
  };

  // ── BOOK CRUD ─────────────────────────────────────────────────────────────
  const saveBook = async () => {
    if (!bookForm.title.trim()) return;
    haptic(10);
    const payload = {
      user_id:      user.id,
      title:        bookForm.title.trim(),
      author:       bookForm.author || null,
      language:     bookForm.language || "English",
      status:       bookForm.status  || "reading",
      total_pages:  bookForm.total_pages !== "" ? Number(bookForm.total_pages) : null,
      pages_read:   bookForm.pages_read  !== "" ? Number(bookForm.pages_read)  : 0,
      genre:        bookForm.genre        || null,
      notes:        bookForm.notes       || null,
      one_line:     bookForm.one_line    || null,
      started_date: bookForm.started_date  || null,
      finished_date:bookForm.finished_date || null,
      siddhi_id:    bookForm.siddhi_id     || null,
    };
    if (editBook) {
      const { error } = await supabase.from("books").update(payload).eq("id", editBook);
      if (error) { err("Save failed"); return; }
      ok("Book updated");
    } else {
      const { error } = await supabase.from("books").insert(payload);
      if (error) { err("Save failed"); return; }
      ok("Book added");
    }
    setBookDlg(false); setBookForm(emptyBook); setEditBook(null); bust();
  };

  const deleteBook = async (id, title) => {
    confirmDel(`Delete "${title}"?`, async () => {
      await supabase.from("books").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  const handleJsonImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const payload = data.map((b) => ({
          user_id:      user.id,
          title:        b.Title || b.title,
          author:       b.Author || b.author || null,
          genre:        b.Genre || b.genre || null,
          total_pages:  Number(b.Pages || b.total_pages) || null,
          pages_read:   Number(b.Read || b.pages_read) || 0,
          language:     b.Language || b.language || "English",
          status:       (b["Read Status"] === "Read" || b.status === "completed") ? "completed" : (b.status || "wishlist"),
          notes:        b["Short Description"] || b.notes || null,
          one_line:     b.Summary || b.one_line || null,
          description:  b.Description || b.description || null,
          price:        b.Price != null ? Number(b.Price) : (b.price != null ? Number(b.price) : null),
          location:     b.Location || b.location || null,
          condition:    b.Condition || b.condition || null,
          date_added:   b.date_added || b["Date Added"] || null,
          started_date:  b.started_date || null,
          finished_date: b.finished_date || b["Date Read"] || null,
        }));
        const { error } = await supabase.from("books").insert(payload);
        if (error) { err(`Import failed: ${error.message}`); return; }
        ok(`${payload.length} books imported`); bust();
      } catch (_) {
        err("Invalid JSON — check file format");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── COURSE CRUD ───────────────────────────────────────────────────────────
  const saveCourse = async () => {
    if (!courseForm.title.trim()) return;
    haptic(10);
    const payload = {
      user_id:        user.id,
      title:          courseForm.title.trim(),
      platform:       courseForm.platform    || null,
      instructor:     courseForm.instructor  || null,
      url:            courseForm.url         || null,
      status:         courseForm.status      || "in_progress",
      progress_pct:   courseForm.progress_pct !== "" ? Number(courseForm.progress_pct) : 0,
      rating:         courseForm.rating      != null ? Number(courseForm.rating) : null,
      start_date:     courseForm.start_date     || null,
      completed_date: courseForm.completed_date || null,
      notes:          courseForm.notes       || null,
      siddhi_id:      courseForm.siddhi_id   || null,
    };
    if (editCourse) {
      const { error } = await supabase.from("vidya_courses").update(payload).eq("id", editCourse);
      if (error) { err("Save failed"); return; }
      ok("Course updated");
    } else {
      const { error } = await supabase.from("vidya_courses").insert(payload);
      if (error) { err("Save failed"); return; }
      ok("Course added");
    }
    setCourseDlg(false); setCourseForm(emptyCourse); setEditCourse(null); bust();
  };

  const deleteCourse = async (id, title) => {
    confirmDel(`Delete "${title}"?`, async () => {
      await supabase.from("vidya_courses").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── STUDY LOG CRUD ────────────────────────────────────────────────────────
  const saveStudyLog = async () => {
    if (!studyLogForm.hours) return;
    haptic(10);
    // Resolve source title from loaded data when type is book/course
    let resolvedTitle = studyLogForm.source_title || null;
    if (studyLogForm.source_type === "book" && studyLogForm.source_id) {
      const book = books.find((b) => b.id === studyLogForm.source_id);
      if (book) resolvedTitle = book.title;
    } else if (studyLogForm.source_type === "course" && studyLogForm.source_id) {
      const course = courses.find((c) => c.id === studyLogForm.source_id);
      if (course) resolvedTitle = course.title;
    }
    const payload = {
      user_id:      user.id,
      date:         studyLogForm.date || today,
      hours:        Number(studyLogForm.hours),
      source_type:  studyLogForm.source_type || "other",
      source_id:    (studyLogForm.source_id && (studyLogForm.source_type === "book" || studyLogForm.source_type === "course"))
                      ? studyLogForm.source_id : null,
      source_title: resolvedTitle,
      notes:        studyLogForm.notes || null,
    };
    if (editStudyLog) {
      const { error } = await supabase.from("vidya_study_log").update(payload).eq("id", editStudyLog);
      if (error) { err("Save failed"); return; }
      ok("Session updated");
    } else {
      const { error } = await supabase.from("vidya_study_log").insert(payload);
      if (error) { err("Save failed"); return; }
      ok("Study session logged");
    }
    setStudyLogDlg(false); setStudyLogForm(emptyStudyLog); setEditStudyLog(null); bust();
  };

  const deleteStudyLog = async (id) => {
    confirmDel("Delete this study session?", async () => {
      await supabase.from("vidya_study_log").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── INSIGHT CRUD ──────────────────────────────────────────────────────────
  const saveInsight = async () => {
    if (!insightForm.content.trim()) return;
    haptic(10);
    const { error } = await supabase.from("vidya_insights").insert({ ...insightForm, user_id: user.id });
    if (error) { err("Save failed"); return; }
    ok("Insight captured"); setInsightDlg(false); setInsightForm(emptyInsight); bust();
  };

  const deleteInsight = async (id) => {
    confirmDel("Delete this insight?", async () => {
      await supabase.from("vidya_insights").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── PRACTICE ITEM CRUD ────────────────────────────────────────────────────
  const savePracItem = async () => {
    if (!pracForm.label.trim()) return;
    haptic(10);
    const payload = {
      user_id:          user.id,
      label:            pracForm.label.trim(),
      emoji:            pracForm.emoji            || "📚",
      duration_minutes: pracForm.duration_minutes !== "" ? Number(pracForm.duration_minutes) : null,
      frequency:        pracForm.frequency        || "daily",
      frequency_day:    pracForm.frequency_day    ?? 0,
      order_index:      pracForm.order_index      ?? 0,
    };
    if (editPrac) {
      const { error } = await supabase.from("vidya_practice_items").update(payload).eq("id", editPrac);
      if (error) { err("Save failed"); return; }
      ok("Updated");
    } else {
      const { error } = await supabase.from("vidya_practice_items").insert(payload);
      if (error) { err("Save failed"); return; }
      ok("Practice item added");
    }
    setPracDlg(false); setPracForm(emptyPrac); setEditPrac(null); bust();
  };

  const deletePracItem = async (id, label) => {
    confirmDel(`Delete "${label}"?`, async () => {
      await supabase.from("vidya_practice_items").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── SKILL CRUD ────────────────────────────────────────────────────────────
  const saveSkill = async () => {
    if (!skillForm.name.trim()) return;
    haptic(10);
    const payload = {
      user_id:    user.id,
      category:   skillForm.category   || "Technical",
      name:       skillForm.name.trim(),
      proficiency:skillForm.proficiency != null ? Number(skillForm.proficiency) : 3,
      notes:      skillForm.notes      || null,
    };
    if (editSkill) {
      const { error } = await supabase.from("vidya_skills").update(payload).eq("id", editSkill);
      if (error) { err("Save failed"); return; }
      ok("Skill updated");
    } else {
      const { error } = await supabase.from("vidya_skills").upsert(payload, { onConflict: "user_id,category,name" });
      if (error) { err("Save failed"); return; }
      ok("Skill added");
    }
    setSkillDlg(false); setSkillForm(emptySkill); setEditSkill(null); bust();
  };

  const deleteSkill = async (id, name) => {
    confirmDel(`Delete "${name}"?`, async () => {
      await supabase.from("vidya_skills").delete().eq("id", id);
      ok("Deleted"); bust();
    });
  };

  // ── STATS ─────────────────────────────────────────────────────────────────
  const readingNow     = books.filter((b) => b.status === "reading").length;
  const completedBooks = books.filter((b) => b.status === "completed").length;
  const activeCourses  = courses.filter((c) => c.status === "in_progress").length;
  const totalInsights  = insights.length;
  const visiblePrac    = pracItems.filter(isVisibleToday);
  const pracDone       = visiblePrac.filter((i) => pracComps[i.id]).length;

  // Study log stats
  const weekHours  = studyLogs.filter((l) => l.date >= weekAgo).reduce((s, l) => s + (Number(l.hours) || 0), 0);
  const monthHours = studyLogs.filter((l) => l.date >= monthAgo).reduce((s, l) => s + (Number(l.hours) || 0), 0);
  const totalSessions = studyLogs.length;

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading && !embedded)
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: gold }} />
          <Typography sx={{ color: textS, fontSize: 13 }}>Loading Vidyā…</Typography>
        </Stack>
      </Box>
    );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Box sx={embedded ? { color: textP } : { p: { xs: 2, md: 3 }, minHeight: "100vh", color: textP }}>
      {/* ── PAGE HEADER (standalone only) ── */}
      {!embedded && (
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: `${gold}20`, border: `2px solid ${gold}60`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: `0 0 18px ${gold}30` }}>
            📚
          </Box>
          <Box>
            <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontSize: { xs: 24, md: 30 }, fontWeight: 500, color: textP, lineHeight: 1.1 }}>
              Vidya Tracker
            </Typography>
            <Typography sx={{ fontSize: 11, color: gold, fontWeight: 600, letterSpacing: 0.8 }}>
              विद्या — Your Learning Practice
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── TABS ── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 3, borderBottom: `1px solid ${bdr}`,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 500, fontSize: 13, color: textS, minWidth: "unset", px: 2 },
          "& .Mui-selected": { color: `${gold} !important`, fontWeight: 700 },
          "& .MuiTabs-indicator": { bgcolor: gold },
        }}>
        {[["📖","Books"],["🎓","Courses"],["📓","Study Log"],["💡","Insights"],["🕉️","Practice"],["🎯","Skills"]].map(([e,l],i) => (
          <Tab key={i} label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}><span>{e}</span><span>{l}</span></Box>} />
        ))}
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0 — BOOKS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Stats */}
          <Grid item xs={6} sm={3}><StatCard value={readingNow} label="Reading Now" sub="Active books" color={gold} isDark={isDark} /></Grid>
          <Grid item xs={6} sm={3}><StatCard value={completedBooks} label="Completed" sub="All time" color="#2D7A4F" isDark={isDark} /></Grid>
          <Grid item xs={6} sm={3}><StatCard value={activeCourses} label="Courses" sub="In progress" color={VIDYA_TEAL} isDark={isDark} /></Grid>
          <Grid item xs={6} sm={3}><StatCard value={totalInsights} label="Insights" sub="Captured" color={VIDYA_SIENNA} isDark={isDark} /></Grid>

          {/* Books list */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontSize: 17, fontWeight: 600, color: isDark ? "#F0EDE8" : "#1A1A1A" }}>Library</Typography>
              <Stack direction="row" spacing={1}>
                <Button component="label" size="small"
                  sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, color: gold, border: `1px solid ${gold}55`, px: 1.5, py: 0.5, borderRadius: 2, "&:hover": { bgcolor: `${gold}10` } }}>
                  📥 Import JSON
                  <input type="file" accept=".json" hidden onChange={handleJsonImport} />
                </Button>
                <Button size="small" startIcon={<Add sx={{ fontSize: 14 }} />}
                  onClick={() => { haptic(); setBookForm(emptyBook); setEditBook(null); setBookDlg(true); }}
                  sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, color: "#fff", bgcolor: gold, px: 1.5, py: 0.5, borderRadius: 2, "&:hover": { bgcolor: gold, opacity: 0.88 } }}>
                  Add Book
                </Button>
              </Stack>
            </Box>

            {/* Filter */}
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 0.5 }}>
              {["all", ...BOOK_STATUS.map((s) => s.value)].map((f) => (
                <Chip key={f} label={f === "all" ? "All" : BOOK_STATUS.find((s) => s.value === f)?.label || f}
                  size="small" onClick={() => { haptic(6); setBookFilter(f); setBookPage(1); }}
                  sx={{ cursor: "pointer", fontWeight: 600, fontSize: 11,
                    bgcolor: bookFilter === f ? `${gold}22` : "transparent",
                    color: bookFilter === f ? gold : textS,
                    border: `1px solid ${bookFilter === f ? gold : bdr}` }} />
              ))}
            </Stack>

            {(() => {
              const filtered = books.filter((b) => bookFilter === "all" || b.status === bookFilter);
              const paged    = filtered.slice((bookPage - 1) * PER_PAGE, bookPage * PER_PAGE);
              if (filtered.length === 0)
                return <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>No books yet. Add your first book →</Typography>;
              return (
                <>
                  <Stack spacing={1.5}>
                    {paged.map((b) => {
                      const prog = b.total_pages > 0 ? Math.min(100, Math.round(((b.pages_read || 0) / b.total_pages) * 100)) : 0;
                      const pct  = prog / 100;
                      const barColor = pct >= 1 ? "#2D7A4F" : pct >= 0.7 ? gold : pct >= 0.4 ? "#DDA74F" : VIDYA_SIENNA;
                      return (
                        <Card key={b.id} sx={{ borderRadius: 3, bgcolor: cardBg, border: `1px solid ${bdr}`, boxShadow: "none",
                          "&:hover": { borderColor: gold }, transition: "border-color 0.15s" }}>
                          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: textP }}>{b.title}</Typography>
                                  <StatusChip status={b.status} opts={BOOK_STATUS} />
                                </Box>
                                {b.author && <Typography sx={{ fontSize: 12, color: textS, mt: 0.2 }}>by {b.author}</Typography>}
                                <Stack direction="row" spacing={1.5} sx={{ mt: 0.6, flexWrap: "wrap" }}>
                                  {b.genre && <Typography sx={{ fontSize: 11, color: textS }}>📂 {b.genre}</Typography>}
                                  {b.language && b.language !== "English" && <Typography sx={{ fontSize: 11, color: textS }}>🌐 {b.language}</Typography>}
                                  {b.siddhi_id && (() => { const s = allSiddhis.find((x) => x.id === b.siddhi_id); return s ? <Chip label={`🎯 ${s.title}`} size="small" sx={{ height: 16, fontSize: 10, bgcolor: `${gold}14`, color: gold, border: `1px solid ${gold}35`, fontWeight: 600 }} /> : null; })()}
                                </Stack>
                                {b.one_line && <Typography sx={{ fontSize: 11, color: textS, fontStyle: "italic", mt: 0.3 }}>{b.one_line}</Typography>}
                                {b.total_pages > 0 && (
                                  <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
                                      <Typography sx={{ fontSize: 10, color: textS }}>Page {b.pages_read || 0} of {b.total_pages}</Typography>
                                      <Typography sx={{ fontSize: 10, color: barColor, fontWeight: 700 }}>{prog}%</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={prog}
                                      sx={{ height: 4, borderRadius: 2, bgcolor: `${barColor}22`, "& .MuiLinearProgress-bar": { bgcolor: barColor } }} />
                                  </Box>
                                )}
                                {b.notes && <Typography sx={{ fontSize: 11, color: textS, mt: 0.6, fontStyle: "italic" }}>{b.notes}</Typography>}
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton size="small" onClick={() => { haptic(); setBookForm({ title: b.title || "", author: b.author || "", genre: b.genre || "", language: b.language || "English", status: b.status || "reading", total_pages: b.total_pages || "", pages_read: b.pages_read || "", notes: b.notes || "", one_line: b.one_line || "", started_date: b.started_date || today, finished_date: b.finished_date || "", siddhi_id: b.siddhi_id || "" }); setEditBook(b.id); setBookDlg(true); }}
                                  sx={{ color: textS, "&:hover": { color: gold } }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                                <IconButton size="small" onClick={() => deleteBook(b.id, b.title)}
                                  sx={{ color: textS, "&:hover": { color: "#CF4E4E" } }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                              </Stack>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                  {filtered.length > PER_PAGE && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                      <Pagination count={Math.ceil(filtered.length / PER_PAGE)} page={bookPage} onChange={(_, v) => setBookPage(v)}
                        size="small" sx={{ "& .Mui-selected": { bgcolor: `${gold}22 !important`, color: gold } }} />
                    </Box>
                  )}
                </>
              );
            })()}
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — COURSES
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionHead title="Courses & Certifications" onAdd={() => { setCourseForm(emptyCourse); setEditCourse(null); setCourseDlg(true); }} color={VIDYA_TEAL} isDark={isDark} addLabel="Add Course" />

            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 0.5 }}>
              {["all", ...COURSE_STATUS.map((s) => s.value)].map((f) => (
                <Chip key={f} label={f === "all" ? "All" : COURSE_STATUS.find((s) => s.value === f)?.label || f}
                  size="small" onClick={() => { haptic(6); setCourseFilter(f); setCoursePage(1); }}
                  sx={{ cursor: "pointer", fontWeight: 600, fontSize: 11,
                    bgcolor: courseFilter === f ? `${VIDYA_TEAL}22` : "transparent",
                    color: courseFilter === f ? VIDYA_TEAL : textS,
                    border: `1px solid ${courseFilter === f ? VIDYA_TEAL : bdr}` }} />
              ))}
            </Stack>

            {(() => {
              const filtered = courses.filter((c) => courseFilter === "all" || c.status === courseFilter);
              const paged    = filtered.slice((coursePage - 1) * PER_PAGE, coursePage * PER_PAGE);
              if (filtered.length === 0)
                return <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>No courses yet →</Typography>;
              return (
                <>
                  <Stack spacing={1.5}>
                    {paged.map((c) => {
                      const pct = c.progress_pct / 100;
                      const barColor = pct >= 1 ? "#2D7A4F" : pct >= 0.7 ? VIDYA_TEAL : pct >= 0.4 ? "#DDA74F" : VIDYA_SIENNA;
                      return (
                        <Card key={c.id} sx={{ borderRadius: 3, bgcolor: cardBg, border: `1px solid ${bdr}`, boxShadow: "none",
                          "&:hover": { borderColor: VIDYA_TEAL }, transition: "border-color 0.15s" }}>
                          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: textP }}>{c.title}</Typography>
                                  <StatusChip status={c.status} opts={COURSE_STATUS} />
                                </Box>
                                <Stack direction="row" spacing={1.5} sx={{ mt: 0.4, flexWrap: "wrap" }}>
                                  {c.platform && <Typography sx={{ fontSize: 11, color: textS }}>🏫 {c.platform}</Typography>}
                                  {c.instructor && <Typography sx={{ fontSize: 11, color: textS }}>👤 {c.instructor}</Typography>}
                                  {c.siddhi_id && (() => { const s = allSiddhis.find((x) => x.id === c.siddhi_id); return s ? <Chip label={`🎯 ${s.title}`} size="small" sx={{ height: 16, fontSize: 10, bgcolor: `${VIDYA_TEAL}14`, color: VIDYA_TEAL, border: `1px solid ${VIDYA_TEAL}35`, fontWeight: 600 }} /> : null; })()}
                                </Stack>
                                {c.progress_pct > 0 && (
                                  <Box sx={{ mt: 0.8 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
                                      <Typography sx={{ fontSize: 10, color: textS }}>Progress</Typography>
                                      <Typography sx={{ fontSize: 10, color: barColor, fontWeight: 700 }}>{c.progress_pct}%</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={c.progress_pct}
                                      sx={{ height: 4, borderRadius: 2, bgcolor: `${barColor}22`, "& .MuiLinearProgress-bar": { bgcolor: barColor } }} />
                                  </Box>
                                )}
                                {c.notes && <Typography sx={{ fontSize: 11, color: textS, mt: 0.6, fontStyle: "italic" }}>{c.notes}</Typography>}
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton size="small" onClick={() => { haptic(); setCourseForm({ ...c, siddhi_id: c.siddhi_id || "" }); setEditCourse(c.id); setCourseDlg(true); }}
                                  sx={{ color: textS, "&:hover": { color: VIDYA_TEAL } }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                                <IconButton size="small" onClick={() => deleteCourse(c.id, c.title)}
                                  sx={{ color: textS, "&:hover": { color: "#CF4E4E" } }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                              </Stack>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                  {filtered.length > PER_PAGE && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                      <Pagination count={Math.ceil(filtered.length / PER_PAGE)} page={coursePage} onChange={(_, v) => setCoursePage(v)}
                        size="small" sx={{ "& .Mui-selected": { bgcolor: `${VIDYA_TEAL}22 !important`, color: VIDYA_TEAL } }} />
                    </Box>
                  )}
                </>
              );
            })()}
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — STUDY LOG
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Grid container spacing={3}>
          {/* Stats */}
          <Grid item xs={6} sm={4}>
            <StatCard value={`${weekHours.toFixed(1)}h`} label="This Week" sub="Study hours" color={VIDYA_BLUE} isDark={isDark} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatCard value={`${monthHours.toFixed(1)}h`} label="This Month" sub="30-day total" color={VIDYA_TEAL} isDark={isDark} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard value={totalSessions} label="Sessions" sub="Logged all time" color={gold} isDark={isDark} />
          </Grid>

          <Grid item xs={12}>
            <SectionHead
              title="Study Sessions"
              onAdd={() => { setStudyLogForm({ ...emptyStudyLog, date: today }); setEditStudyLog(null); setStudyLogDlg(true); }}
              color={VIDYA_BLUE}
              isDark={isDark}
              addLabel="Log Session"
            />

            {studyLogs.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>
                No sessions logged yet. Log your first study session →
              </Typography>
            ) : (
              <>
                <Stack spacing={1.5}>
                  {studyLogs.slice((studyLogPage - 1) * PER_PAGE, studyLogPage * PER_PAGE).map((log) => {
                    const srcInfo = LOG_SOURCE_TYPES.find((s) => s.value === log.source_type) || LOG_SOURCE_TYPES[3];
                    return (
                      <Card key={log.id} sx={{ borderRadius: 3, bgcolor: cardBg, border: `1px solid ${bdr}`, boxShadow: "none",
                        "&:hover": { borderColor: VIDYA_BLUE }, transition: "border-color 0.15s" }}>
                        <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            {/* Hours badge */}
                            <Box sx={{ width: 46, height: 46, borderRadius: 2.5, flexShrink: 0,
                              bgcolor: isDark ? `${VIDYA_BLUE}22` : `${VIDYA_BLUE}12`,
                              border: `1.5px solid ${VIDYA_BLUE}40`,
                              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                              <Typography sx={{ fontFamily: '"Fraunces",serif', fontSize: 15, fontWeight: 700, color: VIDYA_BLUE, lineHeight: 1 }}>
                                {Number(log.hours).toFixed(1)}
                              </Typography>
                              <Typography sx={{ fontSize: 9, color: VIDYA_BLUE, fontWeight: 600, letterSpacing: 0.3 }}>hrs</Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: textP }}>
                                  {dayjs(log.date).format("ddd, D MMM YYYY")}
                                </Typography>
                                <Chip label={`${srcInfo.emoji} ${srcInfo.label}`} size="small"
                                  sx={{ height: 18, fontSize: 10, bgcolor: `${VIDYA_BLUE}14`, color: VIDYA_BLUE, fontWeight: 600 }} />
                              </Box>
                              {log.source_title && (
                                <Typography sx={{ fontSize: 12, color: gold, mt: 0.3, fontWeight: 500 }}>
                                  📚 {log.source_title}
                                </Typography>
                              )}
                              {log.notes && (
                                <Typography sx={{ fontSize: 11, color: textS, mt: 0.3, fontStyle: "italic" }}>
                                  {log.notes}
                                </Typography>
                              )}
                            </Box>
                            <Stack direction="row" spacing={0.3} sx={{ flexShrink: 0 }}>
                              <IconButton size="small"
                                onClick={() => {
                                  haptic();
                                  setStudyLogForm({
                                    date:         log.date,
                                    hours:        log.hours,
                                    source_type:  log.source_type || "other",
                                    source_id:    log.source_id   || "",
                                    source_title: log.source_title || "",
                                    notes:        log.notes       || "",
                                  });
                                  setEditStudyLog(log.id);
                                  setStudyLogDlg(true);
                                }}
                                sx={{ color: textS, "&:hover": { color: VIDYA_BLUE } }}>
                                <Edit sx={{ fontSize: 14 }} />
                              </IconButton>
                              <IconButton size="small" onClick={() => deleteStudyLog(log.id)}
                                sx={{ color: textS, "&:hover": { color: "#CF4E4E" } }}>
                                <Delete sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Stack>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
                {studyLogs.length > PER_PAGE && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Pagination count={Math.ceil(studyLogs.length / PER_PAGE)} page={studyLogPage} onChange={(_, v) => setStudyLogPage(v)}
                      size="small" sx={{ "& .Mui-selected": { bgcolor: `${VIDYA_BLUE}22 !important`, color: VIDYA_BLUE } }} />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — INSIGHTS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionHead title="Insights & Learnings" onAdd={() => { setInsightForm(emptyInsight); setInsightDlg(true); }} color={VIDYA_SIENNA} isDark={isDark} addLabel="Capture" />

            {insights.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>No insights yet. Capture a key learning →</Typography>
            ) : (
              <>
                <Stack spacing={1.5}>
                  {insights.slice((insightPage - 1) * PER_PAGE, insightPage * PER_PAGE).map((ins) => (
                    <Card key={ins.id} sx={{ borderRadius: 3, bgcolor: cardBg, border: `1px solid ${bdr}`, boxShadow: "none" }}>
                      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: `${gold}20`, border: `1.5px solid ${gold}50`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                            💡
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13.5, color: textP, lineHeight: 1.7, fontFamily: '"Lora",serif', fontStyle: "italic" }}>
                              "{ins.content}"
                            </Typography>
                            <Stack direction="row" spacing={1.5} sx={{ mt: 0.8, flexWrap: "wrap" }}>
                              <Typography sx={{ fontSize: 11, color: textS }}>{dayjs(ins.date).format("D MMM YYYY")}</Typography>
                              {ins.source && <Typography sx={{ fontSize: 11, color: gold }}>📚 {ins.source}</Typography>}
                              {ins.source_type && ins.source_type !== "book" && (
                                <Chip label={ins.source_type} size="small"
                                  sx={{ height: 16, fontSize: 10, bgcolor: `${VIDYA_SIENNA}18`, color: VIDYA_SIENNA }} />
                              )}
                            </Stack>
                          </Box>
                          <IconButton size="small" onClick={() => deleteInsight(ins.id)}
                            sx={{ color: textS, "&:hover": { color: "#CF4E4E" }, flexShrink: 0 }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
                {insights.length > PER_PAGE && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Pagination count={Math.ceil(insights.length / PER_PAGE)} page={insightPage} onChange={(_, v) => setInsightPage(v)}
                      size="small" sx={{ "& .Mui-selected": { bgcolor: `${VIDYA_SIENNA}22 !important`, color: VIDYA_SIENNA } }} />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4 — PRACTICE SEQUENCE
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 4 && (
        <Grid container spacing={3}>
          {/* Today's practice */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, bgcolor: cardBg, border: `1px solid ${bdr}`, boxShadow: "none" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 15, color: textP }}>Today's Practice</Typography>
                  {visiblePrac.length > 0 && (
                    <Typography sx={{ fontSize: 11, color: gold, fontWeight: 700 }}>{pracDone}/{visiblePrac.length}</Typography>
                  )}
                </Box>
                {visiblePrac.length === 0 ? (
                  <Typography sx={{ fontSize: 12, color: textS, textAlign: "center", py: 2 }}>Add practice items →</Typography>
                ) : visiblePrac.map((item) => {
                  const done = !!pracComps[item.id];
                  return (
                    <Box key={item.id} onClick={() => togglePrac(item.id)}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, px: 0.5, borderRadius: 2,
                        cursor: "pointer", borderBottom: `1px solid ${bdr}`, "&:last-child": { borderBottom: "none" },
                        "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" },
                        transition: "background 0.1s", opacity: done ? 0.55 : 1 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: done ? gold : isDark ? "#1F1E1B" : "#F0EDE8", border: `1.5px solid ${done ? gold : isDark ? "#3C3C3C" : "#D1D0CF"}`, transition: "all 0.15s" }}>
                        {done ? <CheckCircle sx={{ fontSize: 13, color: "#fff" }} /> : <RadioButtonUnchecked sx={{ fontSize: 13, color: isDark ? "#5C5A54" : "#C8C6C0" }} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, color: done ? textS : textP, textDecoration: done ? "line-through" : "none" }}>
                          {item.emoji ? `${item.emoji} ` : ""}{item.label}
                        </Typography>
                        {item.duration_minutes && <Typography sx={{ fontSize: 10, color: textS, mt: 0.1 }}>{item.duration_minutes} min</Typography>}
                      </Box>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>

          {/* All practice items */}
          <Grid item xs={12} md={7}>
            <SectionHead title="All Practice Items" onAdd={() => { setPracForm(emptyPrac); setEditPrac(null); setPracDlg(true); }} color={gold} isDark={isDark} addLabel="Add Item" />

            {pracItems.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: textS, py: 2 }}>No practice items yet →</Typography>
            ) : pracItems.map((item) => (
              <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, px: 1.5, borderRadius: 2, mb: 0.5,
                bgcolor: cardBg, border: `1px solid ${bdr}`, "&:hover": { borderColor: gold }, transition: "border-color 0.12s" }}>
                <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{item.emoji || "📚"}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: 10, color: textS }}>
                    {item.frequency}{item.duration_minutes ? ` · ${item.duration_minutes} min` : ""}
                    {item.frequency === "weekly" ? ` · ${DOW[item.frequency_day ?? 0]}` : ""}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.3}>
                  <IconButton size="small" onClick={() => { haptic(); setPracForm(item); setEditPrac(item.id); setPracDlg(true); }}
                    sx={{ color: textS, "&:hover": { color: gold } }}><Edit sx={{ fontSize: 13 }} /></IconButton>
                  <IconButton size="small" onClick={() => deletePracItem(item.id, item.label)}
                    sx={{ color: textS, "&:hover": { color: "#CF4E4E" } }}><Delete sx={{ fontSize: 13 }} /></IconButton>
                </Stack>
              </Box>
            ))}
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5 — SKILLS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 5 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionHead title="Skills Learned" onAdd={() => { setSkillForm(emptySkill); setEditSkill(null); setSkillDlg(true); }} color={gold} isDark={isDark} addLabel="Add Skill" />

            {skills.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: textS, py: 3, textAlign: "center" }}>No skills tracked yet →</Typography>
            ) : (
              <>
                {SKILL_CATS.map((cat) => {
                  const catSkills = skills.filter((s) => s.category === cat);
                  if (catSkills.length === 0) return null;
                  return (
                    <Box key={cat} sx={{ mb: 3 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: gold, mb: 1.5, letterSpacing: 0.5, textTransform: "uppercase" }}>
                        📂 {cat}
                      </Typography>
                      <Stack spacing={1}>
                        {catSkills.slice((skillPage - 1) * 20, skillPage * 20).map((s) => (
                          <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, px: 1.5, borderRadius: 2,
                            bgcolor: cardBg, border: `1px solid ${bdr}`, "&:hover": { borderColor: gold }, transition: "all 0.12s" }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: textP }}>{s.name}</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}>
                                <Stars value={s.proficiency} size={12} />
                                <Typography sx={{ fontSize: 10, color: textS }}>{PROF_LABELS[s.proficiency]}</Typography>
                              </Box>
                              {s.notes && <Typography sx={{ fontSize: 11, color: textS, mt: 0.2, fontStyle: "italic" }}>{s.notes}</Typography>}
                            </Box>
                            <Stack direction="row" spacing={0.3}>
                              <IconButton size="small" onClick={() => { haptic(); setSkillForm(s); setEditSkill(s.id); setSkillDlg(true); }}
                                sx={{ color: textS, "&:hover": { color: gold } }}><Edit sx={{ fontSize: 13 }} /></IconButton>
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
                      size="small" sx={{ "& .Mui-selected": { bgcolor: `${gold}22 !important`, color: gold } }} />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      )}

      {/* ═══════════════════════════════ DIALOGS ════════════════════════════ */}

      {/* Book Dialog */}
      <Dialog open={bookDlg} onClose={() => setBookDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#1A1610" : "#FDFAF5", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>
          {editBook ? "Edit Book" : "Add Book"} 📖
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title *" fullWidth size="small" value={bookForm.title} onChange={(e) => setBookForm((f) => ({ ...f, title: e.target.value }))} />
            <TextField label="Author" fullWidth size="small" value={bookForm.author || ""} onChange={(e) => setBookForm((f) => ({ ...f, author: e.target.value }))} />
            <TextField label="Genre" fullWidth size="small" placeholder="Fiction, Philosophy, History…" value={bookForm.genre || ""} onChange={(e) => setBookForm((f) => ({ ...f, genre: e.target.value }))} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select value={bookForm.status} label="Status" onChange={(e) => setBookForm((f) => ({ ...f, status: e.target.value }))}>
                  {BOOK_STATUS.map((s) => <MenuItem key={s.value} value={s.value}>{s.emoji} {s.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Language</InputLabel>
                <Select value={bookForm.language} label="Language" onChange={(e) => setBookForm((f) => ({ ...f, language: e.target.value }))}>
                  {LANG_OPTIONS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Total pages" type="number" size="small" sx={{ flex: 1 }} value={bookForm.total_pages || ""} onChange={(e) => setBookForm((f) => ({ ...f, total_pages: e.target.value }))} />
              <TextField label="Pages read" type="number" size="small" sx={{ flex: 1 }} value={bookForm.pages_read || ""} onChange={(e) => setBookForm((f) => ({ ...f, pages_read: e.target.value }))} />
            </Box>
            <TextField label="One-line summary" size="small" fullWidth placeholder="What's this book about?" value={bookForm.one_line || ""} onChange={(e) => setBookForm((f) => ({ ...f, one_line: e.target.value }))} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Started date" type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} value={bookForm.started_date || ""} onChange={(e) => setBookForm((f) => ({ ...f, started_date: e.target.value }))} />
              <TextField label="Finished date" type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} value={bookForm.finished_date || ""} onChange={(e) => setBookForm((f) => ({ ...f, finished_date: e.target.value }))} />
            </Box>
            <TextField label="Notes" fullWidth size="small" multiline minRows={2} value={bookForm.notes || ""} onChange={(e) => setBookForm((f) => ({ ...f, notes: e.target.value }))} />
            <SiddhiPicker value={bookForm.siddhi_id} onChange={(v) => setBookForm((f) => ({ ...f, siddhi_id: v }))} isDark={isDark} label="Link to Milestone (Siddhi)" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setBookDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveBook} sx={{ bgcolor: gold, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: gold, opacity: 0.88 } }}>
            {editBook ? "Update" : "Add Book"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Course Dialog */}
      <Dialog open={courseDlg} onClose={() => setCourseDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#1A1610" : "#FDFAF5", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>
          {editCourse ? "Edit Course" : "Add Course"} 🎓
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Course title *" fullWidth size="small" value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Platform" size="small" sx={{ flex: 1 }} placeholder="Udemy, Coursera…" value={courseForm.platform || ""} onChange={(e) => setCourseForm((f) => ({ ...f, platform: e.target.value }))} />
              <TextField label="Instructor" size="small" sx={{ flex: 1 }} value={courseForm.instructor || ""} onChange={(e) => setCourseForm((f) => ({ ...f, instructor: e.target.value }))} />
            </Box>
            <TextField label="URL" size="small" fullWidth value={courseForm.url || ""} onChange={(e) => setCourseForm((f) => ({ ...f, url: e.target.value }))} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select value={courseForm.status} label="Status" onChange={(e) => setCourseForm((f) => ({ ...f, status: e.target.value }))}>
                  {COURSE_STATUS.map((s) => <MenuItem key={s.value} value={s.value}>{s.emoji} {s.label}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Progress %" type="number" size="small" sx={{ flex: 1 }} inputProps={{ min: 0, max: 100 }} value={courseForm.progress_pct || 0} onChange={(e) => setCourseForm((f) => ({ ...f, progress_pct: e.target.value }))} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: textS, mb: 0.8 }}>Rating</Typography>
              <Stars value={courseForm.rating || 3} onChange={(v) => setCourseForm((f) => ({ ...f, rating: v }))} size={22} />
            </Box>
            <TextField label="Notes" fullWidth size="small" multiline minRows={2} value={courseForm.notes || ""} onChange={(e) => setCourseForm((f) => ({ ...f, notes: e.target.value }))} />
            <SiddhiPicker value={courseForm.siddhi_id} onChange={(v) => setCourseForm((f) => ({ ...f, siddhi_id: v }))} isDark={isDark} label="Link to Milestone (Siddhi)" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCourseDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveCourse} sx={{ bgcolor: VIDYA_TEAL, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: VIDYA_TEAL, opacity: 0.88 } }}>
            {editCourse ? "Update" : "Add Course"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Study Log Dialog */}
      <Dialog open={studyLogDlg} onClose={() => setStudyLogDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#1A1610" : "#FDFAF5", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>
          {editStudyLog ? "Edit Session" : "Log Study Session"} 📓
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Date" type="date" size="small" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }}
                value={studyLogForm.date} onChange={(e) => setStudyLogForm((f) => ({ ...f, date: e.target.value }))} />
              <TextField label="Hours *" type="number" size="small" sx={{ flex: 1 }}
                inputProps={{ min: 0.1, max: 24, step: 0.25 }} placeholder="e.g. 1.5"
                value={studyLogForm.hours} onChange={(e) => setStudyLogForm((f) => ({ ...f, hours: e.target.value }))} />
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Source type</InputLabel>
              <Select value={studyLogForm.source_type} label="Source type"
                onChange={(e) => setStudyLogForm((f) => ({ ...f, source_type: e.target.value, source_id: "", source_title: "" }))}>
                {LOG_SOURCE_TYPES.map((s) => <MenuItem key={s.value} value={s.value}>{s.emoji} {s.label}</MenuItem>)}
              </Select>
            </FormControl>

            {studyLogForm.source_type === "book" && (
              <FormControl size="small" fullWidth>
                <InputLabel>Book</InputLabel>
                <Select value={studyLogForm.source_id || ""} label="Book"
                  onChange={(e) => setStudyLogForm((f) => ({ ...f, source_id: e.target.value }))}>
                  <MenuItem value=""><em>— none —</em></MenuItem>
                  {books.filter((b) => b.status === "reading" || b.status === "completed")
                    .map((b) => <MenuItem key={b.id} value={b.id}>📖 {b.title}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {studyLogForm.source_type === "course" && (
              <FormControl size="small" fullWidth>
                <InputLabel>Course</InputLabel>
                <Select value={studyLogForm.source_id || ""} label="Course"
                  onChange={(e) => setStudyLogForm((f) => ({ ...f, source_id: e.target.value }))}>
                  <MenuItem value=""><em>— none —</em></MenuItem>
                  {courses.filter((c) => c.status === "in_progress" || c.status === "completed")
                    .map((c) => <MenuItem key={c.id} value={c.id}>🎓 {c.title}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {(studyLogForm.source_type === "practice" || studyLogForm.source_type === "other") && (
              <TextField label="What did you study?" size="small" fullWidth
                placeholder="Topic, subject, or activity name…"
                value={studyLogForm.source_title} onChange={(e) => setStudyLogForm((f) => ({ ...f, source_title: e.target.value }))} />
            )}

            <Divider sx={{ my: 0 }} />
            <TextField label="Notes" fullWidth size="small" multiline minRows={2}
              placeholder="Key takeaways, what you covered…"
              value={studyLogForm.notes} onChange={(e) => setStudyLogForm((f) => ({ ...f, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setStudyLogDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveStudyLog}
            sx={{ bgcolor: VIDYA_BLUE, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: VIDYA_BLUE, opacity: 0.88 } }}>
            {editStudyLog ? "Update" : "Log Session"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Insight Dialog */}
      <Dialog open={insightDlg} onClose={() => setInsightDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#1A1610" : "#FDFAF5", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>Capture Insight 💡</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={insightForm.date} onChange={(e) => setInsightForm((f) => ({ ...f, date: e.target.value }))} />
            <TextField label="What did you learn? *" fullWidth size="small" multiline minRows={4} placeholder="Write the insight in your own words…" value={insightForm.content} onChange={(e) => setInsightForm((f) => ({ ...f, content: e.target.value }))} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Source (book/article title)" size="small" sx={{ flex: 1 }} value={insightForm.source || ""} onChange={(e) => setInsightForm((f) => ({ ...f, source: e.target.value }))} />
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select value={insightForm.source_type} label="Type" onChange={(e) => setInsightForm((f) => ({ ...f, source_type: e.target.value }))}>
                  {SOURCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setInsightDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveInsight} sx={{ bgcolor: VIDYA_SIENNA, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: VIDYA_SIENNA, opacity: 0.88 } }}>
            Save Insight
          </Button>
        </DialogActions>
      </Dialog>

      {/* Practice Item Dialog */}
      <Dialog open={pracDlg} onClose={() => setPracDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#1A1610" : "#FDFAF5", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>
          {editPrac ? "Edit Practice Item" : "Add Practice Item"} 🕉️
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Emoji" size="small" sx={{ width: 80 }} value={pracForm.emoji} onChange={(e) => setPracForm((f) => ({ ...f, emoji: e.target.value }))} />
              <TextField label="Label *" size="small" sx={{ flex: 1 }} value={pracForm.label} onChange={(e) => setPracForm((f) => ({ ...f, label: e.target.value }))} />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Duration (min)" type="number" size="small" sx={{ flex: 1 }} value={pracForm.duration_minutes || ""} onChange={(e) => setPracForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Frequency</InputLabel>
                <Select value={pracForm.frequency} label="Frequency" onChange={(e) => setPracForm((f) => ({ ...f, frequency: e.target.value }))}>
                  {FREQ_OPTS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            {pracForm.frequency === "weekly" && (
              <FormControl size="small" fullWidth>
                <InputLabel>Day of week</InputLabel>
                <Select value={pracForm.frequency_day ?? 0} label="Day of week" onChange={(e) => setPracForm((f) => ({ ...f, frequency_day: e.target.value }))}>
                  {DOW.map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPracDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={savePracItem} sx={{ bgcolor: gold, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: gold, opacity: 0.88 } }}>
            {editPrac ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={skillDlg} onClose={() => setSkillDlg(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#1A1610" : "#FDFAF5", border: `1px solid ${bdr}` } }}>
        <DialogTitle sx={{ fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 18, pb: 1 }}>
          {editSkill ? "Edit Skill" : "Add Skill"} 🎯
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={skillForm.category} label="Category" onChange={(e) => setSkillForm((f) => ({ ...f, category: e.target.value }))}>
                {SKILL_CATS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Skill name *" fullWidth size="small" value={skillForm.name} onChange={(e) => setSkillForm((f) => ({ ...f, name: e.target.value }))} />
            <Box>
              <Typography sx={{ fontSize: 12, color: textS, mb: 0.8 }}>Proficiency: {PROF_LABELS[skillForm.proficiency]}</Typography>
              <Stars value={skillForm.proficiency} onChange={(v) => setSkillForm((f) => ({ ...f, proficiency: v }))} size={22} />
            </Box>
            <TextField label="Notes" fullWidth size="small" multiline minRows={2} value={skillForm.notes || ""} onChange={(e) => setSkillForm((f) => ({ ...f, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSkillDlg(false)} sx={{ color: textS, textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={saveSkill} sx={{ bgcolor: gold, textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: gold, opacity: 0.88 } }}>
            {editSkill ? "Update" : "Add Skill"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={delDlg.open} onClose={() => setDelDlg({ open: false, title: "", fn: null })}
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? "#1A1610" : "#fff", maxWidth: 360 } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>{delDlg.title}</Typography>
          <Typography sx={{ fontSize: 12, color: textS, mt: 0.5 }}>This cannot be undone.</Typography>
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
