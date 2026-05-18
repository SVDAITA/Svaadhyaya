import { useState, useEffect, useCallback, useRef } from "react";

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Divider,
  Tooltip,
  CircularProgress as CircularRing,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  AutoStories,
  Search,
  UploadFile,
  Timeline,
  CheckCircle,
  Create,
  LocalLibrary,
  Spa,
  MenuBook,
  CalendarToday,
} from "@mui/icons-material";
import { keyframes } from "@mui/system";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);

// --- Animations ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// --- Constants ---
const COLOR = "#A0522D"; // Primary Hero Color (Sienna / Earthy)
const LANG_OPTIONS = ["Telugu", "English", "Sanskrit", "Hindi", "Other"];
const STATUS_OPTIONS = [
  { value: "reading", label: "Reading", color: "#2D7A4F", colorDark: "#5EC98A" },
  { value: "completed", label: "Completed", color: COLOR, colorDark: "#D4845A" },
  { value: "paused", label: "Paused", color: "#C07830", colorDark: "#D4A830" },
  { value: "queued", label: "In Queue", color: "#8E8C86", colorDark: "#B0AEA8" },
];

function TabPanel({ value, index, children }) {
  return value === index ? (
    <Box sx={{ pt: 3, animation: `${fadeInUp} 0.4s ease-out` }}>{children}</Box>
  ) : null;
}

function StatusChip({ status, isDark }) {
  const s = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[3];
  const c = isDark ? s.colorDark : s.color;
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{
        fontSize: 11,
        height: 22,
        borderRadius: "6px",
        background: `${c}15`,
        color: c,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    />
  );
}

