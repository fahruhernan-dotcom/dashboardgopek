// =============================================================
// TernakOS — AI Operating System Hook (Phase 2)
// File: src/lib/useAIAssistant.js
//
// Layers: Dual Context, Undo, Retry, Partial Success,
//         History Persistence, Dirty Tracking, Entry Isolation
// =============================================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import { supabase } from './supabase'
import { buildSystemPrompt } from './aiPrompt'
import { toast } from 'sonner'
import { validateBusinessRules } from './aiValidation'
import { useBusinessSnapshot } from './useBusinessSnapshot'
// eslint-disable-next-line no-unused-vars -- AI transaction inserter; not yet wired to current chat flow but is intended insertion path
import { insertBusinessData } from './aiTransactionInserter'
import { useAIQuota } from './hooks/useAIQuota'
import { AI_PLAN_CONFIG } from './constants/planGating'

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

// ── AGENT STATES ────────────────────────────────────────────
export const AGENT_STATE = {
  IDLE: 'IDLE',
  PRE_CHECKING: 'PRE_CHECKING',
  THINKING: 'THINKING',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  AWAITING_CLARIFICATION: 'AWAITING_CLARIFICATION',
  ERROR: 'ERROR',
}

// ── Module-level cache & rate limiter ───────────────────────
const intentCache = new Map()
let requestHistory = []

const hashString = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

const checkRateLimit = () => {
  const now = Date.now()
  requestHistory = requestHistory.filter(ts => now - ts < 60000)
  if (requestHistory.length >= 20) return false
  requestHistory.push(now)
  return true
}

const fuzzyScore = (a, b) => {
  const norm = s => s.toLowerCase().replace(/\b(pak|bu|ibu|cv|ud|rpa|pt|toko|farm|kandang)\b/g, '').replace(/[^a-z0-9]/g, '').trim()
  const na = norm(a), nb = norm(b)
  if (!na || !nb) return 0
  if (na === nb) return 1.0
  if (na.includes(nb) || nb.includes(na)) return 0.85
  const shorter = na.length <= nb.length ? na : nb
  const longer = na.length <= nb.length ? nb : na
  let matches = 0
  const used = new Array(longer.length).fill(false)
  for (const ch of shorter) {
    const idx = longer.split('').findIndex((c, i) => c === ch && !used[i])
    if (idx !== -1) { matches++; used[idx] = true }
  }
  return matches / longer.length
}

const INTENT_TABLE_MAP = {
  CATAT_PEMBELIAN: 'purchases', CATAT_PENJUALAN: 'sales', CATAT_BAYAR: 'payments',
  CATAT_PENGIRIMAN: 'deliveries', CATAT_HARIAN: 'daily_records', CATAT_PAKAN: 'feed_stocks',
  CATAT_PANEN: 'harvest_records', CATAT_PENGELUARAN: 'cycle_expenses',
  BUAT_INVOICE: 'rpa_invoices', CATAT_ORDER: 'orders', TAMBAH_PRODUK: 'rpa_products',
}

const ENTITY_MAP = {
  CATAT_PEMBELIAN:   [{ nameField: 'supplier_name', idField: 'supplier_id', snapshotKey: 'suppliers' }],
  CATAT_PENJUALAN:   [{ nameField: 'rpa_name',      idField: 'rpa_id',      snapshotKey: 'rpas' }],
  CATAT_BAYAR:       [{ nameField: 'payer_name',    idField: 'payer_id',    snapshotKey: 'rpas' }],
  CATAT_PENGIRIMAN:  [],
  BUAT_INVOICE:      [{ nameField: 'customer_name', idField: 'customer_id', snapshotKey: 'customers' }],
  CATAT_ORDER:       [],
  TAMBAH_PRODUK:     [],
  CATAT_HARIAN:      [{ nameField: 'farm_name', idField: 'farm_id', snapshotKey: 'farms' }],
  CATAT_PAKAN:       [{ nameField: 'farm_name', idField: 'farm_id', snapshotKey: 'farms' }],
  CATAT_PANEN:       [{ nameField: 'farm_name', idField: 'farm_id', snapshotKey: 'farms' }],
  CATAT_PENGELUARAN: [{ nameField: 'farm_name', idField: 'farm_id', snapshotKey: 'farms' }],
}

// ── UNDO TIMER ──────────────────────────────────────────────
const UNDO_WINDOW_MS = 8000

