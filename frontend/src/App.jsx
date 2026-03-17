import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://192.164.2.36:8000'

const LANG_PREFIX = {
  hi: '[IMPORTANT: Reply ONLY in Hindi language]\n',
  en: '[IMPORTANT: Reply ONLY in English language]\n',
  te: '[IMPORTANT: Reply ONLY in Telugu language]\n',
  bn: '[IMPORTANT: Reply ONLY in Bengali language]\n',
  ta: '[IMPORTANT: Reply ONLY in Tamil language]\n',
  mr: '[IMPORTANT: Reply ONLY in Marathi language]\n',
  bh: '[IMPORTANT: Reply ONLY in Bhojpuri language. Use Devanagari script]\n',
}

const SCHEME_COLORS = [
  { bg: '#fff7ed', border: '#fed7aa', tag: '#ea580c', tagBg: '#ffedd5', dot: '#f97316' },
  { bg: '#f0fdf4', border: '#bbf7d0', tag: '#15803d', tagBg: '#dcfce7', dot: '#22c55e' },
  { bg: '#eff6ff', border: '#bfdbfe', tag: '#1d4ed8', tagBg: '#dbeafe', dot: '#3b82f6' },
  { bg: '#fdf4ff', border: '#e9d5ff', tag: '#7c3aed', tagBg: '#f3e8ff', dot: '#a855f7' },
  { bg: '#fff1f2', border: '#fecdd3', tag: '#be123c', tagBg: '#ffe4e6', dot: '#f43f5e' },
]

function cleanText(text) {
  return text
    .replace(/<function=[\s\S]*?<\/function>/gi, '')
    .replace(/\[IMPORTANT:.*?\]\n?/gi, '')
    .replace(/\*\*/g, '')
    .trim()
}

function truncate(text, maxWords = 18) {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text.trim()
  return words.slice(0, maxWords).join(' ') + '...'
}

function parseSchemes(text) {
  const cleaned = text
    .replace(/<function=[\s\S]*?<\/function>/gi, '')
    .replace(/\[IMPORTANT:.*?\]\n?/gi, '')
  const schemes = []
  const regex = /\d+\.\s+\*{0,2}(.+?)\*{0,2}[:\-–]\s*(.+?)(?=\n\d+\.|\n*$)/gs
  let match
  while ((match = regex.exec(cleaned)) !== null) {
    const name = match[1].replace(/\*\*/g, '').trim()
    const desc = truncate(match[2].replace(/\*\*/g, '').replace(/<function[\s\S]*/, '').trim(), 18)
    if (name.length > 2) schemes.push({ name, desc })
  }
  return schemes
}

function isSchemeList(text) {
  const cleaned = text.replace(/<function=[\s\S]*?<\/function>/gi, '')
  return (cleaned.match(/^\d+\./gm) || []).length >= 2
}

