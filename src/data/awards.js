/** Cadangan statis (dipakai bila Supabase belum terhubung / tabel awards belum dibuat). Sama dengan seed di supabase/gallery-awards.sql. */
export const AWARD_LEVELS = [
  { id: 'internasional', label: 'Internasional' },
  { id: 'nasional', label: 'Nasional' },
  { id: 'provinsi', label: 'Provinsi' },
  { id: 'kabupaten', label: 'Kabupaten' },
  { id: 'kecamatan', label: 'Kecamatan' },
  { id: 'sekolah', label: 'Sekolah' },
];
export const levelLabel = (id) => AWARD_LEVELS.find((level) => level.id === id)?.label || '';

export const DEFAULT_AWARDS = [
  { id: 'a1', title: 'Juara 1 Silat Tanding Putra — Internasional', issuer: 'Pakubumi Open', rank: 'Juara 1', level: 'internasional', awarded_year: null, description: 'Juara pertama silat tanding putra tingkat internasional (tingkat SD).', featured: true },
  { id: 'a2', title: 'Juara 1 Silat Tanding Putra — Nasional', issuer: 'Bela Negara', rank: 'Juara 1', level: 'nasional', awarded_year: null, description: 'Juara pertama silat tanding putra tingkat nasional (tingkat SD).' },
  { id: 'a3', title: 'Juara 1 Silat Tanding Putra — Nasional', issuer: 'Pakubumi Open', rank: 'Juara 1', level: 'nasional', awarded_year: null, description: 'Juara pertama silat tanding putra tingkat nasional (tingkat SD).' },
  { id: 'a4', title: 'Juara 1 Silat Tanding Putra — Provinsi', issuer: 'Dandrem', rank: 'Juara 1', level: 'provinsi', awarded_year: null, description: 'Juara pertama silat tanding putra tingkat provinsi (tingkat SD).' },
  { id: 'a5', title: 'Juara 1 Silat Tanding Putra — Kabupaten', issuer: 'Pesona Garut', rank: 'Juara 1', level: 'kabupaten', awarded_year: null, description: 'Juara pertama silat tanding putra tingkat kabupaten (tingkat SMP).', featured: true },
  { id: 'a6', title: 'Finalis 50 Besar Google Jagoan Coding', issuer: 'Google Jagoan Coding', rank: 'Finalis', level: '', awarded_year: null, description: 'Masuk 50 besar program coding Google Jagoan Coding.', featured: true },
  { id: 'a7', title: 'Finalis Siswa Teraktif Sekolah', issuer: 'SMP Negeri 1 Leuwigoong', rank: 'Finalis', level: 'sekolah', awarded_year: null, description: 'Masuk finalis siswa teraktif di sekolah.' },
  { id: 'a8', title: 'Siswa Teraktif saat MPLS', issuer: 'SMA Negeri 10 Garut', rank: 'Teraktif', level: 'sekolah', awarded_year: 2026, description: 'Dinilai paling aktif selama Masa Pengenalan Lingkungan Sekolah.' },
  { id: 'a9', title: 'Peserta Teraktif Perkemahan Masa Tamu', issuer: 'Pramuka · SMA Negeri 10 Garut', rank: 'Teraktif', level: 'sekolah', awarded_year: 2026, description: 'Terpilih sebagai peserta teraktif dalam perkemahan Masa Tamu.', featured: true },
];
