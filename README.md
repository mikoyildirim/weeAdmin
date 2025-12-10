dashboard sayfası
kullanım sıklığı haritası
scooter dağıtım önerisi
az kullanılan cihazlar haritası ()
yetkilendirme

az kullanılan cihazlar sayfası

sayfalara sayfa güncelleme butonu eklenmesi (modüler component olarak yapılacak)
sayfalarda işlemler sonucunda bilgilendirme modalları
users sayfasında para işlemleri gerçekleşince modal ile bilgilendirme
 
USERS İYZİCO/İADE işlem gerçekleşiyor ama backend response dönmüyor.
backend konsola bunu basıyor:
Error: Cannot set headers after they are sent to the client
    at C:\Users\yildi\Desktop\murati\vscooter\v1\src\controllers\TransactionController.js:409:44
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async C:\Users\yildi\Desktop\murati\vscooter\v1\src\controllers\TransactionController.js:403:19
    at async C:\Users\yildi\Desktop\murati\vscooter\v1\src\controllers\TransactionController.js:399:13
    at async C:\Users\yildi\Desktop\murati\vscooter\v1\src\controllers\TransactionController.js:397:9
    at async addTransactionPanel (C:\Users\yildi\Desktop\murati\vscooter\v1\src\controllers\TransactionController.js:380:5)