const LANGUAGES = [
  {
    code: 'hi', label: 'हिंदी', flag: '🇮🇳',
    greeting: 'नमस्ते! 🙏', subtitle: 'अपने बारे में बताएं — मैं आपके लिए योजनाएं खोजूंगा।',
    placeholder: 'हिंदी में लिखें...', thinking: 'सोच रहा है...', disclaimer: 'AI — विवरण सत्यापित करें',
    quickStart: 'त्वरित शुरुआत', applyBtn: 'आवेदन करें',
    suggestions: [
      { icon: '🌾', text: 'मैं एक किसान हूं', sub: 'कृषि योजनाएं' },
      { icon: '🏠', text: 'मुझे घर चाहिए', sub: 'आवास योजनाएं' },
      { icon: '🎓', text: 'छात्रवृत्ति चाहिए', sub: 'शिक्षा सहायता' },
      { icon: '💊', text: 'स्वास्थ्य बीमा', sub: 'चिकित्सा योजनाएं' },
    ],
    cats: ['🌾 कृषि', '🏠 आवास', '🎓 शिक्षा', '💊 स्वास्थ्य', '💼 व्यवसाय', '👩 महिला', '👴 पेंशन'],
  },
  {
    code: 'en', label: 'English', flag: '🌐',
    greeting: 'Namaste! 🙏', subtitle: "Tell me about yourself — I'll find schemes you qualify for.",
    placeholder: 'Type your message...', thinking: 'Thinking...', disclaimer: 'AI powered — verify at',
    quickStart: 'Quick Start', applyBtn: 'Apply Now',
    suggestions: [
      { icon: '🌾', text: 'I am a farmer', sub: 'Agriculture schemes' },
      { icon: '🏠', text: 'I need a house', sub: 'Housing schemes' },
      { icon: '🎓', text: 'Need scholarship', sub: 'Education aid' },
      { icon: '💊', text: 'Health insurance', sub: 'Medical schemes' },
    ],
    cats: ['🌾 Agriculture', '🏠 Housing', '🎓 Education', '💊 Health', '💼 Business', '👩 Women', '👴 Pension'],
  },
  {
    code: 'te', label: 'తెలుగు', flag: '🇮🇳',
    greeting: 'నమస్కారం! 🙏', subtitle: 'మీ గురించి చెప్పండి — అర్హమైన పథకాలు కనుగొంటాను.',
    placeholder: 'తెలుగులో టైప్ చేయండి...', thinking: 'ఆలోచిస్తోంది...', disclaimer: 'AI — వివరాలు నిర్ధారించండి',
    quickStart: 'త్వరిత ప్రారంభం', applyBtn: 'దరఖాస్తు చేయండి',
    suggestions: [
      { icon: '🌾', text: 'నేను రైతును', sub: 'వ్యవసాయ పథకాలు' },
      { icon: '🏠', text: 'నాకు ఇల్లు కావాలి', sub: 'గృహ పథకాలు' },
      { icon: '🎓', text: 'స్కాలర్‌షిప్ కావాలి', sub: 'విద్య సహాయం' },
      { icon: '💊', text: 'ఆరోగ్య బీమా', sub: 'వైద్య పథకాలు' },
    ],
    cats: ['🌾 వ్యవసాయం', '🏠 గృహం', '🎓 విద్య', '💊 ఆరోగ్యం', '💼 వ్యాపారం', '👩 మహిళలు', '👴 పెన్షన్'],
  },
  {
    code: 'bn', label: 'বাংলা', flag: '🇮🇳',
    greeting: 'নমস্কার! 🙏', subtitle: 'আপনার সম্পর্কে বলুন — যোগ্য প্রকল্প খুঁজে দেব।',
    placeholder: 'বাংলায় লিখুন...', thinking: 'ভাবছে...', disclaimer: 'AI — বিবরণ যাচাই করুন',
    quickStart: 'দ্রুত শুরু', applyBtn: 'আবেদন করুন',
    suggestions: [
      { icon: '🌾', text: 'আমি একজন কৃষক', sub: 'কৃষি প্রকল্প' },
      { icon: '🏠', text: 'আমার বাড়ি দরকার', sub: 'আবাসন প্রকল্প' },
      { icon: '🎓', text: 'বৃত্তি দরকার', sub: 'শিক্ষা সহায়তা' },
      { icon: '💊', text: 'স্বাস্থ্য বীমা', sub: 'চিকিৎসা প্রকল্প' },
    ],
    cats: ['🌾 কৃষি', '🏠 আবাসন', '🎓 শিক্ষা', '💊 স্বাস্থ্য', '💼 ব্যবসা', '👩 মহিলা', '👴 পেনশন'],
  },
  {
    code: 'ta', label: 'தமிழ்', flag: '🇮🇳',
    greeting: 'வணக்கம்! 🙏', subtitle: 'உங்களைப் பற்றி சொல்லுங்கள் — தகுதியான திட்டங்கள் கண்டுபிடிப்பேன்.',
    placeholder: 'தமிழில் தட்டச்சு செய்யவும்...', thinking: 'யோசிக்கிறது...', disclaimer: 'AI — விவரங்களை சரிபார்க்கவும்',
    quickStart: 'விரைவு தொடக்கம்', applyBtn: 'விண்ணப்பிக்கவும்',
    suggestions: [
      { icon: '🌾', text: 'நான் ஒரு விவசாயி', sub: 'விவசாய திட்டங்கள்' },
      { icon: '🏠', text: 'எனக்கு வீடு வேண்டும்', sub: 'வீட்டு திட்டங்கள்' },
      { icon: '🎓', text: 'உதவித்தொகை வேண்டும்', sub: 'கல்வி உதவி' },
      { icon: '💊', text: 'சுகாதார காப்பீடு', sub: 'மருத்துவ திட்டங்கள்' },
    ],
    cats: ['🌾 விவசாயம்', '🏠 வீட்டுவசதி', '🎓 கல்வி', '💊 சுகாதாரம்', '💼 வணிகம்', '👩 பெண்கள்', '👴 ஓய்வூதியம்'],
  },
  {
    code: 'mr', label: 'मराठी', flag: '🇮🇳',
    greeting: 'नमस्कार! 🙏', subtitle: 'माझ्याबद्दल सांगा — सरकारी योजना शोधेन.',
    placeholder: 'मराठीत लिहा...', thinking: 'विचार करत आहे...', disclaimer: 'AI — तपशील तपासा',
    quickStart: 'त्वरित सुरुवात', applyBtn: 'अर्ज करा',
    suggestions: [
      { icon: '🌾', text: 'मी शेतकरी आहे', sub: 'कृषी योजना' },
      { icon: '🏠', text: 'मला घर हवे आहे', sub: 'गृहनिर्माण योजना' },
      { icon: '🎓', text: 'शिष्यवृत्ती हवी', sub: 'शिक्षण मदत' },
      { icon: '💊', text: 'आरोग्य विमा', sub: 'वैद्यकीय योजना' },
    ],
    cats: ['🌾 शेती', '🏠 गृहनिर्माण', '🎓 शिक्षण', '💊 आरोग्य', '💼 व्यवसाय', '👩 महिला', '👴 पेन्शन'],
  },
  {
    code: 'bh', label: 'भोजपुरी', flag: '🇮🇳',
    greeting: 'प्रणाम! 🙏',
    subtitle: 'हमके अपने बारे में बताईं — हम रउआ खातिर सरकारी योजना खोजब।',
    placeholder: 'भोजपुरी में लिखीं...',
    thinking: 'सोचत बाड़ी...',
    disclaimer: 'AI — जानकारी सत्यापित करीं',
    quickStart: 'जल्दी शुरू करीं',
    applyBtn: 'आवेदन करीं',
    suggestions: [
      { icon: '🌾', text: 'हम किसान बानी', sub: 'खेती योजना' },
      { icon: '🏠', text: 'हमके घर चाहीं', sub: 'आवास योजना' },
      { icon: '🎓', text: 'छात्रवृत्ति चाहीं', sub: 'पढ़ाई सहायता' },
      { icon: '💊', text: 'स्वास्थ्य बीमा', sub: 'स्वास्थ्य योजना' },
    ],
    cats: ['🌾 खेती', '🏠 आवास', '🎓 पढ़ाई', '💊 स्वास्थ्य', '💼 रोजगार', '👩 महिला', '👴 पेंशन'],
  },
]

