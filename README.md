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

Đây là mô phỏng. Không có lệnh nào chạy trên máy của bạn, và không có remote thật để đẩy code.

## Bảng lệnh

`⌘K` hoặc `Ctrl+K` để nhảy giữa kho, agent và công thức.
