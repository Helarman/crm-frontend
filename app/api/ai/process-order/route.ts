import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, products, config, language } = await request.json()

    const systemPrompt = language === 'ru' 
      ? `Ты - помощник официанта в ресторане. Проанализируй запрос клиента и создай структурированный заказ.

Доступные продукты:
${products.map((p: any) => `- ${p.title} (${p.price} ₽)`).join('\n')}

Верни ответ в формате JSON:
{
  "items": [
    {
      "productId": "string (ID продукта)",
      "quantity": number,
      "comment": "string (опционально)"
    }
  ],
  "numberOfPeople": number (опционально),
  "tableNumber": "string (опционально)",
  "comment": "string (общий комментарий к заказу, опционально)",
  "confidence": number (0-1, уверенность в разборе заказа)
}

Правила:
1. Сопоставляй продукты по точному или похожему названию
2. Если продукт не найден, не включай его в заказ
3. Определи количество из контекста
4. Извлеки дополнительную информацию (стол, персоны, комментарии)
5. Оцени уверенность от 0 до 1`
      : `შენ ხარ მიმტანის თანაშემწე რესტორნში. გაანალიზე კლიენტის მოთხოვნა და შექმენი სტრუქტურირებული შეკვეთა.

ხელმისაწვდომი პროდუქტები:
${products.map((p: any) => `- ${p.title} (${p.price} ₾)`).join('\n')}

დააბრუნე პასუხი JSON ფორმატში:
{
  "items": [
    {
      "productId": "string (პროდუქტის ID)",
      "quantity": number,
      "comment": "string (არასავალდებულო)"
    }
  ],
  "numberOfPeople": number (არასავალდებულო),
  "tableNumber": "string (არასავალდებულო)",
  "comment": "string (შეკვეთის ზოგადი კომენტარი, არასავალდებულო)",
  "confidence": number (0-1, შეკვეთის ანალიზის ნდობა)
}

წესები:
1. დაამთხვიე პროდუქტები ზუსტი ან მსგავსი სახელით
2. თუ პროდუქტი არ მოიძებნა, ნუ ჩაირთვება შეკვეთაში
3. რაოდენობა განსაზღვრე კონტექსტიდან
4. ამოიღე დამატებითი ინფორმაცია (სტოლი, პირები, კომენტარები)
5. შეაფასე ნდობა 0-დან 1-მდე`

    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      response_format: { type: "json_object" }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    return NextResponse.json({ 
      content: response,
      usage: completion.usage
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to process order with AI' },
      { status: 500 }
    )
  }
}