// 文章数据结构定义
let articles = [
    {
        id: 1,
        title: "第一次完成半马的感悟",
        date: "2025-11-23",
        category: "比赛感悟",
        content: "今天完成了人生中的第一个半程马拉松，虽然过程很艰难，但是当冲过终点线的那一刻，所有的疲惫都值得了。跑步不仅是对身体的挑战，更是对意志力的考验。这次经历让我明白，只要坚持，没有什么是不可能的。"
    },
    {
        id: 2,
        title: "如何科学安排跑步训练",
        date: "2025-11-15",
        category: "训练日志",
        content: "科学的训练计划对于提高跑步成绩至关重要。每周应该包含不同强度的训练：间歇跑、长距离慢跑、节奏跑和恢复跑。此外，力量训练和拉伸也不可忽视，可以有效预防受伤。"
    },
    {
        id: 3,
        title: "我的跑步装备选择",
        date: "2025-11-08",
        category: "装备评测",
        content: "选择合适的跑步装备可以大大提升跑步体验。跑鞋要根据自己的脚型和跑步方式选择，运动服要透气排汗。我最近入手的新跑鞋，缓震效果非常好，长距离跑步也不会感到膝盖不适。"
    },
    {
        id: 4,
        title: "跑步对心理健康的影响",
        date: "2025-11-01",
        category: "跑步心得",
        content: "跑步不仅能锻炼身体，还能改善心理健康。每次跑步时，我都会感到压力得到释放，心情变得愉悦。研究表明，跑步可以促进内啡肽的分泌，有助于缓解焦虑和抑郁情绪。"
    }
];

// 全局状态
let sortAscending = false; // 默认按日期倒序（最新发布）

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 从本地存储加载数据
    loadFromLocalStorage();
    
    // 渲染文章列表
    renderArticles();
    
    // 添加事件监听器
    setupEventListeners();
});

// 从本地存储加载数据
function loadFromLocalStorage() {
    const savedArticles = localStorage.getItem('runningArticles');
    if (savedArticles) {
        articles = JSON.parse(savedArticles);
    }
}

// 保存数据到本地存储
function saveToLocalStorage() {
    localStorage.setItem('runningArticles', JSON.stringify(articles));
}

// 渲染文章列表
function renderArticles() {
    const container = document.getElementById('articlesGrid');
    container.innerHTML = '';
    
    // 筛选和排序文章
    let filteredArticles = filterArticles();
    let sortedArticles = sortArticles(filteredArticles);
    
    sortedArticles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.dataset.id = article.id;
        
        // 创建文章摘要
        const excerpt = article.content.length > 150 ? 
            article.content.substring(0, 150) + '...' : 
            article.content;
        
        card.innerHTML = `
            <div class="article-meta">
                <span class="article-date">${article.date}</span>
                <span class="article-category">${article.category}</span>
            </div>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-excerpt">${excerpt}</p>
            <span class="article-read-more">阅读更多 →</span>
        `;
        
        // 添加点击事件，打开文章详情
        card.addEventListener('click', () => {
            openArticleDetail(article.id);
        });
        
        container.appendChild(card);
    });
}

// 筛选文章
function filterArticles() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    if (categoryFilter === 'all') {
        return articles;
    }
    
    return articles.filter(article => article.category === categoryFilter);
}

// 排序文章
function sortArticles(articlesToSort) {
    return [...articlesToSort].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortAscending ? dateA - dateB : dateB - dateA;
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 分类筛选
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.addEventListener('change', renderArticles);
    
    // 排序按钮
    const sortButton = document.getElementById('sortButton');
    const sortIcon = sortButton.querySelector('.sort-icon');
    const sortText = sortButton.querySelector('span:first-child');
    
    sortButton.addEventListener('click', () => {
        sortAscending = !sortAscending;
        
        // 更新按钮文本和图标
        if (sortAscending) {
            sortText.textContent = '最早发布';
            sortIcon.textContent = '▲';
        } else {
            sortText.textContent = '最新发布';
            sortIcon.textContent = '▼';
        }
        
        renderArticles();
    });
    
    // 写感悟按钮
    const addArticleBtn = document.getElementById('addArticleBtn');
    addArticleBtn.addEventListener('click', () => {
        openAddArticleModal();
    });
    
    // 添加文章模态框事件
    setupAddArticleModalEvents();
    
    // 编辑文章模态框事件
    setupEditArticleModalEvents();
    
    // 文章详情模态框事件
    setupArticleDetailModalEvents();
}

