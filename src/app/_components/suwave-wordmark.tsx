type SuwaveWordmarkProps = {
  subtitle?: string;
};

/**
 * Wordmark padrao SUWAVE (SU + W em destaque + AVE) com subtitulo opcional.
 * Mesmo componente/visual em app/web, app/logista, app/motorista e app/painel.
 */
export function SuwaveWordmark({ subtitle }: SuwaveWordmarkProps) {
  return (
    <div className="suwaveWordmark" aria-label={subtitle ? `SUWAVE ${subtitle}` : "SUWAVE"}>
      <div className="suwaveLogo" aria-hidden="true">
        <span className="suwaveLogoText">SU</span>
        <span className="suwaveLogoWave">W</span>
        <span className="suwaveLogoText">AVE</span>
      </div>
      {subtitle ? <span className="suwaveLogoSub">{subtitle}</span> : null}
    </div>
  );
}

/**
 * Tela de splash animada (entrada do app) com o mesmo wordmark SUWAVE.
 * O subtitulo muda por app, o efeito (island, reveal, light sweep) e o mesmo.
 */
export function SuwaveSplash({ subtitle }: SuwaveWordmarkProps) {
  return (
    <section className="suwaveSplash" aria-label={`Carregando Suwave${subtitle ? ` ${subtitle}` : ""}`}>
      <div className="suwaveSplashIsland" aria-hidden="true">
        <span />
      </div>
      <div className="suwaveSplashWordmark">
        <div className="suwaveSplashLogo" aria-hidden="true">
          <span className="suwaveSplashLogoText">SU</span>
          <span className="suwaveSplashWave">W</span>
          <span className="suwaveSplashLogoText">AVE</span>
        </div>
        {subtitle ? <strong>{subtitle}</strong> : null}
        <i aria-hidden="true" />
      </div>
    </section>
  );
}
