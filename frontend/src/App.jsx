import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://192.168.1.7:8000'

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const txt = input
    setMessages(m => [...m, { role: 'user', text: txt }])
    setInput('')
    setLoading(true)
    try {
      const res = await axios.post(
        `${API_URL}/chat/text?message=${encodeURIComponent(txt)}`
      )
      setMessages(m => [...m, { role: 'ai', text: res.data.response }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Cannot reach backend. Is it running?' }])
    }
    setLoading(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      chunks.current = []
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data)
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        const form = new FormData()
        form.append('audio', blob, 'recording.webm')
        setLoading(true)
        try {
          const res = await axios.post(`${API_URL}/chat/voice?lang=hi`, form)
          setMessages(m => [...m,
            { role: 'user', text: '🎤 ' + res.data.transcribed },
            { role: 'ai', text: res.data.response }
          ])
        } catch {
          setMessages(m => [...m, { role: 'ai', text: 'Voice error. Try typing instead.' }])
        }
        setLoading(false)
      }
      mediaRecorder.current.start()
      setRecording(true)
    } catch {
      alert('Microphone access denied!')
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>JS</div>
            <div>
              <div style={styles.title}>JanSahayak AI</div>
              <div style={styles.subtitle}>Powered by Groq — Free | Team MOM</div>
            </div>
          </div>
          <div style={styles.liveWrapper}>
            <div style={styles.liveDot}></div>
            <span style={styles.liveText}>Live</span>
          </div>
        </div>

        {/* Language pills */}
        <div style={styles.pillsRow}>
          {['Hindi', 'English', 'Telugu', 'Bengali', 'Tamil'].map(l => (
            <span key={l} style={styles.pill}>{l}</span>
          ))}
        </div>

        {/* Orange bar */}
        <div style={styles.orangeBar}></div>

        {/* Chat area */}
        <div style={styles.chatArea}>
          {messages.length === 0 && (
            <div style={styles.welcome}>
              <div style={styles.welcomeIcon}>🤖</div>
              <p style={styles.welcomeTitle}>Namaste! I am JanSahayak AI</p>
              <p style={styles.welcomeSub}>
                I help Indian citizens find government welfare schemes.
                Speak or type in any language to begin.
              </p>
              <div style={styles.suggestRow}>
                <button style={styles.suggestBtn}
                  onClick={() => setInput('Main ek kisan hoon UP mein')}>
                  🌾 Main kisan hoon
                </button>
                <button style={styles.suggestBtn}
                  onClick={() => setInput('I am a student looking for scholarships')}>
                  🎓 Student scholarships
                </button>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{
              ...styles.msgRow,
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              {m.role === 'ai' && <div style={styles.aiAvatar}>JS</div>}
              <div style={m.role === 'user' ? styles.userBubble : styles.aiBubble}>
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.msgRow}>
              <div style={styles.aiAvatar}>JS</div>
              <div style={styles.aiBubble}>
                <div style={styles.dotsRow}>
                  <div style={styles.dot}></div>
                  <div style={{ ...styles.dot, opacity: 0.6 }}></div>
                  <div style={{ ...styles.dot, opacity: 0.3 }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Divider */}
        <div style={styles.thinOrange}></div>

        {/* Input bar */}
        <div style={styles.inputBar}>
          <input
            style={styles.input}
            placeholder="Type in Hindi or English..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && send()}
            disabled={loading}
          />
          <button
            style={{ ...styles.sendBtn, opacity: loading ? 0.5 : 1 }}
            onClick={send}
            disabled={loading}>
            Send
          </button>
          <button
            style={{
              ...styles.speakBtn,
              background: recording ? '#ef4444' : '#F4720B',
              opacity: loading ? 0.5 : 1
            }}
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}>
            {recording ? '⏹ Stop' : '🎤 Speak'}
          </button>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerLeft}>JanSahayak AI — Making welfare accessible for all</span>
          <span style={styles.footerRight}>✅ 100% Free</span>
        </div>

      </div>
      <p style={styles.teamTag}>Team MOM — HACK X VID-YOUTH 2026</p>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Inter, Segoe UI, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '580px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  header: {
    background: '#0D1B3E',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    width: '42px',
    height: '42px',
    background: '#F4720B',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
  },
  title: {
    color: 'white',
    fontWeight: '600',
    fontSize: '16px',
    lineHeight: '1.2',
  },
  subtitle: {
    color: '#F4720B',
    fontSize: '11px',
    marginTop: '2px',
  },
  liveWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    background: '#4ade80',
    borderRadius: '50%',
  },
  liveText: {
    color: '#4ade80',
    fontSize: '12px',
    fontWeight: '500',
  },
  pillsRow: {
    background: '#0D1B3E',
    padding: '0 20px 12px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  pill: {
    fontSize: '11px',
    padding: '3px 10px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.6)',
  },
  orangeBar: {
    height: '3px',
    background: '#F4720B',
  },
  chatArea: {
    background: '#f8fafc',
    padding: '16px',
    minHeight: '320px',
    maxHeight: '380px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  welcome: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    textAlign: 'center',
    gap: '8px',
  },
  welcomeIcon: {
    fontSize: '40px',
    marginBottom: '4px',
  },
  welcomeTitle: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: '15px',
    margin: '0',
  },
  welcomeSub: {
    color: '#64748b',
    fontSize: '13px',
    margin: '0',
    maxWidth: '300px',
    lineHeight: '1.5',
  },
  suggestRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suggestBtn: {
    fontSize: '12px',
    padding: '6px 14px',
    borderRadius: '20px',
    background: '#fff7ed',
    color: '#c2410c',
    border: '1px solid #fed7aa',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  aiAvatar: {
    width: '28px',
    height: '28px',
    minWidth: '28px',
    background: '#F4720B',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
  },
  userBubble: {
    background: '#0D1B3E',
    color: 'white',
    borderRadius: '12px 0 12px 12px',
    padding: '10px 14px',
    fontSize: '13px',
    maxWidth: '340px',
    lineHeight: '1.5',
  },
  aiBubble: {
    background: 'white',
    color: '#1e293b',
    borderRadius: '0 12px 12px 12px',
    padding: '10px 14px',
    fontSize: '13px',
    maxWidth: '360px',
    lineHeight: '1.5',
    border: '1px solid #e2e8f0',
  },
  dotsRow: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  dot: {
    width: '7px',
    height: '7px',
    background: '#F4720B',
    borderRadius: '50%',
  },
  thinOrange: {
    height: '1px',
    background: '#F4720B',
    opacity: 0.4,
  },
  inputBar: {
    background: 'white',
    padding: '12px 16px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '9px 14px',
    fontSize: '13px',
    background: '#f8fafc',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    background: '#0D1B3E',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  speakBtn: {
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  footer: {
    background: '#f8fafc',
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #e2e8f0',
  },
  footerLeft: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  footerRight: {
    fontSize: '11px',
    color: '#16a34a',
    fontWeight: '500',
  },
  teamTag: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: '11px',
    marginTop: '12px',
  },
}