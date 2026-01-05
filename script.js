// SQLite数据库实例
let db;

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

// 赛事数据结构定义
let events = [];

// 全局状态
let sortAscending = false; // 默认按日期倒序（最新发布）

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化SQLite数据库
    await initDatabase();
    
    // 从SQLite数据库加载数据
    await loadFromDatabase();
    
    // 渲染文章列表
    renderArticles();
    
    // 渲染赛事列表
    renderEvents();
    
    // 添加事件监听器
    setupEventListeners();
});

// 初始化SQLite数据库
async function initDatabase() {
    try {
        // 加载SQL.js库
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
        
        // 尝试从IndexedDB加载数据库
        const dbBuffer = await loadDatabaseFromIndexedDB();
        
        // 创建或打开数据库
        if (dbBuffer) {
            // 使用已存在的数据库
            db = new SQL.Database(new Uint8Array(dbBuffer));
        } else {
            // 创建新数据库
            db = new SQL.Database();
            
            // 创建文章表
            db.run(`
                CREATE TABLE IF NOT EXISTS articles (
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL,
                    date TEXT NOT NULL,
                    category TEXT NOT NULL,
                    content TEXT NOT NULL
                );
            `);
            
            // 创建赛事表
            db.run(`
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    date TEXT NOT NULL,
                    distance REAL NOT NULL,
                    location TEXT NOT NULL,
                    finishTime TEXT NOT NULL,
                    category TEXT NOT NULL,
                    notes TEXT
                );
            `);
        }
        
        console.log('SQLite数据库初始化成功');
    } catch (error) {
        console.error('SQLite数据库初始化失败:', error);
    }
}

// 从IndexedDB加载数据库
async function loadDatabaseFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('RunningArticlesDB', 1);
        
        request.onerror = () => reject(new Error('无法打开IndexedDB'));
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['database'], 'readonly');
            const store = transaction.objectStore('database');
            const getRequest = store.get('articles');
            
            getRequest.onsuccess = () => {
                resolve(getRequest.result ? getRequest.result.data : null);
            };
            
            getRequest.onerror = () => reject(new Error('无法从IndexedDB加载数据库'));
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('database')) {
                db.createObjectStore('database');
            }
        };
    });
}

// 将数据库保存到IndexedDB
async function saveDatabaseToIndexedDB() {
    return new Promise((resolve, reject) => {
        const dbBuffer = db.export();
        
        const request = indexedDB.open('RunningArticlesDB', 1);
        
        request.onerror = () => reject(new Error('无法打开IndexedDB'));
        
        request.onsuccess = (event) => {
            const idb = event.target.result;
            const transaction = idb.transaction(['database'], 'readwrite');
            const store = transaction.objectStore('database');
            
            store.put({ data: dbBuffer }, 'articles');
            
            transaction.oncomplete = () => {
                resolve();
                console.log('数据库已保存到IndexedDB');
            };
            
            transaction.onerror = () => reject(new Error('无法将数据库保存到IndexedDB'));
        };
    });
}

// 从SQLite数据库加载数据
async function loadFromDatabase() {
    try {
        // 加载文章数据
        const articlesResult = db.exec(`SELECT * FROM articles ORDER BY date DESC`);
        
        if (articlesResult && articlesResult.length > 0) {
            const rows = articlesResult[0].values;
            const columns = articlesResult[0].columns;
            
            articles = rows.map(row => {
                const article = {};
                columns.forEach((column, index) => {
                    article[column] = row[index];
                });
                return article;
            });
        } else {
            // 如果数据库为空，使用初始数据并保存到数据库
            articles.forEach(article => {
                db.run(
                    `INSERT OR REPLACE INTO articles (id, title, date, category, content) VALUES (?, ?, ?, ?, ?)`,
                    [article.id, article.title, article.date, article.category, article.content]
                );
            });
        }
        
        // 加载赛事数据
        const eventsResult = db.exec(`SELECT * FROM events ORDER BY date DESC`);
        
        if (eventsResult && eventsResult.length > 0) {
            const rows = eventsResult[0].values;
            const columns = eventsResult[0].columns;
            
            events = rows.map(row => {
                const event = {};
                columns.forEach((column, index) => {
                    event[column] = row[index];
                });
                return event;
            });
        }
        
        console.log('从SQLite数据库加载数据成功');
    } catch (error) {
        console.error('从SQLite数据库加载数据失败:', error);
    }
}

