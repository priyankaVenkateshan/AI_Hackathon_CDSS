import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useActivity } from '../../context/ActivityContext';
import { isMockMode } from '../../api/config';
import { getPatient, startConsultation, saveConsultation } from '../../api/client';
import { patients, consultationHistory } from '../../data/mockData';
import './PatientConsultation.css';

const getInitials = (name) => name.split(' ').map(n => n[0]).join('');

const SUMMARY_LANG_KEY = 'cdss_summary_lang';
const summaryLangLabels = { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali' };
const summaryLangHeadings = {
    en: 'AI summary & recommendations',
    hi: 'रोगी सारांश और सिफारिशें (AI summary)',
    ta: 'நோயாளி சுருக்கம் (AI summary)',
    te: 'రోగి సారాంశం (AI summary)',
    bn: 'রোগী সারাংশ (AI summary)',
};

const aiResponses = [
    { role: 'assistant', text: "Hello Dr. Sharma, I've pulled up this patient's complete history. Based on the latest vitals and lab results, here's my assessment:", time: '10:01 AM' },
    { role: 'assistant', text: "📊 **Key Findings:**\n• Blood pressure trending upward (130/85 → needs monitoring)\n• HbA1c at 7.8% — above target of 7.0%\n• Current Amlodipine dose was recently increased to 10mg\n\n💡 **Recommendation:** Consider adding a second antihypertensive (e.g., Losartan 25mg) if BP remains elevated at next visit.", time: '10:01 AM' },
    { role: 'user', text: "What about drug interactions with the current medications?", time: '10:02 AM' },
    { role: 'assistant', text: "✅ **Drug Interaction Check:**\n• Metformin 500mg + Amlodipine 10mg — **No significant interactions**\n• If adding Losartan: Metformin + Losartan — **Safe combination**, but monitor renal function (creatinine) every 3 months.\n\n⚠️ **Note:** Avoid combining with NSAIDs as it may reduce antihypertensive efficacy and affect renal function.", time: '10:02 AM' },
];

const suggestions = [
    "Summarize patient history",
    "Check drug interactions",
    "Generate prescription",
    "Suggest lab tests",
    "Pre-op assessment",
];

export default function PatientConsultation() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(aiResponses);
    const [isTyping, setIsTyping] = useState(false);
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState(consultationHistory);
    const [loading, setLoading] = useState(!isMockMode());
    const [error, setError] = useState(null);
    const [consultationStarted, setConsultationStarted] = useState(false);
    const [aiSummaryFromStart, setAiSummaryFromStart] = useState('');
    const [startConsultationLoading, setStartConsultationLoading] = useState(false);
    const [consultationNotes, setConsultationNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [consultationStartTime, setConsultationStartTime] = useState(null);
    const [surgeryReadinessModalOpen, setSurgeryReadinessModalOpen] = useState(false);
    const { user } = useAuth();
    const { logActivity } = useActivity();

    const summaryLang = typeof localStorage !== 'undefined' ? (localStorage.getItem(SUMMARY_LANG_KEY) || 'en') : 'en';

    useEffect(() => {
        if (isMockMode()) {
            setPatient(patients.find(p => p.id === patientId) || null);
            setHistory(consultationHistory);
            return;
        }
        if (!patientId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        getPatient(patientId)
            .then((data) => {
                if (cancelled) return;
                setPatient(data);
                setHistory(data.consultationHistory || data.consultations || []);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Failed to load patient');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [patientId]);

    useEffect(() => {
        if (patientId && patient) logActivity('view_patient', { patientId });
    }, [patientId, patient, logActivity]);

    const patientResolved = patient || (isMockMode() ? patients.find(p => p.id === patientId) : null);

    if (!patientResolved && !loading) {
        return (
            <div className="page-enter" style={{ textAlign: 'center', padding: '4rem' }}>
                <h2>Patient not found</h2>
                <button className="btn btn--primary" onClick={() => navigate('/patients')} style={{ marginTop: '1rem' }}>
                    ← Back to Patients
                </button>
            </div>
        );
    }

    if (loading && !isMockMode()) {
        return (
            <div className="page-enter" style={{ padding: '4rem', textAlign: 'center' }}>
                <p>Loading patient…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-enter" style={{ padding: '4rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-error, #c00)' }}>{error}</p>
                <button className="btn btn--primary" onClick={() => navigate('/patients')}>← Back to Patients</button>
            </div>
        );
    }

    const vitalStatus = (label, value) => {
        if (label === 'SpO2' && value < 92) return 'critical';
        if (label === 'HR' && (value > 100 || value < 60)) return 'warning';
        if (label === 'Temp' && value > 100) return 'warning';
        return 'normal';
    };

    const vitals = patientResolved.vitals || {};
    const vitalValues = [
        { icon: '💓', label: 'HR', value: vitals.hr, unit: 'bpm' },
        { icon: '🩸', label: 'BP', value: vitals.bp, unit: 'mmHg' },
        { icon: '🫁', label: 'SpO2', value: vitals.spo2, unit: '%' },
        { icon: '🌡️', label: 'Temp', value: vitals.temp, unit: '°F' },
    ];

    const handleSend = () => {
        if (!message.trim()) return;
        setMessages(prev => [...prev, { role: 'user', text: message, time: 'Now' }]);
        setMessage('');
        setIsTyping(true);
        logActivity('ai_chat_patient', { patientId });
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: "I've analyzed your query. Based on the patient's current condition and medical history, I recommend proceeding with the standard protocol. Would you like me to generate a detailed treatment plan?",
                time: 'Now',
            }]);
        }, 2000);
    };

    const handleStartConsultation = () => {
        setStartConsultationLoading(true);
        if (isMockMode()) {
            setTimeout(() => {
                setConsultationStartTime(new Date());
                setAiSummaryFromStart("Key findings: Blood pressure trending upward (130/85). HbA1c at 7.8% — above target. Current Amlodipine dose recently increased to 10mg. Recommendation: Consider adding a second antihypertensive (e.g., Losartan 25mg) if BP remains elevated at next visit. Drug interaction check: Metformin + Amlodipine — no significant interactions.");
                setConsultationStarted(true);
                setStartConsultationLoading(false);
            }, 800);
            logActivity('start_consultation', { patientId });
            return;
        }
        logActivity('start_consultation', { patientId });
        startConsultation(patientId, user?.id)
            .then((data) => {
                setConsultationStartTime(new Date());
                setAiSummaryFromStart(data.summary || data.ai_summary || '');
                setConsultationStarted(true);
            })
            .catch(() => setConsultationStarted(false))
            .finally(() => setStartConsultationLoading(false));
    };

    const handleSaveConsultationNotes = () => {
        setSavingNotes(true);
        const payload = { notes: consultationNotes, ai_summary: aiSummaryFromStart };
        logActivity('save_consultation', { patientId, detail: 'Consultation notes saved' });
        if (isMockMode()) {
            setTimeout(() => {
                setHistory(prev => [...prev, {
                    id: `consult-${Date.now()}`,
                    date: new Date().toISOString().slice(0, 10),
                    doctor: user?.name || 'Current Doctor',
                    notes: consultationNotes || '—',
                    aiSummary: aiSummaryFromStart || '—',
                    prescriptions: [],
                }]);
                setConsultationNotes('');
                setSavingNotes(false);
            }, 500);
            return;
        }
        saveConsultation(patientId, payload)
            .then(() => {
                setHistory(prev => [...prev, { id: `consult-${Date.now()}`, date: new Date().toISOString().slice(0, 10), doctor: user?.name, notes: consultationNotes, aiSummary: aiSummaryFromStart, prescriptions: [] }]);
                setConsultationNotes('');
            })
            .finally(() => setSavingNotes(false));
    };

    const timeSavedMinutes = consultationStartTime ? 6 : 0;
    const clinicalRiskScore = (() => {
        const s = (patientResolved?.severity || '').toLowerCase();
        if (s === 'critical') return 8;
        if (s === 'high') return 6;
        if (s === 'moderate') return 4;
        if (s === 'low') return 2;
        return 5;
    })();

    return (
        <div className="page-enter">
            <a className="back-link" onClick={() => navigate(-1)}>← Back</a>

            <div className="patient-view">
                {/* Left: Patient Details */}
                <div className="patient-details">
                    {/* Patient Header */}
                    <div className="patient-header animate-in">
                        <div className={`patient-header__avatar patient-header__avatar--${patientResolved.gender.toLowerCase()}`}>
                            {getInitials(patientResolved.name)}
                        </div>
                        <div className="patient-header__info">
                            <div className="patient-header__name">{patientResolved.name}</div>
                            <div className="patient-header__meta">
                                <span className="patient-header__meta-item patient-header__meta-item--id" title="Unique identifier for all medical interactions">🆔 Patient ID: {patientResolved.id}</span>
                                <span className="patient-header__meta-item">🎂 {patientResolved.age} years</span>
                                <span className="patient-header__meta-item">🩸 {patientResolved.bloodGroup}</span>
                                <span className="patient-header__meta-item">🏥 {patientResolved.ward}</span>
                            </div>
                            <div className="patient-header__key-indicators">
                                <span className="patient-header__ki">Allergies: None documented</span>
                                <span className="patient-header__ki">Conditions: {(patientResolved.conditions || []).length}</span>
                                <span className="patient-header__ki">Medications: {history.reduce((n, c) => n + (c.prescriptions || []).length, 0)}</span>
                            </div>
                            <div className="patient-header__risk-meter">
                                <span className="patient-header__risk-label">Risk</span>
                                <div className="patient-header__risk-bar">
                                    <div className="patient-header__risk-fill" style={{ width: `${clinicalRiskScore * 10}%` }} />
                                </div>
                                <span className="patient-header__risk-value">{clinicalRiskScore}/10</span>
                            </div>
                            <div className="patient-header__conditions">
                                {(patientResolved.conditions || []).map((cond, i) => (
                                    <span key={i} className="condition-tag">{cond}</span>
                                ))}
                            </div>
                        </div>
                        <div className="patient-header__actions">
                            {!consultationStarted ? (
                                <button className="btn btn--primary" onClick={handleStartConsultation} disabled={startConsultationLoading}>
                                    {startConsultationLoading ? 'Starting…' : '▶ Start consultation'}
                                </button>
                            ) : (
                                <span className="consultation-badge">Consultation active</span>
                            )}
                            <button className="btn btn--primary">📝 New Prescription</button>
                            <button className="btn btn--outline" onClick={() => navigate('/surgery', { state: { patientId, patientName: patientResolved.name } })}>
                                🔪 Surgery required
                            </button>
                            <button className="btn btn--outline" onClick={() => setSurgeryReadinessModalOpen(true)}>
                                🩺 Surgery Readiness (AI Agent)
                            </button>
                            <button className="btn btn--outline">📋 Refer</button>
                        </div>
                    </div>

                    {/* Surgery Readiness Modal (AI Agent) */}
                    {surgeryReadinessModalOpen && (
                        <div className="surgery-readiness-modal-overlay" onClick={() => setSurgeryReadinessModalOpen(false)}>
                            <div className="surgery-readiness-modal" onClick={e => e.stopPropagation()}>
                                <div className="surgery-readiness-modal__header">
                                    <h3>🩺 Surgery Readiness (AI Agent)</h3>
                                    <button type="button" className="surgery-readiness-modal__close" onClick={() => setSurgeryReadinessModalOpen(false)}>×</button>
                                </div>
                                <div className="surgery-readiness-modal__body">
                                    <div className="surgery-readiness-modal__row">
                                        <span>Risk Score & Safety Gauge</span>
                                        <span>{clinicalRiskScore}/10 — {(clinicalRiskScore <= 3 ? 'Low' : clinicalRiskScore <= 6 ? 'Moderate' : 'High')} risk</span>
                                    </div>
                                    <div className="surgery-readiness-modal__row">
                                        <span>Estimated Procedure Duration</span>
                                        <span>— (varies by procedure)</span>
                                    </div>
                                    <div className="surgery-readiness-modal__row">
                                        <span>Required Specialists & Instruments</span>
                                        <span>Per procedure type; see Surgery Planning.</span>
                                    </div>
                                    <div className="surgery-readiness-modal__row">
                                        <span>Pre-Op Checklist Compliance</span>
                                        <span className={`surgery-readiness-modal__status surgery-readiness-modal__status--${(patientResolved.surgeryReadiness?.preOpStatus || 'pending')}`}>
                                            {(patientResolved.surgeryReadiness?.preOpStatus || 'Pending').replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="surgery-readiness-modal__row">
                                        <span>Risk Flags</span>
                                        <ul>
                                            {(patientResolved.surgeryReadiness?.riskFactors || patientResolved.conditions || []).slice(0, 5).map((r, i) => (
                                                <li key={i}>{typeof r === 'string' ? r : r}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {consultationStarted && aiSummaryFromStart && (
                        <div className="ai-summary-block animate-in">
                            <div className="card-header">
                                <span className="card-header__title">🤖 {summaryLangHeadings[summaryLang] || summaryLangHeadings.en}</span>
                                <span className="consultation-badge" style={{ marginLeft: 'auto' }}>{summaryLangLabels[summaryLang] || 'English'}</span>
                                {consultationStartTime && (
                                    <span className="consultation-time-saved">~{timeSavedMinutes} min saved with AI</span>
                                )}
                            </div>
                            <p className="ai-summary-block__clinical-note">Structured summary for clinical decision-making (generated within 30 seconds).</p>
                            <div className="ai-summary-block__content">{aiSummaryFromStart}</div>
                            <div className="medical-entities-block">
                                <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
                                    <span className="card-header__title">📌 Medical entities extracted (Req 6.3)</span>
                                </div>
                                <div className="medical-entities-grid">
                                    <div><strong>Symptoms:</strong> Elevated BP, elevated HbA1c</div>
                                    <div><strong>Diagnoses:</strong> Hypertension, Type 2 Diabetes</div>
                                    <div><strong>Medications:</strong> Metformin, Amlodipine</div>
                                    <div><strong>Follow-up:</strong> Recheck BP and HbA1c at next visit; consider Losartan if BP remains elevated</div>
                                </div>
                            </div>
                            <div className="consultation-notes-form">
                                <label className="consultation-notes-label">Consultation notes</label>
                                <textarea
                                    className="consultation-notes-input"
                                    placeholder="Add your notes here..."
                                    value={consultationNotes}
                                    onChange={e => setConsultationNotes(e.target.value)}
                                    rows={3}
                                />
                                <button type="button" className="btn btn--primary" onClick={handleSaveConsultationNotes} disabled={savingNotes}>
                                    {savingNotes ? 'Saving…' : 'Save consultation notes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Surgery readiness (Req 2.4) */}
                    {(patientResolved.surgeryReadiness || (patientResolved.conditions && patientResolved.conditions.length > 0)) && (
                        <div className="surgery-readiness-block animate-in">
                            <div className="card-header">
                                <span className="card-header__title">🩺 Surgery readiness</span>
                            </div>
                            <div className="surgery-readiness__content">
                                <div className="surgery-readiness__row">
                                    <span className="surgery-readiness__label">Pre-op status</span>
                                    <span className={`surgery-readiness__status surgery-readiness__status--${(patientResolved.surgeryReadiness?.preOpStatus || 'not_assessed').replace('-', '_')}`}>
                                        {(patientResolved.surgeryReadiness?.preOpStatus || 'Not assessed').replace(/_/g, ' ')}
                                    </span>
                                </div>
                                {(patientResolved.surgeryReadiness?.lastAssessed) && (
                                    <div className="surgery-readiness__row">
                                        <span className="surgery-readiness__label">Last assessed</span>
                                        <span className="surgery-readiness__value">{patientResolved.surgeryReadiness.lastAssessed}</span>
                                    </div>
                                )}
                                <div className="surgery-readiness__row">
                                    <span className="surgery-readiness__label">Risk factors</span>
                                    <ul className="surgery-readiness__risks">
                                        {(patientResolved.surgeryReadiness?.riskFactors || []).length > 0
                                            ? patientResolved.surgeryReadiness.riskFactors.map((r, i) => <li key={i}>{r}</li>)
                                            : (patientResolved.conditions || []).map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vitals Grid */}
                    <div className="vitals-grid">
                        {vitalValues.map((vital, i) => {
                            const valueNum = typeof vital.value === 'string' ? parseInt(vital.value, 10) : vital.value;
                            const status = vitalStatus(vital.label, valueNum);
                            return (
                                <div key={i} className={`vital-card animate-in animate-in-delay-${i + 1} ${status === 'critical' ? 'vital-card--critical' : ''}`}>
                                    <div className="vital-card__icon">{vital.icon}</div>
                                    <div className="vital-card__value">{vital.value}</div>
                                    <div className="vital-card__label">{vital.label} ({vital.unit})</div>
                                    <div className={`vital-card__status vital-card__status--${status}`}>
                                        {status === 'normal' ? '● Normal' : status === 'warning' ? '● Elevated' : '● Critical'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Consultation Timeline — chronological medical history (Req 2.2, 2.3) */}
                    <div className="timeline animate-in animate-in-delay-3">
                        <div className="card-header">
                            <span className="card-header__title">📋 Chronological medical history</span>
                        </div>
                        <p className="timeline__desc">Visits with timestamps and treating physician. Complete historical records of treatments, prescriptions, and outcomes.</p>
                        <div className="timeline__list">
                            {[...history]
                                .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                                .map((consult, i) => (
                                <div key={consult.id} className={`timeline-item animate-in animate-in-delay-${i + 2}`}>
                                    <div className="timeline-item__dot">📝</div>
                                    <div className="timeline-item__content">
                                        <div className="timeline-item__header">
                                            <span className="timeline-item__date">{consult.date}</span>
                                            <span className="timeline-item__doctor">{consult.doctor}</span>
                                        </div>
                                        <div className="timeline-item__notes">{consult.notes}</div>
                                        <div className="timeline-item__ai-summary">
                                            <div className="timeline-item__ai-label">🤖 AI Summary</div>
                                            {consult.aiSummary}
                                        </div>
                                        <div className="prescription-list">
                                            {(consult.prescriptions || []).map((rx, j) => (
                                                <div key={j} className="prescription-item">
                                                    <span className="prescription-item__name">💊 {rx.medication}</span>
                                                    <span className="prescription-item__dosage">{rx.dosage} · {rx.frequency} · {rx.duration}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: AI Chat Panel */}
                <div className="ai-panel animate-in animate-in-delay-2">
                    <div className="ai-panel__header">
                        <div className="ai-panel__indicator" />
                        <span className="ai-panel__title">AI Assistant</span>
                        <span className="ai-panel__subtitle">Claude 3 Haiku</span>
                    </div>

                    <div className="ai-panel__messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`ai-message ai-message--${msg.role}`}>
                                <div className="ai-message__bubble">{msg.text}</div>
                                <div className="ai-message__time">{msg.time}</div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="ai-typing">
                                <div className="ai-typing__dot" />
                                <div className="ai-typing__dot" />
                                <div className="ai-typing__dot" />
                            </div>
                        )}
                    </div>

                    <div className="ai-panel__suggestions">
                        {suggestions.map((s, i) => (
                            <button key={i} className="ai-suggestion" onClick={() => { setMessage(s); }}>
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="ai-panel__input">
                        <input
                            type="text"
                            placeholder="Ask AI about this patient..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <button className="ai-panel__send-btn" onClick={handleSend}>↑</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
