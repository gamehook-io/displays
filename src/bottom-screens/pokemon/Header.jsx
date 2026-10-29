// Title bar for every screen below Home, with a Back button.
export default function Header(props) {
  return <header class="bs-header">
    <button type="button" class="back" onClick={() => props.nav.back()} aria-label="Back">
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
    </button>
    <h1>{props.title}</h1>
    <div class="header-extra">{props.children}</div>
  </header>;
}
