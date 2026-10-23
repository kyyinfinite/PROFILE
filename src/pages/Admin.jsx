import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { GalleryAdmin } from './admin/GalleryAdmin';
import { AwardsAdmin } from './admin/AwardsAdmin';
import './admin.css';

const TABLES = {
  skills: { label: 'Skills', fields: [['code','Code','text'],['title','Title','text'],['copy','Description','textarea'],['tags','Tags (comma separated)','text'],['sort_order','Order','number'],['visible','Visible','checkbox']] },
  focus_areas: { label: 'Focus areas', fields: [['title','Title','text'],['copy','Description','textarea'],['tags','Tags (comma separated)','text'],['sort_order','Order','number'],['visible','Visible','checkbox']] },
  experience: { label: 'Timeline', fields: [['period','Period','text'],['role','Role','text'],['place','Place','text'],['sort_order','Order','number'],['visible','Visible','checkbox']] },
  milestones: { label: 'Milestones', fields: [['title','Title','text'],['copy','Description','textarea'],['sort_order','Order','number'],['visible','Visible','checkbox']] },
  faqs: { label: 'FAQ', fields: [['question','Question','text'],['answer','Answer','textarea'],['sort_order','Order','number'],['visible','Visible','checkbox']] },
};
const PROJECT_FIELDS = [
  ['slug','Slug','text'],['title','Title','text'],['type','Type','text'],['year','Year','text'],['client','Client','text'],['role','Role','text'],['category','Category','text'],['description','Description','textarea'],['challenge','Challenge','textarea'],['approach','Approach','textarea'],['outcome','Outcome','textarea'],['tone','Tone (#hex)','text'],['shape','Artwork shape','select'],['repo_url','Repository URL','url'],['live_url','Live URL','url'],['services','Services (comma separated)','text'],['tech','Technologies (comma separated)','text'],['sort_order','Order','number'],['featured','Featured','checkbox'],['published','Published','checkbox'],
];
const PAGE_GROUPS = {
  Home: ['home.'], About: ['about.'], Focus: ['focus.'], Work: ['work.'], Detail: ['detail.'], 'Not found': ['notfound.'], Contact: ['contact.'], Footer: ['footer.'], Navigation: ['nav.'], SEO: ['seo.'], Social: ['social.'], Site: ['site.'],
};
const CONTENT_LABELS = {
  'home.intro.heading': 'Homepage — Headline About Me',
  'home.intro.copy': 'Homepage — Deskripsi About Me',
  'home.intro.about_label': 'Homepage — Teks tombol About Me',
  'about.heading': 'About — Headline utama',
  'about.eyebrow': 'About — Label kecil di atas headline',
  'about.intro': 'About — Intro singkat',
  'about.story': 'About — Cerita utama',
  'about.secondary': 'About — Cerita lanjutan',
  'about.skills.heading': 'About — Judul area yang dipelajari',
  'about.skills.eyebrow': 'About — Label area yang dipelajari',
  'about.milestones.heading': 'About — Judul pencapaian',
  'about.milestones.eyebrow': 'About — Label pencapaian',
  'about.timeline.heading': 'About — Judul perjalanan',
  'about.timeline.eyebrow': 'About — Label perjalanan',
  'about.cta.heading': 'About — Judul penutup',
  'about.cta.eyebrow': 'About — Label penutup',
  'about.fact1.label': 'About — Fakta pertama: label',
  'about.fact1.copy': 'About — Fakta pertama: isi',
  'about.fact2.label': 'About — Fakta kedua: label',
  'about.fact2.copy': 'About — Fakta kedua: isi',
  'footer.cta_line_one': 'Homepage — Footer: baris judul pertama',
  'footer.cta_line_two': 'Homepage — Footer: baris judul kedua',
  'footer.contact_button': 'Homepage — Footer: teks tombol kontak',
  'contact.phone': 'Homepage — Footer: nomor telepon (opsional)',
  'footer.socials_label': 'Homepage — Footer: label sosial',
  'footer.version_label': 'Homepage — Footer: label versi',
  'footer.local_time_label': 'Homepage — Footer: label waktu lokal',
};
const CONTENT_HELP = {
  'home.intro.heading': 'Kalimat besar yang tampil di atas deskripsi. Gunakan *teks* untuk italic jika didukung.',
  'home.intro.copy': 'Deskripsi singkat di bawah headline.',
  'home.intro.about_label': 'Tulisan di tombol lingkaran yang menuju halaman About.',
  'about.heading': 'Headline besar halaman About.',
  'about.intro': 'Paragraf pembuka di bawah headline.',
  'about.story': 'Cerita utama di samping foto. Gunakan *teks* untuk italic.',
  'about.secondary': 'Paragraf lanjutan yang menjelaskan proses belajar dan minat saat ini.',
  'about.portrait_path': 'Path gambar profil dari Supabase Storage. Ubah gambar melalui uploader di grup About.',
  'footer.cta_line_one': 'Baris pertama judul besar footer homepage.',
  'footer.cta_line_two': 'Baris kedua judul besar footer homepage.',
  'footer.contact_button': 'Tulisan pada tombol biru menuju halaman Contact.',
  'contact.phone': 'Opsional. Kosongkan jika tidak ingin menampilkan nomor telepon.',
  'footer.socials_label': 'Label kecil di atas daftar tautan sosial.',
  'footer.version_label': 'Label metadata di bagian bawah footer.',
  'footer.local_time_label': 'Label di atas jam lokal yang diperbarui otomatis.',
};
const blankProject = () => ({ slug:'', title:'', type:'', year:String(new Date().getFullYear()), client:'', role:'', category:'', description:'', challenge:'', approach:'', outcome:'', tone:'#d9d5cb', shape:'arch', repo_url:'', live_url:'', services:[], tech:[], sort_order:0, featured:false, published:false, cover_path:'' });
const urlValid = value => !value || /^https?:\/\//i.test(value);

