// index.js

// 1. GEREKLİ KÜTÜPHANELERİN VE MODÜLLERİN İÇE AKTARILMASI (IMPORT)
const express = require('express'); // Express.js çatısını projeye dahil ediyoruz
const logger = require('./logger'); // Kendi yazdığımız özel logger middleware'ini çağırıyoruz

// 2. EXPRESS UYGULAMASININ VE PORT BİLGİSİNİN TANIMLANMASI
const app = express();
const PORT = process.env.PORT || 3000; // Sunucunun çalışacağı port (Varsayılan: 3000)

// 3. GLOBAL MIDDLEWARE TANIMLAMALARI (app.use)
// express.json(): İstemciden (Postman/Frontend) JSON formatında gelen verileri (req.body) okumamızı sağlar.
app.use(express.json());

// logger: Yazdığımız logger middleware'ini tüm isteklerde çalışacak şekilde global olarak aktif ediyoruz.
app.use(logger);

// 4. IN-MEMORY (BELLEK İÇİ) GEÇİCİ VERİ DEPOSU
// Henüz bir veritabanı (PostgreSQL vb.) bağlamadığımız için verileri geçici bir JavaScript dizisinde (Array) tutuyoruz.
let tasks = [
  {
    id: "1",
    title: "Backend API Uç Noktalarının Gelistirilmesi",
    description: "Express.js mimarisi üzerinde CRUD operasyonlarını içeren router yapısının kurulması.",
    status: "in_progress", // Görev Durumu: pending | in_progress | completed
    priority: "high",      // Öncelik: low | medium | high
    assignee: "Şevval Özer",
    createdAt: "2026-10-14T10:00:00.000Z",
    updatedAt: "2026-10-14T10:00:00.000Z"
  },
  {
    id: "2",
    title: "Postman Ile Uç Nokta Testlerinin Tamamlanması",
    description: "Tüm REST uç noktalarının Postman üzerinden test edilip ekran görüntülerinin alınması.",
    status: "pending",
    priority: "medium",
    assignee: "Şevval Özer",
    createdAt: "2026-10-14T11:00:00.000Z",
    updatedAt: "2026-10-14T11:00:00.000Z"
  }
];

// -----------------------------------------------------------------------------
// 5. REST API UÇ NOKTALARI (ENDPOINTS / ROUTERS)
// -----------------------------------------------------------------------------

/**
 * 1. GET /api/tasks
 * Açıklama: Sistemdeki TÜM görevleri listeler.
 * HTTP Status: 200 OK
 */
app.get('/api/tasks', (req, res) => {
  // res.status(200): İsteğin başarılı olduğunu belirten HTTP durum kodu.
  // .json(): Yanıtı JSON formatında istemciye döner.
  res.status(200).json({
    success: true,
    count: tasks.length, // Toplam görev sayısı
    data: tasks
  });
});

/**
 * 2. GET /api/tasks/:id
 * Açıklama: Belirtilen ID değerine sahip TEK BİR görevi getirir.
 * URL Parametresi: :id (req.params.id ile erişilir)
 */
app.get('/api/tasks/:id', (req, res) => {
  // URL'deki 'id' parametresine göre dizide arama yapıyoruz.
  const task = tasks.find(t => t.id === req.params.id);

  // EĞER görev bulunamazsa 404 Not Found hatası dönüyoruz.
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Görev bulunamadı.'
    });
  }

  // Görev bulunduysa 200 OK ile görevi döndürüyoruz.
  res.status(200).json({
    success: true,
    data: task
  });
});

/**
 * 3. POST /api/tasks
 * Açıklama: Sisteme YENİ bir görev ekler.
 * İstek Gövdesi (Body): req.body içinden veriler okunur.
 * HTTP Status: 201 Created
 */
app.post('/api/tasks', (req, res) => {
  // İstemciden gelen JSON gövdesinden alanları ayrıştırıyoruz (Destructuring)
  const { title, description, priority, assignee } = req.body;

  // Validation (Doğrulama): Başlık alanı boş ise hata döndürüyoruz.
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Görev başlığı zorunludur.'
    });
  }

  // Yeni görev objesinin oluşturulması
  const newTask = {
    id: (tasks.length + 1).toString(), // Otomatik artan basit ID mantığı
    title,
    description: description || '',
    status: 'pending',                  // Varsayılan görev durumu
    priority: priority || 'medium',     // Gönderilmediyse varsayılan: medium
    assignee: assignee || 'Şevval Özer',// Gönderilmediyse varsayılan atanan kişi
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Yeni görevi geçici dizimize ekliyoruz
  tasks.push(newTask);

  // 201 Created durum kodu ile oluşturulan objeyi dönüyoruz
  res.status(201).json({
    success: true,
    message: 'Görev başarıyla oluşturuldu.',
    data: newTask
  });
});

/**
 * 4. PUT /api/tasks/:id
 * Açıklama: Var olan bir görevin bilgilerini GÜNCELLER.
 * URL Parametresi: :id
 * HTTP Status: 200 OK
 */
app.put('/api/tasks/:id', (req, res) => {
  // Güncellenecek görevin dizideki indeksini (sırasını) buluyoruz
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);

  // Görev dizide yoksa (-1 döndüyse) 404 hatası veriyoruz
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Güncellenecek görev bulunamadı.'
    });
  }

  // İstemciden gelen güncellenecek yeni değerleri alıyoruz
  const { title, description, status, priority, assignee } = req.body;

  // Obje birleştirme (Spread Operator): Sadece gelen alanları güncelliyor, gelmeyenleri eski haliyle koruyoruz.
  tasks[taskIndex] = {
    ...tasks[taskIndex], // Eski görev verilerini kopyala
    title: title !== undefined ? title : tasks[taskIndex].title,
    description: description !== undefined ? description : tasks[taskIndex].description,
    status: status !== undefined ? status : tasks[taskIndex].status,
    priority: priority !== undefined ? priority : tasks[taskIndex].priority,
    assignee: assignee !== undefined ? assignee : tasks[taskIndex].assignee,
    updatedAt: new Date().toISOString() // Güncellenme tarihini şu anki zamana çekiyoruz
  };

  res.status(200).json({
    success: true,
    message: 'Görev başarıyla güncellendi.',
    data: tasks[taskIndex]
  });
});

/**
 * 5. DELETE /api/tasks/:id
 * Açıklama: Belirtilen ID'ye sahip görevi SİLER.
 * URL Parametresi: :id
 * HTTP Status: 200 OK
 */
app.delete('/api/tasks/:id', (req, res) => {
  // Silinecek görevin dizideki sırasını buluyoruz
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);

  // Bulunamadıysa 404 hatası
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Silinecek görev bulunamadı.'
    });
  }

  // Array.prototype.splice() metodu ile belirtilen indeksteki 1 elemanı diziden çıkarıyoruz
  const deletedTask = tasks.splice(taskIndex, 1);

  res.status(200).json({
    success: true,
    message: 'Görev başarıyla silindi.',
    data: deletedTask[0]
  });
});

// -----------------------------------------------------------------------------
// 6. SUNUCUNUN DİNLENMESİ (LISTEN)
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`TASKFLOW API Sunucusu http://localhost:${PORT} üzerinde çalışıyor.`);
});