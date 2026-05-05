**SIGURU**

Sistem Informasi Absensi Guru

**PRODUCT REQUIREMENTS DOCUMENT**

**Field**

**Detail**

**Dokumen**

Product Requirements Document (PRD)

**Nama Produk**

SIGURU — Sistem Informasi Absensi Guru

**Versi**

v1.0 — Initial Release

**Tanggal**

4 Mei 2026

**Status**

**Draft — Review Internal**

**Pemilik Produk**

Tim Pengembang Digital Sekolah

**Stakeholder**

Kepala Sekolah, Wakasek, Guru, Staf TU

# **1\. Executive Summary**

SIGURU (Sistem Informasi Guru) adalah platform web-based untuk digitalisasi proses absensi guru di lingkungan sekolah. Platform ini menggantikan sistem absensi manual (kertas/buku) yang rawan manipulasi, tidak real-time, dan susah dilaporkan ke pihak manajemen.

SIGURU dirancang agar:

-   Guru bisa check-in/check-out dengan mudah dari browser tanpa install apapun.
-   Admin & Kepala Sekolah punya visibility real-time terhadap kehadiran seluruh staf pengajar.
-   Laporan kehadiran bisa di-generate otomatis bulanan/mingguan tanpa rekap manual.
-   Data absensi terintegrasi dengan sistem penggajian atau evaluasi kinerja guru.

# **2\. Problem Statement**

## **2.1 Pain Points Saat Ini**

Berikut masalah yang ditemukan berdasarkan observasi proses absensi manual di sekolah:

**#**

**Masalah**

**Dampak**

**Prioritas**

1

Absensi masih pakai buku/kertas fisik

Rawan titip absen, data mudah dimanipulasi

**🔴 Kritis**

2

Rekap absensi dilakukan manual setiap bulan oleh TU

Butuh waktu 3–5 hari kerja, rawan human error

**🔴 Kritis**

3

Kepala Sekolah tidak punya data real-time kehadiran guru

Keputusan operasional terhambat, monitoring lemah

**🟠 Tinggi**

4

Tidak ada notifikasi jika guru tidak hadir tanpa izin

Kelas terbengkalai, siswa tidak terlayani

**🟠 Tinggi**

5

Izin/cuti guru tidak tercatat dengan rapi

Konflik jadwal, data tidak akurat untuk penilaian kinerja

**🟡 Sedang**

## **2.2 Target Pengguna**

**Persona**

**Role**

**Kebutuhan Utama**

**Guru**

Pengguna utama absensi harian

Check-in/out cepat, lihat rekap kehadiran sendiri

**Staf TU / Admin**

Pengelola data & laporan

Kelola data guru, generate laporan bulanan, approval izin

**Wakasek / Kepala Sekolah**

Decision maker & supervisor

Dashboard real-time, alert guru absen, laporan kinerja

# **3\. Goals & Success Metrics**

## **3.1 Goals Produk**

-   Mendigitalisasi 100% proses absensi guru dari berbasis kertas ke web-based.
-   Menyediakan dashboard real-time untuk manajemen sekolah.
-   Mengurangi waktu rekap laporan dari 3–5 hari menjadi under 5 menit.
-   Meminimalisir manipulasi data kehadiran melalui validasi berbasis GPS & timestamp.

## **3.2 Key Success Metrics (KPI)**

**Metrik**

**Baseline (Sekarang)**

**Target 3 Bulan**

**Target 6 Bulan**

Adoption Rate (guru aktif pakai sistem)

0% (manual)

**70%**

**95%**

Waktu rekap laporan bulanan

3–5 hari kerja

**< 30 menit**

**< 5 menit**

Akurasi data kehadiran

~70% (estimasi)

**95%**

**99%**

User satisfaction score (1–5)

N/A

**≥ 4.0**

**≥ 4.5**

Waktu proses izin/cuti guru

1–2 hari (manual)

**< 2 jam**

**< 1 jam**

# **4\. Scope — Apa yang Dibangun**

