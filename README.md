# SmartNoteApp

SmartNoteApp, modern ve akıllı bir not alma uygulamasıdır. Kullanıcılar notlarını kolayca oluşturabilir, düzenleyebilir ve yapay zeka destekli özet/quiz gibi gelişmiş özelliklerden faydalanabilir. Uygulama mobil platformda çalışacak şekilde tasarlanmıştır..

## Özellikler

- **Not Oluşturma ve Düzenleme:** Hızlı ve sezgisel arayüz ile not ekleyin, başlık ve içeriklerini kolayca güncelleyin.
- **Kategorilere Ayırma:** Notlarınızı kategorilere göre organize edin.
- **Arama:** Notlar arasında başlık veya içerik ile hızlı arama yapın.
- **Yapay Zeka Özellikleri:**
  - **AI Özet:** Notunuzun içeriğinden otomatik özet oluşturun.
  - **AI Quiz:** Notunuzu anlamanızı test eden, not içeriğine özel çoktan seçmeli sınayıcı sorular üretin.
- **Tema Desteği:** Açık, koyu ve amoled siyah tema seçenekleri ile göz dostu kullanım.
- **Son Notlarım:** Ana ekranda en son düzenlenen notlarınıza hızlı erişim.
- **Çapraz Platform:** Android/iOS desteği.
- **Klavye ve Dokunmatik Uyumluluğu:** Mobil cihazlarda rahat kullanım.

## Kurulum ve Çalıştırma

1. **Projeyi klonlayın:**
    ```bash
    git clone https://github.com/Emirkynr/smart-note-app-js.git
    ```
2. **Proje dizinine girin:**
    ```bash
    cd smart-note-app-js
    ```
3. **Bağımlılıkları yükleyin:**
    ```bash
    npm install
    ```
4. **OpenAI API anahtarınızı `.env` dosyasına ekleyin:**
    ```
    OPENAI_API_KEY=your_openai_api_key
    ```
5. **Uygulamayı başlatın:**
    ```bash
    npx expo start
    ```
6. **Expo Go moduna geçin:**
    - Terminalde `s` tuşuna basarak "Switch to Expo Go" seçeneğini seçin.
7. **Android emülatörde çalıştırın:**
    - Terminalde `a` tuşuna basarak uygulamayı Android 14 emülatörünüzde başlatın.

> **Not:** Android emülatörünüzün açık olduğundan emin olun. Uygulama, Expo Go ile Android 14 emülatöründe sorunsuz çalışmaktadır.

## Yapay Zeka Özellikleri

- AI özet ve quiz için OpenAI API anahtarınızı `.env` dosyasına eklemeniz gerekmektedir.
- AI özet ve quiz kutuları, notun en sonunda ve temaya uygun şekilde görünür.
- Quiz şıkları ve soruları, notun bilgisini gerçekten ölçen sınayıcı sorulardan oluşur.

## Katkıda Bulunma

Katkı sağlamak için pull request gönderebilir veya issue açabilirsiniz. Her türlü geri bildirim ve katkı memnuniyetle karşılanır!

## Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.