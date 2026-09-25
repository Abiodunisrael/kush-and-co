/**
 * KUSH & CO — partial loader
 * Fetches elements with [data-include] and injects their HTML.
 * (WhatsApp float injection removed.)
 */
document.addEventListener('DOMContentLoaded', async () => {
  const targets = document.querySelectorAll('[data-include]');

  await Promise.all([...targets].map(async (el) => {
    const file = el.getAttribute('data-include');
    try {
      const res = await fetch(file, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load ${file}`);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error(err);
      el.innerHTML = `<!-- Could not load ${file} -->`;
    }
  }));

  document.dispatchEvent(new Event('partials:loaded'));
});