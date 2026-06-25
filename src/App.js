import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  PlusCircle, FolderOpen, Search, FileText, Clock, X,
  ChevronRight, Download, Cloud, Activity, Users, ClipboardList,
  ShieldCheck, Layers, Map, Target, Trash2, History,
  FileSearch, Archive, ListChecks, Package,
  Copy, Scissors, Clipboard, Printer, Upload, ChevronLeft,
  Columns, AlertTriangle, ChevronUp, ChevronDown, CopyPlus,
  FilePlus, FolderSync, LogOut, ArrowUp, ArrowDown,
  Settings, Check, FileUp, ClipboardCheck, Zap, Grid3X3,
  Boxes, Calendar, CheckSquare, Bell, BarChart2, UserCheck, Info, Plus
} from 'lucide-react';

// ─────────────────────────────────────────────
// PRINT / PDF STYLES
// ─────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  @page {
    size: landscape;
    margin: 6mm;
  }
  * { box-sizing: border-box; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 6px !important; }
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  header, nav, aside { display: none !important; }
  main { overflow: visible !important; padding: 0 !important; margin: 0 !important; }
  .custom-scroll { overflow: visible !important; }
  .flex-1 { overflow: visible !important; }
  .min-w-max { min-width: 0 !important; width: 100% !important; }
  /* PHA Worksheet table: fit all columns in landscape A4 */
  .pha-print-table { width: 100% !important; table-layout: fixed !important; font-size: 5.5px !important; border-collapse: collapse !important; }
  .pha-print-table th, .pha-print-table td { padding: 1.5px 2px !important; font-size: 5.5px !important; word-wrap: break-word !important; white-space: normal !important; overflow: hidden !important; }
  table { width: 100% !important; table-layout: fixed !important; font-size: 6px !important; border-collapse: collapse !important; }
  th, td { padding: 1.5px 2px !important; font-size: 6px !important; word-wrap: break-word !important; white-space: normal !important; }
  input, textarea, select { font-size: 6px !important; padding: 0 !important; border: none !important; background: transparent !important; resize: none !important; }
  .divide-y > div { break-inside: avoid; page-break-inside: avoid; }
  .overflow-hidden { overflow: visible !important; }
  .overflow-auto { overflow: visible !important; }
  .pha-header-block { display: block !important; }
  .sticky { position: relative !important; }
  [style*="background-color"] { -webkit-print-color-adjust: exact; }
  /* Hide worksheet scroll wrappers, show all rows */
  .pha-scroll-container { overflow: visible !important; height: auto !important; max-height: none !important; }
  /* Compact header block */
  .pha-header-table { font-size: 6px !important; }
  .pha-header-table td, .pha-header-table th { padding: 1px 2px !important; font-size: 6px !important; }
  /* Row groups */
  .pha-deviation-group { break-inside: avoid; page-break-inside: avoid; }
  /* Hide row add buttons, context menus */
  button.no-print { display: none !important; }
  .pha-col-groups { font-size: 5px !important; }
}
`;

const injectPrintStyles = () => {
  const existing = document.getElementById('pha-print-styles');
  if (!existing) {
    const style = document.createElement('style');
    style.id = 'pha-print-styles';
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
  }
};

const handlePrintAction = () => {
  injectPrintStyles();
  setTimeout(() => window.print(), 100);
};

const handleDownloadPDF = () => {
  injectPrintStyles();
  setTimeout(() => window.print(), 150);
};

// ─────────────────────────────────────────────
// CONSTANTS & COLUMN DEFINITIONS
// ─────────────────────────────────────────────

// Node Registry: description/intention/boundary/equipment_count only
const DEFAULT_NODE_COLS = [
  { id: 'description',   label: 'DESCRIPTION',  width: 250 },
  { id: 'intention',     label: 'INTENTION',    width: 250 },
  { id: 'boundary',      label: 'BOUNDARY',     width: 200 },
  { id: 'equipment_count', label: 'EQ. COUNT',  width: 80, isAuto: true },
];

// Equipment columns (per node, inside Equipment Modal)
const DEFAULT_EQUIPMENT_COLS = [
  { id: 'tag',              label: 'TAG NO.',           width: 120 },
  { id: 'description',     label: 'EQUIPMENT NAME',    width: 180 },
  { id: 'designConditions',label: 'OPERATION CONDITIONS', width: 150 },
  { id: 'capacity',        label: 'CAPACITY',           width: 100 },
  { id: 'moc',             label: 'MOC',                width: 100 },
  { id: 'temp',            label: 'DESIGN TEMP',        width: 100 },
  { id: 'pres',            label: 'DESIGN PRES',        width: 100 },
];

const DEFAULT_PID_COLS = [
  { id: 'drawingId',   label: 'DRAWING ID',     width: 160 },
  { id: 'revision',    label: 'REV.',            width:  60 },
  { id: 'docType',     label: 'DOCUMENT TYPE',  width: 160 },
  { id: 'description', label: 'DESCRIPTION',    width: 320 },
  { id: 'link',        label: 'HYPERLINK / URL', width: 220 },
  { id: 'attachment',  label: 'ATTACHMENT',     width: 250, type: 'file' },
];

const DEFAULT_DEVIATION_COLS = [
  { id: 'guideword',    label: 'GUIDEWORDS',              width: 120, textColor: 'text-blue-600'   },
  { id: 'parameter',    label: 'PARAMETER',               width: 120, textColor: 'text-green-600'  },
  { id: 'material',     label: 'PROCESS FLOW / MATERIAL', width: 180, textColor: 'text-orange-600' },
  { id: 'locationFrom', label: 'LOCATION FROM',           width: 140, textColor: 'text-red-500'    },
  { id: 'locationTo',   label: 'LOCATION TO',             width: 140, textColor: 'text-purple-600' },
  { id: 'deviationStr', label: 'DEVIATION (AUTO)',        width: 350, isAuto: true                 },
];

const DEFAULT_CAUSE_COLS = [
  { id: 'description', label: 'CAUSE DESCRIPTION',  width: 400 },
  { id: 'category',    label: 'CATEGORY / TYPE',     width: 150 },
  { id: 'source',      label: 'SOURCE / REFERENCE',  width: 150 },
  { id: 'comments',    label: 'COMMENTS',            width: 220 },
];

const DEFAULT_REC_COLS = [
  { id: 'description',    label: 'PHA RECOMMENDATION',  width: 360 },
  { id: 'priority',       label: 'PRIORITY',            width:  90, type: 'select', opts: ['High','Medium','Low'] },
  { id: 'responsibility', label: 'RESPONSIBLE PARTY',   width: 160 },
  { id: 'status',         label: 'STATUS',              width: 160, type: 'select', opts: ['Proposed','Pending','Under Review','In Progress','Completed','Implemented','Closed','Removed','Not Applicable'] },
  { id: 'dueDate',        label: 'DUE DATE',            width: 120, type: 'date'   },
  { id: 'comments',       label: 'COMMENTS',            width: 220 },
  { id: 'reference',      label: 'REF.',                width:  70, group: 'Risk Reference', isAuto: true },
  { id: 'cat',            label: 'CAT',                 width:  55, group: 'Risk Reference' },
  { id: 's_before',       label: 'S',                   width:  45, group: 'Inherent Risk', isRisk: true },
  { id: 'p_before',       label: 'P',                   width:  45, group: 'Inherent Risk', isRisk: true },
  { id: 'ir_val',         label: 'IR',                  width:  55, group: 'Inherent Risk', isCalculated: true },
  { id: 's_after',        label: 'S',                   width:  45, group: 'Residual Risk', isRisk: true },
  { id: 'p_after',        label: 'P',                   width:  45, group: 'Residual Risk', isRisk: true },
  { id: 'rr_val',         label: 'RR',                  width:  55, group: 'Residual Risk', isCalculated: true },
];

const PHA_COLUMN_DEFS = [
  { id: 'sr',         label: 'Sr. No.',                                        width: '50px',  fixed: true },
  { id: 'gword',      label: 'Guide Word',                                     width: '120px', visible: true, isRegistryLink: true },
  { id: 'param',      label: 'Parameter',                                      width: '120px', visible: true, isRegistryLink: true },
  { id: 'mat',        label: 'Material',                                       width: '120px', visible: true, isRegistryLink: true },
  { id: 'from',       label: 'From',                                           width: '110px', visible: true, isRegistryLink: true },
  { id: 'to',         label: 'To',                                             width: '110px', visible: true, isRegistryLink: true },
  { id: 'dev',        label: 'Deviations',                                     width: '250px', visible: true, isAuto: true },
  { id: 'causes',     label: 'Causes',                                         width: '280px', visible: true, isBullet: true },
  { id: 'consImm',    label: 'Immediate',                                      width: '180px', visible: true, group: 'Consequences', isBullet: true },
  { id: 'consUlt',    label: 'Ultimate',                                       width: '180px', visible: true, group: 'Consequences', isBullet: true },
  { id: 'rawS',       label: 'S',                                              width: '45px',  visible: true, group: 'Inherent Risk', isRisk: true },
  { id: 'rawL',       label: 'P',                                              width: '45px',  visible: true, group: 'Inherent Risk', isRisk: true },
  { id: 'rawR',       label: 'IR',                                             width: '60px',  visible: true, group: 'Inherent Risk', isCalculated: true },
  { id: 'safeguards', label: 'Present / Planned Protection (Safeguards)',      width: '280px', visible: true, isBullet: true },
  { id: 'mitS',       label: 'S',                                              width: '45px',  visible: true, group: 'Mitigated Risk', isRisk: true },
  { id: 'mitL',       label: 'P',                                              width: '45px',  visible: true, group: 'Mitigated Risk', isRisk: true },
  { id: 'mitR',       label: 'MR',                                             width: '60px',  visible: true, group: 'Mitigated Risk', isCalculated: true },
  { id: 'recs',       label: 'Additional Protection Needed (Recommendations)', width: '300px', visible: true, isBullet: true },
  { id: 'resS',       label: 'S',                                              width: '45px',  visible: true, group: 'Residual Risk', isRisk: true },
  { id: 'resL',       label: 'P',                                              width: '45px',  visible: true, group: 'Residual Risk', isRisk: true },
  { id: 'resRR',      label: 'RR',                                             width: '60px',  visible: true, group: 'Residual Risk', isCalculated: true },
  { id: 'remarks',    label: 'Remarks',                                        width: '150px', visible: true },
  { id: 'status',     label: 'Status',                                         width: '120px', visible: true, type: 'select', opts: ['Proposed','Pending','Implemented','Closed'] },
];

const TOP_TABS = [
  { id: 'data',       label: 'Study Data',       Icon: FileText       },
  { id: 'nodes',      label: 'Nodes',            Icon: Map            },
  { id: 'deviations', label: 'Deviations',       Icon: Layers         },
  { id: 'causes',     label: 'Causes Worksheet', Icon: Target         },
  { id: 'pha',        label: 'PHA Worksheets',   Icon: ClipboardList  },
  { id: 'safeguards', label: 'Safeguards',        Icon: ShieldCheck    },
  { id: 'recs',       label: 'Recommendations',  Icon: ClipboardCheck },
  { id: 'checklists', label: 'Check Lists',      Icon: ListChecks     },
  { id: 'risk',       label: 'Risk Criteria',    Icon: Activity       },
  { id: 'actions',    label: 'Action Tracking',  Icon: CheckSquare    },
];

const SIDE_NAV = {
  data:       [{ id: 'overview',  label: 'Overview',            Icon: FileSearch   }, { id: 'team',      label: 'Team Members',         Icon: Users        }, { id: 'documents', label: 'Documents', Icon: Archive }],
  nodes:      [{ id: 'list',      label: 'Node Registry',       Icon: Map          }, { id: 'pids',      label: 'P&ID Reference',        Icon: Archive      }],
  deviations: [{ id: 'list',      label: 'Deviations Registry', Icon: Layers       }],
  causes:     [{ id: 'list',      label: 'Causes Registry',     Icon: Target       }],
  safeguards: [{ id: 'list',      label: 'Safeguards Registry', Icon: ShieldCheck  }],
  recs:       [{ id: 'list',      label: 'Action Items',        Icon: ClipboardCheck }],
  checklists: [{ id: 'list',      label: 'Checklist Registry',  Icon: ListChecks   }],
  pha:        [{ id: 'sheet',     label: 'Analysis Sheet',      Icon: ClipboardList }, { id: 'summary',   label: 'Risk Summary',          Icon: Activity     }],
  risk:       [
    { id: 'matrix',         label: 'Risk Matrix HAZOP',       Icon: Grid3X3      },
    { id: 'likelihoods',    label: 'Likelihood',              Icon: Activity     },
    { id: 'consequences',   label: 'Consequence Category',    Icon: AlertTriangle },
    { id: 'severity',       label: 'Severity',                Icon: Zap          },
    { id: 'rankings',       label: 'Risk Color',              Icon: Package      },
    { id: 'globalcolor',    label: 'Global Color',            Icon: Bell         },
    { id: 'plant',          label: 'Plant',                   Icon: Boxes        },
    { id: 'node_risk',      label: 'Node',                    Icon: Map          },
    { id: 'responsivity',   label: 'Responsivity By',         Icon: UserCheck    },
  ],
  actions: [
    { id: 'dashboard',  label: 'Dashboard',          Icon: BarChart2    },
    { id: 'tracker',    label: 'Action Register',    Icon: CheckSquare  },
    { id: 'team',       label: 'Team Workload',      Icon: UserCheck    },
  ],
};

// ─────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────

const RISK_CHANNELS = ['Safety', 'Environment', 'Assets', 'Community', 'Reputation'];

// Severity codes S0–S4 mapped to numeric values 0–4
// Frequency codes F1–F5 mapped to numeric values 1–5
// Risk = Severity × Frequency (matches the image: 5×5 matrix with values 1–25)
const SEV_LABELS = [
  { code: 'S0', label: 'Negligible', value: 1 },
  { code: 'S1', label: 'Low',        value: 2 },
  { code: 'S2', label: 'Medium',     value: 3 },
  { code: 'S3', label: 'High',       value: 4 },
  { code: 'S4', label: 'Catastrophic', value: 5 },
];
const FREQ_LABELS = [
  { code: 'F1', label: 'LOW (1 in 100–1000 yrs)',         value: 1 },
  { code: 'F2', label: 'OCCASIONAL (1 in 10–99 yrs)',     value: 2 },
  { code: 'F3', label: 'HIGH (1 in 1–9 yrs)',             value: 3 },
  { code: 'F4', label: 'VERY HIGH (<1/year)',              value: 4 },
  { code: 'F5', label: 'EXTREMELY PROBABLE (once/month)', value: 5 },
];

// Matrix cell color thresholds matching the image exactly
const getMatrixCellColor = (score) => {
  if (score === 0) return '#ffffff';
  if (score >= 15) return '#dc2626'; // Red
  if (score >= 8)  return '#facc15'; // Yellow
  if (score >= 5)  return '#facc15'; // Yellow (borderline)
  return '#16a34a'; // Green
};

// More precise matching per image:
// Green: 1,2,3,4 | Yellow: 5,6,8,9,10 | Red: 10+,12,15,16,20,25
const getMatrixCellColorExact = (freq, sev) => {
  const score = freq * sev;
  if (score === 0) return '#f8fafc';
  // Match image exactly
  if (freq === 5 && sev === 1) return '#facc15'; // 5 - yellow
  if (freq <= 4 && sev <= 1)   return '#16a34a'; // 1-4 green
  if (freq === 1 && sev >= 1 && sev <= 4) return '#16a34a'; // col1 mostly green
  if (score >= 10) return '#dc2626';
  if (score >= 5)  return '#facc15';
  return '#16a34a';
};

const buildDefaultRiskMatrix = () => {
  const matrix = {};
  RISK_CHANNELS.forEach(ch => {
    matrix[ch] = {};
    // freq rows F1-F5, sev cols S0-S4
    FREQ_LABELS.forEach(f => {
      SEV_LABELS.forEach(s => {
        matrix[ch][`F${f.value}_S${s.value}`] = f.value * s.value;
      });
    });
  });
  return matrix;
};

const DEFAULT_MATRIX_VALUES = {
  VH: { VL: 3, L: 3, M: 4, H: 4, VH: 5 },
  H:  { VL: 2, L: 3, M: 3, H: 4, VH: 4 },
  M:  { VL: 2, L: 2, M: 3, H: 3, VH: 4 },
  L:  { VL: 1, L: 2, M: 2, H: 3, VH: 3 },
  VL: { VL: 1, L: 1, M: 2, H: 2, VH: 3 },
};

const DEFAULT_RANKING_COLS = [
  { id: 'code',        label: 'CODE',        width: 80  },
  { id: 'description', label: 'DESCRIPTION', width: 250 },
  { id: 'color',       label: 'COLOR',       width: 80,  type: 'color' },
  { id: 'priority',    label: 'PRIORITY',    width: 100 },
];

const DEFAULT_RANKINGS = [
  { id: 'r5', code: '5', description: 'Very High — Immediate action required',  color: '#7f1d1d', priority: '1' },
  { id: 'r4', code: '4', description: 'High — Urgent action required',           color: '#dc2626', priority: '2' },
  { id: 'r3', code: '3', description: 'Medium — Action plan required',           color: '#f97316', priority: '3' },
  { id: 'r2', code: '2', description: 'Low — Monitor and review',               color: '#fbbf24', priority: '4' },
  { id: 'r1', code: '1', description: 'Very Low — Acceptable risk',             color: '#16a34a', priority: '5' },
];

// Global Risk Colors: map score ranges to colors (editable from UI)
const DEFAULT_GLOBAL_COLORS = [
  { id: 'gc1', range: '1–4',   label: 'Green / Acceptable',   color: '#16a34a', textColor: '#ffffff', minScore: 1,  maxScore: 4  },
  { id: 'gc2', range: '5–9',   label: 'Yellow / Review',      color: '#facc15', textColor: '#7a4f00', minScore: 5,  maxScore: 9  },
  { id: 'gc3', range: '10–14', label: 'Orange / Action',      color: '#f97316', textColor: '#ffffff', minScore: 10, maxScore: 14 },
  { id: 'gc4', range: '15–25', label: 'Red / Unacceptable',   color: '#dc2626', textColor: '#ffffff', minScore: 15, maxScore: 25 },
];

// Severity levels (editable)
const DEFAULT_SEVERITY_LEVELS = [
  { id: 'sv0', code: 'S0', label: 'Negligible',    value: 0, color: '#94a3b8', description: 'No measurable impact' },
  { id: 'sv1', code: 'S1', label: 'Low',           value: 1, color: '#16a34a', description: 'Minor injury / low financial loss' },
  { id: 'sv2', code: 'S2', label: 'Medium',        value: 2, color: '#facc15', description: 'Medical treatment / moderate loss' },
  { id: 'sv3', code: 'S3', label: 'High',          value: 3, color: '#f97316', description: 'Serious injury / major loss' },
  { id: 'sv4', code: 'S4', label: 'Catastrophic',  value: 4, color: '#dc2626', description: 'Fatality / catastrophic loss' },
];

const GET_DYNAMIC_RISK_STYLE = (score, rankings = [], globalColors = DEFAULT_GLOBAL_COLORS) => {
  const s = parseInt(score) || 0;
  if (s === 0) return { backgroundColor: '#f1f5f9', color: '#94a3b8' };
  // Try global colors first
  const gc = (globalColors || DEFAULT_GLOBAL_COLORS).find(g => s >= g.minScore && s <= g.maxScore);
  if (gc) return { backgroundColor: gc.color, color: gc.textColor || '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' };
  if (s >= 15) return { backgroundColor: '#dc2626', color: '#fff' };
  if (s >= 10) return { backgroundColor: '#f97316', color: '#fff' };
  if (s >= 5)  return { backgroundColor: '#facc15', color: '#7a4f00' };
  return { backgroundColor: '#16a34a', color: '#fff' };
};

const GET_RISK_COLOR = (score, rankings = [], globalColors = DEFAULT_GLOBAL_COLORS) => {
  if (!score || score === 0) return { bg: '#f1f5f9', text: '#94a3b8' };
  const gc = (globalColors || DEFAULT_GLOBAL_COLORS).find(g => score >= g.minScore && score <= g.maxScore);
  if (gc) return { bg: gc.color, text: gc.textColor || '#fff' };
  if (score >= 15) return { bg: '#dc2626', text: '#fff' };
  if (score >= 10) return { bg: '#f97316', text: '#fff' };
  if (score >= 5)  return { bg: '#facc15', text: '#7a4f00' };
  return { bg: '#16a34a', text: '#fff' };
};

const RISK_STYLE = (val) => {
  if (!val || val === 0) return 'bg-slate-100 text-slate-400';
  if (val >= 15) return 'bg-red-600 text-white';
  if (val >= 10) return 'bg-orange-500 text-white';
  if (val >= 5)  return 'bg-yellow-400 text-amber-900';
  return 'bg-emerald-600 text-white';
};

// ─────────────────────────────────────────────
// SHARED SMALL COMPONENTS
// ─────────────────────────────────────────────

function ToolbarButton({ icon, onClick, title, className = '', disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-all border border-transparent hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      title={title}>
      <span className="flex items-center justify-center">{icon}</span>
    </button>
  );
}

function ContextItem({ icon, label, onClick, danger = false }) {
  return (
    <button onClick={onClick}
      className={`w-full px-4 py-2 flex items-center gap-3 text-[11px] font-bold ${danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-600 hover:bg-teal-50 hover:text-[#00B2B2]'} transition-colors text-left`}>
      {icon} <span>{label}</span>
    </button>
  );
}

