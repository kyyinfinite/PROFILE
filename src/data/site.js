import { projects } from './projects';

/** Contact details used by the site's email links. */
export const CONTACT_EMAIL = 'ripkidwiput03@gmail.com';
export const SOCIAL_LINKS = {
  github: 'https://github.com/',
  instagram: 'https://www.instagram.com/',
  linkedin: 'https://www.linkedin.com/',
};

/** Kept for the existing contact-page setup note; false for the configured email. */
export const HAS_PLACEHOLDER_EMAIL = CONTACT_EMAIL.endsWith('@example.com');

/** Single navigation list used by the header menu, footer and 404 page. */
export const NAV_LINKS = [
  { to: '/work', label: 'Projects', count: String(projects.length).padStart(2, '0') },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Focus' },
  { to: '/contact', label: 'Contact', arrow: true },
];

/** Skills and interests described by the owner. */
export const SKILLS = [
  { n: '01', title: 'AI architecture', copy: 'Exploring how intelligent systems can plan, make decisions, and respond to changing situations.', tags: 'AI SYSTEMS · AGENT LOGIC' },
  { n: '02', title: 'Python development', copy: 'Learning by building software, testing ideas, solving problems, and improving the implementation.', tags: 'PYTHON · SOFTWARE DEVELOPMENT' },
  { n: '03', title: 'Problem solving', copy: 'Critical thinking, teamwork, communication, and leadership developed through school and extracurricular activities.', tags: 'CRITICAL THINKING · TEAMWORK · LEADERSHIP' },
];

/** School and extracurricular experience listed in the owner's CV. */
export const EXPERIENCE = [
  { period: 'SMP', role: 'Pratama Putra', place: 'School scouting activities', placeholder: false },
  { period: 'SMP', role: 'Palurah Angkatan', place: 'Forum Paskibra Kecamatan Leuwigoong', placeholder: false },
];
