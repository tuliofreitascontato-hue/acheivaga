import { ReactNode, useState } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

// Bottom sheet simples com dois estados (recolhido/expandido) via toque no
// "puxador" — evita a complexidade de arrastar com o dedo para o MVP, sem
// perder a sensação nativa de app mobile.
export function BottomSheet({ title, children }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000, // acima das panes internas do Leaflet (vão até 700)
        background: 'var(--surface)',
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
        maxHeight: expanded ? '65vh' : '30vh',
        transition: 'max-height 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Recolher lista de vagas' : 'Expandir lista de vagas'}
        style={{ background: 'transparent', padding: '10px 0 4px', width: '100%' }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '0 auto',
          }}
        />
      </button>
      <div style={{ padding: '4px 16px 8px', fontWeight: 600, fontSize: 14, color: 'var(--text-muted)' }}>
        {title}
      </div>
      <div style={{ overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}
