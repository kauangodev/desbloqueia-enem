"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { materials } from "../../lib/config";

export default function PlatformMotionPreview() {
  const featured = materials.slice(0, 6);
  const [active, setActive] = useState(0);
  useEffect(() => { const reduced = window.matchMedia("(prefers-reduced-motion: reduce)"); if (reduced.matches) return; const timer = window.setInterval(() => setActive((value) => (value + 1) % Math.max(featured.length, 1)), 3200); return () => window.clearInterval(timer); }, [featured.length]);
  if (!featured.length) return null;
  return <div className="platform-motion" aria-label="Prévia dos materiais didáticos"><div className="platform-motion-track">{featured.map((material, offset) => { const index = (active + offset) % featured.length; const item = featured[index]; return <figure key={`${item.title}-${index}`} className="platform-motion-card"><Image src={item.cover} alt={`Capa de ${item.title}`} width={260} height={360} sizes="(max-width: 600px) 42vw, 220px" /><figcaption>{item.title}</figcaption></figure>; })}</div><div className="platform-motion-controls"><button type="button" aria-label="Material anterior" onClick={() => setActive((value) => (value - 1 + featured.length) % featured.length)}>←</button><span>{active + 1} / {featured.length}</span><button type="button" aria-label="Próximo material" onClick={() => setActive((value) => (value + 1) % featured.length)}>→</button></div></div>;
}
