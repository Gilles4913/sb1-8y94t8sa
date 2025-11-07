export default async function handler(req, res) {
  const hasResend = !!process.env.RESEND_API_KEY;
  const baseUrl = process.env.PUBLIC_BASE_URL || process.env.VITE_PUBLIC_BASE_URL || '(unset)';
  res.status(200).json({ resend_api_key_present: hasResend, vite_public_base_url: baseUrl });
}
