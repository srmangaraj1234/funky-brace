// Resend REST API Email dispatch service
// Proxies dispatch calls directly to Resend endpoints.

export async function sendEmail({ to, subject, html }) {
  console.log(`Email service dispatch request: to=${to}, subject=${subject}`);
  
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not defined. Email simulated successfully in sandbox:');
    console.log('----- EMAIL PREVIEW -----');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: ${html}`);
    console.log('-------------------------');
    return { success: true, messageId: 'simulated_resend_email_id' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FixMyCity <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API returned error:', errorText);
      throw new Error(`Resend API error: ${response.statusText} (${errorText})`);
    }

    const data = await response.json();
    console.log('Resend email sent successfully:', data);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error dispatching email through Resend API:', error);
    throw error;
  }
}
