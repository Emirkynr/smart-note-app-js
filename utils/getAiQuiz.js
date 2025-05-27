import { OPENAI_API_KEY } from "@env";

export default async function getAiQuiz(text) {
  const prompt = `
Aşağıdaki notun içeriğine göre, sadece bu nottaki bilgilerden yararlanarak 3 adet çoktan seçmeli (4 şıklı) bilgi yarışması (quiz) sorusu üret. 
Her soru, notun bilgisini gerçekten ölçen, kavramsal ve sınayıcı bir soru olsun. 
Her şık başında "A)", "B)", "C)", "D)" harfleriyle gösterilsin. 
Her sorunun doğru cevabını ve 3 yanlış cevabını belirt. Sonucu aşağıdaki JSON formatında ver:

[
  {
    "question": "Soru metni",
    "choices": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": "A) ..."
  },
  ...
]

Not: Sadece JSON döndür.
${text}
  `;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  try {
    const quizArr = JSON.parse(data.choices?.[0]?.message?.content);
    return quizArr;
  } catch {
    return [];
  }
}