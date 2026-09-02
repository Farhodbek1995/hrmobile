# HR Attendance Tizimi - Mobil Ilova (APK) Uchun Reja va API Arxitekturasi

Ushbu hujjat mavjud veb-tizim (HR Attendance) bazasida mobil ilova (Android/iOS) ishlab chiqish uchun zarur bo'lgan reja, texnologiyalar steki va API ma'lumotlarini o'z ichiga oladi.

## 1. Umumiy Konsepsiya
Mobil ilova asosan ikki xil foydalanuvchi roli uchun mo'ljallangan bo'lishi mumkin:
1. **HR / Rahbar (Admin):** Veb-versiyadagi kabi Dashboard, xodimlar ro'yxati, davomat hisobotlari va qurilmalar holatini kuzatib borish.
2. **Brigadir (Foreman / Shift Manager):** Ishlab chiqarish maydonida yuradigan, kompyuterga doim ham kira olmaydigan mas'ul xodimlar. Ularning asosiy maqsadi o'z brigadasidagi xodimlarni smenalarga tez va qulay biriktirish.
3. **Xodim (Employee):** O'zining ish grafigi, oylik davomat tarixi, kechikishlari va shaxsiy ma'lumotlarini ko'rish imkoniyati.

**Texnologiyalar steki tavsiyasi:**
- **Kross-platforma framework:** Flutter yoki React Native.
- **Holatni boshqarish (State Management):** Flutter uchun `Provider` yoki `Bloc`; React Native uchun `Redux Toolkit` yoki `Zustand`.
- **Tarmoq (Network):** `Dio` (Flutter) yoki `Axios` (React Native).
- **Autentifikatsiya:** JWT Token.

## 2. Dizayn va UI/UX Talablari (Modern Design)
Mobil ilova dizayni faqat funksional bo'lib qolmay, balki estetik jihatdan juda jozibali bo'lishi talab etiladi:
- **Zamonaviylik:** Veb-versiyadagi kabi (Glassmorphism, ochiq va yorqin ranglar, tushunarli shriftlar - Mac/iOS uslubida) dizayn standartlariga amal qilinishi kerak.
- **Qulaylik (User-Friendly):** Ekranda ortiqcha ma'lumotlar bo'lmasligi, barcha muhim amallar tezkor amalga oshirilishi kerak. 
- **Dark/Light Mode:** Ilova tizim sozlamalariga mos ravishda qora va oq mavzularni qo'llab-quvvatlashi kerak.

## 3. Dinamik API URL Sozlamalari
- **Sozlamalar Belgisi (Settings Icon):** Ilovaning birinchi kirish (Login) sahifasida yoki Asosiy sahifada tishli g'ildirak (Settings) belgisi bo'lishi kerak.
- **Server manzilini kiritish:** Ushbu belgi bosilganda maxsus oyna ochilib, foydalanuvchi backend serverining IP manzili va portini yozib saqlashi mumkin.
- **Xotirada saqlash:** Kiritilgan manzil telefonning mahalliy xotirasida (Shared Preferences) saqlanib qolishi va barcha API so'rovlar avtomatik ravishda shu manzilga yo'naltirilishi kerak.

## 4. Huquqlar va Ruxsatlar tizimi (Permissions / RBAC)
Mobil ilova to'liq backend tizimining "Rollar va Huquqlar" (RBAC) qoidalariga bo'ysunadi.
- Ilova `GET /api/auth/me` orqali kiritilgan foydalanuvchining qaysi sahifalar va amallarga ruxsati borligini o'qib oladi.

## 5. Brigadirlar Uchun Maxsus Funksiya: Smena va Grafiklarga Biriktirish (CRITICAL)
Ishlab chiqarish jarayonida eng muhim narsa - smenalarni to'g'ri taqsimlash. Brigadirlar ko'p hollarda ishchi maydonda bo'lishini inobatga olib, xodimlarni grafikka biriktirish jarayoni **maksimal darajada osonlashtirilgan (User-Friendly)** va ilg'or UI/UX dizaynida bo'lishi shart:

1. **Vizual Kalendar (Smart Calendar View):** 
   - Ekranda odatiy zerikarli ro'yxatlar o'rniga, ixcham va interaktiv kalendar (taqvim) ko'rinishi ochiladi.
   - Brigadir kalendardan kerakli kun yoki haftani tanlaydi. O'sha kun uchun mavjud smenalar (Masalan: Ertalabki smena 08:00-17:00, Tungi smena) chiroyli kartochka ko'rinishida chiqib turadi.
2. **"Swipe" (Surish) va Tezkor Amallar:**
   - Smena oynasiga kirganda brigadir oldida xodimlar rasmi va ismi bilan chiqadi.
   - **O'ta oson mantiq:** Xodimni shu smenaga biriktirish uchun uning rasmini shunchaki **o'ngga surish (Swipe Right)** va jadvaldan olib tashlash uchun **chapga surish (Swipe Left)** kifoya. Bu harakat barmoq ostida juda silliq sezilishi kerak.
3. **Ommaviy Belgilash (Bulk Select):** 
   - Agar brigadir butun bir guruhni (10-15 kishini) biriktirmoqchi bo'lsa, xodimlar ustiga bir marta bosadi (yashil ✅ galochka yonadi) va ekranning eng pastidagi katta "15 ta xodimni saqlash" tugmasini bir marta bosadi.
4. **Aqlli Qidiruv va Filtrlar:**
   - Brigada xodimlari orasidan kimnidir tez topish kerak bo'lsa, mikrofon orqali ovozli qidirish yoki ismini yozish orqali tezkor filtrlash imkoni bo'lishi kerak.
5. **Qo'llaniladigan API:**
   - **GET** `/api/schedules` — Jadval va smenalar ro'yxatini olish.
   - **GET** `/api/employees` — Barcha xodimlarni yoki faqat shu brigadaga tegishlilarini tortib kelish.
   - **POST** `/api/schedules/{id}/assign` — Ommaviy yoki yakka tartibda xodimlarni smenaga qo'shish.
   - **DELETE** `/api/schedules/assignments/{assignment_id}` — Chapga surib o'chirilgan xodimni bazadan o'chirish.
   *(Mobil ilova barcha amallarni ekranda ko'rsatgach, saqlash jarayonini orqa fonda juda tez amalga oshiradi).*

## 6. Mavjud API va Mobil Ilova Uchun Integratsiya
Mobil ilova orqa fonda aynan joriy **FastAPI** serveridan foydalanadi:

### A. Autentifikatsiya (Auth)
- **POST** `/api/auth/login`
- **GET** `/api/auth/me`

### B. Dashboard (Asosiy oyna)
- **GET** `/api/attendance/stats/today`

### C. Xodimlar (Employees)
- **GET** `/api/employees`
- **GET** `/api/employees/{id}`

### D. Davomat va Grafiklar
- **GET** `/api/attendance/records`
- **GET** `/api/attendance/events`

## 7. Qo'shimcha API Ehtiyojlari
1. **Push Xabarnomalar (FCM - Firebase Cloud Messaging)**
2. **Mobil Ilova Uchun Maxsus "Yengil" Endpointlar**
3. **App Versiyasini Tekshirish**

## 8. Rivojlantirish Bosqichlari (Roadmap)
- **I Bosqich: Dizayn (1-2 hafta)** - Brigadir uchun qulay UI chizish.
- **II Bosqich: API Moslashtirish (1 hafta)**
- **III Bosqich: Dasturlash (3-4 hafta)** - "Ommaviy biriktirish" modulini mobil barmoq harakatlariga moslab yozish.
- **IV Bosqich: Sinov (1 hafta)**
