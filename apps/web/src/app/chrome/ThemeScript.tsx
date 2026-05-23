// Pre-paint script applied as a raw <script> in <head>. Reads localStorage and
// applies `.theme-light` / `.theme-dark` to <html> before React hydrates so
// the manual override wins on first paint without a flash. "system" =
// no class; tokens.css's prefers-color-scheme media query handles it.
//
// Also seeds the mobile-banner-dismissed and install-card-dismissed flags so
// the banner / card don't briefly mount before being hidden on dismissed
// surfaces. The flags are dataset attributes on <html>; CSS uses them.
const SCRIPT = `(function(){
  try {
    var THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    var t = localStorage.getItem('armal-theme');
    if (t === 'light') document.documentElement.classList.add('theme-light');
    else if (t === 'dark') document.documentElement.classList.add('theme-dark');

    var b = Number(localStorage.getItem('armal-mobile-banner-dismissed-at'));
    if (b && Date.now() - b < THIRTY_DAYS) {
      document.documentElement.setAttribute('data-mobile-banner-dismissed', '');
    }
    var i = Number(localStorage.getItem('armal-install-card-dismissed-at'));
    if (i && Date.now() - i < THIRTY_DAYS) {
      document.documentElement.setAttribute('data-install-card-dismissed', '');
    }
  } catch (e) {}
})();`;

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
      // suppressHydrationWarning so React doesn't whine about the inline node
      // diverging between server and client — the script body is constant.
      suppressHydrationWarning
    />
  );
}
