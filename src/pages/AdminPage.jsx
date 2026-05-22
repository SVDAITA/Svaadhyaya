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
  Check, Edit, Save, Cancel, LibraryBooks, Analytics,
  SwapHoriz, Visibility, VisibilityOff,
} from "@mui/icons-material";
import MandalaSVG from "../components/shared/MandalaSVG";
import { QUOTES } from "../lib/quotes";
import { supabase } from "../lib/supabase";

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
    <Box
      sx={{
        minHeight: "100vh",
        background: BG_LIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 3,
        px: 2,
      }}
    >
      <MandalaSVG size={48} color={ACCENT} />
      <Typography
        sx={{
          fontFamily: '"Fraunces","Lora",serif',
          fontSize: 22,
          fontWeight: 400,
          color: TEXT,
        }}
      >
        Admin access
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <TextField
          size="small"
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          error={error}
          helperText={error ? "Incorrect PIN" : ""}
          sx={{ width: 160 }}
          inputProps={{ style: { textAlign: "center", letterSpacing: 4 } }}
        />
        <Button
          variant="contained"
          onClick={attempt}
          sx={{
            background: ACCENT,
            "&:hover": { background: ACCENT, opacity: 0.88 },
            boxShadow: "none",
            textTransform: "none",
          }}
        >
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
  const [previewIdx, setPreviewIdx] = useState(0);
  const [showBuiltin, setShowBuiltin] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Health state ──
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const loadQuotes = useCallback(async () => {
    setQuotesLoading(true);
    const { data } = await supabase.from("custom_quotes").select("*").order("created_at", { ascending: false });
    setAdminQuotes(data || []);
    setQuotesLoading(false);
  }, []);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

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
  };

  const handleDeleteAll = async () => {
    await supabase.from("custom_quotes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setAdminQuotes([]);
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditForm({ text: q.text, translation: q.translation || "", source: q.source });
  };

  const saveEdit = async () => {
    const { error } = await supabase.from("custom_quotes").update({
      text: editForm.text, translation: editForm.translation || null, source: editForm.source,
    }).eq("id", editingId);
    if (error) return;
    setAdminQuotes((prev) => prev.map((q) => q.id === editingId ? { ...q, ...editForm, translation: editForm.translation || null } : q));
    setEditingId(null);
  };

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

  if (user?.email !== ADMIN_EMAIL) return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography sx={{ color: TEXT, fontSize: 14 }}>Access denied.</Typography>
    </Box>
  );

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  return (
    <Box sx={{ minHeight: "100vh", background: BG_LIGHT }}>
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, md: 5 },
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: `1px solid ${BORDER}`,
          background: "#fff",
        }}
      >
        <MandalaSVG size={28} color={ACCENT} />
        <Typography
          sx={{
            fontFamily: '"Fraunces","Lora",serif',
            fontWeight: 400,
            fontSize: 17,
            color: TEXT,
          }}
        >
          Svaadhyaya Admin
        </Typography>
        <Chip
          label="Owner only"
          size="small"
          sx={{ ml: 1, fontSize: 10, height: 20, background: `${ACCENT}12`, color: ACCENT }}
        />
      </Box>

      <Box sx={{ maxWidth: 820, mx: "auto", p: { xs: 2, md: 4 } }}>
        <Card
          sx={{
            border: `1px solid ${BORDER}`,
            borderRadius: 3,
            background: CARD_BG,
            boxShadow: "none",
          }}
        >
          <Box sx={{ borderBottom: `1px solid ${BORDER}` }}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); if (v === 3 && !healthData) loadHealth(); }}
              sx={{ px: 2, "& .MuiTab-root": { fontSize: 12, textTransform: "none", fontWeight: 700, minHeight: 52 } }}>
              <Tab icon={<FormatQuote sx={{ fontSize: 17 }} />} iconPosition="start" label="Quotes" />
              <Tab icon={<LibraryBooks sx={{ fontSize: 17 }} />} iconPosition="start" label="Built-in library" />
              <Tab icon={<Palette sx={{ fontSize: 17 }} />} iconPosition="start" label="Theme tokens" />
              <Tab icon={<Analytics sx={{ fontSize: 17 }} />} iconPosition="start" label="App health" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>

            {/* ── QUOTES TAB ── */}
            <TabPanel value={tab} index={0}>
              <Typography sx={{ fontSize: 12, color: SUBTEXT, mb: 3, lineHeight: 1.8 }}>
                Custom quotes are stored in the database and appear on every device — Login, Signup, password pages, and anywhere the quote rotator runs.
              </Typography>

              {/* Preview panel */}
              {(adminQuotes.length > 0 || QUOTES.length > 0) && (() => {
                const allQ = [...adminQuotes, ...QUOTES];
                const q = allQ[previewIdx % allQ.length];
                return (
                  <Box sx={{ mb: 3, p: 2.5, borderRadius: 2, background: "linear-gradient(160deg,#EEF2FF 0%,#F0F9FF 100%)", border: `1px solid ${BORDER}`, position: "relative" }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: SUBTEXT, textTransform: "uppercase", mb: 1 }}>Preview</Typography>
                    <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontSize: 15, fontStyle: "italic", color: TEXT, lineHeight: 1.6, mb: 0.5 }}>"{q?.text}"</Typography>
                    {q?.translation && <Typography sx={{ fontSize: 11, color: SUBTEXT, mb: 0.25 }}>{q.translation}</Typography>}
                    <Typography sx={{ fontSize: 11, color: SUBTEXT, opacity: 0.7 }}>— {q?.source}</Typography>
                    <Box sx={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 0.5 }}>
                      <IconButton size="small" onClick={() => setPreviewIdx((i) => (i - 1 + allQ.length) % allQ.length)} sx={{ color: SUBTEXT, fontSize: 12 }}>‹</IconButton>
                      <Typography sx={{ fontSize: 10, color: SUBTEXT, alignSelf: "center" }}>{(previewIdx % allQ.length) + 1}/{allQ.length}</Typography>
                      <IconButton size="small" onClick={() => setPreviewIdx((i) => (i + 1) % allQ.length)} sx={{ color: SUBTEXT, fontSize: 12 }}>›</IconButton>
                    </Box>
                  </Box>
                );
              })()}

              {/* Mode + JSON input */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT, textTransform: "uppercase", letterSpacing: 1 }}>
                  Upload JSON
                </Typography>
                <FormControlLabel
                  control={<Switch size="small" checked={replaceMode} onChange={(e) => setReplaceMode(e.target.checked)} color="error" />}
                  label={<Typography sx={{ fontSize: 12, color: replaceMode ? "#CF4E4E" : SUBTEXT }}>{replaceMode ? "Replace mode — will delete all existing" : "Append mode"}</Typography>}
                  labelPlacement="start"
                />
              </Box>
              <Box component="pre" sx={{ background: "#F4F3EC", border: `1px solid ${BORDER}`, borderRadius: 2, p: 1.5, fontSize: 11, color: SUBTEXT, fontFamily: "monospace", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre", position: "relative", mb: 1 }}>
                {SAMPLE_QUOTE}
                <Tooltip title={copied ? "Copied!" : "Copy format"}>
                  <IconButton size="small" onClick={() => { navigator.clipboard.writeText(SAMPLE_QUOTE); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    sx={{ position: "absolute", top: 6, right: 6, color: SUBTEXT }}>
                    {copied ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
              {jsonError && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12, borderRadius: 2 }} onClose={() => setJsonError("")}>{jsonError}</Alert>}
              {addSuccess && <Alert severity="success" sx={{ mb: 1.5, fontSize: 12, borderRadius: 2 }}>{addSuccess}</Alert>}
              <TextField fullWidth multiline rows={5} placeholder={SAMPLE_QUOTE} value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setJsonError(""); }}
                sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { fontFamily: "monospace", fontSize: 12, background: "#FAFAF8" } }} />
              <Button variant="contained" startIcon={replaceMode ? <SwapHoriz /> : <Add />} onClick={handleAddQuotes}
                sx={{ background: replaceMode ? "#CF4E4E" : ACCENT, "&:hover": { background: replaceMode ? "#B03030" : ACCENT, opacity: 0.88 }, boxShadow: "none", textTransform: "none", fontSize: 13, mb: 4 }}>
                {replaceMode ? "Replace library" : "Add to library"}
              </Button>

              <Divider sx={{ borderColor: BORDER, mb: 3 }} />

              {/* Custom quotes list */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT, textTransform: "uppercase", letterSpacing: 1 }}>
                  Custom quotes ({adminQuotes.length})
                </Typography>
                {adminQuotes.length > 0 && (
                  <Button size="small" color="error" variant="outlined" onClick={handleDeleteAll} sx={{ fontSize: 11, textTransform: "none" }}>
                    Clear all
                  </Button>
                )}
              </Box>

              {quotesLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><CircularProgress size={14} /><Typography sx={{ fontSize: 12, color: SUBTEXT }}>Loading…</Typography></Box>
              ) : adminQuotes.length === 0 ? (
                <Typography sx={{ fontSize: 12, color: SUBTEXT, fontStyle: "italic" }}>No custom quotes yet.</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {adminQuotes.map((q) => (
                    <Box key={q.id} sx={{ p: 2, border: `1px solid ${editingId === q.id ? ACCENT : BORDER}`, borderRadius: 2, background: editingId === q.id ? "#F0F4FF" : "#FAFAF8" }}>
                      {editingId === q.id ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <TextField size="small" label="Quote text" fullWidth value={editForm.text} onChange={(e) => setEditForm((f) => ({ ...f, text: e.target.value }))} multiline rows={2} />
                          <TextField size="small" label="Translation (optional)" fullWidth value={editForm.translation} onChange={(e) => setEditForm((f) => ({ ...f, translation: e.target.value }))} />
                          <TextField size="small" label="Source" fullWidth value={editForm.source} onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))} />
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Button size="small" startIcon={<Cancel sx={{ fontSize: 14 }} />} onClick={() => setEditingId(null)} sx={{ textTransform: "none", fontSize: 12 }}>Cancel</Button>
                            <Button size="small" variant="contained" startIcon={<Save sx={{ fontSize: 14 }} />} onClick={saveEdit}
                              sx={{ background: ACCENT, textTransform: "none", fontSize: 12, boxShadow: "none" }}>Save</Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, color: TEXT, fontFamily: '"Fraunces","Lora",serif', fontStyle: "italic", mb: 0.25 }}>"{q.text}"</Typography>
                            {q.translation && <Typography sx={{ fontSize: 11, color: SUBTEXT, mb: 0.25 }}>{q.translation}</Typography>}
                            <Typography sx={{ fontSize: 10, color: SUBTEXT, opacity: 0.75 }}>— {q.source}</Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => startEdit(q)} sx={{ color: ACCENT }}><Edit sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(q.id)} sx={{ color: "#CF4E4E" }}><Delete sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              <Divider sx={{ borderColor: BORDER, my: 3 }} />
              <Typography sx={{ fontSize: 12, color: SUBTEXT }}>
                Built-in: <strong>{QUOTES.length}</strong> · Custom: <strong>{adminQuotes.length}</strong> · Total: <strong>{QUOTES.length + adminQuotes.length}</strong>
              </Typography>
            </TabPanel>

            {/* ── BUILT-IN LIBRARY TAB ── */}
            <TabPanel value={tab} index={1}>
              <Typography sx={{ fontSize: 12, color: SUBTEXT, mb: 3, lineHeight: 1.8 }}>
                These {QUOTES.length} quotes are hardcoded in <code style={{ background: "#F4F3EC", padding: "2px 5px", borderRadius: 3, fontFamily: "monospace" }}>src/lib/quotes.js</code>. Read-only — to change them, edit the source and redeploy.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {QUOTES.map((q, i) => (
                  <Box key={i} sx={{ p: 1.75, border: `1px solid ${BORDER}`, borderRadius: 2, background: "#FAFAF8", display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Typography sx={{ fontSize: 11, color: SUBTEXT, minWidth: 24, mt: 0.1 }}>#{i + 1}</Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, color: TEXT, fontFamily: '"Fraunces","Lora",serif', fontStyle: "italic", mb: 0.2 }}>"{q.text}"</Typography>
                      {q.translation && <Typography sx={{ fontSize: 11, color: SUBTEXT, mb: 0.2 }}>{q.translation}</Typography>}
                      <Typography sx={{ fontSize: 10, color: SUBTEXT, opacity: 0.7 }}>— {q.source}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </TabPanel>

            {/* ── THEME TOKENS TAB ── */}
            <TabPanel value={tab} index={2}>
              <Typography sx={{ fontSize: 12, color: SUBTEXT, mb: 3, lineHeight: 1.8 }}>
                Pillar colors for the six life areas. Constants in the codebase — edit <code style={{ background: "#F4F3EC", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>src/theme/themeFactory.js</code> and redeploy to change.
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
            <TabPanel value={tab} index={3}>
              <Typography sx={{ fontSize: 12, color: SUBTEXT, mb: 3, lineHeight: 1.8 }}>
                Live row counts from the database. Useful for verifying migrations ran and data is accumulating correctly.
              </Typography>
              {healthLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><CircularProgress size={16} /><Typography sx={{ fontSize: 12, color: SUBTEXT }}>Querying tables…</Typography></Box>
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
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, color: TEXT, borderColor: BORDER }}>Row count</TableCell>
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

          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
