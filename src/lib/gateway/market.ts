export type Connector = {
  id: string
  name: string
  group: "Model" | "Việc" | "Thiết kế"
  detail: string
  scopes: string[]
}

export type ToolPack = {
  id: string
  name: string
  group: "Android SDK" | "Biên dịch" | "Đóng gói"
  detail: string
  size: string
}

export const CONNECTORS: Connector[] = [
  {
    id: "grok",
    name: "Grok",
    group: "Model",
    detail: "Model đang trả lời trong phòng. Không gỡ được.",
    scopes: ["Trả lời câu tiếng Việt", "Đọc ngữ cảnh pane"],
  },
  {
    id: "gemini",
    name: "Gemini",
    group: "Model",
    detail: "Cùng kiểu connector của Gemini: Workspace, Drive, lịch.",
    scopes: ["Đưa tên tài khoản vào ngữ cảnh"],
  },
  {
    id: "claude",
    name: "Claude",
    group: "Model",
    detail: "Cùng kiểu connector của Claude: Gmail, lịch, Notion, Slack.",
    scopes: ["Đưa tên tài khoản vào ngữ cảnh"],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    group: "Model",
    detail: "Cùng kiểu app của ChatGPT: GitHub, Drive, Slack.",
    scopes: ["Đưa tên tài khoản vào ngữ cảnh"],
  },
  {
    id: "github",
    name: "GitHub",
    group: "Việc",
    detail: "Kho, pull request, việc. Đọc danh sách mẫu trong phòng.",
    scopes: ["Đọc kho mẫu", "Đọc pull request"],
  },
  {
    id: "gmail",
    name: "Gmail",
    group: "Việc",
    detail: "Thư. Bản này chỉ ghi là đã cho phép, không mở hộp thư thật.",
    scopes: ["Tìm thư mẫu"],
  },
  {
    id: "calendar",
    name: "Lịch",
    group: "Việc",
    detail: "Lịch Google. Không tạo sự kiện trên tài khoản thật.",
    scopes: ["Xem lịch mẫu"],
  },
  {
    id: "drive",
    name: "Drive",
    group: "Việc",
    detail: "File trên Drive. Không tải file thật.",
    scopes: ["Xem tên file mẫu"],
  },
  {
    id: "slack",
    name: "Slack",
    group: "Việc",
    detail: "Kênh và tin. Không gửi tin ra workspace thật.",
    scopes: ["Đọc kênh mẫu"],
  },
  {
    id: "notion",
    name: "Notion",
    group: "Việc",
    detail: "Trang và cơ sở dữ liệu. Không sửa workspace thật.",
    scopes: ["Đọc trang mẫu"],
  },
  {
    id: "linear",
    name: "Linear",
    group: "Việc",
    detail: "Việc và dự án.",
    scopes: ["Đọc việc mẫu"],
  },
  {
    id: "figma",
    name: "Figma",
    group: "Thiết kế",
    detail: "Khung thiết kế. Ghép với Taste khi cần giao diện.",
    scopes: ["Đọc tên file"],
  },
  {
    id: "stitch",
    name: "Stitch",
    group: "Thiết kế",
    detail: "Đưa một bản thiết kế vào pane, rồi ghép với kho hoặc Taste.",
    scopes: ["Đưa mô tả màn hình vào pane"],
  },
  {
    id: "canva",
    name: "Canva",
    group: "Thiết kế",
    detail: "Trang trình bày và ảnh.",
    scopes: ["Đọc tên thiết kế"],
  },
  {
    id: "vercel",
    name: "Vercel",
    group: "Việc",
    detail: "Bản deploy. Không đẩy bản mới.",
    scopes: ["Đọc tên dự án"],
  },
]

export const TOOLS: ToolPack[] = [
  { id: "cmdline-tools", name: "Command-line tools", group: "Android SDK", detail: "sdkmanager, avdmanager.", size: "150 MB" },
  { id: "platform-tools", name: "Platform-tools", group: "Android SDK", detail: "adb và fastboot.", size: "16 MB" },
  { id: "build-tools", name: "Build-tools 35.0.0", group: "Android SDK", detail: "aapt2, d8, zipalign, apksigner.", size: "52 MB" },
  { id: "platform", name: "Platform android-35", group: "Android SDK", detail: "android.jar để biên dịch.", size: "64 MB" },
  { id: "emulator", name: "Emulator", group: "Android SDK", detail: "Máy ảo để cài bản debug.", size: "340 MB" },
  { id: "ndk", name: "NDK", group: "Android SDK", detail: "Biên dịch mã gốc.", size: "680 MB" },
  { id: "jdk", name: "JDK 21", group: "Biên dịch", detail: "javac cho Gradle và Android.", size: "180 MB" },
  { id: "gradle", name: "Gradle 8.11", group: "Biên dịch", detail: "Đóng gói dự án Android.", size: "120 MB" },
  { id: "kotlin", name: "Kotlin", group: "Biên dịch", detail: "Trình biên dịch Kotlin.", size: "70 MB" },
  { id: "node", name: "Node 22", group: "Biên dịch", detail: "JavaScript và công cụ web.", size: "90 MB" },
  { id: "python", name: "Python 3.12", group: "Biên dịch", detail: "Script và công cụ SDK.", size: "40 MB" },
  { id: "go", name: "Go", group: "Biên dịch", detail: "Biên dịch dịch vụ Go.", size: "70 MB" },
  { id: "rust", name: "Rust", group: "Biên dịch", detail: "rustc và cargo.", size: "180 MB" },
  { id: "cmake", name: "CMake", group: "Biên dịch", detail: "Sinh bản dựng cho NDK.", size: "30 MB" },
  { id: "bundletool", name: "bundletool", group: "Đóng gói", detail: "Đóng Android App Bundle.", size: "20 MB" },
  { id: "r8", name: "R8", group: "Đóng gói", detail: "Rút gọn và mã hóa bản phát hành.", size: "12 MB" },
]

export const ANDROID_SDK = ["cmdline-tools", "platform-tools", "build-tools", "platform", "emulator", "ndk"]
export const ANDROID_BUILD = ["jdk", "gradle", "platform-tools", "build-tools", "platform"]

export function connectorName(id: string) {
  return CONNECTORS.find((item) => item.id === id)?.name ?? id
}

export function toolName(id: string) {
  return TOOLS.find((item) => item.id === id)?.name ?? id
}

export function androidLog(device: string) {
  return [
    "sdkmanager --list",
    "build-tools;35.0.0",
    "platforms;android-35",
    "platform-tools",
    "./gradlew :app:assembleDebug",
    "> Task :app:preBuild",
    "> Task :app:compileDebugKotlin",
    "> Task :app:dexBuilderDebug",
    "> Task :app:packageDebug",
    "BUILD SUCCESSFUL",
    "app/build/outputs/apk/debug/app-debug.apk",
    `adb -s ${device} install -r app-debug.apk`,
    "Success",
  ]
}