function Field({ field, value, onChange, maxLengthOverride }) {
  const [key, label, type] = field;
  const limits = { slug:80,title:160,code:12,period:80,role:160,place:240,question:500,answer:3000,copy:2000,tags:500,description:4000,challenge:6000,approach:6000,outcome:6000,type:120,year:12,client:160,category:80,tone:7,repo_url:2000,live_url:2000 };
  const maxLength = maxLengthOverride || limits[key] || (type === 'textarea' ? 6000 : 10000);
  if (type === 'checkbox') return <label className="admin-check"><input type="checkbox" checked={Boolean(value)} onChange={e=>onChange(key,e.target.checked)} /> {label}</label>;
  if (type === 'select') return <label className="admin-field"><span>{label}</span><select value={value || 'arch'} onChange={e=>onChange(key,e.target.value)}>{['arch','orbit','sun','grid'].map(v=><option key={v}>{v}</option>)}</select></label>;
  return <label className="admin-field"><span>{label}</span>{type === 'textarea' ? <textarea rows="3" maxLength={maxLength} value={value ?? ''} onChange={e=>onChange(key,e.target.value)} /> : <input type={type === 'number' ? 'number' : type === 'url' ? 'url' : 'text'} maxLength={type === 'number' ? undefined : maxLength} value={Array.isArray(value) ? value.join(', ') : value ?? ''} onChange={e=>onChange(key,e.target.value)} />}</label>;
}

