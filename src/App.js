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
  Boxes, Calendar
} from 'lucide-react';

// ─────────────────────────────────────────────
// PRINT / PDF STYLES
// ─────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  @page {
    size: A3 landscape;
    margin: 10mm 8mm;
  }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  header, nav, aside { display: none !important; }
  main { overflow: visible !important; }
  .custom-scroll { overflow: visible !important; }
  .flex-1 { overflow: visible !important; }
  .min-w-max { min-width: 100% !important; }
  table { width: 100% !important; table-layout: fixed !important; font-size: 7px !important; }
  th, td { padding: 2px 3px !important; font-size: 7px !important; }
  .divide-y > div { break-inside: avoid; page-break-inside: avoid; }
  .overflow-hidden { overflow: visible !important; }
  .overflow-auto { overflow: visible !important; }
  .pha-header-block { display: block !important; }
  .sticky { position: relative !important; }
  [style*="background-color"] { -webkit-print-color-adjust: exact; }
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
  { id: 'designConditions',label: 'DESIGN CONDITIONS', width: 150 },
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
  { id: 'recs',       label: 'Recommendations',  Icon: ClipboardCheck },
  { id: 'checklists', label: 'Check Lists',      Icon: ListChecks     },
  { id: 'risk',       label: 'Risk Criteria',    Icon: Activity       },
];

const SIDE_NAV = {
  data:       [{ id: 'overview',  label: 'Overview',            Icon: FileSearch   }, { id: 'team',      label: 'Team Members',         Icon: Users        }, { id: 'documents', label: 'Documents', Icon: Archive }],
  nodes:      [{ id: 'list',      label: 'Node Registry',       Icon: Map          }, { id: 'pids',      label: 'P&ID Reference',        Icon: Archive      }],
  deviations: [{ id: 'list',      label: 'Deviations Registry', Icon: Layers       }],
  causes:     [{ id: 'list',      label: 'Causes Registry',     Icon: Target       }],
  recs:       [{ id: 'list',      label: 'Action Items',        Icon: ClipboardCheck }],
  checklists: [{ id: 'list',      label: 'Checklist Registry',  Icon: ListChecks   }],
  pha:        [{ id: 'sheet',     label: 'Analysis Sheet',      Icon: ClipboardList }, { id: 'summary',   label: 'Risk Summary',          Icon: Activity     }],
  risk:       [
    { id: 'matrix',       label: 'Risk Matrix',             Icon: Grid3X3      },
    { id: 'likelihoods',  label: 'Likelihood Categories',   Icon: Activity     },
    { id: 'consequences', label: 'Consequence Categories',  Icon: AlertTriangle },
    { id: 'rankings',     label: 'Risk Rankings',           Icon: Zap          },
  ],
};

// ─────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────

const RISK_CHANNELS = ['Safety', 'Environment', 'Assets', 'Community', 'Reputation'];

const DEFAULT_MATRIX_VALUES = {
  VH: { VL: 3, L: 3, M: 4, H: 4, VH: 5 },
  H:  { VL: 2, L: 3, M: 3, H: 4, VH: 4 },
  M:  { VL: 2, L: 2, M: 3, H: 3, VH: 4 },
  L:  { VL: 1, L: 2, M: 2, H: 3, VH: 3 },
  VL: { VL: 1, L: 1, M: 2, H: 2, VH: 3 },
};

