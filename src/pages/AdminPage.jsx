import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Divider,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Delete,
  Add,
  ContentCopy,
  FormatQuote,
  Palette,
  Lock,
  Check,
} from "@mui/icons-material";
import MandalaSVG from "../components/shared/MandalaSVG";
import { QUOTES } from "../lib/quotes";

const ADMIN_EMAIL = "subrahmanyamdaita@gmail.com";
const ADMIN_PIN = "svdai";
const STORAGE_KEY = "sv_admin_quotes";
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
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [tab, setTab] = useState(0);
  const [adminQuotes, setAdminQuotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [copied, setCopied] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");

  const saveAdminQuotes = (list) => {
    setAdminQuotes(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleAddQuotes = () => {
    setJsonError("");
    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      setJsonError("Invalid JSON — check your format.");
      return;
    }
    if (!Array.isArray(parsed)) {
      setJsonError("Must be a JSON array: [ { text, source }, ... ]");
      return;
    }
    const valid = parsed.filter((q) => q.text && q.source);
    if (!valid.length) {
      setJsonError('Each quote needs at minimum "text" and "source" fields.');
      return;
    }
    const next = [...adminQuotes, ...valid];
    saveAdminQuotes(next);
    setJsonInput("");
    setAddSuccess(`${valid.length} quote${valid.length > 1 ? "s" : ""} added.`);
    setTimeout(() => setAddSuccess(""), 3000);
  };

  const handleDelete = (idx) => {
    saveAdminQuotes(adminQuotes.filter((_, i) => i !== idx));
  };

  const handleDeleteAll = () => {
    saveAdminQuotes([]);
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_QUOTE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportAll = () => {
    const all = [...QUOTES, ...adminQuotes];
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "svaadhyaya-quotes.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (user?.email !== ADMIN_EMAIL) return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography sx={{ color: TEXT, fontSize: 14 }}>Access denied.</Typography>
    </Box>
  );

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  const allQuotes = [...QUOTES, ...adminQuotes];

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
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                px: 2,
                "& .MuiTab-root": {
                  fontSize: 12,
                  textTransform: "none",
                  fontWeight: 700,
                  minHeight: 52,
                },
              }}
            >
              <Tab icon={<FormatQuote sx={{ fontSize: 17 }} />} iconPosition="start" label="Quotes" />
              <Tab icon={<Palette sx={{ fontSize: 17 }} />} iconPosition="start" label="Theme tokens" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            {/* ── QUOTES TAB ── */}
            <TabPanel value={tab} index={0}>
              <Typography sx={{ fontSize: 12, color: SUBTEXT, mb: 3, lineHeight: 1.8 }}>
                Quotes added here appear on the Login, Signup, and password pages alongside the built-in library. They're stored in this browser's localStorage — export them to back up.
              </Typography>

              {/* Add quotes */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT, mb: 0.75, textTransform: "uppercase", letterSpacing: 1 }}>
                Add quotes (JSON)
              </Typography>
              <Box sx={{ position: "relative", mb: 1 }}>
                <Box
                  component="pre"
                  sx={{
                    background: "#F4F3EC",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 2,
                    p: 1.5,
                    fontSize: 11,
                    color: SUBTEXT,
                    fontFamily: "monospace",
                    lineHeight: 1.7,
                    mb: 0,
                    overflowX: "auto",
                    whiteSpace: "pre",
                    position: "relative",
                  }}
                >
                  {SAMPLE_QUOTE}
                  <Tooltip title={copied ? "Copied!" : "Copy format"}>
                    <IconButton
                      size="small"
                      onClick={handleCopySample}
                      sx={{ position: "absolute", top: 6, right: 6, color: SUBTEXT }}
                    >
                      {copied ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {jsonError && (
                <Alert severity="error" sx={{ mb: 1.5, fontSize: 12, borderRadius: 2 }} onClose={() => setJsonError("")}>
                  {jsonError}
                </Alert>
              )}
              {addSuccess && (
                <Alert severity="success" sx={{ mb: 1.5, fontSize: 12, borderRadius: 2 }}>
                  {addSuccess}
                </Alert>
              )}

              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder={SAMPLE_QUOTE}
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setJsonError(""); }}
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": {
                    fontFamily: "monospace",
                    fontSize: 12,
                    background: "#FAFAF8",
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddQuotes}
                sx={{
                  background: ACCENT,
                  "&:hover": { background: ACCENT, opacity: 0.88 },
                  boxShadow: "none",
                  textTransform: "none",
                  fontSize: 13,
                  mb: 4,
                }}
              >
                Add to library
              </Button>

              <Divider sx={{ borderColor: BORDER, mb: 3 }} />

              {/* Admin quotes list */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT, textTransform: "uppercase", letterSpacing: 1 }}>
                  Your additions ({adminQuotes.length})
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleExportAll}
                    sx={{ fontSize: 11, textTransform: "none", borderColor: BORDER, color: SUBTEXT }}
                  >
                    Export all quotes
                  </Button>
                  {adminQuotes.length > 0 && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={handleDeleteAll}
                      sx={{ fontSize: 11, textTransform: "none" }}
                    >
                      Clear all
                    </Button>
                  )}
                </Box>
              </Box>

              {adminQuotes.length === 0 ? (
                <Typography sx={{ fontSize: 12, color: SUBTEXT, fontStyle: "italic" }}>
                  No custom quotes yet. Add some above.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {adminQuotes.map((q, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 2,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 2,
                        background: "#FAFAF8",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, color: TEXT, fontFamily: '"Fraunces","Lora",serif', fontStyle: "italic", mb: 0.25 }}>
                          "{q.text}"
                        </Typography>
                        {q.translation && (
                          <Typography sx={{ fontSize: 11, color: SUBTEXT, mb: 0.25 }}>
                            {q.translation}
                          </Typography>
                        )}
                        <Typography sx={{ fontSize: 10, color: SUBTEXT, opacity: 0.75 }}>
                          — {q.source}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => handleDelete(i)} sx={{ color: "#CF4E4E", flexShrink: 0, mt: 0.25 }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              <Divider sx={{ borderColor: BORDER, my: 4 }} />

              {/* Built-in quotes count */}
              <Typography sx={{ fontSize: 12, color: SUBTEXT }}>
                Built-in library: <strong>{QUOTES.length}</strong> quotes &nbsp;·&nbsp; Total active: <strong>{allQuotes.length}</strong>
              </Typography>
            </TabPanel>

            {/* ── THEME TOKENS TAB ── */}
            <TabPanel value={tab} index={1}>
              <Typography sx={{ fontSize: 12, color: SUBTEXT, mb: 3, lineHeight: 1.8 }}>
                These are the pillar colors used across all six life areas. They're constants in the codebase — to change them, edit <code style={{ background: "#F4F3EC", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>src/theme/themeFactory.js</code> and redeploy.
              </Typography>

              {[
                { name: "Anushthanam (spirit)", key: "SPIRIT", value: "#C07830" },
                { name: "Nādam (music)", key: "MUSIC", value: "#7C4DAB" },
                { name: "Sharīram (health)", key: "HEALTH", value: "#2D7A4F" },
                { name: "Artha (finance)", key: "FINANCE", value: "#1A7A6E" },
                { name: "Vṛtti (career)", key: "CAREER", value: "#1A5FB0" },
                { name: "Vidyā (reading)", key: "READING", value: "#A0522D" },
              ].map(({ name, key, value }) => (
                <Box
                  key={key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 1.25,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      background: value,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{name}</Typography>
                    <Typography sx={{ fontSize: 11, color: SUBTEXT, fontFamily: "monospace" }}>{key} = "{value}"</Typography>
                  </Box>
                  <Tooltip title="Copy hex">
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText(value)}
                      sx={{ color: SUBTEXT }}
                    >
                      <ContentCopy sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}

              <Typography sx={{ fontSize: 11, color: SUBTEXT, mt: 3, lineHeight: 1.75 }}>
                User-selectable accent colors (primary/secondary) are managed through Settings → Aesthetics in the app. The pillar colors above are area-specific and set in code.
              </Typography>
            </TabPanel>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
