// Run before the first paint, without waiting for the application bundle.
const hasDeepLink = location.hash.length > 1;
let introSeen = hasDeepLink;

try {
  introSeen = introSeen || sessionStorage.getItem('aynko:intro-seen') === '1';
} catch {
  introSeen = hasDeepLink;
}

if (introSeen) {
  document.documentElement.classList.add('intro-seen', 'experience-entered');
}
