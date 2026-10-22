import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { projects as defaultProjects } from '../data/projects';
import { CONTACT_EMAIL, SOCIAL_LINKS, SKILLS, EXPERIENCE, NAV_LINKS } from '../data/site';
import { supabase } from '../lib/supabase';

const ContentContext = createContext(null);
const CACHE_KEY = 'kyyinfinite-content-v1';
const TIMEOUT_MS = 3500;
const DEFAULT_CONTENT = {
  'seo.title': 'Kyyinfinite® — AI & Python Student Developer',
  'seo.description': 'Kyyinfinite — Ripki Dwi Putra, high school student exploring AI architecture and Python development.',
  'site.title': 'Kyyinfinite®',
  'contact.email': CONTACT_EMAIL,
  'social.github': SOCIAL_LINKS.github,
  'social.instagram': SOCIAL_LINKS.instagram,
  'social.linkedin': SOCIAL_LINKS.linkedin,
  'footer.note': 'Learning, experimenting, and building one step at a time.',
  'contact.phone': '',
  'footer.cta_line_one': 'Let’s work',
  'footer.cta_line_two': 'together',
  'footer.contact_button': 'Get in touch',
  'footer.socials_label': 'SOCIALS',
  'footer.version_label': 'VERSION',
  'footer.local_time_label': 'LOCAL TIME',
};
const storageUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (!supabase) return '';
  const cleanPath = path.replace(/^\/+/, '').replace(/^portfolio\//, '');
  const { data } = supabase.storage.from('portfolio').getPublicUrl(cleanPath);
  return data?.publicUrl || '';
};

const defaults = {
  content: DEFAULT_CONTENT,
  projects: defaultProjects,
  skills: SKILLS,
  experience: EXPERIENCE,
  focusAreas: [],
  milestones: [],
  faqs: [],
};

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

function writeCache(value) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
}

async function withTimeout(promise, timeoutMs = TIMEOUT_MS) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Content request timed out')), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

function normalizeProject(row) {
  return {
    ...row,
    tone: row.tone || '#d9d5cb',
    image: storageUrl(row.cover_path) || row.image || '',
    shape: ['arch', 'orbit', 'sun', 'grid'].includes(row.shape) ? row.shape : 'arch',
    services: Array.isArray(row.services) ? row.services : [],
    gallery: Array.isArray(row.gallery) ? row.gallery.map((item) => ({ ...item, image: storageUrl(item.image_path || item.image) || item.image || '' })) : [],
  };
}

async function fetchPublicContent() {
  if (!supabase) return null;
  const queries = await withTimeout(Promise.all([
    supabase.from('site_content').select('key,value'),
    supabase.from('projects').select('*, project_gallery(*)').eq('published', true).order('sort_order'),
    supabase.from('skills').select('*').eq('visible', true).order('sort_order'),
    supabase.from('experience').select('*').eq('visible', true).order('sort_order'),
    supabase.from('focus_areas').select('*').eq('visible', true).order('sort_order'),
    supabase.from('milestones').select('*').eq('visible', true).order('sort_order'),
    supabase.from('faqs').select('*').eq('visible', true).order('sort_order'),
  ]));
  const [contentRes, projectsRes, skillsRes, experienceRes, focusRes, milestonesRes, faqsRes] = queries;
  const anyError = queries.find((result) => result.error);
  if (anyError) throw anyError.error;
  const content = { ...DEFAULT_CONTENT };
  for (const row of contentRes.data || []) content[row.key] = row.value;
  return {
    content,
    projects: (projectsRes.data || []).map((row) => normalizeProject({ ...row, gallery: (row.project_gallery || []).slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map((item) => ({ ...item, image: storageUrl(item.image_path) || '', tone: item.tone || row.tone })) , image: row.cover_path || '' })),
    skills: (skillsRes.data || []).map((row, index) => ({ ...row, n: row.code || String(index + 1).padStart(2, '0') })),
    experience: experienceRes.data || [],
    focusAreas: focusRes.data || [],
    milestones: milestonesRes.data || [],
    faqs: faqsRes.data || [],
  };
}

export function ContentProvider({ children }) {
  const cached = useMemo(readCache, []);
  const [data, setData] = useState(() => ({ ...defaults, ...(cached || {}) }));
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    fetchPublicContent().then((next) => {
      if (!active || !next) return;
      const merged = { ...defaults, ...next };
      setData(merged);
      setVersion((value) => value + 1);
      writeCache(merged);
    }).catch(() => {
      // The static defaults and any valid cache remain available when Supabase is unavailable.
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const title = data.content['seo.title'] || DEFAULT_CONTENT['seo.title'];
    const description = data.content['seo.description'] || DEFAULT_CONTENT['seo.description'];
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [data.content]);

  const value = useMemo(() => ({ ...data, version, ready: version > 0, contentValue: (key, fallback = '') => data.content[key] ?? fallback }), [data, version]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used within ContentProvider');
  return context;
}
export const useProjects = () => useContent().projects;
export const useNavLinks = () => { const { projects, contentValue } = useContent(); return NAV_LINKS.map((item) => ({ ...item, label: contentValue(`nav.${item.to === '/work' ? 'projects' : item.to.slice(1)}`, item.label), count: item.to === '/work' ? String(projects.length).padStart(2, '0') : undefined })); };
export const useSiteContent = () => useContent().content;
export const useSkills = () => useContent().skills;
export const useExperience = () => useContent().experience;
export const useFocusAreas = () => useContent().focusAreas;
