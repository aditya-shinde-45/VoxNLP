import { useEffect, useMemo, useState } from 'react'
import { api, type Analysis, type Language, type SystemStatus, type Voice } from './api'

type IconName =
  | 'home'
  | 'volume'
  | 'scan'
  | 'mic'
  | 'history'
  | 'settings'
  | 'chevron'
  | 'play'
  | 'pause'
  | 'download'
  | 'menu'
  | 'spark'

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    volume: <><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15 9a4 4 0 0 1 0 6" /><path d="M18 6a8 8 0 0 1 0 12" /></>,
    scan: <><path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3" /><path d="M8 9h8M8 13h6M8 17h4" /></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 15v5h16v-5" /></>,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    pause: <><path d="M9 7v10M15 7v10" /></>,
    download: <><path d="M12 4v11M7 11l5 5 5-5" /><path d="M5 20h14" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    spark: <><path d="m12 3 1.1 3.5L16 8l-2.9 1.5L12 13l-1.1-3.5L8 8l2.9-1.5L12 3Z" /><path d="m18.5 14 .7 2.3 1.8.7-1.8.7-.7 2.3-.7-2.3L16 17l1.8-.7.7-2.3Z" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

const nav = [
  ['Overview', 'home'],
  ['Text to Speech', 'volume'],
  ['NLP Analyzer', 'scan'],
  ['Voice Library', 'mic'],
  ['Audio History', 'history'],
  ['Settings', 'settings'],
] as const

const sampleText = 'Good morning. Your weekly product summary is ready. This release includes improved multilingual support, faster audio generation, and clearer pronunciation for technical terms.'

