'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, type FoodPhoto, type Recipe } from '@/lib/supabase'
import { Plus, X } from 'lucide-react'

type Tab = 'memories' | 'recipes'

type RecipeForm = {
  title: string
  description: string
  cuisine: string
  difficulty: 'easy' | 'medium' | 'hard' | ''
  ingredients: string[]
  steps: string[]
  notes: string
  rating: number
  tried: boolean
}

const emptyForm: RecipeForm = {
  title: '', description: '', cuisine: '', difficulty: '',
  ingredients: [''], steps: [''], notes: '', rating: 0, tried: false,
}

const difficultyStyle: Record<'easy' | 'medium' | 'hard', string> = {
  easy:   'bg-[#3A5C2E]/15 text-[#3A5C2E]',
  medium: 'bg-[#8B5E1A]/15 text-[#8B5E1A]',
  hard:   'bg-[#7A1E1E]/15 text-[#7A1E1E]',
}

export default function FoodPage() {
  const [tab, setTab] = useState<Tab>('memories')

  const [photos, setPhotos]               = useState<FoodPhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(true)
  const [uploading, setUploading]         = useState(false)
  const [caption, setCaption]             = useState('')
  const [preview, setPreview]             = useState<string | null>(null)
  const [file, setFile]                   = useState<File | null>(null)
  const [lightbox, setLightbox]           = useState<FoodPhoto | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [recipes, setRecipes]               = useState<Recipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(true)
  const [showForm, setShowForm]             = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [form, setForm]                     = useState<RecipeForm>(emptyForm)
  const [selected, setSelected]             = useState<Recipe | null>(null)

  useEffect(() => { fetchPhotos(); fetchRecipes() }, [])

  async function fetchPhotos() {
    const { data } = await supabase.from('food_photos').select('*').order('created_at', { ascending: false })
    setPhotos(data ?? []); setPhotosLoading(false)
  }
  async function fetchRecipes() {
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
    setRecipes(data ?? []); setRecipesLoading(false)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  async function uploadPhoto(e: React.FormEvent) {
    e.preventDefault(); if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('FoodPhotos').upload(path, file)
    if (upErr) { alert('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('FoodPhotos').getPublicUrl(path)
    const { error: insErr } = await supabase.from('food_photos').insert({ image_url: publicUrl, caption: caption.trim() || null })
    if (insErr) { alert('Save failed: ' + insErr.message); setUploading(false); return }
    setFile(null); setPreview(null); setCaption('')
    if (fileRef.current) fileRef.current.value = ''
    await fetchPhotos(); setUploading(false)
  }

  async function deletePhoto(photo: FoodPhoto) {
    const path = photo.image_url.split('/FoodPhotos/')[1]
    if (path) await supabase.storage.from('FoodPhotos').remove([path])
    await supabase.from('food_photos').delete().eq('id', photo.id)
    setLightbox(null); setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  async function saveRecipe(e: React.FormEvent) {
    e.preventDefault(); if (!form.title.trim()) return
    setSaving(true)
    const { error } = await supabase.from('recipes').insert({
      title: form.title.trim(), description: form.description.trim() || null,
      cuisine: form.cuisine.trim() || null, difficulty: form.difficulty || null,
      ingredients: form.ingredients.filter(i => i.trim()), steps: form.steps.filter(s => s.trim()),
      notes: form.notes.trim() || null, rating: form.rating, tried: form.tried,
    })
    if (error) { alert('Failed: ' + error.message); setSaving(false); return }
    setForm(emptyForm); setShowForm(false); await fetchRecipes(); setSaving(false)
  }

  async function deleteRecipe(recipe: Recipe) {
    await supabase.from('recipes').delete().eq('id', recipe.id)
    setSelected(null); setRecipes(prev => prev.filter(r => r.id !== recipe.id))
  }

  const inp = 'w-full px-3 py-2.5 rounded-lg text-sm text-[#1A0D05] placeholder:text-[#A89070] focus:outline-none bg-[#F5EBD8] border border-[#E0C9A8] focus:border-[#C4784A]/60 transition-colors'

  return (
    <div style={{ background: '#F7EDE0', minHeight: '100vh' }}>

      {/* ── Dark editorial header ─────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(160deg, #1A0D05 0%, #2E1608 60%, #3D200A 100%)',
          paddingTop: 80,
          paddingBottom: 48,
          paddingLeft: 40,
          paddingRight: 40,
        }}
      >
        <p style={{ fontSize: 10, letterSpacing: '0.55em', textTransform: 'uppercase', color: 'rgba(196,120,74,0.7)', marginBottom: 16, fontWeight: 300 }}>
          teo &amp; noelle
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic',
            fontSize: 'clamp(3.5rem, 9vw, 7rem)', lineHeight: 0.95,
            color: '#F5E6D0', letterSpacing: '-0.02em', marginBottom: 20,
          }}
        >
          Food
        </h1>
        <p style={{ fontSize: 12, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,230,208,0.35)', fontWeight: 300 }}>
          the meals &nbsp;·&nbsp; the memories &nbsp;·&nbsp; the recipes
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginTop: 40 }}>
          {([['memories', '📸  Food Memories'], ['recipes', '📖  Recipes']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: tab === key ? '#C4784A' : 'rgba(245,230,208,0.1)',
                color: tab === key ? '#fff' : 'rgba(245,230,208,0.55)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────── */}
      <div style={{ padding: '40px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>

        {/* ══ FOOD MEMORIES ══════════════════════════════════════ */}
        {tab === 'memories' && (
          <>
            {/* Upload strip */}
            <form
              onSubmit={uploadPhoto}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: '24px 28px',
                marginBottom: 40,
                maxWidth: 480,
                boxShadow: '0 4px 24px rgba(26,13,5,0.1)',
                border: '1px solid rgba(196,120,74,0.15)',
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1A0D05', marginBottom: 16, letterSpacing: '0.01em' }}>
                Add a food memory
              </p>
              <div
                style={{
                  border: '2px dashed rgba(196,120,74,0.25)',
                  borderRadius: 14,
                  padding: 28,
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: 14,
                  background: '#FDF6EE',
                  transition: 'border-color 0.2s',
                }}
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxHeight: 180, margin: '0 auto', borderRadius: 10, objectFit: 'cover' }} />
                ) : (
                  <>
                    <p style={{ fontSize: 32, marginBottom: 8 }}>🍜</p>
                    <p style={{ fontSize: 12, color: '#A89070' }}>Click to choose a photo</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
              <input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="What was it? Where? (optional)"
                className={inp}
                style={{ marginBottom: 12 }}
              />
              <button
                type="submit"
                disabled={!file || uploading}
                style={{
                  width: '100%', padding: '10px', borderRadius: 12,
                  background: '#1A0D05', color: '#F5E6D0',
                  fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                  opacity: (!file || uploading) ? 0.4 : 1, transition: 'opacity 0.2s',
                  letterSpacing: '0.04em',
                }}
              >
                {uploading ? 'Uploading...' : 'Save Memory'}
              </button>
            </form>

            {/* Photo grid — editorial, no tilts */}
            {photosLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#A89070' }}>
                <p style={{ fontSize: 40 }}>🍽️</p>
                <p style={{ fontSize: 13, marginTop: 12 }}>loading...</p>
              </div>
            ) : photos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#A89070' }}>
                <p style={{ fontSize: 40 }}>🍽️</p>
                <p style={{ fontSize: 13, marginTop: 12 }}>no food memories yet — add your first one!</p>
              </div>
            ) : (
              <div style={{ columns: '3 280px', columnGap: 16 }}>
                {photos.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setLightbox(p)}
                    style={{
                      breakInside: 'avoid',
                      marginBottom: 16,
                      borderRadius: 16,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    className="food-photo-card"
                  >
                    <img src={p.image_url} alt={p.caption ?? 'food'} style={{ width: '100%', display: 'block' }} />
                    {p.caption && (
                      <div
                        style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'linear-gradient(to top, rgba(26,13,5,0.8) 0%, transparent 100%)',
                          padding: '24px 14px 12px',
                        }}
                      >
                        <p style={{ color: '#F5E6D0', fontSize: 12, fontWeight: 400 }}>{p.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══ RECIPES ════════════════════════════════════════════ */}
        {tab === 'recipes' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <p style={{ fontSize: 13, color: '#8B6A48' }}>
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} saved
              </p>
              <button
                onClick={() => setShowForm(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 12,
                  background: '#1A0D05', color: '#F5E6D0',
                  fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}
              >
                <Plus size={13} />
                Add Recipe
              </button>
            </div>

            {/* ── Add recipe form ──────────────────────────────── */}
            {showForm && (
              <form
                onSubmit={saveRecipe}
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: 28,
                  marginBottom: 36,
                  boxShadow: '0 4px 24px rgba(26,13,5,0.1)',
                  border: '1px solid rgba(196,120,74,0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1A0D05' }}>New Recipe</p>
                  <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A89070' }}>
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Recipe name *" className={inp} />
                  <input value={form.cuisine} onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))} placeholder="Cuisine (e.g. Italian)" className={inp} />
                </div>

                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  className={inp}
                  style={{ resize: 'none', marginBottom: 12, display: 'block' }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as RecipeForm['difficulty'] }))} className={inp} style={{ width: 'auto' }}>
                    <option value="">Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#8B6A48', marginRight: 4 }}>Rating:</span>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}
                        style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: n <= form.rating ? '#C4784A' : '#E0C9A8', padding: 0 }}>
                        ★
                      </button>
                    ))}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8B6A48', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.tried} onChange={e => setForm(f => ({ ...f, tried: e.target.checked }))} style={{ accentColor: '#C4784A' }} />
                    We&apos;ve tried it
                  </label>
                </div>

                {/* Ingredients */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#8B6A48', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Ingredients</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.ingredients.map((ing, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'rgba(196,120,74,0.4)', fontSize: 16, flexShrink: 0 }}>·</span>
                        <input value={ing} onChange={e => { const u = [...form.ingredients]; u[i] = e.target.value; setForm(f => ({ ...f, ingredients: u })) }} placeholder={`Ingredient ${i + 1}`} className={inp} style={{ flex: 1 }} />
                        {form.ingredients.length > 1 && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A89070' }}><X size={13} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setForm(f => ({ ...f, ingredients: [...f.ingredients, ''] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#C4784A', textAlign: 'left', padding: '0 24px' }}>
                      + add ingredient
                    </button>
                  </div>
                </div>

                {/* Steps */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#8B6A48', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Steps</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ color: '#C4784A', fontSize: 12, fontWeight: 600, marginTop: 10, flexShrink: 0, width: 20 }}>{i + 1}.</span>
                        <textarea value={step} onChange={e => { const u = [...form.steps]; u[i] = e.target.value; setForm(f => ({ ...f, steps: u })) }} placeholder={`Step ${i + 1}`} rows={2} className={inp} style={{ flex: 1, resize: 'none' }} />
                        {form.steps.length > 1 && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A89070', marginTop: 8 }}><X size={13} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setForm(f => ({ ...f, steps: [...f.steps, ''] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#C4784A', textAlign: 'left', padding: '0 28px' }}>
                      + add step
                    </button>
                  </div>
                </div>

                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes — tips, variations, where you found it..." rows={2} className={inp} style={{ resize: 'none', marginBottom: 20, display: 'block' }} />

                <button type="submit" disabled={!form.title.trim() || saving}
                  style={{ width: '100%', padding: 12, borderRadius: 12, background: '#1A0D05', color: '#F5E6D0', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', opacity: (!form.title.trim() || saving) ? 0.4 : 1, letterSpacing: '0.04em' }}>
                  {saving ? 'Saving...' : 'Save Recipe'}
                </button>
              </form>
            )}

            {/* ── Recipe cards ─────────────────────────────────── */}
            {recipesLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#A89070' }}>
                <p style={{ fontSize: 40 }}>📖</p>
                <p style={{ fontSize: 13, marginTop: 12 }}>loading recipes...</p>
              </div>
            ) : recipes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#A89070' }}>
                <p style={{ fontSize: 40 }}>📖</p>
                <p style={{ fontSize: 13, marginTop: 12 }}>no recipes yet — add your first one!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {recipes.map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => setSelected(recipe)}
                    className="recipe-card"
                    style={{
                      background: '#fff',
                      borderRadius: 18,
                      padding: '0',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: '0 2px 16px rgba(26,13,5,0.08)',
                      border: '1px solid rgba(196,120,74,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {/* Accent bar */}
                    <div style={{ height: 4, background: 'linear-gradient(to right, #C4784A, #8B4513)' }} />
                    <div style={{ padding: '20px 22px 22px' }}>
                      {recipe.cuisine && (
                        <p style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#C4784A', marginBottom: 8, fontWeight: 500 }}>
                          {recipe.cuisine}
                        </p>
                      )}
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1A0D05', lineHeight: 1.3, marginBottom: 8, fontFamily: 'var(--font-serif)' }}>
                        {recipe.title}
                      </h3>
                      {recipe.description && (
                        <p style={{ fontSize: 12, color: '#8B6A48', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {recipe.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <span key={n} style={{ fontSize: 13, color: n <= recipe.rating ? '#C4784A' : '#E0C9A8' }}>★</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {recipe.tried && <span style={{ fontSize: 10, color: '#3A5C2E', fontWeight: 500 }}>✓ tried</span>}
                          {recipe.difficulty && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${difficultyStyle[recipe.difficulty]}`}>
                              {recipe.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Food memory lightbox ─────────────────────────────── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,13,5,0.85)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', maxWidth: 520, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}
          >
            <img src={lightbox.image_url} alt={lightbox.caption ?? ''} style={{ width: '100%', objectFit: 'cover', maxHeight: '60vh', display: 'block' }} />
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {lightbox.caption && <p style={{ fontSize: 14, fontWeight: 500, color: '#1A0D05' }}>{lightbox.caption}</p>}
                <p style={{ fontSize: 11, color: '#A89070', marginTop: 3 }}>
                  {new Date(lightbox.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => deletePhoto(lightbox)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#A89070', cursor: 'pointer' }}>
                delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recipe detail modal ──────────────────────────────── */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,13,5,0.85)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', maxWidth: 540, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}
          >
            <div style={{ height: 5, background: 'linear-gradient(to right, #C4784A, #8B4513)', flexShrink: 0 }} />
            <div style={{ overflowY: 'auto', padding: '28px 32px 32px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1A0D05', lineHeight: 1.2, fontFamily: 'var(--font-serif)', paddingRight: 16 }}>
                  {selected.title}
                </h2>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A89070', flexShrink: 0 }}><X size={18} /></button>
              </div>
              {selected.cuisine && <p style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C4784A', marginBottom: 16 }}>{selected.cuisine}</p>}

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} style={{ fontSize: 16, color: n <= selected.rating ? '#C4784A' : '#E0C9A8' }}>★</span>
                  ))}
                </div>
                {selected.difficulty && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyStyle[selected.difficulty]}`}>{selected.difficulty}</span>
                )}
                {selected.tried && <span style={{ fontSize: 12, color: '#3A5C2E', fontWeight: 500 }}>✓ we&apos;ve tried it</span>}
              </div>

              {selected.description && <p style={{ fontSize: 14, color: '#5A3D25', lineHeight: 1.7, marginBottom: 24 }}>{selected.description}</p>}

              {selected.ingredients && selected.ingredients.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#C4784A', marginBottom: 12, fontWeight: 600 }}>Ingredients</p>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selected.ingredients.map((ing, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#2A1608' }}>
                        <span style={{ color: '#C4784A', flexShrink: 0, marginTop: 1 }}>·</span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.steps && selected.steps.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#C4784A', marginBottom: 12, fontWeight: 600 }}>Steps</p>
                  <ol style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {selected.steps.map((step, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <span style={{ color: '#C4784A', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                        <span style={{ fontSize: 14, color: '#2A1608', lineHeight: 1.65 }}>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {selected.notes && (
                <div style={{ background: '#FDF6EE', borderRadius: 12, padding: '14px 18px', marginBottom: 24, borderLeft: '3px solid #C4784A' }}>
                  <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C4784A', marginBottom: 6, fontWeight: 600 }}>Notes</p>
                  <p style={{ fontSize: 13, color: '#5A3D25', lineHeight: 1.65 }}>{selected.notes}</p>
                </div>
              )}

              <div style={{ paddingTop: 16, borderTop: '1px solid #F0E0CC' }}>
                <button onClick={() => deleteRecipe(selected)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#A89070', cursor: 'pointer' }}>
                  delete recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .food-photo-card img { transition: transform 0.4s ease; }
        .food-photo-card:hover img { transform: scale(1.03); }
        .recipe-card:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 32px rgba(26,13,5,0.14) !important; }
      `}</style>
    </div>
  )
}