## **4.1 In Scope (Masuk di MVP)**

-   Sistem autentikasi guru & admin berbasis email/username + password.
-   Fitur check-in dan check-out harian dengan validasi waktu otomatis.
-   Validasi lokasi berbasis GPS (geofencing radius kampus sekolah).
-   Pengajuan izin/cuti online dengan workflow approval dua tahap.
-   Dashboard admin: ringkasan kehadiran harian, absen tanpa keterangan, dll.
-   Dashboard kepala sekolah: overview bulanan, trend absensi per guru.
-   Generate & export laporan kehadiran (PDF & Excel) per guru / per periode.
-   Notifikasi email/in-app untuk reminder check-in, status izin, dan alert absen.
-   Manajemen data master guru (tambah, edit, nonaktifkan akun).

## **4.2 Out of Scope (Tidak di MVP — Fase Berikutnya)**

-   Integrasi langsung dengan fingerprint/face recognition hardware.
-   Mobile app native (iOS/Android) — MVP cukup responsive web.
-   Integrasi dengan sistem penggajian/payroll.
-   Absensi siswa — fokus pertama hanya pada guru.
-   AI-powered anomaly detection untuk pola absensi.

# **5\. User Stories & Acceptance Criteria**

## **5.1 Modul Autentikasi**

### **US-01: Login ke Sistem**

*Sebagai guru, saya ingin bisa login menggunakan username dan password agar saya bisa mengakses sistem absensi.*

**Acceptance Criteria:**

-   Halaman login tersedia di URL utama aplikasi.
-   Validasi username + password — salah 3x, akun terkunci 15 menit.
-   Setelah login sukses, user diarahkan ke dashboard sesuai role (guru / admin / kepsek).
-   Ada opsi 'Lupa Password' dengan reset via email terdaftar.

## **5.2 Modul Absensi Harian**

### **US-02: Check-In Harian**

*Sebagai guru, saya ingin melakukan check-in dengan satu klik agar proses absensi cepat dan tidak menyita waktu mengajar.*

**Acceptance Criteria:**

-   Tombol 'Check In' aktif mulai pukul 06.00 hingga 08.30 WIB (configurable oleh admin).
-   Sistem otomatis capture timestamp & koordinat GPS saat tombol ditekan.
-   Jika lokasi di luar radius 200m dari sekolah, muncul peringatan dan absensi ditandai 'Lokasi Tidak Valid'.
-   Check-in setelah 08.00 otomatis dicatat sebagai 'Terlambat'.
-   Konfirmasi visual muncul setelah check-in berhasil.

### **US-03: Check-Out**

*Sebagai guru, saya ingin melakukan check-out saat selesai bertugas agar jam kerja saya tercatat dengan akurat.*

**Acceptance Criteria:**

-   Tombol 'Check Out' hanya aktif setelah guru melakukan check-in.
-   Sistem catat durasi kehadiran (jam masuk — jam keluar).
-   Check-out sebelum jam 14.00 pada hari kerja normal ditandai sebagai 'Pulang Lebih Awal'.
-   Tidak bisa check-out dua kali di hari yang sama.

## **5.3 Modul Izin & Cuti**

### **US-04: Pengajuan Izin/Cuti**

*Sebagai guru, saya ingin mengajukan izin atau cuti secara online agar prosesnya lebih cepat dan terdokumentasi.*

**Acceptance Criteria:**

-   Formulir pengajuan tersedia: tanggal mulai-selesai, jenis (sakit/cuti tahunan/keperluan dinas), alasan, dan lampiran (opsional).
-   Setelah diajukan, status pengajuan tampil sebagai 'Menunggu Persetujuan'.
-   Guru mendapat notifikasi email saat status berubah (Disetujui/Ditolak).
-   Maksimal pengajuan izin tanpa surat dokter: 2 hari berturut-turut.

### **US-05: Approval Izin oleh Admin**

*Sebagai admin, saya ingin bisa menyetujui atau menolak pengajuan izin guru agar proses administrasi tertib.*