function Sidebar({ active, onChange, open }: { active: string; onChange: (item: string) => void; open: boolean }) {
  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark">V</span><span>VoxNLP</span></div>
      <nav className="nav-list" aria-label="Main navigation">
        {nav.map(([label, icon]) => (
          <button className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => onChange(label)} key={label}>
            <Icon name={icon} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function AudioResult({ audioUrl, language, voice }: { audioUrl: string; language: string; voice: string }) {
  const [playing, setPlaying] = useState(false)
  return (
    <section className="audio-result">
      <div className="section-title-row">
        <div><h2>Generated audio</h2><p>Ready to review and download.</p></div>
        <span className="success-dot">Audio ready</span>
      </div>
      <div className="player">
        <audio src={audioUrl} controls onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        <a className="text-button" href={audioUrl} download="voxnpl-speech.wav"><Icon name="download" size={17} /> Download WAV</a>
      </div>
      <dl className="audio-meta">
        <div><dt>Language</dt><dd>{language}</dd></div>
        <div><dt>Voice</dt><dd>{voice}</dd></div>
        <div><dt>Model</dt><dd>XTTS-v2</dd></div>
        <div><dt>Created</dt><dd>Just now</dd></div>
      </dl>
    </section>
  )
}

function TextToSpeech() {
  const [text, setText] = useState(sampleText)
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [language, setLanguage] = useState('en')
  const [languages, setLanguages] = useState<Language[]>([])
  const [audioUrl, setAudioUrl] = useState<string>()
  const [error, setError] = useState('')
  const [voices, setVoices] = useState<Voice[]>([])
  const [speaker, setSpeaker] = useState('')
  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text])

  useEffect(() => {
    api.languages().then(({ languages: available }) => {
      setLanguages(available)
      if (available.length && !available.some((item) => item.code === language)) setLanguage(available[0].code)
    }).catch((reason: Error) => setError(reason.message))
    api.voices().then(({ built_in }) => {
      setVoices(built_in)
      setSpeaker(built_in[0]?.id || '')
    }).catch((reason: Error) => setError(reason.message))
  }, [])

  async function generate() {
    if (!text.trim()) return
    setGenerating(true)
    setGenerated(false)
    setError('')
    try {
      const blob = await api.synthesize({ text, language, speaker })
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(URL.createObjectURL(blob))
      setGenerated(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to generate speech.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <header className="page-header"><div><span className="eyebrow">Speech workspace</span><h1>Text to Speech</h1><p>Convert written text into natural, multilingual speech.</p></div><button className="help-button">Documentation</button></header>
      <div className="studio-grid">
        <section className="editor-panel">
          <div className="label-row"><label htmlFor="speech-text">Text</label><button className="clear-button" onClick={() => setText('')}>Clear text</button></div>
          <div className="textarea-wrap">
            <textarea id="speech-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter the text you want to convert to speech…" maxLength={5000} />
            <div className="editor-meta"><span>{words} words</span><span>{text.length.toLocaleString()} / 5,000 characters</span></div>
          </div>
          <div className="editor-note"><Icon name="spark" size={16} /><span>For the most natural pacing, use punctuation and write abbreviations in full.</span></div>
        </section>

        <section className="settings-panel">
          <h2>Speech settings</h2>
          <div className="field"><label htmlFor="language">Language</label><select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}>{languages.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></div>
          <div className="field"><label htmlFor="voice">Voice</label><select id="voice" value={speaker} onChange={(event) => setSpeaker(event.target.value)}><option value="">Select a backend voice</option>{voices.map((voice) => <option value={voice.id} key={voice.id}>{voice.name}</option>)}</select><p className="field-hint">{voices.length ? 'Voices supplied by XTTS-v2.' : 'No built-in speakers are currently available.'}</p></div>
          <div className="action-block">
            <button className="primary-button" disabled={!text.trim() || generating} onClick={generate}>{generating ? <><span className="spinner" />Generating speech…</> : <><Icon name="volume" />Generate speech</>}</button>
            <p><span className={`status-indicator ${error ? 'error-indicator' : ''}`} /> {error || 'Connected to speech backend'}</p>
          </div>
        </section>
      </div>
      {generated && audioUrl && <AudioResult audioUrl={audioUrl} language={languages.find((item) => item.code === language)?.name || language} voice="XTTS-v2 speaker" />}
    </>
  )
}

function Overview() {
  const [status, setStatus] = useState<SystemStatus>()
  const [error, setError] = useState('')
  useEffect(() => { api.status().then(setStatus).catch((reason: Error) => setError(reason.message)) }, [])
  return (
    <>
      <section className="overview-hero">
        <div className="overview-hero-copy">
          <span className="eyebrow">VoxNLP Speech Studio</span>
          <h1>Give every word a voice.</h1>
          <p>Create natural speech and understand language with one focused workspace for expressive, multilingual audio.</p>
          <div className="overview-hero-actions">
            <button className="primary-button compact" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'Text to Speech' }))}><Icon name="volume" size={16} /> Create speech</button>
            <span><span className="status-indicator" style={{ background: status?.service_ready ? 'var(--success)' : undefined }} /> {status?.service_ready ? 'All systems operational' : 'Checking services…'}</span>
          </div>
        </div>
        <div className="overview-orbit" aria-hidden="true"><span className="orbit-ring ring-one" /><span className="orbit-ring ring-two" /><span className="orbit-core">V</span><span className="orbit-dot dot-one" /><span className="orbit-dot dot-two" /></div>
      </section>
      {error && <p className="api-error">{error}</p>}
      <div className="overview-section-heading"><div><span className="eyebrow">Live workspace</span><h2>Services at a glance</h2></div><span className="overview-caption">Connected to your local VoxNLP backend</span></div>
      <section className="status-grid">
        <div className="status-card branded-status"><span className="status-card-icon"><Icon name="volume" size={16} /></span><span>Speech engine</span><strong>{status ? (status.tts.ready ? 'Ready' : status.tts.state) : 'Loading…'}</strong><small>{status?.tts.model ? 'XTTS-v2 multilingual synthesis' : 'Checking backend status'}</small></div>
        <div className="status-card branded-status"><span className="status-card-icon"><Icon name="spark" size={16} /></span><span>Inference device</span><strong>{status?.tts.device || 'Loading…'}</strong><small>{status?.tts.gpu_name || 'CPU or unavailable'}</small></div>
        <div className="status-card branded-status"><span className="status-card-icon"><Icon name="scan" size={16} /></span><span>Language intelligence</span><strong>{status ? (status.nlp.english_available ? 'Available' : 'Basic preprocessing') : 'Loading…'}</strong><small>{status?.nlp.english_available ? 'Advanced English analysis enabled' : 'English pipeline unavailable'}</small></div>
      </section>
      <section className="overview-principles">
        <div><span className="principle-number">01</span><div><strong>Write naturally</strong><p>Turn scripts, announcements, and ideas into polished speech.</p></div></div>
        <div><span className="principle-number">02</span><div><strong>Understand language</strong><p>Inspect tokens, grammar, and named entities with clarity.</p></div></div>
        <div><span className="principle-number">03</span><div><strong>Stay in control</strong><p>Everything runs through your connected local services.</p></div></div>
      </section>
    </>
  )
}