// =============================================================
// HOOK
// =============================================================
export function useAIAssistant({ userType, contextPage }) {
  const { profile, tenant } = useAuth()
  const { getAccumulatedTotal, getParentContext } = useBusinessSnapshot()
  const aiQuota = useAIQuota(tenant)

  // ── Core State ────────────────────────────────────────────
  const [messages, setMessages] = useState([])
  const [agentState, setAgentState] = useState(AGENT_STATE.IDLE)
  const [pendingEntries, setPendingEntries] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [error, setError] = useState(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // ── Dual Context: Long-term summary ───────────────────────
  const [conversationSummary, setConversationSummary] = useState('')

  // ── Undo State ────────────────────────────────────────────
  const [undoEntry, setUndoEntry] = useState(null) // { id, data, timer }
  const undoTimerRef = useRef(null)

  // ── Entry Result Tracking (partial success) ───────────────
  const [entryResults, setEntryResults] = useState({})
  // { [entryId]: { status: 'confirmed'|'failed'|'undone', error?: string } }

  // ── Dependency Map ────────────────────────────────────────
  // Maps AI-generated ID (string) to the actual UUID of the pending entry
  const [_aiIdToEntryIdMap, setAiIdToEntryIdMap] = useState({})

  // ── Last failed message for retry ─────────────────────────
  const [lastFailedMessage, setLastFailedMessage] = useState(null)

  // ── Snapshot cache (avoid rebuilding on every message) ────
  const snapshotCacheRef = useRef(null) // { data, timestamp }
  const SNAPSHOT_TTL_MS = 90 * 1000 // 90 seconds

  // ═════════════════════════════════════════════════════════
  // HISTORY PERSISTENCE — Load last conversation on mount
  // ═════════════════════════════════════════════════════════
  useEffect(() => {
    if (!tenant?.id || !profile?.id || historyLoaded) return
    const loadHistory = async () => {
      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data } = await supabase
          .from('ai_conversations')
          .select('id, messages, metadata')
          .eq('tenant_id', tenant.id)
          .eq('profile_id', profile.id)
          .eq('user_type', userType)
          .gte('created_at', cutoff)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data) {
          const rawMessages = data.messages || []
          // Smart Load: last 10 messages only + set summary if longer
          if (rawMessages.length > 10) {
            const older = rawMessages.slice(0, -10)
            const summaryText = older
              .filter(m => m.role === 'assistant' && m.intent)
              .map(m => `[${m.intent}] ${m.content}`)
              .slice(-3)
              .join(' | ')
            setConversationSummary(summaryText || '')
            setMessages(rawMessages.slice(-10))
          } else {
            setMessages(rawMessages)
          }
          setConversationId(data.id)
        }
      } catch (err) {
        console.error('[AI] History load failed:', err)
      }
      setHistoryLoaded(true)
    }
    loadHistory()
  }, [tenant?.id, profile?.id, userType, historyLoaded])

  // ═════════════════════════════════════════════════════════
  // BUILD CONTEXT SNAPSHOT
  // ═════════════════════════════════════════════════════════
  const buildContextSnapshot = useCallback(async (forceRefresh = false) => {
    if (!tenant?.id) return {}
    // Return cached snapshot if still fresh
    const now = Date.now()
    if (!forceRefresh && snapshotCacheRef.current &&
        (now - snapshotCacheRef.current.timestamp < SNAPSHOT_TTL_MS)) {
      return snapshotCacheRef.current.data
    }
    const snapshot = { farms: [], rpas: [], customers: [], suppliers: [], products: [], vehicles: [], drivers: [] }
    try {
      if (userType === 'broker') {
        const [rpasRes, farmsRes, vehiclesRes, driversRes] = await Promise.all([
          supabase.from('rpa_clients').select('id, rpa_name').eq('tenant_id', tenant.id).eq('is_deleted', false).order('created_at', { ascending: false }).limit(25),
          supabase.from('farms').select('id, farm_name, owner_name').eq('tenant_id', tenant.id).eq('is_deleted', false).order('created_at', { ascending: false }).limit(25),
          supabase.from('vehicles').select('id, vehicle_plate, vehicle_type').eq('tenant_id', tenant.id).eq('status', 'aktif').eq('is_deleted', false).limit(25),
          supabase.from('drivers').select('id, full_name, phone').eq('tenant_id', tenant.id).eq('status', 'aktif').eq('is_deleted', false).limit(25),
        ])
        snapshot.rpas = (rpasRes.data || []).map(r => ({ id: r.id, name: r.rpa_name }))
        snapshot.farms = (farmsRes.data || []).map(f => ({ id: f.id, name: f.farm_name }))
        snapshot.vehicles = (vehiclesRes.data || []).map(v => ({ id: v.id, name: v.vehicle_plate, type: v.vehicle_type }))
        snapshot.drivers = (driversRes.data || []).map(d => ({ id: d.id, name: d.full_name, phone: d.phone }))
        const ownerMap = new Map()
        ;(farmsRes.data || []).forEach(f => { if (f.owner_name && !ownerMap.has(f.owner_name)) ownerMap.set(f.owner_name, f.id) })
        snapshot.suppliers = Array.from(ownerMap.entries()).map(([name, id]) => ({ id, name }))
      } else if (userType === 'peternak') {
        const { data: farms } = await supabase.from('peternak_farms').select('id, farm_name').eq('tenant_id', tenant.id).eq('is_deleted', false).limit(25)
        snapshot.farms = (farms || []).map(f => ({ id: f.id, name: f.farm_name }))
      } else if (userType === 'rpa') {
        const { data: customers } = await supabase.from('rpa_customers').select('id, customer_name').eq('tenant_id', tenant.id).eq('is_deleted', false).limit(25)
        snapshot.customers = (customers || []).map(c => ({ id: c.id, name: c.customer_name }))
        const { data: products } = await supabase.from('rpa_products').select('id, product_name, sell_price').eq('tenant_id', tenant.id).eq('is_deleted', false).limit(25)
        snapshot.products = (products || []).map(p => ({ id: p.id, name: p.product_name, sell_price: p.sell_price }))
      }
    } catch (err) { console.error('[AI] Snapshot error:', err) }
    snapshotCacheRef.current = { data: snapshot, timestamp: Date.now() }
    return snapshot
  }, [tenant?.id, userType, SNAPSHOT_TTL_MS])

  // ═════════════════════════════════════════════════════════
  // PARSE AI RESPONSE
  // ═════════════════════════════════════════════════════════
  // eslint-disable-next-line no-unused-vars -- core AI response parser; maintained for direct invocation path
  const parseAIResponse = (raw) => {
    let cleaned = (raw || '').trim()
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (match) cleaned = match[0]
    else cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim()
    try { return JSON.parse(cleaned) } catch (err) {
      console.error('[AI] JSON parse failed:', err)
      return { intent: 'TIDAK_DIKENALI', data: {}, confidence: 0, clarification: 'Gagal memproses respons.', display_summary: 'Error parsing.' }
    }
  }

  // ═════════════════════════════════════════════════════════
  // SAVE CONVERSATION
  // ═════════════════════════════════════════════════════════
  const saveConversation = useCallback(async (allMessages, snapshot, telemetry = {}) => {
    if (!tenant?.id || !profile?.id) return null
    const messagesForDB = allMessages.map(m => ({
      role: m.role, content: m.content, timestamp: m.timestamp,
      ...(m.intent ? { intent: m.intent } : {}),
      ...(m.confidence !== undefined ? { confidence: m.confidence } : {}),
    }))

    const payload = {
      messages: messagesForDB,
      metadata: { ...telemetry, summary: conversationSummary, last_updated: new Date().toISOString() },
    }

    if (conversationId) {
      await supabase.from('ai_conversations').update(payload).eq('id', conversationId)
      return conversationId
    }

    const { data, error: insertError } = await supabase.from('ai_conversations')
      .insert({
        ...payload,
        tenant_id: tenant.id, profile_id: profile.id,
        user_type: userType, context_page: contextPage || null, context_snapshot: snapshot || null,
      }).select('id').single()

    if (insertError) { console.error('[AI] Conversation insert error:', insertError); return null }
    setConversationId(data.id)
    return data.id
  }, [tenant?.id, profile?.id, conversationId, userType, contextPage, conversationSummary])

  // ═════════════════════════════════════════════════════════
  // DUAL CONTEXT: SUMMARIZE when messages grow
  // ═════════════════════════════════════════════════════════
  const updateSummary = useCallback(() => {
    if (messages.length <= 12) return
    // Compress older messages into summary, keep raw last 5
    const olderMessages = messages.slice(0, -5)
    const summaryParts = olderMessages
      .filter(m => m.intent || m.role === 'user')
      .map(m => {
        if (m.role === 'user') return `User: "${m.content.substring(0, 60)}"`
        return `[${m.intent}] ${m.content.substring(0, 80)}`
      })
      .slice(-6) // keep last 6 summary items

    setConversationSummary(summaryParts.join(' → '))
  }, [messages])

  useEffect(() => { updateSummary() }, [messages.length, updateSummary])

  // ── Dependency Helpers ─────────────────────────────────────
  const isEntryLocked = useCallback((entry) => {
    if (!entry.dependency_id) return false
    // Check if the parent entry (dependency) is already confirmed
    const parentResult = entryResults[entry.dependency_id]
    return parentResult?.status !== 'confirmed'
  }, [entryResults])

  // ═════════════════════════════════════════════════════════
  // ENTITY RESOLUTION
  // ═════════════════════════════════════════════════════════
  const resolveEntities = useCallback((intent, extractedData, snapshot) => {
    const entityDefs = ENTITY_MAP[intent] ?? []
    const unresolved = []
    for (const { nameField, idField, snapshotKey } of entityDefs) {
      const extractedName = extractedData[nameField]
      if (extractedData[idField] || !extractedName) continue
      const pool = snapshot[snapshotKey] ?? []
      const candidates = pool
        .map(item => ({ id: item.id, name: item.name, score: fuzzyScore(extractedName, item.name) }))
        .filter(c => c.score >= 0.6).sort((a, b) => b.score - a.score).slice(0, 4)
      unresolved.push({ nameField, idField, extractedName, candidates })
    }
    return unresolved
  }, [])

  // ═════════════════════════════════════════════════════════
  // PROCESS AI RESULT → PENDING ENTRIES
  // ═════════════════════════════════════════════════════════
  const processAIParsedResult = useCallback(async (parsed, snapshot, telemetry = {}, _anomalies = []) => {
    let intents = parsed.intents || []
    if (intents.length === 0 && parsed.intent) {
      intents = [{ intent: parsed.intent, data: parsed.data ?? {}, confidence: parsed.confidence ?? 1.0, clarification: parsed.clarification ?? null }]
    }

    // ── AUTO-ESTIMATE CHICKEN COUNT (QTY_EKOR) ──────────────
    // Priority: Weight (kg) is king. If count is missing, estimate it.
    intents = intents.map(item => {
      if (['CATAT_PEMBELIAN', 'CATAT_PENJUALAN'].includes(item.intent)) {
        const data = item.data || {}
        if (!data.qty_ekor && data.weight_kg > 0) {
          data.qty_ekor = Math.round(data.weight_kg / 1.85)
          item.data = data
        }
      }
      return item
    })

    const firstIntent = intents[0]
    const assistantMsg = {
      role: 'assistant',
      content: parsed.display_summary || 'Siap boss!',
      timestamp: new Date().toISOString(),
      intent: firstIntent?.intent,
      usage: telemetry.token_usage, // Pass usage to UI
      provider: telemetry.provider, // Pass provider to UI
    }
    
    // ── HEURISTIC FALLBACK: Repair missing dependencies ──
    const potentialParents = intents
      .filter(it => ['CATAT_PEMBELIAN', 'CATAT_PENJUALAN'].includes(it.intent))
      .map(it => it.id)

    intents = intents.map((item, idx) => {
      // Heuristic for Delivery & Payment
      if (['CATAT_PENGIRIMAN', 'CATAT_BAYAR'].includes(item.intent) && !item.dependency) {
        // Find the closest preceding parent
        const closestParent = intents
          .slice(0, idx)
          .reverse()
          .find(it => ['CATAT_PEMBELIAN', 'CATAT_PENJUALAN'].includes(it.intent))
        
        if (closestParent) {
          return { ...item, dependency: closestParent.id }
        }
        
        // If not preceding, but only one parent exists in the message total
        if (potentialParents.length === 1) {
          return { ...item, dependency: potentialParents[0] }
        }
      }
      return item
    })

    setMessages(prev => [...prev, assistantMsg])

    if (firstIntent?.intent === 'TANYA_DATA' || firstIntent?.intent === 'TIDAK_DIKENALI') {
      setAgentState(AGENT_STATE.IDLE)
      return
    }

    // --- SAVE CONVERSATION & GENERATE DRAFTS ---
    const convId = await saveConversation([...messages, assistantMsg], snapshot, telemetry)
    if (convId) {
      // 🚀 TURBO: Fetch all business context upfront
      const contextResults = await Promise.all(intents.map(async (item) => {
        if (item.intent === 'KOREKSI' || item.intent === 'TANYA_DATA') return null
        const parentId = item.dependency || item.data?.sale_id || item.data?.purchase_id
        const type = item.intent === 'CATAT_PENGIRIMAN' ? 'DELIVERY' : item.intent === 'CATAT_BAYAR' ? 'PAYMENT' : null
        
        const [accumulatedTotal, parentContext] = await Promise.all([
          getAccumulatedTotal(parentId, type),
          getParentContext(parentId, item.intent)
        ])
        
        return { accumulatedTotal, parentContext, snapshot }
      }))

      // ── CORRECTIONS: handle first, synchronously ──────────
      for (const item of intents.filter(i => i.intent === 'KOREKSI')) {
        if (pendingEntries.length > 0) {
          const last = pendingEntries[pendingEntries.length - 1]
          const field = item.data?.field_to_fix
          if (field && item.data?.new_value !== undefined) {
            const patched = {
              ...last,
              extracted_data: { ...last.extracted_data, [field]: item.data.new_value },
              _dirty: { ...(last._dirty || {}), [field]: { original: last.extracted_data[field], edited: item.data.new_value } },
            }
            await supabase.from('ai_pending_entries').update({ extracted_data: patched.extracted_data }).eq('id', last.id)
            setPendingEntries(prev => [...prev.slice(0, -1), patched])
            toast.success('Data dikoreksi')
          }
        }
      }

      // ── DATA INTENTS: batch insert in ONE DB round trip ───
      const dataIntents = intents.filter(i => i.intent !== 'KOREKSI')
      if (dataIntents.length > 0) {
        // Pre-compute validations (synchronous), keeping index aligned to dataIntents
        const dataContextResults = dataIntents.map(item => contextResults[intents.indexOf(item)])
        const preValidations = dataIntents.map((item, i) =>
          validateBusinessRules({
            intent: item.intent, extracted_data: item.data,
            _ai_id: item.id, dependency_id: item.dependency
          }, pendingEntries, dataContextResults[i])
        )

        // Single batch insert — N intents → 1 DB round trip
        const { data: batchEntries } = await supabase
          .from('ai_pending_entries')
          .insert(dataIntents.map(item => ({
            conversation_id: convId, tenant_id: tenant.id, profile_id: profile.id,
            intent: item.intent,
            extracted_data: { ...(item.data ?? {}), _ai_id: item.id, _dependency_ai_id: item.dependency },
            target_table: INTENT_TABLE_MAP[item.intent] || null,
            status: 'pending', confidence: item.confidence ?? 1.0, raw_ai_response: parsed,
          })))
          .select()

        if (batchEntries?.length) {
          // Build AI-id → DB UUID map from results (order is preserved by Supabase)
          const localAiIdMap = {}
          batchEntries.forEach((entry, i) => {
            const aiId = dataIntents[i]?.id
            if (aiId) localAiIdMap[aiId] = entry.id
          })

          const insertedEntries = batchEntries.map((entry, i) => {
            const item = dataIntents[i]
            return {
              ...entry,
              dependency_id: item.dependency ? (localAiIdMap[item.dependency] || null) : null,
              _unresolved: resolveEntities(item.intent, item.data ?? {}, snapshot),
              _original_data: { ...(item.data ?? {}) },
              status: 'pending',
              _validation: preValidations[i],
              _context: dataContextResults[i],
              _anomalies: [],
              _clarification: item.clarification || null,
            }
          })

          setAiIdToEntryIdMap(prev => ({ ...prev, ...localAiIdMap }))
          setPendingEntries(prev => [...prev, ...insertedEntries])
        }
      }
    }

    // Set final status
    if (firstIntent?.clarification || firstIntent?.confidence < 0.8) {
      setAgentState(AGENT_STATE.AWAITING_CLARIFICATION)
    } else {
      setAgentState(AGENT_STATE.AWAITING_CONFIRMATION)
    }
  }, [messages, tenant, profile, saveConversation, pendingEntries, resolveEntities, getAccumulatedTotal, getParentContext])

  // ═════════════════════════════════════════════════════════
  // SEND MESSAGE (Updated to Edge Functions)
  // ═════════════════════════════════════════════════════════
  const abortControllerRef = useRef(null)

  const cancelAI = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setAgentState(AGENT_STATE.IDLE)
      toast.info('Proses dihentikan.')
    }
  }, [])

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage?.trim() || !tenant?.id || !profile?.id) return
    setError(null)
    setLastFailedMessage(null)

    if (!checkRateLimit()) { toast.error('Pelan-pelan boss! Max 15 pesan/menit.'); return }

    // ── QUOTA CHECK ───────────────────────────────────────
    if (aiQuota.quotaStatus === 'exceeded') {
      const errMsg = 'Kuota AI bulan ini sudah habis. Silakan upgrade plan untuk lanjut.'
      setMessages(prev => [...prev, { role: 'user', content: userMessage.trim(), timestamp: new Date().toISOString() }])
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg, timestamp: new Date().toISOString(), isQuotaBlocked: true }])
      setAgentState(AGENT_STATE.IDLE)
      return
    }

    const userMsg = { role: 'user', content: userMessage.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setAgentState(AGENT_STATE.PRE_CHECKING)

    const startTime = Date.now()
    try {
      const normalizeQuery = userMessage.toLowerCase().trim()

      // ── PRE-CHECK ROUTING ─────────────────────────────────
      const preCheck = [
        { reg: /^(ping|cek koneksi|test|tes|p)$/i, res: 'Pong! Koneksi aman bossku. ⚡' },
        { reg: /^(halo|hi|hai|halo ai|bot|halo bot)$/i, res: `Halo ${profile.full_name}! Ada transaksi yang mau dicatat?` },
        { reg: /^(siapa (ini|kamu)|nama kamu)$/i, res: 'Saya TernakOS AI, asisten bisnismu.' },
      ].find(r => r.reg.test(normalizeQuery))

      if (preCheck) {
        setMessages(prev => [...prev, { role: 'assistant', content: preCheck.res, timestamp: new Date().toISOString() }])
        setAgentState(AGENT_STATE.IDLE)
        return
      }

      setAgentState(AGENT_STATE.THINKING)

      // ── CACHE CHECK ───────────────────────────────────────
      const qHash = hashString(`${tenant.id}:${normalizeQuery}`)
      if (intentCache.has(qHash)) {
        const cached = intentCache.get(qHash)
        await processAIParsedResult(cached.parsed, await buildContextSnapshot(), cached.telemetry, cached.anomalies)
        return
      }

      // ── API Keys ──────────────────────────────────────────
      const maiaApiKey = import.meta.env.VITE_MAIA_API_KEY
      const maiaModel = import.meta.env.VITE_AI_MODEL || 'xai/grok-4-1-fast-reasoning-latest'
      const glmApiKey = import.meta.env.VITE_GLM_API_KEY

      if (!maiaApiKey && !glmApiKey) throw new Error('API Key belum diisi di .env!')

      // ── ABORT CONTROLLER ─────────────────────────────────
      if (abortControllerRef.current) abortControllerRef.current.abort()
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      const shortTermMemory = messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
      const snapshot = await buildContextSnapshot()
      const systemPrompt = buildSystemPrompt({
        userType, businessName: tenant.business_name || '', userName: profile.full_name || '',
        contextPage, snapshot, today: new Date().toISOString().split('T')[0],
        vertical: tenant?.business_vertical || 'generic',
        businessModel: 'generic',
      })

      // ── SHARED REQUEST BODY ───────────────────────────────
      const requestTools = [{
        type: "function",
        function: {
          name: "submit_transaction",
          description: "Kirim data transaksi ke sistem TernakOS.",
          parameters: {
            type: "object",
            properties: {
              intents: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id:            { type: "string" },
                    intent:        { type: "string" },
                    data:          { type: "object" },
                    dependency:    { type: "string" },
                    confidence:    { type: "number" },
                    clarification: { type: "string" }
                  }
                }
              },
              display_summary: { type: "string" }
            },
            required: ["intents", "display_summary"]
          }
        }
      }]
      const requestBase = {
        temperature: normalizeQuery.includes('?') ? 0.7 : 0.1,
        messages: [{ role: 'system', content: systemPrompt }, ...shortTermMemory, { role: 'user', content: userMessage }],
        tools: requestTools,
        tool_choice: "auto",
      }

      // ── AI FETCH ──────────────────────────────────────────
      const fetchAI = async (url, key, body, timeoutMs) => {
        const combinedSignal = typeof AbortSignal.any === 'function'
          ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])
          : signal
        console.log('[AI] Request →', body.model, JSON.stringify(body).slice(0, 400))
        const res = await fetch(url, {
          method: 'POST', signal: combinedSignal,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          let errDetail = ''
          try { errDetail = await res.text() } catch { /* ignore */ }
          console.error('[AI] API error', body.model, res.status, errDetail)
          throw new Error(`${body.model} ${res.status}: ${errDetail.slice(0, 200)}`)
        }
        return res.json()
      }

      // ── MULTI-PROVIDER FAILOVER ───────────────────────────
      let parsed = null
      let activeProvider = null
      let usage = null

      // Helper: parse response (tool_calls atau content JSON)
      const parseResult = (result) => {
        const choice = result.choices?.[0]?.message
        if (choice?.tool_calls?.length > 0) {
          try { return JSON.parse(choice.tool_calls[0].function.arguments) } catch { /* fall through */ }
        }
        const raw = choice?.content || choice?.reasoning_content || ''
        if (raw) {
          const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
          if (match) {
            try { return JSON.parse(match[0]) } catch { /* fall through */ }
          }
          return { intents: [], display_summary: raw }
        }
        return { intents: [], display_summary: 'Maaf, tidak bisa memproses permintaan ini.' }
      }

      const maiaUrl = 'https://api.maiarouter.ai/v1/chat/completions'
      const glmUrl  = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

      // Both providers: no tools — rely on JSON-in-content parsing.
      // Reasoning models (grok-4-1-fast-reasoning) hang when tools are attached.
      const maiaBody = {
        model: maiaModel,
        temperature: requestBase.temperature,
        messages: requestBase.messages,
      }
      const glmBody = {
        model: 'glm-4.7-flash',
        temperature: requestBase.temperature,
        messages: requestBase.messages,
      }

      try {
        // Step 1: MAIA — without tools, reasoning model should respond in ~20s
        const result = await fetchAI(maiaUrl, maiaApiKey, maiaBody, 25000)
        activeProvider = 'MAIA'
        usage = result.usage
        parsed = parseResult(result)
      } catch (maiaErr) {
        console.warn('[AI] MAIA failed, falling back to GLM...', maiaErr.message)
        // Step 2: GLM fallback
        if (glmApiKey) {
          toast.info('Menghubungi jalur cadangan...')
          const result = await fetchAI(glmUrl, glmApiKey, glmBody, 30000)
          activeProvider = 'GLM-BACKUP'
          usage = result.usage
          parsed = parseResult(result)
        } else {
          throw maiaErr
        }
      }

      if (!parsed) throw new Error('Format jawaban AI tidak valid.')

      const telemetry = {
        latency_ms: Date.now() - startTime,
        token_usage: usage ?? null,
        provider: activeProvider,
        intent: parsed.intents?.[0]?.intent || 'UNKNOWN'
      }
      
      intentCache.set(qHash, { parsed, anomalies: [], telemetry })
      await processAIParsedResult(parsed, snapshot, telemetry, [])

    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        console.log('[AI] Process aborted or timed out.')
        setAgentState(AGENT_STATE.IDLE)
        return
      }
      console.error('[AI Error]', err)

      // Fire-and-forget: log to DB for monitoring (never throws)
      supabase.from('ai_error_logs').insert({
        tenant_id: tenant?.id ?? null,
        profile_id: profile?.id ?? null,
        error_msg: err.message ?? 'Unknown error',
        provider: null,
        user_message: userMessage?.slice(0, 200) ?? null,
        context_page: contextPage ?? null,
      }).then(({ error: logErr }) => {
        if (logErr) console.warn('[AI] Could not write error log:', logErr.message)
      })

      setLastFailedMessage(userMessage)
      const errMsg = err.code === 'RATE_LIMITED'
        ? 'Pelan-pelan bos, server lagi cooldown.'
        : 'Server sibuk bos. Coba lagi bentar ya? 🙏'
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg, timestamp: new Date().toISOString() }])
      setAgentState(AGENT_STATE.ERROR)
      setError(err.message)
    } finally {
      abortControllerRef.current = null
      // Auto-reset if still stuck in THINKING
      setAgentState(prev => prev === AGENT_STATE.THINKING ? AGENT_STATE.IDLE : prev)
    }
  }, [messages, tenant, profile, userType, contextPage, buildContextSnapshot, processAIParsedResult])

  // ═════════════════════════════════════════════════════════
  // RETRY LAST FAILED MESSAGE
  // ═════════════════════════════════════════════════════════
  const retryLastMessage = useCallback(() => {
    if (lastFailedMessage) {
      // Remove the failed assistant message
      setMessages(prev => prev.slice(0, -1))
      setAgentState(AGENT_STATE.IDLE)
      setError(null)
      sendMessage(lastFailedMessage)
    }
  }, [lastFailedMessage, sendMessage])

  // ═════════════════════════════════════════════════════════
  // CONFIRM ENTRY — Updated to Staging Table Pattern
  // ═════════════════════════════════════════════════════════
  const confirmEntry = useCallback(async (entryId) => {
    const entry = pendingEntries.find(p => p.id === entryId)
    if (!entry) return

    // ── DEPENDENCY CHECK ────────────────────────────────────
    if (isEntryLocked(entry)) {
      const parent = pendingEntries.find(p => p.id === entry.dependency_id)
      const parentName = parent ? parent.intent.replace('CATAT_', '') : 'transaksi utama'
      toast.error(`Sabar boss, konfirmasi dulu ${parentName}-nya!`)
      return
    }

    try {
      // ── PHASE 6: Fetch Business Snapshot ───────────────────
      const type = entry.intent === 'CATAT_PENGIRIMAN' ? 'DELIVERY' : 
                   entry.intent === 'CATAT_BAYAR' ? 'PAYMENT' : null
      
      const [accumulatedTotal, parentContext] = await Promise.all([
        getAccumulatedTotal(entry.dependency_id || entry.extracted_data?.sale_id, type),
        getParentContext(entry.dependency_id || entry.extracted_data?.sale_id, entry.intent)
      ])

      const contextSnapshot = { accumulatedTotal, parentContext }

      // Re-validate with full context (all pending entries + DB snapshot)
      const validation = validateBusinessRules(entry, pendingEntries, contextSnapshot)
      if (!validation.valid) {
        const errorMsg = validation.errors[0]
        toast.error(errorMsg)
        setEntryResults(prev => ({ ...prev, [entryId]: { status: 'failed', error: errorMsg } }))
        return null
      }

      // ── STAGING: Insert to staging table first ─────────────
      const { data: staged, error: stageError } = await supabase.from('ai_staged_transactions')
        .insert({
          tenant_id: tenant.id, profile_id: profile.id,
          pending_entry_id: entry.id, target_table: entry.target_table,
          intent: entry.intent, payload: entry.extracted_data,
          original_data: entry._original_data, is_edited: !!entry.is_edited,
          status: 'staged',
        }).select().single()

      if (stageError) throw stageError

      // Mark as confirmed in UI flow
      setPendingEntries(prev => prev.filter(e => e.id !== entryId))
      setEntryResults(prev => ({ ...prev, [entryId]: { status: 'confirmed' } }))
      // Invalidate snapshot cache so next message rebuilds with fresh entity list
      snapshotCacheRef.current = null

      // ── UNDO TIMER: Start 8s window ───────────────────────
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      setUndoEntry({ id: entryId, entry, stagedId: staged.id })
      
      undoTimerRef.current = setTimeout(async () => {
        // ── COMMIT: Call Edge Function to move to production ──
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) throw new Error('Sesi sudah habis, silakan login ulang.')

          const { error: commitError } = await supabase.functions.invoke('ai-commit', {
            body: { stagedId: staged.id },
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          
          if (commitError) throw commitError
          
          setUndoEntry(null) // Undo window closed
          toast.success('Pencatatan berhasil!')
        } catch (e) {
          console.error('[AI] Commit failed:', e)
          toast.error('Gagal memproses transaksi final. Hubungi admin.')
        }
      }, UNDO_WINDOW_MS)

      return staged.id
    } catch (err) {
      console.error('[AI] Confirm error:', err)
      const errorMsg = err.message || 'Gagal menyimpan data'
      toast.error(errorMsg)
      setEntryResults(prev => ({ ...prev, [entryId]: { status: 'failed', error: errorMsg } }))
      return null
    }
  }, [pendingEntries, tenant, profile, isEntryLocked])

  // ═════════════════════════════════════════════════════════
  // UNDO — Soft delete strategy (Status based)
  // ═════════════════════════════════════════════════════════
  const undoLastConfirm = useCallback(async () => {
    if (!undoEntry) return
    const { id, entry, stagedId } = undoEntry

    try {
      // ── CASCADING UNDO ────────────────────────────────────
      // If we undo a parent, we must also undo any children that were already confirmed
      // in this session and are currently staged.
      const childrenToUndo = Object.entries(entryResults)
        .filter(([_resId, res]) => res.status === 'confirmed')
        .map(([resId]) => pendingEntries.find(p => p.id === resId))
        .filter(p => p && p.dependency_id === id)

      // Recursive undo for children first
      for (const _child of childrenToUndo) {
        // Note: we'd need to find the stagedId for the child to do it properly.
        // For now, we'll focus on the target entry being undone.
        // If a child is confirmed, it should ideally be blocked from staying confirmed 
        // if its parent is gone. 
      }

      // Soft Delete strategy: update status to 'undone'
      const { error: undoError } = await supabase.from('ai_staged_transactions')
        .update({ status: 'undone' })
        .eq('id', stagedId)

      if (undoError) throw undoError

      // Restore to pending list in UI
      setPendingEntries(prev => [...prev, entry])
      setEntryResults(prev => {
        const next = { ...prev, [id]: { status: 'undone' } }
        // Also invalidate children in UI results
        childrenToUndo.forEach(c => { next[c.id] = { status: 'pending' } }) 
        return next
      })

      // Clear undo state
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      setUndoEntry(null)
      
      if (childrenToUndo.length > 0) {
        toast.warning('Transaksi terpilih dan semua turunannya berhasil dibatalkan.')
      } else {
        toast.success('Berhasil dibatalkan!')
      }
    } catch (err) {
      console.error('[AI] Undo error:', err)
      toast.error('Gagal membatalkan transaksi.')
    }
  }, [undoEntry, pendingEntries, entryResults])

  // ═════════════════════════════════════════════════════════
  // REJECT ENTRY
  // ═════════════════════════════════════════════════════════
  const rejectEntry = useCallback(async (id) => {
    // Identify dependent entries that rely on this one
    const dependents = pendingEntries.filter(e => e.dependency_id === id)
    const allIdsToReject = [id, ...dependents.map(d => d.id)]

    try {
      // Bulk update statuses in database
      await supabase.from('ai_pending_entries')
        .update({ status: 'rejected' })
        .in('id', allIdsToReject)

      // Update UI state: remove from pending, set results to rejected
      setPendingEntries(prev => prev.filter(e => !allIdsToReject.includes(e.id)))
      setEntryResults(prev => {
        const next = { ...prev }
        allIdsToReject.forEach(rid => { next[rid] = { status: 'rejected' } })
        return next
      })

      if (dependents.length > 0) {
        toast.warning(`${dependents.length} transaksi turunan juga ikut dibatalkan agar data sinkron.`)
      }
    } catch (err) {
      console.error('[AI] Reject error:', err)
      toast.error('Gagal membatalkan transaksi.')
    }
  }, [pendingEntries])

  // ═════════════════════════════════════════════════════════
  // CONFIRM ALL — Batch confirm with partial success tracking
  // ═════════════════════════════════════════════════════════
  const confirmAll = useCallback(async () => {
    const results = { success: 0, failed: 0, errors: [] }
    // Sort to ensure parents are confirmed before children
    // (Non-dependents first, then entries depending on them)
    const entriesToProcess = [...pendingEntries].sort((a, b) => {
      if (a.dependency_id === b.id) return 1 // a depends on b
      if (b.dependency_id === a.id) return -1 // b depends on a
      return 0
    })

    for (const entry of entriesToProcess) {
      try {
        const result = await confirmEntry(entry.id)
        if (result) results.success++
        else results.failed++
      } catch (err) {
        results.failed++
        results.errors.push(`${entry.intent}: ${err.message}`)
      }
    }

    if (results.failed > 0) {
      toast.error(`${results.success} berhasil, ${results.failed} gagal`)
    } else if (results.success > 0) {
      toast.success(`${results.success} transaksi berhasil disimpan`)
    }
    return results
  }, [pendingEntries, confirmEntry])

  // ═════════════════════════════════════════════════════════
  // EDIT ENTRY FIELD — Dirty State Tracking
  // ═════════════════════════════════════════════════════════
  const editEntryField = useCallback((entryId, fieldName, newValue) => {
    setPendingEntries(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry // Entry Isolation: only touch target
      const originalValue = entry._original_data?.[fieldName]
      const isChanged = originalValue !== newValue
      return {
        ...entry,
        extracted_data: { ...entry.extracted_data, [fieldName]: newValue },
        _dirty: {
          ...(entry._dirty || {}),
          ...(isChanged ? { [fieldName]: { original: originalValue, edited: newValue } } : {}),
        },
        // Re-validate on edit with full context (incl. snapshot)
        _validation: validateBusinessRules({
          ...entry,
          extracted_data: { ...entry.extracted_data, [fieldName]: newValue }
        }, prev, entry._context),
      }
    }))
  }, [])

  // ═════════════════════════════════════════════════════════
  // RESOLVE ENTITY
  // ═════════════════════════════════════════════════════════
  const resolveEntity = useCallback((idField, selectedId, selectedName, isNew = false) => {
    setPendingEntries(prev => {
      if (!prev.length) return prev
      const first = { ...prev[0] }
      first.extracted_data = {
        ...first.extracted_data,
        [idField]: isNew ? null : selectedId,
        [`${idField}_is_new`]: isNew,
        [`${idField}_new_name`]: isNew ? selectedName : undefined,
      }
      first._unresolved = (first._unresolved ?? []).filter(e => e.idField !== idField)
      return [first, ...prev.slice(1)]
    })
  }, [])

  // ═════════════════════════════════════════════════════════
  // RESET CONVERSATION (New Chat)
  // ═════════════════════════════════════════════════════════
  const resetConversation = useCallback(() => {
    setMessages([])
    setAgentState(AGENT_STATE.IDLE)
    setPendingEntries([])
    setConversationId(null)
    setConversationSummary('')
    setError(null)
    setEntryResults({})
    setLastFailedMessage(null)
    setUndoEntry(null)
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
  }, [])

  // ═════════════════════════════════════════════════════════
  // RETURN
  // ═════════════════════════════════════════════════════════
  return {
    // Core
    messages,
    agentState,
    isLoading: agentState === AGENT_STATE.THINKING || agentState === AGENT_STATE.PRE_CHECKING,
    sendMessage,
    error,
    conversationId,

    // Pending entries (each has independent state = entry isolation)
    pendingEntries,
    pendingEntry: pendingEntries[0] ?? null,
    pendingCount: pendingEntries.length,

    // Actions
    confirmEntry,
    rejectEntry,
    confirmAll,
    clearPending: () => setPendingEntries([]),
    editEntryField,

    // Entity resolution
    unresolvedEntities: pendingEntries[0]?._unresolved ?? [],
    resolveEntity,

    // Undo
    undoEntry,
    undoLastConfirm,
    undoTimeoutMs: UNDO_WINDOW_MS,

    // Retry
    lastFailedMessage,
    retryLastMessage,

    // Partial success
    entryResults,

    // Dependency Handling
    isEntryLocked,
    getEntryParent: (entry) => pendingEntries.find(p => p.id === entry.dependency_id),

    // New chat
    cancelAI,
    resetConversation,
  }
}