// 保存数据到SQLite数据库
async function saveToDatabase() {
    try {
        // 先清空数据库中的所有数据
        db.run(`DELETE FROM articles`);
        db.run(`DELETE FROM events`);
        
        // 将所有文章保存到数据库
        articles.forEach(article => {
            db.run(
                `INSERT INTO articles (id, title, date, category, content) VALUES (?, ?, ?, ?, ?)`,
                [article.id, article.title, article.date, article.category, article.content]
            );
        });
        
        // 将所有赛事保存到数据库
        events.forEach(event => {
            db.run(
                `INSERT INTO events (id, name, date, distance, location, finishTime, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [event.id, event.name, event.date, event.distance, event.location, event.finishTime, event.category, event.notes]
            );
        });
        
        // 将数据库保存到IndexedDB进行持久化
        await saveDatabaseToIndexedDB();
        
        console.log('数据保存到SQLite数据库和IndexedDB成功');
    } catch (error) {
        console.error('数据保存失败:', error);
    }
}

// 导出数据到JSON文件（包含文章和赛事）
function exportArticles() {
    const data = {
        articles: articles,
        events: events
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `running_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// 导入数据（支持文章和赛事）
function importArticles(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // 验证导入的数据格式
            if (importedData.articles || importedData.events) {
                let importedCount = 0;
                
                // 导入文章数据
                if (Array.isArray(importedData.articles)) {
                    const existingArticleIds = new Set(articles.map(a => a.id));
                    const newArticles = importedData.articles.map(article => {
                        if (existingArticleIds.has(article.id)) {
                            return { ...article, id: Date.now() + Math.random() };
                        }
                        return article;
                    });
                    
                    articles = [...articles, ...newArticles];
                    importedCount += newArticles.length;
                }
                
                // 导入赛事数据
                if (Array.isArray(importedData.events)) {
                    const existingEventIds = new Set(events.map(e => e.id));
                    const newEvents = importedData.events.map(event => {
                        if (existingEventIds.has(event.id)) {
                            return { ...event, id: Date.now() + Math.random() };
                        }
                        return event;
                    });
                    
                    events = [...events, ...newEvents];
                    importedCount += newEvents.length;
                }
                
                // 保存到SQLite数据库
                await saveToDatabase();
                
                // 更新文章和赛事列表
                renderArticles();
                renderEvents();
                
                alert(`数据导入成功！共导入 ${importedCount} 条记录。`);
            } else if (Array.isArray(importedData)) {
                // 兼容旧的仅文章的导入格式
                const existingIds = new Set(articles.map(a => a.id));
                const newArticles = importedData.map(article => {
                    if (existingIds.has(article.id)) {
                        return { ...article, id: Date.now() + Math.random() };
                    }
                    return article;
                });
                
                articles = [...articles, ...newArticles];
                await saveToDatabase();
                renderArticles();
                
                alert(`文章数据导入成功！共导入 ${newArticles.length} 篇文章。`);
            } else {
                alert('导入失败：文件格式不正确！');
            }
        } catch (error) {
            alert('导入失败：文件解析错误！');
        }
    };
    
    reader.readAsText(file);
    
    // 重置文件输入
    event.target.value = '';
}

// 从Excel文件导入赛事记录
function importEventsFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            // 解析Excel文件
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 假设赛事数据在第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 将Excel数据转换为JSON
            const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 检查表头
            if (!excelData || excelData.length < 2) {
                alert('导入失败：Excel文件格式不正确，没有足够的数据行！');
                return;
            }
            
            // 定义表头映射（假设Excel表头是中文）
            const headerRow = excelData[0];
            const headerMap = {};
            
            // 查找对应的表头列
            headerRow.forEach((header, index) => {
                const headerStr = header.toString().trim();
                if (headerStr.includes('赛事名称') || headerStr.includes('名称')) {
                    headerMap.name = index;
                } else if (headerStr.includes('日期')) {
                    headerMap.date = index;
                } else if (headerStr.includes('类型') || headerStr.includes('分类')) {
                    headerMap.category = index;
                } else if (headerStr.includes('成绩') || headerStr.includes('完成时间') || headerStr.includes('时间')) {
                    headerMap.finishTime = index;
                } else if (headerStr.includes('备注') || headerStr.includes('说明')) {
                    headerMap.notes = index;
                } else if (headerStr.includes('地点') || headerStr.includes('位置')) {
                    headerMap.location = index;
                }
            });
            
            // 验证是否找到必要的字段
            if (!headerMap.name || !headerMap.date || !headerMap.finishTime) {
                alert('导入失败：Excel文件缺少必要的字段（赛事名称、日期、成绩）！');
                return;
            }
            
            // 处理数据行
            const newEvents = [];
            const existingEventIds = new Set(events.map(e => e.id));
            
            for (let i = 1; i < excelData.length; i++) {
                const row = excelData[i];
                if (!row || !row[headerMap.name]) continue; // 跳过空行
                
                // 创建新赛事对象
                const category = row[headerMap.category]?.toString().trim() || '其他';
                
                // 根据赛事类型推断距离
                let distance = 0;
                if (category.includes('全马')) distance = 42.195;
                else if (category.includes('半马')) distance = 21.0975;
                else if (category.includes('10公里') || category.includes('10K')) distance = 10;
                else if (category.includes('5公里') || category.includes('5K')) distance = 5;
                
                const newEvent = {
                    id: Date.now() + Math.random(), // 生成新ID
                    name: row[headerMap.name]?.toString().trim() || '',
                    date: row[headerMap.date]?.toString().trim() || '',
                    distance: distance,
                    location: row[headerMap.location]?.toString().trim() || row[headerMap.name]?.toString().trim() || '',
                    finishTime: row[headerMap.finishTime]?.toString().trim() || '',
                    category: category,
                    notes: row[headerMap.notes]?.toString().trim() || ''
                };
                
                // 转换日期格式
                if (newEvent.date) {
                    // 处理点分隔的日期格式（如：2021.04.14）
                    if (newEvent.date.includes('.')) {
                        const [year, month, day] = newEvent.date.split('.');
                        newEvent.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    } 
                    // 处理Excel日期格式（数字）
                    else if (!isNaN(parseFloat(newEvent.date))) {
                        const excelDate = parseFloat(newEvent.date);
                        const date = new Date((excelDate - 25569) * 86400 * 1000);
                        newEvent.date = date.toISOString().split('T')[0];
                    } 
                    // 尝试解析其他日期格式
                    else {
                        const parsedDate = new Date(newEvent.date);
                        if (!isNaN(parsedDate.getTime())) {
                            newEvent.date = parsedDate.toISOString().split('T')[0];
                        } else {
                            // 如果无法解析，使用当前日期
                            newEvent.date = new Date().toISOString().split('T')[0];
                        }
                    }
                } else {
                    // 如果没有日期，使用当前日期
                    newEvent.date = new Date().toISOString().split('T')[0];
                }
                
                newEvents.push(newEvent);
            }
            
            if (newEvents.length === 0) {
                alert('导入失败：没有找到有效的赛事数据！');
                return;
            }
            
            // 将新赛事添加到现有赛事中
            events = [...events, ...newEvents];
            
            // 保存到SQLite数据库
            await saveToDatabase();
            
            // 更新赛事列表
            renderEvents();
            
            alert(`赛事记录导入成功！共导入 ${newEvents.length} 条赛事记录。`);
        } catch (error) {
            console.error('Excel导入失败:', error);
            alert('导入失败：Excel文件解析错误！');
        }
    };
    
    reader.readAsArrayBuffer(file);
    
    // 重置文件输入
    event.target.value = '';
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

// 渲染赛事列表
function renderEvents() {
    const container = document.getElementById('eventsGrid');
    container.innerHTML = '';
    
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.id = event.id;
        
        card.innerHTML = `
            <div class="event-meta">
                <span class="event-date">${event.date}</span>
                <span class="event-category">${event.category}</span>
            </div>
            <h3 class="event-name">${event.name}</h3>
            <div class="event-info">
                <div class="event-distance">🏃 ${event.distance} 公里</div>
                <div class="event-location">📍 ${event.location}</div>
                <div class="event-time">⏱️ ${event.finishTime}</div>
            </div>
            ${event.notes ? `<p class="event-notes">📝 ${event.notes}</p>` : ''}
        `;
        
        // 添加点击事件，打开赛事详情
        card.addEventListener('click', () => {
            openEventDetail(event.id);
        });
        
        container.appendChild(card);
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
    
    // 添加赛事按钮
    const addEventBtn = document.getElementById('addEventBtn');
    addEventBtn.addEventListener('click', () => {
        openAddEventModal();
    });
    
    // 添加文章模态框事件
    setupAddArticleModalEvents();
    
    // 编辑文章模态框事件
    setupEditArticleModalEvents();
    
    // 文章详情模态框事件
    setupArticleDetailModalEvents();
    
    // 添加赛事模态框事件
    setupAddEventModalEvents();
    
    // 编辑赛事模态框事件
    setupEditEventModalEvents();
    
    // 赛事详情模态框事件
    setupEventDetailModalEvents();
    
    // 导入文件事件监听
    const importFileInput = document.getElementById('importFile');
    importFileInput.addEventListener('change', importArticles);
    
    // 导入赛事记录表Excel按钮点击事件
    const importEventExcelBtn = document.getElementById('importEventExcelBtn');
    const importEventExcelFile = document.getElementById('importEventExcelFile');
    importEventExcelBtn.addEventListener('click', () => {
        importEventExcelFile.click();
    });
    
    // 赛事记录表Excel文件导入事件
    importEventExcelFile.addEventListener('change', importEventsFromExcel);
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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addNewArticle();
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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateArticle();
        closeModal();
    });
}

