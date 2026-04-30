import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) throw new Error("API key eksik");

    const body = await req.json();
    const { type } = body;

    let maxTokens = 400;

    if (type === 'ideas') {
      const { languages, repoNames, likedIdeas } = body;
      const hasData = languages?.length > 0 || repoNames?.length > 0;
      const hasLikes = likedIdeas?.length > 0;

      const userContext = hasData
        ? `Kullanıcının GitHub dilleri: ${(languages || []).join(', ')}. Repo isimleri: ${(repoNames || []).slice(0, 8).join(', ')}.`
        : 'Kullanıcı hakkında henüz veri yok, çeşitli kategorilerden fikirler öner.';

      const likeContext = hasLikes
        ? `Daha önce beğendiği kategoriler: ${[...new Set((likedIdeas || []).map((i: any) => i.category))].join(', ')}. Sevdiği teknolojiler: ${[...new Set((likedIdeas || []).flatMap((i: any) => i.techStack))].slice(0, 6).join(', ')}.`
        : '';

      const randomSeed = Math.floor(Math.random() * 10000);
      maxTokens = 2000;

      const prompt = `Sen deneyimli bir yazılım mentörüsün. Kullanıcıya gerçekten yapılabilir, portfolyosuna değer katacak proje fikirleri üret.

${userContext}
${likeContext}

ALTIN KURALLAR:
- Her fikir biten bir ÜRÜN olmalı: web uygulaması, mobil uygulama, CLI aracı, bot, API, platform
- "X öğren", "X kullan" gibi aktivite fikirleri KESİNLİKLE üretme
- Gerçek bir kullanıcı problemini çözsün
- "todo app", "hava durumu", "hesap makinesi" gibi klişeler YASAK
- Önceki turdan TAMAMEN FARKLI fikirler üret (Seed: ${randomSeed})

KURALLAR:
- Tam olarak 6 proje fikri üret
- Her fikir farklı kategori ve zorlukta olsun
- Türkçe yaz
- Sadece JSON döndür

FORMAT:
[
  {
    "id": "fikir-${randomSeed}-1",
    "title": "Proje Adı",
    "description": "2-3 cümle açıklama.",
    "techStack": ["Tech1", "Tech2", "Tech3"],
    "difficulty": "Başlangıç",
    "why": "Neden sana uygun, tek cümle.",
    "category": "web"
  }
]

difficulty: "Başlangıç", "Orta" veya "İleri"
category: web, mobile, ai, cli, game, api, devtool`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.95, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
      });

      if (!response.ok) throw new Error(`Groq Hatası: ${response.status}`);
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('JSON parse hatası');
      const ideas = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify({ ideas }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

    } else if (type === 'detail') {
      const { idea } = body;
      maxTokens = 1500;

      const prompt = `Sen deneyimli bir yazılım mentörüsün. "${idea.title}" projesini yapacak birine rehberlik ediyorsun.

Proje: ${idea.title}
Açıklama: ${idea.description}
Teknolojiler: ${idea.techStack.join(', ')}
Zorluk: ${idea.difficulty}

## 🎯 Bu Proje Ne İşe Yarar?
## ⚙️ Temel Mantık Nasıl Çalışır?
## 🚀 Adım Adım Nasıl Yapılır? (en az 5 adım)
## ⚠️ Dikkat Edilmesi Gereken Noktalar (en az 3 zorluk)
## 💡 Bir Adım Öteye Taşı (3 ekstra özellik)

Türkçe, samimi, motive edici. Markdown kullanabilirsin.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.7, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
      });

      if (!response.ok) throw new Error(`Groq Hatası: ${response.status}`);
      const data = await response.json();
      const detail = data?.choices?.[0]?.message?.content ?? '';
      return new Response(JSON.stringify({ detail }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
} else if (type === 'custom') {
  const { userPrompt, languages, likedIdeas } = body;
  maxTokens = 2000;

  const langContext = languages?.length > 0
    ? `Kullanıcının bildiği diller: ${languages.join(', ')}.`
    : '';

  const likeContext = likedIdeas?.length > 0
    ? `Daha önce beğendiği kategoriler: ${[...new Set((likedIdeas || []).map((i: any) => i.category))].join(', ')}.`
    : '';

  const randomSeed = Math.floor(Math.random() * 10000);

  const prompt = `Sen deneyimli bir yazılım mentörüsün. Kullanıcı sana şunu söyledi:

"${userPrompt}"

${langContext}
${likeContext}

Bu isteğe uygun, gerçekten yapılabilir proje fikirleri üret.

KURALLAR:
- Kullanıcının isteğini merkeze al ama zenginleştir
- Her fikir somut bir ürün olsun
- Türkçe yaz
- Sadece JSON döndür

FORMAT:
[
  {
    "id": "custom-${randomSeed}-1",
    "title": "Proje Adı",
    "description": "2-3 cümle açıklama.",
    "techStack": ["Tech1", "Tech2"],
    "difficulty": "Başlangıç",
    "why": "Kullanıcının isteğiyle nasıl örtüşüyor.",
    "category": "web"
  }
]

difficulty: "Başlangıç", "Orta" veya "İleri"
category: web, mobile, ai, cli, game, api, devtool`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.9, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });

  if (!response.ok) throw new Error(`Groq Hatası: ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('JSON parse hatası');
  const ideas = JSON.parse(jsonMatch[0]);
  return new Response(JSON.stringify({ ideas }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

} else if (type === 'cv') {
  const { cvText, languages, repoCount, careerGoal } = body;
  maxTokens = 1500;

  const goalLabel: Record<string, string> = {
    staj: 'staj bulmak',
    is: 'iş bulmak',
    freelance: 'freelance çalışmak',
    startup: 'startup kurmak',
    ogrenme: 'yeni teknoloji öğrenmek',
  };

  const prompt = `Sen bir yazılım kariyeri koçusun. Bir geliştiricinin CV'sini analiz et.

CV İçeriği:
${cvText}

Ek Bilgiler:
- GitHub'da kullandığı diller: ${languages?.join(', ') || 'bilinmiyor'}
- GitHub repo sayısı: ${repoCount || 0}
- Kariyer hedefi: ${goalLabel[careerGoal] || 'belirtilmemiş'}

Şunları yaz:

## 💪 Güçlü Yönler
CV'den öne çıkan 3-4 güçlü nokta. Somut ol.

## ⚠️ Eksik veya Geliştirilebilecek Alanlar
3-4 somut eksik. "CV'yi düzenle" değil, "X teknolojisini ekle" gibi spesifik.

## 🎯 Kariyer Hedefine Göre Değerlendirme
${goalLabel[careerGoal] || 'hedef belirsiz'} için bu CV ne kadar hazır? Somut öneri ver.

## 🚀 Hemen Yapılabilecek 3 Şey
Öncelik sırasına göre 3 aksiyon maddesi.

Türkçe yaz. Dürüst ve yapıcı ol, boş övgü yazma. Maksimum 300 kelime.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Groq Hatası: ${response.status}`);
  const data = await response.json();
  const cvAnalysis = data?.choices?.[0]?.message?.content ?? '';
  return new Response(JSON.stringify({ analysis: cvAnalysis }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });

  } else if (type === 'feedback') {
  const { languages, repoCount, savedCount, likedCount, careerGoal, repoNames } = body;
  maxTokens = 800;

  const goalLabel = {
    staj: 'staj bulmak',
    is: 'iş bulmak',
    freelance: 'freelance çalışmak',
    startup: 'startup kurmak',
    ogrenme: 'yeni teknoloji öğrenmek',
  }[careerGoal] ?? 'hedef belirsiz';

  const prompt = `Sen DevMatch platformundaki AI koçsun. Bir geliştiricinin profilini analiz et ve samimi, motive edici geri bildirim ver.

Veriler:
- GitHub dilleri: ${languages?.join(', ') || 'bilinmiyor'}
- Repo sayısı: ${repoCount}
- Kaydedilen proje: ${savedCount}
- Beğenilen fikir: ${likedCount}
- Kariyer hedefi: ${goalLabel}
- Öne çıkan repolar: ${repoNames?.join(', ') || 'bilinmiyor'}

Şunları yaz:
1. Güçlü yönleri (1-2 cümle)
2. Eksik veya geliştirilmesi gereken alanlar (somut, klişesiz)
3. Kariyer hedefine göre bir sonraki adım önerisi
4. Motive edici kapanış

Türkçe yaz. Samimi ve doğrudan ol — "harika iş çıkarmışsın" gibi boş övgüler yazma. Maksimum 200 kelime.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.7, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });

  if (!response.ok) throw new Error(`Groq Hatası: ${response.status}`);
  const data = await response.json();
  const feedback = data?.choices?.[0]?.message?.content ?? '';
  return new Response(JSON.stringify({ feedback }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  
} else if (type === 'build') {
  const { project, messages, mentorLevel } = body;
  maxTokens = 1500;

  const levelInstructions: Record<string, string> = {
    'sifir': `Kullanıcı yazılıma yeni başlıyor. Her şeyi en temel seviyeden anlat:
- Terminal nedir, VSCode nedir bile bilmiyor olabilir
- Her adımı "şimdi şunu yap" formatında ver
- "File > New Folder" gibi tıklama bazlı talimatlar ver
- Teknik terimleri her kullandığında parantez içinde açıkla
- Hata alırsa paniklemesini, normal olduğunu söyle
- Sabırlı, cesaretlendirici bir dil kullan`,

    'baslangic': `Kullanıcı temel programlama biliyor ama bu teknolojiyi hiç kullanmamış:
- Kavramları basit analogilerle açıkla
- Kod yazarken ne yapıldığını satır satır açıkla
- "Neden böyle yapıyoruz?" sorularını önceden yanıtla
- Kısa kod örnekleri ver, karmaşık yapılardan kaçın`,

    'orta': `Kullanıcı bu teknoloji ailesini biliyor, detaylara odaklanmak istiyor:
- Direkt teknik açıklamalar yap
- Best practice'leri ve neden önemli olduklarını anlat
- Alternatif yaklaşımları da göster
- Orta uzunlukta kod örnekleri ver`,

    'ileri': `Kullanıcı deneyimli bir geliştirici, derinlemesine tartışmak istiyor:
- İleri seviye kavramları, pattern'leri, optimizasyonları tartış
- "Neden bu yaklaşım değil de bu?" sorularına detaylı cevap ver
- Performans, güvenlik, ölçeklenebilirlik açısından değerlendir
- Kaynak koduna, dökümantasyona referans ver`,
  };

  const systemPrompt = `Sen DevMatch platformunda "${project.name}" projesi için özel atanmış bir Build Mode AI mentor'sün.

PROJE BİLGİLERİ:
- Proje adı: ${project.name}
- Açıklama: ${project.description || 'Belirtilmemiş'}
- Teknoloji: ${project.language || project.tech_stack?.join(', ') || 'Belirtilmemiş'}
- Zorluk: ${project.difficulty || 'Belirtilmemiş'}
- Kategori: ${project.category || 'Belirtilmemiş'}
- GitHub: ${project.url || 'Belirtilmemiş'}

ANLATIM SEVİYESİ: ${mentorLevel || 'orta'}
${levelInstructions[mentorLevel || 'orta'] || levelInstructions['orta']}

GENEL KURALLAR:
- Türkçe konuş
- Kod verirken mutlaka açıklama ekle
- Adım adım ilerle, kullanıcıyı bunaltma
- Hata mesajı paylaşırsa çözüme odaklan
- Motivasyonu yüksek tut
- Bir adım bitince "Hazır olunca devam edelim" de`;

  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...(messages || []),
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: maxTokens,
      messages: chatMessages,
    }),
  });

  if (!response.ok) throw new Error(`Groq Hatası: ${response.status}`);
  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content ?? '';
  return new Response(JSON.stringify({ reply }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });

    } else if (type === 'mentor') {
      const { project, messages } = body;
      maxTokens = 1000;

      const systemPrompt = `Sen DevMatch uygulamasında "${project.name}" projesine özel atanmış bir AI mentor'sün.

Proje: ${project.name}
Açıklama: ${project.description}
Teknoloji: ${project.language || 'Belirtilmemiş'}
GitHub: ${project.url || 'Belirtilmemiş'}

Görevin: Kullanıcının bu projeye katkı yapmasına yardım et. Teknik sorularını somut kod örnekleriyle yanıtla. Türkçe konuş, samimi ol.`;

      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...(messages || []),
      ];

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.7, max_tokens: maxTokens, messages: chatMessages }),
      });

      if (!response.ok) throw new Error(`Groq Hatası: ${response.status}`);
      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content ?? '';
      return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

    } else {
      throw new Error("Geçersiz type.");
    }

  } catch (error) {
    console.error("Supabase Edge Hatası:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});