function CardAction({ icon, label, desc, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#00B2B2] border-l-4 border-l-slate-200 hover:border-l-[#00B2B2] transition-all flex items-center gap-6 group text-left active:scale-[0.98] cursor-pointer">
      <div className="shrink-0 p-4 bg-slate-50 rounded-2xl group-hover:bg-teal-50 transition-all">{icon}</div>
      <div className="overflow-hidden">
        <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">{label}</h3>
        <p className="text-[10px] font-medium text-slate-400 mt-1 truncate">{desc}</p>
      </div>
    </button>
  );
}

function MiniStat({ label, value, Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
      <div className={`p-3 rounded-2xl bg-slate-50 ${color}`}><Icon size={18} /></div>
      <div>
        <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

function OverviewField({ label, val, onChange, type = 'text', opts = [] }) {
  return (
    <div className="flex items-center gap-6 border-b border-slate-100 pb-2">
      <label className="w-1/3 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="w-2/3">
        {type === 'select' ? (
          <select className="w-full bg-slate-50 px-4 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-[#00B2B2] cursor-pointer" value={val || ''} onChange={e => onChange(e.target.value)}>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} className="w-full bg-slate-50 px-4 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-[#00B2B2]" value={String(val || '')} onChange={e => onChange(e.target.value)} />
        )}
      </div>
    </div>
  );
}

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-slate-100">
          <button onClick={onCancel} className="flex-1 py-5 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors border-r border-slate-100">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-slate-50 transition-colors">Proceed</button>
        </div>
      </div>
    </div>
  );
}

function ModalField({ label, val, onChange, type = 'text', opts = [] }) {
  return (
    <div className="flex items-center gap-4 group py-1 border-b border-slate-50 last:border-0">
      <label className="w-1/3 text-right text-[11px] font-bold text-slate-500 whitespace-nowrap">{label}</label>
      <div className="w-2/3">
        {type === 'select' ? (
          <select className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm outline-none" value={val || ''} onChange={e => onChange(e.target.value)}>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm outline-none" value={val || ''} onChange={e => onChange(e.target.value)} />
        )}
      </div>
    </div>
  );
}

function StudyModalForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', coordinator: '', contact: '', type: 'HAZOP', status: 'Planned', facility: '', owner: '', unit: '' });
  return (
    <div className="space-y-1">
      <ModalField label="Study Name"        val={form.name}        onChange={v => setForm({ ...form, name: v })} />
      <ModalField label="Study Coordinator" val={form.coordinator} onChange={v => setForm({ ...form, coordinator: v })} />
      <ModalField label="Contact Info"      val={form.contact}     onChange={v => setForm({ ...form, contact: v })} />
      <ModalField label="Facility"          val={form.facility}    onChange={v => setForm({ ...form, facility: v })} />
      <ModalField label="Owner"             val={form.owner}       onChange={v => setForm({ ...form, owner: v })} />
      <ModalField label="Plant / Unit"      val={form.unit}        onChange={v => setForm({ ...form, unit: v })} />
      <ModalField label="PHA Type"   val={form.type}   type="select" opts={['HAZOP','LOPA','What-If','Checklist']} onChange={v => setForm({ ...form, type: v })} />
      <ModalField label="Study Status" val={form.status} type="select" opts={['Planned','Draft','Approved']}        onChange={v => setForm({ ...form, status: v })} />
      <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 mt-4 rounded-b-lg">
        <button onClick={onCancel} className="px-6 py-2 rounded border border-slate-300 font-bold text-xs hover:bg-white cursor-pointer transition-colors text-slate-500 uppercase tracking-widest">Cancel</button>
        <button onClick={() => onSubmit(form)} className="px-10 py-2 bg-[#004a7c] text-white rounded font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer uppercase tracking-widest">Create</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PHA WORKSHEET CELL RENDERER
// ─────────────────────────────────────────────

// Arrow-key navigation helper: finds all focusable cells in the PHA worksheet
const navigateCell = (e, rowIndex, colIndex, totalRows, totalCols) => {
  const container = e.target.closest('.pha-worksheet-grid');
  if (!container) return;
  const cells = Array.from(container.querySelectorAll('[data-cell]'));
  const currentKey = `${rowIndex}-${colIndex}`;
  const currentIdx = cells.findIndex(c => c.dataset.cell === currentKey);
  if (currentIdx === -1) return;
  let nextIdx = -1;
  if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
    nextIdx = currentIdx + 1;
    e.preventDefault();
  } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
    nextIdx = currentIdx - 1;
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    // Find next row, same column
    const targetKey = `${rowIndex + 1}-${colIndex}`;
    nextIdx = cells.findIndex(c => c.dataset.cell === targetKey);
    e.preventDefault();
  } else if (e.key === 'ArrowUp') {
    const targetKey = `${rowIndex - 1}-${colIndex}`;
    nextIdx = cells.findIndex(c => c.dataset.cell === targetKey);
    e.preventDefault();
  }
  if (nextIdx >= 0 && nextIdx < cells.length) {
    const el = cells[nextIdx].querySelector('input,textarea,select') || cells[nextIdx];
    el.focus();
    if (el.select) el.select();
  }
};

