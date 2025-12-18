import { useState, useRef, ChangeEvent } from 'react';
import { Loader2, X, UploadCloud } from 'lucide-react';
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

  // Функция для загрузки файла в Beget S3
  const uploadToBegetS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // Генерируем уникальное имя файла
    const fileExtension = file.name.split('.').pop();
    const fileName = `image_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'X-File-Name': fileName, // Передаем имя файла в заголовке
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return data.url; // URL загруженного изображения
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(language === 'ru' 
        ? 'Ошибка загрузки изображения' 
        : 'სურათის ატვირთვის შეცდომა');
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(language === 'ru' 
        ? 'Размер файла не должен превышать 5MB' 
        : 'ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს');
      return;
    }

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError(language === 'ru' 
        ? 'Допустимые форматы: JPEG, PNG, WebP, GIF' 
        : 'დაშვებული ფორმატები: JPEG, PNG, WebP, GIF');
      return;
    }

    if (value.length >= maxFiles) {
      setError(language === 'ru' 
        ? `Максимум ${maxFiles} изображений` 
        : `მაქსიმუმ ${maxFiles} სურათი`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const imageUrl = await uploadToBegetS3(file);
      onChange([...value, imageUrl]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 
        language === 'ru' 
          ? 'Ошибка загрузки изображения' 
          : 'სურათის ატვირთვის შეცდომა');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleUpload(imageFile);
    }
  };

  return (
    <div className="space-y-4">
      {/* Скрытый input для выбора файла */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp, image/gif"
        className="hidden"
        disabled={disabled || value.length >= maxFiles || isUploading}
      />

      {/* Область для drag & drop */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${disabled || value.length >= maxFiles || isUploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 bg-white hover:border-gray-400 cursor-pointer'
          }
        `}
        onClick={() => !disabled && value.length < maxFiles && !isUploading && fileInputRef.current?.click()}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          {language === 'ru' ? 'Перетащите изображение или' : 'გადაათრიეთ სურათი ან'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.length >= maxFiles || isUploading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {language === 'ru' ? 'Выберите файл' : 'აირჩიეთ ფაილი'}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          {language === 'ru' 
            ? `JPEG, PNG, WebP, GIF до 5MB. Максимум ${maxFiles} файлов.`
            : `JPEG, PNG, WebP, GIF 5MB-მდე. მაქსიმუმ ${maxFiles} ფაილი.`}
        </p>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Индикатор загрузки */}
      {isUploading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
          <span className="text-sm text-gray-600">
            {language === 'ru' ? 'Загрузка...' : 'იტვირთება...'}
          </span>
        </div>
      )}

      {/* Превью загруженных изображений */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            {language === 'ru' ? 'Загруженные изображения:' : 'ატვირთული სურათები:'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((image, index) => (
              <div 
                key={index} 
                className="relative group rounded-lg overflow-hidden border aspect-square bg-gray-100"
              >
                <Image
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="object-cover w-full h-full"
                  width={200}
                  height={200}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1 h-6 w-6 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                    {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Счетчик загруженных файлов */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              {language === 'ru' 
                ? `Загружено ${value.length} из ${maxFiles} изображений`
                : `${value.length} / ${maxFiles} სურათები ატვირთულია`}
            </span>
            {value.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([])}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                {language === 'ru' ? 'Удалить все' : 'ყველას წაშლა'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};