import { google } from 'googleapis';

const FOLDER_ID = '1RS7TL2FwjfoSImy0Hg9gQnZH0xnA5wJQ';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { base64, nombre } = req.body;
    if (!base64 || !nombre) return res.status(400).json({ error: 'Faltan datos' });

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const buffer = Buffer.from(base64, 'base64');
    const { Readable } = await import('stream');
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: nombre,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType: 'application/pdf',
        body: stream,
      },
      fields: 'id, webViewLink',
    });

    return res.status(200).json({ ok: true, id: response.data.id, url: response.data.webViewLink });
  } catch (e) {
    console.error('Drive error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
