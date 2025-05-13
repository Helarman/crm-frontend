import { useState, useRef, ChangeEvent } from 'react';
import { Loader2, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ImageUploaderProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  language?: 'ru' | 'ka';
}

export const ImageUploader = ({
  value = [],
  onChange,
  maxFiles = 5,
  disabled = false,
  language = 'ru',
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (value.length >= maxFiles) {
      setError(language === 'ru' 
        ? `Максимум ${maxFiles} изображений` 
        : `მაქსიმუმ ${maxFiles} სურათი`);
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      onChange([...value, data.secure_url]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(language === 'ru' 
        ? 'Ошибка загрузки изображения' 
        : 'სურათის ატვირთვის შეცდომა');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Сброс input
  };

  const removeImage = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Скрытый input для выбора файла */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        disabled={disabled || value.length >= maxFiles || isUploading}
      />

      {/* Кнопка для запуска загрузки */}
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || value.length >= maxFiles || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="mr-2 h-4 w-4" />
        )}
        {language === 'ru' ? 'Загрузить изображение' : 'ფოტოს ატვირთვა'}
      </Button>

      {/* Сообщение об ошибке */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Превью загруженных изображений */}
      {value.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {value.map((image, index) => (
              <div key={index} className="relative group rounded-md overflow-hidden border aspect-square">
                <Image
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="object-cover w-full h-full"
                  width={200}
                  height={200}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500 text-white p-1 h-6 w-6 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'ru' 
              ? `Загружено ${value.length} из ${maxFiles} изображений`
              : `${value.length} / ${maxFiles} სურათები ატვირთულია`}
          </p>
        </>
      )}
    </div>
  );
};