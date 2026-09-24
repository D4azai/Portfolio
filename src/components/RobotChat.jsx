import React, { useEffect, useRef, useState } from 'react';
import { Arrow } from './UI.jsx';

const suggestions = ['What can you build for me?', 'Tell me about your projects', 'How do we get started?'];

export default function RobotChat({ onPhase, suspended }) {
  const [open, setOpen] = useState(false), [messages, setMessages] = useState([]);
  const [input, setInput] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [available, setAvailable] = useState(null), [voice, setVoice] = useState(false), [speechSupported, setSpeechSupported] = useState(false), [speaking, setSpeaking] = useState(false);
  const request = useRef(null), utterance = useRef(null), voiceEnabled = useRef(false), field = useRef(null), log = useRef(null), trigger = useRef(null);
  const reactionTimer = useRef(null), speechTimer = useRef(null);
  function stopSpeech() {
    clearTimeout(reactionTimer.current); clearTimeout(speechTimer.current);
    if (utterance.current) { utterance.current.onend = null; utterance.current.onerror = null; utterance.current.onstart = null; window.speechSynthesis?.cancel(); utterance.current = null; }
    setSpeaking(false); onPhase('idle');
  }
  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    return () => { request.current?.abort(); request.current = null; clearTimeout(reactionTimer.current); clearTimeout(speechTimer.current); if (utterance.current) { utterance.current.onend = utterance.current.onerror = utterance.current.onstart = null; window.speechSynthesis?.cancel(); } };
  }, []);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch('/api/chat', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => setAvailable(data.available === true)).catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    field.current?.focus({ preventScroll: true });
    // In conversation mode the robot and chat share a row, keeping reactions in view.
    if (matchMedia('(min-width: 761px)').matches) trigger.current?.closest('.hero-art')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    return () => controller.abort();
  }, [open]);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, busy]);
  useEffect(() => { if (suspended) { request.current?.abort(); stopSpeech(); } }, [suspended]);
  useEffect(() => {
    const hide = () => { if (document.hidden) stopSpeech(); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  function speak(text) {
    stopSpeech();
    if (document.hidden) return;
    if (!voiceEnabled.current || !speechSupported) {
      onPhase('responding');
      reactionTimer.current = setTimeout(() => onPhase('idle'), 2600);
      return;
    }
    const speech = new SpeechSynthesisUtterance(text);
    // Prefer a matching installed voice; the browser chooses its default otherwise.
    const language = /[\u0600-\u06ff]/.test(text) ? 'ar' : /\b(bonjour|vous|projet|nous|votre)\b/i.test(text) ? 'fr' : 'en';
    speech.lang = language;
    const selected = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(language));
    if (selected) speech.voice = selected;
    speech.rate = 1; speech.pitch = .92;
    speech.onstart = () => { setSpeaking(true); onPhase('speaking'); };
    speech.onend = speech.onerror = () => { clearTimeout(speechTimer.current); utterance.current = null; setSpeaking(false); onPhase('idle'); };
    utterance.current = speech;
    window.speechSynthesis.speak(speech);
    speechTimer.current = setTimeout(stopSpeech, 90000);
  }
  async function send(text = input) {
    const question = text.trim();
    if (!question || question.length > 2000 || request.current) return;
    stopSpeech(); setError(''); setBusy(true); setInput(''); onPhase('thinking');
    // Keep five complete exchanges plus the current question; never send UI greetings.
    const history = [...messages.slice(-10), { role: 'user', content: question }];
    while (history.length > 1 && new TextEncoder().encode(JSON.stringify({ messages: history })).length > 22000) history.splice(0, 2);
    setMessages(history);
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]) });
      const data = await response.json();
      controller.signal.throwIfAborted();
      if (request.current !== controller || controller.signal.aborted) return;
      if (!response.ok) throw new Error(data.error || 'I could not answer just now. Please try again.');
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The reply was empty. Please try again.');
      setMessages([...history, { role: 'assistant', content: data.reply }]);
      onPhase('idle'); speak(data.reply);
    } catch (failure) {
      if (request.current !== controller) return;
      setMessages(history.slice(0, -1)); setInput(question);
      if (!controller.signal.aborted) setError(failure.name === 'TimeoutError' ? 'The reply timed out. Please try again.' : failure.message);
      onPhase('idle');
    } finally { if (request.current === controller) { request.current = null; setBusy(false); } }
  }
  function close() {
    if (request.current) {
      request.current.abort(); request.current = null; setBusy(false);
      setMessages(history => {
        if (history.at(-1)?.role === 'user') return history.slice(0, -1);
        return history;
      });
    }
    stopSpeech(); setOpen(false); trigger.current?.focus({ preventScroll: true });
  }
  return <div className="robot-chat">
    <button ref={trigger} className="chat-toggle" aria-expanded={open} aria-controls="robot-conversation" onClick={() => open ? close() : setOpen(true)}><span className="chat-toggle-icon" aria-hidden="true">✳</span><span>Talk to A–01<small>Your AI guide to AYNKO</small></span><span className="chat-toggle-arrow" aria-hidden="true">{open ? '−' : '+'}</span></button>
    {open && <section id="robot-conversation" className="chat-panel" aria-label="Conversation with A–01" onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}>
      <div className="chat-toolbar"><span className="eyebrow">A–01 / {busy ? 'THINKING' : speaking ? 'SPEAKING' : 'YOUR AI GUIDE'}</span>{speechSupported && <button type="button" aria-pressed={voice} onClick={() => { const next = !voice; voiceEnabled.current = next; setVoice(next); if (!next) stopSpeech(); }}>Voice {voice ? 'on' : 'off'}</button>}</div>
      <div className="chat-log" role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions text" ref={log} tabIndex={0}>
        <p className="chat-greeting">Hello, I’m A–01. Tell me what you’re imagining, or ask me about the work.</p>
        {messages.map((message, i) => <div key={i} className={`chat-message chat-${message.role}`}><span>{message.role === 'user' ? 'YOU' : 'A–01'}</span><p>{message.content}</p></div>)}
        {busy && <p className="chat-thinking">Connecting the dots<span aria-hidden="true">…</span></p>}
      </div>
      {available === false && <p className="chat-notice">Live AI is currently unavailable. You can still explore the robot’s four actions, or <a href="#contact" onClick={close}>contact the team</a>.</p>}
      {!messages.length && <div className="chat-suggestions">{suggestions.map(text => <button key={text} disabled={busy} onClick={() => send(text)}>{text}<span aria-hidden="true">↗</span></button>)}</div>}
      {error && <p className="chat-error" role="alert">{error}</p>}
      <form className="chat-form" onSubmit={e => { e.preventDefault(); send(); }}>
        <label className="sr-only" htmlFor="robot-question">Ask A–01 a question</label>
        <input ref={field} id="robot-question" value={input} maxLength={2000} placeholder="What would you like to know?" autoComplete="off" onChange={e => setInput(e.target.value)} disabled={busy}/>
        {busy ? <button key="cancel" type="button" onClick={event => { event.preventDefault(); request.current?.abort(); }} aria-label="Cancel reply">■</button> : <button key="send" type="submit" aria-label="Send question" disabled={!input.trim()}><Arrow/></button>}
      </form>
      <div className="chat-footer"><span>AI can make mistakes. Messages are sent to OpenAI. <a href="/privacy.html">Privacy</a></span>{speaking && <button onClick={stopSpeech}>Stop voice</button>}{messages.length > 0 && !busy && <button onClick={() => { stopSpeech(); setMessages([]); setError(''); setInput(''); field.current?.focus(); }}>Clear chat</button>}</div>
    </section>}
    <noscript><p className="chat-notice">Enable JavaScript to chat with A–01.</p></noscript>
  </div>;
}
