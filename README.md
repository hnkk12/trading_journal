# Trading Journal

Nhật ký giao dịch full-stack — theo dõi hiệu suất, tâm lý thực thi lệnh và portfolio đa tài sản (Forex, Crypto, Cổ phiếu, Futures/Spot).

## Kiến trúc

- `backend/` — Node.js + Express + TypeScript, Prisma ORM, **Postgres (Supabase — dùng chung DB với hkfin)**
- `frontend/` — React + Vite + TypeScript, Tailwind CSS, Recharts, TanStack Query

Trading Journal **không có đăng ký/đăng nhập riêng**. Bảng `trading_accounts`, `trades`, `trade_error_tags`, ... sống trong cùng Supabase Postgres của hkfin, khoá thẳng vào `public.users(id)` — xem migration [`agent/migrations/004_trading_journal.sql`](../hkfin/agent/migrations/004_trading_journal.sql) trong repo hkfin. Xác thực dùng lại JWT mà hkfin đã phát hành (cùng `JWT_SECRET_KEY`, xem `backend/src/middleware/auth.ts`) — người dùng đăng nhập ở hkfin rồi mở Trading Journal với `?token=<jwt>`.

## Chạy dự án lần đầu

### 1. Database

Áp dụng `agent/migrations/004_trading_journal.sql` (repo hkfin) vào Supabase project mà hkfin đang dùng. Copy connection string + `JWT_SECRET_KEY` từ `hkfin/agent/.env` vào `backend/.env`.

### 2. Backend

```bash
cd backend
npm install
npm run prisma:generate   # sinh Prisma Client từ schema.prisma (không migrate — schema đã có sẵn từ bước 1)
npm run seed                # gắn dữ liệu mẫu vào 1 user hkfin đã tồn tại (DEMO_USER_EMAIL)
npm run dev                  # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 (proxy /api -> localhost:4000)
```

Đăng nhập ở hkfin, mở Trading Journal qua link có kèm `?token=<jwt>` (hoặc dán token thủ công ở trang Login khi dev).

## Các trang chính

- **Tổng quan** — timeline phiên giao dịch (Sydney/Tokyo/London/New York), các chỉ số hiệu suất (Net Profit, Profit Factor, Max Drawdown, Recovery Factor, Sharpe-like Ratio, Avg R-Multiple...), radar điểm hiệu suất, win rate, P&L theo ngày
- **Lệnh giao dịch** — danh sách lệnh, thêm/sửa/xoá lệnh với đầy đủ SL/TP, phí, khung giờ, phiên, chiến lược/playbook, chấm điểm thực thi, gắn thẻ lỗi, và xuất CSV
- **Lịch** — lịch P&L dạng heatmap theo tháng (kiểu TradeZella), màu đậm/nhạt theo độ lớn lãi/lỗ mỗi ngày
- **Portfolio** — tổng số dư, phân bổ theo loại tài sản (Forex/Crypto/Cổ phiếu/Futures), chi tiết từng tài khoản, **gộp DCA nhiều lần vào lệnh cùng mã/chiều thành 1 vị thế** (giá vào trung bình có trọng số), và với tài khoản futures: margin ước tính + giá thanh lý (isolated margin, xấp xỉ kiểu Binance)
- **Thực thi lệnh** — điểm thực thi tổng thể (trước/trong/sau lệnh + kỷ luật), ma trận 4 nhóm lệnh (kế hoạch vs bốc đồng, thắng vs thua), biểu đồ Pareto lỗi hay gặp
- **Phân tích** — thống kê theo khung giờ, buy/sell, phiên giao dịch, so sánh P&L thực tế vs lý thuyết, biểu đồ drawdown (underwater equity), hiệu suất theo chiến lược/playbook
- **Cài đặt** — quản lý tài khoản (kể cả đòn bẩy/maintenance margin cho futures), nạp/rút tiền, danh sách thẻ lỗi

## Ghi chú kỹ thuật

- Database là Postgres/Supabase dùng chung với hkfin — không tự `prisma migrate`/`db push` (sẽ đụng vào các bảng hkfin không khai báo hết trong schema.prisma). Đổi schema qua raw SQL trong `hkfin/agent/migrations`, rồi `npm run prisma:pull` để đồng bộ lại.
- `JWT_SECRET_KEY` trong `backend/.env` phải khớp y hệt giá trị trong `hkfin/agent/.env`.
- Portfolio hiện tính theo giá trị bạn tự nhập khi ghi nhận lệnh (không tích hợp giá thị trường realtime, không có watchlist giá live).
- Giá thanh lý futures là công thức ước lượng isolated-margin đơn giản (`entry * (1 ± 1/leverage ∓ maintenanceMarginRate)`), bỏ qua phí funding — dùng để tham khảo trong nhật ký, không thay thế risk engine của sàn thật.
- Chưa có import CSV từ các sàn/broker cụ thể (mỗi nơi một định dạng khác nhau) — hiện chỉ hỗ trợ xuất CSV từ dữ liệu đã nhập.