**Acceptance Criteria:**

-   Admin melihat list pengajuan izin yang belum diproses di dashboard.
-   Admin bisa Approve atau Reject dengan menambahkan catatan.
-   Setelah diproses, guru otomatis mendapat notifikasi hasil approval.
-   Data izin yang disetujui otomatis masuk ke rekap kehadiran bulan berjalan.

## **5.4 Modul Dashboard & Laporan**

### **US-06: Dashboard Real-Time Admin**

*Sebagai admin, saya ingin melihat kondisi kehadiran guru hari ini secara real-time agar bisa langsung tindak lanjut.*

**Acceptance Criteria:**

-   Dashboard menampilkan: total guru hadir, terlambat, izin, dan belum check-in.
-   List nama guru yang belum check-in tersedia real-time (auto-refresh tiap 5 menit).
-   Admin bisa klik nama guru untuk melihat detail riwayat absensi.
-   Data di-filter berdasarkan tanggal, mata pelajaran, atau status.

### **US-07: Generate Laporan Bulanan**

*Sebagai admin, saya ingin bisa generate laporan kehadiran guru dalam format PDF/Excel agar mudah dilaporkan ke kepala sekolah.*

**Acceptance Criteria:**

-   Laporan bisa di-generate per guru, per kelas, atau per seluruh sekolah.
-   Periode laporan: mingguan, bulanan, atau custom rentang tanggal.
-   Format export: PDF (untuk presentasi) dan Excel (untuk analisis lebih lanjut).
-   Laporan mencakup: total hadir, terlambat, izin, alpha, dan persentase kehadiran.

# **6\. Functional Requirements**

**Kode**

**Modul**

**Requirement**

**Prioritas**

FR-01

Autentikasi

Login multi-role (Guru, Admin, Kepsek) dengan JWT token

**Must Have**

FR-02

Autentikasi

Reset password via email dengan link expire 24 jam

**Must Have**

FR-03

Autentikasi

Session timeout otomatis setelah 8 jam tidak aktif

**Must Have**

FR-04

Absensi

Check-in/out dengan GPS geofencing ±200m radius sekolah

**Must Have**

FR-05

Absensi

Timestamp server-side (bukan device) untuk cegah manipulasi

**Must Have**

FR-06

Absensi

Konfigurasi jam kerja & batas toleransi per hari libur/special day

**Must Have**

FR-07

Absensi

Status absensi otomatis: Hadir / Terlambat / Alpha / Izin

**Must Have**

FR-08

Izin/Cuti

Formulir pengajuan izin online dengan attachment (PDF/JPG max 2MB)

**Must Have**

FR-09

Izin/Cuti

Workflow approval 2 tahap: Admin → Kepala Sekolah (untuk cuti > 3 hari)

Should Have

FR-10

Notifikasi

Email notifikasi: reminder check-in pukul 07.45, status izin, alert alpha

Should Have

FR-11

Dashboard

Overview real-time kehadiran hari ini untuk Admin & Kepsek

**Must Have**

FR-12

Laporan

Export laporan PDF & XLSX per guru / per periode

**Must Have**

FR-13

Laporan

Rekap otomatis bulanan tersimpan di sistem minimal 2 tahun

Should Have

FR-14

Master Data

CRUD data guru: nama, NIP, mata pelajaran, kelas, email

**Must Have**

FR-15

Master Data

Import data guru massal via template Excel

Could Have

# **7\. Non-Functional Requirements**

**Kategori**

**Requirement**

**Target**

**Performance**

Waktu load halaman utama

< 2 detik di koneksi 10 Mbps

**Performance**

API response time untuk absensi

< 500ms (p95)

**Availability**

Uptime sistem

≥ 99.5% per bulan (kecuali maintenance terjadwal)

**Security**

Enkripsi data transmisi

HTTPS/TLS 1.3 wajib

**Security**

Password hashing

bcrypt dengan salt rounds ≥ 12

**Security**

Rate limiting login

Max 5 percobaan, lockout 15 menit

**Scalability**

