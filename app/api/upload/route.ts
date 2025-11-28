import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Конфигурация S3 клиента для Beget
const s3Client = new S3Client({
  endpoint: process.env.BEGET_S3_ENDPOINT!,
  region: process.env.BEGET_S3_REGION || 'ru-1',
  credentials: {
    accessKeyId: process.env.BEGET_S3_ACCESS_KEY!,
    secretAccessKey: process.env.BEGET_S3_SECRET_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = request.headers.get('X-File-Name') || `image_${Date.now()}.jpg`;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Параметры для загрузки в S3
    const uploadParams = {
      Bucket: process.env.BEGET_S3_BUCKET!,
      Key: `products/${fileName}`,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read' as const,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const fileUrl = `https://${process.env.BEGET_S3_BUCKET}.${process.env.BEGET_S3_ENDPOINT?.replace('https://', '')}/products/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}