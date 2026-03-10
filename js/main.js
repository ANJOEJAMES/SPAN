/**
 * js/main.js — SPAN Website Shared Logic
 *
 * Handles functionality that is shared across all pages:
 *  - Newsletter subscription form (footer)
 *  - Smooth scroll-to-top button
 *
 * Page-specific logic (blog listing, blog single post, gallery) lives
 * in inline <script> blocks inside each HTML file.
 *
 * Requires: js/config.js (sets window.SPAN_API_URL)
 */

(function () {
    'use strict';

    const API = window.SPAN_API_URL || '/api';

    // ── Newsletter subscription ───────────────────────────────────────────────
    // Handles any <form id="newsletterForm"> on the page.
    // The button text reverts to "Subscribe" after 3 s whether success or fail.

    function initNewsletter() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const input = document.getElementById('newsletterEmail');
            const btn = form.querySelector('button[type="submit"]');
            const email = input ? input.value.trim() : '';

            if (!email) return;
            if (btn) { btn.disabled = true; btn.textContent = 'Subscribing…'; }

            try {
                const res = await fetch(`${API}/newsletter/subscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();

                if (res.ok) {
                    if (btn) btn.textContent = '✓ Subscribed!';
                    if (input) input.value = '';
                } else {
                    if (btn) btn.textContent = data.error || 'Already subscribed';
                }
            } catch (_) {
                if (btn) btn.textContent = 'Server offline';
            }

            // Reset button label after 3 s
            setTimeout(() => {
                if (btn) { btn.textContent = 'Subscribe'; btn.disabled = false; }
            }, 3000);
        });
    }

    // ── Run on DOM ready ─────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNewsletter);
    } else {
        initNewsletter();
    }

})();
