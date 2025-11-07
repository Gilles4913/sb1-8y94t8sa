import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    const to = (req.method === 'POST' ? req.body?.to : req.query?.to) || 'test@a2display.fr';
    const from = 'noreply@notifications.a2display.fr'; // domaine Resend vérifié
    const html = `<p>Test depuis ${process.env.PUBLIC_BASE_URL || process.env.VITE_PUBLIC_BASE_URL || 'local'}</p>`;
    const text = 'Test Resend OK';

    const { data, error } = await resend.emails.send({
      from, to, subject: 'Test Resend', html, text, reply_to: 'contact@a2display.fr'
    });
    if (error) return res.status(400).json({ ok:false, error });
    res.status(200).json({ ok:true, data });
  } catch (e:any) {
    res.status(500).json({ ok:false, message: e?.message || String(e) });
  }
}
