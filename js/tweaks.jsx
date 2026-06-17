// Панель Tweaks: акцент, зерно, интенсивность движения.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#D6BD92",
  "motion": 1,
  "grain": true,
  "particles": "frost"
}/*EDITMODE-END*/;

const PARTICLE_STYLES = [
  { id: 'frost', label: 'Иней' },
  { id: 'light', label: 'Свет' },
  { id: 'pearl', label: 'Жемчуг' },
  { id: 'graphite', label: 'Графит' }
];

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
    window.STORE.accent = t.accent;
    window.STORE.motion = t.motion;
    window.STORE.grain = t.grain;
    window.STORE.particleStyle = t.particles;
    if (window.SCENE && window.SCENE.setParticleStyle) window.SCENE.setParticleStyle(t.particles);
    const g = document.querySelector('.grain');
    if (g) g.style.opacity = t.grain ? '' : '0';
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Частицы" />
      <TweakSelect label="Стиль пыли" value={t.particles}
        options={PARTICLE_STYLES.map((s) => ({ value: s.id, label: s.label }))}
        onChange={(v) => setTweak('particles', v)} />
      <TweakSection label="Стиль" />
      <TweakColor label="Акцент" value={t.accent}
        options={['#D6BD92', '#C2CDB9', '#BCC8D6', '#D9B6A3']}
        onChange={(v) => setTweak('accent', v)} />
      <TweakToggle label="Плёночное зерно" value={t.grain}
        onChange={(v) => setTweak('grain', v)} />
      <TweakSection label="Движение" />
      <TweakSlider label="Параллакс" value={t.motion} min={0} max={1.5} step={0.1}
        onChange={(v) => setTweak('motion', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<TweaksApp />);
