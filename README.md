# Holine

Phòng điều khiển cho agent và kho mã. Nhiều khung chat, mỗi agent một worktree, câu tiếng Việt ngay trong ô, và một hàng rào chặn lệnh nguy hiểm trước khi chạy.

## Trong phòng

- **Bắt đầu** mở khung chat của Grok, Claude, Codex, Gemini và Qwen
- **Thêm agent** và **Quay lại**
- Tách 1, 2 hoặc 3 cột, shell cạnh chat, tạm dừng, công thức
- **Hàng rào** chặn `rm -rf`, `sudo`, `git reset --hard`, `git push --force`
- Plugin luôn bật. Tìm mọi skill và plugin, dán link GitHub, hoặc tải file .md
- Mỗi agent một file `lenh.md`. Hàng rào vẫn thắng
- Kết nối khóa AI kiểu trang riêng đã bỏ. AI trên trình duyệt cần đăng nhập Google, không cần khóa
- Khóa API dán trong mục Agent. Holine tự nhận nhà cung cấp và chỉ thêm khi khóa đúng. Phòng hiện tên đã đặt.
- Mục Nối nhận khóa Stitch, Figma, GitHub, Notion, Linear, Slack và Vercel. Chỉ ghi đã nối khi chính dịch vụ chấp nhận khóa
- Câu không phải lệnh gọi model sau khi đăng nhập. Lệnh shell không gọi model

## Bảng lệnh

`⌘K` hoặc `Ctrl+K` để nhảy. `⌘J` mở công thức.
