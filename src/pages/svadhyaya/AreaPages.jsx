import { Box, Typography, Card, CardContent, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

// ── IMPORT ACTUAL FUNCTIONAL PAGES ──────────────────────────────────────────
import AnushthanamComponent from "./AnushthanamPage";
import NadamComponent from "./NadamPage";
import ShariramComponent from "./ShariramPage";
import VruttiComponent from "./VruttiPage"; // Replaces old Karma logic
import ArthaComponent from "./ArthaPage";
import VidyaComponent from "./VidyaPage";

// ── SETTINGS PLACEHOLDER (Pending Final Build) ──────────────────────────────
function PlaceholderPage({ title, subtitle, color, emoji }) {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Box
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: 3,
          background: `${color}15`,
          borderLeft: `4px solid ${color}`,
        }}
      >
        <Typography sx={{ fontSize: 28, mb: 0.5 }}>{emoji}</Typography>
        <Typography
          variant="h4"
          sx={{ fontFamily: '"Fraunces", serif', fontWeight: 300, color }}
        >
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
          {subtitle}
        </Typography>
      </Box>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ textAlign: "center", py: 8 }}>
          <Typography
            variant="h6"
            sx={{ fontFamily: '"Fraunces", serif', fontWeight: 300, mb: 1 }}
          >
            Coming in next build
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mb: 3, fontSize: 13, maxWidth: 400, mx: "auto" }}
          >
            The settings module for profile exports, theme customization, and
            grace-mode configuration is currently under development.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/svadhyaya")}
            color="inherit"
            sx={{ borderRadius: 2, px: 4 }}
          >
            Back to Today
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

// ── EXPORTED ROUTE COMPONENTS ────────────────────────────────────────────────
// These functions now return the high-functioning versions we just built.

export function AnushthanamPage() {
  return <AnushthanamComponent />;
}
export function NadamPage() {
  return <NadamComponent />;
}
export function ShariramPage() {
  return <ShariramComponent />;
}
export function ArthaPage() {
  return <ArthaComponent />;
}
export function VidyaPage() {
  return <VidyaComponent />;
}

/**
 * RENAMING NOTE: We are exporting VruttiComponent as 'KarmaPage'
 * to maintain compatibility with your existing React Router paths.
 */
export function KarmaPage() {
  return <VruttiComponent />;
}

export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      subtitle="Profile · Theme · Export · Mode"
      color="#5C5A52"
      emoji="⚙️"
    />
  );
}

export default AnushthanamPage;