function VoiceLibrary() {
  const [voices, setVoices] = useState<Voice[]>([])
  const [error, setError] = useState('')
  const [previewVoice, setPreviewVoice] = useState<string>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [previewLoading, setPreviewLoading] = useState(false)
  useEffect(() => {
    api.voices().then((result) => setVoices(result.built_in)).catch((reason: Error) => setError(reason.message))
  }, [])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  async function preview(voice: Voice) {
    setError('')
    setPreviewLoading(true)
    setPreviewVoice(voice.id)
    try {
      const blob = await api.synthesize({ text: 'Hello from VoxNLP. This is a voice preview.', language: 'en', speaker: voice.id })
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return URL.createObjectURL(blob)
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to preview this voice.')
      setPreviewVoice(undefined)
    } finally {
      setPreviewLoading(false)
    }
  }

  return <><header className="page-header"><div><span className="eyebrow">Speech settings</span><h1>Voice Library</h1><p>Listen to the voices available from the configured XTTS-v2 model.</p></div></header>{error && <p className="api-error">{error}</p>}<section className="library-card">{voices.length ? voices.map((voice) => <div className="library-item" key={voice.id}><span className="avatar"><Icon name="mic" size={16} /></span><div className="library-item-copy"><strong>{voice.name}</strong><small>Built-in XTTS-v2 speaker</small></div><button className="preview-button" onClick={() => preview(voice)} disabled={previewLoading} aria-label={`Preview ${voice.name}`}><Icon name="play" size={15} />{previewLoading && previewVoice === voice.id ? 'Loading…' : 'Listen'}</button></div>) : <p className="empty-state">No built-in speakers are available.</p>}</section>{previewUrl && <section className="voice-preview"><div><span className="eyebrow">Voice preview</span><h2>{previewVoice}</h2><p>Sample: “Hello from VoxNLP. This is a voice preview.”</p></div><audio src={previewUrl} controls autoPlay /></section>}</>
}

function AudioHistory() {
  const [items, setItems] = useState<Array<{ id: string; text: string; language: string; created_at: string }>>([])
  const [error, setError] = useState('')
  useEffect(() => { api.history().then(({ items: history }) => setItems(history)).catch((reason: Error) => setError(reason.message)) }, [])
  return <><header className="page-header"><div><span className="eyebrow">Generated files</span><h1>Audio History</h1><p>Previously retained speech generations.</p></div></header>{error && <p className="api-error">{error}</p>}<section className="library-card"><p className="empty-state">{items.length ? `${items.length} generation${items.length === 1 ? '' : 's'} available.` : 'No audio history yet. Generated audio is currently returned directly and is not retained.'}</p></section></>
}

function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus>()
  const [error, setError] = useState('')
  useEffect(() => { api.status().then(setStatus).catch((reason: Error) => setError(reason.message)) }, [])
  return <><header className="page-header"><div><span className="eyebrow">Configuration</span><h1>Settings</h1><p>Current backend capabilities and runtime configuration.</p></div></header>{error && <p className="api-error">{error}</p>}<section className="settings-card"><div><span>Model</span><strong>{status?.tts.model || 'Loading…'}</strong></div><div><span>Device</span><strong>{status?.tts.device || 'Loading…'}</strong></div><div><span>GPU</span><strong>{status?.tts.gpu_name || 'Not detected'}</strong></div><div><span>Service state</span><strong>{status?.service_ready ? 'Ready' : status?.tts.state || 'Loading…'}</strong></div></section></>
}

