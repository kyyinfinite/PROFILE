import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { explain, publicUrl, removeObject, uploadImage } from './media';

const LEVELS = [['', 'Tanpa tingkat'], ['sekolah', 'Sekolah'], ['kecamatan', 'Kecamatan'], ['kabupaten', 'Kabupaten'], ['provinsi', 'Provinsi'], ['nasional', 'Nasional'], ['internasional', 'Internasional']];
const blank = (count) => ({ title: '', issuer: '', rank: '', level: '', awarded_year: '', description: '', image_path: '', credential_url: '', featured: false, visible: true, sort_order: count });
const urlValid = (value) => !value || /^https?:\/\//i.test(value);

/** Awards manager: create/edit/delete, optional certificate photo upload, show/hide and featured flags. */
export function AwardsAdmin() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.from('awards').select('*').order('sort_order').order('created_at');
    if (loadError) throw loadError;
    setRows(data || []);
  }, []);
  useEffect(() => { load().catch((e) => setError(explain(e))); }, [load]);

  const guard = async (fn) => {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); return true; } catch (e) { setError(explain(e)); return false; } finally { setBusy(false); }
  };
  const set = (key, value) => setEditing((current) => ({ ...current, [key]: value }));

  const save = () => guard(async () => {
    if (!editing.title.trim()) throw new Error('Judul penghargaan wajib diisi.');
    if (!urlValid(editing.credential_url.trim())) throw new Error('Tautan harus diawali http:// atau https://.');
    const year = editing.awarded_year === '' || editing.awarded_year == null ? null : Number(editing.awarded_year);
    if (year !== null && (!Number.isInteger(year) || year < 1990 || year > 2100)) throw new Error('Tahun harus antara 1990 dan 2100.');
    const payload = {
      title: editing.title.trim(), issuer: editing.issuer.trim(), rank: editing.rank.trim(), level: editing.level,
      awarded_year: year, description: editing.description.trim(), image_path: editing.image_path || '',
      credential_url: editing.credential_url.trim(), featured: editing.featured, visible: editing.visible, sort_order: Number(editing.sort_order) || 0,
    };
    const query = editing.id ? supabase.from('awards').update(payload).eq('id', editing.id) : supabase.from('awards').insert(payload);
    const { data, error: saveError } = await query.select().single();
    if (saveError) throw saveError;
    setEditing({ ...data, awarded_year: data.awarded_year ?? '' });
    setNotice('Penghargaan tersimpan.'); await load();
  });

  const remove = (row) => {
    if (!window.confirm(`Hapus penghargaan “${row.title}”?`)) return;
    guard(async () => {
      const { error: deleteError } = await supabase.from('awards').delete().eq('id', row.id);
      if (deleteError) throw deleteError;
      await removeObject(row.image_path);
      if (editing?.id === row.id) setEditing(null);
      setNotice('Penghargaan dihapus.'); await load();
    });
  };

  const uploadCertificate = (file) => guard(async () => {
    if (!file) return;
    if (!editing?.id) throw new Error('Simpan penghargaan terlebih dahulu sebelum mengunggah sertifikat.');
    const previous = editing.image_path;
    const { path } = await uploadImage(file, 'awards');
    const { error: updateError } = await supabase.from('awards').update({ image_path: path }).eq('id', editing.id);
    if (updateError) { await removeObject(path); throw updateError; }
    if (previous) await removeObject(previous);
    set('image_path', path); setNotice('Sertifikat diunggah.'); await load();
  });

  const clearCertificate = () => guard(async () => {
    const previous = editing.image_path;
    const { error: updateError } = await supabase.from('awards').update({ image_path: '' }).eq('id', editing.id);
    if (updateError) throw updateError;
    await removeObject(previous); set('image_path', ''); await load();
  });

  return (
    <section className="admin-panel">
      <div className="admin-section-title"><h2>Awards ({rows.length})</h2><button className="admin-button admin-primary" onClick={() => setEditing(blank(rows.length))}>+ Tambah penghargaan</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-notice" role="status">{notice}</p>}

      {editing && (
        <div className="admin-editor-card">
          <h3>{editing.id ? 'Edit penghargaan' : 'Penghargaan baru'}</h3>
          <div className="admin-fields">
            <label className="admin-field"><span>Judul</span><input maxLength={200} value={editing.title} onChange={(e) => set('title', e.target.value)} /></label>
            <label className="admin-field"><span>Penyelenggara / sumber</span><input maxLength={200} value={editing.issuer} onChange={(e) => set('issuer', e.target.value)} /></label>
            <label className="admin-field"><span>Peringkat (mis. Juara 1, Finalis)</span><input maxLength={60} value={editing.rank} onChange={(e) => set('rank', e.target.value)} /></label>
            <label className="admin-field"><span>Tingkat</span><select value={editing.level} onChange={(e) => set('level', e.target.value)}>{LEVELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="admin-field"><span>Tahun</span><input type="number" min="1990" max="2100" value={editing.awarded_year ?? ''} onChange={(e) => set('awarded_year', e.target.value)} /></label>
            <label className="admin-field"><span>Urutan</span><input type="number" value={editing.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></label>
            <label className="admin-field"><span>Deskripsi</span><textarea rows="3" maxLength={2000} value={editing.description} onChange={(e) => set('description', e.target.value)} /></label>
            <label className="admin-field"><span>Tautan (opsional)</span><input type="url" maxLength={2000} value={editing.credential_url} onChange={(e) => set('credential_url', e.target.value)} placeholder="https://" /></label>
            <label className="admin-check"><input type="checkbox" checked={editing.visible} onChange={(e) => set('visible', e.target.checked)} /> Tampil di situs</label>
            <label className="admin-check"><input type="checkbox" checked={editing.featured} onChange={(e) => set('featured', e.target.checked)} /> Unggulan</label>
          </div>

          <div className="admin-upload-block">
            <h3>Foto sertifikat / piala (opsional)</h3>
            {editing.image_path && <img className="admin-media-preview" src={publicUrl(editing.image_path)} alt="Pratinjau sertifikat" />}
            {!editing.id && <p className="admin-muted">Simpan penghargaan dulu, lalu unggah fotonya.</p>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { uploadCertificate(e.target.files?.[0]); e.target.value = ''; }} />
            <div className="admin-actions">
              <button className="admin-button" disabled={busy || !editing.id} onClick={() => fileRef.current?.click()}>{editing.image_path ? 'Ganti foto' : 'Unggah foto'}</button>
              {editing.image_path && <button className="admin-danger-text" disabled={busy} onClick={clearCertificate}>Hapus foto</button>}
            </div>
          </div>

          <div className="admin-actions"><button className="admin-button admin-primary" disabled={busy} onClick={save}>Simpan</button><button className="admin-button" onClick={() => setEditing(null)}>Tutup</button></div>
        </div>
      )}

      {!rows.length && !error && <p className="admin-muted">Belum ada penghargaan.</p>}
      {rows.map((row) => (
        <article className="admin-list-row" key={row.id}>
          <div className="admin-row-main"><strong>{row.title}</strong><small>{[row.rank, row.level, row.issuer, row.awarded_year].filter(Boolean).join(' · ')} · {row.visible ? 'Tampil' : 'Disembunyikan'}{row.featured ? ' · Unggulan' : ''}</small></div>
          <button className="admin-button" onClick={() => setEditing({ ...blank(0), ...row, awarded_year: row.awarded_year ?? '' })}>Edit</button>
          <button className="admin-danger-text" onClick={() => remove(row)}>Hapus</button>
        </article>
      ))}
    </section>
  );
}