const buildDefaultRiskMatrix = () => {
  const matrix = {};
  RISK_CHANNELS.forEach(ch => {
    matrix[ch] = {};
    ['VH','H','M','L','VL'].forEach(cons => {
      ['VL','L','M','H','VH'].forEach(lik => {
        matrix[ch][`${lik}_${cons}`] = DEFAULT_MATRIX_VALUES[cons][lik];
      });
    });
  });
  return matrix;
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

const GET_DYNAMIC_RISK_STYLE = (score, rankings = []) => {
  const s = parseInt(score) || 0;
  if (s === 0) return { backgroundColor: '#f1f5f9', color: '#94a3b8' };
  const match = (rankings || []).find(r => parseInt(r.code) === s);
  if (match) return { backgroundColor: match.color || '#fff', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' };
  if (s >= 16) return { backgroundColor: '#dc2626', color: '#fff' };
  if (s >= 10) return { backgroundColor: '#f97316', color: '#fff' };
  if (s >= 5)  return { backgroundColor: '#fbbf24', color: '#92400e' };
  return { backgroundColor: '#10b981', color: '#fff' };
};

const GET_RISK_COLOR = (score, rankings = []) => {
  if (!score || score === 0) return { bg: '#f1f5f9', text: '#94a3b8' };
  const match = rankings.find(r => parseInt(r.code) === parseInt(score));
  if (match) return { bg: match.color || '#fff', text: '#fff' };
  if (score >= 5)  return { bg: '#7f1d1d', text: '#fff' };
  if (score >= 4)  return { bg: '#dc2626', text: '#fff' };
  if (score >= 3)  return { bg: '#f97316', text: '#fff' };
  if (score >= 2)  return { bg: '#fbbf24', text: '#92400e' };
  return { bg: '#16a34a', text: '#fff' };
};

const RISK_STYLE = (val) => {
  if (!val || val === 0) return 'bg-slate-100 text-slate-400';
  if (val >= 5) return 'bg-red-800 text-white';
  if (val >= 4) return 'bg-red-600 text-white';
  if (val >= 3) return 'bg-orange-500 text-white';
  if (val >= 2) return 'bg-yellow-400 text-amber-900';
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

const renderWorksheetCell = (col, row, rIdx, studyData, handleCellUpdate) => {
  const base = 'w-full h-full border-transparent outline-none p-4 transition-all';
  if (col.id === 'sr') return <div className="w-full text-center font-black text-slate-300 text-xs py-4 bg-slate-100/30">{rIdx + 1}</div>;

  if (col.isAuto && col.id === 'dev') {
    const gen = `${row.gword || ''} ${row.param || ''} of ${row.mat || ''} from ${row.from || ''} to ${row.to || ''}`.trim().replace(/\s+/g, ' ');
    return <textarea className={`${base} bg-transparent text-[11px] font-bold text-slate-800 focus:bg-white resize-none h-full`} value={row[col.id] || gen} onChange={e => handleCellUpdate(row.id, col.id, e.target.value)} />;
  }

  if (col.isRegistryLink) {
    const registryMap = { gword: 'guideword', param: 'parameter', mat: 'material', from: 'locationFrom', to: 'locationTo' };
    const registryField = registryMap[col.id];
    const uniqueValues = Array.from(new Set((studyData.deviations || []).map(d => d[registryField]).filter(v => !!v)));
    return (
      <div className="w-full h-full flex items-center px-1">
        <select className="w-full h-10 bg-transparent font-bold text-xs text-[#004a7c] outline-none cursor-pointer appearance-none px-2" value={row[col.id] || ''} onChange={e => handleCellUpdate(row.id, col.id, e.target.value)}>
          <option value="">-</option>
          {uniqueValues.map((v, i) => <option key={`${v}-${i}`} value={v}>{v}</option>)}
        </select>
      </div>
    );
  }

  if (col.isBullet) return (
    <textarea className={`${base} min-h-[100px] bg-transparent text-[11px] leading-relaxed focus:bg-white resize-none font-medium text-slate-600`}
      value={String(row[col.id] || '')}
      onChange={e => handleCellUpdate(row.id, col.id, e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const val = e.target.value;
          const lines = val.split('\n').filter(l => l.trim() !== '');
          const lastLine = lines[lines.length - 1] || '0.';
          const nextNum = (parseInt((lastLine.match(/\d+/) || ['0'])[0]) || 0) + 1;
          handleCellUpdate(row.id, col.id, val + (val.endsWith('\n') ? '' : '\n') + nextNum + '. ');
        }
      }}
    />
  );

  if (col.isRisk) return (
    <div className="w-full h-full flex items-center justify-center px-1">
      <select className="w-full h-10 bg-white/50 border border-transparent rounded-lg text-center font-black text-xs cursor-pointer appearance-none"
        value={String(row[col.id] || '0')}
        onChange={e => handleCellUpdate(row.id, col.id, parseInt(e.target.value))}>
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
    return <div className="w-full h-full flex items-center justify-center font-black text-xs shadow-inner" style={style}>{score || '-'}</div>;
  }

  if (col.type === 'select') return (
    <div className="w-full h-full flex items-center px-1">
      <select className="w-full h-10 bg-transparent font-bold text-xs outline-none cursor-pointer px-2" value={row[col.id] || ''} onChange={e => handleCellUpdate(row.id, col.id, e.target.value)}>
        <option value="">-</option>
        {(col.opts || []).map((o, i) => <option key={`${o}-${i}`} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return <input className={`${base} bg-transparent text-[11px] font-bold text-slate-800 focus:bg-white`} value={String(row[col.id] || '')} onChange={e => handleCellUpdate(row.id, col.id, e.target.value)} />;
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
        rankings: 'rankingColumns', equipment: 'equipmentColumns',
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
                  className="hover:bg-blue-50 h-10 group transition-colors">
                  <td className="p-2 border border-slate-300 bg-slate-100 text-center text-xs font-bold text-slate-500">{idx + 1}</td>
                  {columns.map(col => (
                    <td key={col.id} className={`p-0 border border-slate-300 ${col.isAuto ? 'bg-orange-50/30' : ''}`}>
                      {col.type === 'color' ? (
                        <div className="flex justify-center items-center h-10">
                          <input type="color" className="w-7 h-7 rounded border-none p-0 cursor-pointer shadow-sm" value={node[col.id] || '#004a7c'} onChange={e => handleUpdate(node.id, col.id, e.target.value)} />
                        </div>
                      ) : col.type === 'file' ? (
                        <div className="flex items-center gap-1.5 px-2 h-10 min-w-0">
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
                        <select className="w-full h-10 px-2 text-xs font-bold outline-none bg-transparent focus:bg-white" value={node[col.id] || ''} onChange={e => handleUpdate(node.id, col.id, e.target.value)}>
                          <option value="">-</option>
                          {(col.opts || []).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : col.type === 'date' ? (
                        <input type="date" className="w-full h-10 px-2 text-xs font-bold outline-none bg-transparent focus:bg-white" value={node[col.id] || ''} onChange={e => handleUpdate(node.id, col.id, e.target.value)} />
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
                        <div className="w-full h-10 px-2 flex items-center justify-center">
                          <span className="bg-[#004a7c] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                            {(node.equipment || []).length}
                          </span>
                        </div>
                      ) : (
                        <input readOnly={col.isAuto}
                          className={`w-full h-10 px-2 text-xs outline-none bg-transparent focus:bg-white font-bold ${col.textColor || 'text-slate-800'} ${col.isAuto ? 'italic cursor-default' : ''}`}
                          value={String(node[col.id] || '')}
                          onChange={e => handleUpdate(node.id, col.id, e.target.value)}
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
    nodeColumns: DEFAULT_NODE_COLS,
    equipmentColumns: DEFAULT_EQUIPMENT_COLS,
    pidsColumns: DEFAULT_PID_COLS,
    deviationColumns: DEFAULT_DEVIATION_COLS,
    causeColumns: DEFAULT_CAUSE_COLS,
    recColumns: DEFAULT_REC_COLS,
    rankingColumns: DEFAULT_RANKING_COLS,
    rankings: DEFAULT_RANKINGS,
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

  const handleMatrixCellUpdate = (likCode, conCode, val) => {
    const key = `${likCode}_${conCode}`;
    const currentMatrix = studyData.riskMatrix || buildDefaultRiskMatrix();
    const channelMatrix = { ...(currentMatrix[riskMatrixChannel] || {}) };
    channelMatrix[key] = parseInt(val) || 0;
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
      nodeColumns: DEFAULT_NODE_COLS,
      equipmentColumns: DEFAULT_EQUIPMENT_COLS,
      pidsColumns: DEFAULT_PID_COLS,
      deviationColumns: DEFAULT_DEVIATION_COLS,
      causeColumns: DEFAULT_CAUSE_COLS,
      recColumns: DEFAULT_REC_COLS,
      rankingColumns: DEFAULT_RANKING_COLS,
      rankings: DEFAULT_RANKINGS,
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
              <span className="text-[11px] font-black uppercase text-[#0d1111]">Perpetual PHA</span>
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
            <span className="text-[11px] font-black uppercase text-[#0d1111]">Perpetual PHA</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">PHA Workstation</span>
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

            {/* ── RISK CRITERIA: RISK MATRIX ── */}
            {activeTopTab === 'risk' && activeSideTab === 'matrix' && (() => {
              const CONS_ROWS = ['VH','H','M','L','VL'];
              const LIK_COLS  = ['VL','L','M','H','VH'];
              const matrix = (studyData.riskMatrix || buildDefaultRiskMatrix())[riskMatrixChannel] || {};
              const rankings = studyData.rankings || DEFAULT_RANKINGS;
              return (
                <div className="flex flex-col h-full bg-slate-50">
                  <div className="bg-slate-200 px-6 py-3 border-b border-slate-400 flex items-center justify-between shadow-sm shrink-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#004a7c] rounded-full" />Risk Matrix
                    </h2>
                    <select className="bg-[#004a7c] text-white px-5 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer shadow-lg"
                      value={riskMatrixChannel} onChange={e => setRiskMatrixChannel(e.target.value)}>
                      {RISK_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                  </div>
                  <div className="bg-[#f0f0f0] px-4 py-1.5 flex items-center border-b border-slate-300 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-1">
                      <ToolbarButton icon={<Copy size={18}/>} title="Copy" />
                      <ToolbarButton icon={<Scissors size={18}/>} title="Cut" />
                      <ToolbarButton icon={<Clipboard size={18}/>} title="Paste" />
                      <div className="h-6 w-px bg-slate-300 mx-2"/>
                      <ToolbarButton icon={<Printer size={18}/>} onClick={() => handlePrintAction()} title="Print" />
                      <div className="h-6 w-px bg-slate-300 mx-2"/>
                      <ToolbarButton icon={<Download size={18} className="text-emerald-600"/>} onClick={exportFullStudyJSON} title="Export Full Study" />
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      {RISK_CHANNELS.map(ch => (
                        <button key={ch} onClick={() => setRiskMatrixChannel(ch)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${riskMatrixChannel === ch ? 'bg-[#004a7c] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#004a7c] hover:text-[#004a7c]'}`}>
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-8 bg-slate-100/40">
                    <div className="bg-white border border-slate-300 shadow-md rounded-sm overflow-hidden w-fit">
                      <table className="border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#004a7c] text-white">
                            <th className="border border-slate-300 p-3 w-28 text-center font-black text-[9px] uppercase tracking-widest" rowSpan={2}>
                              <div className="-rotate-90 whitespace-nowrap text-teal-300">Consequence</div>
                            </th>
                            <th colSpan={5} className="border border-slate-300 p-2 text-center font-black text-[9px] text-teal-300 uppercase tracking-[0.3em]">Likelihood →</th>
                            <th className="border border-slate-300 p-2 bg-slate-700 text-[8px] font-black uppercase tracking-widest text-slate-200 w-40 text-center">Risk Ranking</th>
                          </tr>
                          <tr className="bg-[#004a7c] text-white">
                            {LIK_COLS.map(l => (
                              <th key={l} className="border border-slate-300 p-3 w-24 text-center font-black text-xs">{l}</th>
                            ))}
                            <td className="border border-slate-300 bg-slate-100 p-2 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Code / Color / Label</td>
                          </tr>
                        </thead>
                        <tbody>
                          {CONS_ROWS.map((cons, rowIdx) => {
                            const ranking = rankings[rowIdx] || {};
                            const rColor = GET_RISK_COLOR(parseInt(ranking.code) || 0, rankings);
                            return (
                              <tr key={cons} className="h-20">
                                <td className="border border-slate-300 bg-[#004a7c] text-white text-center font-black text-xs p-2 w-28">{cons}</td>
                                {LIK_COLS.map(lik => {
                                  const val = matrix[`${lik}_${cons}`] || 0;
                                  const color = GET_RISK_COLOR(val, rankings);
                                  return (
                                    <td key={lik} className="border border-slate-300 p-0 relative group" style={{ backgroundColor: color.bg }}>
                                      <select
                                        className="w-full h-full min-h-[80px] bg-transparent text-center font-black text-lg cursor-pointer outline-none appearance-none px-2"
                                        style={{ color: color.text }}
                                        value={val}
                                        onChange={e => handleMatrixCellUpdate(lik, cons, e.target.value)}>
                                        <option value="0">-</option>
                                        {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                                      </select>
                                      <ChevronDown size={10} className="absolute bottom-1 right-1 opacity-30 group-hover:opacity-80" style={{ color: color.text }} />
                                    </td>
                                  );
                                })}
                                <td className="border border-slate-300 p-2 bg-slate-50 align-middle">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm shrink-0" style={{ backgroundColor: rColor.bg, color: rColor.text }}>
                                      {ranking.code || '-'}
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black text-slate-700 uppercase">{ranking.description?.split('—')[0]?.trim() || ''}</p>
                                      <p className="text-[8px] text-slate-400 font-bold">{ranking.description?.split('—')[1]?.trim() || ''}</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-100 border-t-2 border-slate-400">
                            <td className="border border-slate-300 p-2 bg-[#004a7c] text-center text-[9px] font-black text-teal-300 uppercase tracking-widest">↓ Consequence</td>
                            {LIK_COLS.map(l => (
                              <td key={l} className="border border-slate-300 p-2 text-center text-[9px] font-black bg-[#004a7c] text-white">{l}</td>
                            ))}
                            <td className="border border-slate-300 bg-slate-200 p-2 text-[8px] text-slate-500 font-black text-center uppercase tracking-widest">Likelihood →</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Risk Level Reference</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          {rankings.slice().reverse().map(r => {
                            const c = GET_RISK_COLOR(parseInt(r.code), rankings);
                            return (
                              <div key={r.id} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded font-black text-xs flex items-center justify-center shadow-sm" style={{ backgroundColor: c.bg, color: c.text }}>{r.code}</div>
                                <span className="text-[9px] font-bold text-slate-600">{r.description?.split('—')[0]?.trim()}</span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold mt-2">Risk = Severity (S) × Probability (P). Select a value 1–5 in each cell to set the risk ranking for that combination.</p>
                      </div>
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

            {/* ── RISK CRITERIA: RANKINGS ── */}
            {activeTopTab === 'risk' && activeSideTab === 'rankings' && (
              <IndustrialRegistryView
                title="Risk Rankings"
                items={studyData.rankings || DEFAULT_RANKINGS}
                columns={studyData.rankingColumns || DEFAULT_RANKING_COLS}
                updateServer={updateServer}
                moduleKey="rankings"
                setShowColManager={setShowColManager}
              />
            )}

            {/* ── PHA WORKSHEET ── */}
            {activeTopTab === 'pha' && activeSideTab === 'sheet' && (
              <div className="min-w-max p-8 space-y-6">

                {/* Toolbar */}
                <div className="bg-[#f0f0f0] px-4 py-1.5 flex items-center border border-slate-300 rounded-sm shrink-0 shadow-sm z-10 no-print">
                  <div className="flex items-center gap-1">
                    <ToolbarButton icon={<PlusCircle size={18} className="text-[#004a7c]" />} onClick={() => addPhaRowAt(-1)} title="Add Row" />
                    <ToolbarButton icon={<Copy size={18} />} title="Copy" />
                    <ToolbarButton icon={<Scissors size={18} />} title="Cut" />
                    <ToolbarButton icon={<Clipboard size={18} />} title="Paste" />
                    <ToolbarButton icon={<Trash2 size={18} className="text-red-500" />} onClick={() => alert('Right-click a row to delete specifically.')} title="Delete" />
                    <div className="h-6 w-px bg-slate-300 mx-2" />
                    <ToolbarButton icon={<ArrowUp size={18} />} title="Move Up" />
                    <ToolbarButton icon={<ArrowDown size={18} />} title="Move Down" />
                    <div className="h-6 w-px bg-slate-300 mx-2" />
                    {/* ✅ SPECIAL FEATURE ADD-ON: Print + PDF Download (from node-eq.js) */}
                    <ToolbarButton icon={<Printer size={18} />} onClick={() => handlePrintAction()} title="Print Worksheet" />
                    <ToolbarButton icon={<Download size={18} className="text-emerald-600" />} onClick={() => handleDownloadPDF()} title="Download PDF" />
                    <div className="h-6 w-px bg-slate-300 mx-2" />
                    <ToolbarButton icon={<Download size={18} className="text-blue-600" />} onClick={exportCSV} title="Export PHA as CSV" />
                    <div className="h-6 w-px bg-slate-300 mx-2" />
                    <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Focus Node:</span>
                      <select className="bg-transparent text-[10px] font-black uppercase text-[#004a7c] outline-none cursor-pointer"
                        value={selectedNodeId || ''}
                        onChange={e => setSelectedNodeId(e.target.value)}>
                        {(studyData.nodes || []).map(n => <option key={n.id} value={n.id}>{n.description || 'Untitled'}</option>)}
                        {!studyData.nodes?.length && <option value="">No nodes defined</option>}
                      </select>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <button onClick={() => setShowColManager(true)}
                      className="flex items-center gap-2 bg-white/80 px-4 py-1.5 rounded-xl border border-slate-300 text-[10px] font-black uppercase text-slate-600 hover:bg-[#004a7c] hover:text-white transition-all">
                      <Settings size={12} /> Configure Worksheet
                    </button>
                  </div>
                </div>

                {/* HAZOP Worksheet Card */}
                <div className="bg-white rounded-sm shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
                  {/* Editable Industrial Header */}
                  <div className="p-8 border-b border-slate-200 bg-white pha-header-block">
                    <table className="w-full border-collapse border border-slate-300 text-[10px] bg-white">
                      <tbody>
                        <tr className="h-12">
                          <td className="border border-slate-300 p-2 w-[150px]"><div className="w-24 h-8 bg-slate-100 rounded" /></td>
                          <td className="border border-slate-300 p-2 text-center text-xl font-black uppercase tracking-tighter text-[#004a7c]">HAZOP WORK SHEET</td>
                          <td className="border border-slate-300 p-2 w-[220px]">
                            <div className="grid grid-cols-2 gap-1 text-[8px] font-black uppercase text-slate-500">
                              <span>Doc No:</span><span className="text-right">C/HSE/FR/006</span>
                              <span>Date:</span><span className="text-right">{new Date().toLocaleDateString()}</span>
                              <span>Rev No:</span><span className="text-right">01</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="bg-slate-50 border border-slate-300 p-2 font-black uppercase text-[8px] text-slate-400">Site / Location :</td>
                          <td className="border border-slate-300 p-0"><input className="w-full h-full p-2 font-bold uppercase focus:bg-teal-50/30 transition-all outline-none" value={studyData.metadata?.facility || ''} onChange={e => handleStudyUpdate('facility', e.target.value)} /></td>
                          <td className="bg-slate-50 border border-slate-300 p-2"><div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400"><span>Plant / Section :</span><input className="text-slate-800 font-bold bg-transparent border-none focus:outline-none text-right w-1/2" value={studyData.metadata?.unit || ''} onChange={e => handleStudyUpdate('unit', e.target.value)} /></div></td>
                        </tr>
                        <tr>
                          <td className="bg-slate-50 border border-slate-300 p-2 font-black uppercase text-[8px] text-slate-400">Product :</td>
                          <td className="border border-slate-300 p-0"><input className="w-full h-full p-2 font-bold focus:bg-teal-50/30 transition-all outline-none" value={studyData.metadata?.product || ''} onChange={e => handleStudyUpdate('product', e.target.value)} placeholder="Enter Product Name..." /></td>
                          <td className="bg-slate-50 border border-slate-300 p-2"><div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400"><span>Date of HAZOP :</span><span className="text-slate-800 font-bold">{new Date().toLocaleDateString()}</span></div></td>
                        </tr>
                        <tr>
                          <td className="bg-slate-50 border border-slate-300 p-2 font-black uppercase text-[8px] text-slate-400">Design Intention :</td>
                          <td className="border border-slate-300 p-0 italic"><input className="w-full h-full p-2 focus:bg-teal-50/30 transition-all outline-none font-bold" value={activeNode.intention || ''} onChange={e => handleNodeHeaderUpdate('intention', e.target.value)} placeholder="Describe process intention..." /></td>
                          <td className="bg-slate-50 border border-slate-300 p-2 font-black uppercase text-[8px] text-slate-400">Page : 1 of 1</td>
                        </tr>
                        <tr>
                          <td className="bg-slate-50 border border-slate-300 p-2 font-black uppercase text-[8px] text-slate-400">Node :</td>
                          <td className="border border-slate-300 p-0 font-black text-[#00B2B2]"><input className="w-full h-full p-2 font-black text-[#00B2B2] uppercase focus:bg-teal-50/30 transition-all outline-none" value={activeNode.description || ''} onChange={e => handleNodeHeaderUpdate('description', e.target.value)} /></td>
                          <td className="bg-slate-50 border border-slate-300 p-2"><div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400"><span>Node Description :</span><input className="text-slate-800 font-bold bg-transparent border-none focus:outline-none text-right w-1/2" value={activeNode.description || ''} onChange={e => handleNodeHeaderUpdate('description', e.target.value)} /></div></td>
                        </tr>

                        {/* ✅ UPDATED: Equipment Details from node-eq.js — reads from node.equipment[] array */}
                        <tr>
                          <td colSpan="3" className="p-0">
                            {(() => {
                              const equipment = activeNode.equipment || [];
                              const eqCols = studyData.equipmentColumns || DEFAULT_EQUIPMENT_COLS;
                              // Show all equipment items, minimum 5 slots for layout consistency
                              const slots = Math.max(5, equipment.length);
                              const colCount = Math.min(slots, 7); // max 7 columns for readability
                              return (
                                <div className="grid divide-x divide-slate-300 border-t border-slate-300" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
                                  {Array.from({ length: slots }).map((_, i) => {
                                    const eq = equipment[i];
                                    return (
                                      <div key={`equip-slot-${i}`} className={`p-3 space-y-1 ${eq ? 'bg-white' : 'bg-slate-50/20'}`}>
                                        <div className={`flex items-center justify-between text-[7px] font-black uppercase mb-2 border-b pb-1 ${eq ? 'text-teal-600 border-teal-100' : 'text-slate-300 border-slate-100'}`}>
                                          <span>{eq ? `Equipment ${i + 1}` : `Slot ${i + 1}`}</span>
                                          {eq && <span className="bg-teal-50 text-teal-600 px-1 rounded">{String(eq.tag || '')}</span>}
                                        </div>
                                        {eq ? (
                                          <div className="grid grid-cols-2 gap-y-1 text-[7px] font-bold uppercase text-slate-400 items-center">
                                            {eqCols.filter(c => c.id !== 'tag').map(c => (
                                              <React.Fragment key={`eq-col-${c.id}`}>
                                                <span className="truncate">{String(c.label)}:</span>
                                                <span className="text-right text-slate-700 font-black truncate">{String(eq[c.id] || '—')}</span>
                                              </React.Fragment>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="h-20 flex items-center justify-center italic text-[6px] text-slate-300 font-bold uppercase tracking-widest">Space provision</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Column group header row */}
                  <div className="flex flex-col bg-[#004a7c] text-white text-[9px] font-bold uppercase sticky top-0 z-30 shadow-xl border-b border-white/20">
                    <div className="flex border-b border-white/10 h-8 text-center items-center">
                      <div style={{ width: '50px' }}  className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '120px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '120px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '120px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '110px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '110px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '250px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '280px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '360px' }} className="shrink-0 border-r border-white/10 flex items-center justify-center font-black text-teal-400 uppercase tracking-widest">Consequences</div>
                      <div style={{ width: '150px' }} className="shrink-0 border-r border-white/10 flex items-center justify-center font-black text-teal-400 uppercase tracking-widest">Inherent Risk</div>
                      <div style={{ width: '280px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '150px' }} className="shrink-0 border-r border-white/10 flex items-center justify-center font-black text-teal-400 uppercase tracking-widest">Mitigated Risk</div>
                      <div style={{ width: '300px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '150px' }} className="shrink-0 border-r border-white/10 flex items-center justify-center font-black text-teal-400 uppercase tracking-widest">Residual Risk</div>
                      <div style={{ width: '150px' }} className="shrink-0 border-r border-white/10" />
                      <div style={{ width: '120px' }} className="shrink-0" />
                    </div>
                    <div className="flex items-center text-center">
                      {filteredVisibleCols.map(col => (
                        <div key={col.id} className="p-4 border-r border-white/10 flex items-center justify-center shrink-0 h-16 leading-tight" style={{ width: col.width }}>
                          {col.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-slate-200">
                    {nodeSpecificRows.map((row, rIdx) => (
                      <div key={row.id} className="flex group hover:bg-teal-50/30 transition-colors relative"
                        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ visible: true, x: e.pageX, y: e.pageY, rowId: row.id, index: rIdx }); }}>
                        {filteredVisibleCols.map(col => (
                          <div key={col.id} className="border-r border-slate-100 shrink-0 flex items-center" style={{ width: col.width }}>
                            {renderWorksheetCell(col, row, rIdx, studyData, handleCellUpdate)}
                          </div>
                        ))}
                        <button onClick={() => setConfirm({ open: true, rowId: row.id })}
                          className="no-print absolute left-[-45px] top-1/2 -translate-y-1/2 p-2 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => addPhaRowAt(-1)}
                    className="no-print py-12 bg-slate-50 flex items-center justify-center gap-4 text-slate-400 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-white hover:text-[#00B2B2] border-t border-slate-200 transition-all cursor-pointer group">
                    <PlusCircle size={20} className="group-hover:scale-125 transition-transform" />
                    <span>Add Analysis Scenario for {activeNode.description || 'Current Node'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* PHA Row Context Menu */}
      {contextMenu.visible && activeTopTab === 'pha' && (
        <div className="fixed z-[700] bg-white border border-slate-200 shadow-2xl rounded-2xl py-2 w-56" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <ContextItem icon={<ChevronUp size={14} />}   label="Insert Scenario Above"  onClick={() => addPhaRowAt(contextMenu.index)} />
          <ContextItem icon={<ChevronDown size={14} />} label="Insert Scenario Below"  onClick={() => addPhaRowAt(contextMenu.index + 1)} />
          <ContextItem icon={<CopyPlus size={14} />}    label="Duplicate Scenario"     onClick={() => duplicatePhaRow(contextMenu.rowId)} />
          <div className="h-px bg-slate-100 my-1 mx-2" />
          <ContextItem icon={<Trash2 size={14} className="text-red-400" />} label="Delete Selected Scenario" onClick={() => setConfirm({ open: true, rowId: contextMenu.rowId })} danger />
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