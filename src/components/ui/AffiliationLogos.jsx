import { useState } from 'react';
import { AFFILIATIONS } from '../../data/journey';

function Logo({ item }) {
  const [failed, setFailed] = useState(false);
  return (
    <li className="affiliation" title={item.name}>
      {failed ? (
        <span className="affiliation-fallback" aria-hidden="true">{item.label}</span>
      ) : (
        <img src={item.src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      )}
      <span className="affiliation-name">{item.name}</span>
    </li>
  );
}

/** Deretan logo afiliasi; kembali ke label teks bila berkas SVG belum ditaruh di /public/logos. */
export function AffiliationLogos({ items = AFFILIATIONS }) {
  return <ul className="affiliations" aria-label="Organisasi dan gerakan yang saya ikuti">{items.map((item) => <Logo key={item.id} item={item} />)}</ul>;
}
