# Helio

Phòng điều khiển cho agent và kho mã. Lấy cảm hứng từ [MXterm](https://mxterm.net): nhiều pane, mỗi agent một worktree, câu tiếng Việt ngay trong shell, và một hàng rào chặn lệnh nguy hiểm trước khi chạy.

Giao diện đi một hướng khác GitHub: mực tối, giấy ấm, một màu đèn. Kho mã, duyệt diff, máy SSH và nhịp token nằm cùng một chỗ, không tách thành năm sản phẩm.

## Trong bản xem trước

- **Phòng** — pane agent và shell, bố cục 1/2/3, lệnh hoặc tiếng Việt
- **Hàng rào** — `rm -rf`, `sudo`, `git reset --hard`, `git push --force` bị chặn
- **Kho** — cây tệp, mã, lịch sử, sao
- **Duyệt** — việc và pull request, diff cạnh nhận xét, merge khi CI đạt
- **Agent** — tạm dừng, đổi worktree, token
- **Máy** — bật/tắt, cây SFTP
- **Công thức** — câu viết sẵn, gửi vào pane đang chọn
- **Nhịp** — token 14 ngày, 16 tuần, nhật ký
- **Cổng** — Ponytail, Taste, Playwright CLI, token shield, Graphify, web-design-guidelines, Heretic (chỉ ghi chú nghiên cứu). Câu tiếng Việt gọi Grok 4.5 qua tuyến OmniRoute + 9Router. Lệnh shell không gọi model.

Đây là mô phỏng shell. Không có lệnh nào chạy trên máy của bạn. Câu không phải lệnh có thể gọi Grok nếu môi trường có khóa AI.

## Bảng lệnh

`⌘K` hoặc `Ctrl+K` để nhảy giữa kho, agent và công thức.