Jumlah user konkuren

Support hingga 200 user aktif bersamaan

**Scalability**

Storage data absensi

Mampu simpan data 5 tahun ke depan

**Usability**

Browser support

Chrome, Firefox, Edge, Safari versi 2 tahun terakhir

**Usability**

Responsive design

Optimal di desktop & mobile (min. 360px width)

**Backup**

Backup otomatis database

Setiap malam pukul 00.00, retensi 30 hari

# **8\. Technical Architecture (Recommended Stack)**

**Layer**

**Teknologi**

**Alasan Pemilihan**

**Frontend**

**React.js + Tailwind CSS**

Component-based, responsive, ekosistem luas

**Backend/API**

**Node.js + Express.js / Laravel (PHP)**

Mature, dokumentasi lengkap, mudah dicari developer lokal

**Database**

**PostgreSQL**

Relasional, support JSONB, handal untuk data transaksi

**Auth**

**JWT + Refresh Token**

Stateless, scalable, industry standard

**Maps/GPS**

**Google Maps API + HTML5 Geolocation**

Akurasi tinggi, free tier cukup untuk skala sekolah

**File Storage**

**AWS S3 / Minio (self-hosted)**

Lampiran izin, laporan tersimpan aman

**Hosting**

**VPS (Nginx + Docker)**

Cost-efficient, full kontrol, mudah di-backup

**Email**

**SMTP / SendGrid**

Notifikasi & reset password

# **9\. Deskripsi Halaman & User Flow**

## **9.1 Alur Utama Guru — Hari Kerja Normal**

**Step**

**Aksi**

**Yang Terjadi di Sistem**

**1**

**Buka aplikasi (browser)**

Halaman login muncul. Guru input username + password.

**2**

**Login**

Sistem verifikasi, generate JWT, redirect ke Dashboard Guru.

**3**

**Klik tombol 'Check In'**

Sistem request izin GPS. Guru allow. Sistem catat koordinat + waktu server.

**4**

**Sistem validasi lokasi**

Jika dalam radius → status 'Hadir' atau 'Terlambat'. Jika luar radius → peringatan muncul.

**5**

**Guru mengajar (seharian)**

Bisa lihat riwayat absensi sendiri di halaman 'Riwayat Saya'.

**6**

**Pulang → Klik 'Check Out'**

Sistem catat jam keluar, hitung durasi kerja. Konfirmasi muncul.

**7**

**Logout**

Session dihapus. Redirect ke halaman login.

## **9.2 Halaman-Halaman Utama**

-   Login Page — Form username, password, forgot password link. Simple & clean.
-   Dashboard Guru — Status absensi hari ini (sudah/belum check-in), tombol check-in/out, ringkasan bulan berjalan (hadir/terlambat/izin), notifikasi terbaru.
-   Riwayat Absensi Guru — Tabel per hari, filter bulan/tahun, bisa lihat detail tiap record.
-   Form Pengajuan Izin — Field tanggal, jenis izin, alasan, upload dokumen, tombol submit.
-   Dashboard Admin — Widget ringkasan (hadir/tidak hadir/izin hari ini), tabel guru belum check-in, quick action: approve izin, tambah data guru.
-   Manajemen Data Guru — Tabel CRUD guru, filter pencarian, import Excel, export daftar.
-   Laporan — Pilih guru/semua, pilih periode, preview ringkasan, tombol Export PDF/Excel.
-   Dashboard Kepala Sekolah — Grafik tren kehadiran bulanan, perbandingan antar guru (anonim), alert guru alpha berulang.

# **10\. Timeline Pengembangan**

**Fase**

**Periode**

**Deliverable**

**Status**

**Fase 0 Discovery**

Minggu 1–2

Stakeholder interview, finalisasi requirements, wireframe low-fi, approval PRD

**Planning**

**Fase 1 MVP Core**

Minggu 3–7

Auth system, check-in/out + GPS, dashboard admin basic, manajemen data guru

**Dev**

**Fase 2 Features**

Minggu 8–11

