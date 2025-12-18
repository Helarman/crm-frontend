import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Language } from '@/lib/stores/language-store';

interface ProductPreviewCardProps {
  product: any;
  language: string;
}

const translations = {
  description: {
    ru: 'Описание',
    ka: 'აღწერა',
  },
  ingredients: {
    ru: 'Состав',
    ka: 'შემადგენლობა',
  },
  price: {
    ru: 'Цена',
    ka: 'ფასი',
  },
  additives: {
    ru: 'Модификаторы',
    ka: 'მოდიფიკატორები',
  },
};

export const ProductPreviewCard = ({ product, language }: ProductPreviewCardProps) => {
  return (
    <Card className="fixed right-4 top-20 w-80 z-50">
      <CardHeader>
        <h3 className="text-lg font-semibold">{product.title}</h3>
      </CardHeader>
      <CardContent>
        {product.images?.[0] && (
          <div className="mb-4">
            <img
              src={product.images[0]}
              alt={product.title}
              width={300}
              height={200}
              className="rounded-md object-cover h-40 w-full"
            />
          </div>
        )}
        <p className="mb-2"><strong>{translations.description[language as Language]}:</strong> {product.description}</p>
        <p className="mb-2"><strong>{translations.ingredients[language as Language]}:</strong> {product.ingredients}</p>
        <p className="mb-2"><strong>{translations.price[language as Language]}:</strong> {product.price} ₽</p>
        
        {product.additives?.length > 0 && (
          <div>
            <strong>{translations.additives[language as Language]}:</strong>
            <ul className="list-disc pl-5">
              {product.additives.map((additive: any) => (
                <li key={additive.id}>{additive.title} (+{additive.price}₽)</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};