// 设置添加文章模态框事件
function setupAddArticleModalEvents() {
    const modal = document.getElementById('addArticleModal');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = document.getElementById('addArticleForm');
    
    // 关闭模态框
    function closeModal() {
        modal.classList.remove('show');
        form.reset();
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 表单提交
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addNewArticle();
        closeModal();
    });
}

// 设置编辑文章模态框事件
function setupEditArticleModalEvents() {
    const modal = document.getElementById('editArticleModal');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = document.getElementById('editArticleForm');
    
    // 关闭模态框
    function closeModal() {
        modal.classList.remove('show');
        form.reset();
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 表单提交
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        updateArticle();
        closeModal();
    });
}

// 更新文章
function updateArticle() {
    const form = document.getElementById('editArticleForm');
    const formData = new FormData(form);
    const articleId = parseInt(formData.get('editArticleId'));
    
    // 找到要更新的文章
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    // 更新文章数据
    article.title = formData.get('editArticleTitle');
    article.date = formData.get('editArticleDate');
    article.category = formData.get('editArticleCategory');
    article.content = formData.get('editArticleContent');
    
    // 保存到本地存储
    saveToLocalStorage();
    
    // 更新文章列表
    renderArticles();
}

// 设置文章详情模态框事件
function setupArticleDetailModalEvents() {
    const modal = document.getElementById('articleDetailModal');
    const closeBtn = modal.querySelector('.close-btn');
    
    // 关闭模态框
    function closeModal() {
        modal.classList.remove('show');
    }
    
    closeBtn.addEventListener('click', closeModal);
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// 打开添加文章模态框
function openAddArticleModal() {
    const modal = document.getElementById('addArticleModal');
    modal.classList.add('show');
    
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('articleDate').value = today;
}

// 打开文章详情模态框
function openArticleDetail(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    const modal = document.getElementById('articleDetailModal');
    const titleEl = document.getElementById('detailTitle');
    const detailEl = document.getElementById('articleDetail');
    
    // 更新模态框内容
    titleEl.textContent = article.title;
    detailEl.innerHTML = `
        <div class="article-detail-meta">
            <span class="article-detail-date">${article.date}</span>
            <span class="article-detail-category">${article.category}</span>
        </div>
        <div class="article-detail-content">
            ${article.content.replace(/\n/g, '<br>')}
        </div>
        <div class="article-actions">
            <button class="edit-btn" onclick="openEditArticleModal(${article.id})">
                ✏️ 编辑
            </button>
            <button class="delete-btn" onclick="deleteArticle(${article.id})">
                🗑️ 删除
            </button>
        </div>
    `;
    
    modal.classList.add('show');
}

// 打开编辑文章模态框
function openEditArticleModal(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    const modal = document.getElementById('editArticleModal');
    
    // 填充表单数据
    document.getElementById('editArticleId').value = article.id;
    document.getElementById('editArticleTitle').value = article.title;
    document.getElementById('editArticleDate').value = article.date;
    document.getElementById('editArticleCategory').value = article.category;
    document.getElementById('editArticleContent').value = article.content;
    
    modal.classList.add('show');
    
    // 关闭文章详情模态框
    document.getElementById('articleDetailModal').classList.remove('show');
}

// 删除文章
function deleteArticle(articleId) {
    if (confirm('确定要删除这篇文章吗？')) {
        const index = articles.findIndex(a => a.id === articleId);
        if (index !== -1) {
            articles.splice(index, 1);
            saveToLocalStorage();
            renderArticles();
            
            // 关闭文章详情模态框
            document.getElementById('articleDetailModal').classList.remove('show');
        }
    }
}

// 添加新文章
function addNewArticle() {
    const form = document.getElementById('addArticleForm');
    const formData = new FormData(form);
    
    // 创建新文章对象
    const newArticle = {
        id: Date.now(), // 使用时间戳作为唯一ID
        title: formData.get('articleTitle'),
        date: formData.get('articleDate'),
        category: formData.get('articleCategory'),
        content: formData.get('articleContent')
    };
    
    // 添加到文章数组
    articles.unshift(newArticle);
    
    // 保存到本地存储
    saveToLocalStorage();
    
    // 更新文章列表
    renderArticles();
}