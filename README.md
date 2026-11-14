# Helio

Phòng điều khiển cho agent và kho mã. Lấy cảm hứng từ [MXterm](https://mxterm.net): nhiều pane, mỗi agent một worktree, câu tiếng Việt ngay trong shell, và một hàng rào chặn lệnh nguy hiểm trước khi chạy.

Giao diện đi một hướng khác GitHub: mực tối, giấy ấm, một màu đèn. Kho mã, duyệt diff, máy và nhịp token nằm cùng một chỗ.

## Trong bản này

- **Phòng** — pane agent và shell, bố cục 1/2/3, lệnh hoặc tiếng Việt
- **Hàng rào** — `rm -rf`, `sudo`, `git reset --hard`, `git push --force` bị chặn
- **Kho** — cây tệp, mã, lịch sử, sao
- **Duyệt** — việc và pull request, diff cạnh nhận xét, merge khi kiểm tra đạt
- **Agent** — tạm dừng, đổi worktree, token
- **Máy** — bật/tắt, cây tệp
- **Plugin** — giọng thường, nói đúng việc, token shield, Ponytail, Taste, web-design-guidelines. Bật tắt thật sự đổi câu gửi đi.
- **Công thức** — câu viết sẵn. `⌘J` mở mục này. `⌘K` mở bảng lệnh.
- **Nhịp** — token 14 ngày và nhật ký. Cột cuối tăng khi pane gọi Grok.

Câu không phải lệnh gọi Grok 4.5 nếu môi trường có khóa. Lệnh shell không gọi model. Hàng rào chạy trước.

## Bảng lệnh

`⌘K` hoặc `Ctrl+K` để nhảy giữa kho, agent và công thức.