const parseManualDate = (dateStr) => {
  if (!dateStr || !dateStr.includes("/")) return dayjs().format("YYYY-MM-DD");
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

export default function ReadingLogPage() {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const [tab, setTab] = useState(0);
  const [books, setBooks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const TABLE_COLUMNS = [
    { id: "title", label: "Title" },
    { id: "author", label: "Author" },
    { id: "pages", label: "Pages" },
    { id: "description", label: "Description" },
    { id: "genre", label: "Genre" },
    { id: "language", label: "Language" },
    { id: "price", label: "Price" },
    { id: "location", label: "Location" },
    { id: "status", label: "Read Status" },
    { id: "condition", label: "Condition" },
    { id: "date_added", label: "Date Added" },
  ];

  const [visibleCols, setVisibleCols] = useState([
    "title",
    "author",
    "status",
    "pages",
    "genre",
  ]);

  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");

  const [addOpen, setAddOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editBook, setEditBook] = useState(null);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [activeLogBook, setActiveLogBook] = useState(null);

  const [form, setForm] = useState({
    title: "",
    author: "",
    language: "English",
    status: "reading",
    pages_read: 0,
    total_pages: "",
    started_date: dayjs().format("YYYY-MM-DD"),
    finished_date: "",
    description: "",
    notes: "",
    genre: "",
    location: "",
    price: "",
    condition: "",
  });

  const [sessionForm, setSessionForm] = useState({
    pages_read: "",
    summary: "",
  });
  const [newJournal, setNewJournal] = useState("");

  const fileInputRef = useRef(null);

  // --- Themes & Backgrounds ---
  // A subtle "handmade paper" noise texture suitable for both themes

  const textP = isDark ? "#F4F0EB" : "#2C2A28";
  const textS = isDark ? "#A39E98" : "#6E6862";
  const cardBg = isDark
    ? "rgba(26, 25, 23, 0.65)"
    : "rgba(255, 255, 255, 0.65)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(160, 82, 45, 0.15)";
  const glassFilter = "blur(16px)";

  const load = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (!silent) setLoading(true);
      try {
        const [booksRes, sessionsRes, journalRes] = await Promise.all([
          supabase
            .from("books")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false }),
          supabase
            .from("reading_sessions")
            .select("*")
            .eq("user_id", user.id)
            .order("session_date", { ascending: true }),
          supabase
            .from("journal_entries")
            .select("*")
            .eq("user_id", user.id)
            .order("entry_date", { ascending: false }),
        ]);
        setBooks(booksRes.data || []);
        setSessions(sessionsRes.data || []);
        setJournalEntries(journalRes.data || []);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    load();
  }, [load]);

  // --- Book CRUD ---
  const resetForm = () =>
    setForm({
      title: "",
      author: "",
      language: "English",
      status: "reading",
      pages_read: 0,
      total_pages: "",
      started_date: dayjs().format("YYYY-MM-DD"),
      finished_date: "",
      description: "",
      notes: "",
      genre: "",
      location: "",
      price: "",
      condition: "",
    });

  const openEdit = (book) => {
    setForm({
      ...book,
      author: book.author || "",
      language: book.language || "English",
      status: book.status || "reading",
      pages_read: book.pages_read || 0,
      total_pages: book.total_pages || "",
      started_date: book.started_date || "",
      finished_date: book.finished_date || "",
      description: book.description || "",
      notes: book.notes || "",
      genre: book.genre || "",
      location: book.location || "",
      price: book.price || "",
      condition: book.condition || "",
    });
    setEditBook(book);
    setAddOpen(true);
  };

  const saveBook = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      author: form.author.trim() || null,
      language: form.language,
      status: form.status,
      pages_read: Number(form.pages_read) || 0,
      total_pages: form.total_pages ? Number(form.total_pages) : null,
      started_date: form.started_date || null,
      finished_date: form.finished_date || null,
      notes: form.notes || null,
      genre: form.genre || null,
      location: form.location || null,
      condition: form.condition || null,
      price: form.price ? Number(form.price) : null,
      description: form.description || null,
    };
    try {
      if (editBook) {
        const { error } = await supabase
          .from("books")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editBook.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("books").insert(payload);
        if (error) throw error;
      }
      setAddOpen(false);
      resetForm();
      showSnack(editBook ? "Book updated." : "Book added.", "success");
      load();
    } catch {
      showSnack("Failed to save book.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (book) => {
    setBookToDelete(book);
    setDeleteConfirmOpen(true);
  };
  const executeDelete = async () => {
    if (!bookToDelete) return;
    const { error } = await supabase.from("books").delete().eq("id", bookToDelete.id);
    if (error) { showSnack("Failed to delete.", "error"); return; }
    setDeleteConfirmOpen(false);
    setBookToDelete(null);
    showSnack("Book removed.", "success");
    load();
  };

  // --- Daily Progress Logging ---
  const handleDailyLog = async () => {
    const pagesReadToday = Math.max(1, Number(sessionForm.pages_read));
    if (!activeLogBook || !pagesReadToday) return;
    setSaving(true);

    const todayStr = dayjs().format("YYYY-MM-DD");
    const displayDate = dayjs().format("MMM D, YYYY");

    try {
      const { error: e1 } = await supabase.from("reading_sessions").insert({
        user_id: user.id,
        book_id: activeLogBook.id,
        session_date: todayStr,
        pages_read: pagesReadToday,
        summary: sessionForm.summary || null,
      });
      if (e1) throw e1;

      const newTotalRead = (activeLogBook.pages_read || 0) + pagesReadToday;
      const isCompleted =
        activeLogBook.total_pages && newTotalRead >= activeLogBook.total_pages;
      const appendedNotes = sessionForm.summary
        ? `[${displayDate}] +${pagesReadToday} pages: ${sessionForm.summary}\n\n${activeLogBook.notes || ""}`.trim()
        : activeLogBook.notes;

      const { error: e2 } = await supabase
        .from("books")
        .update({
          pages_read: newTotalRead,
          status: isCompleted ? "completed" : "reading",
          finished_date: isCompleted ? todayStr : activeLogBook.finished_date,
          notes: appendedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeLogBook.id);
      if (e2) throw e2;

      setSessionOpen(false);
      setSessionForm({ pages_read: "", summary: "" });
      showSnack("Session logged.", "success");
      load(true);
    } catch {
      showSnack("Failed to log session.", "error");
    } finally {
      setSaving(false);
    }
  };

  // --- Journal Saving ---
  const saveJournalEntry = async () => {
    if (!newJournal.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      content: newJournal.trim(),
      entry_date: dayjs().format("YYYY-MM-DD"),
    });
    if (error) { showSnack("Failed to save entry.", "error"); setSaving(false); return; }
    setNewJournal("");
    setSaving(false);
    showSnack("Journal entry saved.", "success");
    load(true);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const payload = jsonData.map((b) => {
          const rawPrice = b.Price
            ? b.Price.toString().replace(/[^0-9.]/g, "")
            : null;
          const cleanPrice = isNaN(parseFloat(rawPrice))
            ? null
            : parseFloat(rawPrice);
          return {
            user_id: user.id,
            title: b.Title,
            author: b.Author,
            total_pages: Number(b.Pages) || null,
            description: b["Short Description"] || null,
            genre: b.Genre || null,
            language: b.Language || "English",
            price: cleanPrice,
            location: b.Location || null,
            status: b["Read Status"] === "Read" ? "completed" : "queued",
            condition: b.Condition || null,
            date_added: b["Date Added"]
              ? parseManualDate(b["Date Added"])
              : dayjs().format("YYYY-MM-DD"),
          };
        });

        const { error: supabaseError } = await supabase
          .from("books")
          .insert(payload);

        if (supabaseError) {
          showSnack(`Import failed: ${supabaseError.message}`, "error");
          return;
        }

        showSnack("Library imported successfully!");
        load();
      } catch (err) {
        showSnack("Invalid JSON format — check the file structure.", "error");
      }
    };
    reader.readAsText(file);
  };

  // --- Analytics & Filtering ---
  const reading = books.filter((b) => b.status === "reading");
  const queued = books.filter((b) => b.status === "queued");

  // Generate 91 days (13 weeks) for a nice grid
  const heatmapDays = Array.from({ length: 91 }, (_, i) => {
    const d = dayjs()
      .subtract(90 - i, "day")
      .format("YYYY-MM-DD");
    const todaySessions = sessions.filter((s) => s.session_date === d);
    return {
      date: d,
      pages: todaySessions.reduce((sum, s) => sum + s.pages_read, 0),
    };
  });

  const displayedBooks = books
    .filter(
      (b) =>
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author?.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((b) => langFilter === "all" || b.language === langFilter)
    .filter((b) => statusFilter === "all" || b.status === statusFilter)
    .filter((b) => genreFilter === "all" || b.genre === genreFilter);

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
        <CircularProgress sx={{ color: COLOR }} />
      </Box>
    );

  return (
    <Box
      sx={{
        p: { xs: 2, md: "40px 56px" },
        maxWidth: 1280,
        mx: "auto",
        minHeight: "100vh",
        animation: `${fadeIn} 0.8s ease-in`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          mb: 6,
          flexWrap: "wrap",
          gap: 3,
          animation: `${fadeInUp} 0.6s ease-out`,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: '"Fraunces", "Georgia", serif',
              fontWeight: 400,
              fontSize: { xs: 32, md: 42 },
              color: textP,
              lineHeight: 1.1,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Spa sx={{ color: COLOR, fontSize: { xs: 28, md: 36 } }} />
            Pathanam Tracker
          </Typography>
          <Typography
            sx={{
              fontSize: 15,
              color: textS,
              mt: 1,
              fontFamily: '"Lora", serif',
              fontStyle: "italic",
              letterSpacing: 0.5,
            }}
          >
            "Vidyā dadāti vinayam — Knowledge instills humility."
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <input
            type="file"
            accept=".json"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            variant="outlined"
            startIcon={<UploadFile />}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              borderColor: border,
              color: textP,
              textTransform: "none",
              borderRadius: 2,
              backdropFilter: glassFilter,
              "&:hover": { borderColor: COLOR, backgroundColor: `${COLOR}10` },
            }}
          >
            Import Data
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setEditBook(null);
              setAddOpen(true);
            }}
            sx={{
              background: COLOR,
              borderRadius: 2,
              "&:hover": { background: "#804020" },
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(160, 82, 45, 0.4)",
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            Add Book
          </Button>
        </Box>
      </Box>

      {/* Hero & Heatmap Container */}
      <Grid
        container
        spacing={4}
        sx={{ mb: 6, animation: `${fadeInUp} 0.7s ease-out` }}
      >
        {/* Now Reading */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 4,
              background: cardBg,
              backdropFilter: glassFilter,
              height: "100%",
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.2)"
                : "0 8px 32px rgba(160,82,45,0.05)",
            }}
          >
            <CardContent
              sx={{
                p: "28px !important",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: COLOR,
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <AutoStories sx={{ fontSize: 18 }} /> Active Reading
              </Typography>

              {reading.length === 0 ? (
                <Box sx={{ m: "auto", textAlign: "center", opacity: 0.6 }}>
                  <LocalLibrary sx={{ fontSize: 48, mb: 1, color: textS }} />
                  <Typography
                    variant="body1"
                    color={textP}
                    sx={{ fontFamily: '"Fraunces", serif' }}
                  >
                    Your reading desk is empty.
                  </Typography>
                  <Typography variant="body2" color={textS}>
                    Begin your next intellectual journey.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3.5,
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                  }}
                >
                  {reading.map((book) => {
                    const pct = book.total_pages
                      ? Math.min(
                          Math.round(
                            (book.pages_read / book.total_pages) * 100,
                          ),
                          100,
                        )
                      : 0;
                    const readToday =
                      heatmapDays[heatmapDays.length - 1].pages > 0 &&
                      sessions.some(
                        (s) =>
                          s.book_id === book.id &&
                          s.session_date === dayjs().format("YYYY-MM-DD"),
                      );

                    const bookSessions = sessions.filter(
                      (s) => s.book_id === book.id,
                    );
                    const last7DaysSessions = bookSessions.filter((s) =>
                      dayjs(s.session_date).isSameOrAfter(
                        dayjs().subtract(7, "day"),
                      ),
                    );
                    const pagesLast7Days = last7DaysSessions.reduce(
                      (sum, s) => sum + s.pages_read,
                      0,
                    );
                    const velocity = Math.ceil(pagesLast7Days / 7);
                    const remainingPages =
                      book.total_pages - (book.pages_read || 0);
                    const daysRemaining =
                      velocity > 0
                        ? Math.ceil(remainingPages / velocity)
                        : null;
                    const forecastDate = daysRemaining
                      ? dayjs().add(daysRemaining, "day").format("MMM D")
                      : null;

                    return (
                      <Box
                        key={book.id}
                        sx={{ display: "flex", gap: 3, alignItems: "center" }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CircularRing
                            variant="determinate"
                            value={100}
                            size={64}
                            thickness={3}
                            sx={{
                              color: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "#EAE4DC",
                              position: "absolute",
                            }}
                          />
                          <CircularRing
                            variant="determinate"
                            value={pct}
                            size={64}
                            thickness={3}
                            sx={{ color: COLOR, strokeLinecap: "round" }}
                          />
                          <Typography
                            sx={{
                              position: "absolute",
                              fontSize: 13,
                              fontWeight: 700,
                              color: textP,
                              fontFamily: '"Fraunces", serif',
                            }}
                          >
                            {pct}%
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 18,
                              fontWeight: 600,
                              color: textP,
                              fontFamily: '"Fraunces", serif',
                            }}
                            noWrap
                          >
                            {book.title}
                          </Typography>
                          <Typography
                            sx={{ fontSize: 14, color: textS, mb: 0.5 }}
                          >
                            {book.author}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: textS,
                                fontWeight: 500,
                              }}
                            >
                              {book.pages_read} / {book.total_pages || "?"}{" "}
                              pages
                            </Typography>
                            {readToday && (
                              <Chip
                                icon={
                                  <CheckCircle
                                    sx={{ fontSize: "14px !important" }}
                                  />
                                }
                                label="Logged today"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: 11,
                                  background: "#2D7A4F15",
                                  color: "#2D7A4F",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>
                          {forecastDate && remainingPages > 0 && (
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: COLOR,
                                mt: 0.5,
                                fontWeight: 600,
                                opacity: 0.8,
                              }}
                            >
                              ~{velocity} pgs/day • Target: {forecastDate}
                            </Typography>
                          )}
                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setActiveLogBook(book);
                            setSessionOpen(true);
                          }}
                          sx={{
                            borderColor: `${COLOR}50`,
                            color: COLOR,
                            textTransform: "none",
                            borderRadius: 2,
                            px: 2,
                            "&:hover": {
                              borderColor: COLOR,
                              backgroundColor: `${COLOR}10`,
                            },
                          }}
                        >
                          Log
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Consistency Matrix Heatmap */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 4,
              background: cardBg,
              backdropFilter: glassFilter,
              height: "100%",
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.2)"
                : "0 8px 32px rgba(160,82,45,0.05)",
            }}
          >
            <CardContent sx={{ p: "28px !important" }}>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: textP,
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Timeline sx={{ fontSize: 18, color: COLOR }} /> Consistency
                Matrix
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(13, 1fr)",
                    gridTemplateRows: "repeat(7, 1fr)",
                    gap: "6px",
                    gridAutoFlow: "column",
                  }}
                >
                  {heatmapDays.map((day, i) => {
                    let bgCol = isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(160, 82, 45, 0.08)";
                    if (day.pages > 0) bgCol = `${COLOR}60`;
                    if (day.pages >= 20) bgCol = `${COLOR}90`;
                    if (day.pages >= 50) bgCol = COLOR;
                    return (
                      <Tooltip
                        key={i}
                        title={`${dayjs(day.date).format("MMM D")}: ${day.pages} pages`}
                        arrow
                        placement="top"
                      >
                        <Box
                          sx={{
                            width: { xs: 12, sm: 16 },
                            height: { xs: 12, sm: 16 },
                            borderRadius: "4px",
                            background: bgCol,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.2)",
                              boxShadow: `0 0 8px ${bgCol}`,
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    mt: 3,
                    alignItems: "center",
                    alignSelf: "flex-end",
                    mr: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 10, color: textS }}>
                    Less
                  </Typography>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: 1,
                      background: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(160, 82, 45, 0.08)",
                    }}
                  />
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: 1,
                      background: `${COLOR}60`,
                    }}
                  />
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: 1,
                      background: `${COLOR}90`,
                    }}
                  />
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: 1,
                      background: COLOR,
                    }}
                  />
                  <Typography sx={{ fontSize: 10, color: textS }}>
                    More
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Navigation Tabs */}
      <Box
        sx={{
          borderBottom: `1px solid ${border}`,
          mb: 2,
          animation: `${fadeInUp} 0.8s ease-out`,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            "& .MuiTab-root": {
              fontSize: 15,
              textTransform: "none",
              fontWeight: 600,
              minHeight: 56,
              px: 4,
              color: textS,
              fontFamily: '"Fraunces", serif',
            },
            "& .Mui-selected": { color: `${COLOR} !important` },
            "& .MuiTabs-indicator": {
              background: COLOR,
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            },
          }}
        >
          <Tab
            icon={<MenuBook sx={{ mr: 1, fontSize: 18 }} />}
            iconPosition="start"
            label={`Library (${books.length})`}
          />
          <Tab
            icon={<Create sx={{ mr: 1, fontSize: 18 }} />}
            iconPosition="start"
            label="Reflections Journal"
          />
          <Tab
            icon={<CalendarToday sx={{ mr: 1, fontSize: 18 }} />}
            iconPosition="start"
            label={`Up Next (${queued.length})`}
          />
        </Tabs>
      </Box>

      {/* TAB 0: Library Table View */}
      <TabPanel value={tab} index={0}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="Search titles, authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ color: textS, mr: 1, fontSize: 20 }} />
              ),
            }}
            sx={{
              flex: 2,
              minWidth: 250,
              "& .MuiOutlinedInput-root": {
                background: cardBg,
                borderRadius: 2,
                backdropFilter: glassFilter,
              },
            }}
          />

          <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
            <InputLabel>Genre</InputLabel>
            <Select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              label="Genre"
              sx={{
                background: cardBg,
                borderRadius: 2,
                backdropFilter: glassFilter,
              }}
            >
              <MenuItem value="all">All Genres</MenuItem>
              {[...new Set(books.map((b) => b.genre))]
                .filter(Boolean)
                .map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              label="Language"
              sx={{
                background: cardBg,
                borderRadius: 2,
                backdropFilter: glassFilter,
              }}
            >
              <MenuItem value="all">All Languages</MenuItem>
              {LANG_OPTIONS.map((l) => (
                <MenuItem key={l} value={l}>
                  {l}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: 1, minWidth: 160 }}>
            <InputLabel>Columns</InputLabel>
            <Select
              multiple
              value={visibleCols}
              onChange={(e) =>
                setVisibleCols(
                  typeof e.target.value === "string"
                    ? e.target.value.split(",")
                    : e.target.value,
                )
              }
              input={
                <OutlinedInput
                  label="Columns"
                  sx={{
                    background: cardBg,
                    borderRadius: 2,
                    backdropFilter: glassFilter,
                  }}
                />
              }
              renderValue={(selected) => selected.length + " columns"}
            >
              {TABLE_COLUMNS.map((col) => (
                <MenuItem key={col.id} value={col.id}>
                  <Checkbox
                    checked={visibleCols.indexOf(col.id) > -1}
                    size="small"
                    sx={{ color: COLOR }}
                  />
                  <ListItemText
                    primary={col.label}
                    sx={{ "& .MuiTypography-root": { fontSize: 14 } }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            background: cardBg,
            backdropFilter: glassFilter,
            border: `1px solid ${border}`,
            borderRadius: 3,
            overflowX: "auto",
            boxShadow: isDark
              ? "0 4px 20px rgba(0,0,0,0.15)"
              : "0 4px 20px rgba(160,82,45,0.03)",
          }}
        >
          <Table size="medium">
            <TableHead
              sx={{
                background: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(160, 82, 45, 0.05)",
              }}
            >
              <TableRow>
                {visibleCols.includes("title") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Title
                  </TableCell>
                )}
                {visibleCols.includes("author") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Author
                  </TableCell>
                )}
                {visibleCols.includes("pages") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Progress
                  </TableCell>
                )}
                {visibleCols.includes("description") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Description
                  </TableCell>
                )}
                {visibleCols.includes("genre") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Genre
                  </TableCell>
                )}
                {visibleCols.includes("language") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Language
                  </TableCell>
                )}
                {visibleCols.includes("price") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Price
                  </TableCell>
                )}
                {visibleCols.includes("location") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Location
                  </TableCell>
                )}
                {visibleCols.includes("status") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Status
                  </TableCell>
                )}
                {visibleCols.includes("condition") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Condition
                  </TableCell>
                )}
                {visibleCols.includes("date_added") && (
                  <TableCell sx={{ fontWeight: 700, color: textP }}>
                    Added
                  </TableCell>
                )}
                <TableCell align="right" sx={{ fontWeight: 700, color: textP }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedBooks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleCols.length + 1}
                    align="center"
                    sx={{ py: 10, opacity: 0.6 }}
                  >
                    <LocalLibrary sx={{ fontSize: 40, mb: 1, color: textS }} />
                    <Typography>No books found matching criteria.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedBooks.map((book) => (
                  <TableRow
                    key={book.id}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      transition: "background 0.2s",
                    }}
                  >
                    {visibleCols.includes("title") && (
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: textP,
                          fontFamily: '"Fraunces", serif',
                          fontSize: 15,
                        }}
                      >
                        {book.title}
                      </TableCell>
                    )}
                    {visibleCols.includes("author") && (
                      <TableCell sx={{ color: textS }}>{book.author}</TableCell>
                    )}
                    {visibleCols.includes("pages") && (
                      <TableCell sx={{ color: textP, fontWeight: 500 }}>
                        {book.pages_read} / {book.total_pages || "?"}
                      </TableCell>
                    )}
                    {visibleCols.includes("description") && (
                      <TableCell
                        sx={{ maxWidth: 250, fontSize: 12, color: textS }}
                      >
                        {book.description}
                      </TableCell>
                    )}
                    {visibleCols.includes("genre") && (
                      <TableCell>
                        <Chip
                          label={book.genre || "N/A"}
                          size="small"
                          sx={{
                            fontSize: 11,
                            borderRadius: "6px",
                            backgroundColor: isDark ? "#333" : "#F0EBE1",
                          }}
                        />
                      </TableCell>
                    )}
                    {visibleCols.includes("language") && (
                      <TableCell sx={{ color: textS }}>
                        {book.language}
                      </TableCell>
                    )}
                    {visibleCols.includes("price") && (
                      <TableCell sx={{ color: textP }}>
                        {book.price ? `₹${book.price}` : "-"}
                      </TableCell>
                    )}
                    {visibleCols.includes("location") && (
                      <TableCell sx={{ color: textS }}>
                        {book.location}
                      </TableCell>
                    )}
                    {visibleCols.includes("status") && (
                      <TableCell>
                        <StatusChip status={book.status} isDark={isDark} />
                      </TableCell>
                    )}
                    {visibleCols.includes("condition") && (
                      <TableCell sx={{ color: textS }}>
                        {book.condition}
                      </TableCell>
                    )}
                    {visibleCols.includes("date_added") && (
                      <TableCell sx={{ color: textS }}>
                        {dayjs(book.date_added).format("DD/MM/YY")}
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(book)}
                        sx={{
                          color: textS,
                          "&:hover": { color: COLOR, background: `${COLOR}10` },
                        }}
                      >
                        <Edit sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => confirmDelete(book)}
                        sx={{
                          color: textS,
                          "&:hover": {
                            color: "#CF4E4E",
                            background: "rgba(207, 78, 78, 0.1)",
                          },
                        }}
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* TAB 1: Reflections Journal */}
      <TabPanel value={tab} index={1}>
        <Box sx={{ maxWidth: 850, mx: "auto" }}>
          <Card
            sx={{
              border: `1px solid ${border}`,
              borderRadius: 4,
              background: cardBg,
              backdropFilter: glassFilter,
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.2)"
                : "0 8px 32px rgba(160,82,45,0.05)",
              mb: 5,
            }}
          >
            <CardContent sx={{ p: "28px !important" }}>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: textP,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  fontFamily: '"Fraunces", serif',
                }}
              >
                <Create sx={{ fontSize: 20, color: COLOR }} /> Write a
                Reflection
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="What timeless wisdom did you uncover today? Document your overarching thoughts..."
                value={newJournal}
                onChange={(e) => setNewJournal(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: isDark
                      ? "rgba(0,0,0,0.2)"
                      : "rgba(255,255,255,0.8)",
                    borderRadius: 2,
                  },
                }}
              />
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}
              >
                <Button
                  variant="contained"
                  onClick={saveJournalEntry}
                  disabled={saving || !newJournal.trim()}
                  sx={{
                    background: COLOR,
                    textTransform: "none",
                    boxShadow: "0 4px 14px rgba(160, 82, 45, 0.4)",
                    borderRadius: 2,
                    fontWeight: 600,
                    "&:hover": { background: "#804020" },
                  }}
                >
                  {saving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Preserve Reflection"
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 4, ml: 2 }}>
            {journalEntries.length === 0 ? (
              <Typography
                textAlign="center"
                color={textS}
                sx={{ fontStyle: "italic", opacity: 0.7 }}
              >
                No reflections yet. Begin your philosophical documentation.
              </Typography>
            ) : (
              journalEntries.map((entry) => (
                <Box
                  key={entry.id}
                  sx={{
                    pl: 4,
                    borderLeft: `2px solid ${COLOR}40`,
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: -7,
                      top: 6,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: COLOR,
                      border: `3px solid ${isDark ? "#1A1916" : "#FCFBF9"}`,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: COLOR,
                      mb: 1,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    {dayjs(entry.entry_date).format("MMMM D, YYYY")}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 16,
                      color: textP,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                      fontFamily: '"Lora", serif',
                    }}
                  >
                    {entry.content}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </TabPanel>

      {/* TAB 2: Up Next */}
      <TabPanel value={tab} index={2}>
        <Grid container spacing={3}>
          {queued.length === 0 ? (
            <Grid item xs={12}>
              <Typography
                textAlign="center"
                color={textS}
                sx={{ fontStyle: "italic", py: 6 }}
              >
                Your reading queue is clear.
              </Typography>
            </Grid>
          ) : (
            queued
              .sort((a, b) => new Date(a.date_added) - new Date(b.date_added))
              .map((book) => (
                <Grid item xs={12} sm={6} md={4} key={book.id}>
                  <Card
                    sx={{
                      border: `1px dashed ${COLOR}60`,
                      borderRadius: 4,
                      background: isDark
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(160, 82, 45, 0.02)",
                      backdropFilter: glassFilter,
                      boxShadow: "none",
                      height: "100%",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: COLOR,
                        background: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(160, 82, 45, 0.05)",
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        p: "24px !important",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: textP,
                          fontFamily: '"Fraunces", serif',
                        }}
                      >
                        {book.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 14,
                          color: textS,
                          mt: 0.5,
                          flexGrow: 1,
                        }}
                      >
                        {book.author}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => {
                          setForm({
                            ...book,
                            status: "reading",
                            started_date: dayjs().format("YYYY-MM-DD"),
                          });
                          setEditBook(book);
                          saveBook();
                        }}
                        sx={{
                          mt: 3,
                          borderColor: COLOR,
                          color: COLOR,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          "&:hover": {
                            borderColor: COLOR,
                            backgroundColor: `${COLOR}10`,
                          },
                        }}
                      >
                        Commence Reading
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
          )}
        </Grid>
      </TabPanel>

      {/* --- Modals --- */}
      {/* 1. Add/Edit Book Dialog */}
      <Dialog
        open={addOpen}
        onClose={() => { setAddOpen(false); resetForm(); setEditBook(null); }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: cardBg,
            backdropFilter: glassFilter,
            border: `1px solid ${border}`,
            boxShadow: isDark
              ? "0 24px 48px rgba(0,0,0,0.5)"
              : "0 24px 48px rgba(160,82,45,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fraunces", serif',
            fontSize: 24,
            fontWeight: 400,
            color: textP,
            pt: 4,
            px: 4,
          }}
        >
          {editBook ? "Refine Documentation" : "Add to Library Archive"}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: border, px: 4, py: 3 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  fontSize: 12,
                  color: COLOR,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  mb: 2,
                }}
              >
                Primary Manuscript Data
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Title"
                  variant="filled"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Author"
                  variant="filled"
                  value={form.author}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, author: e.target.value }))
                  }
                />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl fullWidth variant="filled">
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={form.language}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, language: e.target.value }))
                      }
                    >
                      {LANG_OPTIONS.map((l) => (
                        <MenuItem key={l} value={l}>
                          {l}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth variant="filled">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={form.status}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, status: e.target.value }))
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Pages Read"
                    variant="filled"
                    type="number"
                    value={form.pages_read}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        pages_read: Math.max(0, Number(e.target.value)),
                      }))
                    }
                  />
                  <TextField
                    fullWidth
                    label="Total Pages"
                    variant="filled"
                    type="number"
                    value={form.total_pages}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, total_pages: e.target.value }))
                    }
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  fontSize: 12,
                  color: COLOR,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  mb: 2,
                }}
              >
                Metadata & Annotations
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Genre"
                    variant="filled"
                    value={form.genre || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, genre: e.target.value }))
                    }
                  />
                  <TextField
                    fullWidth
                    label="Shelf Location"
                    variant="filled"
                    value={form.location || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, location: e.target.value }))
                    }
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Condition"
                    variant="filled"
                    value={form.condition || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, condition: e.target.value }))
                    }
                  />
                  <TextField
                    fullWidth
                    label="Price (₹)"
                    variant="filled"
                    type="number"
                    value={form.price || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price: e.target.value }))
                    }
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="filled"
                  label="Running Notes / Summary"
                  value={form.notes || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Daily log summaries will automatically append here."
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3 }}>
          <Button
            onClick={() => { setAddOpen(false); resetForm(); setEditBook(null); }}
            color="inherit"
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveBook}
            disabled={saving || !form.title}
            sx={{
              background: COLOR,
              "&:hover": { background: "#804020" },
              boxShadow: "none",
              textTransform: "none",
              px: 3,
              borderRadius: 2,
            }}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save Record"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Daily Log Progress Dialog */}
      <Dialog
        open={sessionOpen}
        onClose={() => { setSessionOpen(false); setSessionForm({ pages_read: "", summary: "" }); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: cardBg,
            backdropFilter: glassFilter,
            border: `1px solid ${border}`,
            boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fraunces", serif',
            fontSize: 22,
            color: textP,
            pt: 3,
          }}
        >
          Document Session
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: textS,
                fontFamily: '"Lora", serif',
                fontStyle: "italic",
              }}
            >
              Tracking progress for:{" "}
              <strong style={{ color: textP }}>{activeLogBook?.title}</strong>
            </Typography>
            <TextField
              fullWidth
              variant="filled"
              type="number"
              label="Pages Read Today"
              autoFocus
              value={sessionForm.pages_read}
              InputProps={{ inputProps: { min: 1 } }}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, pages_read: e.target.value })
              }
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="filled"
              label="Session Synopsis"
              placeholder="What core ideas were presented in these pages?"
              value={sessionForm.summary}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, summary: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => { setSessionOpen(false); setSessionForm({ pages_read: "", summary: "" }); }}
            color="inherit"
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDailyLog}
            disabled={
              saving ||
              !sessionForm.pages_read ||
              Number(sessionForm.pages_read) <= 0
            }
            sx={{
              background: COLOR,
              "&:hover": { background: "#804020" },
              textTransform: "none",
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Commit Log"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: cardBg,
            backdropFilter: glassFilter,
            border: `1px solid ${border}`,
            boxShadow: "none",
            textAlign: "center",
            p: 2,
          },
        }}
      >
        <DialogTitle
          sx={{ color: textP, fontFamily: '"Fraunces", serif', fontSize: 22 }}
        >
          Remove Manuscript?
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{ color: textS, fontSize: 15, fontFamily: '"Lora", serif' }}
          >
            Are you certain you wish to purge <br />
            <strong style={{ color: textP }}>"{bookToDelete?.title}"</strong>
            <br /> from your library archive? This action is absolute.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            color="inherit"
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={executeDelete}
            variant="contained"
            sx={{
              background: "#CF4E4E",
              "&:hover": { background: "#A03535" },
              textTransform: "none",
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            Remove Permanently
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
