import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { explain, publicUrl, removeObject, uploadImage } from './media';

const blank = (rows) => ({ title: '', caption: '', alt_text: '', category: 'Kegiatan', taken_on: '', featured: false, visible: true, sort_order: rows.length });

/** Gallery manager: drag & drop / multi-file upload, edit metadata, reorder, show/hide and delete. */
export function GalleryAdmin() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [category, setCategory] = useState('Kegiatan');
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.from('gallery_items').select('*').order('sort_order').order('created_at', { ascending: false });
    if (loadError) throw loadError;
    setRows(data || []);
  }, []);
  useEffect(() => { load().catch((e) => setError(explain(e))); }, [load]);

  const guard = async (fn) => {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); return true; } catch (e) { setError(explain(e)); return false; } finally { setBusy(false); }
  };

  const uploadFiles = async (fileList) => {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'));
    if (!files.length) { setError('Pilih file gambar (JPG, PNG, atau WebP).'); return; }
    setError(''); setNotice('');
    setQueue(files.map((file) => ({ name: file.name, state: 'menunggu' })));
    setBusy(true);
    let done = 0;
    let order = rows.length;
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const mark = (state) => setQueue((q) => q.map((item, index) => (index === i ? { ...item, state } : item)));
      try {
        mark('mengunggah…');
        const { path, width, height } = await uploadImage(file, 'gallery');
        const { error: insertError } = await supabase.from('gallery_items').insert({
          title: /^(img|dsc|pxl|wa|vid|screenshot|photo)[\s_-]*\d/i.test(file.name) ? '' : file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 160),
          category: category.trim() || 'Kegiatan', image_path: path, width, height, sort_order: order,
        });
        if (insertError) { await removeObject(path); throw insertError; }
        order += 1; done += 1; mark('selesai');
      } catch (e) { mark(`gagal: ${explain(e)}`); }
    }
    setBusy(false);
    setNotice(`${done} dari ${files.length} foto berhasil diunggah.`);
    try { await load(); } catch (e) { setError(explain(e)); }
  };

  const save = () => guard(async () => {
    const payload = {
      title: editing.title.trim(), caption: editing.caption.trim(), alt_text: editing.alt_text.trim(),
      category: editing.category.trim() || 'Kegiatan', taken_on: editing.taken_on || null,
      featured: editing.featured, visible: editing.visible, sort_order: Number(editing.sort_order) || 0,
    };
    const { error: saveError } = await supabase.from('gallery_items').update(payload).eq('id', editing.id);
    if (saveError) throw saveError;
    setEditing(null); setNotice('Perubahan tersimpan.'); await load();
  });

  const remove = (row) => {
    if (!window.confirm(`Hapus foto “${row.title || 'tanpa judul'}” beserta file-nya?`)) return;
    guard(async () => {
      const { error: deleteError } = await supabase.from('gallery_items').delete().eq('id', row.id);
      if (deleteError) throw deleteError;
      await removeObject(row.image_path);
      if (editing?.id === row.id) setEditing(null);
      setNotice('Foto dihapus.'); await load();
    });
  };

  const toggleVisible = (row) => guard(async () => {
    const { error: toggleError } = await supabase.from('gallery_items').update({ visible: !row.visible }).eq('id', row.id);
    if (toggleError) throw toggleError; await load();
  });

  // Reorder by swapping sort_order with the neighbour, then renumbering to keep values unique and stable.
  const move = (index, direction) => guard(async () => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = rows.slice();
    [next[index], next[target]] = [next[target], next[index]];
    const updates = next.map((row, order) => ({ id: row.id, order })).filter((item, order) => next[order].sort_order !== item.order);
    for (const { id, order } of updates) {
      const { error: moveError } = await supabase.from('gallery_items').update({ sort_order: order }).eq('id', id);
      if (moveError) throw moveError;
    }
    await load();
  });

  const onDrop = (event) => { event.preventDefault(); setDragging(false); if (!busy) uploadFiles(event.dataTransfer.files); };
  const set = (key, value) => setEditing((current) => ({ ...current, [key]: value }));

  return (
    <section className="admin-panel">
      <div className="admin-section-title"><h2>Gallery ({rows.length})</h2></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-notice" role="status">{notice}</p>}

      <div className={`admin-dropzone${dragging ? ' is-dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
        <p><strong>Tarik foto ke sini</strong> atau pilih dari perangkat. Bisa banyak file sekaligus.</p>
        <p className="admin-muted">Otomatis diperkecil (maks 2200 px) dan diubah ke WebP. Ukuran akhir maks 5 MB.</p>
        <label className="admin-field admin-inline"><span>Kategori untuk unggahan ini</span><input value={category} maxLength={60} onChange={(e) => setCategory(e.target.value)} placeholder="Pramuka, OSIS, Lomba…" /></label>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }} />
        <button type="button" className="admin-button admin-primary" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? 'Memproses…' : 'Pilih foto'}</button>
        {queue.length > 0 && <ul className="admin-queue">{queue.map((item, i) => <li key={`${item.name}-${i}`}><span>{item.name}</span><small>{item.state}</small></li>)}</ul>}
      </div>

      {editing && (
        <div className="admin-editor-card">
          <h3>Edit foto</h3>
          <img className="admin-media-preview" src={publicUrl(editing.image_path)} alt={editing.alt_text || editing.title || 'Pratinjau'} />
          <div className="admin-fields">
            <label className="admin-field"><span>Judul</span><input maxLength={160} value={editing.title} onChange={(e) => set('title', e.target.value)} /></label>
            <label className="admin-field"><span>Kategori</span><input maxLength={60} value={editing.category} onChange={(e) => set('category', e.target.value)} /></label>
            <label className="admin-field"><span>Tanggal pengambilan</span><input type="date" value={editing.taken_on || ''} onChange={(e) => set('taken_on', e.target.value)} /></label>
            <label className="admin-field"><span>Urutan</span><input type="number" value={editing.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></label>
            <label className="admin-field"><span>Keterangan</span><textarea rows="3" maxLength={1000} value={editing.caption} onChange={(e) => set('caption', e.target.value)} /></label>
            <label className="admin-field"><span>Teks alternatif (aksesibilitas)</span><input maxLength={300} value={editing.alt_text} onChange={(e) => set('alt_text', e.target.value)} placeholder="Deskripsi singkat isi foto" /></label>
            <label className="admin-check"><input type="checkbox" checked={editing.visible} onChange={(e) => set('visible', e.target.checked)} /> Tampil di situs</label>
            <label className="admin-check"><input type="checkbox" checked={editing.featured} onChange={(e) => set('featured', e.target.checked)} /> Unggulan</label>
          </div>
          <div className="admin-actions"><button className="admin-button admin-primary" disabled={busy} onClick={save}>Simpan</button><button className="admin-button" onClick={() => setEditing(null)}>Batal</button></div>
        </div>
      )}

      {!rows.length && !error && <p className="admin-muted">Belum ada foto. Unggah foto pertama di atas.</p>}
      <div className="admin-gallery-grid">
        {rows.map((row, index) => (
          <article key={row.id} className={`admin-gallery-card${row.visible ? '' : ' is-hidden'}`}>
            <img src={publicUrl(row.image_path)} alt={row.alt_text || row.title || 'Foto galeri'} loading="lazy" />
            <div className="admin-gallery-info"><strong>{row.title || 'Tanpa judul'}</strong><small>{row.category} · {row.visible ? 'Tampil' : 'Disembunyikan'}{row.featured ? ' · Unggulan' : ''}</small></div>
            <div className="admin-gallery-actions">
              <button className="admin-button" disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label="Pindah naik">↑</button>
              <button className="admin-button" disabled={busy || index === rows.length - 1} onClick={() => move(index, 1)} aria-label="Pindah turun">↓</button>
              <button className="admin-button" onClick={() => toggleVisible(row)} disabled={busy}>{row.visible ? 'Sembunyikan' : 'Tampilkan'}</button>
              <button className="admin-button" onClick={() => setEditing({ ...blank(rows), ...row, taken_on: row.taken_on || '' })}>Edit</button>
              <button className="admin-danger-text" onClick={() => remove(row)}>Hapus</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
