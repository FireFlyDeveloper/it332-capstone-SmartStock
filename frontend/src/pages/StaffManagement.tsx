import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { createStaff, deleteStaff, getStaff, updateStaff, type ManagedStaff } from '../api'

export function StaffManagement() {
  const [staff, setStaff] = useState<ManagedStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<ManagedStaff | null>(null)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setStaff(await getStaff()) } catch (e) { setError(e instanceof Error ? e.message : 'Could not load staff.') } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const open = (person?: ManagedStaff) => { setEditing(person ?? null); setName(person?.name ?? ''); setEmail(person?.email ?? ''); setPassword(''); setModal(true) }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (saving) return; setSaving(true)
    try {
      if (editing) await updateStaff(editing.id, { name, email, ...(password ? { password } : {}) })
      else await createStaff({ name, email, password })
      toast.success(editing ? 'Staff account updated.' : 'Staff account created.')
      setModal(false); await load()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save staff account.') } finally { setSaving(false) }
  }
  const remove = async (person: ManagedStaff) => {
    if (!window.confirm(`Delete staff account for ${person.name} (${person.email})? This cannot be undone.`)) return
    try { await deleteStaff(person.id); toast.success('Staff account deleted.'); await load() } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete staff account.') }
  }
  return <section className="space-y-6 animate-fadeIn">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Staff Management</h1><p className="mt-1 text-sm text-slate-500">Create and maintain staff accounts.</p></div><button onClick={() => open()} className="btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4"/>Add staff</button></header>
    <div className="overflow-hidden rounded-[24px] border border-[#f1f5f9] bg-white shadow-sm">
      {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading staff…</p> : error ? <div role="alert" className="p-8 text-center text-sm text-rose-700">{error}<button className="ml-3 underline" onClick={() => void load()}>Retry</button></div> : staff.length === 0 ? <div className="p-12 text-center"><Users className="mx-auto mb-3 h-10 w-10 text-slate-300"/><p className="font-semibold text-slate-700">No staff accounts yet</p><p className="mt-1 text-sm text-slate-500">Add a staff account to grant staff access.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Created</th><th className="px-6 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{staff.map(person => <tr key={person.id}><td className="px-6 py-4 font-semibold text-slate-800">{person.name}</td><td className="px-6 py-4 text-sm text-slate-600">{person.email}</td><td className="px-6 py-4 text-sm text-slate-500">{person.createdAt ? new Date(person.createdAt).toLocaleDateString() : '—'}</td><td className="px-6 py-4"><div className="flex gap-2"><button aria-label={`Edit ${person.name}`} onClick={() => open(person)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"><Pencil className="h-4 w-4"/></button><button aria-label={`Delete ${person.name}`} onClick={() => void remove(person)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button></div></td></tr>)}</tbody></table></div>}
    </div>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white shadow-xl"><div className="flex items-center justify-between border-b p-5"><h2 className="text-lg font-bold">{editing ? 'Edit staff account' : 'Add staff account'}</h2><button aria-label="Close" onClick={() => setModal(false)} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-4 w-4"/></button></div><form onSubmit={e => void submit(e)} className="space-y-4 p-5"><label className="block text-sm font-semibold text-slate-700">Name<input className="input mt-1" value={name} onChange={e => setName(e.target.value)} required/></label><label className="block text-sm font-semibold text-slate-700">Email<input className="input mt-1" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></label><label className="block text-sm font-semibold text-slate-700">{editing ? 'Reset password (optional)' : 'Password'}<input className="input mt-1" type="password" autoComplete={editing ? 'new-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required={!editing} minLength={8}/></label>{editing && <p className="-mt-2 text-xs text-slate-500">Leave blank to keep the current password. Existing passwords are never displayed.</p>}<div className="flex gap-3 pt-2"><button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button><button disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create account'}</button></div></form></div></div>}
  </section>
}
