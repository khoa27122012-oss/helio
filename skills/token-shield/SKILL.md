---
name: token-shield
description: Shorter prompts, same model, same safety. Never a dumber answer and never a weaker rail.
---

# Token shield

Tiết kiệm token bằng cách mang ít hơn, không bằng cách nghĩ kém hơn.

- Mỗi skill chỉ một dòng digest. Không nhét nguyên SKILL.md vào mỗi câu.
- Không gửi cả lịch sử pane. Chỉ câu hỏi và một khối ngữ cảnh ngắn.
- Lệnh shell mà phòng đã biết thì không gọi model.
- Trần `max_tokens` có hạn. Câu trả lời vẫn phải đủ ý, đủ rủi ro, đủ bước.
- Không đổi sang model rẻ hơn. Model thật trong phòng là Grok 4.5.
- Hàng rào lệnh chạy trước model và được kiểm lại trên câu trả lời.
