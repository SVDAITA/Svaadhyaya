import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Divider, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Tabs, Tab, Stack, Pagination, Switch,
  FormControlLabel, ToggleButtonGroup, ToggleButton, Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Add, Delete, Edit, Close, CheckCircle, RadioButtonUnchecked,
  MusicNote, LibraryMusic, Star, StarBorder, MenuBook, People,
  AccountBalance, AutoAwesome, Flag, EmojiEvents, School,
  TrendingUp, TrendingDown, Lightbulb, Mic, Piano,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const NAADA_GOLD   = "#C07830";
const NAADA_DEEP   = "#7A1A2E";
const NAADA_SAFFRON = "#E8851A";

const COMP_TYPES   = ["Krithi","Varnam","Geetam","Padam","Javali","Tillana","Bhajan","Movie","Folk","Fusion","Slokam","Other"];
const COMP_STATUS  = [
  { value: "learning",         label: "Learning",          color: "#4A90E2" },
  { value: "polishing",        label: "Polishing",         color: "#DDA74F" },
  { value: "performance_ready",label: "Performance Ready", color: "#2D7A4F" },
  { value: "archived",         label: "Archived",          color: "#888" },
];
const LANGUAGES    = ["Telugu","Tamil","Sanskrit","Kannada","Hindi","Malayalam","English","Other"];
const CONCERT_TYPES= [
  { value:"performed", label:"Performed 🎤", color: NAADA_GOLD },
  { value:"attended",  label:"Attended 👂",  color: "#4A90E2" },
  { value:"workshop",  label:"Workshop 🎓",  color: "#7C4DAB" },
  { value:"recording", label:"Recording 🎙",  color: NAADA_DEEP },
];
const SKILL_CATS   = ["Raga Alapana","Gamaka","Talam","Voice Range","Theory","Improvisation","Composition","Violin","Piano","Other"];
const INC_CATS     = ["Concert","Teaching","Recording","Grant","Other"];
const EXP_CATS     = ["Guru Dakshina","Instrument","Accessories","Travel","Costume","Venue","Other"];
const MOODS        = ["Sattvik 🌸","Rajasic 🔥","Tamasic 🌑"];
const FREQ_OPTS    = [{ value:"daily",label:"Daily" },{ value:"weekly",label:"Weekly" },{ value:"monthly",label:"Monthly" }];
const DOW          = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const haptic = (ms=8) => { try { if (navigator?.vibrate) navigator.vibrate(ms); } catch(_){} };
const formatINR = (n) => {
  if (!n) return "₹0";
  if (n>=100000) return `₹${(n/100000).toFixed(1)}L`;
  if (n>=1000)   return `₹${(n/1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};
const isVisibleToday = (item) => {
  const t = dayjs();
  if (item.frequency==="daily")   return true;
  if (item.frequency==="weekly")  return t.day()===(item.frequency_day??0);
  if (item.frequency==="monthly") return t.date()===(item.frequency_day??1);
  return true;
};

// ── CACHE ─────────────────────────────────────────────────────────────────────
let _naadaCache = null;

// ── VEENA WATERMARK ───────────────────────────────────────────────────────────
function VeenaBg({ isDark }) {
  const op = isDark ? 0.035 : 0.05;
  const C = NAADA_GOLD;
  // Neck vector from (310,300) to (60,72) — length ~355
  const nLen = Math.sqrt(250*250 + 228*228);
  // Perpendicular unit vector for frets
  const px = 228/nLen, py = -250/nLen;
  const frets = Array.from({length:8},(_,i)=>{
    const t = 0.12 + i*0.10;
    const x = 310 - 250*t, y = 300 - 228*t;
    const hw = 9;
    return <line key={i} x1={x-px*hw} y1={y-py*hw} x2={x+px*hw} y2={y+py*hw} stroke={C} strokeWidth="1" />;
  });
  // 4 strings alongside the neck
  const strings = [[-4,-2],[0,0],[4,2],[8,4]].map(([dx,dy],i)=>(
    <line key={i} x1={310+dx} y1={300+dy} x2={60+dx} y2={72+dy} stroke={C} strokeWidth="0.6" opacity="0.7" />
  ));
  return (
    <svg width="480" height="420" viewBox="0 0 480 420" fill="none"
      style={{position:"absolute",bottom:0,right:0,pointerEvents:"none",opacity:op,zIndex:0}}>
      {/* Main body — large gourd */}
      <ellipse cx="380" cy="345" rx="82" ry="58" stroke={C} strokeWidth="1.5" fill="none" transform="rotate(-18,380,345)" />
      {/* Sound holes */}
      <circle cx="368" cy="336" r="14" stroke={C} strokeWidth="0.8" fill="none" />
      <circle cx="392" cy="358" r="9" stroke={C} strokeWidth="0.8" fill="none" />
      {/* Bridge */}
      <line x1="348" y1="370" x2="408" y2="328" stroke={C} strokeWidth="2" strokeLinecap="round" />
      {/* Neck */}
      <path d="M308 298 L58 70" stroke={C} strokeWidth="7" strokeLinecap="round" />
      {/* Frets */}
      {frets}
      {/* Strings */}
      {strings}
      {/* Small gourd at head */}
      <ellipse cx="50" cy="64" rx="24" ry="17" stroke={C} strokeWidth="1" fill="none" transform="rotate(-42,50,64)" />
      {/* Tuning pegs */}
      {[[-6,-14],[6,-17],[14,-8],[12,4]].map(([dx,dy],i)=>(
        <circle key={i} cx={50+dx} cy={64+dy} r="3.5" stroke={C} strokeWidth="0.8" fill="none" />
      ))}
      {/* Decorative dot on body */}
      <circle cx="380" cy="345" r="5" fill={C} opacity="0.3" />
    </svg>
  );
}

// ── STARS component ───────────────────────────────────────────────────────────
function Stars({ value, onChange, size=18 }) {
  return (
    <Stack direction="row" spacing={0.25}>
      {[1,2,3,4,5].map((n) => (
        <Box key={n} onClick={()=>onChange?.(n)} sx={{ cursor: onChange?"pointer":"default", color: n<=value ? NAADA_GOLD : "#888", fontSize: size, lineHeight:1 }}>
          {n<=value ? "★" : "☆"}
        </Box>
      ))}
    </Stack>
  );
}

// ── STATUS CHIP ───────────────────────────────────────────────────────────────
function StatusChip({ status }) {
  const s = COMP_STATUS.find((x)=>x.value===status) || COMP_STATUS[0];
  return <Chip label={s.label} size="small" sx={{ bgcolor: `${s.color}22`, color: s.color, fontWeight:700, fontSize:10, height:20, border:`1px solid ${s.color}44` }} />;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function NaadaTracker({ embedded = false }) {
  const { user }          = useAuth();
  const { mode }          = useThemeMode();
  const isDark            = mode==="dark";
  const today             = dayjs().format("YYYY-MM-DD");

  const gold   = NAADA_GOLD;
  const textP  = isDark ? "#F0EDE8" : "#1A0800";
  const textS  = isDark ? "#9C8A74" : "#7A5A3A";
  const cardBg = isDark ? "#1C1510" : "#FDFAF5";
  const bdr    = isDark ? `rgba(192,120,48,0.18)` : `rgba(192,120,48,0.25)`;

  // ── GLOBAL STATE ──────────────────────────────────────────────────────────
  const [tab,       setTab]       = useState(0);
  const [loading,   setLoading]   = useState(_naadaCache===null);
  const [snack,     setSnack]     = useState({ open:false, msg:"", sev:"success" });
  const [delDlg,    setDelDlg]    = useState({ open:false, title:"", fn:null });

  const ok  = (msg)       => setSnack({ open:true, msg, sev:"success" });
  const err = (msg)       => setSnack({ open:true, msg, sev:"error" });
  const confirmDel = (title,fn) => { haptic(15); setDelDlg({ open:true, title, fn }); };

  // ── SAADHANA STATE ────────────────────────────────────────────────────────
  const [seqItems,   setSeqItems]   = useState(_naadaCache?.seqItems||[]);
  const [completions,setCompletions]= useState(_naadaCache?.completions||{});
  const [seqDlg,     setSeqDlg]     = useState(false);
  const [seqForm,    setSeqForm]    = useState({ label:"",emoji:"🎵",duration_minutes:"",frequency:"daily",frequency_day:0,order_index:0 });
  const [editSeq,    setEditSeq]    = useState(null);
  const [seqPage,    setSeqPage]    = useState(1);
  const SEQ_PER = 15;

  // ── COMPOSITIONS STATE ────────────────────────────────────────────────────
  const emptyComp = { title:"",composer:"",ragam:"",talam:"Adi",language:"Telugu",type:"Krithi",status:"learning",difficulty:3,lyrics:"",swaras:"",reference_url:"",guru_who_taught:"",date_started:today,date_mastered:"",notes:"" };
  const [comps,      setComps]      = useState(_naadaCache?.comps||[]);
  const [compForm,   setCompForm]   = useState(emptyComp);
  const [editComp,   setEditComp]   = useState(null);
  const [compDlg,    setCompDlg]    = useState(false);
  const [compFilter, setCompFilter] = useState({ status:"all",type:"all",search:"" });
  const [compPage,   setCompPage]   = useState(1);
  const [expandComp, setExpandComp] = useState(null);
  const COMP_PER = 15;

  // ── RAGAS STATE ───────────────────────────────────────────────────────────
  const emptyRaga = { name:"",alias:"",melakarta_number:"",janya_of:"",aarohanam:"",avarohanam:"",vishesa_prayogam:"",similar_ragas:"",mood:"",time_of_day:"",confidence:3,notes:"" };
  const [ragas,    setRagas]    = useState(_naadaCache?.ragas||[]);
  const [ragaForm, setRagaForm] = useState(emptyRaga);
  const [editRaga, setEditRaga] = useState(null);
  const [ragaDlg,  setRagaDlg]  = useState(false);
  const [ragaPage, setRagaPage] = useState(1);
  const [ragaSearch,setRagaSearch]=useState("");
  const RAGA_PER = 12;

  // ── CONCERTS STATE ────────────────────────────────────────────────────────
  const emptyConcert = { title:"",type:"performed",date:today,venue:"",duration_minutes:"",audience_size:"",organizer:"",earnings:"",expenses:"",notes:"" };
  const [concerts,    setConcerts]    = useState(_naadaCache?.concerts||[]);
  const [concertForm, setConcertForm] = useState(emptyConcert);
  const [editConcert, setEditConcert] = useState(null);
  const [concertDlg,  setConcertDlg]  = useState(false);
  const [concertPage, setConcertPage] = useState(1);
  const CONCERT_PER = 10;

  // ── STUDENTS STATE ────────────────────────────────────────────────────────
  const emptyStudent = { name:"",level:"beginner",instrument:"Voice",start_date:today,monthly_fee:"",notes:"",is_active:true };
  const [students,    setStudents]    = useState(_naadaCache?.students||[]);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [editStudent, setEditStudent] = useState(null);
  const [studentDlg,  setStudentDlg]  = useState(false);
  const [studentPage, setStudentPage] = useState(1);
  const STUDENT_PER = 10;

  // ── FINANCE STATE ─────────────────────────────────────────────────────────
  const emptyFin = { date:today,type:"income",category:"Concert",amount:"",description:"" };
  const [finances,   setFinances]   = useState(_naadaCache?.finances||[]);
  const [finForm,    setFinForm]    = useState(emptyFin);
  const [finDlg,     setFinDlg]     = useState(false);
  const [finPage,    setFinPage]    = useState(1);
  const [finFilter,  setFinFilter]  = useState("all");
  const FIN_PER = 20;

  // ── JOURNAL STATE ─────────────────────────────────────────────────────────
  const emptyJ = { date:today,content:"",mood:"Sattvik 🌸",hours_practiced:"",breakthrough:false,guru_feedback:"" };
  const [journals,   setJournals]   = useState(_naadaCache?.journals||[]);
  const [jForm,      setJForm]      = useState(emptyJ);
  const [editJ,      setEditJ]      = useState(null);
  const [jDlg,       setJDlg]       = useState(false);
  const [jPage,      setJPage]      = useState(1);
  const J_PER = 10;

  // ── SKILLS STATE ──────────────────────────────────────────────────────────
  const emptySkill = { category:"Raga Alapana",name:"",proficiency:3,notes:"" };
  const [skills,     setSkills]     = useState(_naadaCache?.skills||[]);
  const [skillForm,  setSkillForm]  = useState(emptySkill);
  const [editSkill,  setEditSkill]  = useState(null);
  const [skillDlg,   setSkillDlg]   = useState(false);
  const [skillPage,  setSkillPage]  = useState(1);
  const SKILL_PER = 20;

  // ── LOAD ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    if (_naadaCache !== null && _naadaCache._date === today) return; // cache warm for today
    setLoading(true);
    try {
      const [seqR,compR,compR2,ragaR,concertR,studentR,finR,jR,skillR] = await Promise.all([
        supabase.from("naada_sequence_items").select("*").eq("user_id",user.id).order("order_index"),
        supabase.from("naada_sequence_completions").select("*").eq("user_id",user.id).eq("completion_date",today),
        supabase.from("naada_compositions").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("naada_ragas").select("*").eq("user_id",user.id).order("name"),
        supabase.from("naada_concerts").select("*").eq("user_id",user.id).order("date",{ascending:false}),
        supabase.from("naada_students").select("*").eq("user_id",user.id).order("name"),
        supabase.from("naada_finance").select("*").eq("user_id",user.id).order("date",{ascending:false}),
        supabase.from("naada_journal").select("*").eq("user_id",user.id).order("date",{ascending:false}),
        supabase.from("naada_skills").select("*").eq("user_id",user.id).order("category"),
      ]);
      const seqData   = seqR.data  ||[];
      const compMap   = Object.fromEntries((compR.data||[]).map((c)=>[c.naada_item_id,c.is_completed]));
      const compData  = compR2.data||[];
      const ragaData  = ragaR.data ||[];
      const cData     = concertR.data||[];
      const stuData   = studentR.data||[];
      const finData   = finR.data  ||[];
      const jData     = jR.data    ||[];
      const skillData = skillR.data||[];
      _naadaCache = { _date:today,seqItems:seqData,completions:compMap,comps:compData,ragas:ragaData,concerts:cData,students:stuData,finances:finData,journals:jData,skills:skillData };
      setSeqItems(seqData);
      setCompletions(compMap);
      setComps(compData);
      setRagas(ragaData);
      setConcerts(cData);
      setStudents(stuData);
      setFinances(finData);
      setJournals(jData);
      setSkills(skillData);
    } finally { setLoading(false); }
  },[user,today]);

  useEffect(() => { load(); },[load]);

  // ── SAADHANA CRUD ─────────────────────────────────────────────────────────
  const toggleCompletion = async (itemId) => {
    haptic(8);
    const isDone = !completions[itemId];
    const newComp = { ...completions,[itemId]:isDone };
    setCompletions(newComp);
    await supabase.from("naada_sequence_completions").upsert(
      { user_id:user.id,naada_item_id:itemId,completion_date:today,is_completed:isDone },
      { onConflict:"user_id,naada_item_id,completion_date" }
    );
    const visible = seqItems.filter(isVisibleToday);
    const allDone = visible.length>0 && visible.every((s)=>newComp[s.id]);
    const { data:dayRow } = await supabase.from("days").select("habits").eq("user_id",user.id).eq("day_date",today).maybeSingle();
    await supabase.from("days").upsert(
      { user_id:user.id,day_date:today,habits:{ ...(dayRow?.habits||{}),saadhana:allDone } },
      { onConflict:"user_id,day_date" }
    );
    if (allDone) ok("🎵 Naada Saadhana complete for today!");
  };

  const saveSeqItem = async () => {
    if (!seqForm.label.trim()) return;
    const maxIdx = seqItems.reduce((m,s)=>Math.max(m,s.order_index||0),0);
    const seqPayload = { ...seqForm, duration_minutes: seqForm.duration_minutes !== "" ? Number(seqForm.duration_minutes) : null };
    if (editSeq) {
      const { error } = await supabase.from("naada_sequence_items").update(seqPayload).eq("id",editSeq.id);
      if (error) { err("Failed to save"); return; }
    } else {
      const { error } = await supabase.from("naada_sequence_items").insert({ ...seqPayload,user_id:user.id,order_index:maxIdx+1 });
      if (error) { err("Failed to save"); return; }
    }
    ok(editSeq?"Updated":"Added");
    setSeqDlg(false); setEditSeq(null);
    setSeqForm({ label:"",emoji:"🎵",duration_minutes:"",frequency:"daily",frequency_day:0,order_index:0 });
    _naadaCache=null; load();
  };

  const deleteSeqItem = async (id) => {
    await supabase.from("naada_sequence_items").delete().eq("id",id);
    ok("Removed"); _naadaCache=null; load();
  };

  // ── COMPOSITION CRUD ──────────────────────────────────────────────────────
  const saveComp = async () => {
    if (!compForm.title.trim()) { err("Title required"); return; }
    const compPayload = { ...compForm, date_started: compForm.date_started || null, date_mastered: compForm.date_mastered || null };
    if (editComp) {
      const { error } = await supabase.from("naada_compositions").update(compPayload).eq("id",editComp.id);
      if (error) { err("Failed to save"); return; }
    } else {
      const { error } = await supabase.from("naada_compositions").insert({ ...compPayload,user_id:user.id });
      if (error) { err("Failed to save"); return; }
    }
    ok(editComp?"Updated":"Added composition");
    setCompDlg(false); setEditComp(null); setCompForm(emptyComp);
    _naadaCache=null; load();
  };

  const deleteComp = async (id) => {
    await supabase.from("naada_compositions").delete().eq("id",id);
    ok("Removed"); _naadaCache=null; load();
  };

  // ── RAGA CRUD ─────────────────────────────────────────────────────────────
  const saveRaga = async () => {
    if (!ragaForm.name.trim()) { err("Raga name required"); return; }
    const ragaPayload = { ...ragaForm, melakarta_number: ragaForm.melakarta_number !== "" ? Number(ragaForm.melakarta_number) : null };
    if (editRaga) {
      const { error } = await supabase.from("naada_ragas").update(ragaPayload).eq("id",editRaga.id);
      if (error) { err("Failed to save"); return; }
    } else {
      const { error } = await supabase.from("naada_ragas").insert({ ...ragaPayload,user_id:user.id });
      if (error) { err("Raga may already exist"); return; }
    }
    ok(editRaga?"Updated":"Added raga");
    setRagaDlg(false); setEditRaga(null); setRagaForm(emptyRaga);
    _naadaCache=null; load();
  };

  const deleteRaga = async (id) => {
    await supabase.from("naada_ragas").delete().eq("id",id);
    ok("Removed"); _naadaCache=null; load();
  };

  // ── CONCERT CRUD ──────────────────────────────────────────────────────────
  const saveConcert = async () => {
    if (!concertForm.title.trim()) { err("Title required"); return; }
    const concertPayload = {
      ...concertForm,
      duration_minutes: concertForm.duration_minutes !== "" ? Number(concertForm.duration_minutes) : null,
      audience_size:    concertForm.audience_size    !== "" ? Number(concertForm.audience_size)    : null,
      earnings:         concertForm.earnings         !== "" ? Number(concertForm.earnings)         : null,
      expenses:         concertForm.expenses         !== "" ? Number(concertForm.expenses)         : null,
    };
    if (editConcert) {
      const { error } = await supabase.from("naada_concerts").update(concertPayload).eq("id",editConcert.id);
      if (error) { err("Failed to save"); return; }
    } else {
      const { error } = await supabase.from("naada_concerts").insert({ ...concertPayload,user_id:user.id });
      if (error) { err("Failed to save"); return; }
    }
    ok(editConcert?"Updated":"Added");
    setConcertDlg(false); setEditConcert(null); setConcertForm(emptyConcert);
    _naadaCache=null; load();
  };

  const deleteConcert = async (id) => {
    await supabase.from("naada_concerts").delete().eq("id",id);
    ok("Removed"); _naadaCache=null; load();
  };

  // ── STUDENT CRUD ──────────────────────────────────────────────────────────
  const saveStudent = async () => {
    if (!studentForm.name.trim()) { err("Name required"); return; }
    const studentPayload = { ...studentForm, monthly_fee: studentForm.monthly_fee !== "" ? Number(studentForm.monthly_fee) : null };
    if (editStudent) {
      const { error } = await supabase.from("naada_students").update(studentPayload).eq("id",editStudent.id);
      if (error) { err("Failed to save"); return; }
    } else {
      const { error } = await supabase.from("naada_students").insert({ ...studentPayload,user_id:user.id });
      if (error) { err("Failed to save"); return; }
    }
    ok(editStudent?"Updated":"Added student");
    setStudentDlg(false); setEditStudent(null); setStudentForm(emptyStudent);
    _naadaCache=null; load();
  };

  const deleteStudent = async (id) => {
    await supabase.from("naada_students").delete().eq("id",id);
    ok("Removed"); _naadaCache=null; load();
  };

  // ── FINANCE CRUD ──────────────────────────────────────────────────────────
  const saveFinance = async () => {
    if (!finForm.amount||parseFloat(finForm.amount)<=0) { err("Valid amount required"); return; }
    const { error } = await supabase.from("naada_finance").insert({ ...finForm,user_id:user.id,amount:parseFloat(finForm.amount) });
    if (error) { err("Failed to save"); return; }
    ok("Logged");
    setFinDlg(false); setFinForm(emptyFin);
    _naadaCache=null; load();
  };

  const deleteFinance = async (id) => {
    await supabase.from("naada_finance").delete().eq("id",id);
    ok("Removed"); _naadaCache=null; load();
  };

  // ── JOURNAL CRUD ──────────────────────────────────────────────────────────
  const saveJournal = async () => {
    if (!jForm.content.trim() && !jForm.hours_practiced) { err("Add content or hours"); return; }
    const payload = { ...jForm, hours_practiced: jForm.hours_practiced?parseFloat(jForm.hours_practiced):null };
    if (editJ) {
      const { error } = await supabase.from("naada_journal").update(payload).eq("id",editJ.id);
      if (error) { err("Failed to save"); return; }
    } else {
      const { error } = await supabase.from("naada_journal").upsert({ ...payload,user_id:user.id },{ onConflict:"user_id,date" });
      if (error) { err("Failed to save"); return; }
    }
    ok("Saved");
    setJDlg(false); setEditJ(null); setJForm(emptyJ);
    _naadaCache=null; load();
  };

  const deleteJournal = async (id) => {
    await supabase.from("naada_journal").delete().eq("id",id);
    ok("Removed"); _naadaCache=null; load();
  };

  // ── SKILL CRUD ────────────────────────────────────────────────────────────
  const saveSkill = async () => {
    if (!skillForm.name.trim()) { err("Name required"); return; }
    if (editSkill) {
      const { error } = await supabase.from("naada_skills").update(skillForm).eq("id",editSkill.id);
      if (error) { err("Failed to save"); return; }
    } else {
      const { error } = await supabase.from("naada_skills").insert({ ...skillForm,user_id:user.id });
      if (error) { err("Skill may already exist"); return; }
    }
    ok(editSkill?"Updated":"Added skill");
    setSkillDlg(false); setEditSkill(null); setSkillForm(emptySkill);
    _naadaCache=null; load();
  };

  const deleteSkill = async (id) => {
    await supabase.from("naada_skills").delete().eq("id",id);
    ok("Removed"); _naadaCache=null; load();
  };

  // ── DERIVED DATA ──────────────────────────────────────────────────────────
  const visibleSeq = useMemo(()=>seqItems.filter(isVisibleToday),[seqItems]);
  const seqDone    = visibleSeq.filter((s)=>completions[s.id]).length;

  const filteredComps = useMemo(()=>{
    let c = [...comps];
    if (compFilter.status!=="all") c=c.filter((x)=>x.status===compFilter.status);
    if (compFilter.type!=="all")   c=c.filter((x)=>x.type===compFilter.type);
    if (compFilter.search) { const q=compFilter.search.toLowerCase(); c=c.filter((x)=>x.title?.toLowerCase().includes(q)||x.ragam?.toLowerCase().includes(q)||x.composer?.toLowerCase().includes(q)); }
    return c;
  },[comps,compFilter]);

  const filteredRagas = useMemo(()=>{
    if (!ragaSearch) return ragas;
    const q=ragaSearch.toLowerCase();
    return ragas.filter((r)=>r.name?.toLowerCase().includes(q)||r.alias?.toLowerCase().includes(q));
  },[ragas,ragaSearch]);

  const filteredFin = useMemo(()=>{
    if (finFilter==="all") return finances;
    return finances.filter((f)=>f.type===finFilter);
  },[finances,finFilter]);

  const finSummary = useMemo(()=>{
    const income  = finances.filter((f)=>f.type==="income").reduce((s,f)=>s+parseFloat(f.amount||0),0);
    const expense = finances.filter((f)=>f.type==="expense").reduce((s,f)=>s+parseFloat(f.amount||0),0);
    return { income, expense, net: income-expense };
  },[finances]);

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) return (
    <Box sx={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <Stack alignItems="center" spacing={2}>
        <Typography sx={{ fontSize:32 }}>🎵</Typography>
        <CircularProgress sx={{ color:NAADA_GOLD }} size={36} thickness={2} />
      </Stack>
    </Box>
  );

  // ── SECTION HEADER ────────────────────────────────────────────────────────
  const SectionHead = ({ title, sub, onAdd, addLabel="Add" }) => (
    <Box sx={{ display:"flex",alignItems:"center",justifyContent:"space-between",mb:2.5,flexWrap:"wrap",gap:1.5 }}>
      <Box>
        <Typography sx={{ fontFamily:'"Fraunces","Lora",serif',fontSize:20,fontWeight:600,color:textP }}>{title}</Typography>
        {sub && <Typography sx={{ fontSize:12,color:textS,mt:0.3 }}>{sub}</Typography>}
      </Box>
      {onAdd && (
        <Button variant="contained" size="small" startIcon={<Add />} onClick={()=>{ haptic(); onAdd(); }}
          sx={{ bgcolor:NAADA_GOLD,color:"#fff","&:hover":{bgcolor:"#A0621A"},textTransform:"none",fontWeight:600,borderRadius:2 }}>
          {addLabel}
        </Button>
      )}
    </Box>
  );

  // ── STAT CARD ─────────────────────────────────────────────────────────────
  const StatCard = ({ emoji, label, value, color=NAADA_GOLD }) => (
    <Box sx={{ p:2,borderRadius:2,border:`1px solid ${color}30`,bgcolor:`${color}08`,textAlign:"center" }}>
      <Typography sx={{ fontSize:22,mb:0.25 }}>{emoji}</Typography>
      <Typography sx={{ fontSize:20,fontWeight:700,color,fontFamily:'"Fraunces",serif' }}>{value}</Typography>
      <Typography sx={{ fontSize:10,color:textS,fontWeight:500,textTransform:"uppercase",letterSpacing:0.5 }}>{label}</Typography>
    </Box>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Box sx={embedded
      ? { position:"relative",overflow:"hidden",color:textP }
      : { position:"relative",overflow:"hidden",p:{xs:2,md:3},minHeight:"100vh",color:textP }
    }>
      <VeenaBg isDark={isDark} />
      {/* ── PAGE HEADER (hidden when embedded) ── */}
      {!embedded && (
        <Box sx={{ mb:3,display:"flex",alignItems:"center",gap:2 }}>
          <Box sx={{ width:48,height:48,borderRadius:"50%",bgcolor:`${NAADA_GOLD}20`,border:`2px solid ${NAADA_GOLD}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:`0 0 18px ${NAADA_GOLD}30` }}>
            🎵
          </Box>
          <Box>
            <Typography sx={{ fontFamily:'"Fraunces","Lora",serif',fontSize:{xs:24,md:30},fontWeight:500,color:textP,lineHeight:1.1 }}>
              Naada Saadhana
            </Typography>
            <Typography sx={{ fontSize:11,color:NAADA_GOLD,fontWeight:600,letterSpacing:0.8 }}>
              नाद साधना — The Practice of Sound
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── TABS ── */}
      <Tabs
        value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb:3,borderBottom:`1px solid ${bdr}`,
          "& .MuiTab-root":{ textTransform:"none",fontWeight:500,fontSize:13,color:textS,minWidth:"unset",px:2 },
          "& .Mui-selected":{ color:`${NAADA_GOLD} !important`,fontWeight:700 },
          "& .MuiTabs-indicator":{ bgcolor:NAADA_GOLD },
        }}
      >
        {[["🕉️","Saadhana"],["📜","Compositions"],["🎼","Raga Explorer"],["🎤","Concerts"],["👨‍🎓","Students"],["💰","Finance"],["📓","Journal"],["🎯","Skills"]].map(([e,l],i)=>(
          <Tab key={i} label={<Box sx={{display:"flex",alignItems:"center",gap:0.6}}><span>{e}</span><span>{l}</span></Box>} />
        ))}
      </Tabs>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 0 — SAADHANA
      ════════════════════════════════════════════════════════════════════ */}
      {tab===0 && (
        <Grid container spacing={3}>
          {/* Today's sequence */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius:3,bgcolor:cardBg,border:`1px solid ${bdr}` }}>
              <CardContent sx={{ p:{xs:2,md:3} }}>
                <Box sx={{ display:"flex",alignItems:"center",justifyContent:"space-between",mb:2 }}>
                  <Box>
                    <Typography sx={{ fontFamily:'"Fraunces",serif',fontSize:17,fontWeight:600,color:textP }}>Today's Practice</Typography>
                    <Typography sx={{ fontSize:11,color:NAADA_GOLD,fontWeight:500 }}>
                      {seqDone} / {visibleSeq.length} complete
                    </Typography>
                  </Box>
                  {visibleSeq.length>0 && (
                    <Box sx={{ position:"relative",width:48,height:48 }}>
                      <CircularProgress variant="determinate" value={visibleSeq.length?Math.round((seqDone/visibleSeq.length)*100):0}
                        sx={{ color:NAADA_GOLD,position:"absolute",top:0,left:0 }} size={48} thickness={4} />
                      <Box sx={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <Typography sx={{ fontSize:10,fontWeight:700,color:NAADA_GOLD }}>{visibleSeq.length?Math.round((seqDone/visibleSeq.length)*100):0}%</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
                {visibleSeq.length===0 ? (
                  <Typography sx={{ color:textS,fontSize:13,py:3,textAlign:"center" }}>
                    No items scheduled for today.<br/>Add items below.
                  </Typography>
                ) : visibleSeq.map((item)=>{
                  const done = !!completions[item.id];
                  return (
                    <Box key={item.id} onClick={()=>toggleCompletion(item.id)}
                      sx={{ display:"flex",alignItems:"center",gap:1.5,py:1.25,px:1,borderRadius:2,cursor:"pointer",
                        borderBottom:`1px solid ${bdr}`, "&:last-child":{borderBottom:"none"},
                        opacity:done?0.6:1, transition:"all 0.12s",
                        "&:hover":{ bgcolor:isDark?"rgba(192,120,48,0.06)":"rgba(192,120,48,0.04)" },
                        "&:active":{ transform:"scale(0.985)" },
                      }}
                    >
                      <Box sx={{ width:26,height:26,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                        bgcolor:done?NAADA_GOLD:isDark?"#1F1E1B":"#F5F0E8",
                        border:`1.5px solid ${done?NAADA_GOLD:isDark?"#3C3C3C":"#D1CABB"}`,transition:"all 0.15s" }}>
                        {done ? <CheckCircle sx={{ fontSize:14,color:"#fff" }} /> : <RadioButtonUnchecked sx={{ fontSize:14,color:textS }} />}
                      </Box>
                      <Box sx={{ flex:1,minWidth:0 }}>
                        <Typography noWrap sx={{ fontSize:13,fontWeight:500,color:done?textS:textP,textDecoration:done?"line-through":"none" }}>
                          {item.emoji||"🎵"} {item.label}
                        </Typography>
                        {item.duration_minutes && <Typography sx={{ fontSize:10,color:textS }}>{item.duration_minutes} min</Typography>}
                      </Box>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>

            {/* Stats strip */}
            <Grid container spacing={1.5} sx={{ mt:1.5 }}>
              <Grid item xs={4}><StatCard emoji="📜" label="Compositions" value={comps.length} /></Grid>
              <Grid item xs={4}><StatCard emoji="🎼" label="Ragas Known" value={ragas.length} /></Grid>
              <Grid item xs={4}><StatCard emoji="🎤" label="Concerts" value={concerts.filter((c)=>c.type==="performed").length} /></Grid>
            </Grid>
          </Grid>

          {/* Manage sequence */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius:3,bgcolor:cardBg,border:`1px solid ${bdr}` }}>
              <CardContent sx={{ p:{xs:2,md:3} }}>
                <SectionHead title="Practice Sequence" sub="Items run in order each day" onAdd={()=>{ setEditSeq(null);setSeqForm({ label:"",emoji:"🎵",duration_minutes:"",frequency:"daily",frequency_day:0,order_index:0 });setSeqDlg(true); }} />
                {seqItems.length===0 ? (
                  <Typography sx={{ color:textS,fontSize:13,py:3,textAlign:"center" }}>
                    No sequence items yet. Add your daily practice routine!
                  </Typography>
                ) : (
                  <>
                    {seqItems.slice((seqPage-1)*SEQ_PER,seqPage*SEQ_PER).map((item)=>{
                      const isTodayVisible = isVisibleToday(item);
                      return (
                        <Box key={item.id} sx={{ display:"flex",alignItems:"center",gap:1.5,py:1,px:1,borderRadius:2,opacity:isTodayVisible?1:0.5,
                          borderBottom:`1px solid ${bdr}`,"&:last-child":{borderBottom:"none"} }}>
                          <Typography sx={{ fontSize:18,flexShrink:0 }}>{item.emoji||"🎵"}</Typography>
                          <Box sx={{ flex:1,minWidth:0 }}>
                            <Typography sx={{ fontSize:13,fontWeight:500,color:textP }} noWrap>{item.label}</Typography>
                            <Typography sx={{ fontSize:10,color:textS }}>
                              {item.frequency==="daily"?"Daily":item.frequency==="weekly"?`Every ${DOW[item.frequency_day??0]}`:`Monthly ${item.frequency_day??1}`}
                              {item.duration_minutes ? ` · ${item.duration_minutes} min` : ""}
                              {!isTodayVisible ? " · Not today" : ""}
                            </Typography>
                          </Box>
                          <IconButton size="small" onClick={()=>{ haptic();setEditSeq(item);setSeqForm({ label:item.label,emoji:item.emoji||"🎵",duration_minutes:item.duration_minutes||"",frequency:item.frequency||"daily",frequency_day:item.frequency_day||0,order_index:item.order_index||0 });setSeqDlg(true); }}><Edit sx={{ fontSize:15,color:textS }} /></IconButton>
                          <IconButton size="small" onClick={()=>confirmDel(`Remove "${item.label}" from sequence?`,()=>deleteSeqItem(item.id))}><Delete sx={{ fontSize:15,color:"#CF4E4E" }} /></IconButton>
                        </Box>
                      );
                    })}
                    {seqItems.length>SEQ_PER && <Box sx={{ display:"flex",justifyContent:"center",pt:2 }}><Pagination count={Math.ceil(seqItems.length/SEQ_PER)} page={seqPage} onChange={(_,v)=>setSeqPage(v)} size="small" /></Box>}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1 — COMPOSITIONS
      ════════════════════════════════════════════════════════════════════ */}
      {tab===1 && (
        <Box>
          <SectionHead title="Compositions" sub={`${comps.length} total · ${comps.filter((c)=>c.status==="performance_ready").length} performance-ready`} onAdd={()=>{ setEditComp(null);setCompForm(emptyComp);setCompDlg(true); }} addLabel="Add Composition" />

          {/* Stats strip */}
          <Grid container spacing={1.5} sx={{ mb:2.5 }}>
            {COMP_STATUS.map((s)=>(
              <Grid item xs={6} sm={3} key={s.value}>
                <Box sx={{ p:1.5,borderRadius:2,border:`1px solid ${s.color}30`,bgcolor:`${s.color}08`,textAlign:"center" }}>
                  <Typography sx={{ fontSize:18,fontWeight:700,color:s.color }}>{comps.filter((c)=>c.status===s.value).length}</Typography>
                  <Typography sx={{ fontSize:10,color:textS }}>{s.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Filters */}
          <Stack direction="row" spacing={1.5} sx={{ mb:2,flexWrap:"wrap",gap:1 }}>
            <TextField placeholder="Search title, ragam, composer…" size="small" value={compFilter.search}
              onChange={(e)=>{ setCompFilter((p)=>({...p,search:e.target.value}));setCompPage(1); }}
              sx={{ flex:1,minWidth:180,"& .MuiInputBase-root":{fontSize:13} }} />
            <FormControl size="small" sx={{ minWidth:130 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={compFilter.status} onChange={(e)=>{ setCompFilter((p)=>({...p,status:e.target.value}));setCompPage(1); }}>
                <MenuItem value="all">All Statuses</MenuItem>
                {COMP_STATUS.map((s)=><MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth:120 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={compFilter.type} onChange={(e)=>{ setCompFilter((p)=>({...p,type:e.target.value}));setCompPage(1); }}>
                <MenuItem value="all">All Types</MenuItem>
                {COMP_TYPES.map((t)=><MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          {filteredComps.length===0 ? (
            <Typography sx={{ color:textS,textAlign:"center",py:5,fontSize:14 }}>No compositions found.</Typography>
          ) : (
            <Stack spacing={1}>
              {filteredComps.slice((compPage-1)*COMP_PER,compPage*COMP_PER).map((c)=>(
                <Card key={c.id} sx={{ borderRadius:2,bgcolor:cardBg,border:`1px solid ${bdr}`,transition:"all 0.15s","&:hover":{boxShadow:`0 4px 16px ${NAADA_GOLD}20`} }}>
                  <CardContent sx={{ p:2,"&:last-child":{pb:2} }}>
                    <Box sx={{ display:"flex",alignItems:"flex-start",gap:1.5 }}>
                      <Box sx={{ flex:1,minWidth:0 }}>
                        <Box sx={{ display:"flex",alignItems:"center",gap:1,flexWrap:"wrap" }}>
                          <Typography sx={{ fontWeight:600,fontSize:15,color:textP }}>{c.title}</Typography>
                          <StatusChip status={c.status} />
                          {c.type && <Chip label={c.type} size="small" sx={{ fontSize:10,height:18,bgcolor:`${NAADA_GOLD}15`,color:NAADA_GOLD }} />}
                        </Box>
                        <Stack direction="row" spacing={2} sx={{ mt:0.5,flexWrap:"wrap",gap:0.5 }}>
                          {c.ragam    && <Typography sx={{ fontSize:11,color:textS }}>🎼 {c.ragam}</Typography>}
                          {c.talam    && <Typography sx={{ fontSize:11,color:textS }}>🥁 {c.talam}</Typography>}
                          {c.composer && <Typography sx={{ fontSize:11,color:textS }}>✍️ {c.composer}</Typography>}
                          {c.language && <Typography sx={{ fontSize:11,color:textS }}>🗣 {c.language}</Typography>}
                        </Stack>
                        {c.difficulty && <Box sx={{ mt:0.5 }}><Stars value={c.difficulty} size={14} /></Box>}
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={()=>{ haptic();setExpandComp(expandComp===c.id?null:c.id); }}>
                          <MenuBook sx={{ fontSize:16,color:NAADA_GOLD }} />
                        </IconButton>
                        <IconButton size="small" onClick={()=>{ haptic();setEditComp(c);setCompForm({ title:c.title,composer:c.composer||"",ragam:c.ragam||"",talam:c.talam||"Adi",language:c.language||"Telugu",type:c.type||"Krithi",status:c.status||"learning",difficulty:c.difficulty||3,lyrics:c.lyrics||"",swaras:c.swaras||"",reference_url:c.reference_url||"",guru_who_taught:c.guru_who_taught||"",date_started:c.date_started||today,date_mastered:c.date_mastered||"",notes:c.notes||"" });setCompDlg(true); }}>
                          <Edit sx={{ fontSize:16,color:textS }} />
                        </IconButton>
                        <IconButton size="small" onClick={()=>confirmDel(`Delete "${c.title}"?`,()=>deleteComp(c.id))}>
                          <Delete sx={{ fontSize:16,color:"#CF4E4E" }} />
                        </IconButton>
                      </Stack>
                    </Box>
                    {expandComp===c.id && (
                      <Box sx={{ mt:2,pt:2,borderTop:`1px solid ${bdr}` }}>
                        {c.swaras && <Box sx={{ mb:1.5 }}><Typography sx={{ fontSize:11,fontWeight:700,color:NAADA_GOLD,mb:0.5,textTransform:"uppercase",letterSpacing:0.5 }}>Swaras</Typography><Typography sx={{ fontSize:12,color:textP,fontFamily:"monospace",whiteSpace:"pre-wrap",lineHeight:1.7 }}>{c.swaras}</Typography></Box>}
                        {c.lyrics && <Box sx={{ mb:1.5 }}><Typography sx={{ fontSize:11,fontWeight:700,color:NAADA_GOLD,mb:0.5,textTransform:"uppercase",letterSpacing:0.5 }}>Lyrics</Typography><Typography sx={{ fontSize:12,color:textP,whiteSpace:"pre-wrap",lineHeight:1.8 }}>{c.lyrics}</Typography></Box>}
                        {c.reference_url && <Box sx={{ mb:1 }}><Typography sx={{ fontSize:11,fontWeight:700,color:NAADA_GOLD,mb:0.5,textTransform:"uppercase",letterSpacing:0.5 }}>Reference</Typography><Typography component="a" href={c.reference_url} target="_blank" rel="noreferrer" sx={{ fontSize:12,color:"#4A90E2",textDecoration:"none","&:hover":{textDecoration:"underline"} }}>{c.reference_url}</Typography></Box>}
                        {c.notes && <Box><Typography sx={{ fontSize:11,fontWeight:700,color:NAADA_GOLD,mb:0.5,textTransform:"uppercase",letterSpacing:0.5 }}>Notes</Typography><Typography sx={{ fontSize:12,color:textS,whiteSpace:"pre-wrap" }}>{c.notes}</Typography></Box>}
                        {c.guru_who_taught && <Typography sx={{ fontSize:11,color:textS,mt:1 }}>🙏 Learnt from: {c.guru_who_taught}</Typography>}
                        {c.date_started && <Typography sx={{ fontSize:11,color:textS }}>📅 Started: {dayjs(c.date_started).format("D MMM YYYY")}</Typography>}
                        {c.date_mastered && <Typography sx={{ fontSize:11,color:"#2D7A4F" }}>✅ Mastered: {dayjs(c.date_mastered).format("D MMM YYYY")}</Typography>}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
          {filteredComps.length>COMP_PER && <Box sx={{ display:"flex",justifyContent:"center",pt:2.5 }}><Pagination count={Math.ceil(filteredComps.length/COMP_PER)} page={compPage} onChange={(_,v)=>setCompPage(v)} /></Box>}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2 — RAGA EXPLORER
      ════════════════════════════════════════════════════════════════════ */}
      {tab===2 && (
        <Box>
          <SectionHead title="Raga Explorer" sub={`${ragas.length} ragas in your palette`} onAdd={()=>{ setEditRaga(null);setRagaForm(emptyRaga);setRagaDlg(true); }} addLabel="Add Raga" />
          <TextField placeholder="Search ragas…" size="small" fullWidth value={ragaSearch} onChange={(e)=>{ setRagaSearch(e.target.value);setRagaPage(1); }}
            sx={{ mb:2,"& .MuiInputBase-root":{fontSize:13} }} />
          {filteredRagas.length===0 ? (
            <Typography sx={{ color:textS,textAlign:"center",py:5,fontSize:14 }}>No ragas found.</Typography>
          ) : (
            <Grid container spacing={2}>
              {filteredRagas.slice((ragaPage-1)*RAGA_PER,ragaPage*RAGA_PER).map((r)=>(
                <Grid item xs={12} sm={6} md={4} key={r.id}>
                  <Card sx={{ borderRadius:2,bgcolor:cardBg,border:`1px solid ${bdr}`,height:"100%",transition:"all 0.15s","&:hover":{boxShadow:`0 4px 16px ${NAADA_GOLD}20`,transform:"translateY(-2px)"},"&:active":{transform:"none"} }}>
                    <CardContent sx={{ p:2,"&:last-child":{pb:2} }}>
                      <Box sx={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",mb:1 }}>
                        <Box>
                          <Typography sx={{ fontWeight:700,fontSize:16,color:NAADA_GOLD,fontFamily:'"Fraunces",serif' }}>{r.name}</Typography>
                          {r.alias && <Typography sx={{ fontSize:11,color:textS }}>{r.alias}</Typography>}
                        </Box>
                        <Stack direction="row">
                          <IconButton size="small" onClick={()=>{ haptic();setEditRaga(r);setRagaForm({ name:r.name,alias:r.alias||"",melakarta_number:r.melakarta_number||"",janya_of:r.janya_of||"",aarohanam:r.aarohanam||"",avarohanam:r.avarohanam||"",vishesa_prayogam:r.vishesa_prayogam||"",similar_ragas:r.similar_ragas||"",mood:r.mood||"",time_of_day:r.time_of_day||"",confidence:r.confidence||3,notes:r.notes||"" });setRagaDlg(true); }}>
                            <Edit sx={{ fontSize:14,color:textS }} />
                          </IconButton>
                          <IconButton size="small" onClick={()=>confirmDel(`Remove raga "${r.name}"?`,()=>deleteRaga(r.id))}>
                            <Delete sx={{ fontSize:14,color:"#CF4E4E" }} />
                          </IconButton>
                        </Stack>
                      </Box>
                      <Box sx={{ mb:1 }}><Stars value={r.confidence||3} size={14} /></Box>
                      {r.aarohanam  && <Typography sx={{ fontSize:11,color:textP,mb:0.25 }}>↑ {r.aarohanam}</Typography>}
                      {r.avarohanam && <Typography sx={{ fontSize:11,color:textP,mb:0.5 }}>↓ {r.avarohanam}</Typography>}
                      {r.janya_of   && <Typography sx={{ fontSize:10,color:textS }}>Janya of: {r.janya_of}</Typography>}
                      {r.melakarta_number && <Typography sx={{ fontSize:10,color:textS }}>Melakarta #{r.melakarta_number}</Typography>}
                      {r.mood       && <Chip label={r.mood} size="small" sx={{ mt:0.5,fontSize:10,height:18,bgcolor:`${NAADA_GOLD}15`,color:NAADA_GOLD }} />}
                      {r.vishesa_prayogam && (
                        <Box sx={{ mt:1,pt:1,borderTop:`1px solid ${bdr}` }}>
                          <Typography sx={{ fontSize:10,fontWeight:700,color:textS,mb:0.25 }}>VISHESA PRAYOGAM</Typography>
                          <Typography sx={{ fontSize:11,color:textP }}>{r.vishesa_prayogam}</Typography>
                        </Box>
                      )}
                      {r.similar_ragas && <Typography sx={{ fontSize:10,color:textS,mt:0.5 }}>Similar: {r.similar_ragas}</Typography>}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          {filteredRagas.length>RAGA_PER && <Box sx={{ display:"flex",justifyContent:"center",pt:2.5 }}><Pagination count={Math.ceil(filteredRagas.length/RAGA_PER)} page={ragaPage} onChange={(_,v)=>setRagaPage(v)} /></Box>}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 3 — CONCERTS
      ════════════════════════════════════════════════════════════════════ */}
      {tab===3 && (
        <Box>
          <SectionHead title="Concerts & Events" sub={`${concerts.length} events · ${concerts.filter((c)=>c.type==="performed").length} performed`} onAdd={()=>{ setEditConcert(null);setConcertForm(emptyConcert);setConcertDlg(true); }} addLabel="Add Event" />
          {/* Summary */}
          <Grid container spacing={1.5} sx={{ mb:2.5 }}>
            {CONCERT_TYPES.map((t)=>(
              <Grid item xs={6} sm={3} key={t.value}>
                <Box sx={{ p:1.5,borderRadius:2,border:`1px solid ${t.color}30`,bgcolor:`${t.color}08`,textAlign:"center" }}>
                  <Typography sx={{ fontSize:18,fontWeight:700,color:t.color }}>{concerts.filter((c)=>c.type===t.value).length}</Typography>
                  <Typography sx={{ fontSize:10,color:textS }}>{t.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Typography sx={{ fontSize:11,color:NAADA_GOLD,fontWeight:600,mb:2 }}>
            Total earned: {formatINR(concerts.reduce((s,c)=>s+parseFloat(c.earnings||0),0))}
          </Typography>
          {concerts.length===0 ? (
            <Typography sx={{ color:textS,textAlign:"center",py:5,fontSize:14 }}>No events logged yet.</Typography>
          ) : (
            <TableContainer sx={{ borderRadius:2,border:`1px solid ${bdr}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor:isDark?"rgba(192,120,48,0.08)":"rgba(192,120,48,0.05)" }}>
                    {["Date","Title","Type","Venue","Duration","Earnings",""].map((h)=>(
                      <TableCell key={h} sx={{ fontSize:11,fontWeight:700,color:NAADA_GOLD,borderBottom:`1px solid ${bdr}` }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {concerts.slice((concertPage-1)*CONCERT_PER,concertPage*CONCERT_PER).map((c)=>{
                    const ct = CONCERT_TYPES.find((t)=>t.value===c.type)||CONCERT_TYPES[0];
                    return (
                      <TableRow key={c.id} hover sx={{ cursor:"default" }}>
                        <TableCell sx={{ fontSize:12 }}>{dayjs(c.date).format("D MMM YY")}</TableCell>
                        <TableCell sx={{ fontSize:12,fontWeight:500,color:textP,maxWidth:180 }}>
                          <Typography noWrap sx={{ fontSize:12,fontWeight:500 }}>{c.title}</Typography>
                          {c.notes && <Typography noWrap sx={{ fontSize:10,color:textS }}>{c.notes}</Typography>}
                        </TableCell>
                        <TableCell><Chip label={ct.label} size="small" sx={{ fontSize:9,height:18,bgcolor:`${ct.color}20`,color:ct.color,fontWeight:700 }} /></TableCell>
                        <TableCell sx={{ fontSize:12,color:textS }}>{c.venue||"—"}</TableCell>
                        <TableCell sx={{ fontSize:12,color:textS }}>{c.duration_minutes?`${c.duration_minutes}min`:"—"}</TableCell>
                        <TableCell sx={{ fontSize:12,fontWeight:600,color:c.earnings?NAADA_GOLD:textS }}>{c.earnings?formatINR(c.earnings):"—"}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" onClick={()=>{ haptic();setEditConcert(c);setConcertForm({ title:c.title,type:c.type,date:c.date,venue:c.venue||"",duration_minutes:c.duration_minutes||"",audience_size:c.audience_size||"",organizer:c.organizer||"",earnings:c.earnings||"",expenses:c.expenses||"",notes:c.notes||"" });setConcertDlg(true); }}><Edit sx={{ fontSize:14,color:textS }} /></IconButton>
                            <IconButton size="small" onClick={()=>confirmDel(`Delete "${c.title}"?`,()=>deleteConcert(c.id))}><Delete sx={{ fontSize:14,color:"#CF4E4E" }} /></IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {concerts.length>CONCERT_PER && <Box sx={{ display:"flex",justifyContent:"center",pt:2.5 }}><Pagination count={Math.ceil(concerts.length/CONCERT_PER)} page={concertPage} onChange={(_,v)=>setConcertPage(v)} /></Box>}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 4 — STUDENTS
      ════════════════════════════════════════════════════════════════════ */}
      {tab===4 && (
        <Box>
          <SectionHead title="Students" sub={`${students.filter((s)=>s.is_active).length} active · ${students.filter((s)=>!s.is_active).length} inactive`} onAdd={()=>{ setEditStudent(null);setStudentForm(emptyStudent);setStudentDlg(true); }} addLabel="Add Student" />
          <Typography sx={{ fontSize:11,color:NAADA_GOLD,fontWeight:600,mb:2 }}>
            Monthly teaching income: {formatINR(students.filter((s)=>s.is_active).reduce((t,s)=>t+parseFloat(s.monthly_fee||0),0))} / month
          </Typography>
          {students.length===0 ? (
            <Typography sx={{ color:textS,textAlign:"center",py:5,fontSize:14 }}>No students added yet.</Typography>
          ) : (
            <Grid container spacing={2}>
              {students.slice((studentPage-1)*STUDENT_PER,studentPage*STUDENT_PER).map((s)=>(
                <Grid item xs={12} sm={6} md={4} key={s.id}>
                  <Card sx={{ borderRadius:2,bgcolor:cardBg,border:`1px solid ${bdr}`,opacity:s.is_active?1:0.55 }}>
                    <CardContent sx={{ p:2,"&:last-child":{pb:2} }}>
                      <Box sx={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
                        <Box>
                          <Typography sx={{ fontWeight:600,fontSize:15,color:textP }}>{s.name}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt:0.5,flexWrap:"wrap",gap:0.5 }}>
                            <Chip label={s.level} size="small" sx={{ fontSize:10,height:18,textTransform:"capitalize",bgcolor:s.level==="advanced"?`${NAADA_GOLD}20`:s.level==="intermediate"?"rgba(74,144,226,0.15)":"rgba(93,93,93,0.15)",color:s.level==="advanced"?NAADA_GOLD:s.level==="intermediate"?"#4A90E2":"#888" }} />
                            <Chip label={s.instrument||"Voice"} size="small" sx={{ fontSize:10,height:18,bgcolor:"transparent",border:`1px solid ${bdr}`,color:textS }} />
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={()=>{ haptic();setEditStudent(s);setStudentForm({ name:s.name,level:s.level,instrument:s.instrument||"Voice",start_date:s.start_date||today,monthly_fee:s.monthly_fee||"",notes:s.notes||"",is_active:s.is_active??true });setStudentDlg(true); }}><Edit sx={{ fontSize:14,color:textS }} /></IconButton>
                          <IconButton size="small" onClick={()=>confirmDel(`Remove student "${s.name}"?`,()=>deleteStudent(s.id))}><Delete sx={{ fontSize:14,color:"#CF4E4E" }} /></IconButton>
                        </Stack>
                      </Box>
                      {s.monthly_fee && <Typography sx={{ fontSize:12,color:NAADA_GOLD,fontWeight:600,mt:1 }}>{formatINR(s.monthly_fee)} / month</Typography>}
                      {s.start_date  && <Typography sx={{ fontSize:10,color:textS }}>Since {dayjs(s.start_date).format("MMM YYYY")}</Typography>}
                      {s.notes       && <Typography sx={{ fontSize:11,color:textS,mt:0.5,fontStyle:"italic" }}>{s.notes}</Typography>}
                      <Box sx={{ mt:1 }}>
                        <Typography sx={{ fontSize:10,color:s.is_active?NAADA_GOLD:textS,fontWeight:600 }}>{s.is_active?"● Active":"○ Inactive"}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          {students.length>STUDENT_PER && <Box sx={{ display:"flex",justifyContent:"center",pt:2.5 }}><Pagination count={Math.ceil(students.length/STUDENT_PER)} page={studentPage} onChange={(_,v)=>setStudentPage(v)} /></Box>}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 5 — FINANCE
      ════════════════════════════════════════════════════════════════════ */}
      {tab===5 && (
        <Box>
          <SectionHead title="Finance" sub="Income & expenses from music" onAdd={()=>{ setFinForm(emptyFin);setFinDlg(true); }} addLabel="Log Transaction" />
          <Grid container spacing={1.5} sx={{ mb:2.5 }}>
            <Grid item xs={12} sm={4}><StatCard emoji="📈" label="Total Income" value={formatINR(finSummary.income)} color="#2D7A4F" /></Grid>
            <Grid item xs={12} sm={4}><StatCard emoji="📉" label="Total Expense" value={formatINR(finSummary.expense)} color="#CF4E4E" /></Grid>
            <Grid item xs={12} sm={4}><StatCard emoji="💰" label="Net" value={formatINR(finSummary.net)} color={finSummary.net>=0?NAADA_GOLD:"#CF4E4E"} /></Grid>
          </Grid>
          <ToggleButtonGroup value={finFilter} exclusive onChange={(_,v)=>{ if(v) setFinFilter(v); }} size="small" sx={{ mb:2 }}>
            {[["all","All"],["income","Income"],["expense","Expenses"]].map(([v,l])=>(
              <ToggleButton key={v} value={v} sx={{ textTransform:"none",fontSize:12,px:2,"&.Mui-selected":{ bgcolor:`${NAADA_GOLD}20`,color:NAADA_GOLD,borderColor:`${NAADA_GOLD}50` } }}>{l}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          {filteredFin.length===0 ? (
            <Typography sx={{ color:textS,textAlign:"center",py:5,fontSize:14 }}>No transactions yet.</Typography>
          ) : (
            <TableContainer sx={{ borderRadius:2,border:`1px solid ${bdr}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor:isDark?"rgba(192,120,48,0.08)":"rgba(192,120,48,0.05)" }}>
                    {["Date","Type","Category","Amount","Description",""].map((h)=>(
                      <TableCell key={h} sx={{ fontSize:11,fontWeight:700,color:NAADA_GOLD,borderBottom:`1px solid ${bdr}` }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFin.slice((finPage-1)*FIN_PER,finPage*FIN_PER).map((f)=>(
                    <TableRow key={f.id} hover>
                      <TableCell sx={{ fontSize:12 }}>{dayjs(f.date).format("D MMM YY")}</TableCell>
                      <TableCell><Chip label={f.type==="income"?"Income":"Expense"} size="small" sx={{ fontSize:9,height:18,bgcolor:f.type==="income"?"rgba(45,122,79,0.15)":"rgba(207,78,78,0.15)",color:f.type==="income"?"#2D7A4F":"#CF4E4E",fontWeight:700 }} /></TableCell>
                      <TableCell sx={{ fontSize:12,color:textS }}>{f.category}</TableCell>
                      <TableCell sx={{ fontSize:13,fontWeight:700,color:f.type==="income"?"#2D7A4F":"#CF4E4E" }}>{f.type==="income"?"+":"-"}{formatINR(f.amount)}</TableCell>
                      <TableCell sx={{ fontSize:12,color:textS,maxWidth:200 }}><Typography noWrap sx={{ fontSize:12 }}>{f.description||"—"}</Typography></TableCell>
                      <TableCell><IconButton size="small" onClick={()=>confirmDel("Delete this transaction?",()=>deleteFinance(f.id))}><Delete sx={{ fontSize:14,color:"#CF4E4E" }} /></IconButton></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {filteredFin.length>FIN_PER && <Box sx={{ display:"flex",justifyContent:"center",pt:2.5 }}><Pagination count={Math.ceil(filteredFin.length/FIN_PER)} page={finPage} onChange={(_,v)=>setFinPage(v)} /></Box>}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 6 — JOURNAL
      ════════════════════════════════════════════════════════════════════ */}
      {tab===6 && (
        <Box>
          <SectionHead title="Abhyasa Diary" sub="Daily practice journal & reflections" onAdd={()=>{ setEditJ(null);const todayJ=journals.find((j)=>j.date===today);if(todayJ){setEditJ(todayJ);setJForm({ date:todayJ.date,content:todayJ.content||"",mood:todayJ.mood||"Sattvik 🌸",hours_practiced:todayJ.hours_practiced||"",breakthrough:todayJ.breakthrough||false,guru_feedback:todayJ.guru_feedback||"" });}else{setJForm({ ...emptyJ,date:today });}setJDlg(true); }} addLabel="Write Today's Entry" />
          {journals.length===0 ? (
            <Typography sx={{ color:textS,textAlign:"center",py:5,fontSize:14 }}>No journal entries yet.</Typography>
          ) : (
            <Stack spacing={2}>
              {journals.slice((jPage-1)*J_PER,jPage*J_PER).map((j)=>(
                <Card key={j.id} sx={{ borderRadius:2,bgcolor:cardBg,border:`1px solid ${j.breakthrough?`${NAADA_GOLD}60`:bdr}` }}>
                  <CardContent sx={{ p:2.5,"&:last-child":{pb:2.5} }}>
                    <Box sx={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",mb:1 }}>
                      <Box>
                        <Typography sx={{ fontWeight:600,fontSize:14,color:textP }}>{dayjs(j.date).format("dddd, D MMMM YYYY")}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt:0.5,flexWrap:"wrap",gap:0.5 }}>
                          {j.mood && <Chip label={j.mood} size="small" sx={{ fontSize:10,height:18,bgcolor:`${NAADA_GOLD}15`,color:NAADA_GOLD }} />}
                          {j.hours_practiced && <Chip label={`${j.hours_practiced}h practiced`} size="small" sx={{ fontSize:10,height:18,bgcolor:"rgba(74,144,226,0.15)",color:"#4A90E2" }} />}
                          {j.breakthrough && <Chip label="⚡ Breakthrough" size="small" sx={{ fontSize:10,height:18,bgcolor:"rgba(232,133,26,0.15)",color:NAADA_SAFFRON,fontWeight:700 }} />}
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={()=>{ haptic();setEditJ(j);setJForm({ date:j.date,content:j.content||"",mood:j.mood||"Sattvik 🌸",hours_practiced:j.hours_practiced||"",breakthrough:j.breakthrough||false,guru_feedback:j.guru_feedback||"" });setJDlg(true); }}><Edit sx={{ fontSize:14,color:textS }} /></IconButton>
                        <IconButton size="small" onClick={()=>confirmDel("Delete this journal entry?",()=>deleteJournal(j.id))}><Delete sx={{ fontSize:14,color:"#CF4E4E" }} /></IconButton>
                      </Stack>
                    </Box>
                    {j.content && <Typography sx={{ fontSize:13,color:textP,lineHeight:1.8,whiteSpace:"pre-wrap" }}>{j.content}</Typography>}
                    {j.guru_feedback && (
                      <Box sx={{ mt:1.5,p:1.5,borderRadius:1.5,bgcolor:isDark?"rgba(192,120,48,0.08)":"rgba(192,120,48,0.06)",border:`1px solid ${NAADA_GOLD}30` }}>
                        <Typography sx={{ fontSize:10,fontWeight:700,color:NAADA_GOLD,mb:0.5 }}>🙏 GURU FEEDBACK</Typography>
                        <Typography sx={{ fontSize:12,color:textP,fontStyle:"italic" }}>{j.guru_feedback}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
          {journals.length>J_PER && <Box sx={{ display:"flex",justifyContent:"center",pt:2.5 }}><Pagination count={Math.ceil(journals.length/J_PER)} page={jPage} onChange={(_,v)=>setJPage(v)} /></Box>}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 7 — SKILLS
      ════════════════════════════════════════════════════════════════════ */}
      {tab===7 && (
        <Box>
          <SectionHead title="Skills & Mastery" sub={`${skills.length} skills tracked`} onAdd={()=>{ setEditSkill(null);setSkillForm(emptySkill);setSkillDlg(true); }} addLabel="Add Skill" />
          {skills.length===0 ? (
            <Typography sx={{ color:textS,textAlign:"center",py:5,fontSize:14 }}>No skills tracked yet.</Typography>
          ) : (() => {
            const grouped = SKILL_CATS.reduce((acc,cat)=>{
              const items = skills.filter((s)=>s.category===cat);
              if (items.length) acc[cat]=items;
              return acc;
            },{});
            const other = skills.filter((s)=>!SKILL_CATS.includes(s.category));
            if (other.length) grouped["Other"]=other;
            const allSkills = skills;
            const paged = allSkills.slice((skillPage-1)*SKILL_PER,skillPage*SKILL_PER);
            const pagedGrouped = SKILL_CATS.reduce((acc,cat)=>{
              const items = paged.filter((s)=>s.category===cat);
              if(items.length) acc[cat]=items;
              return acc;
            },{});
            return (
              <Stack spacing={3}>
                {Object.entries(pagedGrouped).map(([cat,items])=>(
                  <Box key={cat}>
                    <Typography sx={{ fontSize:12,fontWeight:700,color:NAADA_GOLD,textTransform:"uppercase",letterSpacing:1,mb:1.5 }}>{cat}</Typography>
                    <Grid container spacing={1.5}>
                      {items.map((s)=>(
                        <Grid item xs={12} sm={6} md={4} key={s.id}>
                          <Box sx={{ p:1.5,borderRadius:2,border:`1px solid ${bdr}`,bgcolor:cardBg,display:"flex",alignItems:"center",gap:1.5 }}>
                            <Box sx={{ flex:1,minWidth:0 }}>
                              <Typography sx={{ fontSize:13,fontWeight:500,color:textP }} noWrap>{s.name}</Typography>
                              <Stars value={s.proficiency||3} size={14} />
                              {s.notes && <Typography sx={{ fontSize:10,color:textS,mt:0.25 }} noWrap>{s.notes}</Typography>}
                            </Box>
                            <Stack direction="row" spacing={0.25}>
                              <IconButton size="small" onClick={()=>{ haptic();setEditSkill(s);setSkillForm({ category:s.category,name:s.name,proficiency:s.proficiency||3,notes:s.notes||"" });setSkillDlg(true); }}><Edit sx={{ fontSize:13,color:textS }} /></IconButton>
                              <IconButton size="small" onClick={()=>confirmDel(`Remove skill "${s.name}"?`,()=>deleteSkill(s.id))}><Delete sx={{ fontSize:13,color:"#CF4E4E" }} /></IconButton>
                            </Stack>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
                {allSkills.length>SKILL_PER && <Box sx={{ display:"flex",justifyContent:"center",pt:1 }}><Pagination count={Math.ceil(allSkills.length/SKILL_PER)} page={skillPage} onChange={(_,v)=>setSkillPage(v)} /></Box>}
              </Stack>
            );
          })()}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DIALOGS
      ════════════════════════════════════════════════════════════════════ */}

      {/* ── DELETE CONFIRM ── */}
      <Dialog open={delDlg.open} onClose={()=>setDelDlg((p)=>({...p,open:false}))} PaperProps={{ sx:{ borderRadius:3,p:1,maxWidth:360,bgcolor:cardBg } }}>
        <DialogTitle sx={{ fontFamily:'"Fraunces",serif',fontWeight:500,fontSize:18,color:textP }}>Confirm Delete</DialogTitle>
        <DialogContent><Typography sx={{ fontSize:14,color:textS }}>{delDlg.title}</Typography></DialogContent>
        <DialogActions sx={{ px:3,pb:2.5,gap:1 }}>
          <Button onClick={()=>setDelDlg((p)=>({...p,open:false}))} sx={{ textTransform:"none",color:textS }}>Cancel</Button>
          <Button variant="contained" onClick={()=>{ delDlg.fn?.(); setDelDlg((p)=>({...p,open:false})); }} sx={{ bgcolor:"#CF4E4E",textTransform:"none",fontWeight:700,"&:hover":{bgcolor:"#B03030"} }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ── SEQ ITEM DIALOG ── */}
      <Dialog open={seqDlg} onClose={()=>setSeqDlg(false)} fullWidth maxWidth="xs" PaperProps={{ sx:{ borderRadius:3,bgcolor:cardBg } }}>
        <DialogTitle sx={{ fontFamily:'"Fraunces",serif',fontWeight:500,color:textP }}>{editSeq?"Edit Practice Item":"Add Practice Item"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt:0.5 }}>
            <Stack direction="row" spacing={1.5}>
              <TextField label="Emoji" size="small" value={seqForm.emoji} onChange={(e)=>setSeqForm((p)=>({...p,emoji:e.target.value}))} sx={{ width:90 }} />
              <TextField label="Label *" size="small" fullWidth value={seqForm.label} onChange={(e)=>setSeqForm((p)=>({...p,label:e.target.value}))} />
            </Stack>
            <TextField label="Duration (minutes)" size="small" type="number" value={seqForm.duration_minutes} onChange={(e)=>setSeqForm((p)=>({...p,duration_minutes:e.target.value}))} />
            <FormControl size="small" fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select label="Frequency" value={seqForm.frequency} onChange={(e)=>setSeqForm((p)=>({...p,frequency:e.target.value}))}>
                {FREQ_OPTS.map((o)=><MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            {seqForm.frequency==="weekly" && (
              <FormControl size="small" fullWidth>
                <InputLabel>Day of Week</InputLabel>
                <Select label="Day of Week" value={seqForm.frequency_day} onChange={(e)=>setSeqForm((p)=>({...p,frequency_day:e.target.value}))}>
                  {DOW.map((d,i)=><MenuItem key={i} value={i}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {seqForm.frequency==="monthly" && (
              <TextField label="Day of Month (1-28)" size="small" type="number" value={seqForm.frequency_day} onChange={(e)=>setSeqForm((p)=>({...p,frequency_day:parseInt(e.target.value)||1}))} inputProps={{ min:1,max:28 }} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px:3,pb:2.5 }}>
          <Button onClick={()=>setSeqDlg(false)} sx={{ textTransform:"none",color:textS }}>Cancel</Button>
          <Button variant="contained" onClick={saveSeqItem} sx={{ bgcolor:NAADA_GOLD,textTransform:"none",fontWeight:600,"&:hover":{bgcolor:"#A0621A"} }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ── COMPOSITION DIALOG ── */}
      <Dialog open={compDlg} onClose={()=>setCompDlg(false)} fullWidth maxWidth="md" PaperProps={{ sx:{ borderRadius:3,bgcolor:cardBg } }}>
        <DialogTitle sx={{ fontFamily:'"Fraunces",serif',fontWeight:500,color:textP,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          {editComp?"Edit Composition":"Add Composition"}
          <IconButton onClick={()=>setCompDlg(false)}><Close sx={{ fontSize:18 }} /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}><TextField label="Title *" size="small" fullWidth value={compForm.title} onChange={(e)=>setCompForm((p)=>({...p,title:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Composer" size="small" fullWidth value={compForm.composer} onChange={(e)=>setCompForm((p)=>({...p,composer:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Ragam" size="small" fullWidth value={compForm.ragam} onChange={(e)=>setCompForm((p)=>({...p,ragam:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Talam" size="small" fullWidth value={compForm.talam} onChange={(e)=>setCompForm((p)=>({...p,talam:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth><InputLabel>Language</InputLabel>
                <Select label="Language" value={compForm.language} onChange={(e)=>setCompForm((p)=>({...p,language:e.target.value}))}>
                  {LANGUAGES.map((l)=><MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth><InputLabel>Type</InputLabel>
                <Select label="Type" value={compForm.type} onChange={(e)=>setCompForm((p)=>({...p,type:e.target.value}))}>
                  {COMP_TYPES.map((t)=><MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth><InputLabel>Status</InputLabel>
                <Select label="Status" value={compForm.status} onChange={(e)=>setCompForm((p)=>({...p,status:e.target.value}))}>
                  {COMP_STATUS.map((s)=><MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography sx={{ fontSize:12,color:textS,mb:0.75 }}>Difficulty</Typography>
                <Stars value={compForm.difficulty} onChange={(v)=>setCompForm((p)=>({...p,difficulty:v}))} size={22} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Guru who taught" size="small" fullWidth value={compForm.guru_who_taught} onChange={(e)=>setCompForm((p)=>({...p,guru_who_taught:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={3}><TextField label="Date started" size="small" fullWidth type="date" InputLabelProps={{ shrink:true }} value={compForm.date_started} onChange={(e)=>setCompForm((p)=>({...p,date_started:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={3}><TextField label="Date mastered" size="small" fullWidth type="date" InputLabelProps={{ shrink:true }} value={compForm.date_mastered} onChange={(e)=>setCompForm((p)=>({...p,date_mastered:e.target.value}))} /></Grid>
            <Grid item xs={12}><TextField label="Reference URL (YouTube / Spotify)" size="small" fullWidth value={compForm.reference_url} onChange={(e)=>setCompForm((p)=>({...p,reference_url:e.target.value}))} /></Grid>
            <Grid item xs={12}><TextField label="Swaras (sa ri ga ma pa...)" size="small" fullWidth multiline rows={3} value={compForm.swaras} onChange={(e)=>setCompForm((p)=>({...p,swaras:e.target.value}))} inputProps={{ style:{ fontFamily:"monospace",fontSize:12 } }} /></Grid>
            <Grid item xs={12}><TextField label="Lyrics" size="small" fullWidth multiline rows={5} value={compForm.lyrics} onChange={(e)=>setCompForm((p)=>({...p,lyrics:e.target.value}))} inputProps={{ style:{ fontSize:12,lineHeight:1.8 } }} /></Grid>
            <Grid item xs={12}><TextField label="Notes / corrections from guru" size="small" fullWidth multiline rows={2} value={compForm.notes} onChange={(e)=>setCompForm((p)=>({...p,notes:e.target.value}))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px:3,pb:2.5 }}>
          <Button onClick={()=>setCompDlg(false)} sx={{ textTransform:"none",color:textS }}>Cancel</Button>
          <Button variant="contained" onClick={saveComp} sx={{ bgcolor:NAADA_GOLD,textTransform:"none",fontWeight:600,"&:hover":{bgcolor:"#A0621A"} }}>Save Composition</Button>
        </DialogActions>
      </Dialog>

      {/* ── RAGA DIALOG ── */}
      <Dialog open={ragaDlg} onClose={()=>setRagaDlg(false)} fullWidth maxWidth="sm" PaperProps={{ sx:{ borderRadius:3,bgcolor:cardBg } }}>
        <DialogTitle sx={{ fontFamily:'"Fraunces",serif',fontWeight:500,color:textP,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          {editRaga?"Edit Raga":"Add Raga"}
          <IconButton onClick={()=>setRagaDlg(false)}><Close sx={{ fontSize:18 }} /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}><TextField label="Raga Name *" size="small" fullWidth value={ragaForm.name} onChange={(e)=>setRagaForm((p)=>({...p,name:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Alias / Common Name" size="small" fullWidth value={ragaForm.alias} onChange={(e)=>setRagaForm((p)=>({...p,alias:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Aarohanam (ascending)" size="small" fullWidth value={ragaForm.aarohanam} onChange={(e)=>setRagaForm((p)=>({...p,aarohanam:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Avarohanam (descending)" size="small" fullWidth value={ragaForm.avarohanam} onChange={(e)=>setRagaForm((p)=>({...p,avarohanam:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Melakarta Number" size="small" fullWidth type="number" value={ragaForm.melakarta_number} onChange={(e)=>setRagaForm((p)=>({...p,melakarta_number:e.target.value}))} inputProps={{ min:1,max:72 }} /></Grid>
            <Grid item xs={12} sm={8}><TextField label="Janya of (parent raga)" size="small" fullWidth value={ragaForm.janya_of} onChange={(e)=>setRagaForm((p)=>({...p,janya_of:e.target.value}))} /></Grid>
            <Grid item xs={12}><TextField label="Vishesa Prayogam (characteristic phrases)" size="small" fullWidth multiline rows={2} value={ragaForm.vishesa_prayogam} onChange={(e)=>setRagaForm((p)=>({...p,vishesa_prayogam:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Similar Ragas" size="small" fullWidth value={ragaForm.similar_ragas} onChange={(e)=>setRagaForm((p)=>({...p,similar_ragas:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={3}><TextField label="Mood / Bhava" size="small" fullWidth value={ragaForm.mood} onChange={(e)=>setRagaForm((p)=>({...p,mood:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={3}><TextField label="Time of Day" size="small" fullWidth value={ragaForm.time_of_day} onChange={(e)=>setRagaForm((p)=>({...p,time_of_day:e.target.value}))} /></Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize:12,color:textS,mb:0.75 }}>Alapana Confidence</Typography>
              <Stars value={ragaForm.confidence} onChange={(v)=>setRagaForm((p)=>({...p,confidence:v}))} size={22} />
            </Grid>
            <Grid item xs={12}><TextField label="Notes" size="small" fullWidth multiline rows={2} value={ragaForm.notes} onChange={(e)=>setRagaForm((p)=>({...p,notes:e.target.value}))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px:3,pb:2.5 }}>
          <Button onClick={()=>setRagaDlg(false)} sx={{ textTransform:"none",color:textS }}>Cancel</Button>
          <Button variant="contained" onClick={saveRaga} sx={{ bgcolor:NAADA_GOLD,textTransform:"none",fontWeight:600,"&:hover":{bgcolor:"#A0621A"} }}>Save Raga</Button>
        </DialogActions>
      </Dialog>

      {/* ── CONCERT DIALOG ── */}
      <Dialog open={concertDlg} onClose={()=>setConcertDlg(false)} fullWidth maxWidth="sm" PaperProps={{ sx:{ borderRadius:3,bgcolor:cardBg } }}>
        <DialogTitle sx={{ fontFamily:'"Fraunces",serif',fontWeight:500,color:textP }}>{editConcert?"Edit Event":"Add Concert / Event"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Title *" size="small" fullWidth value={concertForm.title} onChange={(e)=>setConcertForm((p)=>({...p,title:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth><InputLabel>Type</InputLabel>
                <Select label="Type" value={concertForm.type} onChange={(e)=>setConcertForm((p)=>({...p,type:e.target.value}))}>
                  {CONCERT_TYPES.map((t)=><MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Date" type="date" size="small" fullWidth InputLabelProps={{ shrink:true }} value={concertForm.date} onChange={(e)=>setConcertForm((p)=>({...p,date:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={8}><TextField label="Venue" size="small" fullWidth value={concertForm.venue} onChange={(e)=>setConcertForm((p)=>({...p,venue:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Duration (min)" size="small" fullWidth type="number" value={concertForm.duration_minutes} onChange={(e)=>setConcertForm((p)=>({...p,duration_minutes:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Organizer" size="small" fullWidth value={concertForm.organizer} onChange={(e)=>setConcertForm((p)=>({...p,organizer:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={3}><TextField label="Earnings (₹)" size="small" fullWidth type="number" value={concertForm.earnings} onChange={(e)=>setConcertForm((p)=>({...p,earnings:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={3}><TextField label="Expenses (₹)" size="small" fullWidth type="number" value={concertForm.expenses} onChange={(e)=>setConcertForm((p)=>({...p,expenses:e.target.value}))} /></Grid>
            <Grid item xs={12}><TextField label="Notes" size="small" fullWidth multiline rows={2} value={concertForm.notes} onChange={(e)=>setConcertForm((p)=>({...p,notes:e.target.value}))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px:3,pb:2.5 }}>
          <Button onClick={()=>setConcertDlg(false)} sx={{ textTransform:"none",color:textS }}>Cancel</Button>
          <Button variant="contained" onClick={saveConcert} sx={{ bgcolor:NAADA_GOLD,textTransform:"none",fontWeight:600,"&:hover":{bgcolor:"#A0621A"} }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ── STUDENT DIALOG ── */}
      <Dialog open={studentDlg} onClose={()=>setStudentDlg(false)} fullWidth maxWidth="sm" PaperProps={{ sx:{ borderRadius:3,bgcolor:cardBg } }}>
        <DialogTitle sx={{ fontFamily:'"Fraunces",serif',fontWeight:500,color:textP }}>{editStudent?"Edit Student":"Add Student"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Name *" size="small" fullWidth value={studentForm.name} onChange={(e)=>setStudentForm((p)=>({...p,name:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth><InputLabel>Level</InputLabel>
                <Select label="Level" value={studentForm.level} onChange={(e)=>setStudentForm((p)=>({...p,level:e.target.value}))}>
                  {["beginner","intermediate","advanced"].map((l)=><MenuItem key={l} value={l} sx={{ textTransform:"capitalize" }}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}><TextField label="Instrument" size="small" fullWidth value={studentForm.instrument} onChange={(e)=>setStudentForm((p)=>({...p,instrument:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Start Date" type="date" size="small" fullWidth InputLabelProps={{ shrink:true }} value={studentForm.start_date} onChange={(e)=>setStudentForm((p)=>({...p,start_date:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Monthly Fee (₹)" type="number" size="small" fullWidth value={studentForm.monthly_fee} onChange={(e)=>setStudentForm((p)=>({...p,monthly_fee:e.target.value}))} /></Grid>
            <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={studentForm.is_active} onChange={(e)=>setStudentForm((p)=>({...p,is_active:e.target.checked}))} sx={{ "& .MuiSwitch-thumb":{bgcolor:NAADA_GOLD},"& .Mui-checked+.MuiSwitch-track":{bgcolor:`${NAADA_GOLD}80`} }} />} label="Active student" /></Grid>
            <Grid item xs={12}><TextField label="Notes" size="small" fullWidth multiline rows={2} value={studentForm.notes} onChange={(e)=>setStudentForm((p)=>({...p,notes:e.target.value}))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px:3,pb:2.5 }}>
          <Button onClick={()=>setStudentDlg(false)} sx={{ textTransform:"none",color:textS }}>Cancel</Button>
          <Button variant="contained" onClick={saveStudent} sx={{ bgcolor:NAADA_GOLD,textTransform:"none",fontWeight:600,"&:hover":{bgcolor:"#A0621A"} }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ── FINANCE DIALOG ── */}
      <Dialog open={finDlg} onClose={()=>setFinDlg(false)} fullWidth maxWidth="xs" PaperProps={{ sx:{ borderRadius:3,bgcolor:cardBg } }}>
        <DialogTitle sx={{ fontFamily:'"Fraunces",serif',fontWeight:500,color:textP }}>Log Transaction</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Date" type="date" size="small" fullWidth InputLabelProps={{ shrink:true }} value={finForm.date} onChange={(e)=>setFinForm((p)=>({...p,date:e.target.value}))} />
            <ToggleButtonGroup value={finForm.type} exclusive onChange={(_,v)=>{ if(v) setFinForm((p)=>({...p,type:v,category:v==="income"?"Concert":"Guru Dakshina"})); }} fullWidth size="small">
              <ToggleButton value="income" sx={{ textTransform:"none","&.Mui-selected":{bgcolor:"rgba(45,122,79,0.15)",color:"#2D7A4F"} }}>📈 Income</ToggleButton>
              <ToggleButton value="expense" sx={{ textTransform:"none","&.Mui-selected":{bgcolor:"rgba(207,78,78,0.15)",color:"#CF4E4E"} }}>📉 Expense</ToggleButton>
            </ToggleButtonGroup>
            <FormControl size="small" fullWidth><InputLabel>Category</InputLabel>
              <Select label="Category" value={finForm.category} onChange={(e)=>setFinForm((p)=>({...p,category:e.target.value}))}>
                {(finForm.type==="income"?INC_CATS:EXP_CATS).map((c)=><MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Amount (₹) *" type="number" size="small" fullWidth value={finForm.amount} onChange={(e)=>setFinForm((p)=>({...p,amount:e.target.value}))} />
            <TextField label="Description" size="small" fullWidth value={finForm.description} onChange={(e)=>setFinForm((p)=>({...p,description:e.target.value}))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px:3,pb:2.5 }}>
          <Button onClick={()=>setFinDlg(false)} sx={{ textTransform:"none",color:textS }}>Cancel</Button>
          <Button variant="contained" onClick={saveFinance} sx={{ bgcolor:NAADA_GOLD,textTransform:"none",fontWeight:600,"&:hover":{bgcolor:"#A0621A"} }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ── JOURNAL DIALOG ── */}
      <Dialog open={jDlg} onClose={()=>setJDlg(false)} fullWidth maxWidth="sm" PaperProps={{ sx:{ borderRadius:3,bgcolor:cardBg } }}>
        <DialogTitle sx={{ fontFamily:'"Fraunces",serif',fontWeight:500,color:textP }}>{editJ?"Edit Entry":"Today's Abhyasa Diary"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Date" type="date" size="small" fullWidth InputLabelProps={{ shrink:true }} value={jForm.date} onChange={(e)=>setJForm((p)=>({...p,date:e.target.value}))} />
            <Stack direction="row" spacing={1.5}>
              <TextField label="Hours Practiced" type="number" size="small" sx={{ flex:1 }} value={jForm.hours_practiced} onChange={(e)=>setJForm((p)=>({...p,hours_practiced:e.target.value}))} inputProps={{ min:0,max:24,step:0.25 }} />
              <FormControl size="small" sx={{ flex:1 }}><InputLabel>Mood</InputLabel>
                <Select label="Mood" value={jForm.mood} onChange={(e)=>setJForm((p)=>({...p,mood:e.target.value}))}>
                  {MOODS.map((m)=><MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField label="What did you practise? Notes, insights…" multiline rows={5} size="small" fullWidth value={jForm.content} onChange={(e)=>setJForm((p)=>({...p,content:e.target.value}))} />
            <TextField label="Guru Feedback (if any)" multiline rows={2} size="small" fullWidth value={jForm.guru_feedback} onChange={(e)=>setJForm((p)=>({...p,guru_feedback:e.target.value}))} />
            <FormControlLabel control={<Switch checked={jForm.breakthrough} onChange={(e)=>setJForm((p)=>({...p,breakthrough:e.target.checked}))} sx={{ "& .Mui-checked+.MuiSwitch-track":{bgcolor:`${NAADA_SAFFRON}80`} }} />} label={<Typography sx={{ fontSize:13 }}>⚡ Mark as breakthrough day</Typography>} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px:3,pb:2.5 }}>
          <Button onClick={()=>setJDlg(false)} sx={{ textTransform:"none",color:textS }}>Cancel</Button>
          <Button variant="contained" onClick={saveJournal} sx={{ bgcolor:NAADA_GOLD,textTransform:"none",fontWeight:600,"&:hover":{bgcolor:"#A0621A"} }}>Save Entry</Button>
        </DialogActions>
      </Dialog>

      {/* ── SKILL DIALOG ── */}
      <Dialog open={skillDlg} onClose={()=>setSkillDlg(false)} fullWidth maxWidth="xs" PaperProps={{ sx:{ borderRadius:3,bgcolor:cardBg } }}>
        <DialogTitle sx={{ fontFamily:'"Fraunces",serif',fontWeight:500,color:textP }}>{editSkill?"Edit Skill":"Add Skill"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth><InputLabel>Category</InputLabel>
              <Select label="Category" value={skillForm.category} onChange={(e)=>setSkillForm((p)=>({...p,category:e.target.value}))}>
                {SKILL_CATS.map((c)=><MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Skill / Raga Name *" size="small" fullWidth value={skillForm.name} onChange={(e)=>setSkillForm((p)=>({...p,name:e.target.value}))} />
            <Box>
              <Typography sx={{ fontSize:12,color:textS,mb:0.75 }}>Proficiency</Typography>
              <Stars value={skillForm.proficiency} onChange={(v)=>setSkillForm((p)=>({...p,proficiency:v}))} size={24} />
            </Box>
            <TextField label="Notes" size="small" fullWidth value={skillForm.notes} onChange={(e)=>setSkillForm((p)=>({...p,notes:e.target.value}))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px:3,pb:2.5 }}>
          <Button onClick={()=>setSkillDlg(false)} sx={{ textTransform:"none",color:textS }}>Cancel</Button>
          <Button variant="contained" onClick={saveSkill} sx={{ bgcolor:NAADA_GOLD,textTransform:"none",fontWeight:600,"&:hover":{bgcolor:"#A0621A"} }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR ── */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack((p)=>({...p,open:false}))} anchorOrigin={{ vertical:"bottom",horizontal:"center" }}>
        <Alert onClose={()=>setSnack((p)=>({...p,open:false}))} severity={snack.sev} sx={{ borderRadius:2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
