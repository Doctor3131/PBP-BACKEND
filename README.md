### **INSTALASI**



### **Lingkungan & Server**
Dokumentasi ini merinci lingkungan dan dependensi yang diperlukan untuk menjalankan dan mengembangkan proyek `pbp-backend`.

* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: PostgreSQL
* **Manajer Proses (Pengembangan)**: Nodemon

---

### **Dependensi Aplikasi (dependencies)**
Ini adalah pustaka yang dibutuhkan agar aplikasi dapat berjalan di lingkungan produksi. Pustaka ini akan terpasang secara otomatis saat menjalankan `npm install`.

* **bcrypt**: `^6.0.0`
* **cors**: `^2.8.5`
* **dotenv**: `^17.2.3`
* **express**: `^5.1.0`
* **joi**: `^18.0.1`
* **jsonwebtoken**: `^9.0.2`
* **multer**: `^2.0.2`
* **pg**: `^8.16.3`
* **swagger-ui-express**: `^5.0.1`
* **winston**: `^3.18.3`
* **winston-daily-rotate-file**: `^5.0.0`
* **yamljs**: `^0.3.0`

---

### **Dependensi Pengembangan (devDependencies)**
Pustaka ini hanya dibutuhkan selama proses pengembangan dan pengujian, seperti untuk *linting*, *testing*, dan *hot-reloading*. Pasang dengan `npm install` di lingkungan pengembangan, atau secara spesifik menggunakan `npm install --save-dev <nama-paket>`.

* **@eslint/js**: `^9.37.0`
* **eslint**: `^9.37.0`
* **jest**: `^30.2.0`
* **nodemon**: `^3.1.10`
* **supertest**: `^7.1.4`