const renderWorksheetCell = (col, row, rIdx, studyData, handleCellUpdate, colIndex = 0) => {
  const base = 'w-full h-full border-transparent outline-none p-2 transition-all';
  const navProps = (e) => navigateCell(e, rIdx, colIndex, 9999, 9999);

  if (col.id === 'sr') return (
    <div data-cell={`${rIdx}-${colIndex}`} className="w-full text-center font-black text-slate-300 text-xs py-2 bg-slate-100/30 leading-tight">{rIdx + 1}</div>
  );

  if (col.isAuto && col.id === 'dev') {
    const gen = `${row.gword || ''} ${row.param || ''} of ${row.mat || ''} from ${row.from || ''} to ${row.to || ''}`.trim().replace(/\s+/g, ' ');
    return (
      <div data-cell={`${rIdx}-${colIndex}`} className="w-full h-full">
        <textarea
          className={`${base} bg-transparent text-[11px] font-bold text-slate-800 focus:bg-white resize-none w-full min-h-[60px]`}
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', overflowY: 'hidden' }}
          value={row[col.id] || gen}
          onChange={e => { handleCellUpdate(row.id, col.id, e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
          onFocus={e => { e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
          onKeyDown={e => { if(e.key==='ArrowUp'||e.key==='ArrowDown') navProps(e); }}
          rows={2}
        />
      </div>
    );
  }

  if (col.isRegistryLink) {
    const registryMap = { gword: 'guideword', param: 'parameter', mat: 'material', from: 'locationFrom', to: 'locationTo' };
    const registryField = registryMap[col.id];
    const uniqueValues = Array.from(new Set((studyData.deviations || []).map(d => d[registryField]).filter(v => !!v)));
    return (
      <div data-cell={`${rIdx}-${colIndex}`} className="w-full h-full flex items-start px-1 pt-2">
        <select
          className="w-full bg-transparent font-bold text-xs text-[#004a7c] outline-none cursor-pointer appearance-none px-2 py-1 leading-snug"
          style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
          value={row[col.id] || ''}
          onChange={e => handleCellUpdate(row.id, col.id, e.target.value)}
          onKeyDown={navProps}>
          <option value="">-</option>
          {uniqueValues.map((v, i) => <option key={`${v}-${i}`} value={v}>{v}</option>)}
        </select>
      </div>
    );
  }

  if (col.isBullet) return (
    <div data-cell={`${rIdx}-${colIndex}`} className="w-full h-full">
      <textarea
        className={`${base} min-h-[80px] bg-transparent text-[11px] leading-relaxed focus:bg-white resize-none font-medium text-slate-600 w-full`}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', overflowY: 'hidden' }}
        value={String(row[col.id] || '')}
        onChange={e => { handleCellUpdate(row.id, col.id, e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
        onFocus={e => { e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const val = e.target.value;
            const lines = val.split('\n').filter(l => l.trim() !== '');
            const lastLine = lines[lines.length - 1] || '0.';
            const nextNum = (parseInt((lastLine.match(/\d+/) || ['0'])[0]) || 0) + 1;
            handleCellUpdate(row.id, col.id, val + (val.endsWith('\n') ? '' : '\n') + nextNum + '. ');
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            navProps(e);
          }
        }}
        rows={3}
      />
    </div>
  );

  // Safeguards: linked to studyData.safeguards — show multi-select checkboxes plus free text
  if (col.id === 'safeguards') {
    return (
      <div data-cell={`${rIdx}-${colIndex}`} className="w-full h-full">
        <textarea
          className={`${base} min-h-[80px] bg-transparent text-[11px] leading-relaxed focus:bg-white resize-none font-medium text-slate-600 w-full`}
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', overflowY: 'hidden' }}
          value={String(row[col.id] || '')}
          placeholder={
            (studyData.safeguards || []).length > 0
              ? (studyData.safeguards || []).slice(0, 3).map((s, i) => `${i+1}. ${String(s.safeguard||s.description||'')}`.trim()).filter(Boolean).join('\n') + '\n(type or pick from safeguards)'
              : '1. Enter safeguard...'
          }
          onChange={e => { handleCellUpdate(row.id, col.id, e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
          onFocus={e => { e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const val = e.target.value;
              const lines = val.split('\n').filter(l => l.trim() !== '');
              const lastLine = lines[lines.length - 1] || '0.';
              const nextNum = (parseInt((lastLine.match(/\d+/) || ['0'])[0]) || 0) + 1;
              handleCellUpdate(row.id, col.id, val + (val.endsWith('\n') ? '' : '\n') + nextNum + '. ');
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') navProps(e);
          }}
          rows={3}
        />
        {(studyData.safeguards || []).length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/80 px-2 py-1 flex flex-wrap gap-1">
            {(studyData.safeguards || []).slice(0, 8).map((sg, si) => {
              const sgText = String(sg.safeguard || sg.description || sg.label || '');
              if (!sgText) return null;
              const alreadyIn = (row[col.id] || '').includes(sgText);
              return (
                <button key={sg.id || si}
                  className={`text-[8px] px-1.5 py-0.5 rounded border font-bold transition-all cursor-pointer ${alreadyIn ? 'bg-teal-100 border-teal-400 text-teal-700' : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600'}`}
                  onClick={() => {
                    if (alreadyIn) return;
                    const val = row[col.id] || '';
                    const lines = val.split('\n').filter(l => l.trim() !== '');
                    const nextNum = lines.length + 1;
                    handleCellUpdate(row.id, col.id, val + (val && !val.endsWith('\n') ? '\n' : '') + nextNum + '. ' + sgText);
                  }}
                  title={`Add: ${sgText}`}>{sgText.slice(0, 25)}{sgText.length > 25 ? '…' : ''}</button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (col.isRisk) return (
    <div data-cell={`${rIdx}-${colIndex}`} className="w-full h-full flex items-center justify-center px-1">
      <select className="w-full h-8 bg-white/50 border border-transparent rounded-lg text-center font-black text-xs cursor-pointer appearance-none"
        value={String(row[col.id] || '0')}
        onChange={e => handleCellUpdate(row.id, col.id, parseInt(e.target.value))}
        onKeyDown={navProps}>
        <option value="0">-</option>
        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );

  if (col.isCalculated) {
    let s, l;
    if (col.id === 'rawR')  { s = row.rawS; l = row.rawL; }
    else if (col.id === 'mitR') { s = row.mitS; l = row.mitL; }
    else { s = row.resS; l = row.resL; }
    const score = (parseInt(s) || 0) * (parseInt(l) || 0);
    const style = GET_DYNAMIC_RISK_STYLE(score, []);
    return (
      <div data-cell={`${rIdx}-${colIndex}`} className="w-full h-full flex items-center justify-center font-black text-xs shadow-inner" style={style}>{score || '-'}</div>
    );
  }

  if (col.type === 'select') return (
    <div data-cell={`${rIdx}-${colIndex}`} className="w-full h-full flex items-start px-1 pt-2">
      <select className="w-full bg-transparent font-bold text-xs outline-none cursor-pointer px-2 py-1" value={row[col.id] || ''} onChange={e => handleCellUpdate(row.id, col.id, e.target.value)} onKeyDown={navProps}>
        <option value="">-</option>
        {(col.opts || []).map((o, i) => <option key={`${o}-${i}`} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div data-cell={`${rIdx}-${colIndex}`} className="w-full h-full">
      <textarea
        className={`${base} bg-transparent text-[11px] font-bold text-slate-800 focus:bg-white resize-none w-full min-h-[40px]`}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', overflowY: 'hidden' }}
        value={String(row[col.id] || '')}
        onChange={e => { handleCellUpdate(row.id, col.id, e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
        onFocus={e => { e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
        onKeyDown={e => { if(e.key==='ArrowUp'||e.key==='ArrowDown') navProps(e); }}
        rows={1}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// INDUSTRIAL REGISTRY VIEW (shared for all grids)
// ─────────────────────────────────────────────

const IndustrialRegistryView = ({
  title, items = [], columns = [], updateServer,
  moduleKey, setShowColManager, autoSynthesis = false, isReadOnly = false,
  onExportCSV
}) => {
  const [resizing, setResizing] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, rowId: null });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, rowId: null, index: -1 });
  const fileInputRef = useRef(null);
  const [activeFileRow, setActiveFileRow] = useState(null);

  const startResize = (e, index) => {
    e.preventDefault();
    setResizing({ index, startX: e.pageX, startWidth: columns[index].width });
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!resizing) return;
      const delta = e.pageX - resizing.startX;
      const newCols = [...columns];
      newCols[resizing.index] = { ...newCols[resizing.index], width: Math.max(40, resizing.startWidth + delta) };
      const keyMap = {
        pids: 'pidsColumns', nodes: 'nodeColumns', deviations: 'deviationColumns',
        causes: 'causeColumns', recs: 'recColumns', checklists: 'checklistColumns',
        rankings: 'rankingColumns', equipment: 'equipmentColumns', safeguards: 'safeguardsColumns',
      };
      const key = keyMap[moduleKey];
      if (key) updateServer({ [key]: newCols });
    };
    const onMouseUp = () => setResizing(null);
    if (resizing) { window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp); }
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [resizing, columns, updateServer, moduleKey]);

  const handleUpdate = (id, field, val) => {
    const updated = items.map(item => {
      if (item.id !== id) return item;
      const newItem = { ...item, [field]: val };
      if (autoSynthesis && moduleKey === 'deviations') {
        newItem.deviationStr = `${newItem.guideword || ''} ${newItem.parameter || ''} of ${newItem.material || ''} from ${newItem.locationFrom || ''} to ${newItem.locationTo || ''}`.trim().replace(/\s+/g, ' ');
      }
      return newItem;
    });
    updateServer({ [moduleKey]: updated });
  };

  const addRowAt = (index) => {
    if (isReadOnly) return;
    const newRow = { id: Date.now().toString(), ...columns.reduce((acc, col) => { acc[col.id] = ''; return acc; }, {}) };
    const current = [...items];
    if (index === -1) current.push(newRow); else current.splice(index, 0, newRow);
    updateServer({ [moduleKey]: current });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const duplicateRow = (id) => {
    if (isReadOnly) return;
    const source = items.find(n => n.id === id);
    if (source) {
      const newNode = { ...source, id: Date.now().toString() };
      const idx = items.findIndex(n => n.id === id);
      const current = [...items];
      current.splice(idx + 1, 0, newNode);
      updateServer({ [moduleKey]: current });
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeFileRow) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleUpdate(activeFileRow, 'attachment', file.name);
      handleUpdate(activeFileRow, 'attachmentData', ev.target.result);
      handleUpdate(activeFileRow, 'attachmentType', file.type);
    };
    reader.readAsDataURL(file);
    setActiveFileRow(null);
    e.target.value = '';
  };

  const exportCSVLocal = () => {
    if (onExportCSV) { onExportCSV(); return; }
    const headers = columns.map(c => c.label).join(',');
    const rows = items.map(row => columns.map(c => `"${String(row[c.id] || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${moduleKey}_export.csv`; a.click();
  };

  const groupedHeaders = useMemo(() => {
    const groups = [];
    columns.forEach(col => {
      if (col.group) {
        const last = groups[groups.length - 1];
        if (last && last.label === col.group) { last.width += col.width; last.cols += 1; }
        else groups.push({ label: col.group, width: col.width, cols: 1 });
      } else { groups.push({ label: '', width: col.width, cols: 1 }); }
    });
    return groups;
  }, [columns]);

  const hasGroupHeaders = groupedHeaders.some(g => g.label !== '');

  return (
    <div className="flex flex-col h-full bg-slate-50 relative"
      onContextMenu={e => e.preventDefault()}
      onClick={() => contextMenu.visible && setContextMenu(prev => ({ ...prev, visible: false }))}>
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      {/* Header bar */}
      <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#004a7c] rounded-full"></div>{title}
        </h2>
        <button onClick={() => setShowColManager(true)}
          className="flex items-center gap-2 bg-white/80 px-4 py-1.5 rounded-xl border border-slate-300 text-[10px] font-black uppercase text-slate-600 hover:bg-[#004a7c] hover:text-white transition-all shadow-sm">
          <Columns size={12} /> Manage Columns
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f0f0f0] px-4 py-1.5 flex items-center border-b border-slate-300 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-1">
          {!isReadOnly && <ToolbarButton icon={<PlusCircle size={18} className="text-[#004a7c]" />} onClick={() => addRowAt(-1)} title="Add Row" />}
          <ToolbarButton icon={<Copy size={18} />} title="Copy" />
          <ToolbarButton icon={<Scissors size={18} />} title="Cut" />
          <ToolbarButton icon={<Clipboard size={18} />} title="Paste" />
          {!isReadOnly && <ToolbarButton icon={<Trash2 size={18} className="text-red-500" />} onClick={() => alert('Right-click a row to delete specifically.')} title="Delete" />}
          <div className="h-6 w-px bg-slate-300 mx-2" />
          <ToolbarButton icon={<ArrowUp size={18} />} title="Move Up" />
          <ToolbarButton icon={<ArrowDown size={18} />} title="Move Down" />
          <div className="h-6 w-px bg-slate-300 mx-2" />
          <ToolbarButton icon={<Printer size={18} />} onClick={() => handlePrintAction()} title="Print Registry" />
          <div className="h-6 w-px bg-slate-300 mx-2" />
          <ToolbarButton icon={<Download size={18} className="text-emerald-600" />} onClick={exportCSVLocal} title="Export CSV / Download" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-[#c0c0c0]/10 p-4">
        <div className="bg-white border border-slate-300 shadow-md rounded-sm overflow-hidden w-fit max-w-full relative">
          <table className="w-full text-left border-collapse table-fixed select-text">
            <thead className="bg-[#004a7c] text-white text-[11px] font-bold uppercase border-b-2 border-slate-400">
              {hasGroupHeaders && (
                <tr>
                  <th className="p-2 border border-slate-300 w-12 bg-slate-200"></th>
                  {groupedHeaders.map((group, gIdx) => (
                    <th key={gIdx} colSpan={group.cols} className={`p-1 border border-slate-300 text-center font-black text-[8px] text-teal-400 ${group.label ? '' : 'bg-slate-200'}`}>
                      {group.label}
                    </th>
                  ))}
                  {!isReadOnly && <th className="p-2 border border-slate-300 w-12 bg-slate-200"></th>}
                </tr>
              )}
              <tr>
                <th className="p-2 border border-slate-300 w-12 text-center bg-slate-100 font-black text-slate-700">#</th>
                {columns.map((col, idx) => (
                  <th key={col.id} className={`p-2 border border-slate-300 text-center relative group ${col.textColor || ''}`} style={{ width: `${col.width}px` }}>
                    <span className="truncate block px-1">{col.label}</span>
                    <div onMouseDown={e => startResize(e, idx)} className="absolute top-0 right-[-2px] w-1 h-full cursor-col-resize hover:bg-[#00B2B2] transition-colors z-30 opacity-0 group-hover:opacity-100" />
                  </th>
                ))}
                {!isReadOnly && <th className="p-2 border border-slate-300 w-12 bg-slate-200"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-white">
              {items.map((node, idx) => (
                <tr key={node.id}
                  onContextMenu={e => { e.preventDefault(); setContextMenu({ visible: true, x: e.pageX, y: e.pageY, rowId: node.id, index: idx }); }}
                  className="hover:bg-blue-50 group transition-colors align-top">
                  <td className="p-2 border border-slate-300 bg-slate-100 text-center text-xs font-bold text-slate-500 whitespace-nowrap align-middle">{idx + 1}</td>
                  {columns.map(col => (
                    <td key={col.id} className={`p-0 border border-slate-300 align-top ${col.isAuto ? 'bg-orange-50/30' : ''}`}>
                      {col.type === 'color' ? (
                        <div className="flex justify-center items-center h-10">
                          <input type="color" className="w-7 h-7 rounded border-none p-0 cursor-pointer shadow-sm" value={node[col.id] || '#004a7c'} onChange={e => handleUpdate(node.id, col.id, e.target.value)} />
                        </div>
                      ) : col.type === 'file' ? (
                        <div className="flex items-center gap-1.5 px-2 py-1.5 min-w-0 flex-wrap">
                          <button
                            onClick={() => { setActiveFileRow(node.id); fileInputRef.current.click(); }}
                            title="Upload / Replace File"
                            className="shrink-0 p-1.5 bg-slate-50 border border-slate-200 rounded text-[#00B2B2] hover:bg-[#00B2B2] hover:text-white transition-all shadow-sm">
                            <FileUp size={12} />
                          </button>
                          {node[col.id] ? (
                            <>
                              {node.attachmentData ? (
                                <a
                                  href={node.attachmentData}
                                  download={node[col.id]}
                                  title={`Download: ${node[col.id]}`}
                                  className="truncate text-[9px] font-black text-[#004a7c] underline underline-offset-2 hover:text-[#00B2B2] transition-colors max-w-[130px] cursor-pointer">
                                  {node[col.id]}
                                </a>
                              ) : (
                                <span className="truncate text-[9px] font-black text-slate-500 max-w-[130px]">{node[col.id]}</span>
                              )}
                              <button
                                onClick={() => { handleUpdate(node.id, col.id, ''); handleUpdate(node.id, 'attachmentData', ''); handleUpdate(node.id, 'attachmentType', ''); }}
                                title="Remove attachment"
                                className="shrink-0 p-0.5 text-slate-300 hover:text-red-500 transition-colors rounded">
                                <X size={10} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-300 italic">No file</span>
                          )}
                        </div>
                      ) : col.type === 'select' ? (
                        <select className="w-full px-2 py-1.5 text-xs font-bold outline-none bg-transparent focus:bg-white" value={node[col.id] || ''} onChange={e => handleUpdate(node.id, col.id, e.target.value)}>
                          <option value="">-</option>
                          {(col.opts || []).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : col.type === 'date' ? (
                        <input type="date" className="w-full px-2 py-1.5 text-xs font-bold outline-none bg-transparent focus:bg-white" value={node[col.id] || ''} onChange={e => handleUpdate(node.id, col.id, e.target.value)} />
                      ) : col.id === 'link' ? (
                        <div className="flex items-center h-10 px-1 gap-1 min-w-0">
                          <input
                            className="flex-1 h-10 px-2 text-xs outline-none bg-transparent focus:bg-white font-bold text-[#004a7c] min-w-0"
                            value={String(node[col.id] || '')}
                            placeholder="https://..."
                            onChange={e => handleUpdate(node.id, col.id, e.target.value)}
                          />
                          {node[col.id] && (
                            <a href={node[col.id]} target="_blank" rel="noopener noreferrer"
                              title="Open link" onClick={e => e.stopPropagation()}
                              className="shrink-0 p-1 text-[#00B2B2] hover:text-[#004a7c] transition-colors">
                              <ChevronRight size={12} />
                            </a>
                          )}
                        </div>
                      ) : col.id === 'equipment_count' ? (
                        // Auto-computed equipment count badge
                        <div className="w-full px-2 py-2 flex items-center justify-center">
                          <span className="bg-[#004a7c] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                            {(node.equipment || []).length}
                          </span>
                        </div>
                      ) : (
                        <textarea readOnly={col.isAuto}
                          className={`w-full px-2 py-1.5 text-xs outline-none bg-transparent focus:bg-white font-bold resize-none ${col.textColor || 'text-slate-800'} ${col.isAuto ? 'italic cursor-default' : ''}`}
                          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', overflowY: 'hidden', minHeight: '36px' }}
                          value={String(node[col.id] || '')}
                          rows={1}
                          onChange={e => { if (!col.isAuto) { handleUpdate(node.id, col.id, e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; } }}
                          onFocus={e => { e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addRowAt(-1); } }}
                        />
                      )}
                    </td>
                  ))}
                  {!isReadOnly && (
                    <td className="p-0 border border-slate-300 text-center">
                      <button onClick={() => setConfirm({ open: true, rowId: node.id })} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu.visible && !isReadOnly && (
        <div className="fixed z-[700] bg-white border border-slate-200 shadow-2xl rounded-2xl py-2 w-56" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <ContextItem icon={<ChevronUp size={14} />}   label="Insert Above"   onClick={() => addRowAt(contextMenu.index)} />
          <ContextItem icon={<ChevronDown size={14} />} label="Insert Below"   onClick={() => addRowAt(contextMenu.index + 1)} />
          <ContextItem icon={<CopyPlus size={14} />}    label="Duplicate Row"  onClick={() => duplicateRow(contextMenu.rowId)} />
          <div className="h-px bg-slate-100 my-1 mx-2" />
          <ContextItem icon={<Trash2 size={14} className="text-red-400" />} label="Delete Selected Row" onClick={() => setConfirm({ open: true, rowId: contextMenu.rowId })} danger />
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.open} title="Delete Record?" message="Confirm removal of this registry entry."
        onConfirm={() => { updateServer({ [moduleKey]: items.filter(n => n.id !== confirm.rowId) }); setConfirm({ open: false, rowId: null }); }}
        onCancel={() => setConfirm({ open: false, rowId: null })}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// COLUMN MANAGER MODAL
// ─────────────────────────────────────────────

function ColManagerModal({ show, onClose, studyData, updateServer, activeTopTab, activeSideTab, equipmentModalOpen, visibleCols, setVisibleCols }) {
  if (!show) return null;

  const colKey = (() => {
    if (equipmentModalOpen) return 'equipmentColumns';
    if (activeTopTab === 'pha') return null;
    if (activeTopTab === 'nodes') return activeSideTab === 'pids' ? 'pidsColumns' : 'nodeColumns';
    if (activeTopTab === 'deviations') return 'deviationColumns';
    if (activeTopTab === 'causes') return 'causeColumns';
    if (activeTopTab === 'safeguards') return 'safeguardsColumns';
    if (activeTopTab === 'recs') return 'recColumns';
    if (activeTopTab === 'checklists') return 'checklistColumns';
    if (activeTopTab === 'risk' && activeSideTab === 'rankings') return 'rankingColumns';
    return null;
  })();

  const currentCols = colKey ? (studyData[colKey] || []) : [];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-300">
        <div className="bg-[#004a7c] px-8 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <h3 className="font-black text-white uppercase text-[11px] tracking-widest flex items-center gap-3">
            <Columns size={16} className="text-teal-400" />
            {equipmentModalOpen ? 'Equipment Column Configuration' : 'Engineering Parameter Configuration'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white transition-all"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-6 max-h-[70vh]">
          {activeTopTab === 'pha' && !equipmentModalOpen ? (
            <div className="grid grid-cols-2 gap-3">
              {PHA_COLUMN_DEFS.map(col => (
                <button key={col.id} onClick={() => !col.fixed && setVisibleCols(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${visibleCols[col.id] ? 'border-[#004a7c] bg-[#004a7c]/5' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                  <span className={`text-[10px] font-black uppercase ${visibleCols[col.id] ? 'text-[#004a7c]' : 'text-slate-400'}`}>{col.label}</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${visibleCols[col.id] ? 'bg-[#004a7c] text-white' : 'bg-slate-200'}`}>{visibleCols[col.id] && <Check size={12} />}</div>
                </button>
              ))}
            </div>
          ) : colKey ? (
            <div className="space-y-3">
              {currentCols.map((col, idx) => (
                <div key={col.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 group hover:border-[#00B2B2] transition-all shadow-sm">
                  <span className="text-[10px] font-black text-slate-300 w-6">{idx + 1}</span>
                  <div className="flex-1 space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase px-1">Label</p>
                    <input className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#00B2B2]"
                      value={col.label || ''}
                      onChange={e => updateServer({ [colKey]: currentCols.map(c => c.id === col.id ? { ...c, label: e.target.value } : c) })} />
                  </div>
                  <div className="w-24 space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase px-1">Width</p>
                    <input className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-black outline-none focus:border-[#00B2B2]"
                      value={col.width || 0}
                      onChange={e => updateServer({ [colKey]: currentCols.map(c => c.id === col.id ? { ...c, width: parseInt(e.target.value) || 50 } : c) })} />
                  </div>
                  <button onClick={() => updateServer({ [colKey]: currentCols.filter(c => c.id !== col.id) })}
                    className="mt-4 p-2 text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={() => updateServer({ [colKey]: [...currentCols, { id: 'col_' + Date.now(), label: 'New Header', width: 200 }] })}
                className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-[11px] font-black uppercase text-slate-400 hover:border-[#00B2B2] hover:text-[#00B2B2] transition-all hover:bg-teal-50/30">
                + Define New Entry Field
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No column configuration available for this view.</p>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-10 py-3 bg-[#004a7c] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all">Apply & Close Settings</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TEAM MEMBERS PANEL
// ─────────────────────────────────────────────

const TEAM_ROLES = ['Study Leader','Scribe','Process Engineer','Safety Engineer','Instrument Engineer','Electrical Engineer','Mechanical Engineer','Operations Lead','Maintenance Lead','Environmental Engineer','Project Manager','Facilitator','Subject Matter Expert','Observer','Reviewer'];
const TEAM_DISCIPLINES = ['Chemical Engineering','Process Safety','Instrumentation & Controls','Electrical','Mechanical','Operations','Maintenance','Environmental','Management','IT & Digitalization','Admin & HR','External Consultant'];

function TeamMembersPanel({ studyData, updateServer }) {
  const members = studyData.teamMembers || [];
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:'', role:'', discipline:'', email:'', phone:'', company:'' });
  const [showForm, setShowForm] = useState(false);
  const [delId, setDelId] = useState(null);

  const openAdd = () => { setForm({ name:'', role:'Study Leader', discipline:'Process Safety', email:'', phone:'', company:'' }); setEditId(null); setShowForm(true); };
  const openEdit = (m) => { setForm({ ...m }); setEditId(m.id); setShowForm(true); };
  const save = () => {
    if (!form.name.trim()) return;
    if (editId) {
      updateServer({ teamMembers: members.map(m => m.id === editId ? { ...form, id: editId } : m) });
    } else {
      updateServer({ teamMembers: [...members, { ...form, id: Date.now().toString() }] });
    }
    setShowForm(false);
  };
  const del = (id) => { updateServer({ teamMembers: members.filter(m => m.id !== id) }); setDelId(null); };

  const initials = (name) => name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const avatarColor = (name) => { const colors=['#004a7c','#0d9488','#7c3aed','#b45309','#be123c','#0369a1','#15803d']; return colors[name.charCodeAt(0)%colors.length]; };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#004a7c] rounded-full"/>Team Members
          <span className="ml-2 bg-[#004a7c] text-white text-[9px] font-black px-2 py-0.5 rounded-full">{members.length}</span>
        </h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#004a7c] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow">
          <PlusCircle size={13}/> Add Member
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-teal-50 border-b border-teal-200 px-6 py-2 flex items-center gap-2 text-[10px] font-black text-teal-700 uppercase tracking-widest shrink-0">
        <Info size={11} className="text-teal-500"/> Team members added here are automatically available as owners in the Action Tracking system
      </div>

      {/* Members grid */}
      <div className="flex-1 overflow-auto p-6">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
            <Users size={48}/>
            <p className="text-xs font-black uppercase tracking-widest">No team members yet</p>
            <button onClick={openAdd} className="bg-[#004a7c] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:brightness-110 transition-all">Add First Member</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all group overflow-hidden">
                <div className="h-2" style={{ background: avatarColor(m.name || 'A') }}/>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm shrink-0" style={{ background: avatarColor(m.name || 'A') }}>
                        {initials(m.name || '?')}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-tight">{m.name}</p>
                        <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider mt-0.5">{m.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEdit(m)} className="p-1.5 text-slate-400 hover:text-[#004a7c] hover:bg-blue-50 rounded-lg transition-all"><Settings size={12}/></button>
                      <button onClick={() => setDelId(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12}/></button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {m.discipline && <div className="flex items-center gap-2 text-[10px] text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"/>{m.discipline}</div>}
                    {m.company && <div className="flex items-center gap-2 text-[10px] text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"/>{m.company}</div>}
                    {m.email && <div className="flex items-center gap-2 text-[10px] text-[#004a7c] font-semibold truncate"><span className="w-1.5 h-1.5 rounded-full bg-teal-300 shrink-0"/>{m.email}</div>}
                    {m.phone && <div className="flex items-center gap-2 text-[10px] text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"/>{m.phone}</div>}
                  </div>
                </div>
              </div>
            ))}
            {/* Add card */}
            <button onClick={openAdd} className="bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center min-h-[160px] gap-2 text-slate-300 hover:text-teal-500">
              <PlusCircle size={24}/>
              <span className="text-[10px] font-black uppercase tracking-widest">Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#004a7c] px-8 py-5 flex items-center justify-between">
              <h3 className="font-black text-white text-sm uppercase tracking-widest flex items-center gap-3"><Users size={16} className="text-teal-300"/>{editId ? 'Edit Member' : 'Add Team Member'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white"><X size={16}/></button>
            </div>
            <div className="p-8 space-y-3">
              {[['Full Name','name','text'],['Email','email','email'],['Phone','phone','text'],['Company / Organisation','company','text']].map(([lbl,key,type]) => (
                <div key={key} className="flex items-center gap-4 border-b border-slate-50 pb-2">
                  <label className="w-44 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{lbl}</label>
                  <input type={type} className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-teal-400" value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/>
                </div>
              ))}
              <div className="flex items-center gap-4 border-b border-slate-50 pb-2">
                <label className="w-44 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                <select className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-teal-400" value={form.role||''} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                  {TEAM_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-44 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Discipline</label>
                <select className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-teal-400" value={form.discipline||''} onChange={e=>setForm(p=>({...p,discipline:e.target.value}))}>
                  {TEAM_DISCIPLINES.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl border border-slate-300 text-xs font-black uppercase text-slate-500 hover:bg-white transition-all">Cancel</button>
              <button onClick={save} className="px-10 py-2 bg-[#004a7c] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 shadow transition-all">Save Member</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog isOpen={!!delId} title="Remove Member?" message="This team member will be removed from the study." onConfirm={() => del(delId)} onCancel={() => setDelId(null)}/>
    </div>
  );
}

// ─────────────────────────────────────────────
// ACTION TRACKING SYSTEM
// ─────────────────────────────────────────────

function ActionTrackingSystem({ studyData, updateServer }) {
  const members = studyData.teamMembers || [];
  const recommendations = useMemo(() => {
    const list = [];
    (studyData.rows || []).forEach(row => {
      const nodeIndex = (studyData.nodes || []).findIndex(n => n.id === row.nodeId) + 1;
      const rowIndex = (studyData.rows || []).filter(r => r.nodeId === row.nodeId).findIndex(r => r.id === row.id) + 1;
      if (row.recs && row.recs.trim()) {
        row.recs.split('\n').filter(l => l.trim().length > 3).forEach((line, lIdx) => {
          list.push({ ref: `N${nodeIndex||1}.${rowIndex}-R${lIdx+1}`, text: line.replace(/^\d+\.\s*/, '').trim(), nodeId: row.nodeId });
        });
      }
    });
    return list;
  }, [studyData.rows, studyData.nodes]);

  const actions = studyData.actionItems || [];
  const [filter, setFilter] = useState({ owner: 'All', status: 'All', priority: 'All' });
  const [showModal, setShowModal] = useState(false);
  const [editAction, setEditAction] = useState(null);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', owner:'', priority:'Medium', status:'Not Started', dueDate:'', recRef:'', category:'General' });
  const [activeSub, setActiveSub] = useState('dashboard');

  const openAdd = (prefill = {}) => {
    setEditAction(null);
    setForm({ title:'', description:'', owner: members[0]?.name||'', priority:'Medium', status:'Not Started', dueDate:'', recRef:'', category:'General', ...prefill });
    setShowModal(true);
  };
  const openEdit = (a) => { setEditAction(a); setForm({ ...a }); setShowModal(true); };

  const saveAction = () => {
    if (!form.title.trim()) return;
    if (editAction) {
      updateServer({ actionItems: actions.map(a => a.id === editAction.id ? { ...form, id: editAction.id, createdAt: editAction.createdAt, updatedAt: new Date().toISOString() } : a) });
    } else {
      updateServer({ actionItems: [...actions, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }] });
    }
    setShowModal(false);
  };

  const deleteAction = (id) => { updateServer({ actionItems: actions.filter(a => a.id !== id) }); setDelId(null); };

  const toggleStatus = (id, newStatus) => updateServer({ actionItems: actions.map(a => a.id === id ? { ...a, status: newStatus } : a) });

  const statusColor = (s) => ({ 'Completed':'bg-emerald-100 text-emerald-700','In Progress':'bg-blue-100 text-blue-700','Overdue':'bg-red-100 text-red-700','Not Started':'bg-slate-100 text-slate-600' }[s] || 'bg-slate-100 text-slate-600');
  const priorityColor = (p) => ({ 'High':'text-red-600 bg-red-50 border-red-200','Medium':'text-amber-600 bg-amber-50 border-amber-200','Low':'text-green-600 bg-green-50 border-green-200' }[p] || '');

  const filteredActions = actions.filter(a => {
    if (filter.owner !== 'All' && a.owner !== filter.owner) return false;
    if (filter.status !== 'All' && a.status !== filter.status) return false;
    if (filter.priority !== 'All' && a.priority !== filter.priority) return false;
    return true;
  });

  // KPIs
  const total = actions.length;
  const completed = actions.filter(a => a.status === 'Completed').length;
  const overdue = actions.filter(a => a.status !== 'Completed' && a.dueDate && new Date(a.dueDate) < new Date()).length;
  const inProgress = actions.filter(a => a.status === 'In Progress').length;
  const rate = total ? Math.round((completed/total)*100) : 0;

  // Workload per member
  const workload = members.map(m => ({ ...m, count: actions.filter(a => a.owner === m.name).length, completed: actions.filter(a => a.owner === m.name && a.status === 'Completed').length, open: actions.filter(a => a.owner === m.name && a.status !== 'Completed').length }));

  const initials = (name='') => name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const avatarColor = (name='A') => { const colors=['#004a7c','#0d9488','#7c3aed','#b45309','#be123c','#0369a1','#15803d']; return colors[name.charCodeAt(0)%colors.length]; };

  const subTabs = [{ id:'dashboard', label:'Dashboard', Icon:BarChart2 }, { id:'tracker', label:'Action Register', Icon:CheckSquare }, { id:'team', label:'Team Workload', Icon:UserCheck }];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Section header */}
      <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#004a7c] rounded-full"/>Action Tracking System
          <span className="ml-2 bg-[#004a7c] text-white text-[9px] font-black px-2 py-0.5 rounded-full">{total} Actions</span>
        </h2>
        <button onClick={() => openAdd()} className="flex items-center gap-2 bg-[#004a7c] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow">
          <PlusCircle size={13}/> New Action
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white border-b border-slate-200 flex items-center px-4 shrink-0">
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setActiveSub(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-tight transition-all border-b-2 whitespace-nowrap ${activeSub === t.id ? 'border-[#004a7c] text-[#004a7c] bg-blue-50/40' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.Icon size={13}/> {t.label}
          </button>
        ))}
        {recommendations.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
            <Bell size={11}/> {recommendations.length} recommendations from worksheet
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {/* ── DASHBOARD ── */}
        {activeSub === 'dashboard' && (
          <div className="p-6 space-y-6 max-w-6xl">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label:'Total Actions', value:total, color:'#004a7c', Icon:CheckSquare },
                { label:'Completion Rate', value:`${rate}%`, color:'#15803d', Icon:Activity },
                { label:'In Progress', value:inProgress, color:'#0369a1', Icon:Clock },
                { label:'Overdue', value:overdue, color:'#dc2626', Icon:AlertTriangle },
              ].map(k => (
                <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all">
                  <div className="p-3 rounded-xl shrink-0" style={{ background: k.color+'22' }}>
                    <k.Icon size={18} style={{ color: k.color }}/>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800 leading-none">{k.value}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{k.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations from worksheet panel */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-2xl border border-teal-200 shadow-sm overflow-hidden">
                <div className="bg-teal-600 px-6 py-3 flex items-center justify-between">
                  <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Bell size={13}/>Recommendations from PHA Worksheet ({recommendations.length})</h4>
                  <span className="text-teal-200 text-[9px] font-bold">Click to create action items</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {recommendations.map((rec, i) => {
                    const alreadyAdded = actions.some(a => a.recRef === rec.ref);
                    return (
                      <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                        <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded shrink-0">{rec.ref}</span>
                        <span className="flex-1 text-xs text-slate-600 font-medium">{rec.text}</span>
                        {alreadyAdded ? (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shrink-0 flex items-center gap-1"><CheckSquare size={10}/> Added</span>
                        ) : (
                          <button onClick={() => openAdd({ title: rec.text, recRef: rec.ref, category:'PHA Recommendation' })}
                            className="text-[9px] font-black text-[#004a7c] bg-blue-50 hover:bg-[#004a7c] hover:text-white px-3 py-1.5 rounded-lg border border-blue-200 transition-all shrink-0">
                            + Create Action
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Status Breakdown</h4>
                {[['Not Started','bg-slate-300',actions.filter(a=>a.status==='Not Started').length],['In Progress','bg-blue-500',inProgress],['Completed','bg-emerald-500',completed],['Overdue','bg-red-500',overdue]].map(([label,bg,count]) => (
                  <div key={label} className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black text-slate-500 w-24 text-right">{label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-3 rounded-full transition-all ${bg}`} style={{ width: total ? `${(count/total)*100}%` : '0%' }}/>
                    </div>
                    <span className="text-[11px] font-black text-slate-700 w-6">{count}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Top Owners by Load</h4>
                {workload.sort((a,b)=>b.count-a.count).slice(0,5).map(m => (
                  <div key={m.id} className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white shrink-0" style={{ background: avatarColor(m.name) }}>{initials(m.name)}</div>
                    <span className="text-[10px] font-bold text-slate-600 flex-1 truncate">{m.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-2.5 rounded-full bg-[#004a7c] transition-all" style={{ width: total ? `${(m.count/total)*100}%` : '0%' }}/>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 w-5">{m.count}</span>
                  </div>
                ))}
                {members.length === 0 && <p className="text-[10px] text-slate-300 font-bold text-center py-4">Add team members in Study Data → Team Members</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTION REGISTER ── */}
        {activeSub === 'tracker' && (
          <div className="flex flex-col h-full">
            {/* Filters bar */}
            <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center gap-4 shrink-0 flex-wrap">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-bold outline-none focus:border-teal-400" value={filter.owner} onChange={e=>setFilter(p=>({...p,owner:e.target.value}))}>
                <option value="All">All Owners</option>
                {members.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-bold outline-none focus:border-teal-400" value={filter.status} onChange={e=>setFilter(p=>({...p,status:e.target.value}))}>
                {['All','Not Started','In Progress','Completed','Overdue'].map(s=><option key={s}>{s}</option>)}
              </select>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-bold outline-none focus:border-teal-400" value={filter.priority} onChange={e=>setFilter(p=>({...p,priority:e.target.value}))}>
                {['All','High','Medium','Low'].map(s=><option key={s}>{s}</option>)}
              </select>
              <span className="text-[9px] font-black text-slate-400 ml-auto">{filteredActions.length} of {total}</span>
              <button onClick={() => openAdd()} className="flex items-center gap-1.5 bg-[#004a7c] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:brightness-110 transition-all">
                <PlusCircle size={12}/> Add Action
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full border-collapse text-[11px]" style={{tableLayout:'fixed'}}>
                <colgroup>
                  <col style={{width:'50px'}}/><col style={{width:'80px'}}/><col/><col style={{width:'150px'}}/><col style={{width:'100px'}}/><col style={{width:'120px'}}/><col style={{width:'110px'}}/><col style={{width:'110px'}}/><col style={{width:'80px'}}/>
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr style={{background:'#003566'}} className="text-white">
                    {['#','Ref.','Action / Description','Owner','Priority','Status','Due Date','Category',''].map((h,i) => (
                      <th key={i} className="border border-[#1e4f7c] px-2 py-2.5 text-[8px] font-black uppercase tracking-widest text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActions.length === 0 ? (
                    <tr><td colSpan={9} className="py-20 text-center text-slate-300 text-[11px] font-black uppercase tracking-widest">No actions yet — click + Add Action to begin</td></tr>
                  ) : filteredActions.map((a, idx) => (
                    <tr key={a.id} className="group hover:bg-blue-50/40 border-b border-slate-100 align-top transition-colors">
                      <td className="border-r border-slate-100 text-center py-2 text-[10px] font-bold text-slate-400 bg-slate-50">{idx+1}</td>
                      <td className="border-r border-slate-100 px-2 py-2">
                        {a.recRef ? <span className="text-[8px] font-black text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">{a.recRef}</span> : <span className="text-[9px] text-slate-300 italic">Manual</span>}
                      </td>
                      <td className="border-r border-slate-100 px-2 py-2">
                        <p className="text-[11px] font-semibold text-slate-800 leading-snug">{a.title}</p>
                        {a.description && <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{a.description}</p>}
                      </td>
                      <td className="border-r border-slate-100 px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          {a.owner && <div className="w-5 h-5 rounded flex items-center justify-center text-[7px] font-black text-white shrink-0" style={{ background: avatarColor(a.owner) }}>{initials(a.owner)}</div>}
                          <span className="text-[10px] font-bold text-slate-700 truncate">{a.owner || '—'}</span>
                        </div>
                      </td>
                      <td className="border-r border-slate-100 px-2 py-2 text-center">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${priorityColor(a.priority)}`}>{a.priority}</span>
                      </td>
                      <td className="border-r border-slate-100 px-2 py-2">
                        <select className="w-full bg-transparent text-[10px] font-bold outline-none cursor-pointer rounded" value={a.status} onChange={e=>toggleStatus(a.id,e.target.value)}>
                          {['Not Started','In Progress','Completed','Overdue'].map(s=><option key={s}>{s}</option>)}
                        </select>
                        <span className={`inline-block mt-0.5 text-[7px] font-black px-1.5 py-0.5 rounded ${statusColor(a.status)}`}>{a.status}</span>
                      </td>
                      <td className="border-r border-slate-100 px-2 py-2 text-center">
                        {a.dueDate ? (
                          <span className={`text-[9px] font-bold ${a.status !== 'Completed' && new Date(a.dueDate) < new Date() ? 'text-red-600 font-black' : 'text-slate-600'}`}>{new Date(a.dueDate).toLocaleDateString()}</span>
                        ) : <span className="text-slate-300 text-[9px]">—</span>}
                      </td>
                      <td className="border-r border-slate-100 px-2 py-2 text-center">
                        <span className="text-[9px] font-bold text-slate-500">{a.category||'General'}</span>
                      </td>
                      <td className="px-1 py-2 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => openEdit(a)} className="p-1 text-slate-400 hover:text-[#004a7c] hover:bg-blue-50 rounded transition-all"><Settings size={11}/></button>
                          <button onClick={() => setDelId(a.id)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"><Trash2 size={11}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TEAM WORKLOAD ── */}
        {activeSub === 'team' && (
          <div className="p-6 max-w-5xl">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center shadow-sm">
                <Users size={36} className="text-slate-300 mx-auto mb-3"/>
                <p className="text-sm font-black text-slate-600 uppercase tracking-wide">No Team Members Defined</p>
                <p className="text-xs text-slate-400 mt-2">Go to <span className="font-black text-[#004a7c]">Study Data → Team Members</span> to add your PHA team.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Team Action Workload</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workload.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-teal-300 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white shadow-sm" style={{ background: avatarColor(m.name) }}>{initials(m.name)}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{m.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{m.role} · {m.discipline}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-800">{m.count}</span>
                          <p className="text-[8px] font-black text-slate-400 uppercase">actions</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase mb-1">
                          <span>Completion</span>
                          <span>{m.count > 0 ? Math.round((m.completed/m.count)*100) : 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: m.count > 0 ? `${(m.completed/m.count)*100}%` : '0%' }}/>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[['Open',m.open,'bg-blue-100 text-blue-700'],['Done',m.completed,'bg-emerald-100 text-emerald-700']].map(([l,v,cls]) => (
                          <span key={l} className={`flex-1 text-center text-[9px] font-black py-1 rounded-lg ${cls}`}>{l}: {v}</span>
                        ))}
                      </div>
                      {/* Action list for this member */}
                      {m.count > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 max-h-32 overflow-y-auto">
                          {actions.filter(a=>a.owner===m.name).map(a=>(
                            <div key={a.id} className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${a.status==='Completed'?'bg-emerald-400':a.status==='In Progress'?'bg-blue-400':a.status==='Overdue'?'bg-red-400':'bg-slate-300'}`}/>
                              <span className="text-[9px] text-slate-600 font-medium flex-1 truncate">{a.title}</span>
                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${statusColor(a.status)}`}>{a.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="bg-[#004a7c] px-8 py-5 flex items-center justify-between shrink-0">
              <h3 className="font-black text-white text-sm uppercase tracking-widest flex items-center gap-3"><CheckSquare size={16} className="text-teal-300"/>{editAction ? 'Edit Action' : 'New Action'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-3">
              <div className="flex items-center gap-4">
                <label className="w-40 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Action Title *</label>
                <input className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-teal-400" value={form.title||''} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Describe the action…"/>
              </div>
              <div className="flex items-start gap-4">
                <label className="w-40 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 mt-2">Details</label>
                <textarea className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-teal-400 resize-none" rows={3} value={form.description||''} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Additional details…"/>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-40 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Owner</label>
                <select className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-teal-400" value={form.owner||''} onChange={e=>setForm(p=>({...p,owner:e.target.value}))}>
                  <option value="">— Select Owner —</option>
                  {members.map(m=><option key={m.id} value={m.name}>{m.name} ({m.role})</option>)}
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
              {[['Priority','priority',['High','Medium','Low']],['Status','status',['Not Started','In Progress','Completed','Overdue']],['Category','category',['PHA Recommendation','Safety','Engineering','Maintenance','Operational','Procedural','General']]].map(([label,key,opts]) => (
                <div key={key} className="flex items-center gap-4">
                  <label className="w-40 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{label}</label>
                  <select className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-teal-400" value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}>
                    {opts.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex items-center gap-4">
                <label className="w-40 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Due Date</label>
                <input type="date" className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-teal-400" value={form.dueDate||''} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))}/>
              </div>
              {form.recRef && (
                <div className="flex items-center gap-4">
                  <label className="w-40 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">PHA Ref.</label>
                  <span className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">{form.recRef}</span>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 rounded-xl border border-slate-300 text-xs font-black uppercase text-slate-500 hover:bg-white transition-all">Cancel</button>
              <button onClick={saveAction} className="px-10 py-2 bg-[#004a7c] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 shadow transition-all">Save Action</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog isOpen={!!delId} title="Delete Action?" message="This action item will be permanently removed." onConfirm={() => deleteAction(delId)} onCancel={() => setDelId(null)}/>
    </div>
  );
}

// ─────────────────────────────────────────────
// PHA WORKSHEET — STABLE SUB-COMPONENTS
// These MUST be defined at module level, outside App and outside the PHA
// IIFE render function. If defined inside, React creates a new component
// type on every render → unmounts/remounts on every keystroke → focus lost.
// ─────────────────────────────────────────────

const AutoTA = React.memo(({ value, onChange, onEnter, placeholder = '', className = '', minH = 28 }) => {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(minH, el.scrollHeight) + 'px';
  }, [value, minH]);
  return (
    <textarea ref={ref}
      className={`w-full resize-none border-none outline-none bg-transparent leading-snug ${className}`}
      style={{ minHeight: minH+'px', overflowY:'hidden', whiteSpace:'pre-wrap', wordBreak:'break-word', padding:'4px 6px' }}
      value={value||''} rows={1} placeholder={placeholder}
      onChange={e => { onChange && onChange(e.target.value); const el=ref.current; if(el){el.style.height='auto'; el.style.height=Math.max(minH,el.scrollHeight)+'px';} }}
      onFocus={e => { const el=e.target; el.style.height='auto'; el.style.height=Math.max(minH,el.scrollHeight)+'px'; }}
      onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault(); onEnter&&onEnter();} }}
    />
  );
});

const RiskSel = React.memo(({ value, onChange }) => (
  <select className="w-full h-full bg-transparent text-center font-black text-xs outline-none cursor-pointer"
    value={String(value||0)} onChange={e => onChange(parseInt(e.target.value))}>
    <option value="0">—</option>
    {[1,2,3,4,5].map(v=><option key={v} value={v}>{v}</option>)}
  </select>
));

const RiskBadge = React.memo(({ s, l, rankings, globalColors }) => {
  const sc = (parseInt(s)||0)*(parseInt(l)||0);
  const rnk = rankings || DEFAULT_RANKINGS;
  const gc = globalColors || DEFAULT_GLOBAL_COLORS;
  const { bg, text } = GET_RISK_COLOR(sc, rnk, gc);
  return (
    <div className="w-full h-full flex items-center justify-center font-black text-xs"
      style={{ background: bg, color: text, minHeight:'28px' }}>
      {sc||'—'}
    </div>
  );
});

const LBadge = React.memo(({ label, bg }) => (
  <span className="inline-flex items-center justify-center text-[7px] font-black rounded px-1 py-0.5 text-white shrink-0 mr-0.5 mt-0.5" style={{ background: bg, minWidth:'22px' }}>
    {label}
  </span>
));

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────

const App = () => {
  const fileInputRef = useRef(null);
  const [view, setView] = useState('start');
  const [activeTopTab, setActiveTopTab] = useState('data');
  const [activeSideTab, setActiveSideTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showColManager, setShowColManager] = useState(false);
  const [studies, setStudies] = useState([]);
  const [currentStudyId, setCurrentStudyId] = useState(null);
  const [studyData, setStudyData] = useState({
    metadata: {}, rows: [], nodes: [], pids: [], deviations: [],
    checklists: [], recs: [], safeguards: [], parking: [], causes: [],
    teamMembers: [], actionItems: [], documents: [],
    nodeColumns: DEFAULT_NODE_COLS,
    equipmentColumns: DEFAULT_EQUIPMENT_COLS,
    pidsColumns: DEFAULT_PID_COLS,
    deviationColumns: DEFAULT_DEVIATION_COLS,
    causeColumns: DEFAULT_CAUSE_COLS,
    recColumns: DEFAULT_REC_COLS,
    rankingColumns: DEFAULT_RANKING_COLS,
    rankings: DEFAULT_RANKINGS,
    globalColors: DEFAULT_GLOBAL_COLORS,
    severityLevels: DEFAULT_SEVERITY_LEVELS,
    plantInfo: { name: '', location: '', owner: '', unit: '', description: '' },
    nodeRiskInfo: [],
    responsivityBy: [],
    riskMatrix: buildDefaultRiskMatrix(),
    checklistColumns: [
      { id: 'category', label: 'CATEGORY',          width: 180 },
      { id: 'question', label: 'QUESTION / ITEM',   width: 450 },
      { id: 'response', label: 'RESPONSE',          width: 200, type: 'select', opts: ['Yes','No','N/A','Partial'] },
      { id: 'comments', label: 'COMMENTS',          width: 300 },
    ],
  });
  const [riskMatrixChannel, setRiskMatrixChannel] = useState('Safety');
  const [showNewModal, setShowNewModal] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [visibleCols, setVisibleCols] = useState(PHA_COLUMN_DEFS.reduce((acc, col) => ({ ...acc, [col.id]: true }), {}));
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, rowId: null, index: -1 });
  const [confirm, setConfirm] = useState({ open: false, rowId: null });
  const [selectedPhaRows, setSelectedPhaRows] = useState(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState('');
  // Equipment Modal state (from node-eq.js)
  const [equipmentModal, setEquipmentModal] = useState({ open: false, nodeId: null });

  // ── Derived state ──
  const activeNode = useMemo(() => (studyData.nodes || []).find(n => n.id === selectedNodeId) || studyData.nodes?.[0] || {}, [studyData.nodes, selectedNodeId]);
  const nodeSpecificRows = useMemo(() => (studyData.rows || []).filter(r => r.nodeId === selectedNodeId), [studyData.rows, selectedNodeId]);
  const filteredVisibleCols = useMemo(() => PHA_COLUMN_DEFS.filter(c => visibleCols[c.id]), [visibleCols]);

  const recommendationsFromWorksheet = useMemo(() => {
    const list = [];
    (studyData.rows || []).forEach(row => {
      const nodeIndex = (studyData.nodes || []).findIndex(n => n.id === row.nodeId) + 1;
      const rowIndex = (studyData.rows || []).filter(r => r.nodeId === row.nodeId).findIndex(r => r.id === row.id) + 1;
      if (row.recs && row.recs.trim()) {
        const lines = row.recs.split('\n').filter(l => l.trim().length > 3);
        lines.forEach((line, lIdx) => {
          const existing = (studyData.recs || []).find(r => r.id === `gen-${row.id}-${lIdx}`);
          list.push({
            id: `gen-${row.id}-${lIdx}`,
            description: line.replace(/^\d+\.\s*/, '').trim(),
            priority: existing?.priority || 'Medium',
            responsibility: existing?.responsibility || '',
            status: existing?.status || 'Proposed',
            dueDate: existing?.dueDate || '',
            comments: existing?.comments || '',
            reference: `N${nodeIndex || 1}.${rowIndex}`,
            cat: 'Safety',
            s_before: row.rawS || 0,
            p_before: row.rawL || 0,
            ir_val: (parseInt(row.rawS) || 0) * (parseInt(row.rawL) || 0),
            s_after: row.resS || 0,
            p_after: row.resL || 0,
            rr_val: (parseInt(row.resS) || 0) * (parseInt(row.resL) || 0),
          });
        });
      }
    });
    return list;
  }, [studyData.rows, studyData.nodes, studyData.recs]);

  // ── Updaters ──
  const updateServer = useCallback((newData) => {
    setStudyData(prev => ({ ...prev, ...newData }));
    setSyncStatus('saving');
    setTimeout(() => setSyncStatus('synced'), 600);
  }, []);

  const handleStudyUpdate = (field, val) => updateServer({ metadata: { ...studyData.metadata, [field]: val } });
  const handleCellUpdate  = (id, field, val) => updateServer({ rows: (studyData.rows || []).map(r => r.id === id ? { ...r, [field]: val } : r) });

  const handleNodeHeaderUpdate = (field, val) => {
    if (!activeNode.id) return;
    updateServer({ nodes: studyData.nodes.map(n => n.id === activeNode.id ? { ...n, [field]: val } : n) });
  };

  const handleMatrixCellUpdate = (freqVal, sevVal, newScore) => {
    const key = `F${freqVal}_S${sevVal}`;
    const currentMatrix = studyData.riskMatrix || buildDefaultRiskMatrix();
    const channelMatrix = { ...(currentMatrix[riskMatrixChannel] || {}) };
    channelMatrix[key] = parseInt(newScore) || 0;
    updateServer({ riskMatrix: { ...currentMatrix, [riskMatrixChannel]: channelMatrix } });
  };

  const addPhaRowAt = (index) => {
    const newRow = {
      id: Date.now().toString(), nodeId: selectedNodeId,
      gword: '', param: '', mat: '', from: '', to: '', dev: '',
      causes: '1. ', consImm: '1. ', consUlt: '1. ', safeguards: '1. ',
      rawS: 0, rawL: 0, mitS: 0, mitL: 0, recs: '1. ', resS: 0, resL: 0,
      remarks: '', status: 'Proposed'
    };
    const current = [...(studyData.rows || [])];
    if (index === -1) {
      current.push(newRow);
    } else {
      const targetId = nodeSpecificRows[index]?.id;
      const absIdx = targetId ? current.findIndex(r => r.id === targetId) : current.length;
      current.splice(absIdx + 1, 0, newRow);
    }
    updateServer({ rows: current });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const duplicatePhaRow = (id) => {
    const source = studyData.rows.find(r => r.id === id);
    if (source) {
      const newRow = { ...source, id: Date.now().toString() };
      const idx = studyData.rows.findIndex(r => r.id === id);
      const current = [...studyData.rows];
      current.splice(idx + 1, 0, newRow);
      updateServer({ rows: current });
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleCreateStudy = (formData) => {
    const newStudy = {
      id: Date.now().toString(),
      metadata: { ...formData, createdAt: new Date().toISOString(), teamSize: 0 },
      rows: [],
      nodes: [{ id: 'n1', description: 'Node 01', intention: '', boundary: '', equipment: [{ id: 'e1', tag: 'V-101', description: 'Primary Feed Vessel', designConditions: '', capacity: '', moc: '', temp: '', pres: '' }] }],
      pids: [], deviations: [], checklists: [], recs: [], safeguards: [], parking: [], causes: [],
      teamMembers: [], actionItems: [], documents: [],
      nodeColumns: DEFAULT_NODE_COLS,
      equipmentColumns: DEFAULT_EQUIPMENT_COLS,
      pidsColumns: DEFAULT_PID_COLS,
      deviationColumns: DEFAULT_DEVIATION_COLS,
      causeColumns: DEFAULT_CAUSE_COLS,
      recColumns: DEFAULT_REC_COLS,
      rankingColumns: DEFAULT_RANKING_COLS,
      rankings: DEFAULT_RANKINGS,
      globalColors: DEFAULT_GLOBAL_COLORS,
      severityLevels: DEFAULT_SEVERITY_LEVELS,
      plantInfo: { name: '', location: '', owner: '', unit: '', description: '' },
      nodeRiskInfo: [],
      responsivityBy: [],
      riskMatrix: buildDefaultRiskMatrix(),
      checklistColumns: [
        { id: 'category', label: 'CATEGORY',        width: 180 },
        { id: 'question', label: 'QUESTION / ITEM', width: 450 },
        { id: 'response', label: 'RESPONSE',        width: 200, type: 'select', opts: ['Yes','No','N/A','Partial'] },
        { id: 'comments', label: 'COMMENTS',        width: 300 },
      ],
    };
    setStudies(prev => [...prev, newStudy]);
    setCurrentStudyId(newStudy.id);
    setStudyData(newStudy);
    setSelectedNodeId('n1');
    setView('workstation');
    setActiveTopTab('data');
    setActiveSideTab('overview');
    setShowNewModal(false);
    setSyncStatus('synced');
  };

  // ── Export helpers ──
  const exportCSV = () => {
    const cols = PHA_COLUMN_DEFS.filter(c => visibleCols[c.id]);
    const headers = cols.map(c => c.label).join(',');
    const csvRows = (studyData.rows || []).map(r => cols.map(c => `"${String(r[c.id] || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${csvRows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${studyData.metadata?.name || 'study'}_pha_report.csv`; a.click();
  };

  const exportFullStudyJSON = () => {
    // Full export — includes all sections, attachments, equipment, notes
    const payload = JSON.stringify(studyData, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${studyData.metadata?.name || 'study'}_full_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  // ─────────────────────────────────────────────
  // START SCREEN
  // ─────────────────────────────────────────────
  if (view === 'start') {
    return (
      <div className="h-screen w-full flex flex-col bg-[#f1f5f9] font-sans overflow-hidden relative select-none">
        <header className="h-10 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-[120] shadow-sm">
          <div className="flex items-center gap-6 h-full">
            <div className="flex items-center gap-2 pr-6 border-r border-slate-100">
              <div className="w-5 h-5 bg-[#0d1111] rounded flex items-center justify-center text-[10px] font-black text-white shadow-sm">PS</div>
              <span className="text-[11px] font-black uppercase text-[#0d1111]">PS-Magnashield</span>
            </div>
            <div className="relative">
              <button onClick={() => setFileMenuOpen(!fileMenuOpen)} className="text-[11px] font-bold px-3 text-slate-500 hover:text-[#00B2B2] cursor-pointer transition-colors uppercase tracking-widest">File</button>
              {fileMenuOpen && (
                <div className="absolute top-8 left-0 w-48 bg-white border border-slate-200 shadow-2xl rounded-xl py-1 z-[200]">
                  <button onClick={() => { setShowNewModal(true); setFileMenuOpen(false); }} className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-teal-50 flex items-center gap-3 cursor-pointer"><FilePlus size={14} className="text-[#00B2B2]" /> New Study</button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-teal-50 flex items-center gap-3 cursor-pointer"><FolderSync size={14} /> Open File</button>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  <button onClick={() => window.location.reload()} className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-red-50 text-red-400 flex items-center gap-3 cursor-pointer"><LogOut size={14} /> Exit</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-5xl z-10">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Welcome — Start Menu</h2>
              <div className="h-1.5 w-24 bg-[#00B2B2] mt-3 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-5">
                <CardAction onClick={() => setShowNewModal(true)} icon={<PlusCircle size={32} className="text-[#00B2B2]" />} label="Create New Unit" desc="Start a fresh PHA study" />
                <CardAction onClick={() => fileInputRef.current?.click()} icon={<FolderOpen size={32} className="text-slate-400" />} label="Open Local File" desc="Load study from disk" />
                <input type="file" ref={fileInputRef} className="hidden" accept=".json,.pha,.csv" />
              </div>
              <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[480px]">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3 bg-white sticky top-0 z-10">
                  <Clock size={18} className="text-[#00B2B2]" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Studies</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {studies.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                      <FileText size={48} className="mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">No studies yet</p>
                    </div>
                  )}
                  {studies.map(s => (
                    <div key={s.id} onClick={() => { setCurrentStudyId(s.id); setStudyData(s); setSelectedNodeId(s.nodes?.[0]?.id || ''); setView('workstation'); }}
                      className="flex items-center justify-between p-4 rounded-2xl hover:bg-teal-50 border border-transparent hover:border-teal-100 transition-all cursor-pointer group">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors"><FileText size={18} /></div>
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-700">{String(s.metadata?.name || 'Untitled')}</h4>
                          <div className="flex items-center gap-4 mt-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                            <span>{String(s.metadata?.facility || 'Site')}</span>
                            <span className="bg-slate-100 px-2 rounded text-[#00B2B2]">{String(s.metadata?.type || 'PHA')}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-200 group-hover:text-[#00B2B2] transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {showNewModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-300">
              <div className="bg-slate-100 px-6 py-3 flex items-center justify-between shrink-0 border-b border-slate-200 shadow-sm">
                <h3 className="text-slate-800 font-bold text-sm">Create New Unit</h3>
                <button onClick={() => setShowNewModal(false)} className="p-1 hover:bg-slate-200 rounded transition-all cursor-pointer"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                <StudyModalForm onSubmit={handleCreateStudy} onCancel={() => setShowNewModal(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // WORKSTATION
  // ─────────────────────────────────────────────
  return (
    <div className="h-screen w-full flex flex-col bg-white font-sans overflow-hidden select-none"
      onClick={() => contextMenu.visible && setContextMenu(prev => ({ ...prev, visible: false }))}>

      {/* Top Header */}
      <header className="h-10 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-[120] shadow-sm no-print">
        <div className="flex items-center gap-6 h-full">
          <div className="flex items-center gap-2 pr-6 border-r border-slate-100">
            <div className="w-5 h-5 bg-[#0d1111] rounded flex items-center justify-center text-[10px] font-black text-white shadow-sm">PS</div>
            <span className="text-[11px] font-black uppercase text-[#0d1111]">PS-Magnashield</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Main Workstation</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 shadow-sm">
            {syncStatus === 'saving' ? <Activity size={12} className="text-[#00B2B2] animate-pulse" /> : <Cloud size={12} className="text-emerald-500" />}
            <span className="text-[9px] font-black uppercase text-slate-400">Local</span>
          </div>
          <button onClick={() => setView('start')}><X size={13} className="text-slate-300 hover:text-red-500 cursor-pointer" /></button>
        </div>
      </header>

      {/* Top Tab Navigation */}
      <nav className="h-12 bg-slate-100 border-b border-slate-200 flex items-center px-2 shrink-0 overflow-x-auto no-print">
        {TOP_TABS.map(tab => {
          const TabIcon = tab.Icon;
          return (
            <button key={tab.id}
              onClick={() => { setActiveTopTab(tab.id); setActiveSideTab(SIDE_NAV[tab.id]?.[0]?.id || ''); }}
              className={`flex items-center gap-2 px-6 h-full text-[11px] font-bold uppercase tracking-tight transition-all border-r border-slate-200 whitespace-nowrap cursor-pointer ${activeTopTab === tab.id ? 'bg-white text-[#00B2B2] shadow-sm font-black' : 'text-slate-500 hover:bg-slate-50'}`}>
              <TabIcon size={14} /> {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-56'} bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 shadow-xl no-print`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between h-12 overflow-hidden shrink-0">
            {!isSidebarCollapsed && <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{TOP_TABS.find(t => t.id === activeTopTab)?.label}</h4>}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-pointer transition-all">
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
            {(SIDE_NAV[activeTopTab] || []).map(sub => {
              const SubIcon = sub.Icon;
              return (
                <button key={sub.id} onClick={() => setActiveSideTab(sub.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${activeSideTab === sub.id ? 'bg-[#00B2B2]/10 text-[#00B2B2]' : 'text-slate-500 hover:bg-slate-50'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={sub.label}>
                  <SubIcon size={14} className="shrink-0" /> {!isSidebarCollapsed && <span className="whitespace-nowrap">{sub.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-slate-50 overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-auto relative">

            {/* ── STUDY DATA: OVERVIEW ── */}
            {activeTopTab === 'data' && activeSideTab === 'overview' && (
              <div className="max-w-5xl mx-auto p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Study Overview</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={exportCSV} className="flex items-center gap-2 bg-[#0d1111] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg cursor-pointer"><Download size={14} /> Export CSV</button>
                    <button onClick={exportFullStudyJSON} className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg cursor-pointer"><Download size={14} /> Full Export (JSON)</button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 space-y-4">
                  <OverviewField label="Study Name"    val={studyData.metadata?.name}        onChange={v => handleStudyUpdate('name', v)} />
                  <OverviewField label="Coordinator"   val={studyData.metadata?.coordinator} onChange={v => handleStudyUpdate('coordinator', v)} />
                  <OverviewField label="Contact"       val={studyData.metadata?.contact}     onChange={v => handleStudyUpdate('contact', v)} />
                  <OverviewField label="Facility"      val={studyData.metadata?.facility}    onChange={v => handleStudyUpdate('facility', v)} />
                  <OverviewField label="Owner"         val={studyData.metadata?.owner}       onChange={v => handleStudyUpdate('owner', v)} />
                  <OverviewField label="Plant / Unit"  val={studyData.metadata?.unit}        onChange={v => handleStudyUpdate('unit', v)} />
                  <OverviewField label="PHA Type"      val={studyData.metadata?.type}        type="select" opts={['HAZOP','LOPA','What-If','Checklist']} onChange={v => handleStudyUpdate('type', v)} />
                  <OverviewField label="Study Status"  val={studyData.metadata?.status}      type="select" opts={['Planned','Draft','Approved']}         onChange={v => handleStudyUpdate('status', v)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MiniStat label="Nodes"     value={studyData.nodes?.length || 0}        Icon={Map}           color="text-blue-500"   />
                  <MiniStat label="Scenarios" value={studyData.rows?.length || 0}         Icon={ClipboardList} color="text-teal-500"   />
                  <MiniStat label="Drawings"  value={studyData.pids?.length || 0}         Icon={Archive}       color="text-orange-500" />
                  <MiniStat label="Recs"      value={recommendationsFromWorksheet.length} Icon={ClipboardCheck} color="text-purple-500" />
                </div>
              </div>
            )}

            {/* ── STUDY DATA: TEAM MEMBERS ── */}
            {activeTopTab === 'data' && activeSideTab === 'team' && (
              <div className="h-full flex flex-col">
                <TeamMembersPanel studyData={studyData} updateServer={updateServer}/>
              </div>
            )}

            {/* ── STUDY DATA: DOCUMENTS placeholder ── */}
            {activeTopTab === 'data' && activeSideTab === 'documents' && (
              <IndustrialRegistryView title="Study Documents" items={studyData.documents || []} columns={studyData.pidsColumns || DEFAULT_PID_COLS} updateServer={(d) => { if(d.documents !== undefined) updateServer({documents:d.documents}); else updateServer(d); }} moduleKey="documents" setShowColManager={setShowColManager}/>
            )}

            {/* ── ACTION TRACKING ── */}
            {activeTopTab === 'actions' && (
              <div className="h-full flex flex-col">
                <ActionTrackingSystem studyData={studyData} updateServer={updateServer}/>
              </div>
            )}

            {/* ── NODES: NODE REGISTRY (with Equipment Manager button per row) ── */}
            {activeTopTab === 'nodes' && activeSideTab === 'list' && (
              <div className="h-full relative flex flex-col">
                {/* Node Registry Table */}
                <IndustrialRegistryView
                  title="Nodes Registry"
                  items={studyData.nodes || []}
                  columns={studyData.nodeColumns || DEFAULT_NODE_COLS}
                  updateServer={(data) => {
                    // When updateServer is called from IndustrialRegistryView for nodes,
                    // preserve existing equipment arrays on each node
                    if (data.nodes) {
                      const mergedNodes = data.nodes.map(newNode => {
                        const existing = (studyData.nodes || []).find(n => n.id === newNode.id);
                        return existing ? { ...newNode, equipment: existing.equipment || [] } : newNode;
                      });
                      updateServer({ nodes: mergedNodes });
                    } else {
                      updateServer(data);
                    }
                  }}
                  moduleKey="nodes"
                  setShowColManager={setShowColManager}
                />
                {/* Equipment Manager buttons overlaid per row — positioned in a floating column */}
                <div className="absolute top-[104px] right-4 flex flex-col gap-0 pointer-events-none z-20">
                  {(studyData.nodes || []).map((node) => (
                    <div key={`eq-btn-${node.id}`} className="h-10 flex items-center pointer-events-auto">
                      <button
                        onClick={() => setEquipmentModal({ open: true, nodeId: node.id })}
                        className="bg-[#004a7c] text-white px-3 py-1.5 rounded shadow hover:brightness-110 transition-all flex items-center gap-2 text-[9px] font-black uppercase">
                        <Boxes size={11} /> Manage Eq.
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTopTab === 'nodes' && activeSideTab === 'pids' && (
              <IndustrialRegistryView title="P&ID Reference" items={studyData.pids || []} columns={studyData.pidsColumns || DEFAULT_PID_COLS} updateServer={updateServer} moduleKey="pids" setShowColManager={setShowColManager} />
            )}

            {/* ── DEVIATIONS ── */}
            {activeTopTab === 'deviations' && activeSideTab === 'list' && (
              <IndustrialRegistryView title="Deviations Registry" items={studyData.deviations || []} columns={studyData.deviationColumns || DEFAULT_DEVIATION_COLS} updateServer={updateServer} moduleKey="deviations" setShowColManager={setShowColManager} autoSynthesis />
            )}

            {/* ── CAUSES ── */}
            {activeTopTab === 'causes' && activeSideTab === 'list' && (
              <IndustrialRegistryView title="Causes Registry" items={studyData.causes || []} columns={studyData.causeColumns || DEFAULT_CAUSE_COLS} updateServer={updateServer} moduleKey="causes" setShowColManager={setShowColManager} />
            )}

            {/* ── SAFEGUARDS — linked to PHA Worksheet safeguards column ── */}
            {activeTopTab === 'safeguards' && activeSideTab === 'list' && (
              <div className="flex flex-col h-full">
                <IndustrialRegistryView
                  title="Safeguards Registry (Linked to PHA Worksheet)"
                  items={studyData.safeguards || []}
                  columns={studyData.safeguardsColumns || [
                    { id: 'safeguard',    label: 'SAFEGUARD DESCRIPTION',  width: 380 },
                    { id: 'type',         label: 'TYPE / CATEGORY',         width: 160, type: 'select', opts: ['IPL','Administrative','Engineering','Procedural','Detection','Mitigation','Other'] },
                    { id: 'ipl',          label: 'IPL',                     width: 80,  type: 'select', opts: ['Yes','No'] },
                    { id: 'pfd',          label: 'PFD',                     width: 100 },
                    { id: 'independent',  label: 'INDEPENDENT',             width: 120, type: 'select', opts: ['Yes','No'] },
                    { id: 'auditable',    label: 'AUDITABLE',               width: 120, type: 'select', opts: ['Yes','No'] },
                    { id: 'effective',    label: 'EFFECTIVE',               width: 120, type: 'select', opts: ['Yes','Partial','No'] },
                    { id: 'reference',    label: 'REFERENCE',               width: 160 },
                    { id: 'comments',     label: 'COMMENTS',                width: 220 },
                  ]}
                  updateServer={(data) => {
                    if (data.safeguards !== undefined) updateServer({ safeguards: data.safeguards });
                    else updateServer(data);
                  }}
                  moduleKey="safeguards"
                  setShowColManager={setShowColManager}
                />
                <div className="no-print px-6 py-3 bg-teal-50 border-t border-teal-200 flex items-center gap-3 text-[10px] font-black text-teal-700 uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-teal-500" />
                  Safeguards added here are automatically available as quick-pick options in the PHA Worksheet safeguards column.
                </div>
              </div>
            )}

            {/* ── RECOMMENDATIONS ── */}
            {activeTopTab === 'recs' && activeSideTab === 'list' && (
              <IndustrialRegistryView
                title="Recommendations Management Registry"
                items={recommendationsFromWorksheet}
                columns={studyData.recColumns || DEFAULT_REC_COLS}
                updateServer={updateServer}
                moduleKey="recs"
                setShowColManager={setShowColManager}
                isReadOnly={false}
                onExportCSV={() => {
                  const cols = studyData.recColumns || DEFAULT_REC_COLS;
                  const headers = cols.map(c => c.label).join(',');
                  const rows = recommendationsFromWorksheet.map(r => cols.map(c => `"${String(r[c.id] || '').replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'recommendations_export.csv'; a.click();
                }}
              />
            )}

            {/* ── CHECKLISTS ── */}
            {activeTopTab === 'checklists' && activeSideTab === 'list' && (
              <IndustrialRegistryView title="Checklist Registry" items={studyData.checklists || []} columns={studyData.checklistColumns || []} updateServer={updateServer} moduleKey="checklists" setShowColManager={setShowColManager} />
            )}

            {/* ── RISK CRITERIA: RISK MATRIX HAZOP ── */}
            {activeTopTab === 'risk' && activeSideTab === 'matrix' && (() => {
              const matrix = (studyData.riskMatrix || buildDefaultRiskMatrix())[riskMatrixChannel] || {};
              const globalColors = studyData.globalColors || DEFAULT_GLOBAL_COLORS;
              const sevLevels = studyData.severityLevels || DEFAULT_SEVERITY_LEVELS;
              // Freq rows top→bottom: F5 (highest) to F1 (lowest), matching image
              const freqRows = [...FREQ_LABELS].reverse(); // F5 first
              const sevCols = SEV_LABELS; // S0..S4

              const getCellColor = (score) => {
                if (score === 0) return { bg: '#f8fafc', text: '#cbd5e1' };
                const gc = globalColors.find(g => score >= g.minScore && score <= g.maxScore);
                if (gc) return { bg: gc.color, text: gc.textColor || '#fff' };
                return { bg: '#f1f5f9', text: '#64748b' };
              };

              return (
                <div className="flex flex-col h-full bg-slate-50">
                  {/* Header bar */}
                  <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#004a7c] rounded-full" />Risk Matrix HAZOP
                    </h2>
                    <select className="bg-[#004a7c] text-white px-5 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer shadow-lg"
                      value={riskMatrixChannel} onChange={e => setRiskMatrixChannel(e.target.value)}>
                      {RISK_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                  </div>

                  {/* Toolbar */}
                  <div className="bg-[#f0f0f0] px-4 py-1.5 flex items-center border-b border-slate-300 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-1">
                      <ToolbarButton icon={<Printer size={18}/>} onClick={() => handlePrintAction()} title="Print" />
                      <div className="h-6 w-px bg-slate-300 mx-2"/>
                      <ToolbarButton icon={<Download size={18} className="text-emerald-600"/>} onClick={exportFullStudyJSON} title="Export Full Study" />
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {RISK_CHANNELS.map(ch => (
                        <button key={ch} onClick={() => setRiskMatrixChannel(ch)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${riskMatrixChannel === ch ? 'bg-[#004a7c] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#004a7c] hover:text-[#004a7c]'}`}>
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-6 bg-slate-100/40">
                    {/* Info banner */}
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-[10px] font-bold text-blue-700 flex items-center gap-2">
                      <Info size={12} className="text-blue-500 shrink-0"/>
                      Risk Score = Severity × Frequency. Click any cell to edit its score (0–25). Colors are driven by Global Color settings.
                    </div>

                    {/* The 5×5 Matrix — styled like the image */}
                    <div className="bg-white border-2 border-slate-400 shadow-lg rounded overflow-hidden w-fit">
                      <table className="border-collapse text-[11px]">
                        <thead>
                          <tr>
                            {/* Top-left corner: title */}
                            <th colSpan={2} className="border border-slate-300 bg-[#f5e6d0] p-2 text-center font-black text-[13px] text-slate-700 uppercase tracking-widest" colSpan={2}>
                              RISK MATRIX
                            </th>
                            {sevCols.map(s => (
                              <th key={s.code} className="border border-slate-400 bg-[#f5e6d0] p-2 text-center font-black text-[11px] text-slate-700 w-28">
                                <div className="font-black">{s.label}</div>
                                <div className="text-[9px] text-slate-500 font-bold">({s.code})</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {freqRows.map((freq, fi) => {
                            return (
                              <tr key={freq.code}>
                                {/* Frequency label cell */}
                                {fi === 0 && (
                                  <td rowSpan={freqRows.length} className="border border-slate-400 bg-[#f5e6d0] text-center align-middle w-10">
                                    <div className="writing-mode-vertical font-black text-[11px] text-slate-600 uppercase tracking-widest"
                                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', padding: '8px 4px' }}>
                                      F R E Q U E N C Y
                                    </div>
                                  </td>
                                )}
                                <td className="border border-slate-400 bg-[#f5e6d0] p-2 text-left font-bold text-[10px] text-slate-700 max-w-[180px] align-middle">
                                  <div className="font-black text-[10px]">{freq.label}</div>
                                </td>
                                {sevCols.map(sev => {
                                  const key = `F${freq.value}_S${sev.value}`;
                                  const score = matrix[key] !== undefined ? matrix[key] : (freq.value * sev.value);
                                  const { bg, text } = getCellColor(score);
                                  return (
                                    <td key={sev.code} className="border border-slate-400 p-0 text-center align-middle w-28 h-16 relative group"
                                      style={{ backgroundColor: bg }}>
                                      <input
                                        type="number" min="0" max="25"
                                        className="w-full h-full text-center font-black text-xl bg-transparent outline-none cursor-pointer appearance-none"
                                        style={{ color: text, minHeight: '60px', padding: '4px' }}
                                        value={score}
                                        onChange={e => handleMatrixCellUpdate(freq.value, sev.value, e.target.value)}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                          {/* Bottom label row */}
                          <tr>
                            <td colSpan={2} className="border border-slate-400 bg-[#f5e6d0] p-2 text-right text-[10px] font-black text-slate-600 uppercase tracking-widest">Impact on ↓</td>
                            <td colSpan={5} className="border border-slate-400 bg-[#f5e6d0] p-2 text-center text-[11px] font-black text-slate-700 uppercase tracking-widest">SEVERITY</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Color Legend */}
                    <div className="mt-6 bg-white border border-slate-300 shadow rounded-xl p-5 w-fit">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Risk Level Color Key (from Global Color settings)</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        {globalColors.map(gc => (
                          <div key={gc.id} className="flex items-center gap-2">
                            <div className="w-10 h-8 rounded font-black text-xs flex items-center justify-center shadow-sm border border-slate-200"
                              style={{ backgroundColor: gc.color, color: gc.textColor || '#fff' }}>
                              {gc.range}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{gc.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold mt-3">Risk Score = Severity (S) × Frequency (F). Adjust colors in the "Global Color" sub-section.</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── RISK CRITERIA: LIKELIHOOD ── */}
            {activeTopTab === 'risk' && activeSideTab === 'likelihoods' && (
              <div className="flex flex-col h-full bg-slate-50">
                <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><div className="w-1.5 h-6 bg-[#004a7c] rounded-full"/>Likelihood Categories</h2>
                </div>
                <div className="bg-[#f0f0f0] px-4 py-1.5 flex items-center border-b border-slate-300 shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-1">
                    <ToolbarButton icon={<Printer size={18}/>} onClick={() => handlePrintAction()} title="Print" />
                    <div className="h-6 w-px bg-slate-300 mx-2"/>
                    <ToolbarButton icon={<Download size={18} className="text-emerald-600"/>} onClick={exportFullStudyJSON} title="Export Full Study" />
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-[#c0c0c0]/10 p-4">
                  <div className="bg-white border border-slate-300 shadow-md rounded-sm overflow-hidden w-fit">
                    <table className="text-left border-collapse table-fixed">
                      <thead className="bg-[#004a7c] text-white text-[11px] font-bold uppercase border-b-2 border-slate-400">
                        <tr>
                          <th className="p-3 border border-slate-300 w-24 text-center">Code</th>
                          <th className="p-3 border border-slate-300 w-64 text-center">Description</th>
                          <th className="p-3 border border-slate-300 w-80 text-center">Likelihood / Frequency</th>
                          <th className="p-3 border border-slate-300 w-96 text-center">Probability Range</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {[
                          { code:'VL', rating:1, desc:'Very Low',  freq:'Once in two years or more',                   prob:'0–10%',   color:'#16a34a' },
                          { code:'L',  rating:2, desc:'Low',       freq:'Once in a year / more than once in 2 years',  prob:'10–30%',  color:'#fbbf24' },
                          { code:'M',  rating:3, desc:'Medium',    freq:'Once in 6 months / more than once in a year', prob:'30–50%',  color:'#f97316' },
                          { code:'H',  rating:4, desc:'High',      freq:'Once in a quarter / more than once in 6 months', prob:'50–80%', color:'#dc2626' },
                          { code:'VH', rating:5, desc:'Very High', freq:'Once a month / more than once in a quarter',  prob:'80–100%', color:'#7f1d1d' },
                        ].map(r => (
                          <tr key={r.code} className="h-10 hover:bg-blue-50 transition-colors">
                            <td className="p-3 border border-slate-300 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-7 rounded font-black text-xs text-white" style={{ backgroundColor: r.color }}>{r.code}</span>
                            </td>
                            <td className="p-3 border border-slate-300 font-bold text-slate-700 text-xs">{r.rating} — {r.desc}</td>
                            <td className="p-3 border border-slate-300 text-xs text-slate-600 font-bold">{r.freq}</td>
                            <td className="p-3 border border-slate-300 text-xs text-slate-500 font-bold">{r.prob}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── RISK CRITERIA: CONSEQUENCES ── */}
            {activeTopTab === 'risk' && activeSideTab === 'consequences' && (
              <div className="flex flex-col h-full bg-slate-50">
                <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><div className="w-1.5 h-6 bg-[#004a7c] rounded-full"/>Consequence Categories</h2>
                  <select className="bg-[#004a7c] text-white px-5 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer shadow-lg"
                    value={riskMatrixChannel} onChange={e => setRiskMatrixChannel(e.target.value)}>
                    {RISK_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                  </select>
                </div>
                <div className="bg-[#f0f0f0] px-4 py-1.5 flex items-center border-b border-slate-300 shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-1">
                    <ToolbarButton icon={<Printer size={18}/>} onClick={() => handlePrintAction()} title="Print" />
                    <div className="h-6 w-px bg-slate-300 mx-2"/>
                    <ToolbarButton icon={<Download size={18} className="text-emerald-600"/>} onClick={exportFullStudyJSON} title="Export Full Study" />
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-[#c0c0c0]/10 p-4">
                  <div className="bg-white border border-slate-300 shadow-md rounded-sm overflow-hidden w-fit">
                    <table className="text-left border-collapse table-fixed">
                      <thead className="bg-[#004a7c] text-white text-[11px] font-bold uppercase border-b-2 border-slate-400">
                        <tr>
                          <th className="p-3 border border-slate-300 w-24 text-center">Code</th>
                          <th className="p-3 border border-slate-300 w-48 text-center">Severity Rating</th>
                          <th className="p-3 border border-slate-300 w-[700px] text-center">Factors to Consider ({riskMatrixChannel})</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-300">
                        {[
                          { code:'VH', rating:5, color:'#7f1d1d', factors: {
                            Safety:      'Fatality or permanent total disability ≥1 person; permanent partial disability ≥5 persons; ≥20 persons injured with combined man-days lost ≥60',
                            Environment: 'Serious environment impact (multiple damages), effect >24 hrs and irreversible; hazardous spill ≥10,000 kg; non-hazardous spill ≥20,000 kg',
                            Assets:      'Financial loss ≥ Rs.10 crores; interruption to services 1 month or more; closure notice / penalty / reputation loss',
                            Community:   'Incarceration; direct intervention of Board or Stakeholders required; major community impact',
                            Reputation:  'Loss of reputation/brand; national media coverage; permanent regulatory action',
                          }},
                          { code:'H', rating:4, color:'#dc2626', factors: {
                            Safety:      'Notifiable disease; lost-time injury requiring hospitalization; multiple medical treatment cases',
                            Environment: 'Moderate environment impact, reversible >24 hrs; hazardous spill 1,000–10,000 kg; significant regulatory interest',
                            Assets:      'Financial loss Rs.5–10 crores; interruption to services fortnight; show cause notice',
                            Community:   'Managing Director attention required; significant community complaints; local media coverage',
                            Reputation:  'Regional media coverage; regulatory investigation; temporary suspension of operations',
                          }},
                          { code:'M', rating:3, color:'#f97316', factors: {
                            Safety:      'Medical treatment case; restricted work; multiple first-aid cases with follow-up',
                            Environment: 'Minor environment impact, reversible within 24 hrs; contained spill; regulatory notification required',
                            Assets:      'Financial loss Rs.1–5 crores; interruption to services 1 week; internal investigation report',
                            Community:   'Community complaints requiring formal response; local authority notification',
                            Reputation:  'Local media coverage; customer complaints; temporary reputational damage',
                          }},
                          { code:'L', rating:2, color:'#fbbf24', factors: {
                            Safety:      'First-aid case only; minor injury not requiring medical treatment',
                            Environment: 'Negligible environment impact; contained within site; no regulatory notification required',
                            Assets:      'Financial loss < Rs.1 crore; minor equipment damage; interruption <1 day',
                            Community:   'Minor community inconvenience; no formal complaint; internal awareness',
                            Reputation:  'Internal reputational concern; no external visibility; corrected within department',
                          }},
                          { code:'VL', rating:1, color:'#16a34a', factors: {
                            Safety:      'No injury; near-miss with no potential for harm',
                            Environment: 'No measurable environment impact; no release outside process',
                            Assets:      'Negligible financial impact; no equipment damage; fully contained',
                            Community:   'No community impact; no external notification required',
                            Reputation:  'No reputational impact; internal improvement opportunity only',
                          }},
                        ].map(r => (
                          <tr key={r.code} className="hover:bg-blue-50 transition-colors align-top">
                            <td className="p-3 border border-slate-300 text-center align-middle">
                              <span className="inline-flex items-center justify-center w-10 h-7 rounded font-black text-xs text-white" style={{ backgroundColor: r.color }}>{r.code}</span>
                            </td>
                            <td className="p-3 border border-slate-300 font-black text-slate-700 text-xs align-middle">
                              {r.rating} — {r.code === 'VH' ? 'Very High' : r.code === 'H' ? 'High' : r.code === 'M' ? 'Medium' : r.code === 'L' ? 'Low' : 'Very Low'}
                            </td>
                            <td className="p-3 border border-slate-300 text-xs text-slate-600 font-bold leading-relaxed">{r.factors[riskMatrixChannel] || r.factors.Safety}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── RISK CRITERIA: RANKINGS/RISK COLOR ── */}
            {activeTopTab === 'risk' && activeSideTab === 'rankings' && (() => {
              const rankings = studyData.rankings || DEFAULT_RANKINGS;
              return (
                <div className="flex flex-col h-full bg-slate-50">
                  <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#004a7c] rounded-full" />Risk Color (Legacy)
                    </h2>
                  </div>
                  <div className="flex-1 overflow-auto p-6 bg-slate-100/40">
                    <div className="bg-white border border-slate-300 shadow-md rounded-lg overflow-hidden">
                      <div className="p-4 bg-slate-100 border-b border-slate-300 flex items-center gap-2">
                        <Info size={14} className="text-blue-500"/>
                        <p className="text-[10px] font-bold text-slate-600">Legacy risk color system. New projects should use "Global Color" instead.</p>
                      </div>
                      <table className="w-full border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#004a7c] text-white">
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Code</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Description</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Color</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Priority</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.map((rank, idx) => (
                            <tr key={rank.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border border-slate-300 p-3 font-black text-xs w-12" style={{ backgroundColor: rank.color, color: '#fff' }}>
                                {rank.code}
                              </td>
                              <td className="border border-slate-300 p-3 text-[10px] font-bold">{rank.description}</td>
                              <td className="border border-slate-300 p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: rank.color }}/>
                                  <span className="text-[9px] font-mono text-slate-500">{rank.color}</span>
                                </div>
                              </td>
                              <td className="border border-slate-300 p-3 font-bold text-[10px]">{rank.priority}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── RISK CRITERIA: SEVERITY ── */}
            {activeTopTab === 'risk' && activeSideTab === 'severity' && (() => {
              const severityLevels = studyData.severityLevels || DEFAULT_SEVERITY_LEVELS;
              return (
                <div className="flex flex-col h-full bg-slate-50">
                  <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#004a7c] rounded-full" />Severity Levels
                    </h2>
                  </div>
                  <div className="flex-1 overflow-auto p-6 bg-slate-100/40">
                    <div className="bg-white border border-slate-300 shadow-md rounded-lg overflow-hidden">
                      <div className="p-4 bg-slate-100 border-b border-slate-300 flex items-center gap-2">
                        <Info size={14} className="text-blue-500"/>
                        <p className="text-[10px] font-bold text-slate-600">Customize severity level definitions and their associated colors.</p>
                      </div>
                      <table className="w-full border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#004a7c] text-white">
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Code</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Label</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Value</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Color</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {severityLevels.map((sev, idx) => (
                            <tr key={sev.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border border-slate-300 p-3 font-bold text-[10px]">{sev.code}</td>
                              <td className="border border-slate-300 p-3 text-[10px] font-bold">{sev.label}</td>
                              <td className="border border-slate-300 p-3 text-center font-bold text-[10px]">{sev.value}</td>
                              <td className="border border-slate-300 p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: sev.color }}/>
                                  <span className="text-[9px] font-mono text-slate-500">{sev.color}</span>
                                </div>
                              </td>
                              <td className="border border-slate-300 p-3 text-[10px] font-bold">{sev.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── RISK CRITERIA: GLOBAL COLOR ── */}
            {activeTopTab === 'risk' && activeSideTab === 'globalcolor' && (() => {
              const globalColors = studyData.globalColors || DEFAULT_GLOBAL_COLORS;
              return (
                <div className="flex flex-col h-full bg-slate-50">
                  <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#004a7c] rounded-full" />Global Color Scale
                    </h2>
                  </div>
                  <div className="flex-1 overflow-auto p-6 bg-slate-100/40">
                    <div className="bg-white border border-slate-300 shadow-md rounded-lg overflow-hidden">
                      <div className="p-4 bg-slate-100 border-b border-slate-300 flex items-center gap-2">
                        <Info size={14} className="text-blue-500"/>
                        <p className="text-[10px] font-bold text-slate-600">Map risk score ranges (1–25) to colors. Used in Risk Matrix and all worksheets.</p>
                      </div>
                      <table className="w-full border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#004a7c] text-white">
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Range</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Label</th>
                            <th className="border border-slate-300 p-3 text-center font-black uppercase tracking-widest">Min</th>
                            <th className="border border-slate-300 p-3 text-center font-black uppercase tracking-widest">Max</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">BG Color</th>
                            <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Text Color</th>
                          </tr>
                        </thead>
                        <tbody>
                          {globalColors.map((gc, idx) => (
                            <tr key={gc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border border-slate-300 p-3 font-bold text-[10px]">{gc.range}</td>
                              <td className="border border-slate-300 p-3 text-[10px] font-bold">{gc.label}</td>
                              <td className="border border-slate-300 p-3 text-center font-bold text-[10px]">{gc.minScore}</td>
                              <td className="border border-slate-300 p-3 text-center font-bold text-[10px]">{gc.maxScore}</td>
                              <td className="border border-slate-300 p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: gc.color }}/>
                                  <span className="text-[9px] font-mono text-slate-500">{gc.color}</span>
                                </div>
                              </td>
                              <td className="border border-slate-300 p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: gc.textColor || '#fff', color: '#000' }}/>
                                  <span className="text-[9px] font-mono text-slate-500">{gc.textColor || '#fff'}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── RISK CRITERIA: PLANT ── */}
            {activeTopTab === 'risk' && activeSideTab === 'plant' && (() => {
              const plantInfo = studyData.plantInfo || {};
              return (
                <div className="flex flex-col h-full bg-slate-50">
                  <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#004a7c] rounded-full" />Plant Information
                    </h2>
                  </div>
                  <div className="flex-1 overflow-auto p-6 bg-slate-100/40">
                    <div className="max-w-2xl mx-auto bg-white border border-slate-300 shadow-md rounded-lg p-6 space-y-4">
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest block mb-2">Plant Name</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[11px] font-bold"
                          defaultValue={plantInfo.name || ''} placeholder="e.g., Refinery XYZ"/>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest block mb-2">Location</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[11px] font-bold"
                          defaultValue={plantInfo.location || ''} placeholder="e.g., Mumbai, India"/>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest block mb-2">Owner/Operator</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[11px] font-bold"
                          defaultValue={plantInfo.owner || ''} placeholder="e.g., ABC Energy Ltd."/>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest block mb-2">Unit/Process</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[11px] font-bold"
                          defaultValue={plantInfo.unit || ''} placeholder="e.g., Distillation Unit"/>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest block mb-2">Description</label>
                        <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[11px] font-bold" rows="4"
                          defaultValue={plantInfo.description || ''} placeholder="Brief description of the plant..."/>
                      </div>
                      <button className="w-full px-4 py-2 bg-[#004a7c] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#003a5c]">
                        Save Plant Info
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── RISK CRITERIA: NODE RISK INFO ── */}
            {activeTopTab === 'risk' && activeSideTab === 'node_risk' && (() => {
              const nodeRiskInfo = studyData.nodeRiskInfo || [];
              return (
                <div className="flex flex-col h-full bg-slate-50">
                  <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#004a7c] rounded-full" />Node Risk Information
                    </h2>
                    <button className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center gap-2 shadow-md">
                      <Plus size={14}/>Add Node
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-6 bg-slate-100/40">
                    {nodeRiskInfo.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center">
                        <div className="p-8 bg-white border border-dashed border-slate-300 rounded-lg max-w-xs">
                          <Map size={40} className="mx-auto text-slate-300 mb-4"/>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">No nodes added</p>
                          <p className="text-[10px] text-slate-400 mt-2">Define node-level risk profiles here.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {nodeRiskInfo.map((node, idx) => (
                          <div key={idx} className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Node Name</label>
                                <input type="text" className="w-full px-2 py-1 border border-slate-300 rounded text-[10px] font-bold"
                                  defaultValue={node.name || ''}/>
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Risk Level</label>
                                <select className="w-full px-2 py-1 border border-slate-300 rounded text-[10px] font-bold">
                                  <option>Low</option>
                                  <option>Medium</option>
                                  <option>High</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── RISK CRITERIA: RESPONSIVITY BY ── */}
            {activeTopTab === 'risk' && activeSideTab === 'responsivity' && (() => {
              const responsivityBy = studyData.responsivityBy || [];
              return (
                <div className="flex flex-col h-full bg-slate-50">
                  <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#004a7c] rounded-full" />Responsivity By
                    </h2>
                    <button className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center gap-2 shadow-md">
                      <Plus size={14}/>Add Responsibility
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-6 bg-slate-100/40">
                    <div className="bg-white border border-slate-300 shadow-md rounded-lg overflow-hidden">
                      <div className="p-4 bg-slate-100 border-b border-slate-300 flex items-center gap-2">
                        <Info size={14} className="text-blue-500"/>
                        <p className="text-[10px] font-bold text-slate-600">Define responsibility/ownership for risk responses and mitigation actions.</p>
                      </div>
                      {responsivityBy.length === 0 ? (
                        <div className="p-8 text-center">
                          <UserCheck size={40} className="mx-auto text-slate-300 mb-4"/>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">No responsibilities defined</p>
                        </div>
                      ) : (
                        <table className="w-full border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-[#004a7c] text-white">
                              <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Department/Team</th>
                              <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Contact</th>
                              <th className="border border-slate-300 p-3 text-left font-black uppercase tracking-widest">Risk Scope</th>
                            </tr>
                          </thead>
                          <tbody>
                            {responsivityBy.map((resp, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="border border-slate-300 p-3 text-[10px] font-bold">{resp.department || '—'}</td>
                                <td className="border border-slate-300 p-3 text-[10px] font-bold">{resp.contact || '—'}</td>
                                <td className="border border-slate-300 p-3 text-[10px] font-bold">{resp.scope || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── PHA WORKSHEET ── */}
            {activeTopTab === 'pha' && activeSideTab === 'sheet' && (() => {
              // ── HIERARCHICAL DATA MODEL ──────────────────────────────────────────────────
              // Each "leaf" row in studyData.rows represents: Deviation → Cause → Consequence → Safeguard
              // Fields:
              //   devGrp    — shared key for rows with same deviation (guideword+param+mat+from+to)
              //   causeGrp  — shared key for rows with same cause (within devGrp)
              //   consGrp   — shared key for rows with same consequence (within causeGrp)
              //   + per-leaf: safeguard, rawS/L, mitS/L, resS/L, recs, remarks, status
              //
              // Key columns kept: gword, param, mat, from, to (from Deviations registry)
              // Deviation = auto-synthesized from those 5 fields
              //
              // ENTER KEY behaviour:
              //   In guideword/param/mat/from/to/deviation → new Cause row under same devGrp
              //   In Cause                                 → new sibling Cause (same devGrp, new causeGrp)
              //   In consImm / consUlt                    → new sibling Consequence (same causeGrp, new consGrp)
              //   In safeguard / risk / recs / remarks     → new sibling Safeguard (same consGrp)

              const mkGrpId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);

              const blankLeaf = (nodeId, overrides = {}) => ({
                id: mkGrpId(), nodeId,
                devGrp: mkGrpId(),
                gword: '', param: '', mat: '', from: '', to: '', dev: '',
                causeGrp: mkGrpId(), cause: '',
                consGrp: mkGrpId(), consImm: '', consUlt: '',
                safeguard: '',
                rawS: 0, rawL: 0,
                mitS: 0, mitL: 0,
                resS: 0, resL: 0,
                recs: '', remarks: '', status: 'Proposed',
                ...overrides,
              });

              const allRows   = studyData.rows || [];
              const nodeRows  = allRows.filter(r => r.nodeId === selectedNodeId);

              // ── Hierarchical grouping ──────────────────────────────────────────────────
              const buildHierarchy = (rows) => {
                const devs = [];
                rows.forEach(row => {
                  let dg = devs.find(g => g.devGrp === row.devGrp);
                  if (!dg) { dg = { devGrp: row.devGrp, rows: [], causeGroups: [] }; devs.push(dg); }
                  dg.rows.push(row);
                  let cg = dg.causeGroups.find(g => g.causeGrp === row.causeGrp);
                  if (!cg) { cg = { causeGrp: row.causeGrp, rows: [], consGroups: [] }; dg.causeGroups.push(cg); }
                  cg.rows.push(row);
                  let cong = cg.consGroups.find(g => g.consGrp === row.consGrp);
                  if (!cong) { cong = { consGrp: row.consGrp, rows: [] }; cg.consGroups.push(cong); }
                  cong.rows.push(row);
                });
                return devs;
              };

              const hierarchy = buildHierarchy(nodeRows);

              // ── Numbering map ──────────────────────────────────────────────────────────
              const numMap = {};
              hierarchy.forEach((dg, di) => {
                dg.causeGroups.forEach((cg, ci) => {
                  cg.consGroups.forEach((cong, congi) => {
                    cong.rows.forEach((r, si) => {
                      numMap[r.id] = {
                        devLabel:   `${di+1}`,
                        causeLabel: `${di+1}.${ci+1}`,
                        consLabel:  `${di+1}.${ci+1}.${congi+1}`,
                        safeLabel:  `${di+1}.${ci+1}.${congi+1}.${si+1}`,
                      };
                    });
                  });
                });
              });

              // ── Mutation helpers ───────────────────────────────────────────────────────
              const commitRows = (fn) => updateServer({ rows: fn([...allRows]) });

              const patchRow = (id, delta) =>
                commitRows(all => all.map(r => r.id === id ? { ...r, ...delta } : r));

              const patchDevGroup = (devGrp, delta) =>
                commitRows(all => all.map(r => r.devGrp === devGrp && r.nodeId === selectedNodeId ? { ...r, ...delta } : r));

              const patchCauseGroup = (causeGrp, delta) =>
                commitRows(all => all.map(r => r.causeGrp === causeGrp ? { ...r, ...delta } : r));

              const patchConsGroup = (consGrp, delta) =>
                commitRows(all => all.map(r => r.consGrp === consGrp ? { ...r, ...delta } : r));

              const insertAfter = (afterId, overrides = {}) => {
                const leaf = blankLeaf(selectedNodeId, overrides);
                commitRows(all => {
                  const idx = afterId ? all.findIndex(x => x.id === afterId) : -1;
                  const pos = idx === -1 ? all.length : idx + 1;
                  const next = [...all]; next.splice(pos, 0, leaf);
                  return next;
                });
                return leaf;
              };

              const lastOf = arr => arr[arr.length - 1];

              // Add helpers
              const addDeviation = (afterId) => insertAfter(afterId);
              const addCause = (refRow, lastDevRow) => insertAfter(lastDevRow.id, { devGrp: refRow.devGrp, gword: refRow.gword, param: refRow.param, mat: refRow.mat, from: refRow.from, to: refRow.to, dev: refRow.dev });
              const addConsequence = (refRow, lastCauseRow) => insertAfter(lastCauseRow.id, { devGrp: refRow.devGrp, gword: refRow.gword, param: refRow.param, mat: refRow.mat, from: refRow.from, to: refRow.to, dev: refRow.dev, causeGrp: refRow.causeGrp, cause: refRow.cause });
              const addSafeguard = (refRow, lastConsRow) => insertAfter(lastConsRow.id, { devGrp: refRow.devGrp, gword: refRow.gword, param: refRow.param, mat: refRow.mat, from: refRow.from, to: refRow.to, dev: refRow.dev, causeGrp: refRow.causeGrp, cause: refRow.cause, consGrp: refRow.consGrp, consImm: refRow.consImm, consUlt: refRow.consUlt });
              const deleteRow = (id) => commitRows(all => all.filter(r => r.id !== id));

              // ── Auto-resize textarea helper ────────────────────────────────────────────
              // AutoTA, RiskSel, RiskBadge, LBadge are defined at module level (stable —
              // prevents React from unmounting/remounting on every render which causes focus loss).

              // ── Column widths ──────────────────────────────────────────────────────────
              const W = {
                sr: 40, gword: 90, param: 90, mat: 110, locFrom: 95, locTo: 90, dev: 180,
                cause: 190, cImm: 160, cUlt: 140, safe: 200,
                rawS: 36, rawL: 36, rawR: 48,
                mitS: 36, mitL: 36, mitR: 48,
                resS: 36, resL: 36, resR: 48,
                recs: 180, rem: 130, stat: 100, act: 30,
              };
              const TOTAL_W = Object.values(W).reduce((a,b)=>a+b,0);

              // ── CSV export ─────────────────────────────────────────────────────────────
              const exportHierarchicalCSV = () => {
                const h = 'Sr,GuideWord,Parameter,Material,From,To,Deviation,Cause,Imm.Consequence,Ult.Consequence,Safeguard,S(Inh),L(Inh),IR,S(Mit),L(Mit),MR,S(Res),L(Res),RR,Recommendations,Remarks,Status';
                const b = nodeRows.map(r => {
                  const n = numMap[r.id]||{};
                  const sc = (s,l)=>(parseInt(s)||0)*(parseInt(l)||0);
                  return [n.safeLabel,r.gword,r.param,r.mat,r.from,r.to,r.dev||`${r.gword} ${r.param} of ${r.mat}`.trim(),r.cause,r.consImm,r.consUlt,r.safeguard,r.rawS,r.rawL,sc(r.rawS,r.rawL),r.mitS,r.mitL,sc(r.mitS,r.mitL),r.resS,r.resL,sc(r.resS,r.resL),r.recs,r.remarks,r.status]
                    .map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',');
                }).join('\n');
                const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([h+'\n'+b],{type:'text/csv'})); a.download='pha_worksheet.csv'; a.click();
              };

              // ── Table renderer ─────────────────────────────────────────────────────────
              const renderTableRows = () => {
                if (!hierarchy.length) return (
                  <tr><td colSpan={22} className="py-20 text-center text-slate-300 text-[11px] font-black uppercase tracking-widest">No scenarios yet — click "+ Add Deviation" to begin</td></tr>
                );

                return hierarchy.flatMap((dg, di) => {
                  const devSpan = dg.rows.length;
                  const lastDevRow = lastOf(dg.rows);
                  const devEven = di%2===0;

                  return dg.causeGroups.flatMap((cg, ci) => {
                    const causeSpan = cg.rows.length;
                    const lastCauseRow = lastOf(cg.rows);

                    return cg.consGroups.flatMap((cong, congi) => {
                      const consSpan = cong.rows.length;
                      const lastConsRow = lastOf(cong.rows);

                      return cong.rows.map((row, si) => {
                        const isDevFirst   = ci===0 && congi===0 && si===0;
                        const isCauseFirst = congi===0 && si===0;
                        const isConsFirst  = si===0;
                        const n = numMap[row.id]||{};
                        const devBg = devEven ? '#eff6ff' : '#dbeafe';
                        const devHdrBg = devEven ? '#dbeafe' : '#bfdbfe';
                        const causeBg = ci%2===0 ? '#fffbeb' : '#fef9c3';
                        const consBg  = congi%2===0 ? '#f0fdf4' : '#dcfce7';
                        const safeBg  = si%2===0 ? '#f7fef7' : '#ecfdf5';

                        const deviationAutoStr = `${row.gword||''} ${row.param||''} of ${row.mat||''} from ${row.from||''} to ${row.to||''}`.trim().replace(/\s+/g,' ');

                        return (
                          <tr key={row.id} className="group/leaf transition-colors hover:brightness-[0.97]"
                            style={{ borderTop: isDevFirst && di>0 ? '3px solid #2563eb' : isCauseFirst && ci>0 ? '2px solid #d97706' : isConsFirst && congi>0 ? '1px dashed #10b981' : undefined }}
                            onContextMenu={e => { e.preventDefault(); setContextMenu({ visible: true, x: e.pageX, y: e.pageY, rowId: row.id, phaRowType: si === 0 && congi === 0 && ci === 0 ? 'deviation' : si === 0 && congi === 0 ? 'cause' : si === 0 ? 'consequence' : 'safeguard' }); }}>

                            {/* SR — spans deviation */}
                            {isDevFirst && (
                              <td rowSpan={devSpan} className="border border-slate-200 text-center align-top p-0" style={{ width:W.sr, background:devHdrBg, borderLeft:'3px solid #1d4ed8' }}>
                                <div className="py-2 px-0.5 flex flex-col items-center gap-1">
                                  <span className="font-black text-sm text-blue-800">{di+1}</span>
                                  <button className="no-print text-[7px] font-black uppercase text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded px-1 py-0.5 transition-all leading-tight"
                                    onClick={() => addCause(dg.rows[0], lastDevRow)}>+Cause</button>
                                </div>
                              </td>
                            )}

                            {/* GUIDE WORD — spans deviation */}
                            {isDevFirst && (
                              <td rowSpan={devSpan} className="border border-slate-200 align-top p-0" style={{ width:W.gword, background:devBg }}>
                                {(()=>{
                                  const registryValues = Array.from(new Set((studyData.deviations||[]).map(d=>d.guideword).filter(Boolean)));
                                  return (
                                    <div className="p-1 h-full flex flex-col">
                                      <select className="w-full bg-transparent text-[11px] font-bold text-blue-700 outline-none cursor-pointer px-1 py-1"
                                        value={row.gword||''} onChange={e => patchDevGroup(dg.devGrp, { gword: e.target.value })}>
                                        <option value="">—</option>
                                        {registryValues.map(v=><option key={v} value={v}>{v}</option>)}
                                        {!registryValues.includes(row.gword) && row.gword && <option value={row.gword}>{row.gword}</option>}
                                      </select>
                                      {!registryValues.length && (
                                        <input className="w-full bg-transparent text-[11px] font-bold text-blue-700 outline-none px-1 py-1 focus:bg-blue-50/50" value={row.gword||''} placeholder="e.g. MORE"
                                          onChange={e => patchDevGroup(dg.devGrp, { gword: e.target.value })} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addCause(dg.rows[0],lastDevRow);}}}/>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                            )}

                            {/* PARAMETER — spans deviation */}
                            {isDevFirst && (
                              <td rowSpan={devSpan} className="border border-slate-200 align-top p-0" style={{ width:W.param, background:devBg }}>
                                {(()=>{
                                  const regVals = Array.from(new Set((studyData.deviations||[]).map(d=>d.parameter).filter(Boolean)));
                                  return (
                                    <div className="p-1 h-full flex flex-col">
                                      <select className="w-full bg-transparent text-[11px] font-bold text-green-700 outline-none cursor-pointer px-1 py-1"
                                        value={row.param||''} onChange={e => patchDevGroup(dg.devGrp, { param: e.target.value })}>
                                        <option value="">—</option>
                                        {regVals.map(v=><option key={v} value={v}>{v}</option>)}
                                        {!regVals.includes(row.param) && row.param && <option value={row.param}>{row.param}</option>}
                                      </select>
                                      {!regVals.length && (
                                        <input className="w-full bg-transparent text-[11px] font-bold text-green-700 outline-none px-1 py-1 focus:bg-green-50/50" value={row.param||''} placeholder="e.g. Flow"
                                          onChange={e => patchDevGroup(dg.devGrp, { param: e.target.value })} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addCause(dg.rows[0],lastDevRow);}}}/>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                            )}

                            {/* MATERIAL — spans deviation */}
                            {/* {isDevFirst && (
                              <td rowSpan={devSpan} className="border border-slate-200 align-top p-0" style={{ width:W.mat, background:devBg }}>
                                <div className="p-1">
                                  <AutoTA value={row.mat} placeholder="Material…"
                                    onChange={v => patchDevGroup(dg.devGrp, { mat: v })}
                                    onEnter={() => addCause(dg.rows[0], lastDevRow)}
                                    className="text-[11px] font-semibold text-orange-700 focus:bg-orange-50/50" minH={28}/>
                                </div>
                              </td>
                            )} */}
                            {isDevFirst && (
  <td rowSpan={devSpan} className="border border-slate-200 align-top p-0" style={{ width:W.mat, background:devBg }}>
    {(()=>{
      const regVals = Array.from(new Set((studyData.deviations||[]).map(d=>d.material).filter(Boolean)));
      return (
        <div className="p-1 h-full flex flex-col">
          <select className="w-full bg-transparent text-[11px] font-bold text-orange-700 outline-none cursor-pointer px-1 py-1"
            value={row.mat||''} onChange={e => patchDevGroup(dg.devGrp, { mat: e.target.value })}>
            <option value="">—</option>
            {regVals.map(v=><option key={v} value={v}>{v}</option>)}
            {!regVals.includes(row.mat) && row.mat && <option value={row.mat}>{row.mat}</option>}
          </select>
          {!regVals.length && (
            <input className="w-full bg-transparent text-[11px] font-bold text-orange-700 outline-none px-1 py-1 focus:bg-orange-50/50"
              value={row.mat||''} placeholder="e.g. Crude Oil"
              onChange={e => patchDevGroup(dg.devGrp, { mat: e.target.value })}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addCause(dg.rows[0],lastDevRow);}}}/>
          )}
        </div>
      );
    })()}
  </td>
)}

                            {/* FROM — spans deviation */}
                            {/* {isDevFirst && (
                              <td rowSpan={devSpan} className="border border-slate-200 align-top p-0" style={{ width:W.locFrom, background:devBg }}>
                                <div className="p-1">
                                  <AutoTA value={row.from} placeholder="From…"
                                    onChange={v => patchDevGroup(dg.devGrp, { from: v })}
                                    onEnter={() => addCause(dg.rows[0], lastDevRow)}
                                    className="text-[11px] font-semibold text-red-600 focus:bg-red-50/50" minH={28}/>
                                </div>
                              </td>
                            )} */}
                            {isDevFirst && (
  <td rowSpan={devSpan} className="border border-slate-200 align-top p-0" style={{ width:W.locFrom, background:devBg }}>
    {(()=>{
      const regVals = Array.from(new Set((studyData.deviations||[]).map(d=>d.locationFrom).filter(Boolean)));
      return (
        <div className="p-1 h-full flex flex-col">
          <select className="w-full bg-transparent text-[11px] font-bold text-red-600 outline-none cursor-pointer px-1 py-1"
            value={row.from||''} onChange={e => patchDevGroup(dg.devGrp, { from: e.target.value })}>
            <option value="">—</option>
            {regVals.map(v=><option key={v} value={v}>{v}</option>)}
            {!regVals.includes(row.from) && row.from && <option value={row.from}>{row.from}</option>}
          </select>
          {!regVals.length && (
            <input className="w-full bg-transparent text-[11px] font-bold text-red-600 outline-none px-1 py-1 focus:bg-red-50/50"
              value={row.from||''} placeholder="e.g. Feed Tank"
              onChange={e => patchDevGroup(dg.devGrp, { from: e.target.value })}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addCause(dg.rows[0],lastDevRow);}}}/>
          )}
        </div>
      );
    })()}
  </td>
)}

                            {/* TO — spans deviation */}
                            {/* {isDevFirst && (
                              <td rowSpan={devSpan} className="border border-slate-200 align-top p-0" style={{ width:W.locTo, background:devBg }}>
                                <div className="p-1">
                                  <AutoTA value={row.to} placeholder="To…"
                                    onChange={v => patchDevGroup(dg.devGrp, { to: v })}
                                    onEnter={() => addCause(dg.rows[0], lastDevRow)}
                                    className="text-[11px] font-semibold text-purple-700 focus:bg-purple-50/50" minH={28}/>
                                </div>
                              </td>
                            )} */}
                            {isDevFirst && (
  <td rowSpan={devSpan} className="border border-slate-200 align-top p-0" style={{ width:W.locTo, background:devBg }}>
    {(()=>{
      const regVals = Array.from(new Set((studyData.deviations||[]).map(d=>d.locationTo).filter(Boolean)));
      return (
        <div className="p-1 h-full flex flex-col">
          <select className="w-full bg-transparent text-[11px] font-bold text-purple-700 outline-none cursor-pointer px-1 py-1"
            value={row.to||''} onChange={e => patchDevGroup(dg.devGrp, { to: e.target.value })}>
            <option value="">—</option>
            {regVals.map(v=><option key={v} value={v}>{v}</option>)}
            {!regVals.includes(row.to) && row.to && <option value={row.to}>{row.to}</option>}
          </select>
          {!regVals.length && (
            <input className="w-full bg-transparent text-[11px] font-bold text-purple-700 outline-none px-1 py-1 focus:bg-purple-50/50"
              value={row.to||''} placeholder="e.g. Reactor"
              onChange={e => patchDevGroup(dg.devGrp, { to: e.target.value })}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addCause(dg.rows[0],lastDevRow);}}}/>
          )}
        </div>
      );
    })()}
  </td>
)}

                            {/* DEVIATION (auto) — spans deviation */}
                            {isDevFirst && (
                              <td rowSpan={devSpan} className="border border-slate-200 align-top p-0" style={{ width:W.dev, background:devBg }}>
                                <div className="p-1 flex flex-col h-full">
                                  <div className="flex items-start gap-0.5">
                                    <LBadge label={n.devLabel} bg="#1d4ed8"/>
                                    <AutoTA value={row.dev||deviationAutoStr} placeholder="Deviation (auto-fills)…"
                                      onChange={v => patchDevGroup(dg.devGrp, { dev: v })}
                                      onEnter={() => addCause(dg.rows[0], lastDevRow)}
                                      className="text-[11px] font-semibold text-slate-800 focus:bg-blue-50/50" minH={28}/>
                                  </div>
                                  <button className="no-print mt-auto text-[7px] font-black uppercase text-blue-400/60 hover:text-blue-600 hover:bg-blue-50 rounded px-1 py-0.5 transition-all"
                                    onClick={() => addCause(dg.rows[0], lastDevRow)}>↵ Add Cause</button>
                                </div>
                              </td>
                            )}

                            {/* CAUSE — spans causeGroup */}
                            {isCauseFirst && (
                              <td rowSpan={causeSpan} className="border border-slate-200 align-top p-0" style={{ width:W.cause, background:causeBg }}>
                                <div className="p-1 flex flex-col h-full">
                                  <div className="flex items-start gap-0.5 flex-1">
                                    <LBadge label={n.causeLabel} bg="#b45309"/>
                                    <AutoTA value={row.cause} placeholder="Enter cause… (↵ = new cause)"
                                      onChange={v => patchCauseGroup(cg.causeGrp, { cause: v })}
                                      onEnter={() => addCause(cg.rows[0], lastDevRow)}
                                      className="text-[11px] font-semibold text-amber-800 focus:bg-amber-50/60" minH={28}/>
                                  </div>
                                  <button className="no-print mt-1 text-[7px] font-black uppercase text-amber-400/60 hover:text-amber-700 hover:bg-amber-50 rounded px-1 py-0.5 transition-all text-center"
                                    onClick={() => addConsequence(cg.rows[0], lastCauseRow)}>↵ Add Consequence</button>
                                </div>
                              </td>
                            )}

                            {/* IMMEDIATE CONSEQUENCE — spans consGroup */}
                            {isConsFirst && (
                              <td rowSpan={consSpan} className="border border-slate-200 align-top p-0" style={{ width:W.cImm, background:consBg }}>
                                <div className="p-1 flex flex-col h-full">
                                  <div className="flex items-start gap-0.5 flex-1">
                                    <LBadge label={n.consLabel} bg="#0d9488"/>
                                    <AutoTA value={row.consImm} placeholder="Immediate consequence… (↵ = new)"
                                      onChange={v => patchConsGroup(cong.consGrp, { consImm: v })}
                                      onEnter={() => addConsequence(cong.rows[0], lastCauseRow)}
                                      className="text-[11px] font-semibold text-teal-800 focus:bg-teal-50/60" minH={28}/>
                                  </div>
                                </div>
                              </td>
                            )}

                            {/* ULTIMATE CONSEQUENCE — spans consGroup */}
                            {isConsFirst && (
                              <td rowSpan={consSpan} className="border border-slate-200 align-top p-0" style={{ width:W.cUlt, background:consBg }}>
                                <div className="p-1 flex flex-col h-full">
                                  <div className="flex items-start gap-0.5 flex-1">
                                    <AutoTA value={row.consUlt} placeholder="Ultimate consequence…"
                                      onChange={v => patchConsGroup(cong.consGrp, { consUlt: v })}
                                      onEnter={() => addConsequence(cong.rows[0], lastCauseRow)}
                                      className="text-[11px] font-semibold text-teal-800 focus:bg-teal-50/60" minH={28}/>
                                  </div>
                                  <button className="no-print mt-1 text-[7px] font-black uppercase text-teal-400/60 hover:text-teal-700 hover:bg-teal-50 rounded px-1 py-0.5 transition-all text-center"
                                    onClick={() => addSafeguard(cong.rows[0], lastConsRow)}>↵ Add Safeguard</button>
                                </div>
                              </td>
                            )}

                            {/* INHERENT RISK S, L, IR */}
                            <td className="border border-slate-200 p-0 align-middle" style={{ width:W.rawS, background:'#fffbeb' }}>
                              <div className="flex items-center justify-center h-full py-1"><RiskSel value={row.rawS} onChange={v=>patchRow(row.id,{rawS:v})}/></div>
                            </td>
                            <td className="border border-slate-200 p-0 align-middle" style={{ width:W.rawL, background:'#fffbeb' }}>
                              <div className="flex items-center justify-center h-full py-1"><RiskSel value={row.rawL} onChange={v=>patchRow(row.id,{rawL:v})}/></div>
                            </td>
                            <td className="border border-slate-200 p-0 align-middle" style={{ width:W.rawR }}>
                              <RiskBadge s={row.rawS} l={row.rawL} rankings={studyData.rankings}/>
                            </td>

                            {/* SAFEGUARD */}
                            <td className="border border-slate-200 align-top p-0" style={{ width:W.safe, background:safeBg }}>
                              <div className="p-1 flex flex-col">
                                <div className="flex items-start gap-0.5">
                                  <LBadge label={n.safeLabel} bg="#15803d"/>
                                  <AutoTA value={row.safeguard} placeholder="Safeguard / IPL…"
                                    onChange={v => patchRow(row.id, { safeguard: v })}
                                    onEnter={() => addSafeguard(row, lastConsRow)}
                                    className="text-[11px] font-semibold text-green-800 focus:bg-green-50/60" minH={28}/>
                                </div>
                                {(studyData.safeguards||[]).length>0 && si===0 && isConsFirst && (
                                  <div className="no-print flex flex-wrap gap-0.5 mt-0.5 pt-0.5 border-t border-slate-100">
                                    {(studyData.safeguards||[]).slice(0,4).map((sg,sgi)=>{
                                      const t=String(sg.safeguard||sg.description||''); if(!t) return null;
                                      return <button key={sgi} className="text-[7px] px-1 py-0.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:border-green-400 hover:text-green-600 transition-all" onClick={()=>patchRow(row.id,{safeguard:(row.safeguard?row.safeguard+'\n':'')+t})}>{t.slice(0,16)}{t.length>16?'…':''}</button>;
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* MITIGATED RISK S */}
                            <td className="border border-slate-200 p-0 align-middle" style={{ width:W.mitS, background:'#fff7ed' }}>
                              <div className="flex items-center justify-center h-full py-1"><RiskSel value={row.mitS} onChange={v=>patchRow(row.id,{mitS:v})}/></div>
                            </td>
                            <td className="border border-slate-200 p-0 align-middle" style={{ width:W.mitL, background:'#fff7ed' }}>
                              <div className="flex items-center justify-center h-full py-1"><RiskSel value={row.mitL} onChange={v=>patchRow(row.id,{mitL:v})}/></div>
                            </td>
                            <td className="border border-slate-200 p-0 align-middle" style={{ width:W.mitR }}>
                              <RiskBadge s={row.mitS} l={row.mitL} rankings={studyData.rankings}/>
                            </td>

                            {/* RESIDUAL RISK S */}
                            <td className="border border-slate-200 p-0 align-middle" style={{ width:W.resS, background:'#fff1f2' }}>
                              <div className="flex items-center justify-center h-full py-1"><RiskSel value={row.resS} onChange={v=>patchRow(row.id,{resS:v})}/></div>
                            </td>
                            <td className="border border-slate-200 p-0 align-middle" style={{ width:W.resL, background:'#fff1f2' }}>
                              <div className="flex items-center justify-center h-full py-1"><RiskSel value={row.resL} onChange={v=>patchRow(row.id,{resL:v})}/></div>
                            </td>
                            <td className="border border-slate-200 p-0 align-middle" style={{ width:W.resR }}>
                              <RiskBadge s={row.resS} l={row.resL} rankings={studyData.rankings}/>
                            </td>

                            {/* RECOMMENDATIONS */}
                            <td className="border border-slate-200 align-top p-0" style={{ width:W.recs, background:'#faf5ff' }}>
                              <AutoTA value={row.recs} placeholder="Recommendations… (↵ = new safeguard)"
                                onChange={v=>patchRow(row.id,{recs:v})}
                                onEnter={()=>addSafeguard(row,lastConsRow)}
                                className="text-[11px] text-slate-600 focus:bg-purple-50/50" minH={28}/>
                            </td>

                            {/* REMARKS */}
                            <td className="border border-slate-200 align-top p-0" style={{ width:W.rem }}>
                              <AutoTA value={row.remarks} placeholder="Remarks…"
                                onChange={v=>patchRow(row.id,{remarks:v})}
                                onEnter={()=>addSafeguard(row,lastConsRow)}
                                className="text-[11px] text-slate-600 focus:bg-slate-50" minH={28}/>
                            </td>

                            {/* STATUS */}
                            <td className="border border-slate-200 align-middle p-0" style={{ width:W.stat }}>
                              <select className="w-full bg-transparent text-[10px] font-bold outline-none cursor-pointer px-1 py-1"
                                value={row.status||'Proposed'} onChange={e=>patchRow(row.id,{status:e.target.value})}>
                                {['Proposed','Pending','Implemented','Closed','N/A'].map(o=><option key={o}>{o}</option>)}
                              </select>
                            </td>

                            {/* DELETE */}
                            <td className="border border-slate-200 text-center align-middle p-0 no-print" style={{ width:W.act }}>
                              <button onClick={()=>setConfirm({open:true,rowId:row.id})} className="p-1 text-red-200 hover:text-red-500 opacity-0 group-hover/leaf:opacity-100 transition-all"><Trash2 size={11}/></button>
                            </td>
                          </tr>
                        );
                      });
                    });
                  });
                });
              };

              return (
              <div className="flex flex-col h-full min-h-0">
                {/* Toolbar */}
                <div className="bg-[#f0f0f0] px-4 py-1.5 flex items-center border-b border-slate-300 shrink-0 shadow-sm z-10 no-print">
                  <div className="flex items-center gap-1 flex-wrap">
                    <ToolbarButton icon={<><PlusCircle size={16} className="text-[#004a7c]"/><span className="text-[10px] ml-1 font-black">Add Deviation</span></>}
                      onClick={() => addDeviation(lastOf(nodeRows)?.id||null)} title="Add new deviation row"/>
                    <div className="h-5 w-px bg-slate-300 mx-1"/>
                    <ToolbarButton icon={<Printer size={17}/>} onClick={()=>handlePrintAction()} title="Print"/>
                    <ToolbarButton icon={<Download size={17} className="text-emerald-600"/>} onClick={()=>handleDownloadPDF()} title="PDF"/>
                    <ToolbarButton icon={<Download size={17} className="text-blue-600"/>} onClick={exportHierarchicalCSV} title="Export CSV"/>
                    <div className="h-5 w-px bg-slate-300 mx-1"/>
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Node:</span>
                      <select className="bg-transparent text-[10px] font-black text-[#004a7c] outline-none cursor-pointer"
                        value={selectedNodeId||''} onChange={e=>setSelectedNodeId(e.target.value)}>
                        {(studyData.nodes||[]).map(n=><option key={n.id} value={n.id}>{n.description||'Untitled'}</option>)}
                        {!studyData.nodes?.length&&<option value="">No nodes</option>}
                      </select>
                    </div>
                    <div className="h-5 w-px bg-slate-300 mx-1"/>
                    <span className="text-[9px] font-black text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded">{nodeRows.length} rows</span>
                  </div>
                  <div className="ml-auto no-print">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                      <Info size={10}/>
                      <span>↵ Enter = add nested row &nbsp;|&nbsp; Shift+↵ = new line in cell &nbsp;|&nbsp; Labels: Deviation.Cause.Consequence.Safeguard</span>
                    </div>
                  </div>
                </div>

                {/* Scrollable area */}
                <div className="flex-1 overflow-auto pha-scroll-container">

                  {/* Study header */}
                  <div className="bg-white border-b border-slate-200 p-3 pha-header-block">
                    <table className="w-full border-collapse border border-slate-300 text-[10px] bg-white pha-header-table" style={{tableLayout:'fixed'}}>
                      <colgroup><col style={{width:'130px'}}/><col/><col style={{width:'200px'}}/></colgroup>
                      <tbody>
                        <tr className="h-10">
                          <td className="border border-slate-300 p-2"><div className="w-16 h-7 bg-slate-100 rounded flex items-center justify-center text-[6px] font-black text-slate-300 uppercase">LOGO</div></td>
                          <td className="border border-slate-300 p-2 text-center font-black text-base uppercase tracking-tight" style={{color:'#004a7c'}}>HAZOP WORK SHEET</td>
                          <td className="border border-slate-300 p-1.5 bg-slate-50">
                            <div className="grid grid-cols-2 gap-y-0.5 text-[8px] font-bold text-slate-500">
                              <span className="uppercase">Doc No:</span><span className="text-right font-black">C/HSE/FR/006</span>
                              <span className="uppercase">Date:</span><span className="text-right font-black">{new Date().toLocaleDateString()}</span>
                              <span className="uppercase">Rev:</span><span className="text-right font-black">01</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 bg-slate-50 text-[8px] font-black uppercase text-slate-400">Site / Location</td>
                          <td className="border border-slate-300 p-0"><input className="w-full p-1.5 text-[10px] font-bold focus:bg-blue-50 outline-none uppercase" value={studyData.metadata?.facility||''} onChange={e=>handleStudyUpdate('facility',e.target.value)}/></td>
                          <td className="border border-slate-300 p-1.5 bg-slate-50 flex items-center justify-between text-[8px] font-black uppercase text-slate-400">
                            <span>Plant/Unit:</span>
                            <input className="text-[9px] font-bold bg-transparent outline-none text-right w-24 text-slate-700" value={studyData.metadata?.unit||''} onChange={e=>handleStudyUpdate('unit',e.target.value)}/>
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 bg-slate-50 text-[8px] font-black uppercase text-slate-400">Node</td>
                          <td className="border border-slate-300 p-0">
                            <input className="w-full p-1.5 text-[10px] font-black focus:bg-blue-50 outline-none uppercase" style={{color:'#004a7c'}} value={activeNode.description||''} onChange={e=>handleNodeHeaderUpdate('description',e.target.value)}/>
                          </td>
                          <td className="border border-slate-300 p-1.5 bg-slate-50 text-[8px] font-black uppercase text-slate-400">Page: 1 of 1</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 bg-slate-50 text-[8px] font-black uppercase text-slate-400">Intention</td>
                          <td className="border border-slate-300 p-0" colSpan={2}>
                            <input className="w-full p-1.5 text-[10px] font-bold italic focus:bg-blue-50 outline-none" value={activeNode.intention||''} onChange={e=>handleNodeHeaderUpdate('intention',e.target.value)} placeholder="Design intention…"/>
                          </td>
                        </tr>
                        {(()=>{
                          const eq=activeNode.equipment||[];
                          const slots=Math.max(4,Math.min(eq.length||0,6));
                          return (
                            <tr>
                              <td colSpan={3} className="p-0 border border-slate-300">
                                <div className="grid divide-x divide-slate-200" style={{gridTemplateColumns:`repeat(${slots},1fr)`}}>
                                  {Array.from({length:slots}).map((_,i)=>{
                                    const e=eq[i];
                                    return (
                                      <div key={i} className={`p-1.5 ${e?'bg-white':'bg-slate-50/40'}`}>
                                        <div className={`text-[7px] font-black uppercase border-b pb-0.5 mb-1 ${e?'text-teal-600 border-teal-100':'text-slate-200 border-slate-100'}`}>
                                          {e?<><span className="bg-[#004a7c] text-white px-1 rounded mr-1">{e.tag||'—'}</span>{e.description||''}</>:`Slot ${i+1}`}
                                        </div>
                                        {e?(
                                          <div className="grid grid-cols-2 gap-x-1 text-[7px] text-slate-400">
                                            {[['Cap',e.capacity],['MOC',e.moc],['Temp',e.temp],['Pres',e.pres]].filter(([,v])=>v).map(([k,v])=>(
                                              <React.Fragment key={k}><span className="font-black">{k}:</span><span className="truncate">{v}</span></React.Fragment>
                                            ))}
                                          </div>
                                        ):<div className="text-[6px] text-slate-200 italic uppercase tracking-widest">Space Provision</div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* PHA Table */}
                  <div style={{minWidth:TOTAL_W+'px', overflowX:'auto'}}>
                    <table className="border-collapse pha-print-table" style={{width:TOTAL_W+'px', tableLayout:'fixed'}}>
                      <colgroup>
                        <col style={{width:W.sr}}/><col style={{width:W.gword}}/><col style={{width:W.param}}/>
                        <col style={{width:W.mat}}/><col style={{width:W.locFrom}}/><col style={{width:W.locTo}}/>
                        <col style={{width:W.dev}}/><col style={{width:W.cause}}/>
                        <col style={{width:W.cImm}}/><col style={{width:W.cUlt}}/>
                        <col style={{width:W.rawS}}/><col style={{width:W.rawL}}/><col style={{width:W.rawR}}/>
                        <col style={{width:W.safe}}/>
                        <col style={{width:W.mitS}}/><col style={{width:W.mitL}}/><col style={{width:W.mitR}}/>
                        <col style={{width:W.resS}}/><col style={{width:W.resL}}/><col style={{width:W.resR}}/>
                        <col style={{width:W.recs}}/><col style={{width:W.rem}}/><col style={{width:W.stat}}/>
                        <col style={{width:W.act}} className="no-print"/>
                      </colgroup>
                      <thead className="sticky top-0 z-30">
                        <tr style={{background:'#003566'}} className="text-white text-[8px] font-black uppercase tracking-wide">
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" rowSpan={2}>Sr.</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" style={{color:'#7dd3fc'}}>Guide Word</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" style={{color:'#7dd3fc'}}>Parameter</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" style={{color:'#7dd3fc'}}>Material</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" style={{color:'#7dd3fc'}}>From</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" style={{color:'#7dd3fc'}}>To</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" rowSpan={2}>Deviation</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" rowSpan={2}>Cause</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" colSpan={2} style={{color:'#6ee7b7'}}>Consequences</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" colSpan={3} style={{background:'#78350f',color:'#fde68a'}}>Inherent Risk</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" rowSpan={2}>Present / Planned Protection<br/><span className="font-normal normal-case text-[6px] opacity-70">(Safeguards / IPLs)</span></th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" colSpan={3} style={{background:'#9a3412',color:'#fed7aa'}}>Mitigated Risk</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" colSpan={3} style={{background:'#991b1b',color:'#fecaca'}}>Residual Risk</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" rowSpan={2}>Additional Protection<br/><span className="font-normal normal-case text-[6px] opacity-70">(Recommendations)</span></th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" rowSpan={2}>Remarks</th>
                          <th className="border border-[#1e4f80] px-1 py-2 text-center" rowSpan={2}>Status</th>
                          <th className="border border-[#1e4f80] no-print" rowSpan={2}/>
                        </tr>
                        <tr style={{background:'#012a4a'}} className="text-white text-[7px] font-black">
                          <th className="border border-[#1e4f80] px-1 py-1" style={{color:'#7dd3fc'}}>GW</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{color:'#7dd3fc'}}>Param</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{color:'#7dd3fc'}}>Material</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{color:'#7dd3fc'}}>From</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{color:'#7dd3fc'}}>To</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{color:'#6ee7b7'}}>Immediate</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{color:'#6ee7b7'}}>Ultimate</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{background:'#78350f',color:'#fde68a'}}>S</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{background:'#78350f',color:'#fde68a'}}>L</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{background:'#78350f',color:'#fde68a'}}>IR</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{background:'#9a3412',color:'#fed7aa'}}>S</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{background:'#9a3412',color:'#fed7aa'}}>L</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{background:'#9a3412',color:'#fed7aa'}}>MR</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{background:'#991b1b',color:'#fecaca'}}>S</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{background:'#991b1b',color:'#fecaca'}}>L</th>
                          <th className="border border-[#1e4f80] px-1 py-1" style={{background:'#991b1b',color:'#fecaca'}}>RR</th>
                        </tr>
                      </thead>
                      <tbody>{renderTableRows()}</tbody>
                    </table>

                    {/* Add deviation footer */}
                    <button onClick={() => addDeviation(lastOf(nodeRows)?.id||null)}
                      className="no-print w-full py-10 bg-white hover:bg-blue-50 flex items-center justify-center gap-3 text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] border-t border-slate-200 hover:text-[#004a7c] transition-all group">
                      <PlusCircle size={16} className="group-hover:scale-125 transition-transform"/>
                      Add Deviation / New Analysis Scenario for {activeNode.description||'Current Node'}
                    </button>
                  </div>
                </div>
              </div>
              );
            })()}


          </div>
        </main>
      </div>

      {/* PHA Row Context Menu */}
      {contextMenu.visible && activeTopTab === 'pha' && (
        <div className="fixed z-[700] bg-white border border-slate-200 shadow-2xl rounded-2xl py-2 w-64" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <ContextItem icon={<ChevronUp size={14} />}   label="Insert Scenario Above"  onClick={() => addPhaRowAt(contextMenu.index)} />
          <ContextItem icon={<ChevronDown size={14} />} label="Insert Scenario Below"  onClick={() => addPhaRowAt(contextMenu.index + 1)} />
          <ContextItem icon={<CopyPlus size={14} />}    label="Duplicate Scenario"     onClick={() => duplicatePhaRow(contextMenu.rowId)} />
          <div className="h-px bg-slate-100 my-1 mx-2" />
          {/* Add cause row for same deviation */}
          <ContextItem icon={<PlusCircle size={14} className="text-amber-500" />} label="Add Cause Row (Same Deviation)"
            onClick={() => {
              const baseRow = studyData.rows.find(r => r.id === contextMenu.rowId);
              if (!baseRow) return;
              const newRow = { ...baseRow, id: Date.now().toString(), causes: '1. ', consImm: '1. ', consUlt: '1. ', safeguards: '1. ', rawS: 0, rawL: 0, mitS: 0, mitL: 0, recs: '1. ', resS: 0, resL: 0, remarks: '', status: 'Proposed' };
              const current = [...(studyData.rows || [])];
              const idx2 = current.findIndex(r => r.id === contextMenu.rowId);
              current.splice(idx2 + 1, 0, newRow);
              updateServer({ rows: current });
              setContextMenu(prev => ({ ...prev, visible: false }));
            }} />
          {/* Merge selected rows */}
          {selectedPhaRows.size >= 2 && (
            <ContextItem icon={<Layers size={14} className="text-blue-500" />} label={`Merge ${selectedPhaRows.size} Selected Rows`}
              onClick={() => {
                const ids = Array.from(selectedPhaRows);
                const rowsToMerge = ids.map(id => studyData.rows.find(r => r.id === id)).filter(Boolean);
                if (rowsToMerge.length < 2) return;
                // Merge: keep first row's deviation fields, concatenate cause/consequence/safeguard/recs
                const merged = { ...rowsToMerge[0] };
                const concatField = (field, sep='\n') => rowsToMerge.map(r => String(r[field]||'')).filter(Boolean).join(sep);
                merged.causes = concatField('causes');
                merged.consImm = concatField('consImm');
                merged.consUlt = concatField('consUlt');
                merged.safeguards = concatField('safeguards');
                merged.recs = concatField('recs');
                merged.remarks = concatField('remarks', ' | ');
                // Remove all merged rows, insert merged row in place of first
                const remaining = studyData.rows.filter(r => !selectedPhaRows.has(r.id) || r.id === rowsToMerge[0].id);
                const final = remaining.map(r => r.id === rowsToMerge[0].id ? merged : r);
                updateServer({ rows: final });
                setSelectedPhaRows(new Set());
                setContextMenu(prev => ({ ...prev, visible: false }));
              }} />
          )}
          {selectedPhaRows.size > 0 && (
            <ContextItem icon={<X size={14} className="text-slate-400" />} label="Clear Selection"
              onClick={() => { setSelectedPhaRows(new Set()); setContextMenu(prev => ({ ...prev, visible: false })); }} />
          )}
          <div className="h-px bg-slate-100 my-1 mx-2" />
          <ContextItem icon={<Trash2 size={14} className="text-red-400" />} label="Delete Selected Scenario" onClick={() => setConfirm({ open: true, rowId: contextMenu.rowId })} danger />
          <div className="px-4 py-1.5 text-[9px] text-slate-400 font-bold">Ctrl+Click rows to multi-select</div>
        </div>
      )}

      {/* PHA Row Delete Confirm */}
      <ConfirmDialog
        isOpen={confirm.open} title="Delete Row?" message="Remove this analysis row from the current node?"
        onConfirm={() => { updateServer({ rows: studyData.rows.filter(r => r.id !== confirm.rowId) }); setConfirm({ open: false, rowId: null }); }}
        onCancel={() => setConfirm({ open: false, rowId: null })}
      />

      {/* ✅ EQUIPMENT MODAL (from node-eq.js) */}
      {equipmentModal.open && (() => {
        const equipNode = (studyData.nodes || []).find(n => n.id === equipmentModal.nodeId);
        const eqCols = studyData.equipmentColumns || DEFAULT_EQUIPMENT_COLS;
        return (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-8">
            <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-300">
              <div className="bg-[#004a7c] px-10 py-6 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-4 text-white">
                  <Boxes size={24} className="text-teal-400"/>
                  <div>
                    <h3 className="font-black uppercase text-sm tracking-widest">Node Equipment Manager</h3>
                    <p className="text-[10px] font-bold text-teal-200">
                      Node: <span className="text-white">{String(equipNode?.description || equipmentModal.nodeId)}</span>
                      {' · '}
                      <span className="text-teal-300">{(equipNode?.equipment || []).length} Equipment Item(s) Registered</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowColManager(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/20">
                    <Columns size={12}/> Configure Columns
                  </button>
                  <button onClick={() => setEquipmentModal({ open: false, nodeId: null })} className="p-3 hover:bg-white/10 rounded-full text-white transition-all"><X size={24}/></button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <IndustrialRegistryView
                  title={`Equipment Registry — ${String(equipNode?.description || 'Node')}`}
                  items={equipNode?.equipment || []}
                  columns={eqCols}
                  moduleKey="equipment"
                  updateServer={(data) => {
                    if (data.equipment !== undefined) {
                      const updatedNodes = (studyData.nodes || []).map(n =>
                        n.id === equipmentModal.nodeId ? { ...n, equipment: data.equipment } : n
                      );
                      updateServer({ nodes: updatedNodes });
                    }
                  }}
                  setShowColManager={setShowColManager}
                  onExportCSV={() => {
                    const equipment = equipNode?.equipment || [];
                    const headers = eqCols.map(c => c.label).join(',');
                    const rows = equipment.map(eq => eqCols.map(c => `"${String(eq[c.id] || '').replace(/"/g, '""')}"`).join(',')).join('\n');
                    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `${equipNode?.description || 'node'}_equipment_export.csv`;
                    a.click();
                  }}
                />
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                  Equipment details sync automatically to PHA Worksheet header
                </div>
                <button onClick={() => setEquipmentModal({ open: false, nodeId: null })} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:brightness-110 transition-all">Close & Sync Worksheet</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Column Manager Modal */}
      <ColManagerModal
        show={showColManager}
        onClose={() => setShowColManager(false)}
        studyData={studyData}
        updateServer={updateServer}
        activeTopTab={activeTopTab}
        activeSideTab={activeSideTab}
        equipmentModalOpen={equipmentModal.open}
        visibleCols={visibleCols}
        setVisibleCols={setVisibleCols}
      />
    </div>
  );
};

export default App;