/* ── Custom Language Dropdown ── */
function LangDropdown({ langCode, setLangCode }) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(null)
  const ref = useRef(null)
  const current = LANGUAGES.find(l => l.code === langCode)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: '#162444', border: '1.5px solid #1e3a5f',
          borderRadius: 10, padding: '7px 12px',
          color: '#e2e8f0', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
          minWidth: 120,
        }}
      >
        <span style={{ fontSize: 15 }}>{current.flag}</span>
        <span style={{ flex: 1 }}>{current.label}</span>
        <span style={{
          fontSize: 9, color: '#94a3b8',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s', display: 'inline-block'
        }}>▼</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#0f1f3d',
          border: '1.5px solid #1e3a5f',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          zIndex: 999,
          minWidth: 160,
          animation: 'dropIn 0.18s ease forwards',
        }}>
          {LANGUAGES.map(l => {
            const isSelected = l.code === langCode
            const isHov = hovered === l.code

            let bg = 'transparent'
            let color = '#cbd5e1'
            let fontWeight = 600

            if (isSelected) {
              bg = '#0f172a'   // navy blue for selected
              color = '#ffffff'
              fontWeight = 800
            }
            if (isHov && !isSelected) {
              bg = 'rgba(249,115,22,0.18)'  // orange tint for hover
              color = '#f97316'
              fontWeight = 700
            }

            return (
              <button
                key={l.code}
                onMouseEnter={() => setHovered(l.code)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => { setLangCode(l.code); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', textAlign: 'left',
                  background: bg, border: 'none',
                  padding: '11px 16px',
                  color, fontWeight, fontSize: 13,
                  fontFamily: 'inherit', cursor: 'pointer',
                  transition: 'all 0.12s',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ fontSize: 16 }}>{l.flag}</span>
                <span style={{ flex: 1 }}>{l.label}</span>
                {isSelected && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#f97316', display: 'inline-block',
                    boxShadow: '0 0 6px #f97316',
                  }} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Scheme Cards ── */
function SchemeCards({ schemes, applyBtn }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 500 }}>
      <div style={SC.banner}>
        <span style={{ color: '#f97316', fontSize: 12 }}>✦</span>
        <span style={SC.bannerText}>{schemes.length} Matching Schemes Found</span>
      </div>
      {schemes.map((s, i) => {
        const c = SCHEME_COLORS[i % SCHEME_COLORS.length]
        return (
          <div key={i} style={{ ...SC.card, background: c.bg, border: `1px solid ${c.border}`, borderLeftWidth: 4, borderLeftColor: c.dot }}>
            <div style={SC.cardRow}>
              <div style={{ ...SC.numBadge, background: c.dot }}>{i + 1}</div>
              <div style={SC.cardBody}>
                <div style={SC.cardName}>{s.name}</div>
                <div style={SC.cardDesc}>{s.desc}</div>
              </div>
              <a href="https://myscheme.gov.in" target="_blank" rel="noreferrer"
                style={{ ...SC.applyBtn, color: c.tag, background: c.tagBg, borderColor: c.border }}>
                {applyBtn}
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const SC = {
  banner: { display: 'flex', alignItems: 'center', gap: 7, background: '#0f172a', borderRadius: 10, padding: '9px 14px', marginBottom: 2 },
  bannerText: { color: '#fff', fontWeight: 700, fontSize: 13 },
  card: { borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  cardRow: { display: 'flex', alignItems: 'center', gap: 10 },
  numBadge: { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardDesc: { fontSize: 12, fontWeight: 500, color: '#475569', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  applyBtn: { display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 8, border: '1.5px solid', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 },
}

/* ── Mic SVG ── */
function MicIcon({ size = 18, color = '#f97316' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="11" rx="3" fill={color} />
      <path d="M5 11C5 14.866 8.134 18 12 18C15.866 18 19 14.866 19 11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="22" x2="15" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}


/* ── Suggestion Card with orange hover ── */
function SuggCard({ s, onSend }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        background: hov ? '#f97316' : '#ffffff',
        border: hov ? '1.5px solid #ea580c' : '1.5px solid #e2e8f0',
        borderRadius: 14, padding: '13px 14px',
        textAlign: 'left', position: 'relative', overflow: 'hidden',
        boxShadow: hov ? '0 4px 16px rgba(249,115,22,0.35)' : '0 1px 6px rgba(0,0,0,0.07)',
        cursor: 'pointer', width: '100%',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.18s ease',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onSend(s.text)}
    >
      <span style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</span>
      <span style={{ color: hov ? '#ffffff' : '#0f172a', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
        {s.text}
      </span>
      <span style={{ color: hov ? 'rgba(255,255,255,0.8)' : '#334155', fontSize: 11, fontWeight: 600 }}>
        {s.sub}
      </span>
      <span style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        color: hov ? '#ffffff' : '#f97316', fontSize: 16, fontWeight: 800,
      }}>→</span>
    </button>
  )
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recSecs, setRecSecs] = useState(0)
  const [mediaRec, setMediaRec] = useState(null)
  const [langCode, setLangCode] = useState('en')
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  const L = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[1]

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  useEffect(() => {
    if (recording) {
      setRecSecs(0)
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000)
    } else {
      clearInterval(timerRef.current); setRecSecs(0)
    }
    return () => clearInterval(timerRef.current)
  }, [recording])

  const showToast = (msg, type = 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const send = async (text) => {
    const txt = (text || input).trim()
    if (!txt) return
    setMessages(m => [...m, { role: 'user', text: txt, time: new Date() }])
    setInput(''); setLoading(true)
    try {
      const r = await axios.post(`${API_URL}/chat/text?message=${encodeURIComponent(LANG_PREFIX[langCode] + txt)}`)
      const raw = r.data.response
      const schemes = isSchemeList(raw) ? parseSchemes(raw) : []
      setMessages(m => [...m, { role: 'ai', text: raw, schemes: schemes.length >= 2 ? schemes : null, time: new Date() }])
    } catch { showToast('Backend not reachable. Run: uvicorn main:app --reload', 'error') }
    setLoading(false); inputRef.current?.focus()
  }

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks = []
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const form = new FormData()
        form.append('audio', blob, 'rec.webm')
        setLoading(true)
        try {
          const r = await axios.post(`${API_URL}/chat/voice?lang=${langCode}`, form)
          const r2 = await axios.post(`${API_URL}/chat/text?message=${encodeURIComponent(LANG_PREFIX[langCode] + r.data.transcribed)}`)
          const raw = r2.data.response
          const schemes = isSchemeList(raw) ? parseSchemes(raw) : []
          setMessages(m => [...m,
            { role: 'user', text: r.data.transcribed, voice: true, time: new Date() },
            { role: 'ai', text: raw, schemes: schemes.length >= 2 ? schemes : null, time: new Date() }
          ])
        } catch { showToast('Voice failed. Try typing instead.', 'error') }
        setLoading(false)
      }
      mr.start(); setMediaRec(mr); setRecording(true)
    } catch { showToast('Mic access denied.', 'warn') }
  }

  const stopRec = () => { mediaRec?.stop(); setRecording(false) }
  const clearChat = () => setMessages([])
  const formatTime = d => d?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const fmtSecs = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const renderAI = (msg) => {
    if (msg.schemes?.length >= 2) return <SchemeCards schemes={msg.schemes} applyBtn={L.applyBtn} />
    const cleaned = cleanText(msg.text)
    const parts = cleaned.split(/(\*\*.+?\*\*)/g)
    return (
      <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, fontWeight: 500, color: '#0f172a', lineHeight: 1.7 }}>
        {parts.map((p, i) => p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} style={{ fontWeight: 800 }}>{p.slice(2, -2)}</strong>
          : p
        )}
      </div>
    )
  }

  return (
    <div style={S.root}>

      {/* SIDEBAR */}
      <aside style={{ ...S.sidebar, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div style={S.sidebarAccent} />
        <div style={S.sidebarHeader}>
          <div style={S.sidebarLogo}><span style={S.logoTxt}>JS</span></div>
          <span style={S.sidebarTitle}>JanSahayak</span>
          <button onClick={() => setSidebarOpen(false)} style={S.closeBtn}>✕</button>
        </div>
        <div style={S.sidebarSection}>
          <p style={S.sidebarLabel}>LIVE STATS</p>
          {[{ num: '25+', text: 'Welfare Schemes' }, { num: '7', text: 'Languages' }, { num: '₹0', text: 'API Cost' }].map(s => (
            <div key={s.text} style={S.statRow}>
              <span style={S.statNum}>{s.num}</span>
              <span style={S.statText}>{s.text}</span>
            </div>
          ))}
        </div>
        <div style={S.sidebarSection}>
          <p style={S.sidebarLabel}>CATEGORIES</p>
          {L.cats.map(c => (
            <button key={c} style={S.catBtn} onClick={() => { send(c.split(' ').slice(1).join(' ')); setSidebarOpen(false) }}>
              {c}
            </button>
          ))}
        </div>
        <div style={S.sidebarFooter}>
          <div style={S.teamBadge}>Team MOM · Mind Over Machines</div>
          <p style={S.footerSub}>HACK X VID-YOUTH 2026</p>
        </div>
      </aside>

      {sidebarOpen && <div style={S.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* MAIN */}
      <div style={S.main}>

        {/* HEADER */}
        <header style={S.header}>
          <div style={S.headerStrip} />
          <div style={S.headerInner}>
            <div style={S.headerLeft}>
              <button style={S.menuBtn} onClick={() => setSidebarOpen(true)}>
                {[20, 14, 20].map((w, i) => <span key={i} style={{ ...S.menuLine, width: w }} />)}
              </button>
              <div style={S.headerLogoWrap}>
                <div style={S.headerLogoBox}><span style={S.logoTxt}>JS</span></div>
                <div>
                  <div style={S.headerTitle}>JanSahayak AI</div>
                  <div style={S.headerSub}>Welfare Assistant · Groq Llama 3</div>
                </div>
              </div>
            </div>
            <div style={S.headerRight}>
              {/* ✅ Custom dropdown replaces <select> */}
              <LangDropdown langCode={langCode} setLangCode={setLangCode} />
              <div style={S.liveBadge}><span style={S.liveDot} />Live</div>
              {messages.length > 0 && <button onClick={clearChat} style={S.clearBtn}>🗑️</button>}
            </div>
          </div>
        </header>

        {/* CHAT */}
        <div style={S.chatArea}>
          {messages.length === 0 && (
            <div style={S.emptyState}>
              <div style={S.emptyRing}><span style={S.emptyLogo}>JS</span></div>
              <h2 style={S.emptyTitle}>{L.greeting}</h2>
              <p style={S.emptySubtitle}>{L.subtitle}</p>
              <div style={S.divider}>
                <span style={S.divLine} /><span style={S.divText}>{L.quickStart}</span><span style={S.divLine} />
              </div>
              <div style={S.suggGrid}>
                {L.suggestions.map((s, i) => (
                  <SuggCard key={i} s={s} onSend={send} />
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ ...S.msgRow, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'ai' && <div style={S.avAI}><span style={S.avTxt}>JS</span></div>}
              <div style={{ maxWidth: m.schemes ? 520 : 480 }}>
                {m.role === 'ai'
                  ? <div style={m.schemes ? {} : { ...S.bubble, ...S.bubbleAI }}>{renderAI(m)}</div>
                  : <div style={{ ...S.bubble, ...S.bubbleUser }}>
                      {m.voice && <span style={{ fontSize: 12, opacity: 0.8 }}>🎙️ </span>}
                      <span style={{ whiteSpace: 'pre-wrap', fontWeight: 600 }}>{m.text}</span>
                    </div>
                }
                <div style={{ ...S.time, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                  {formatTime(m.time)}
                </div>
              </div>
              {m.role === 'user' && <div style={S.avUser}>👤</div>}
            </div>
          ))}

          {loading && (
            <div style={{ ...S.msgRow, justifyContent: 'flex-start' }}>
              <div style={S.avAI}><span style={S.avTxt}>JS</span></div>
              <div style={{ ...S.bubble, ...S.bubbleAI, display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px' }}>
                {[0, 0.18, 0.36].map((d, i) => <span key={i} style={{ ...S.dot, animationDelay: `${d}s` }} />)}
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginLeft: 2 }}>{L.thinking}</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT BAR */}
        <div style={S.inputBar}>
          <div style={S.inputRow}>
            <div style={{ ...S.inputBox, ...(recording ? S.inputBoxRec : {}) }}>
              <input
                ref={inputRef} style={S.input}
                placeholder={L.placeholder} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={loading}
              />
              <button
                style={{ ...S.micBtn, ...(recording ? S.micBtnRec : {}) }}
                onClick={recording ? stopRec : startRec}
              >
                {recording
                  ? <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 800 }}>■</span>
                  : <MicIcon size={18} color="#f97316" />
                }
                {recording && (
                  <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 800, position: 'absolute', bottom: -15, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    {fmtSecs(recSecs)}
                  </span>
                )}
              </button>
            </div>
            <button
              style={{ ...S.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
              onClick={() => send()} disabled={!input.trim() || loading}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {recording && (
            <div style={S.recBar}>
              <span style={S.recDot} />
              <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>Recording  {fmtSecs(recSecs)}</span>
              <span style={{ color: '#64748b', fontSize: 12 }}>· Tap ■ to stop</span>
            </div>
          )}

          <p style={S.disclaimer}>
            {L.disclaimer}{' '}
            <a href="https://myscheme.gov.in" target="_blank" rel="noreferrer" style={S.link}>myscheme.gov.in</a>
          </p>
        </div>
      </div>

      {toast && (
        <div style={{ ...S.toast, background: toast.type === 'error' ? '#dc2626' : '#d97706' }}>
          ⚠️ {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Plus Jakarta Sans','Noto Sans Devanagari',sans-serif; background:#0a1628; font-weight:500; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#f97316; border-radius:4px; }
        input::placeholder { color:#94a3b8; font-weight:500; }
        input:focus { outline:none; }
        button { transition:all 0.15s; cursor:pointer; }
        button:active { transform:scale(0.96); }
        @keyframes bounce  { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 0 4px rgba(249,115,22,0.2)} 50%{box-shadow:0 0 0 8px rgba(249,115,22,0.35)} }
        @keyframes micPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        @keyframes dropIn  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}

/* ═══ TOKENS ═══ */
const NAVY2  = '#0f1f3d'
const NAVY3  = '#162444'
const NAVY4  = '#1e3a5f'
const ORANGE = '#f97316'
const ORANGE2= '#ea580c'
const WHITE  = '#ffffff'
const GRAY1  = '#f8fafc'
const GRAY3  = '#e2e8f0'
const TEXT1  = '#0f172a'
const TEXT2  = '#334155'
const TEXT3  = '#64748b'

const S = {
  root:{ display:'flex', height:'100vh', width:'100vw', background:'#0a1628', overflow:'hidden', fontFamily:"'Plus Jakarta Sans','Noto Sans Devanagari',sans-serif", position:'relative' },
  sidebar:{ position:'fixed', top:0, left:0, bottom:0, width:280, background:NAVY2, borderRight:`1px solid ${NAVY4}`, zIndex:100, display:'flex', flexDirection:'column', transition:'transform 0.3s cubic-bezier(.4,0,.2,1)', boxShadow:'8px 0 32px rgba(0,0,0,0.4)', overflowY:'auto' },
  sidebarAccent:{ height:4, background:`linear-gradient(90deg,${ORANGE},${ORANGE2})`, flexShrink:0 },
  sidebarHeader:{ display:'flex', alignItems:'center', gap:10, padding:'18px 16px', borderBottom:`1px solid ${NAVY4}` },
  sidebarLogo:{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  logoTxt:{ color:WHITE, fontWeight:800, fontSize:13, letterSpacing:'0.04em' },
  sidebarTitle:{ flex:1, color:WHITE, fontWeight:800, fontSize:16 },
  closeBtn:{ background:'none', border:'none', color:'#94a3b8', fontSize:15, padding:4 },
  sidebarSection:{ padding:'16px', borderBottom:`1px solid ${NAVY4}` },
  sidebarLabel:{ color:ORANGE, fontSize:10, fontWeight:800, letterSpacing:'0.15em', marginBottom:10 },
  statRow:{ display:'flex', alignItems:'baseline', gap:10, marginBottom:8 },
  statNum:{ color:ORANGE, fontWeight:800, fontSize:20, minWidth:40 },
  statText:{ color:'#cbd5e1', fontSize:13, fontWeight:600 },
  catBtn:{ display:'block', width:'100%', textAlign:'left', background:NAVY3, border:`1px solid ${NAVY4}`, borderRadius:8, color:'#cbd5e1', padding:'8px 12px', marginBottom:5, fontSize:13, fontWeight:600 },
  sidebarFooter:{ marginTop:'auto', padding:16, borderTop:`1px solid ${NAVY4}` },
  teamBadge:{ background:'rgba(249,115,22,0.12)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:20, padding:'5px 12px', color:ORANGE, fontSize:11, fontWeight:700, display:'inline-block', marginBottom:4 },
  footerSub:{ color:'#64748b', fontSize:11, marginTop:4 },
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 },
  main:{ flex:1, display:'flex', flexDirection:'column', maxWidth:820, margin:'0 auto', width:'100%', height:'100vh' },
  header:{ flexShrink:0, background:NAVY2, borderBottom:`1px solid ${NAVY4}`, boxShadow:'0 2px 20px rgba(0,0,0,0.25)' },
  headerStrip:{ height:4, background:`linear-gradient(90deg,${ORANGE},${ORANGE2},#fb923c)` },
  headerInner:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', gap:12 },
  headerLeft:{ display:'flex', alignItems:'center', gap:12, minWidth:0 },
  menuBtn:{ background:'none', border:'none', padding:6, display:'flex', flexDirection:'column', gap:4, flexShrink:0 },
  menuLine:{ display:'block', height:2, background:'#e2e8f0', borderRadius:2 },
  headerLogoWrap:{ display:'flex', alignItems:'center', gap:10, minWidth:0 },
  headerLogoBox:{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, animation:'glow 3s ease-in-out infinite' },
  headerTitle:{ color:WHITE, fontWeight:800, fontSize:16, whiteSpace:'nowrap' },
  headerSub:{ color:'#94a3b8', fontSize:11, whiteSpace:'nowrap', fontWeight:500 },
  headerRight:{ display:'flex', alignItems:'center', gap:8, flexShrink:0 },
  liveBadge:{ display:'flex', alignItems:'center', gap:5, background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:20, padding:'4px 10px', color:'#4ade80', fontSize:12, fontWeight:700 },
  liveDot:{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block', boxShadow:'0 0 5px #22c55e', animation:'pulse 2s infinite' },
  clearBtn:{ background:NAVY3, border:`1px solid ${NAVY4}`, borderRadius:8, padding:'6px 10px', fontSize:14, color:'#94a3b8' },
  chatArea:{ flex:1, overflowY:'auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:14, background:WHITE },
  emptyState:{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', margin:'auto', paddingBottom:16, animation:'fadeUp 0.5s ease forwards' },
  emptyRing:{ width:84, height:84, borderRadius:'50%', background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18, boxShadow:'0 6px 28px rgba(249,115,22,0.35)', animation:'glow 3s ease-in-out infinite' },
  emptyLogo:{ color:WHITE, fontWeight:800, fontSize:28 },
  emptyTitle:{ color:TEXT1, fontSize:26, fontWeight:800, marginBottom:8 },
  emptySubtitle:{ color:TEXT2, fontSize:14, fontWeight:600, maxWidth:360, lineHeight:1.65, marginBottom:24 },
  divider:{ display:'flex', alignItems:'center', gap:12, width:'100%', maxWidth:460, marginBottom:16 },
  divLine:{ flex:1, height:1, background:GRAY3, display:'block' },
  divText:{ color:TEXT3, fontSize:11, fontWeight:700, letterSpacing:'0.1em', whiteSpace:'nowrap' },
  suggGrid:{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, width:'100%', maxWidth:460 },
  suggCard:{ display:'flex', flexDirection:'column', alignItems:'flex-start', background:WHITE, border:`1.5px solid ${GRAY3}`, borderRadius:14, padding:'13px 14px', textAlign:'left', position:'relative', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.07)' },
  suggIcon:{ fontSize:20, marginBottom:6 },
  suggTxt:{ color:TEXT1, fontSize:13, fontWeight:700, marginBottom:2 },
  suggSub:{ color:TEXT2, fontSize:11, fontWeight:600 },
  suggArrow:{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:ORANGE, fontSize:16, fontWeight:800 },
  msgRow:{ display:'flex', alignItems:'flex-start', gap:8, animation:'fadeUp 0.3s ease forwards' },
  avAI:{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(249,115,22,0.3)', marginTop:2 },
  avTxt:{ color:WHITE, fontWeight:800, fontSize:10 },
  avUser:{ width:32, height:32, borderRadius:'50%', background:'#f1f5f9', border:`2px solid ${ORANGE}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, marginTop:2 },
  bubble:{ padding:'11px 15px', borderRadius:16, fontSize:14, lineHeight:1.65, wordBreak:'break-word' },
  bubbleUser:{ background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`, color:WHITE, borderBottomRightRadius:4, boxShadow:'0 2px 12px rgba(249,115,22,0.25)', fontWeight:600 },
  bubbleAI:{ background:WHITE, border:`1.5px solid ${GRAY3}`, color:TEXT1, borderBottomLeftRadius:4, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', fontWeight:500 },
  time:{ color:TEXT3, fontSize:10, fontWeight:500, marginTop:3, paddingInline:4 },
  dot:{ width:6, height:6, borderRadius:'50%', background:ORANGE, display:'inline-block', animation:'bounce 1.1s infinite' },
  inputBar:{ padding:'12px 16px 13px', background:WHITE, borderTop:`1px solid ${GRAY3}`, flexShrink:0, boxShadow:'0 -2px 12px rgba(0,0,0,0.06)' },
  inputRow:{ display:'flex', gap:8, alignItems:'center' },
  inputBox:{ flex:1, display:'flex', alignItems:'center', background:GRAY1, border:`1.5px solid ${GRAY3}`, borderRadius:14, padding:'5px 5px 5px 14px', transition:'border-color 0.2s' },
  inputBoxRec:{ borderColor:'#ef4444', boxShadow:'0 0 0 3px rgba(239,68,68,0.1)' },
  input:{ flex:1, background:'none', border:'none', color:TEXT1, fontSize:14, fontWeight:600, fontFamily:"'Plus Jakarta Sans','Noto Sans Devanagari',sans-serif", outline:'none', lineHeight:1.5, minHeight:30 },
  micBtn:{ width:40, height:40, borderRadius:12, background:'#fff7ed', border:'2px solid #fed7aa', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(249,115,22,0.15)', position:'relative' },
  micBtnRec:{ background:'#fef2f2', border:'2px solid #fca5a5', animation:'micPulse 1s infinite' },
  sendBtn:{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`, border:'none', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 14px rgba(249,115,22,0.35)' },
  recBar:{ display:'flex', alignItems:'center', gap:8, paddingTop:10, paddingLeft:4 },
  recDot:{ width:8, height:8, borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'pulse 0.8s infinite' },
  disclaimer:{ color:TEXT3, fontSize:11, fontWeight:600, textAlign:'center', marginTop:10 },
  link:{ color:ORANGE, textDecoration:'none', fontWeight:700 },
  toast:{ position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)', borderRadius:12, padding:'11px 18px', color:WHITE, fontSize:13, fontWeight:700, boxShadow:'0 8px 24px rgba(0,0,0,0.2)', zIndex:200, whiteSpace:'nowrap', animation:'fadeUp 0.3s ease forwards' },
}
