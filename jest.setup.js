// Polyfill TextEncoder/TextDecoder for supertest under Node 18+
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// --- jsdom polyfills for component/snapshot tests ---
// jsdom omits these browser APIs that MUI and a few components reach for; stub
// them (inert) so component renders don't crash in tests.
if (typeof window !== 'undefined') {
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  // jsdom defines window.scrollTo as a stub that throws "Not implemented", so
  // override it unconditionally with an inert no-op.
  window.scrollTo = () => {};
  if (typeof window.HTMLElement !== 'undefined') {
    window.HTMLElement.prototype.scrollIntoView = () => {};
    // autoFocus toggles MUI focus classes, and jsdom applies it inconsistently
    // across environments (focuses locally but not on CI), which would make
    // focus-sensitive snapshots flaky. Neutralize focus so the rendered markup
    // is the unfocused state everywhere.
    window.HTMLElement.prototype.focus = () => {};
  }
}

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
if (typeof global.ResizeObserver === 'undefined') global.ResizeObserver = MockObserver;
if (typeof global.IntersectionObserver === 'undefined') global.IntersectionObserver = MockObserver;
