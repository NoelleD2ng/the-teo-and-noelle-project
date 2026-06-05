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
  title: '',
  description: '',
  cuisine: '',
  difficulty: '',
  ingredients: [''],
  steps: [''],
  notes: '',
  rating: 0,
  tried: false,
}

const TILTS = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1']

const difficultyStyle: Record<'easy' | 'medium' | 'hard', string> = {
  easy:   'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard:   'bg-red-50 text-red-700 border-red-200',
}

export default function FoodPage() {
  const [tab, setTab] = useState<Tab>('memories')

  // ── Food memories ──────────────────────────────────────────
  const [photos, setPhotos] = useState<FoodPhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [lightbox, setLightbox] = useState<FoodPhoto | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Recipes ────────────────────────────────────────────────
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<RecipeForm>(emptyForm)
  const [selected, setSelected] = useState<Recipe | null>(null)

  useEffect(() => {
    fetchPhotos()
    fetchRecipes()
  }, [])

  async function fetchPhotos() {
    const { data } = await supabase.from('food_photos').select('*').order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setPhotosLoading(false)
  }

  async function fetchRecipes() {
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
    setRecipes(data ?? [])
    setRecipesLoading(false)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function uploadPhoto(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('FoodPhotos').upload(path, file)
    if (upErr) { alert('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('FoodPhotos').getPublicUrl(path)
    const { error: insErr } = await supabase.from('food_photos').insert({
      image_url: publicUrl,
      caption: caption.trim() || null,
    })
    if (insErr) { alert('Save failed: ' + insErr.message); setUploading(false); return }
    setFile(null); setPreview(null); setCaption('')
    if (fileRef.current) fileRef.current.value = ''
    await fetchPhotos()
    setUploading(false)
  }

  async function deletePhoto(photo: FoodPhoto) {
    const path = photo.image_url.split('/FoodPhotos/')[1]
    if (path) await supabase.storage.from('FoodPhotos').remove([path])
    await supabase.from('food_photos').delete().eq('id', photo.id)
    setLightbox(null)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  async function saveRecipe(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const { error } = await supabase.from('recipes').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      cuisine: form.cuisine.trim() || null,
      difficulty: form.difficulty || null,
      ingredients: form.ingredients.filter(i => i.trim()),
      steps: form.steps.filter(s => s.trim()),
      notes: form.notes.trim() || null,
      rating: form.rating,
      tried: form.tried,
    })
    if (error) { alert('Failed: ' + error.message); setSaving(false); return }
    setForm(emptyForm)
    setShowForm(false)
    await fetchRecipes()
    setSaving(false)
  }

  async function deleteRecipe(recipe: Recipe) {
    await supabase.from('recipes').delete().eq('id', recipe.id)
    setSelected(null)
    setRecipes(prev => prev.filter(r => r.id !== recipe.id))
  }

  const inp = 'w-full px-3 py-2 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E] focus:outline-none bg-[#F5EFE8] border border-[#E8DDD4] focus:border-[#C4784A]/40 transition-colors'

  return (
    <div className="pt-20 p-6 md:p-10 max-w-5xl mx-auto">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/70 mb-1">together</p>
        <h1 className="text-3xl font-semibold text-[#2C1A0E]">Food 🍽️</h1>
        <p className="text-[#7A6155] mt-1 text-sm">the meals, the memories, the recipes</p>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="flex gap-6 mb-8 border-b border-[#E8DDD4]">
        {([['memories', '📸 Food Memories'], ['recipes', '📖 Recipes']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === key
                ? 'text-[#C4784A] border-[#C4784A]'
                : 'text-[#7A6155]/60 border-transparent hover:text-[#7A6155]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══ FOOD MEMORIES TAB ══════════════════════════════════ */}
      {tab === 'memories' && (
        <>
          <form
            onSubmit={uploadPhoto}
            className="rounded-2xl border border-[#E8DDD4] bg-white p-5 mb-10 max-w-md"
            style={{ boxShadow: '0 2px 16px rgba(44,26,14,0.06)' }}
          >
            <p className="text-sm font-medium text-[#2C1A0E] mb-3">Add a food memory</p>
            <div
              className="border-2 border-dashed border-[#E8DDD4] rounded-xl p-6 text-center cursor-pointer hover:border-[#C4784A]/40 transition-colors mb-3 bg-[#FDFAF7]"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-cover" />
              ) : (
                <>
                  <p className="text-3xl mb-2">🍜</p>
                  <p className="text-sm text-[#AE9B8E]">Click to add a food photo</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="What was it? Where? (optional)"
              className={`${inp} mb-3`}
            />
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-[#C4784A] hover:bg-[#B36840] disabled:opacity-40 text-white py-2 rounded-xl text-sm transition-colors"
            >
              {uploading ? 'Uploading...' : 'Save Memory'}
            </button>
          </form>

          {photosLoading ? (
            <div className="text-center py-16 text-[#AE9B8E]">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-sm">loading...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-16 text-[#AE9B8E]">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-sm">no food memories yet — add your first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((p, i) => (
                <div
                  key={p.id}
                  className={`polaroid ${TILTS[i % TILTS.length]} cursor-pointer`}
                  onClick={() => setLightbox(p)}
                >
                  <img src={p.image_url} alt={p.caption ?? 'food'} className="w-full aspect-square object-cover" />
                  {p.caption && (
                    <p className="text-center text-xs mt-2 text-[#7A6155] font-light truncate">{p.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ RECIPES TAB ════════════════════════════════════════ */}
      {tab === 'recipes' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#7A6155]">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#C4784A] hover:bg-[#B36840] text-white text-sm rounded-xl transition-colors"
            >
              <Plus size={14} />
              Add Recipe
            </button>
          </div>

          {/* ── Add recipe form ───────────────────────────────── */}
          {showForm && (
            <form
              onSubmit={saveRecipe}
              className="rounded-2xl border border-[#E8DDD4] bg-white p-6 mb-8"
              style={{ boxShadow: '0 2px 16px rgba(44,26,14,0.06)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-medium text-[#2C1A0E]">New Recipe</p>
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm) }}>
                  <X size={16} className="text-[#AE9B8E] hover:text-[#7A6155]" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Recipe name *"
                  className={inp}
                />
                <input
                  value={form.cuisine}
                  onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))}
                  placeholder="Cuisine (e.g. Italian, Korean)"
                  className={inp}
                />
              </div>

              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={2}
                className={`${inp} resize-none mb-3`}
              />

              <div className="flex flex-wrap items-center gap-4 mb-5">
                <select
                  value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as RecipeForm['difficulty'] }))}
                  className={`${inp} w-auto`}
                >
                  <option value="">Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#7A6155] mr-1">Rating:</span>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, rating: n }))}
                      className={`text-lg transition-colors ${n <= form.rating ? 'text-[#C4784A]' : 'text-[#E8DDD4]'}`}
                    >★</button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm text-[#7A6155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tried}
                    onChange={e => setForm(f => ({ ...f, tried: e.target.checked }))}
                    className="accent-[#C4784A]"
                  />
                  We&apos;ve tried it
                </label>
              </div>

              {/* Ingredients */}
              <div className="mb-4">
                <p className="text-xs font-medium text-[#7A6155] mb-2">Ingredients</p>
                <div className="flex flex-col gap-1.5">
                  {form.ingredients.map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-xs text-[#C4784A]/40 shrink-0">·</span>
                      <input
                        value={ing}
                        onChange={e => {
                          const updated = [...form.ingredients]
                          updated[i] = e.target.value
                          setForm(f => ({ ...f, ingredients: updated }))
                        }}
                        placeholder={`Ingredient ${i + 1}`}
                        className={`${inp} flex-1`}
                      />
                      {form.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))}
                          className="text-[#AE9B8E] hover:text-[#C4784A] transition-colors"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, ingredients: [...f.ingredients, ''] }))}
                    className="text-xs text-[#C4784A]/70 hover:text-[#C4784A] transition-colors text-left mt-1 ml-4"
                  >
                    + add ingredient
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="mb-4">
                <p className="text-xs font-medium text-[#7A6155] mb-2">Steps</p>
                <div className="flex flex-col gap-2">
                  {form.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-xs text-[#C4784A]/50 mt-2.5 shrink-0 w-5">{i + 1}.</span>
                      <textarea
                        value={step}
                        onChange={e => {
                          const updated = [...form.steps]
                          updated[i] = e.target.value
                          setForm(f => ({ ...f, steps: updated }))
                        }}
                        placeholder={`Step ${i + 1}`}
                        rows={2}
                        className={`${inp} flex-1 resize-none`}
                      />
                      {form.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))}
                          className="text-[#AE9B8E] hover:text-[#C4784A] transition-colors mt-2"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, steps: [...f.steps, ''] }))}
                    className="text-xs text-[#C4784A]/70 hover:text-[#C4784A] transition-colors text-left mt-1 ml-5"
                  >
                    + add step
                  </button>
                </div>
              </div>

              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes — tips, variations, where you found it..."
                rows={2}
                className={`${inp} resize-none mb-5`}
              />

              <button
                type="submit"
                disabled={!form.title.trim() || saving}
                className="w-full bg-[#C4784A] hover:bg-[#B36840] disabled:opacity-40 text-white py-2 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Save Recipe'}
              </button>
            </form>
          )}

          {/* ── Recipe grid ───────────────────────────────────── */}
          {recipesLoading ? (
            <div className="text-center py-16 text-[#AE9B8E]">
              <p className="text-4xl mb-3">📖</p>
              <p className="text-sm">loading recipes...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-16 text-[#AE9B8E]">
              <p className="text-4xl mb-3">📖</p>
              <p className="text-sm">no recipes yet — add your first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map(recipe => (
                <div
                  key={recipe.id}
                  className="rounded-2xl border border-[#E8DDD4] bg-white p-5 cursor-pointer hover:border-[#C4784A]/30 hover:-translate-y-0.5 transition-all duration-200"
                  style={{ boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}
                  onClick={() => setSelected(recipe)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-medium text-[#2C1A0E] leading-snug">{recipe.title}</h3>
                    {recipe.tried && <span className="text-[10px] text-green-600 shrink-0 mt-0.5">✓ tried</span>}
                  </div>
                  {recipe.cuisine && (
                    <p className="text-xs text-[#C4784A]/70 mb-2">{recipe.cuisine}</p>
                  )}
                  {recipe.description && (
                    <p className="text-xs text-[#7A6155] mb-3 leading-relaxed line-clamp-2">{recipe.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} className={`text-sm ${n <= recipe.rating ? 'text-[#C4784A]' : 'text-[#E8DDD4]'}`}>★</span>
                      ))}
                    </div>
                    {recipe.difficulty && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyStyle[recipe.difficulty]}`}>
                        {recipe.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Food memory lightbox ─────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full"
            style={{ boxShadow: '0 20px 60px rgba(44,26,14,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <img src={lightbox.image_url} alt={lightbox.caption ?? ''} className="w-full object-cover max-h-[60vh]" />
            <div className="p-4 flex items-center justify-between">
              <div>
                {lightbox.caption && <p className="text-sm text-[#2C1A0E] font-medium">{lightbox.caption}</p>}
                <p className="text-xs text-[#AE9B8E] mt-0.5">
                  {new Date(lightbox.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => deletePhoto(lightbox)} className="text-xs text-[#AE9B8E] hover:text-[#C4784A] transition-colors">
                delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recipe detail modal ──────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 60px rgba(44,26,14,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-xl font-semibold text-[#2C1A0E] leading-snug pr-3">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="shrink-0 text-[#AE9B8E] hover:text-[#7A6155]">
                  <X size={18} />
                </button>
              </div>

              {selected.cuisine && (
                <p className="text-xs text-[#C4784A]/70 mb-3">{selected.cuisine}</p>
              )}

              <div className="flex items-center flex-wrap gap-3 mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className={`text-base ${n <= selected.rating ? 'text-[#C4784A]' : 'text-[#E8DDD4]'}`}>★</span>
                  ))}
                </div>
                {selected.difficulty && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyStyle[selected.difficulty]}`}>
                    {selected.difficulty}
                  </span>
                )}
                {selected.tried && <span className="text-xs text-green-600">✓ we&apos;ve tried it</span>}
              </div>

              {selected.description && (
                <p className="text-sm text-[#7A6155] mb-5 leading-relaxed">{selected.description}</p>
              )}

              {selected.ingredients && selected.ingredients.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#C4784A]/60 mb-2.5">Ingredients</p>
                  <ul className="flex flex-col gap-1.5">
                    {selected.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#2C1A0E]">
                        <span className="text-[#C4784A]/40 mt-0.5 shrink-0">·</span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.steps && selected.steps.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#C4784A]/60 mb-2.5">Steps</p>
                  <ol className="flex flex-col gap-3">
                    {selected.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#2C1A0E]">
                        <span className="text-[#C4784A] font-medium shrink-0 mt-px">{i + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {selected.notes && (
                <div className="rounded-xl bg-[#FDF0E8] border border-[#E8DDD4] p-3 mb-5">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#C4784A]/60 mb-1.5">Notes</p>
                  <p className="text-sm text-[#7A6155] leading-relaxed">{selected.notes}</p>
                </div>
              )}

              <div className="pt-2 border-t border-[#E8DDD4]">
                <button
                  onClick={() => deleteRecipe(selected)}
                  className="text-xs text-[#AE9B8E] hover:text-[#C4784A] transition-colors"
                >
                  delete recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