async function compressImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Pilih file gambar yang valid.');
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Format yang didukung: JPG, PNG, WebP.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Gambar sumber maksimal 12 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve,reject)=>canvas.toBlob(result=>result ? resolve(result) : reject(new Error('Gagal mengompres gambar.')), 'image/webp', .84));
  if (blob.size > 5 * 1024 * 1024) throw new Error('Hasil gambar masih lebih dari 5 MB.');
  return blob;
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [tab,setTab] = useState('projects');
  const [loading,setLoading] = useState(false);
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');
  const [projects,setProjects] = useState([]);
  const [project,setProject] = useState(null);
  const [rows,setRows] = useState([]);
  const [content,setContent] = useState([]);
  const [contentDraft,setContentDraft] = useState({});
  const [messages,setMessages] = useState([]);
  const [mediaKind,setMediaKind] = useState('site');
  const [mediaFile,setMediaFile] = useState(null);
  const [mediaPath,setMediaPath] = useState('');
  const [dirty,setDirty] = useState(false);
  const [uploadState,setUploadState] = useState('');
  const hasContentChanges = content.some(row => String(contentDraft[row.key] ?? row.value) !== String(row.value));

  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    const meta = existing || document.createElement('meta');
    if (!existing) { meta.name = 'robots'; document.head.appendChild(meta); }
    const previous = meta.content; meta.content = 'noindex, nofollow, noarchive';
    return () => { if (existing) meta.content = previous; else meta.remove(); };
  }, []);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return undefined; }
    let active = true;
    supabase.auth.getSession().then(({data})=>{ if(active){setSession(data.session);setAuthReady(true);} }).catch(()=>{if(active){setSession(null);setAuthReady(true);setError('Sesi tidak dapat dipulihkan. Periksa koneksi lalu coba masuk kembali.');}});
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,next)=>{ if(active) setSession(next); });
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!session?.user?.id) { setAuthorized(false); return; }
      const {data,error:checkError} = await supabase.from('admins').select('user_id').eq('user_id',session.user.id).maybeSingle();
      if (active) { setAuthorized(Boolean(data && !checkError)); if(checkError) setError('Tidak dapat memverifikasi admin. Pastikan schema.sql sudah dijalankan.'); }
    }
    check(); return ()=>{active=false;};
  },[session]);

  const run = useCallback(async fn => {
    setLoading(true); setError(''); setNotice('');
    try { await fn(); return true; } catch(e) { setError(e?.message || 'Terjadi kesalahan.'); return false; }
    finally { setLoading(false); }
  },[]);

  const loadProjects = useCallback(async()=>{
    const {data,error:e}=await supabase.from('projects').select('*,project_gallery(*)').order('sort_order').order('created_at',{ascending:false});
    if(e) throw e; setProjects(data||[]);
  },[]);
  const loadRows = useCallback(async table=>{
    const {data,error:e}=await supabase.from(table).select('*').order('sort_order');
    if(e) throw e; setRows(data||[]);
  },[]);
  const loadContent = useCallback(async()=>{
    const {data,error:e}=await supabase.from('site_content').select('*').order('key');
    if(e) throw e; setContent(data||[]); setContentDraft(Object.fromEntries((data||[]).map(r=>[r.key,r.value])));
  },[]);
  const loadMessages = useCallback(async()=>{
    const {data,error:e}=await supabase.from('messages').select('*').order('created_at',{ascending:false});
    if(e) throw e; setMessages(data||[]);
  },[]);
  useEffect(()=>{ if(!authorized || !supabase) return; run(async()=>{await loadProjects();await loadContent();}); },[authorized,loadProjects,loadContent,run]);
  useEffect(()=>{ const contentDirty=content.some(row=>String(contentDraft[row.key]??row.value)!==String(row.value)); if(!dirty&&!contentDirty)return undefined; const handler=event=>{event.preventDefault();event.returnValue='';}; window.addEventListener('beforeunload',handler); return()=>window.removeEventListener('beforeunload',handler); },[dirty,content,contentDraft]);
  useEffect(()=>{ if(!authorized || !supabase) return; if(TABLES[tab]) run(()=>loadRows(tab)); if(tab==='messages') run(loadMessages); },[tab,authorized,loadRows,loadMessages,run]);

  const login = e => { e.preventDefault(); run(async()=>{const {error:e}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(e)throw e;setPassword('');}); };
  const logout = () => run(async()=>{const {error:e}=await supabase.auth.signOut();if(e)throw e;setSession(null);setAuthorized(false);});
  const setProjectField = (key,value) => { setProject(p=>({...p,[key]:['services','tech'].includes(key)?String(value).split(',').map(s=>s.trim()).filter(Boolean):key==='sort_order'?Number(value):value}));setDirty(true); };
  const saveProject = () => run(async()=>{
    if(!project) return;
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) throw new Error('Slug harus berupa huruf kecil, angka, dan tanda hubung.');
    if(!project.title?.trim()) throw new Error('Judul proyek wajib diisi.');
    if(!urlValid(project.repo_url)||!urlValid(project.live_url)) throw new Error('URL harus menggunakan http:// atau https://.');
    const payload={...project,title:project.title.trim(),slug:project.slug.trim(),services:Array.isArray(project.services)?project.services:[],tech:Array.isArray(project.tech)?project.tech:[]}; delete payload.project_gallery; delete payload.created_at; delete payload.updated_at;
    const {data,error:e}=await supabase.from('projects').upsert(payload).select().single(); if(e) throw e;
    setProject(data);setDirty(false);setNotice('Proyek tersimpan.');await loadProjects();
  });
  const deleteProject = row => { if(!window.confirm(`Hapus proyek “${row.title}” beserta galerinya?`)) return; run(async()=>{const {error:e}=await supabase.from('projects').delete().eq('id',row.id);if(e)throw e;if(project?.id===row.id)setProject(null);await loadProjects();setNotice('Proyek dihapus.');}); };
  const saveContent = key => run(async()=>{const value=String(contentDraft[key]??'');if(value.length>10000)throw new Error('Konten maksimal 10.000 karakter.');if(key.startsWith('social.')&&!urlValid(value))throw new Error('URL sosial harus memakai http:// atau https://.');if(key==='contact.email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new Error('Format email tidak valid.');const {error:e}=await supabase.from('site_content').upsert({key,value});if(e)throw e;setContent(prev=>{const exists=prev.some(r=>r.key===key);return exists?prev.map(r=>r.key===key?{...r,value:contentDraft[key]}:r):[...prev,{key,value:contentDraft[key]}].sort((a,b)=>a.key.localeCompare(b.key));});setNotice(`Konten “${key}” tersimpan.`);});
  const saveRow = (table,row) => run(async()=>{const payload={...row};delete payload.created_at;delete payload.updated_at;delete payload.project_gallery;delete payload.id; if(typeof payload.tags==='string') payload.tags=payload.tags; const query=row.id?supabase.from(table).update(payload).eq('id',row.id):supabase.from(table).insert(payload);const {error:e}=await query;if(e)throw e;await loadRows(table);setNotice('Data tersimpan.');});
  const deleteRow = (table,row) => { if(!window.confirm('Hapus item ini?'))return;run(async()=>{const {error:e}=await supabase.from(table).delete().eq('id',row.id);if(e)throw e;await loadRows(table);}); };
  const toggleRead = row => run(async()=>{const {error:e}=await supabase.from('messages').update({is_read:!row.is_read}).eq('id',row.id);if(e)throw e;await loadMessages();});

  const upload = async (file,path) => {
    setUploadState('Memvalidasi file…');
    let body=file, extension=file.name.split('.').pop().toLowerCase(), contentType=file.type;
    if(file.type.startsWith('image/')) { body=await compressImage(file);extension='webp';contentType='image/webp'; }
    else if(file.type==='application/pdf') { if(file.size>5*1024*1024) throw new Error('PDF maksimal 5 MB.');extension='pdf';contentType='application/pdf'; }
    else throw new Error('Format file harus JPG, PNG, WebP, atau PDF.');
    const safeName=`${Date.now()}-${crypto.randomUUID().slice(0,8)}.${extension}`;
    const fullPath=`${path}/${safeName}`;
    setUploadState('Mengunggah file…');
    const { data: uploaded, error: uploadError } = await supabase.storage.from('portfolio').upload(fullPath, body, { contentType, upsert: false, cacheControl: '3600' });
    if (uploadError) throw new Error(`Upload Storage gagal: ${uploadError.message}`);
    const { data: publicData } = supabase.storage.from('portfolio').getPublicUrl(uploaded?.path || fullPath);
    if (!publicData?.publicUrl) throw new Error('File terunggah tetapi URL publik tidak dapat dibuat. Periksa bucket portfolio.');
    const { data: checkData, error: checkError } = await supabase.storage.from('portfolio').list(path, { search: safeName, limit: 1 });
    if (checkError) throw new Error(`File diunggah, tetapi verifikasi Storage gagal: ${checkError.message}`);
    if (!checkData?.some((item) => item.name === safeName)) throw new Error('Upload belum dapat diverifikasi di bucket portfolio.');
    setUploadState('Selesai');return uploaded?.path || fullPath;
  };
  const uploadProjectImage = (file,kind) => run(async()=>{
    if(!project?.slug || !project?.id) throw new Error('Simpan proyek terlebih dahulu sebelum mengunggah gambar.');
    const path=await upload(file,`projects/${project.slug}`);
    if(kind==='cover') { const {data:updated,error:e}=await supabase.from('projects').update({cover_path:path}).eq('id',project.id).select('id,cover_path').single();if(e)throw new Error(`Gambar sudah diunggah, tetapi path cover gagal disimpan: ${e.message}`);setProject(p=>({...p,cover_path:updated.cover_path})); }
    else { if(!project.id)throw new Error('Simpan proyek sebelum menambahkan galeri.');const {error:e}=await supabase.from('project_gallery').insert({project_id:project.id,title:file.name.replace(/\.[^.]+$/,''),image_path:path,sort_order:(project.project_gallery||[]).length});if(e)throw new Error(`Gambar sudah diunggah, tetapi data galeri gagal disimpan: ${e.message}`);const {data,error:re}=await supabase.from('project_gallery').select('*').eq('project_id',project.id).order('sort_order');if(re)throw re;setProject(p=>({...p,project_gallery:data||[]})); }
    await loadProjects();setNotice('Gambar berhasil diunggah.');
  });
  const uploadSiteFile = () => run(async()=>{
    if(!mediaFile)throw new Error('Pilih file terlebih dahulu.');
    const path=await upload(mediaFile,mediaKind==='cv'?'site/cv':mediaKind==='portrait'?'about/portrait':'site/media');setMediaPath(path);
    const key=mediaKind==='cv'?'contact.cv_path':mediaKind==='portrait'?'about.portrait_path':'site.media_path';
    const {error:e}=await supabase.from('site_content').upsert({key,value:path});if(e)throw e;
    await loadContent();setNotice(`File tersimpan di ${path}.`);setMediaFile(null);
  });

  if(!supabase) return <main className="admin-shell"><section className="admin-panel"><h1>Admin</h1><p>Supabase belum dikonfigurasi. Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di file environment lokal lalu restart Vite.</p></section></main>;
  if(!authReady) return <main className="admin-shell"><p>Memulihkan sesi…</p></main>;
  if(!session) return <main className="admin-shell"><form className="admin-login" onSubmit={login}><p className="admin-kicker">KYYINFINITE / PRIVATE</p><h1>Admin sign in</h1><p>Masuk menggunakan akun yang dibuat di Supabase. Pendaftaran publik tidak tersedia di sini.</p>{error&&<p className="admin-error" role="alert">{error}</p>}<label className="admin-field"><span>Email</span><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label className="admin-field"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button className="admin-button admin-primary" disabled={loading}>{loading?'Memproses…':'Masuk'}</button></form></main>;
  if(!authorized) return <main className="admin-shell"><section className="admin-panel"><h1>Akses ditolak</h1><p>Akun ini belum terdaftar sebagai admin pada tabel <code>public.admins</code>.</p><button className="admin-button" onClick={logout}>Keluar</button>{error&&<p className="admin-error">{error}</p>}</section></main>;

  return <main className="admin-shell"><header className="admin-top"><div><p className="admin-kicker">KYYINFINITE / CONTROL ROOM</p><h1>Content admin</h1><p>{session.user.email}</p></div><button className="admin-button" onClick={logout}>Keluar</button></header>
    {error&&<p className="admin-error" role="alert">{error}</p>}{notice&&<p className="admin-notice" role="status">{notice}</p>}
    <nav className="admin-tabs" aria-label="Admin sections">{[['projects','Projects'],['content','Site content'],['skills','Skills'],['focus_areas','Focus'],['experience','Timeline'],['milestones','Milestones'],['faqs','FAQ'],['gallery','Gallery'],['awards','Awards'],['messages','Inbox'],['media','Media / CV']].map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>{if((dirty||hasContentChanges)&&!window.confirm('Ada perubahan yang belum disimpan. Lanjutkan tanpa menyimpan?'))return;setDirty(false);setTab(id);}}>{label}</button>)}</nav>
    {loading&&<p className="admin-loading" aria-live="polite">Memproses…</p>}{uploadState==='Mengunggah file…'&&<progress className="admin-progress" aria-label="Upload in progress" />}
    {tab==='projects'&&<section className="admin-layout"><div className="admin-panel"><div className="admin-section-title"><h2>Projects ({projects.length})</h2><button className="admin-button admin-primary" onClick={()=>{if((dirty||hasContentChanges)&&!window.confirm('Ada perubahan yang belum disimpan. Lanjutkan tanpa menyimpan?'))return;setProject(blankProject());setDirty(false);}}>+ New</button></div>{projects.map(row=><article className="admin-list-row" key={row.id}><button className="admin-row-main" onClick={()=>{if((dirty||hasContentChanges)&&!window.confirm('Buang perubahan yang belum disimpan?'))return;setProject({...row,services:row.services||[],tech:row.tech||[]});setDirty(false);}}><strong>{row.title}</strong><small>{row.slug} · {row.published?'Published':'Draft'}</small></button><button className="admin-danger-text" onClick={()=>deleteProject(row)}>Delete</button></article>)}</div>
      <div className="admin-panel">{project?<><div className="admin-section-title"><h2>{project.id?'Edit project':'New project'}</h2><button className="admin-text-button" onClick={()=>{if((dirty||hasContentChanges)&&!window.confirm('Buang perubahan yang belum disimpan?'))return;setProject(null);setDirty(false);}}>Close</button></div><div className="admin-fields">{PROJECT_FIELDS.map(field=><Field key={field[0]} field={field} value={project[field[0]]} onChange={setProjectField} maxLengthOverride={field[0]==='title'?120:undefined}/>)}</div><button className="admin-button admin-primary" onClick={saveProject} disabled={loading}>Save project</button>
        <div className="admin-upload-block"><h3>Cover image</h3>{project.cover_path&&<><p className="admin-muted">{project.cover_path}</p><img className="admin-media-preview" src={supabase.storage.from('portfolio').getPublicUrl(project.cover_path).data.publicUrl} alt="Project cover preview" onError={e=>{e.currentTarget.style.display='none';}} /></>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>e.target.files?.[0]&&uploadProjectImage(e.target.files[0],'cover')}/><p className="admin-muted">Gambar dikompres ke WebP, maksimal 5 MB setelah kompresi.</p></div>
        <div className="admin-upload-block"><h3>Gallery</h3>{(project.project_gallery||[]).map(g=><div className="admin-list-row" key={g.id}><img className="admin-gallery-thumb" src={supabase.storage.from('portfolio').getPublicUrl(g.image_path).data.publicUrl} alt={g.title||'Gallery image'} loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/><span>{g.title||g.image_path}</span><button className="admin-danger-text" onClick={()=>run(async()=>{const {error:e}=await supabase.from('project_gallery').delete().eq('id',g.id);if(e)throw e;setProject(p=>({...p,project_gallery:p.project_gallery.filter(x=>x.id!==g.id)}));})}>Remove</button></div>)}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>e.target.files?.[0]&&uploadProjectImage(e.target.files[0],'gallery')}/></div>
      </>:<p className="admin-muted">Pilih proyek untuk mengedit atau tekan “New”.</p>}</div></section>}
    {tab==='content'&&<section className="admin-panel"><h2>Site content</h2><p className="admin-muted">Untuk mengubah tulisan pada screenshot, buka grup <strong>Home</strong> lalu edit field Homepage — Headline About Me, Deskripsi About Me, atau Teks tombol About Me. Perubahan disimpan ke Supabase saat tombol Simpan ditekan. Teks disimpan sebagai plain text. Gunakan <code>*teks*</code> untuk italic dan baris baru untuk line break pada komponen yang mendukung format ini.</p>{Object.entries(PAGE_GROUPS).map(([group,prefixes])=>{const entries=content.filter(r=>prefixes.some(prefix=>r.key.startsWith(prefix)));return <details className="admin-content-group" key={group} open={group==='Home'}><summary>{group} <small>{entries.length} keys</small></summary>{group==='About'&&<div className="admin-about-upload"><h3>Foto profil About</h3><p className="admin-muted">Foto disimpan di Supabase Storage bucket <code>portfolio</code>, bukan di folder public. Format JPG, PNG, atau WebP.</p>{content.find(r=>r.key==='about.portrait_path')?.value&&<><img className="admin-media-preview admin-about-preview" src={supabase.storage.from('portfolio').getPublicUrl(content.find(r=>r.key==='about.portrait_path').value).data.publicUrl} alt="About portrait preview"/><p className="admin-muted">Path saat ini: <code>{content.find(r=>r.key==='about.portrait_path').value}</code></p></>}<label className="admin-field"><span>Pilih foto baru</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{setMediaKind('portrait');setMediaFile(e.target.files?.[0]||null);setUploadState('');}} /></label><button className="admin-button admin-primary" disabled={!mediaFile||mediaKind!=='portrait'||loading} onClick={uploadSiteFile}>Upload foto ke Supabase</button>{uploadState&&<p className="admin-muted" role="status">{uploadState}</p>}</div>}{entries.map(item=><div className={`admin-content-row${item.key.startsWith('home.intro.')?' admin-content-row-intro':''}`} key={item.key}><label className="admin-field"><span>{CONTENT_LABELS[item.key]||item.key}</span>{CONTENT_HELP[item.key]&&<small className="admin-muted">{CONTENT_HELP[item.key]}</small>}<textarea rows={item.key==='home.intro.heading'?4:2} maxLength={10000} value={contentDraft[item.key]??item.value} onChange={e=>setContentDraft(p=>({...p,[item.key]:e.target.value}))}/></label><button className="admin-button" onClick={()=>saveContent(item.key)}>Simpan</button></div>)}</details>;})}<NewContent onSave={(key,value)=>run(async()=>{const {error:e}=await supabase.from('site_content').upsert({key,value});if(e)throw e;await loadContent();setNotice('Key konten baru disimpan.');})} /></section>}
    {TABLES[tab]&&<GenericEditor key={tab} table={tab} rows={rows} onSave={saveRow} onDelete={deleteRow} loading={loading}/>}
    {tab==='messages'&&<section className="admin-panel"><h2>Contact inbox ({messages.length})</h2>{!messages.length&&<p className="admin-muted">Belum ada pesan masuk.</p>}{messages.map(m=><article className={`admin-message ${m.is_read?'is-read':''}`} key={m.id}><div className="admin-section-title"><strong>{m.subject||'No subject'}</strong><button className="admin-button" onClick={()=>toggleRead(m)}>{m.is_read?'Mark unread':'Mark read'}</button></div><p>{m.name} · <a href={`mailto:${m.email}`}>{m.email}</a></p><p className="admin-muted">{new Date(m.created_at).toLocaleString()}</p><p className="admin-message-body">{m.message}</p><button className="admin-danger-text" onClick={()=>{if(!window.confirm('Hapus pesan ini secara permanen?'))return;run(async()=>{const {error:e}=await supabase.from('messages').delete().eq('id',m.id);if(e)throw e;await loadMessages();});}}>Delete message</button></article>)}</section>}
    {tab==='gallery'&&<GalleryAdmin />}
    {tab==='awards'&&<AwardsAdmin />}
    {tab==='media'&&<section className="admin-panel"><h2>Media / CV</h2><p className="admin-muted">Gambar otomatis diubah menjadi WebP. PDF dipertahankan. Batas file 5 MB, tanpa SVG.</p><label className="admin-field"><span>Upload purpose</span><select value={mediaKind} onChange={e=>setMediaKind(e.target.value)}><option value="cv">CV / resume (PDF)</option><option value="portrait">About portrait</option><option value="site">Site image</option></select></label><label className="admin-field"><span>Choose file</span><input type="file" accept={mediaKind==='cv'?'application/pdf':'image/jpeg,image/png,image/webp'} onChange={e=>setMediaFile(e.target.files?.[0]||null)}/></label><button className="admin-button admin-primary" onClick={uploadSiteFile} disabled={!mediaFile||loading}>Upload file</button>{uploadState&&<p className="admin-muted" role="status">{uploadState}</p>}{mediaPath&&<p>Path: <code>{mediaPath}</code></p>}{content.find(r=>r.key==='contact.cv_path')&&<p>Current CV path: <code>{content.find(r=>r.key==='contact.cv_path').value}</code></p>}<p className="admin-muted">Path disimpan di <code>{mediaKind==='cv'?'contact.cv_path':mediaKind==='portrait'?'about.portrait_path':'site.media_path'}</code>. CV dan portrait akan digunakan oleh halaman publik.</p></section>}
  </main>;
}