function NlpAnalyzer() {
  const [text, setText] = useState('VoxNLP opened its new Berlin office in January 2025.')
  const [language, setLanguage] = useState('en')
  const [analysis, setAnalysis] = useState<Analysis>()
  const [languages, setLanguages] = useState<Language[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'tokens' | 'lemmas' | 'pos' | 'entities'>('tokens')
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    api.languages().then(({ languages: available }) => setLanguages(available)).catch((reason: Error) => setError(reason.message))
  }, [])

  async function analyze() {
    if (!text.trim()) {
      setError('Enter text to analyze.')
      setAnalysis(undefined)
      return
    }
    setError('')
    setAnalyzing(true)
    try {
      setAnalysis(await api.analyze(text, language))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to analyze text.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      <header className="page-header"><div><span className="eyebrow">Linguistic tools</span><h1>NLP Analyzer</h1><p>Inspect tokens, grammar, and named entities in your text.</p></div></header>
      <section className="analyzer">
        <label htmlFor="analysis-text">Text to analyze</label>
        <textarea id="analysis-text" value={text} onChange={(event) => setText(event.target.value)} />
        <div className="analyzer-actions"><select value={language} onChange={(event) => setLanguage(event.target.value)}>{languages.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select><button className="primary-button compact" disabled={analyzing || !text.trim()} onClick={analyze}>{analyzing ? 'Analyzing…' : 'Analyze text'}</button></div>
      </section>
      {error && <p className="api-error">{error}</p>}
      {analysis && <div className="summary-row"><div><strong>{analysis.summary.sentences}</strong><span>Sentences</span></div><div><strong>{analysis.summary.tokens}</strong><span>Tokens</span></div><div><strong>{analysis.summary.entities}</strong><span>Entities</span></div><div><strong>{analysis.analyzer}</strong><span>Analyzer</span></div></div>}
      <section className="results">
        <div className="tabs">{([['tokens', 'Tokens'], ['lemmas', 'Lemmatization'], ['pos', 'Part of speech'], ['entities', 'Named entities']] as const).map(([value, label]) => <button key={value} className={activeTab === value ? 'selected' : ''} onClick={() => setActiveTab(value)}>{label}</button>)}</div>
        <table><thead><tr><th>Token</th><th>Lemma</th><th>Part of speech</th><th>Dependency</th></tr></thead><tbody>
          {(analysis?.tokens || []).filter((token) => activeTab !== 'entities' || analysis?.entities.some((entity) => entity.start <= token.start && entity.end >= token.end)).map((token) => <tr key={`${token.start}-${token.end}`}><td>{token.text}</td><td>{token.lemma || 'Unavailable'}</td><td>{token.pos ? <span className="tag">{token.pos}</span> : 'Unavailable'}</td><td>{token.tag || 'Unavailable'}</td></tr>)}
        </tbody></table>
      </section>
    </>
  )
}

export default function App() {
  const [active, setActive] = useState('Text to Speech')
  const [menuOpen, setMenuOpen] = useState(false)
  const changePage = (item: string) => { setActive(item); setMenuOpen(false) }
  useEffect(() => {
    const navigate = (event: Event) => changePage((event as CustomEvent<string>).detail)
    window.addEventListener('navigate', navigate)
    return () => window.removeEventListener('navigate', navigate)
  }, [])
  return (
    <div className="app-shell">
      <Sidebar active={active} onChange={changePage} open={menuOpen} />
      <div className="mobile-bar"><div className="brand"><span className="brand-mark">V</span><span>VoxNLP</span></div><button onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation"><Icon name="menu" /></button></div>
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <main className="main-content">{active === 'Overview' ? <Overview /> : active === 'NLP Analyzer' ? <NlpAnalyzer /> : active === 'Text to Speech' ? <TextToSpeech /> : active === 'Voice Library' ? <VoiceLibrary /> : active === 'Audio History' ? <AudioHistory /> : <SettingsPage />}</main>
    </div>
  )
}
