import { useState, useEffect, useRef } from "react";
import {
  FileText, Camera, MapPin, Cloud, User, Calendar, Package,
  AlertTriangle, CheckCircle2, Plus, Trash2, Download, X,
  ChevronRight, Image as ImageIcon, Save, ArrowLeft, Eye,
  Upload, Wrench, Sparkles, Clock
} from "lucide-react";

// =============================================================
//  KOMIS — RAPPORT D'INTERVENTION SIGNALÉTIQUE
//  Version Vercel — stockage localStorage
// =============================================================

const STORAGE_KEY = "komis_reports_v1";

const EMPTY_REPORT = () => ({
  id: `RPT-${Date.now()}`,
  createdAt: new Date().toISOString(),
  status: "draft",
  competition: "PRO D2",
  matchType: "Barrage",
  homeTeam: "Colomiers Rugby",
  awayTeam: "",
  date: new Date().toISOString().slice(0, 10),
  venue: "Stade Michel Bendichou, Colomiers",
  operator: "",
  weather: "Couvert",
  weatherNote: "",
  missionStatus: "accomplie",
  synthesisNotes: "",
  zones: [
    { id: "A", name: "Bord terrain (Visibilité TV & Stades)", photos: [] },
    { id: "B", name: "Accès & Flux Spectateurs", photos: [] },
  ],
  inventory: [],
  incidents: [],
});

// ---------- Helpers ----------
const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric"
    });
  } catch { return iso; }
};

const formatDateTime = (iso) => {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch { return iso; }
};

// ---------- Storage layer (localStorage) ----------
function loadReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return true;
  } catch (e) {
    console.error("Save failed", e);
    return false;
  }
}

