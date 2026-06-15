import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const data = await request.json();

    const filePath = path.join(process.cwd(), 'app', 'api', 'rsvp', 'presencas.json');

    let presencas = [];

    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      try {
        presencas = JSON.parse(fileData || '[]');
        if (!Array.isArray(presencas)) {
          presencas = [];
        }
      } catch (parseError) {
        presencas = [];
      }
    }

    const novaConfirmacao = {
      id: Date.now().toString(),
      dataEnvio: new Date().toISOString(),
      ...data
    };

    presencas.push(novaConfirmacao);

    fs.writeFileSync(filePath, JSON.stringify(presencas, null, 2), 'utf8');

    return NextResponse.json({ success: true, message: 'Presença confirmada com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar os dados:', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao salvar os dados.' }, { status: 500 });
  }
}