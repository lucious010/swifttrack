import { useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'

// ── CONSTANTS ─────────────────────────────────────────────────────────
const ADMIN_USER = 'admin'
const ADMIN_PASS = 'keZSi0R&nvCaouL#'

const STEPS = [
  { name: 'Picked Up',        loc: 'Origin Facility' },
  { name: 'In Transit',       loc: 'Regional Hub' },
  { name: 'Processing',       loc: 'Distribution Center' },
  { name: 'Out for Delivery', loc: 'Local Facility' },
  { name: 'Delivered',        loc: 'Destination' },
]

function bd(daysAgo = 0) {
  const d = new Date('2026-04-13T13:13:17')
  d.setDate(d.getDate() - daysAgo)
  return d
}

const INITIAL_DELIVERIES = [
  { id: 'SWIFT-9901', desc: 'Electronics - Laptop Computer (Dell XPS 15) with accessories and power adapter', stop: 3, shipped: bd(3), updated: new Date() },
  { id: 'SWIFT-9902', desc: 'Fragile - Ceramic vase set (3 pieces) - Handle with care',                       stop: 5, shipped: bd(4), updated: new Date(Date.now() - 86400000) },
  { id: 'SWIFT-9903', desc: 'Documents - Legal papers and contracts (confidential)',                           stop: 2, shipped: bd(2), updated: new Date() },
  { id: 'SWIFT-9904', desc: 'Fashion - Designer handbag (Louis Vuitton) with authentication certificate',     stop: 2, shipped: bd(1), updated: new Date() },
]

// ── HELPERS ───────────────────────────────────────────────────────────
const fmtShort = d => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const fmtAdmin = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
const fmtFull  = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const getStatus = s => s === 5 ? 'delivered' : s >= 2 ? 'transit' : 'pending'

// ── STYLES ────────────────────────────────────────────────────────────
const S = {
  navWrap:      { background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  navBrand:     { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  navLogo:      { width: 38, height: 38, background: '#1B4FE8', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  navRight:     { display: 'flex', alignItems: 'center', gap: 10 },
  adminBadge:   { display: 'flex', alignItems: 'center', gap: 6, background: '#EEF2FF', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#1B4FE8' },
  btnPrimary:   { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#1B4FE8', color: '#fff', fontFamily: 'Inter, sans-serif' },
  btnGhost:     { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none', color: '#475569', fontFamily: 'Inter, sans-serif' },
  btnDanger:    { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none', color: '#EF4444', fontFamily: 'Inter, sans-serif' },
  loginPage:    { minHeight: 'calc(100vh - 58px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  loginCard:    { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,.06)' },
  loginIcon:    { width: 56, height: 56, background: '#EEF2FF', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  trackPage:    { minHeight: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column' },
  trackHero:    { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 40px', textAlign: 'center' },
  heroIcon:     { width: 72, height: 72, background: '#DBEAFE', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' },
  searchWrap:   { width: '100%', maxWidth: 560, margin: '0 auto' },
  searchRow:    { display: 'flex', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,.06)' },
  searchIconW:  { display: 'flex', alignItems: 'center', paddingLeft: 16, color: '#94A3B8' },
  trackBtn:     { background: '#1B4FE8', color: '#fff', border: 'none', padding: '15px 28px', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  resultWrap:   { width: '100%', maxWidth: 720, margin: '0 auto 40px', padding: '0 24px' },
  rCard:        { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' },
  rHeader:      { padding: '18px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #F1F5F9' },
  rIdRow:       { display: 'flex', alignItems: 'center', gap: 10 },
  rIcon:        { width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  rBody:        { padding: '20px 22px' },
  rSectionTitle:{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 12 },
  descBox:      { border: '1.5px dashed #CBD5E1', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#334155', lineHeight: 1.6, background: '#FAFBFC', marginBottom: 18 },
  metaRow:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
  metaCard:     { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  metaIconBlue: { width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#EEF2FF' },
  metaIconOrg:  { width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#FFF3EC' },
  journeyBox:   { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 20px 12px', marginBottom: 16 },
  vStep:        { display: 'flex', gap: 14, paddingBottom: 20 },
  vLeft:        { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 },
  vLine:        { flex: 1, width: 2, background: '#E2E8F0', margin: '2px 0', minHeight: 28 },
  vLineDone:    { flex: 1, width: 2, background: '#1B4FE8', margin: '2px 0', minHeight: 28 },
  vContent:     { paddingTop: 6, flex: 1 },
  banner:       { border: '1.5px solid #F97316', background: '#FFF7F2', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 },
  bannerIcon:   { width: 40, height: 40, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  footer:       { borderTop: '1px solid #E2E8F0', background: '#fff', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  adminPage:    { padding: '28px 24px', maxWidth: 1200, margin: '0 auto' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 },
  statCard:     { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 14 },
  sectionBar:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionRight: { display: 'flex', alignItems: 'center', gap: 10 },
  pkgBadge:     { background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#475569' },
  newPkgBtn:    { display: 'flex', alignItems: 'center', gap: 6, background: '#1B4FE8', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  delivGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  dCard:        { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' },
  dHeader:      { padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dIdRow:       { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  dIdIcon:      { width: 28, height: 28, background: '#EEF2FF', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dRight:       { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  dBody:        { padding: '16px 18px' },
  fieldRow:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  editBtn:      { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#475569', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', borderRadius: 6, fontFamily: 'Inter, sans-serif' },
  saveBtn:      { fontSize: 12, fontWeight: 600, color: '#1B4FE8', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', borderRadius: 6, fontFamily: 'Inter, sans-serif' },
  delBtn:       { width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', cursor: 'pointer', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, flexShrink: 0 },
  descTa:       { width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#334155', background: '#F8FAFC', resize: 'none', height: 40, lineHeight: 1.4 },
  statusRow:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0 12px' },
  stopNav:      { display: 'flex', alignItems: 'center', gap: 8 },
  stopBtn:      { width: 26, height: 26, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' },
  hStepper:     { display: 'flex', alignItems: 'flex-start', width: '100%' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal:        { background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,.18)' },
  modalFooter:  { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 },
  modalCancel:  { background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 20px', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' },
  modalCreate:  { background: '#1B4FE8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}

// ── ICONS ─────────────────────────────────────────────────────────────
const TruckIcon = ({ size = 20, stroke = '#1B4FE8' }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>)
const CheckIcon = ({ color = '#fff' }) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>)
const PinIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>)
const TrashIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>)
const EditIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>)
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>)
const LockIcon = () => (<svg viewBox="0 0 24 24" style={{ width: 26, height: 26, stroke: '#1B4FE8', fill: 'none', strokeWidth: 2 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>)
const ChevLeft = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>)
const ChevRight = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>)
const LogoutIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>)
const PersonIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)
const PackageIcon = ({ stroke = '#1B4FE8' }) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>)
const CalIcon = () => (<svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: '#1B4FE8', strokeWidth: 2 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>)
const LocIcon = () => (<svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: '#F97316', strokeWidth: 2 }}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>)
const PlusIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)

// ── PILL ──────────────────────────────────────────────────────────────
function Pill({ stop }) {
  if (stop === 5) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, background: '#DCFCE7', color: '#15803D' }}><CheckIcon color="#15803D" /> Delivered</span>
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, background: '#DBEAFE', color: '#1D4ED8' }}><TruckIcon size={11} stroke="#1D4ED8" /> In Transit</span>
}

// ── H-STEPPER ─────────────────────────────────────────────────────────
function HStepper({ stop }) {
  return (
    <div style={S.hStepper}>
      {STEPS.map((s, si) => {
        const done = si + 1 < stop, active = si + 1 === stop
        const bg = done ? '#1B4FE8' : active ? '#F97316' : '#F1F5F9'
        const border = done ? '#1B4FE8' : active ? '#F97316' : '#CBD5E1'
        const nc = done ? '#1B4FE8' : active ? '#F97316' : '#94A3B8'
        const lc = done || active ? '#94A3B8' : '#CBD5E1'
        const lnc = done ? '#1B4FE8' : '#CBD5E1'
        return (
          <div key={si} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {si < 4 && <div style={{ position: 'absolute', top: 17, left: 'calc(50% + 18px)', width: 'calc(100% - 36px)', height: 2, background: lnc, zIndex: 0 }} />}
            <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative', fontSize: 12, fontWeight: 700, border: `2px solid ${border}`, background: bg, color: done || active ? '#fff' : '#94A3B8', flexShrink: 0 }}>
              {done ? <CheckIcon /> : active ? <PinIcon /> : si + 1}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: nc, marginTop: 6, textAlign: 'center', lineHeight: 1.3 }}>{s.name}</div>
            <div style={{ fontSize: 9, color: lc, marginTop: 1, textAlign: 'center' }}>{s.loc}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── DELIVERY CARD ─────────────────────────────────────────────────────
function DeliveryCard({ delivery, index, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [desc, setDesc]       = useState(delivery.desc)
  const [confirmDel, setConfirmDel] = useState(false)
  const handleSave = () => { onUpdate(index, { desc }); setEditing(false) }
  const handleDelete = () => {
    if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000) }
    else onDelete(index)
  }
  return (
    <div style={S.dCard}>
      <div style={S.dHeader}>
        <div style={S.dIdRow}>
          <div style={S.dIdIcon}><TruckIcon size={14} /></div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{delivery.id}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Last updated: {fmtAdmin(delivery.updated)}</div>
          </div>
        </div>
        <div style={S.dRight}>
          <Pill stop={delivery.stop} />
          <button style={{ ...S.delBtn, background: confirmDel ? '#EF4444' : '#FEF2F2', color: confirmDel ? '#fff' : '#EF4444', borderColor: confirmDel ? '#EF4444' : '#FECACA' }} onClick={handleDelete} title={confirmDel ? 'Click again to confirm' : 'Delete'}><TrashIcon /></button>
        </div>
      </div>
      <div style={S.dBody}>
        <div style={S.fieldRow}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>Item Description</div>
          {editing ? <button style={S.saveBtn} onClick={handleSave}>✓ Save</button> : <button style={S.editBtn} onClick={() => setEditing(true)}><EditIcon /> Edit</button>}
        </div>
        <textarea style={{ ...S.descTa, cursor: editing ? 'text' : 'default', background: editing ? '#fff' : '#F8FAFC', borderColor: editing ? '#1B4FE8' : '#E2E8F0' }} value={desc} disabled={!editing} onChange={e => setDesc(e.target.value)} />
        <div style={S.statusRow}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>Status Update</div>
          <div style={S.stopNav}>
            <button style={S.stopBtn} disabled={delivery.stop <= 1} onClick={() => onUpdate(index, { stop: delivery.stop - 1 })}><ChevLeft /></button>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', minWidth: 52, textAlign: 'center' }}>Stop {delivery.stop}/5</div>
            <button style={S.stopBtn} disabled={delivery.stop >= 5} onClick={() => onUpdate(index, { stop: delivery.stop + 1 })}><ChevRight /></button>
          </div>
        </div>
        <HStepper stop={delivery.stop} />
      </div>
    </div>
  )
}

// ── NEW PACKAGE MODAL ─────────────────────────────────────────────────
function NewPackageModal({ onClose, onCreate, nextId }) {
  const [id, setId]     = useState(nextId)
  const [desc, setDesc] = useState('')
  const [stop, setStop] = useState('1')
  const [err, setErr]   = useState('')
  const handleCreate = () => {
    if (!id.trim() || !desc.trim()) { setErr('Please fill in all fields.'); return }
    onCreate({ id: id.trim().toUpperCase(), desc: desc.trim(), stop: parseInt(stop) })
    onClose()
  }
  const inputStyle = { width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '11px 14px', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#1E293B', outline: 'none', background: '#FAFBFC' }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' }
  return (
    <div style={S.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Create New Package</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Fill in the details to add a new delivery.</div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>Tracking ID</label><input style={inputStyle} value={id} onChange={e => setId(e.target.value)} /></div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>Item Description</label><textarea style={{ ...inputStyle, resize: 'none', height: 80 }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the package contents..." /></div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Initial Stop</label>
          <select style={inputStyle} value={stop} onChange={e => setStop(e.target.value)}>
            <option value="1">Stop 1 – Picked Up (Origin Facility)</option>
            <option value="2">Stop 2 – In Transit (Regional Hub)</option>
            <option value="3">Stop 3 – Processing (Distribution Center)</option>
            <option value="4">Stop 4 – Out for Delivery (Local Facility)</option>
            <option value="5">Stop 5 – Delivered (Destination)</option>
          </select>
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>{err}</div>}
        <div style={S.modalFooter}>
          <button style={S.modalCancel} onClick={onClose}>Cancel</button>
          <button style={S.modalCreate} onClick={handleCreate}>Create Package</button>
        </div>
      </div>
    </div>
  )
}

// ── NAV ───────────────────────────────────────────────────────────────
function Nav({ isAdmin, onNavigate, onLogout }) {
  return (
    <nav style={S.navWrap}>
      <div style={S.navBrand} onClick={() => onNavigate('track')}>
        <div style={S.navLogo}><TruckIcon size={20} stroke="#fff" /></div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>SwiftTrack</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Courier Management System</div>
        </div>
      </div>
      <div style={S.navRight}>
        {isAdmin ? (
          <>
            <span style={S.adminBadge}>Admin</span>
            <button style={S.btnGhost} onClick={() => onNavigate('track')}><SearchIcon /> Track Package</button>
            <button style={S.btnDanger} onClick={onLogout}><LogoutIcon /> Logout</button>
          </>
        ) : (
          <>
            <button style={S.btnPrimary} onClick={() => onNavigate('track')}><SearchIcon /> Track Package</button>
            <button style={S.btnGhost} onClick={() => onNavigate('login')}><PersonIcon /> Login as Admin</button>
          </>
        )}
      </div>
    </nav>
  )
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr]           = useState('')
  const doLogin = () => {
    if (username === ADMIN_USER && password === ADMIN_PASS) { onLogin() }
    else { setErr('Incorrect username or password.'); setPassword('') }
  }
  const inp = { width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '11px 14px', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#1E293B', outline: 'none', background: '#FAFBFC' }
  const lbl = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' }
  return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <div style={S.loginIcon}><LockIcon /></div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', textAlign: 'center', marginBottom: 4 }}>Admin Login</div>
        <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 28 }}>Admin access only. Enter your credentials to continue.</div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 14, textAlign: 'center', background: '#FEF2F2', padding: 8, borderRadius: 6 }}>{err}</div>}
        <div style={{ marginBottom: 16 }}><label style={lbl}>Username</label><input style={inp} type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" onKeyDown={e => e.key === 'Enter' && doLogin()} /></div>
        <div style={{ marginBottom: 16 }}><label style={lbl}>Password</label><input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === 'Enter' && doLogin()} /></div>
        <button style={{ width: '100%', background: '#1B4FE8', color: '#fff', border: 'none', borderRadius: 9, padding: 12, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }} onClick={doLogin}>Sign In to Dashboard</button>
      </div>
    </div>
  )
}

// ── TRACK RESULT ──────────────────────────────────────────────────────
function TrackResult({ delivery: d }) {
  const stepTimes = [bd(3), bd(3), bd(2), null, null]
  return (
    <div style={{ ...S.rCard, animation: 'fadeUp .3s ease' }}>
      <div style={S.rHeader}>
        <div style={S.rIdRow}>
          <div style={S.rIcon}><PackageIcon /></div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{d.id}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{d.stop === 5 ? 'Your package has been delivered!' : 'Your package is on its way to you.'}</div>
          </div>
        </div>
        <Pill stop={d.stop} />
      </div>
      <div style={S.rBody}>
        <div style={S.rSectionTitle}><PackageIcon /> Description of Goods</div>
        <div style={S.descBox}>{d.desc}</div>
        <div style={S.metaRow}>
          <div style={S.metaCard}><div style={S.metaIconBlue}><CalIcon /></div><div><div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>Shipped Date</div><div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{fmtShort(d.shipped)}</div></div></div>
          <div style={S.metaCard}><div style={S.metaIconOrg}><LocIcon /></div><div><div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>Current Location</div><div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{STEPS[d.stop - 1].loc}</div></div></div>
        </div>
        <div style={S.rSectionTitle}><TruckIcon size={16} /> Delivery Journey</div>
        <div style={S.journeyBox}>
          {STEPS.map((s, si) => {
            const done = si + 1 < d.stop, active = si + 1 === d.stop
            const bg = done ? '#1B4FE8' : active ? '#F97316' : '#E2E8F0'
            const border = done ? '#1B4FE8' : active ? '#F97316' : '#CBD5E1'
            const nc = done ? '#1B4FE8' : active ? '#F97316' : '#94A3B8'
            return (
              <div key={si} style={{ ...S.vStep, paddingBottom: si === 4 ? 0 : 20 }}>
                <div style={S.vLeft}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: done || active ? '#fff' : '#94A3B8', background: bg, border: `2px solid ${border}` }}>
                    {done ? <CheckIcon /> : active ? <PinIcon /> : si + 1}
                  </div>
                  {si < 4 && <div style={done ? S.vLineDone : S.vLine} />}
                </div>
                <div style={S.vContent}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: nc }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: done || active ? '#64748B' : '#94A3B8', marginTop: 1 }}>{s.loc}</div>
                  {si + 1 <= d.stop && stepTimes[si] && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{fmtFull(stepTimes[si])}</div>}
                </div>
              </div>
            )
          })}
        </div>
        <div style={S.banner}>
          <div style={S.bannerIcon}><PinIcon /></div>
          <div>
            <div style={{ fontSize: 11, color: '#F97316', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Current Stop</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginTop: 1 }}>Stop {d.stop}: {STEPS[d.stop - 1].name}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TRACK PAGE ────────────────────────────────────────────────────────
function TrackPage({ deliveries }) {
  const [query, setQuery]       = useState('')
  const [result, setResult]     = useState(null)
  const [searched, setSearched] = useState(false)
  const handleTrack = () => {
    const raw = query.trim().toUpperCase()
    const id  = raw.startsWith('SWIFT-') ? raw : 'SWIFT-' + raw
    setResult(deliveries.find(x => x.id === id || x.id === raw) || null)
    setSearched(true)
  }
  return (
    <div style={S.trackPage}>
      <div style={S.trackHero}>
        <div style={S.heroIcon}><TruckIcon size={34} stroke="#1B4FE8" /></div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Track Your Package</div>
        <div style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, maxWidth: 460, margin: '0 auto 32px' }}>Enter your tracking number to get real-time updates on your delivery status.</div>
        <div style={S.searchWrap}>
          <div style={S.searchRow}>
            <div style={S.searchIconW}><SearchIcon /></div>
            <input style={{ flex: 1, border: 'none', padding: '15px 18px 15px 14px', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#1E293B', outline: 'none', background: 'none' }} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTrack()} placeholder="Enter Package ID" />
            <button style={S.trackBtn} onClick={handleTrack}>Track</button>
          </div>
        </div>
      </div>
      {searched && (
        <div style={S.resultWrap}>
          {result ? <TrackResult delivery={result} /> : (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, color: '#94A3B8' }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>No package found for <em>{query.toUpperCase()}</em></p>
              <p style={{ fontSize: 12, marginTop: 6 }}>Check the tracking number and try again</p>
            </div>
          )}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div style={S.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8' }}><TruckIcon size={14} stroke="#94A3B8" /> SwiftTrack – Fast, Reliable Delivery Tracking</div>
        <div style={{ display: 'flex', gap: 20 }}>{['Support', 'Privacy', 'Terms'].map(l => <a key={l} href="#" style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'none' }}>{l}</a>)}</div>
      </div>
    </div>
  )
}

// ── ADMIN PAGE ────────────────────────────────────────────────────────
function AdminPage({ deliveries, onUpdate, onDelete, onCreate }) {
  const [showModal, setShowModal] = useState(false)
  const pkgCounter = 9900 + deliveries.length + 5
  const stats = [
    { label: 'Total Packages', val: deliveries.length,                                             bg: '#EEF2FF', icon: <PackageIcon stroke="#1B4FE8" /> },
    { label: 'In Transit',     val: deliveries.filter(d => getStatus(d.stop) === 'transit').length, bg: '#E0F2FE', icon: <TruckIcon size={20} stroke="#0284C7" /> },
    { label: 'Delivered',      val: deliveries.filter(d => d.stop === 5).length,                   bg: '#DCFCE7', icon: <CheckIcon color="#15803D" /> },
    { label: 'Pending',        val: deliveries.filter(d => d.stop === 1).length,                   bg: '#FEF9C3', icon: <span style={{ fontSize: 16 }}>⏰</span> },
  ]
  return (
    <div style={S.adminPage}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Courier Dashboard</div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Manage and update your active deliveries</div>
      <div style={S.statsGrid}>
        {stats.map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: s.bg }}>{s.icon}</div>
            <div><div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 2 }}>{s.label}</div><div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{s.val}</div></div>
          </div>
        ))}
      </div>
      <div style={S.sectionBar}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Active Deliveries</div>
        <div style={S.sectionRight}>
          <div style={S.pkgBadge}>{deliveries.length} packages</div>
          <button style={S.newPkgBtn} onClick={() => setShowModal(true)}><PlusIcon /> New Package</button>
        </div>
      </div>
      <div style={S.delivGrid}>
        {deliveries.map((d, i) => <DeliveryCard key={d.id} delivery={d} index={i} onUpdate={onUpdate} onDelete={onDelete} />)}
      </div>
      {showModal && <NewPackageModal nextId={`SWIFT-${pkgCounter}`} onClose={() => setShowModal(false)} onCreate={onCreate} />}
    </div>
  )
}

// ── APP ───────────────────────────────────────────────────────────────
function App() {
  const [page, setPage]             = useState('track')
  const [isAdmin, setIsAdmin]       = useState(false)
  const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES)

  const navigate = p => { if (p === 'admin' && !isAdmin) { setPage('login'); return } setPage(p) }
  const handleLogin  = () => { setIsAdmin(true);  setPage('admin') }
  const handleLogout = () => { setIsAdmin(false); setPage('track') }

  const handleUpdate = useCallback((index, changes) => {
    setDeliveries(prev => prev.map((d, i) => i === index ? { ...d, ...changes, updated: new Date() } : d))
  }, [])
  const handleDelete = useCallback((index) => {
    setDeliveries(prev => prev.filter((_, i) => i !== index))
  }, [])
  const handleCreate = useCallback((pkg) => {
    setDeliveries(prev => prev.find(d => d.id === pkg.id) ? prev : [{ ...pkg, shipped: new Date(), updated: new Date() }, ...prev])
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #F0F4F8; color: #1E293B; min-height: 100vh; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        button:disabled { opacity: .3; cursor: not-allowed; }
        @media (max-width: 700px) {
          .stats-grid  { grid-template-columns: repeat(2,1fr) !important; }
          .deliv-grid  { grid-template-columns: 1fr !important; }
          .meta-row    { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Nav isAdmin={isAdmin} onNavigate={navigate} onLogout={handleLogout} />
      {page === 'track' && <TrackPage deliveries={deliveries} />}
      {page === 'login' && <LoginPage onLogin={handleLogin} />}
      {page === 'admin' && <AdminPage deliveries={deliveries} onUpdate={handleUpdate} onDelete={handleDelete} onCreate={handleCreate} />}
    </>
  )
}

// ── MOUNT ─────────────────────────────────────────────────────────────
const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<App />)
}

export default App
