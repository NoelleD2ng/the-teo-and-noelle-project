'use client'

import { useEffect, useState } from 'react'
import { supabase, type WishlistItem } from '@/lib/supabase'

export default function WishlistCard() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [proposedBy, setProposedBy] = useState<'teo' | 'noelle'>('teo')
  const [adding, setAdding] = useState(false)

  function fetchItems() {
    supabase
      .from('wishlist')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => setItems(data ?? []))
  }

  useEffect(() => {
    if (!open) return
    fetchItems()
  }, [open])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    const { data } = await supabase
      .from('wishlist')
      .insert({
        title: title.trim(),
        notes: notes.trim() || null,
        proposed_by: proposedBy,
        approved_by_teo: proposedBy === 'teo',
        approved_by_noelle: proposedBy === 'noelle',
        tried: false,
      })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data])
    setTitle('')
    setNotes('')
    setShowForm(false)
    setAdding(false)
  }

  async function approve(item: WishlistItem) {
    const update = item.proposed_by === 'teo'
      ? { approved_by_noelle: true }
      : { approved_by_teo: true }
    const { data } = await supabase
      .from('wishlist')
      .update(update)
      .eq('id', item.id)
      .select()
      .single()
    if (data) setItems(prev => prev.map(i => i.id === item.id ? data : i))
  }

  async function pass(id: string) {
    await supabase.from('wishlist').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function toggleTried(item: WishlistItem) {
    const { data } = await supabase
      .from('wishlist')
      .update({ tried: !item.tried })
      .eq('id', item.id)
      .select()
      .single()
    if (data) setItems(prev => prev.map(i => i.id === item.id ? data : i))
  }

  const pending = items.filter(i => !(i.approved_by_teo && i.approved_by_noelle))
  const approved = items.filter(i => i.approved_by_teo && i.approved_by_noelle)

  return (
    <div className="w-full max-w-sm mx-auto mt-16 pb-24">
      {/* Toggle trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-center gap-4"
      >
        <div style={{ width: 40, height: 1, background: 'linear-gradient(to right, transparent, rgba(160,60,120,0.3))' }} />
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '8px',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color: open ? 'rgba(210,110,170,0.65)' : 'rgba(160,60,120,0.38)',
          fontWeight: 300,
          transition: 'color 0.5s',
        }}>
          {open ? 'close' : 'our list'}
        </span>
        <div style={{ width: 40, height: 1, background: 'linear-gradient(to left, transparent, rgba(160,60,120,0.3))' }} />
      </button>

      {/* Floating card */}
      {open && (
        <div
          className="mt-5 rounded-2xl"
          style={{
            background: 'rgba(28, 4, 18, 0.88)',
            border: '1px solid rgba(160,60,120,0.18)',
            backdropFilter: 'blur(14px)',
            padding: '24px 20px',
            boxShadow: '0 0 80px rgba(140,30,90,0.07), 0 12px 40px rgba(0,0,0,0.45)',
            animation: 'wl-enter 0.4s ease-out',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '8px',
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: 'rgba(200,100,160,0.55)',
                fontWeight: 300,
              }}>
                our wishlist
              </p>
              <button
                onClick={fetchItems}
                title="refresh"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(160,60,120,0.35)',
                  fontSize: 11,
                  lineHeight: 1,
                  padding: 0,
                  transition: 'color 0.3s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(210,110,170,0.65)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(160,60,120,0.35)')}
              >
                ↻
              </button>
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '8px',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: showForm ? 'rgba(210,110,170,0.7)' : 'rgba(160,60,120,0.4)',
                fontWeight: 300,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.3s',
              }}
            >
              {showForm ? 'cancel' : '+ add'}
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <form onSubmit={addItem} className="mb-5 flex flex-col gap-2.5">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="what do you want to do..."
                autoFocus
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(160,60,120,0.2)',
                  borderRadius: 10,
                  padding: '9px 13px',
                  fontSize: 13,
                  color: 'rgba(245,218,238,0.8)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="a little note... (optional)"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(160,60,120,0.15)',
                  borderRadius: 10,
                  padding: '9px 13px',
                  fontSize: 12,
                  color: 'rgba(245,218,238,0.55)',
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <div className="flex items-center gap-2 mt-1">
                <span style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(160,60,120,0.45)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                  from
                </span>
                {(['teo', 'noelle'] as const).map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setProposedBy(name)}
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      color: proposedBy === name ? 'rgba(210,110,170,0.9)' : 'rgba(160,60,120,0.4)',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: proposedBy === name ? 400 : 300,
                      background: proposedBy === name ? 'rgba(160,60,120,0.12)' : 'none',
                      border: `1px solid ${proposedBy === name ? 'rgba(160,60,120,0.28)' : 'transparent'}`,
                      borderRadius: 7,
                      padding: '3px 9px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {name}
                  </button>
                ))}
                <button
                  type="submit"
                  disabled={adding || !title.trim()}
                  style={{
                    marginLeft: 'auto',
                    fontSize: 9,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'rgba(210,110,170,0.8)',
                    fontFamily: 'var(--font-sans)',
                    background: 'rgba(160,60,120,0.14)',
                    border: '1px solid rgba(160,60,120,0.25)',
                    borderRadius: 7,
                    padding: '3px 12px',
                    cursor: title.trim() ? 'pointer' : 'default',
                    opacity: !title.trim() ? 0.35 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  propose
                </button>
              </div>
            </form>
          )}

          {/* Empty state */}
          {items.length === 0 && !showForm && (
            <p style={{
              fontSize: 12,
              color: 'rgba(200,150,185,0.28)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '18px 0',
            }}>
              nothing here yet
            </p>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <div className="mb-4">
              <p style={{
                fontSize: 7,
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                color: 'rgba(160,60,120,0.35)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 300,
                marginBottom: 10,
              }}>
                awaiting approval
              </p>
              <div className="flex flex-col gap-2">
                {pending.map(item => (
                  <div key={item.id} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(160,60,120,0.11)',
                    borderRadius: 11,
                    padding: '11px 13px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'rgba(245,218,238,0.55)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {item.title}
                      </p>
                      {item.notes && (
                        <p style={{ fontSize: 11, color: 'rgba(200,150,185,0.35)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginTop: 3 }}>
                          {item.notes}
                        </p>
                      )}
                      <p style={{ fontSize: 7, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(160,60,120,0.32)', fontFamily: 'var(--font-sans)', marginTop: 6 }}>
                        from {item.proposed_by}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0 pt-0.5">
                      <button
                        onClick={() => approve(item)}
                        style={{
                          fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
                          color: 'rgba(210,110,170,0.75)', fontFamily: 'var(--font-sans)',
                          background: 'rgba(160,60,120,0.1)', border: '1px solid rgba(160,60,120,0.22)',
                          borderRadius: 6, padding: '3px 8px', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        yes
                      </button>
                      <button
                        onClick={() => pass(item.id)}
                        style={{
                          fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
                          color: 'rgba(200,150,185,0.3)', fontFamily: 'var(--font-sans)',
                          background: 'none', border: '1px solid rgba(160,60,120,0.08)',
                          borderRadius: 6, padding: '3px 8px', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        pass
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pending.length > 0 && approved.length > 0 && (
            <div style={{ height: 1, background: 'rgba(160,60,120,0.08)', margin: '4px 0 16px' }} />
          )}

          {/* Approved list */}
          {approved.length > 0 && (
            <div className="flex flex-col gap-2">
              {approved.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${item.tried ? 'rgba(160,60,120,0.07)' : 'rgba(160,60,120,0.15)'}`,
                    borderRadius: 11,
                    padding: '11px 13px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    opacity: item.tried ? 0.45 : 1,
                    transition: 'opacity 0.35s, border-color 0.35s',
                  }}
                >
                  <button
                    onClick={() => toggleTried(item)}
                    style={{
                      marginTop: 3,
                      width: 13, height: 13,
                      borderRadius: '50%',
                      border: `1px solid ${item.tried ? 'rgba(200,100,160,0.55)' : 'rgba(160,60,120,0.28)'}`,
                      background: item.tried ? 'rgba(160,60,120,0.38)' : 'transparent',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.25s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.tried && <span style={{ color: 'rgba(245,218,238,0.9)', fontSize: 7, lineHeight: 1 }}>✓</span>}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13,
                      color: item.tried ? 'rgba(245,218,238,0.35)' : 'rgba(245,218,238,0.78)',
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                      textDecoration: item.tried ? 'line-through' : 'none',
                    }}>
                      {item.title}
                    </p>
                    {item.notes && !item.tried && (
                      <p style={{ fontSize: 11, color: 'rgba(200,150,185,0.38)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginTop: 3 }}>
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes wl-enter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