function NewContent({onSave}) {
  const [key,setKey]=useState('');const [value,setValue]=useState('');
  return <form className="admin-new-content" onSubmit={async e=>{e.preventDefault();if(!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(key))return;const ok=await onSave(key,value);if(ok){setKey('');setValue('');}}}><h3>Add content key</h3><label className="admin-field"><span>Key (e.g. about.heading)</span><input value={key} onChange={e=>setKey(e.target.value)} pattern="[a-z0-9]+([._-][a-z0-9]+)*" required maxLength="120"/></label><label className="admin-field"><span>Value</span><textarea value={value} onChange={e=>setValue(e.target.value)} maxLength="10000" rows="3"/></label><button className="admin-button admin-primary">Add key</button></form>;
}
function GenericEditor({table,rows,onSave,onDelete,loading}) {
  const config=TABLES[table];const [editing,setEditing]=useState(null);
  const fresh=()=>Object.fromEntries(config.fields.map(([key,,type])=>[key,type==='checkbox'?true:type==='number'?rows.length:'']));
  return <section className="admin-panel"><div className="admin-section-title"><h2>{config.label} ({rows.length})</h2><button className="admin-button admin-primary" onClick={()=>setEditing({ ...fresh() })}>+ Add item</button></div>{editing&&<div className="admin-editor-card"><h3>{editing.id?'Edit item':'New item'}</h3><div className="admin-fields">{config.fields.map(field=><Field key={field[0]} field={field} value={editing[field[0]]} onChange={(key,value)=>setEditing(p=>({...p,[key]:config.fields.find(field=>field[0]===key)?.[2]==='number'?Number(value):value}))}/>)}</div><div className="admin-actions"><button className="admin-button admin-primary" disabled={loading} onClick={async()=>{const ok=await onSave(table,editing);if(ok)setEditing(null);}}>Save</button><button className="admin-button" onClick={()=>setEditing(null)}>Cancel</button></div></div>}{rows.map(row=><article className="admin-list-row" key={row.id}><div className="admin-row-main"><strong>{row.title||row.role||row.question||'Untitled'}</strong><small>{row.visible===false?'Hidden':'Visible'} · order {row.sort_order??0}</small></div><button className="admin-button" onClick={()=>setEditing({...row})}>Edit</button><button className="admin-danger-text" onClick={()=>onDelete(table,row)}>Delete</button></article>)}</section>;
}
