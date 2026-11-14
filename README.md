# Holine

Phòng điều khiển cho agent và kho mã. Nhiều khung chat, mỗi agent một worktree, câu tiếng Việt ngay trong ô, và một hàng rào chặn lệnh nguy hiểm trước khi chạy.

## Trong phòng

- **Bắt đầu** mở khung chat của Grok, Claude, Codex, Gemini và Qwen
- **Thêm agent** và **Quay lại**
- Tách 1, 2 hoặc 3 cột, shell cạnh chat, tạm dừng, công thức
- **Hàng rào** chặn `rm -rf`, `sudo`, `git reset --hard`, `git push --force`
- Plugin và skill luôn bật, giữ tên mặc định
- Câu không phải lệnh gọi Grok 4.5. Lệnh shell không gọi model

## Bảng lệnh

`⌘K` hoặc `Ctrl+K` để nhảy. `⌘J` mở công thức.
