/**
 * Riwayat perjalanan Ripki Dwi Putra (sumber: CV).
 * `level` mengelompokkan item, `category` dipakai filter, `champion` dihitung sebagai "Juara 1",
 * `featured` tampil di ringkasan Home. Tahun hanya diisi bila memang diketahui.
 */
export const JOURNEY_LEVELS = [
  { id: 'sma', title: 'SMA', place: 'SMA Negeri 10 Garut', period: '2026 — sekarang', now: true },
  { id: 'smp', title: 'SMP', place: 'SMP Negeri 1 Leuwigoong', period: 'Sekolah menengah pertama' },
  { id: 'sd', title: 'SD', place: 'Sekolah dasar', period: 'Sekolah dasar' },
];

export const JOURNEY_FILTERS = ['Semua', 'Organisasi', 'Prestasi', 'Kegiatan'];

export const JOURNEY = [
  { id: 'sma-mpls', level: 'sma', category: 'Prestasi', title: 'Siswa Teraktif saat MPLS', place: 'SMA Negeri 10 Garut', copy: 'Dinilai paling aktif selama Masa Pengenalan Lingkungan Sekolah, langkah pertama di sekolah yang baru.' },
  { id: 'sma-masa-tamu', level: 'sma', category: 'Prestasi', title: 'Peserta Teraktif Perkemahan Masa Tamu', place: 'Pramuka · SMA Negeri 10 Garut', copy: 'Terpilih sebagai peserta teraktif dalam kegiatan perkemahan Masa Tamu.', featured: true },

  { id: 'smp-garuda', level: 'smp', category: 'Organisasi', title: 'Pramuka Garuda', place: 'Pramuka · SMP Negeri 1 Leuwigoong', copy: 'Mencapai tingkatan tertinggi dalam kepramukaan.', featured: true },
  { id: 'smp-pratama', level: 'smp', category: 'Organisasi', title: 'Pratama Putra', place: 'Pramuka · SMP Negeri 1 Leuwigoong', copy: 'Dipercaya mengemban amanah sebagai Pratama Putra di lingkungan sekolah.' },
  { id: 'smp-paskibra', level: 'smp', category: 'Organisasi', title: 'Palurah Angkatan', place: 'Forum Paskibra Kecamatan Leuwigoong', copy: 'Aktif di organisasi eksternal Forum Paskibra Kecamatan dan menjabat sebagai Palurah Angkatan.' },
  { id: 'smp-webinar', level: 'smp', category: 'Kegiatan', title: 'Pemateri Webinar Kepemimpinan', place: 'SMP Negeri 1 Leuwigoong', copy: 'Berbagi pengalaman kepemimpinan sebagai pemateri webinar.' },
  { id: 'smp-coding', level: 'smp', category: 'Prestasi', title: 'Finalis 50 Besar Google Jagoan Coding', place: 'Google Jagoan Coding', copy: 'Masuk 50 besar program coding tingkat nasional.', featured: true },
  { id: 'smp-teraktif', level: 'smp', category: 'Prestasi', title: 'Finalis Siswa Teraktif Sekolah', place: 'SMP Negeri 1 Leuwigoong', copy: 'Masuk finalis siswa teraktif di sekolah.' },
  { id: 'smp-silat', level: 'smp', category: 'Prestasi', champion: true, title: 'Juara 1 Silat Tanding Putra — Kabupaten', place: 'Pesona Garut', copy: 'Juara pertama silat tanding putra tingkat kabupaten.' },

  { id: 'sd-intl', level: 'sd', category: 'Prestasi', champion: true, title: 'Juara 1 Silat Tanding Putra — Internasional', place: 'Pakubumi Open', copy: 'Juara pertama silat tanding putra tingkat internasional.', featured: true },
  { id: 'sd-nas-bela', level: 'sd', category: 'Prestasi', champion: true, title: 'Juara 1 Silat Tanding Putra — Nasional', place: 'Bela Negara', copy: 'Juara pertama silat tanding putra tingkat nasional.' },
  { id: 'sd-nas-paku', level: 'sd', category: 'Prestasi', champion: true, title: 'Juara 1 Silat Tanding Putra — Nasional', place: 'Pakubumi Open', copy: 'Juara pertama silat tanding putra tingkat nasional.' },
  { id: 'sd-prov', level: 'sd', category: 'Prestasi', champion: true, title: 'Juara 1 Silat Tanding Putra — Provinsi', place: 'Dandrem', copy: 'Juara pertama silat tanding putra tingkat provinsi.' },
];

export const journeyStats = () => [
  { label: 'Juara 1', value: JOURNEY.filter((i) => i.champion).length },
  { label: 'Prestasi', value: JOURNEY.filter((i) => i.category === 'Prestasi').length },
  { label: 'Organisasi', value: JOURNEY.filter((i) => i.category === 'Organisasi').length },
  { label: 'Jenjang sekolah', value: JOURNEY_LEVELS.length },
];

/** Logo afiliasi. Taruh berkas SVG di public/logos/ dengan nama di bawah (lihat public/logos/README.md). */
export const AFFILIATIONS = [
  { id: 'osis', label: 'OSIS', name: 'Organisasi Siswa Intra Sekolah', src: '/logos/osis.svg' },
  { id: 'wosm', label: 'WOSM', name: 'World Organization of the Scout Movement', src: '/logos/wosm.svg' },
  { id: 'sdgs', label: 'SDGs', name: 'Sustainable Development Goals', src: '/logos/sdgs.svg' },
];
