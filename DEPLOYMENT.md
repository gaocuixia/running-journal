# 网站部署指南

将个人跑步记录网站部署到云端，提供稳定的公网访问。

## 为什么选择云部署

- 📡 **稳定访问**：随时随地可以访问，不受本地网络限制
- 💾 **数据安全**：云端存储比本地存储更可靠
- 📱 **多设备同步**：不同设备可以看到相同的内容
- 🔄 **自动备份**：大部分云服务提供自动备份功能

## 部署方案选择

对于静态网站（只有 HTML、CSS、JavaScript 的网站），推荐使用 **静态网站托管服务**，成本低、配置简单。

### 推荐平台

| 平台 | 价格 | 特点 |
|------|------|------|
| GitHub Pages | 免费 | 适合程序员，与 GitHub 集成 |
| Vercel | 免费 | 部署速度快，自动 HTTPS |
| Netlify | 免费 | 功能丰富，支持自定义域名 |
| Cloudflare Pages | 免费 | 全球 CDN，访问速度快 |

## 部署步骤（以 GitHub Pages 为例）

### 步骤一：准备网站文件

确保你的项目文件夹包含以下文件：
```
├── index.html          # 网站主页面
├── style.css           # 样式文件
├── script.js           # JavaScript 功能文件
└── README.md           # 说明文档（可选）
```

### 步骤二：创建 GitHub 仓库

1. 访问 [GitHub](https://github.com/) 并登录账号
2. 点击右上角的「+」图标，选择「New repository」
3. 填写仓库名称（如 `running-journal`）
4. 选择仓库可见性（公开即可）
5. 点击「Create repository」

### 步骤三：上传网站文件

#### 方法一：使用 GitHub Desktop（推荐新手）

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 登录你的 GitHub 账号
3. 点击「File」→「Clone repository」，选择刚创建的仓库
4. 将网站文件复制到克隆的仓库文件夹中
5. 在 GitHub Desktop 中，填写提交信息（如「Initial commit」）
6. 点击「Commit to main」，然后点击「Push origin」

#### 方法二：使用 Git 命令行

```bash
# 初始化 Git 仓库
git init

# 添加文件到暂存区
git add .

# 提交文件
git commit -m "Initial commit"

# 关联远程仓库
git remote add origin https://github.com/yourusername/running-journal.git

# 推送到 GitHub
git push -u origin main
```

### 步骤四：开启 GitHub Pages

1. 进入 GitHub 仓库页面
2. 点击「Settings」→「Pages」
3. 在「Branch」下拉菜单中选择「main」分支
4. 在「Directory」下拉菜单中选择「/（根目录）」
5. 点击「Save」
6. 等待部署完成，页面会显示你的网站 URL（如 `https://yourusername.github.io/running-journal/`）

## 数据迁移方案

由于你之前的文章保存在浏览器的 localStorage 中，需要将这些数据迁移到云端。

### 导出本地数据

1. 打开本地网站页面
2. 按 F12 打开开发者工具
3. 切换到「Console」（控制台）标签页
4. 输入以下命令，按回车：
   ```javascript
   localStorage.getItem('runningArticles')
   ```
5. 复制输出的 JSON 数据，保存到文本文件中

### 修改代码支持云端数据

目前的代码使用 localStorage 存储数据。为了在云端使用，需要：

1. 选择一种后端存储方案（如 Firebase、Supabase 等）
2. 修改 JavaScript 代码，将数据存储从 localStorage 改为后端 API

### 简单方案：使用公共 JSON 文件

如果你不想设置复杂的后端，可以使用 GitHub Gist 或其他服务托管 JSON 数据文件：

1. 创建一个 GitHub Gist，粘贴之前导出的 JSON 数据
2. 获得 Gist 的 Raw URL
3. 修改 script.js 中的数据加载代码，从 Gist 加载数据：

```javascript
// 替换原来的 loadFromLocalStorage 函数
async function loadFromLocalStorage() {
    try {
        // 从 Gist 加载数据
        const response = await fetch('https://gist.githubusercontent.com/yourusername/your-gist-id/raw/runningArticles.json');
        const data = await response.json();
        articles = data;
    } catch (error) {
        console.error('加载云端数据失败，使用本地存储：', error);
        // 失败时回退到本地存储
        const savedArticles = localStorage.getItem('runningArticles');
        if (savedArticles) {
            articles = JSON.parse(savedArticles);
        }
    }
}

// 替换原来的 saveToLocalStorage 函数
function saveToLocalStorage() {
    localStorage.setItem('runningArticles', JSON.stringify(articles));
    // 注意：这个方案只能读取云端数据，不能直接写入
    // 如果需要写入功能，需要使用完整的后端服务
}
```

## 域名配置（可选）

如果你有自己的域名，可以将其指向托管的网站：

1. 进入域名注册商的管理界面
2. 添加 CNAME 记录，指向你的网站 URL
3. 在托管服务平台（如 GitHub Pages）中配置自定义域名

## 常见问题

### 网站部署后看不到新内容

- 清除浏览器缓存
- 检查 GitHub Pages 是否重新部署完成
- 确认文件是否正确推送到 GitHub

### 数据不显示

- 检查数据文件是否正确
- 检查浏览器控制台是否有错误信息
- 确认网络连接正常

## 更多帮助

如果遇到问题，可以参考：
- [GitHub Pages 官方文档](https://docs.github.com/cn/pages)
- [Vercel 官方文档](https://vercel.com/docs)
- [Netlify 官方文档](https://docs.netlify.com/)