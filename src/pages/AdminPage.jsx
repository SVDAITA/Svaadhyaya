import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  Box, Typography, TextField, Button, Card, CardContent,
  IconButton, Tabs, Tab, Alert, Divider, Chip, Tooltip,
  CircularProgress, Switch, FormControlLabel, Table,
  TableBody, TableCell, TableRow, TableHead,
} from "@mui/material";
import {
  Delete, Add, ContentCopy, FormatQuote, Palette, Lock,
  Check, Edit, Save, Cancel, Analytics,
  SwapHoriz, People, Refresh,
} from "@mui/icons-material";
import MandalaSVG from "../components/shared/MandalaSVG";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";

const ADMIN_EMAIL = "subrahmanyamdaita@gmail.com";
const ADMIN_PIN = "svdai";
const SESSION_KEY = "sv_admin_unlocked";

const BG_LIGHT = "#F8FAFC";
const CARD_BG = "#ffffff";
const TEXT = "#0f172a";
const SUBTEXT = "#475569";
const BORDER = "#E2E8F0";
const ACCENT = "#1e3a8a";

const SAMPLE_QUOTE = `[
  {
    "text": "Your Sanskrit or English quote here.",
    "translation": "Optional English translation.",
    "source": "Source · Context"
  }
]`;

function TabPanel({ children, value, index }) {
  return (
    <Box hidden={value !== index} sx={{ mt: 3 }}>
      {value === index && children}
    </Box>
  );
}

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const attempt = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: BG_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 3, px: 2 }}>
      <MandalaSVG size={48} color={ACCENT} />
      <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontSize: 22, fontWeight: 400, color: TEXT }}>
        Admin access
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <TextField
          size="small" type="password" placeholder="PIN"
          value={pin} onChange={(e) => { setPin(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          error={error} helperText={error ? "Incorrect PIN" : ""}
          sx={{ width: 160 }} inputProps={{ style: { textAlign: "center", letterSpacing: 4 } }}
        />
        <Button variant="contained" onClick={attempt}
          sx={{ background: ACCENT, "&:hover": { background: ACCENT, opacity: 0.88 }, boxShadow: "none", textTransform: "none" }}>
          <Lock sx={{ fontSize: 16 }} />
        </Button>
      </Box>
    </Box>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [tab, setTab] = useState(0);

  // ── Quotes state ──
  const [adminQuotes, setAdminQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [replaceMode, setReplaceMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ text: "", translation: "", source: "" });
  const [singleForm, setSingleForm] = useState({ text: "", translation: "", source: "" });
  const [singleSaving, setSingleSaving] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  // ── Health state ──
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // ── Users state ──
  const [usersData, setUsersData] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // ── Load quotes ──
  const loadQuotes = useCallback(async () => {
    setQuotesLoading(true);
    const { data } = await supabase.from("custom_quotes").select("*").order("created_at", { ascending: false });
    setAdminQuotes(data || []);
    setQuotesLoading(false);
  }, []);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  // ── Quote handlers ──
  const handleAddQuotes = async () => {
    setJsonError("");
    let parsed;
    try { parsed = JSON.parse(jsonInput); }
    catch { setJsonError("Invalid JSON — check your format."); return; }
    if (!Array.isArray(parsed)) { setJsonError("Must be a JSON array: [ { text, source }, ... ]"); return; }
    const valid = parsed.filter((q) => q.text && q.source).map(({ text, translation, source }) => ({ text, translation: translation || null, source }));
    if (!valid.length) { setJsonError('Each quote needs "text" and "source" fields.'); return; }
    if (replaceMode) {
      await supabase.from("custom_quotes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    const { error } = await supabase.from("custom_quotes").insert(valid);
    if (error) { setJsonError("Save failed: " + error.message); return; }
    await loadQuotes();
    setJsonInput("");
    setAddSuccess(`${valid.length} quote${valid.length > 1 ? "s" : ""} ${replaceMode ? "replaced library" : "added"}.`);
    setTimeout(() => setAddSuccess(""), 3000);
  };

  const handleDelete = async (id) => {
    await supabase.from("custom_quotes").delete().eq("id", id);
    setAdminQuotes((prev) => prev.filter((q) => q.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete all custom quotes? This cannot be undone.")) return;
    await supabase.from("custom_quotes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setAdminQuotes([]);
  };

  const handleAddSingle = async () => {
    if (!singleForm.text.trim() || !singleForm.source.trim()) return;
    setSingleSaving(true);
    const { data: newQ, error } = await supabase.from("custom_quotes").insert({
      text: singleForm.text.trim(),
      translation: singleForm.translation.trim() || null,
      source: singleForm.source.trim(),
    }).select().single();
    if (!error && newQ) {
      setAdminQuotes((prev) => [newQ, ...prev]);
      setSingleForm({ text: "", translation: "", source: "" });
      setAddSuccess("Quote added.");
      setTimeout(() => setAddSuccess(""), 3000);
    }
    setSingleSaving(false);
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditForm({ text: q.text, translation: q.translation || "", source: q.source });
  };

  const saveEdit = async () => {
    const { error } = await supabase.from("custom_quotes").update({
      text: editForm.text.trim(),
      translation: editForm.translation.trim() || null,
      source: editForm.source.trim(),
    }).eq("id", editingId);
    if (error) return;
    setAdminQuotes((prev) => prev.map((q) =>
      q.id === editingId ? { ...q, text: editForm.text.trim(), translation: editForm.translation.trim() || null, source: editForm.source.trim() } : q
    ));
    setEditingId(null);
  };

  // ── Health ──
  const loadHealth = async () => {
    setHealthLoading(true);
    const tables = ["days", "lakshyas", "siddhis", "anshs", "custom_quotes", "books", "vidya_courses", "naada_courses", "vritti_projects", "daily_activity", "vidya_study_log"];
    const results = await Promise.all(
      tables.map(async (t) => {
        const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
        return { table: t, count: error ? "—" : count };
      })
    );
    setHealthData(results);
    setHealthLoading(false);
  };

  // ── Users ──
  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    const { data, error } = await supabase.rpc("get_users_admin");
    if (error) {
      setUsersError(error.message);
    } else {
      setUsersData(data || []);
    }
    setUsersLoading(false);
  };

  const handleTabChange = (_, v) => {
    setTab(v);
    if (v === 2 && !healthData) loadHealth();
    if (v === 3 && !usersData) loadUsers();
  };

  if (user?.email !== ADMIN_EMAIL) return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography sx={{ color: TEXT, fontSize: 14 }}>Access denied.</Typography>
    </Box>
  );

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  return (
    <Box sx={{ minHeight: "100vh", background: BG_LIGHT }}>
      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 5 }, py: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: `1px solid ${BORDER}`, background: "#fff" }}>
        <MandalaSVG size={28} color={ACCENT} />
        <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 400, fontSize: 17, color: TEXT }}>
          Svaadhyaya Admin
        </Typography>
        <Chip label="Owner only" size="small" sx={{ ml: 1, fontSize: 10, height: 20, background: `${ACCENT}12`, color: ACCENT }} />
      </Box>

      <Box sx={{ maxWidth: 860, mx: "auto", p: { xs: 2, md: 4 } }}>
        <Card sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, background: CARD_BG, boxShadow: "none" }}>
          <Box sx={{ borderBottom: `1px solid ${BORDER}` }}>
            <Tabs value={tab} onChange={handleTabChange}
              variant="scrollable" scrollButtons="auto"
              sx={{ px: 2, "& .MuiTab-root": { fontSize: 12, textTransform: "none", fontWeight: 700, minHeight: 52 } }}>
              <Tab icon={<FormatQuote sx={{ fontSize: 17 }} />} iconPosition="start" label="Quotes" />
              <Tab icon={<Palette sx={{ fontSize: 17 }} />} iconPosition="start" label="Theme tokens" />
              <Tab icon={<Analytics sx={{ fontSize: 17 }} />} iconPosition="start" label="App health" />
              <Tab icon={<People sx={{ fontSize: 17 }} />} iconPosition="start" label="Users" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>

            {/* ── QUOTES TAB ── */}
            <TabPanel value={tab} index={0}>
              <Typography sx={{ fontSize: 12, color: SUBTEXT, mb: 3, lineHeight: 1.8 }}>
                Custom quotes are stored in the database and appear on every device — Login, Signup, password pages, and the daily quote on Today.
              </Typography>

              {/* Preview panel */}
              {adminQuotes.length > 0 && (() => {
                const q = adminQuotes[previewIdx % adminQuotes.length];
                return (
                  <Box sx={{ mb: 3, p: 2.5, borderRadius: 2, background: "linear-gradient(160deg,#EEF2FF 0%,#F0F9FF 100%)", border: `1px solid ${BORDER}`, position: "relative" }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: SUBTEXT, textTransform: "uppercase", mb: 1 }}>Preview</Typography>
                    <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontSize: 15, fontStyle: "italic", color: TEXT, lineHeight: 1.6, mb: 0.5 }}>"{q?.text}"</Typography>
                    {q?.translation && <Typography sx={{ fontSize: 11, color: SUBTEXT, mb: 0.25 }}>{q.translation}</Typography>}
                    <Typography sx={{ fontSize: 11, color: SUBTEXT, opacity: 0.7 }}>— {q?.source}</Typography>
                    <Box sx={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 0.5, alignItems: "center" }}>
                      <IconButton size="small" onClick={() => setPreviewIdx((i) => (i - 1 + adminQuotes.length) % adminQuotes.length)} sx={{ color: SUBTEXT }}>‹</IconButton>
                      <Typography sx={{ fontSize: 10, color: SUBTEXT }}>{(previewIdx % adminQuotes.length) + 1}/{adminQuotes.length}</Typography>
                      <IconButton size="small" onClick={() => setPreviewIdx((i) => (i + 1) % adminQuotes.length)} sx={{ color: SUBTEXT }}>›</IconButton>
                    </Box>
                  </Box>
                );
              })()}

              {/* ── Add a quote ── */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT, textTransform: "uppercase", letterSpacing: 1, mb: 1.5 }}>
                Add a quote
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 1.5 }}>
                <TextField size="small" fullWidth label="Quote text *" multiline rows={2}
                  value={singleForm.text} onChange={(e) => setSingleForm((f) => ({ ...f, text: e.target.value }))}
                  placeholder="Enter the quote…" />
                <TextField size="small" fullWidth label="Translation (optional)"
                  value={singleForm.translation} onChange={(e) => setSingleForm((f) => ({ ...f, translation: e.target.value }))}
                  placeholder="English meaning if Sanskrit" />
                <TextField size="small" fullWidth label="Source *"
                  value={singleForm.source} onChange={(e) => setSingleForm((f) => ({ ...f, source: e.target.value }))}
                  placeholder="e.g. Bhagavad Gita 2.50" />
              </Box>
              {addSuccess && <Alert severity="success" sx={{ mb: 1.5, fontSize: 12, borderRadius: 2 }}>{addSuccess}</Alert>}
              <Button variant="contained"
                startIcon={singleSaving ? <CircularProgress size={14} color="inherit" /> : <Add />}
                onClick={handleAddSingle}
                disabled={!singleForm.text.trim() || !singleForm.source.trim() || singleSaving}
                sx={{ background: ACCENT, "&:hover": { background: ACCENT, opacity: 0.88 }, boxShadow: "none", textTransform: "none", fontSize: 13, mb: 4 }}>
                Add quote
              </Button>

              <Divider sx={{ borderColor: BORDER, mb: 3 }} />

              {/* ── Bulk upload ── */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT, textTransform: "uppercase", letterSpacing: 1 }}>
                  Bulk upload (JSON)
                </Typography>
                <FormControlLabel
                  control={<Switch size="small" checked={replaceMode} onChange={(e) => setReplaceMode(e.target.checked)} color="error" />}
                  label={<Typography sx={{ fontSize: 12, color: replaceMode ? "#CF4E4E" : SUBTEXT }}>{replaceMode ? "Replace mode — deletes all existing first" : "Append mode"}</Typography>}
                  labelPlacement="start"
                />
              </Box>
              <Box component="pre" sx={{ background: "#F4F3EC", border: `1px solid ${BORDER}`, borderRadius: 2, p: 1.5, fontSize: 11, color: SUBTEXT, fontFamily: "monospace", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre", position: "relative", mb: 1 }}>
                {SAMPLE_QUOTE}
                <Tooltip title={copied ? "Copied!" : "Copy format"}>
                  <IconButton size="small"
                    onClick={() => { navigator.clipboard.writeText(SAMPLE_QUOTE); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    sx={{ position: "absolute", top: 6, right: 6, color: SUBTEXT }}>
                    {copied ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
              {jsonError && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12, borderRadius: 2 }} onClose={() => setJsonError("")}>{jsonError}</Alert>}
              <TextField fullWidth multiline rows={5} placeholder={SAMPLE_QUOTE} value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setJsonError(""); }}
                sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { fontFamily: "monospace", fontSize: 12, background: "#FAFAF8" } }} />
              <Button variant="contained" startIcon={replaceMode ? <SwapHoriz /> : <Add />} onClick={handleAddQuotes}
                sx={{ background: replaceMode ? "#CF4E4E" : ACCENT, "&:hover": { background: replaceMode ? "#B03030" : ACCENT, opacity: 0.88 }, boxShadow: "none", textTransform: "none", fontSize: 13, mb: 4 }}>
                {replaceMode ? "Replace library" : "Add to library"}
              </Button>

              <Divider sx={{ borderColor: BORDER, mb: 3 }} />

              {/* ── Custom quotes list ── */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT, textTransform: "uppercase", letterSpacing: 1 }}>
                  Custom quotes ({adminQuotes.length})
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Refresh list">
                    <IconButton size="small" onClick={loadQuotes} sx={{ color: SUBTEXT }}>
                      <Refresh sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  {adminQuotes.length > 0 && (
                    <Button size="small" color="error" variant="outlined" onClick={handleDeleteAll} sx={{ fontSize: 11, textTransform: "none" }}>
                      Clear all
                    </Button>
                  )}
                </Box>
              </Box>

              {quotesLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={14} />
                  <Typography sx={{ fontSize: 12, color: SUBTEXT }}>Loading…</Typography>
                </Box>
              ) : adminQuotes.length === 0 ? (
                <Box sx={{ p: 2.5, border: `1px dashed ${BORDER}`, borderRadius: 2, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 12, color: SUBTEXT, fontStyle: "italic", mb: 0.5 }}>No custom quotes yet.</Typography>
                  <Typography sx={{ fontSize: 11, color: SUBTEXT, opacity: 0.7 }}>Use the form above to add your first quote. Edit and delete buttons appear on each card.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {adminQuotes.map((q) => (
                    <Box key={q.id} sx={{ p: 2, border: `1px solid ${editingId === q.id ? ACCENT : BORDER}`, borderRadius: 2, background: editingId === q.id ? "#F0F4FF" : "#FAFAF8", transition: "border-color 0.15s" }}>
                      {editingId === q.id ? (
                        /* ── inline edit form ── */
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <TextField size="small" label="Quote text" fullWidth multiline rows={2}
                            value={editForm.text} onChange={(e) => setEditForm((f) => ({ ...f, text: e.target.value }))} autoFocus />
                          <TextField size="small" label="Translation (optional)" fullWidth
                            value={editForm.translation} onChange={(e) => setEditForm((f) => ({ ...f, translation: e.target.value }))} />
                          <TextField size="small" label="Source" fullWidth
                            value={editForm.source} onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))} />
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 0.5 }}>
                            <Button size="small" startIcon={<Cancel sx={{ fontSize: 14 }} />} onClick={() => setEditingId(null)}
                              sx={{ textTransform: "none", fontSize: 12 }}>
                              Cancel
                            </Button>
                            <Button size="small" variant="contained" startIcon={<Save sx={{ fontSize: 14 }} />} onClick={saveEdit}
                              disabled={!editForm.text.trim() || !editForm.source.trim()}
                              sx={{ background: ACCENT, textTransform: "none", fontSize: 12, boxShadow: "none" }}>
                              Save
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        /* ── display row ── */
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, color: TEXT, fontFamily: '"Fraunces","Lora",serif', fontStyle: "italic", mb: 0.25, lineHeight: 1.55 }}>
                              "{q.text}"
                            </Typography>
                            {q.translation && (
                              <Typography sx={{ fontSize: 11, color: SUBTEXT, mb: 0.25 }}>{q.translation}</Typography>
                            )}
                            <Typography sx={{ fontSize: 10, color: SUBTEXT, opacity: 0.75 }}>— {q.source}</Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                            <Tooltip title="Edit quote">
                              <IconButton size="small" onClick={() => startEdit(q)} sx={{ color: ACCENT, "&:hover": { background: `${ACCENT}12` } }}>
                                <Edit sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete quote">
                              <IconButton size="small" onClick={() => handleDelete(q.id)} sx={{ color: "#CF4E4E", "&:hover": { background: "#FEE2E2" } }}>
                                <Delete sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

            </TabPanel>

            {/* ── THEME TOKENS TAB ── */}
            <TabPanel value={tab} index={1}>
              <Typography sx={{ fontSize: 12, color: SUBTEXT, mb: 3, lineHeight: 1.8 }}>
                Pillar colors for the six life areas. Edit{" "}
                <code style={{ background: "#F4F3EC", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>src/theme/themeFactory.js</code>{" "}
                and redeploy to change.
              </Typography>
              {[
                { name: "Anushthanam (spirit)", key: "SPIRIT", value: "#C07830" },
                { name: "Naada (music)", key: "MUSIC", value: "#7C4DAB" },
                { name: "Shariram (health)", key: "HEALTH", value: "#2D7A4F" },
                { name: "Artha (finance)", key: "FINANCE", value: "#1A7A6E" },
                { name: "Vritti (career)", key: "CAREER", value: "#1A5FB0" },
                { name: "Vidya (learning)", key: "VIDYA", value: "#8B3A2F" },
              ].map(({ name, key, value }) => (
                <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.25, borderBottom: `1px solid ${BORDER}` }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: value, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{name}</Typography>
                    <Typography sx={{ fontSize: 11, color: SUBTEXT, fontFamily: "monospace" }}>{key} = "{value}"</Typography>
                  </Box>
                  <Tooltip title="Copy hex">
                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(value)} sx={{ color: SUBTEXT }}>
                      <ContentCopy sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
              <Typography sx={{ fontSize: 11, color: SUBTEXT, mt: 3, lineHeight: 1.75 }}>
                User accent colors are managed in Settings → Aesthetics. Pillar colors above are area-specific and set in code.
              </Typography>
            </TabPanel>

            {/* ── APP HEALTH TAB ── */}
            <TabPanel value={tab} index={2}>
              <Typography sx={{ fontSize: 12, color: SUBTEXT, mb: 3, lineHeight: 1.8 }}>
                Live row counts from the database. Useful for verifying migrations ran and data is accumulating correctly.
              </Typography>
              {healthLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CircularProgress size={16} />
                  <Typography sx={{ fontSize: 12, color: SUBTEXT }}>Querying tables…</Typography>
                </Box>
              ) : !healthData ? (
                <Button variant="outlined" onClick={loadHealth} sx={{ textTransform: "none", fontSize: 13, borderColor: BORDER, color: SUBTEXT }}>
                  Run health check
                </Button>
              ) : (
                <>
                  <Table size="small" sx={{ mb: 3 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12, color: TEXT, borderColor: BORDER }}>Table</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, color: TEXT, borderColor: BORDER }}>Rows</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12, color: TEXT, borderColor: BORDER }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {healthData.map(({ table, count }) => (
                        <TableRow key={table} sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell sx={{ fontSize: 12, fontFamily: "monospace", color: SUBTEXT, borderColor: BORDER }}>{table}</TableCell>
                          <TableCell align="right" sx={{ fontSize: 13, fontWeight: 700, color: count === "—" ? "#CF4E4E" : TEXT, borderColor: BORDER }}>{count}</TableCell>
                          <TableCell sx={{ borderColor: BORDER }}>
                            {count === "—"
                              ? <Chip label="Error / missing" size="small" sx={{ fontSize: 10, background: "#FEE2E2", color: "#CF4E4E", height: 18 }} />
                              : count === 0
                              ? <Chip label="Empty" size="small" sx={{ fontSize: 10, background: "#FEF3C7", color: "#92400E", height: 18 }} />
                              : <Chip label="OK" size="small" sx={{ fontSize: 10, background: "#DCFCE7", color: "#166534", height: 18 }} />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button size="small" variant="outlined" onClick={loadHealth} sx={{ textTransform: "none", fontSize: 12, borderColor: BORDER, color: SUBTEXT }}>
                    Refresh
                  </Button>
                </>
              )}
            </TabPanel>

            {/* ── USERS TAB ── */}
            <TabPanel value={tab} index={3}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: SUBTEXT, lineHeight: 1.8 }}>
                    All signed-up users. Shows profile name, email, join date, last sign-in, and days logged.
                  </Typography>
                  {usersData && (
                    <Typography sx={{ fontSize: 12, color: SUBTEXT, mt: 0.5 }}>
                      <strong style={{ color: TEXT }}>{usersData.length}</strong> user{usersData.length !== 1 ? "s" : ""} total
                    </Typography>
                  )}
                </Box>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={loadUsers} sx={{ color: SUBTEXT }}>
                    <Refresh sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ mt: 2.5 }}>
                {usersLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={16} />
                    <Typography sx={{ fontSize: 12, color: SUBTEXT }}>Loading users…</Typography>
                  </Box>
                ) : usersError ? (
                  <Box>
                    <Alert severity="error" sx={{ mb: 2, fontSize: 12, borderRadius: 2 }}>
                      {usersError.includes("function") || usersError.includes("exist")
                        ? "Run migration 20260522_admin_users_fn.sql in Supabase SQL editor first."
                        : usersError}
                    </Alert>
                    <Button variant="outlined" onClick={loadUsers} sx={{ textTransform: "none", fontSize: 12, borderColor: BORDER, color: SUBTEXT }}>
                      Retry
                    </Button>
                  </Box>
                ) : !usersData ? (
                  <Button variant="outlined" onClick={loadUsers} sx={{ textTransform: "none", fontSize: 13, borderColor: BORDER, color: SUBTEXT }}>
                    Load users
                  </Button>
                ) : usersData.length === 0 ? (
                  <Typography sx={{ fontSize: 12, color: SUBTEXT, fontStyle: "italic" }}>No users found.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: TEXT, borderColor: BORDER }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: TEXT, borderColor: BORDER }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: TEXT, borderColor: BORDER }}>Joined</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: TEXT, borderColor: BORDER }}>Last seen</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: TEXT, borderColor: BORDER }}>Days logged</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usersData.map((u) => (
                        <TableRow key={u.id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { background: "#F8FAFC" } }}>
                          <TableCell sx={{ fontSize: 13, color: TEXT, fontWeight: 500, borderColor: BORDER }}>
                            {u.full_name || <span style={{ color: SUBTEXT, fontStyle: "italic" }}>—</span>}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: SUBTEXT, fontFamily: "monospace", borderColor: BORDER }}>
                            {u.email}
                            {u.email === ADMIN_EMAIL && (
                              <Chip label="you" size="small" sx={{ ml: 1, fontSize: 9, height: 16, background: `${ACCENT}14`, color: ACCENT }} />
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: SUBTEXT, borderColor: BORDER }}>
                            {u.joined_at ? dayjs(u.joined_at).format("DD MMM YYYY") : "—"}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: SUBTEXT, borderColor: BORDER }}>
                            {u.last_sign_in_at
                              ? (() => {
                                  const diff = dayjs().diff(dayjs(u.last_sign_in_at), "day");
                                  if (diff === 0) return <Chip label="Today" size="small" sx={{ fontSize: 10, height: 18, background: "#DCFCE7", color: "#166534" }} />;
                                  if (diff === 1) return "Yesterday";
                                  if (diff < 7) return `${diff}d ago`;
                                  return dayjs(u.last_sign_in_at).format("DD MMM YYYY");
                                })()
                              : "—"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 13, fontWeight: 700, color: u.days_count > 0 ? TEXT : SUBTEXT, borderColor: BORDER }}>
                            {u.days_count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </TabPanel>

          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
