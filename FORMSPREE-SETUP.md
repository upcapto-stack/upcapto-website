# Wiring the "Book a demo" form to your inbox (Formspree)

The demo form is already built. To receive real submissions by email, connect it
to **Formspree** (free tier: 50 submissions/month, no backend needed). Takes ~3 minutes.

## Steps

1. **Create an account** at https://formspree.io (sign up with the email where you
   want demo requests to land, e.g. `hello@upcapto.com`).

2. **Create a new form**
   - Click **+ New form**.
   - Name it (e.g. "Upcapto demo requests").
   - Set the **send-to email** to where you want the requests.
   - Save. Formspree gives you an **endpoint URL** like:
     ```
     https://formspree.io/f/abcdwxyz
     ```

3. **Paste the endpoint into the site.** Open `index.html`, find the demo form
   (search for `id="demoForm"`), and replace the placeholder:
   ```html
   <form id="demoForm" data-endpoint="https://formspree.io/f/your-form-id" novalidate>
   ```
   with your real endpoint:
   ```html
   <form id="demoForm" data-endpoint="https://formspree.io/f/abcdwxyz" novalidate>
   ```

4. **Deploy** the site (or reload it locally), submit the form once with your own
   details. Formspree emails you a **one-time confirmation link** on the first
   submission from a new domain. Click it to activate the form. After that, every
   submission arrives in your inbox.

## What is already handled for you

- **AJAX submit** with validation (name, email, business required) and inline errors.
- **Success state** shown in the modal after sending.
- **Email subject** is set automatically to `Demo request from {business} ({product})`.
- **Spam protection** via a hidden `_gotcha` honeypot field (Formspree drops bot fills).
- **Fallback:** until you add an endpoint, submitting opens a prefilled email to
  `hello@upcapto.com` so the button is never a dead end.

## Fields sent to you

name, email, business, phone, product, message.

## Notes

- The free tier caps monthly submissions; upgrade in Formspree if you need more.
- To change the destination email later, edit it in the Formspree dashboard, not the code.
- Any form backend that accepts a `POST` of form fields works here (Basin, Getform,
  Web3Forms, etc.) — just paste its endpoint into `data-endpoint`. For a non-JSON
  service, keep it simple and test one submission.
- The published Claude **artifact** preview can't call external endpoints (sandboxed),
  so test the live Formspree flow on the deployed site, not inside the artifact.
