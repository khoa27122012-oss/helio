# Holine

Phòng điều khiển cho agent và kho mã. Nhiều khung chat, mỗi agent một worktree, câu tiếng Việt ngay trong ô, và một hàng rào chặn lệnh nguy hiểm trước khi chạy.

## Trong phòng

- **Bắt đầu** mở khung chat của Grok, Claude, Codex, Gemini và Qwen
- **Thêm agent** và **Quay lại**
- Tách 1, 2 hoặc 3 cột, shell cạnh chat, tạm dừng, công thức
- **Hàng rào** chặn `rm -rf`, `sudo`, `git reset --hard`, `git push --force`
- Plugin luôn bật. Skill tìm trên GitHub, dán link, hoặc tải file .md
- File lệnh `lenh.md` siết việc model được làm. Hàng rào vẫn thắng
- Kết nối: dán khóa xAI, hoặc khóa Gemini sau khi đăng nhập Google AI Studio
- Câu không phải lệnh gọi model. Khung Gemini dùng khóa Google nếu đã dán. Lệnh shell không gọi model

## Bảng lệnh

`⌘K` hoặc `Ctrl+K` để nhảy. `⌘J` mở công thức.