// 更新文章
async function updateArticle() {
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
    
    // 保存到SQLite数据库
    await saveToDatabase();
    
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

// 设置添加赛事模态框事件
function setupAddEventModalEvents() {
    const modal = document.getElementById('addEventModal');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = document.getElementById('addEventForm');
    
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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addNewEvent();
        closeModal();
    });
}

// 设置编辑赛事模态框事件
function setupEditEventModalEvents() {
    const modal = document.getElementById('editEventModal');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = document.getElementById('editEventForm');
    
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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateEvent();
        closeModal();
    });
}

// 设置赛事详情模态框事件
function setupEventDetailModalEvents() {
    const modal = document.getElementById('eventDetailModal');
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
async function deleteArticle(articleId) {
    if (confirm('确定要删除这篇文章吗？')) {
        const index = articles.findIndex(a => a.id === articleId);
        if (index !== -1) {
            articles.splice(index, 1);
            await saveToDatabase();
            renderArticles();
            
            // 关闭文章详情模态框
            document.getElementById('articleDetailModal').classList.remove('show');
        }
    }
}

// 添加新文章
async function addNewArticle() {
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
    
    // 保存到SQLite数据库
    await saveToDatabase();
    
    // 更新文章列表
    renderArticles();
}

// 打开添加赛事模态框
function openAddEventModal() {
    const modal = document.getElementById('addEventModal');
    modal.classList.add('show');
    
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;
}

// 打开赛事详情模态框
function openEventDetail(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.getElementById('eventDetailModal');
    const titleEl = document.getElementById('eventDetailTitle');
    const detailEl = document.getElementById('eventDetail');
    
    // 更新模态框内容
    titleEl.textContent = event.name;
    detailEl.innerHTML = `
        <div class="event-detail-meta">
            <span class="event-detail-date">${event.date}</span>
            <span class="event-detail-category">${event.category}</span>
        </div>
        <div class="event-detail-info">
            <div class="event-detail-distance">🏃 ${event.distance} 公里</div>
            <div class="event-detail-location">📍 ${event.location}</div>
            <div class="event-detail-time">⏱️ ${event.finishTime}</div>
        </div>
        ${event.notes ? `<div class="event-detail-notes"><strong>备注：</strong>${event.notes.replace(/\n/g, '<br>')}</div>` : ''}
        <div class="event-actions">
            <button class="edit-btn" onclick="openEditEventModal(${event.id})">
                ✏️ 编辑
            </button>
            <button class="delete-btn" onclick="deleteEvent(${event.id})">
                🗑️ 删除
            </button>
        </div>
    `;
    
    modal.classList.add('show');
}

// 打开编辑赛事模态框
function openEditEventModal(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.getElementById('editEventModal');
    
    // 填充表单数据
    document.getElementById('editEventId').value = event.id;
    document.getElementById('editEventName').value = event.name;
    document.getElementById('editEventDate').value = event.date;
    document.getElementById('editEventDistance').value = event.distance;
    document.getElementById('editEventLocation').value = event.location;
    document.getElementById('editEventFinishTime').value = event.finishTime;
    document.getElementById('editEventCategory').value = event.category;
    document.getElementById('editEventNotes').value = event.notes;
    
    modal.classList.add('show');
    
    // 关闭赛事详情模态框
    document.getElementById('eventDetailModal').classList.remove('show');
}

// 添加新赛事
async function addNewEvent() {
    const form = document.getElementById('addEventForm');
    const formData = new FormData(form);
    
    // 创建新赛事对象
    const newEvent = {
        id: Date.now(), // 使用时间戳作为唯一ID
        name: formData.get('eventName'),
        date: formData.get('eventDate'),
        distance: parseFloat(formData.get('eventDistance')),
        location: formData.get('eventLocation'),
        finishTime: formData.get('eventFinishTime'),
        category: formData.get('eventCategory'),
        notes: formData.get('eventNotes') || ''
    };
    
    // 添加到赛事数组
    events.unshift(newEvent);
    
    // 保存到SQLite数据库
    await saveToDatabase();
    
    // 更新赛事列表
    renderEvents();
}

// 更新赛事
async function updateEvent() {
    const form = document.getElementById('editEventForm');
    const formData = new FormData(form);
    const eventId = parseInt(formData.get('editEventId'));
    
    // 找到要更新的赛事
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // 更新赛事数据
    event.name = formData.get('editEventName');
    event.date = formData.get('editEventDate');
    event.distance = parseFloat(formData.get('editEventDistance'));
    event.location = formData.get('editEventLocation');
    event.finishTime = formData.get('editEventFinishTime');
    event.category = formData.get('editEventCategory');
    event.notes = formData.get('editEventNotes') || '';
    
    // 保存到SQLite数据库
    await saveToDatabase();
    
    // 更新赛事列表
    renderEvents();
}

// 删除赛事
async function deleteEvent(eventId) {
    if (confirm('确定要删除这条赛事记录吗？')) {
        const index = events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            events.splice(index, 1);
            await saveToDatabase();
            renderEvents();
            
            // 关闭赛事详情模态框
            document.getElementById('eventDetailModal').classList.remove('show');
        }
    }
}