// =============================================================
//  Top-level App
// =============================================================
export default function App() {
  const [view, setView] = useState("list");
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setReports(loadReports());
    setLoading(false);
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  const persist = (next) => {
    setReports(next);
    const ok = saveReports(next);
    if (!ok) showToast("Erreur de sauvegarde — quota dépassé ?", "err");
  };

  const handleNew = () => {
    const r = EMPTY_REPORT();
    setActiveReport(r);
    setView("edit");
  };

  const handleOpen = (id) => {
    const r = reports.find((x) => x.id === id);
    if (r) {
      setActiveReport(r);
      setView("edit");
    }
  };

  const handlePreview = (r) => {
    setActiveReport(r);
    setView("preview");
  };

  const handleSave = (report, opts = {}) => {
    const exists = reports.some((r) => r.id === report.id);
    const next = exists
      ? reports.map((r) => (r.id === report.id ? report : r))
      : [report, ...reports];
    persist(next);
    if (opts.silent) return;
    showToast(opts.message || "Rapport sauvegardé");
  };

  const handleDelete = (id) => {
    if (!confirm("Supprimer définitivement ce rapport ?")) return;
    persist(reports.filter((r) => r.id !== id));
    showToast("Rapport supprimé");
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100"
         style={{ fontFamily: "'Archivo', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-display { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; }
        .font-body { font-family: 'Archivo', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .grain::before {
          content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/></svg>");
          mix-blend-mode: overlay;
        }
        .stripe-bg {
          background-image: repeating-linear-gradient(
            135deg, rgba(255,255,255,0.02) 0 12px,
            transparent 12px 24px
          );
        }
        @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0 } to { transform: translate(-50%, 0); opacity: 1 } }
      `}</style>

      <div className="grain" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <Header />

        {loading ? (
          <div className="py-20 text-center text-stone-500 font-mono text-xs uppercase tracking-widest">
            Chargement…
          </div>
        ) : view === "list" ? (
          <ReportsList
            reports={reports}
            onNew={handleNew}
            onOpen={handleOpen}
            onPreview={handlePreview}
            onDelete={handleDelete}
          />
        ) : view === "edit" ? (
          <ReportEditor
            initial={activeReport}
            onBack={() => setView("list")}
            onSave={handleSave}
            onPreview={(r) => { setActiveReport(r); setView("preview"); }}
          />
        ) : (
          <ReportPreview
            report={activeReport}
            onBack={() => setView("list")}
            onEdit={() => setView("edit")}
          />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50" style={{ animation: "slideUp .3s ease" }}>
          <div className={`px-5 py-3 rounded-sm shadow-2xl border font-mono text-xs uppercase tracking-widest ${
            toast.type === "err"
              ? "bg-red-950 border-red-800 text-red-200"
              : "bg-lime-400 border-lime-500 text-stone-950"
          }`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
//  Header
// =============================================================
function Header() {
  return (
    <header className="mb-8 sm:mb-12 border-b border-stone-800 pb-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-14 sm:h-14 bg-lime-400 flex items-center justify-center -rotate-3 shadow-lg shadow-lime-400/20">
            <span className="font-display text-stone-950 text-xl sm:text-2xl">K</span>
          </div>
          <div>
            <div className="font-mono text-[10px] sm:text-xs text-lime-400 uppercase tracking-[0.25em]">
              Komis · Field Ops
            </div>
            <h1 className="font-display text-2xl sm:text-4xl leading-none mt-1">
              RAPPORTS<span className="text-lime-400">.</span>
            </h1>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">Saison</div>
          <div className="font-display text-lg text-stone-300">25/26</div>
        </div>
      </div>
    </header>
  );
}

// =============================================================
//  Liste des rapports
// =============================================================
function ReportsList({ reports, onNew, onOpen, onPreview, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-mono text-xs text-stone-500 uppercase tracking-widest mb-1">
            {reports.length} rapport{reports.length > 1 ? "s" : ""}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl">Interventions terrain</h2>
        </div>
        <button
          onClick={onNew}
          className="group bg-lime-400 hover:bg-lime-300 text-stone-950 px-4 sm:px-6 py-3 font-display text-sm uppercase tracking-wider flex items-center gap-2 transition-all hover:-rotate-1 shadow-lg shadow-lime-400/20"
        >
          <Plus size={18} strokeWidth={3} />
          <span className="hidden sm:inline">Nouveau rapport</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>

      {reports.length === 0 ? (
        <EmptyState onNew={onNew} />
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onOpen={() => onOpen(r.id)}
              onPreview={() => onPreview(r)}
              onDelete={() => onDelete(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div className="border border-dashed border-stone-800 stripe-bg rounded-sm p-12 sm:p-20 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-stone-900 border border-stone-800 flex items-center justify-center">
        <FileText size={28} className="text-lime-400" />
      </div>
      <div className="font-mono text-xs text-stone-500 uppercase tracking-widest mb-2">
        Aucun rapport
      </div>
      <h3 className="font-display text-2xl mb-3">Commencez votre première intervention</h3>
      <p className="text-stone-400 mb-6 max-w-md mx-auto text-sm">
        Documentez l'installation signalétique en stade : photos, inventaire, incidents.
      </p>
      <button
        onClick={onNew}
        className="bg-lime-400 hover:bg-lime-300 text-stone-950 px-6 py-3 font-display text-sm uppercase tracking-wider inline-flex items-center gap-2"
      >
        <Plus size={18} strokeWidth={3} /> Créer un rapport
      </button>
    </div>
  );
}

function ReportCard({ report, onOpen, onPreview, onDelete }) {
  const photoCount = report.zones.reduce((acc, z) => acc + z.photos.length, 0);
  const incidentCount = report.incidents.length;

  return (
    <div className="group bg-stone-900 border border-stone-800 hover:border-lime-400/40 transition-all">
      <div className="p-4 sm:p-5 flex items-center gap-4">
        <div className={`w-1 self-stretch ${
          report.status === "finalized" ? "bg-lime-400" : "bg-amber-500"
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
              {report.id}
            </span>
            <span className={`font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 ${
              report.status === "finalized"
                ? "bg-lime-400/10 text-lime-400"
                : "bg-amber-500/10 text-amber-500"
            }`}>
              {report.status === "finalized" ? "Finalisé" : "Brouillon"}
            </span>
          </div>
          <h3 className="font-display text-lg sm:text-xl truncate">
            {report.homeTeam} <span className="text-stone-600">vs</span> {report.awayTeam || "—"}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-stone-400 font-mono">
            <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(report.date)}</span>
            <span className="flex items-center gap-1.5"><Camera size={12} /> {photoCount} photos</span>
            {incidentCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-500">
                <AlertTriangle size={12} /> {incidentCount} incident{incidentCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onPreview}
            title="Aperçu"
            className="p-2 sm:p-2.5 hover:bg-stone-800 text-stone-400 hover:text-lime-400 transition-colors"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={onOpen}
            title="Modifier"
            className="p-2 sm:p-2.5 hover:bg-stone-800 text-stone-400 hover:text-lime-400 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={onDelete}
            title="Supprimer"
            className="p-2 sm:p-2.5 hover:bg-red-950 text-stone-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================
//  Editor
// =============================================================
function ReportEditor({ initial, onBack, onSave, onPreview }) {
  const [report, setReport] = useState(initial);
  const [activeSection, setActiveSection] = useState("header");

  const update = (patch) => setReport((r) => ({ ...r, ...patch }));

  const sections = [
    { id: "header", label: "En-tête", icon: FileText },
    { id: "synthesis", label: "Synthèse", icon: Sparkles },
    { id: "photos", label: "Photos", icon: Camera },
    { id: "logistics", label: "Logistique", icon: Package },
    { id: "incidents", label: "Incidents", icon: AlertTriangle },
  ];

  const handleSaveDraft = () => onSave({ ...report, status: "draft" });
  const handleFinalize = () => {
    const finalized = { ...report, status: "finalized", finalizedAt: new Date().toISOString() };
    onSave(finalized, { message: "Rapport finalisé" });
    onPreview(finalized);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-400 hover:text-lime-400 transition-colors font-mono text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            className="px-3 sm:px-4 py-2.5 border border-stone-700 hover:border-stone-500 text-stone-300 font-mono text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <Save size={14} /> <span className="hidden sm:inline">Brouillon</span>
          </button>
          <button
            onClick={handleFinalize}
            className="px-3 sm:px-4 py-2.5 bg-lime-400 hover:bg-lime-300 text-stone-950 font-display text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <CheckCircle2 size={14} strokeWidth={3} /> Finaliser
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {sections.map((s) => {
          const Icon = s.icon;
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`shrink-0 px-3 py-2 font-mono text-[11px] uppercase tracking-widest flex items-center gap-2 border transition-all ${
                active
                  ? "bg-lime-400 text-stone-950 border-lime-400"
                  : "bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-600"
              }`}
            >
              <Icon size={13} strokeWidth={active ? 2.5 : 2} />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="bg-stone-900 border border-stone-800 p-5 sm:p-8">
        {activeSection === "header" && <HeaderSection report={report} update={update} />}
        {activeSection === "synthesis" && <SynthesisSection report={report} update={update} />}
        {activeSection === "photos" && <PhotosSection report={report} update={update} />}
        {activeSection === "logistics" && <LogisticsSection report={report} update={update} />}
        {activeSection === "incidents" && <IncidentsSection report={report} update={update} />}
      </div>
    </div>
  );
}

function HeaderSection({ report, update }) {
  return (
    <div className="space-y-5">
      <SectionTitle num="01" title="Informations générales" />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Compétition">
          <select value={report.competition} onChange={(e) => update({ competition: e.target.value })} className={inputCls}>
            <option>PRO D2</option>
            <option>TOP 14</option>
            <option>Nationale</option>
            <option>Coupe d'Europe</option>
            <option>Autre</option>
          </select>
        </Field>
        <Field label="Type de match">
          <select value={report.matchType} onChange={(e) => update({ matchType: e.target.value })} className={inputCls}>
            <option>Saison régulière</option>
            <option>Barrage</option>
            <option>Demi-finale</option>
            <option>Finale</option>
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Équipe domicile">
          <input type="text" value={report.homeTeam} onChange={(e) => update({ homeTeam: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Équipe extérieure">
          <input type="text" value={report.awayTeam} onChange={(e) => update({ awayTeam: e.target.value })} placeholder="Nom de l'adversaire" className={inputCls} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Date du match" icon={<Calendar size={13} />}>
          <input type="date" value={report.date} onChange={(e) => update({ date: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Lieu" icon={<MapPin size={13} />}>
          <input type="text" value={report.venue} onChange={(e) => update({ venue: e.target.value })} className={inputCls} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Opérateur chef" icon={<User size={13} />}>
          <input type="text" value={report.operator} onChange={(e) => update({ operator: e.target.value })} placeholder="Prénom NOM" className={inputCls} />
        </Field>
        <Field label="Météo" icon={<Cloud size={13} />}>
          <select value={report.weather} onChange={(e) => update({ weather: e.target.value })} className={inputCls}>
            <option>Ensoleillé</option>
            <option>Couvert</option>
            <option>Pluie</option>
            <option>Vent fort</option>
            <option>Orageux</option>
          </select>
        </Field>
      </div>

      <Field label="Note météo (optionnel)">
        <input type="text" value={report.weatherNote} onChange={(e) => update({ weatherNote: e.target.value })} placeholder="ex: Légère brise, conditions stables" className={inputCls} />
      </Field>
    </div>
  );
}

function SynthesisSection({ report, update }) {
  return (
    <div className="space-y-5">
      <SectionTitle num="02" title="Synthèse opérationnelle" />

      <Field label="Statut de la mission">
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: "accomplie", label: "Accomplie", color: "lime" },
            { val: "partielle", label: "Partielle", color: "amber" },
            { val: "echec", label: "Échec", color: "red" },
          ].map((opt) => {
            const active = report.missionStatus === opt.val;
            const colorMap = {
              lime: active ? "bg-lime-400 text-stone-950 border-lime-400" : "border-stone-700 hover:border-lime-400/50 text-stone-300",
              amber: active ? "bg-amber-500 text-stone-950 border-amber-500" : "border-stone-700 hover:border-amber-500/50 text-stone-300",
              red: active ? "bg-red-500 text-white border-red-500" : "border-stone-700 hover:border-red-500/50 text-stone-300",
            };
            return (
              <button key={opt.val} onClick={() => update({ missionStatus: opt.val })} className={`py-3 border font-display text-xs uppercase tracking-widest transition-all ${colorMap[opt.color]}`}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Notes de synthèse">
        <textarea value={report.synthesisNotes} onChange={(e) => update({ synthesisNotes: e.target.value })} rows={5} placeholder="ex: Installation complète et vérifiée à H-4. Excellente visibilité TV..." className={inputCls + " resize-none"} />
      </Field>
    </div>
  );
}

function PhotosSection({ report, update }) {
  const addZone = () => {
    const id = String.fromCharCode(65 + report.zones.length);
    update({ zones: [...report.zones, { id, name: `Zone ${id}`, photos: [] }] });
  };

  const updateZone = (idx, patch) => {
    const next = [...report.zones];
    next[idx] = { ...next[idx], ...patch };
    update({ zones: next });
  };

  const removeZone = (idx) => {
    if (!confirm("Supprimer cette zone et toutes ses photos ?")) return;
    update({ zones: report.zones.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-5">
      <SectionTitle num="03" title="Preuves de visibilité" />

      <div className="space-y-4">
        {report.zones.map((zone, idx) => (
          <ZoneBlock key={idx} zone={zone} onUpdate={(patch) => updateZone(idx, patch)} onRemove={() => removeZone(idx)} />
        ))}
      </div>

      <button onClick={addZone} className="w-full py-3 border border-dashed border-stone-700 hover:border-lime-400 text-stone-400 hover:text-lime-400 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
        <Plus size={14} /> Ajouter une zone
      </button>
    </div>
  );
}

function ZoneBlock({ zone, onUpdate, onRemove }) {
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    const arr = Array.from(files).slice(0, 10);
    const newPhotos = [];
    for (const file of arr) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await fileToDataUrl(file);
      newPhotos.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        dataUrl, caption: "", name: file.name,
      });
    }
    onUpdate({ photos: [...zone.photos, ...newPhotos] });
  };

  const updatePhoto = (id, patch) => {
    onUpdate({ photos: zone.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  };

  const removePhoto = (id) => {
    onUpdate({ photos: zone.photos.filter((p) => p.id !== id) });
  };

  return (
    <div className="border border-stone-800 bg-stone-950/50">
      <div className="flex items-center gap-3 p-4 border-b border-stone-800">
        <div className="w-9 h-9 bg-lime-400 text-stone-950 font-display flex items-center justify-center shrink-0">
          {zone.id}
        </div>
        <input type="text" value={zone.name} onChange={(e) => onUpdate({ name: e.target.value })} className="flex-1 bg-transparent border-none outline-none font-display text-base text-stone-100 focus:text-lime-400 transition-colors min-w-0" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 shrink-0">
          {zone.photos.length} photo{zone.photos.length > 1 ? "s" : ""}
        </span>
        <button onClick={onRemove} className="p-2 text-stone-500 hover:text-red-400 transition-colors shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {zone.photos.length === 0 && (
          <div className="py-8 text-center text-stone-600 font-mono text-xs uppercase tracking-widest">
            Aucune photo
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {zone.photos.map((photo) => (
            <div key={photo.id} className="group relative bg-stone-900 border border-stone-800">
              <div className="relative aspect-video overflow-hidden bg-stone-950">
                <img src={photo.dataUrl} alt={photo.caption || photo.name} className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(photo.id)} className="absolute top-2 right-2 w-7 h-7 bg-stone-950/80 backdrop-blur text-stone-300 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <X size={14} />
                </button>
              </div>
              <input type="text" value={photo.caption} onChange={(e) => updatePhoto(photo.id, { caption: e.target.value })} placeholder="Commentaire de la photo…" className="w-full bg-stone-900 border-none outline-none px-3 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:bg-stone-800 transition-colors" />
            </div>
          ))}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border border-dashed border-stone-700 hover:border-lime-400 text-stone-400 hover:text-lime-400 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
          <Upload size={14} /> Ajouter des photos
        </button>
      </div>
    </div>
  );
}

function LogisticsSection({ report, update }) {
  const addItem = () => {
    update({ inventory: [...report.inventory, { id: Date.now(), item: "", source: "Stock", qty: 1, state: "Bon état" }] });
  };
  const updateItem = (id, patch) => {
    update({ inventory: report.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  };
  const removeItem = (id) => {
    update({ inventory: report.inventory.filter((i) => i.id !== id) });
  };

  return (
    <div className="space-y-5">
      <SectionTitle num="04" title="Logistique & Production" />

      <div className="space-y-2">
        {report.inventory.length === 0 && (
          <div className="py-8 text-center text-stone-600 font-mono text-xs uppercase tracking-widest border border-dashed border-stone-800">
            Aucun élément
          </div>
        )}
        {report.inventory.map((item) => (
          <InventoryRow key={item.id} item={item} onUpdate={(patch) => updateItem(item.id, patch)} onRemove={() => removeItem(item.id)} />
        ))}
      </div>

      <button onClick={addItem} className="w-full py-3 border border-dashed border-stone-700 hover:border-lime-400 text-stone-400 hover:text-lime-400 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
        <Plus size={14} /> Ajouter un élément
      </button>
    </div>
  );
}

function InventoryRow({ item, onUpdate, onRemove }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-stone-950/50 border border-stone-800 p-2">
      <input type="text" value={item.item} onChange={(e) => onUpdate({ item: e.target.value })} placeholder="ex: Bâche 10m x 1m" className="col-span-12 sm:col-span-5 bg-stone-900 border border-stone-800 px-3 py-2 text-sm text-stone-100 focus:border-lime-400 outline-none" />
      <select value={item.source} onChange={(e) => onUpdate({ source: e.target.value })} className="col-span-5 sm:col-span-3 bg-stone-900 border border-stone-800 px-2 py-2 text-sm text-stone-100 focus:border-lime-400 outline-none">
        <option>Stock</option>
        <option>PROD (Neuf)</option>
        <option>Loué</option>
        <option>Réutilisé</option>
      </select>
      <input type="number" min="0" value={item.qty} onChange={(e) => onUpdate({ qty: parseInt(e.target.value) || 0 })} className="col-span-3 sm:col-span-1 bg-stone-900 border border-stone-800 px-2 py-2 text-sm text-stone-100 text-center focus:border-lime-400 outline-none font-mono" />
      <select value={item.state} onChange={(e) => onUpdate({ state: e.target.value })} className="col-span-3 sm:col-span-2 bg-stone-900 border border-stone-800 px-2 py-2 text-sm text-stone-100 focus:border-lime-400 outline-none">
        <option>Bon état</option>
        <option>Installé</option>
        <option>Usé</option>
        <option>Endommagé</option>
      </select>
      <button onClick={onRemove} className="col-span-1 p-2 text-stone-500 hover:text-red-400 transition-colors flex items-center justify-center">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function IncidentsSection({ report, update }) {
  const fileInputRefs = useRef({});

  const addIncident = () => {
    update({ incidents: [...report.incidents, { id: Date.now(), object: "", problem: "", severity: "reparable", action: "", photo: null }] });
  };
  const updateIncident = (id, patch) => {
    update({ incidents: report.incidents.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  };
  const removeIncident = (id) => {
    update({ incidents: report.incidents.filter((i) => i.id !== id) });
  };
  const handlePhoto = async (id, files) => {
    if (!files || !files[0]) return;
    const dataUrl = await fileToDataUrl(files[0]);
    updateIncident(id, { photo: dataUrl });
  };

  return (
    <div className="space-y-5">
      <SectionTitle num="05" title="Incidents & Maintenance" />

      {report.incidents.length === 0 && (
        <div className="py-10 text-center border border-dashed border-stone-800">
          <CheckCircle2 size={28} className="mx-auto text-lime-400 mb-3" />
          <div className="font-display text-lg text-stone-300">Aucun incident à signaler</div>
          <div className="font-mono text-[11px] text-stone-500 uppercase tracking-widest mt-1">
            Intervention sans accroc
          </div>
        </div>
      )}

      <div className="space-y-3">
        {report.incidents.map((inc) => (
          <div key={inc.id} className="border border-amber-900/50 bg-amber-950/10">
            <div className="flex items-center gap-3 p-3 border-b border-amber-900/40 bg-amber-950/20">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <span className="font-display text-sm uppercase tracking-wider text-amber-400 flex-1">
                Incident
              </span>
              <button onClick={() => removeIncident(inc.id)} className="p-1 text-stone-500 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <Field label="Objet concerné">
                <input type="text" value={inc.object} onChange={(e) => updateIncident(inc.id, { object: e.target.value })} placeholder="ex: Bâche 10m x 1m (Tribune Ouest)" className={inputCls} />
              </Field>

              <Field label="Description du problème">
                <textarea value={inc.problem} onChange={(e) => updateIncident(inc.id, { problem: e.target.value })} rows={2} placeholder="ex: Accroc de 20 cm, certainement dû à une rafale de vent" className={inputCls + " resize-none"} />
              </Field>

              <Field label="Sévérité">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "reparable", label: "Réparable", color: "amber" },
                    { val: "remplacer", label: "À remplacer", color: "orange" },
                    { val: "critique", label: "Critique", color: "red" },
                  ].map((opt) => {
                    const active = inc.severity === opt.val;
                    return (
                      <button key={opt.val} onClick={() => updateIncident(inc.id, { severity: opt.val })} className={`py-2 border font-mono text-[11px] uppercase tracking-widest transition-all ${
                        active
                          ? opt.color === "amber"
                            ? "bg-amber-500 text-stone-950 border-amber-500"
                            : opt.color === "orange"
                            ? "bg-orange-500 text-stone-950 border-orange-500"
                            : "bg-red-500 text-white border-red-500"
                          : "border-stone-700 text-stone-400 hover:border-stone-500"
                      }`}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Action requise">
                <input type="text" value={inc.action} onChange={(e) => updateIncident(inc.id, { action: e.target.value })} placeholder="ex: À inspecter au dépôt" className={inputCls} />
              </Field>

              <Field label="Photo de preuve">
                {inc.photo ? (
                  <div className="relative inline-block">
                    <img src={inc.photo} alt="Preuve" className="max-h-48 border border-stone-800" />
                    <button onClick={() => updateIncident(inc.id, { photo: null })} className="absolute top-2 right-2 w-7 h-7 bg-stone-950/80 text-white hover:bg-red-500 flex items-center justify-center">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input ref={(el) => (fileInputRefs.current[inc.id] = el)} type="file" accept="image/*" onChange={(e) => handlePhoto(inc.id, e.target.files)} className="hidden" />
                    <button onClick={() => fileInputRefs.current[inc.id]?.click()} className="px-4 py-2 border border-dashed border-stone-700 hover:border-amber-500 text-stone-400 hover:text-amber-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-colors">
                      <Camera size={14} /> Ajouter une photo
                    </button>
                  </>
                )}
              </Field>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addIncident} className="w-full py-3 border border-dashed border-stone-700 hover:border-amber-500 text-stone-400 hover:text-amber-500 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
        <Plus size={14} /> Signaler un incident
      </button>
    </div>
  );
}

function ReportPreview({ report, onBack, onEdit }) {
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportHTML = () => {
    const html = generateReportHTML(report);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.id}_${report.homeTeam.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    setExporting(true);
    try {
      // Lazy load to keep initial bundle small
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const RENDER_W = 794; // px, ~A4 width @ 96dpi

      // Render the printable HTML in a hidden offscreen container
      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-10000px";
      wrapper.style.top = "0";
      wrapper.style.width = RENDER_W + "px";
      wrapper.style.background = "#f5f5f4";
      wrapper.innerHTML = generateReportHTML(report);
      document.body.appendChild(wrapper);

      // Wait for fonts and images
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const imgs = Array.from(wrapper.querySelectorAll("img"));
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = img.onerror = res;
              })
        )
      );

      // PDF setup (A4 portrait)
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();   // 210
      const pageH = pdf.internal.pageSize.getHeight();  // 297
      const margin = 10;                                // mm
      const contentW = pageW - margin * 2;
      const usableH = pageH - margin * 2;
      const pxToMm = contentW / RENDER_W;               // scale: px -> mm

      const SCALE = 2; // html2canvas oversampling for sharpness

      // Capture one DOM element to a JPEG + its size in mm
      const captureBlock = async (el) => {
        const canvas = await html2canvas(el, {
          scale: SCALE,
          useCORS: true,
          backgroundColor: "#f5f5f4",
          logging: false,
        });
        return {
          data: canvas.toDataURL("image/jpeg", 0.92),
          wMm: (canvas.width / SCALE) * pxToMm,
          hMm: (canvas.height / SCALE) * pxToMm,
        };
      };

      // Ordered list of blocks: the banner first, then every .pdf-block
      const banner = wrapper.querySelector(".banner");
      const blocks = [
        ...(banner ? [banner] : []),
        ...Array.from(wrapper.querySelectorAll(".pdf-block")),
      ];

      let cursorY = margin; // current vertical position on the page (mm)

      for (let i = 0; i < blocks.length; i++) {
        const el = blocks[i];
        const block = await captureBlock(el);

        // The banner spans the full page width (no side margins)
        const isBanner = el === banner;
        let drawW = isBanner ? pageW : contentW;
        let drawH = isBanner
          ? (block.hMm * pageW) / block.wMm
          : block.hMm;
        let drawX = isBanner ? 0 : margin;

        // If a single block is taller than a full page, scale it down to fit
        if (drawH > usableH) {
          const ratio = usableH / drawH;
          drawH = usableH;
          drawW = drawW * ratio;
          drawX = isBanner ? (pageW - drawW) / 2 : margin + (contentW - drawW) / 2;
        }

        // Not enough room left on the current page -> new page
        const bottomLimit = pageH - margin;
        if (cursorY + drawH > bottomLimit && cursorY > margin) {
          pdf.addPage();
          cursorY = margin;
        }

        // "keep with next": a table header alone at the bottom is pushed
        // to the next page so it always sits above its first data row
        if (el.classList && el.classList.contains("pdf-keep-with-next")) {
          const next = blocks[i + 1];
          if (next) {
            const nextBlock = await captureBlock(next);
            const nextH = Math.min(nextBlock.hMm, usableH);
            if (cursorY + drawH + nextH > bottomLimit && cursorY > margin) {
              pdf.addPage();
              cursorY = margin;
            }
          }
        }

        const drawTop = isBanner ? cursorY : cursorY;
        pdf.addImage(block.data, "JPEG", drawX, drawTop, drawW, drawH);
        cursorY += drawH + (isBanner ? 4 : 2.5); // small gap between blocks
      }

      pdf.save(`${report.id}_${report.homeTeam.replace(/\s+/g, "_")}.pdf`);

      document.body.removeChild(wrapper);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Erreur lors de l'export PDF. Réessayez ou utilisez l'export HTML.");
    } finally {
      setExporting(false);
    }
  };

  const photoCount = report.zones.reduce((acc, z) => acc + z.photos.length, 0);
  const statusLabel = {
    accomplie: { txt: "Mission accomplie", icon: CheckCircle2, color: "text-lime-400" },
    partielle: { txt: "Mission partielle", icon: AlertTriangle, color: "text-amber-500" },
    echec: { txt: "Mission en échec", icon: AlertTriangle, color: "text-red-400" },
  }[report.missionStatus];
  const StatusIcon = statusLabel.icon;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-lime-400 font-mono text-xs uppercase tracking-widest">
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex items-center gap-2 relative">
          <button onClick={onEdit} className="px-3 sm:px-4 py-2.5 border border-stone-700 hover:border-stone-500 text-stone-300 font-mono text-xs uppercase tracking-widest">
            Modifier
          </button>
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={exporting}
            className="px-3 sm:px-4 py-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 disabled:cursor-wait text-stone-950 font-display text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <Download size={14} strokeWidth={3} />
            {exporting ? "Génération…" : "Exporter"}
          </button>
          {showExportMenu && !exporting && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-stone-900 border border-stone-700 shadow-2xl min-w-[200px]">
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-3 hover:bg-stone-800 border-b border-stone-800 flex items-center gap-3"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-lime-400 bg-lime-400/10 px-1.5 py-0.5">PDF</span>
                  <span className="font-display text-sm text-stone-100">Document PDF</span>
                </button>
                <button
                  onClick={handleExportHTML}
                  className="w-full text-left px-4 py-3 hover:bg-stone-800 flex items-center gap-3"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 bg-stone-800 px-1.5 py-0.5">HTML</span>
                  <span className="font-display text-sm text-stone-100">Page web</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <article className="bg-stone-100 text-stone-900 print:bg-white">
        <div className="bg-stone-950 text-stone-100 p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 stripe-bg opacity-50" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="w-12 h-12 bg-lime-400 flex items-center justify-center -rotate-3">
                <span className="font-display text-stone-950 text-xl">K</span>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase tracking-widest text-lime-400">{report.competition}</div>
                <div className="font-display text-sm">{report.matchType}</div>
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-lime-400 mb-2">
              Rapport d'intervention · {report.id}
            </div>
            <h1 className="font-display text-3xl sm:text-5xl leading-tight mb-4">
              {report.homeTeam}<br />
              <span className="text-stone-500">vs</span>{" "}
              <span className="text-lime-400">{report.awayTeam || "Adversaire"}</span>
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-mono">
              <span className="flex items-center gap-2"><Calendar size={14} /> {formatDate(report.date)}</span>
              <span className="flex items-center gap-2"><MapPin size={14} /> {report.venue}</span>
              <span className="flex items-center gap-2"><User size={14} /> {report.operator || "—"}</span>
              <span className="flex items-center gap-2"><Cloud size={14} /> {report.weather}</span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-10">
          <section>
            <DocSectionTitle num="01" title="Synthèse opérationnelle" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border-l-4 border-lime-500 bg-white p-5">
                <StatusIcon className={`${statusLabel.color} mb-2`} size={22} />
                <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-1">Statut</div>
                <div className="font-display text-xl">{statusLabel.txt}</div>
              </div>
              <div className="border-l-4 border-stone-900 bg-white p-5">
                <Camera className="text-stone-700 mb-2" size={22} />
                <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-1">Documentation</div>
                <div className="font-display text-xl">
                  {photoCount} photo{photoCount > 1 ? "s" : ""} · {report.zones.length} zone{report.zones.length > 1 ? "s" : ""}
                </div>
              </div>
            </div>
            {report.synthesisNotes && (
              <div className="mt-4 bg-white p-5 border border-stone-200">
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{report.synthesisNotes}</p>
              </div>
            )}
          </section>

          {report.zones.some((z) => z.photos.length > 0) && (
            <section>
              <DocSectionTitle num="02" title="Preuves de visibilité" />
              <div className="space-y-8">
                {report.zones.filter((z) => z.photos.length > 0).map((zone) => (
                  <div key={zone.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 bg-stone-950 text-lime-400 font-display flex items-center justify-center">
                        {zone.id}
                      </div>
                      <h3 className="font-display text-lg uppercase tracking-wide">{zone.name}</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {zone.photos.map((photo) => (
                        <figure key={photo.id} className="bg-white border border-stone-200">
                          <img src={photo.dataUrl} alt={photo.caption} className="w-full aspect-video object-cover" />
                          {photo.caption && (
                            <figcaption className="p-3 text-sm text-stone-700 border-t border-stone-200">
                              {photo.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {report.inventory.length > 0 && (
            <section>
              <DocSectionTitle num="03" title="Logistique & Production" />
              <div className="bg-white border border-stone-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-950 text-stone-100">
                    <tr>
                      <th className="text-left p-3 font-mono text-[10px] uppercase tracking-widest">Élément</th>
                      <th className="text-left p-3 font-mono text-[10px] uppercase tracking-widest">Provenance</th>
                      <th className="text-center p-3 font-mono text-[10px] uppercase tracking-widest">Qté</th>
                      <th className="text-left p-3 font-mono text-[10px] uppercase tracking-widest">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.inventory.map((item, i) => (
                      <tr key={item.id} className={i % 2 ? "bg-stone-50" : "bg-white"}>
                        <td className="p-3 font-medium">{item.item}</td>
                        <td className="p-3 text-stone-600">{item.source}</td>
                        <td className="p-3 text-center font-mono font-bold">{item.qty}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 text-[11px] font-mono uppercase tracking-widest ${
                            item.state === "Endommagé" || item.state === "Usé"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-lime-100 text-lime-900"
                          }`}>
                            {item.state}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {report.incidents.length > 0 && (
            <section>
              <DocSectionTitle num="04" title="Incidents & Maintenance" />
              <div className="space-y-3">
                {report.incidents.map((inc) => (
                  <div key={inc.id} className="border-l-4 border-amber-500 bg-amber-50 p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                      <div className="flex-1">
                        <div className="font-display text-lg">{inc.object || "Incident"}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${
                          inc.severity === "critique" ? "bg-red-200 text-red-900"
                          : inc.severity === "remplacer" ? "bg-orange-200 text-orange-900"
                          : "bg-amber-200 text-amber-900"
                        }`}>
                          {inc.severity}
                        </span>
                      </div>
                    </div>
                    {inc.problem && <p className="text-stone-700 mb-2">{inc.problem}</p>}
                    {inc.action && (
                      <div className="text-sm">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">Action : </span>
                        <span className="text-stone-800">{inc.action}</span>
                      </div>
                    )}
                    {inc.photo && (
                      <img src={inc.photo} alt="Preuve incident" className="mt-3 max-h-64 border border-amber-200" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <footer className="border-t-2 border-stone-900 pt-6 flex flex-wrap items-end justify-between gap-4 text-sm">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">Signature</div>
              <div className="font-display text-lg">{report.operator || "—"}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">Généré le</div>
              <div className="font-mono text-stone-700">{formatDateTime(report.createdAt)}</div>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}

const inputCls = "w-full bg-stone-950 border border-stone-700 px-3 py-2.5 text-sm text-stone-100 focus:border-lime-400 outline-none transition-colors placeholder-stone-600";

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </div>
      {children}
    </label>
  );
}

function SectionTitle({ num, title }) {
  return (
    <div className="flex items-baseline gap-3 mb-2 pb-3 border-b border-stone-800">
      <span className="font-mono text-xs text-lime-400 tracking-widest">{num}</span>
      <h3 className="font-display text-xl uppercase tracking-tight">{title}</h3>
    </div>
  );
}

function DocSectionTitle({ num, title }) {
  return (
    <div className="flex items-baseline gap-3 mb-5 pb-2 border-b-2 border-stone-900">
      <span className="font-mono text-xs text-stone-500 tracking-widest">{num}</span>
      <h2 className="font-display text-2xl uppercase tracking-tight">{title}</h2>
    </div>
  );
}

function generateReportHTML(report) {
  const photoCount = report.zones.reduce((a, z) => a + z.photos.length, 0);
  const statusLabel = {
    accomplie: "Mission accomplie",
    partielle: "Mission partielle",
    echec: "Mission en échec",
  }[report.missionStatus];

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${report.id} - ${report.homeTeam} vs ${report.awayTeam}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Archivo', sans-serif; color: #1c1917; background: #f5f5f4; line-height: 1.5; }
.banner { background: #0c0a09; color: #f5f5f4; padding: 40px; }
.banner h1 { font-family: 'Archivo Black', sans-serif; font-size: 48px; line-height: 1.1; margin: 16px 0; letter-spacing: -0.02em; }
.banner .accent { color: #a3e635; }
.banner .meta { font-family: 'JetBrains Mono', monospace; font-size: 12px; opacity: 0.8; }
.content { padding: 40px; max-width: 900px; margin: 0 auto; }
section { margin-bottom: 40px; }
h2 { font-family: 'Archivo Black', sans-serif; font-size: 24px; padding-bottom: 8px; border-bottom: 2px solid #0c0a09; margin-bottom: 20px; text-transform: uppercase; }
h3 { font-family: 'Archivo Black', sans-serif; font-size: 16px; text-transform: uppercase; margin: 16px 0 12px; }
.card { background: white; padding: 20px; border-left: 4px solid #84cc16; margin-bottom: 12px; }
.card.amber { border-left-color: #f59e0b; background: #fffbeb; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
img { max-width: 100%; display: block; border: 1px solid #e7e5e4; }
figure { background: white; border: 1px solid #e7e5e4; }
figcaption { padding: 12px; font-size: 14px; border-top: 1px solid #e7e5e4; }
table { width: 100%; background: white; border-collapse: collapse; table-layout: fixed; }
col.c-item { width: 46%; }
col.c-source { width: 24%; }
col.c-qty { width: 12%; }
col.c-state { width: 18%; }
th { background: #0c0a09; color: white; padding: 12px; text-align: left; font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
td { padding: 12px; border-bottom: 1px solid #e7e5e4; word-wrap: break-word; }
tr { background: white; }
.tag { display: inline-block; padding: 2px 8px; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; background: #ecfccb; color: #365314; }
footer { margin-top: 40px; padding-top: 24px; border-top: 2px solid #0c0a09; display: flex; justify-content: space-between; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #78716c; }
@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } .banner h1 { font-size: 32px; } }
</style></head><body>
<div class="banner">
  <div class="meta">${report.competition} · ${report.matchType} · ${report.id}</div>
  <h1>${report.homeTeam}<br><span style="color:#78716c">vs</span> <span class="accent">${report.awayTeam || "Adversaire"}</span></h1>
  <div class="meta">${formatDate(report.date)} · ${report.venue} · ${report.operator || "—"} · Météo: ${report.weather}</div>
</div>
<div class="content">
  <section>
    <h2 class="pdf-block">01 — Synthèse</h2>
    <div class="card pdf-block">
      <div class="mono">Statut</div>
      <div style="font-family:'Archivo Black';font-size:20px;margin-top:4px">${statusLabel}</div>
    </div>
    ${report.synthesisNotes ? `<div class="card pdf-block">${report.synthesisNotes.replace(/\n/g, "<br>")}</div>` : ""}
  </section>

  ${report.zones.some(z => z.photos.length) ? `<section>
    <h2 class="pdf-block">02 — Preuves de visibilité (${photoCount} photos)</h2>
    ${report.zones.filter(z => z.photos.length).map(z => `
      <h3 class="pdf-block">Zone ${z.id} — ${z.name}</h3>
      <div class="grid">
        ${z.photos.map(p => `<figure class="pdf-block"><img src="${p.dataUrl}"/>${p.caption ? `<figcaption>${p.caption}</figcaption>` : ""}</figure>`).join("")}
      </div>
    `).join("")}
  </section>` : ""}

  ${report.inventory.length ? `<section>
    <h2 class="pdf-block">03 — Logistique & Production</h2>
    <table>
      <colgroup>
        <col class="c-item"><col class="c-source"><col class="c-qty"><col class="c-state">
      </colgroup>
      <tbody>
        <tr class="pdf-block pdf-keep-with-next">
          <th>Élément</th><th>Provenance</th><th>Qté</th><th>État</th>
        </tr>
        ${report.inventory.map(i => `<tr class="pdf-block"><td><strong>${i.item}</strong></td><td>${i.source}</td><td><strong>${i.qty}</strong></td><td><span class="tag">${i.state}</span></td></tr>`).join("")}
      </tbody>
    </table>
  </section>` : ""}

  ${report.incidents.length ? `<section>
    <h2 class="pdf-block">04 — Incidents & Maintenance</h2>
    ${report.incidents.map(inc => `
      <div class="card amber pdf-block">
        <div style="font-family:'Archivo Black';font-size:18px">${inc.object || "Incident"}</div>
        <div class="mono" style="margin:4px 0">Sévérité : ${inc.severity}</div>
        ${inc.problem ? `<p style="margin:8px 0">${inc.problem}</p>` : ""}
        ${inc.action ? `<div><span class="mono">Action :</span> ${inc.action}</div>` : ""}
        ${inc.photo ? `<img src="${inc.photo}" style="margin-top:12px;max-height:300px;width:auto"/>` : ""}
      </div>
    `).join("")}
  </section>` : ""}

  <footer class="pdf-block">
    <div><div class="mono">Signature</div><div style="font-family:'Archivo Black';font-size:18px">${report.operator || "—"}</div></div>
    <div style="text-align:right"><div class="mono">Généré le</div><div class="mono">${formatDateTime(report.createdAt)}</div></div>
  </footer>
</div>
</body></html>`;
}
