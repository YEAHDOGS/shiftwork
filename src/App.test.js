import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import { waitFor } from '@testing-library/dom';
import './lib/i18n.js';
import App from './App.svelte';

// Shiftwork smoke test: the app shell must boot and show the dashboard.
describe('shiftwork smoke', () => {
  it('renders the dashboard shell', async () => {
    render(App);
    await waitFor(() => {
      expect(document.body.textContent).toContain('Shiftwork');
    });
    expect(document.body.textContent).toContain('Dashboard');
  });

  it('renders the bottom nav with all admin views', async () => {
    const { container } = render(App);
    await waitFor(() => {
      expect(document.body.textContent).toContain('Shiftwork');
    });
    const nav = container.querySelector('nav[aria-label="Primary"]');
    expect(nav?.textContent).toContain('Schedule');
    expect(nav?.textContent).toContain('Officers');
    expect(nav?.textContent).toContain('Billing');
    expect(nav?.textContent).toContain('Payouts');
    expect(nav?.textContent).toContain('Audit');
  });
});