Modul izin/cuti + approval flow, laporan PDF/Excel, notifikasi email

**Dev**

**Fase 3 Polish**

Minggu 12–13

Dashboard Kepsek, UI/UX refinement, performance tuning, security audit

**Dev**

**Fase 4 UAT**

Minggu 14–15

User acceptance testing dengan guru & admin, bug fixing, training

**QA**

**Fase 5 Launch**

Minggu 16

Go-live, monitoring 1 bulan pertama, support & iterasi

**Launch**

# **11\. Risks & Mitigations**

**Risiko**

**Likelihood**

**Mitigasi**

Guru resistance — tidak mau pakai sistem baru

🟠 Tinggi

Libatkan guru dalam testing awal, adakan training onboarding, tampilkan manfaat langsung (lihat rekap sendiri).

Sinyal GPS lemah di area tertentu dalam gedung sekolah

🟠 Tinggi

Sediakan opsi check-in manual oleh admin untuk kasus edge, log flagged untuk review.

Data breach / akses tidak sah

🟡 Sedang

Implementasi security best practices (HTTPS, rate limiting, input validation, pen-test sebelum launch).

Scope creep selama development

🟡 Sedang

Freeze scope MVP di Fase 0, feature request baru masuk backlog Fase 2+.

Internet sekolah tidak stabil

🟡 Sedang

Offline mode minimal: queue check-in lokal, sync ketika online kembali.

Turnover developer mid-project

🟠 Rendah

Dokumentasi kode wajib, gunakan stack standar, knowledge transfer rutin.

# **12\. Open Questions & Decisions Needed**

**#**

**Pertanyaan**

**Owner**

**Due Date**

**1**

Apakah ada integrasi dengan sistem payroll existing yang harus dipersiapkan dari awal?

Kepala Sekolah + IT

Minggu 1

**2**

Berapa radius geofencing yang tepat? (200m default, tapi bisa berbeda tergantung layout sekolah)

Admin + Wakasek

Minggu 1

**3**

Siapa yang jadi super-admin pertama? Apakah TU atau IT sekolah?

Kepala Sekolah

Minggu 1

**4**

Apakah data absensi guru perlu dikirim ke dinas pendidikan secara otomatis?

Kepala Sekolah

Minggu 2

**5**

Self-hosted VPS atau pakai cloud provider (AWS/GCP)? Budget infrastruktur?

Komite Sekolah + IT

Minggu 2

# **13\. Appendix — Glossary**

**Term**

**Definisi**

**MVP**

Minimum Viable Product — versi pertama produk yang cukup untuk dipakai user nyata.

**PRD**

Product Requirements Document — dokumen yang mendefinisikan apa yang akan dibangun & mengapa.

**Geofencing**

Batas virtual berbasis GPS yang mendeteksi apakah perangkat berada di dalam area tertentu.

**JWT**

JSON Web Token — standar autentikasi stateless yang aman untuk web & mobile.

**Alpha**

Istilah absensi: guru tidak hadir tanpa keterangan apapun.

**UAT**

User Acceptance Testing — pengujian oleh end-user sebelum sistem diluncurkan resmi.

**CRUD**

Create, Read, Update, Delete — operasi dasar manajemen data.

**p95**

Percentile ke-95 dari response time — 95% request selesai dalam waktu yang ditargetkan.

**SIGN-OFF & APPROVAL**

**Kepala Sekolah**

**Wakasek Kurikulum**

**Product Manager / IT Lead**

*Tanda Tangan & Tanggal: \_\_\_\_\_\_\_\_\_\_\_*

*Tanda Tangan & Tanggal: \_\_\_\_\_\_\_\_\_\_\_*

*Tanda Tangan & Tanggal: \_\_\_\_\_\_\_\_\_\_\_*

*Dokumen ini berlaku efektif setelah ditandatangani oleh semua pihak yang tercantum di atas. Revisi pada dokumen ini hanya dapat dilakukan atas persetujuan Product Owner dan dicatat sebagai versi baru.*