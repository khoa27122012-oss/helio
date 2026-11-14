# Cổng OmniRoute + 9Router

Helio không chạy server OmniRoute hay 9Router. Hai thứ đó là gateway riêng, và cổng xem trước chỉ có một.

Trong phòng, cổng được mô phỏng đủ để dùng:

1. **OmniRoute combo** — Grok 4.5 là model chính. Không có model thứ hai kém hơn để không làm câu trả lời ngu đi.
2. **9Router, ba tầng** — thuê bao (Grok 4.5) → thử lại một lần nếu máy chủ lỗi, cùng model → kế hoạch cục bộ, không tốn token.
3. **Token shield** — một lần gọi, prompt đã nén, cùng model.

Lệnh nguy hiểm không bao giờ vào tầng nào. Chúng dừng ở hàng rào của pane.
