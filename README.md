# Phong Study – PWA (cài đặt được như app thật)

Bộ file này đã đủ để trình duyệt nhận diện web là **PWA cài đặt được** (Add to Home
Screen sẽ hiện nút "Cài đặt"/"Install" thay vì chỉ tạo lối tắt trình duyệt).

## Các file trong bộ này

| File | Vai trò |
|---|---|
| `index.html` | Trang chính (đã có sẵn link tới `manifest.json` và `sw.js`) |
| `manifest.json` | Khai báo tên app, icon, màu nền, chế độ hiển thị `standalone` |
| `sw.js` | Service Worker: cache offline + điều kiện bắt buộc để trình duyệt cho cài PWA |
| `icon-192.png`, `icon-512.png` | Icon app (đúng kích thước chuẩn PWA) |

## 1. Đưa lên GitHub

1. Tạo repo mới trên GitHub (ví dụ `phong-study`).
2. Đưa **cả 5 file trên vào thư mục gốc của repo** (không để trong thư mục con), giữ
   nguyên tên file — nhất là `index.html`, `manifest.json`, `sw.js`, `icon-192.png`,
   `icon-512.png` vì HTML đang gọi đúng các tên này.
3. Commit & push lên nhánh `main`.

## 2. Bật GitHub Pages

1. Vào repo → **Settings → Pages**.
2. Mục **Source**: chọn **Deploy from a branch**.
3. **Branch**: chọn `main`, thư mục `/ (root)` → **Save**.
4. Đợi 1–2 phút, GitHub sẽ cấp link dạng:
   `https://<ten-tai-khoan>.github.io/<ten-repo>/`

> Lưu ý quan trọng: vì trang chạy trong đường dẫn con
> (`/<ten-repo>/`) chứ không phải gốc domain, các đường dẫn trong `manifest.json`
> và lệnh `register('./sw.js', { scope: './' })` trong `index.html` đều dùng
> đường dẫn **tương đối** (`./...`) nên sẽ hoạt động đúng dù host ở đường dẫn con.
> Không cần sửa gì thêm.

## 3. Bắt buộc phải có HTTPS

GitHub Pages mặc định phục vụ qua HTTPS — điều kiện bắt buộc để Service Worker và
tính năng "Cài đặt PWA" hoạt động. Không cần cấu hình thêm.

## 4. Cài đặt app thật sự (không phải lối tắt)

- **Android (Chrome)**: mở link → trình duyệt tự hiện banner **"Cài đặt ứng dụng"**,
  hoặc vào menu (⋮) → **"Cài đặt ứng dụng"/"Add to Home screen"**. Sau khi cài, app
  mở toàn màn hình, có icon riêng trong danh sách app, không có thanh địa chỉ trình
  duyệt — đúng chuẩn app thật.
- **iPhone/iPad (Safari)**: mở link → nút **Chia sẻ (Share)** → **"Thêm vào MH chính"
  (Add to Home Screen)**. Trên iOS, đây luôn là cách cài PWA (Safari không có khái
  niệm "Install" riêng), nhưng nhờ có `manifest.json` + icon đúng chuẩn, app vẫn mở
  toàn màn hình như app thật.
- **Desktop (Chrome/Edge)**: mở link → biểu tượng **cài đặt (⊕)** xuất hiện ở cuối
  thanh địa chỉ → bấm **Cài đặt**.

## 5. Kiểm tra nhanh sau khi deploy

Mở DevTools (F12) → tab **Application**:
- **Manifest**: phải thấy tên app, icon, không có lỗi đỏ.
- **Service Workers**: phải thấy `sw.js` ở trạng thái *activated and is running*.

Nếu nút "Cài đặt" không hiện, thường do:
- Chưa deploy qua HTTPS (kiểm tra lại Pages đã bật chưa).
- Thiếu 1 trong 5 file, hoặc đặt sai tên/sai thư mục.
- Cache trình duyệt cũ — thử mở ẩn danh (Incognito) để kiểm tra sạch.

## 6. Cập nhật app sau này

Mỗi khi sửa `index.html` và push lên GitHub, đổi giá trị `CACHE_VERSION` trong
`sw.js` (ví dụ `phong-study-v1` → `phong-study-v2`) để buộc Service Worker xoá cache
cũ và tải bản mới cho người dùng đã cài app.
