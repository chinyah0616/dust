// 配置
const ADMIN_PASSWORD = 'df90qh32rf9';
const JSONBIN_CONFIG = {
    binId: '68ea90cdae596e708f0eb402', // 替换为您的JSONBin ID
    apiKey: '$2a$10$jm/VPb/omDLo8u4selSVL.VShILiV2Y2q5SZSDfB9yn3F5b6sgjT6', // 替换为您的API密钥
    apiUrl: 'https://api.jsonbin.io/v3/b/'
};

// 奖励等级列表
const REWARD_CATEGORIES = ['参与奖', '铜质奖励', '银质奖励', '金质奖励', '星钻奖励'];

// 全局变量
let codesData = [];
let isLoggedIn = false;

// DOM元素
const loginScreen = document.getElementById('loginScreen');
const adminScreen = document.getElementById('adminScreen');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const addCodeBtn = document.getElementById('addCodeBtn');
const batchAddBtn = document.getElementById('batchAddBtn');
const deleteUsedBtn = document.getElementById('deleteUsedBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const refreshBtn = document.getElementById('refreshBtn');
const addCodeForm = document.getElementById('addCodeForm');
const batchAddForm = document.getElementById('batchAddForm');
const codeInput = document.getElementById('codeInput');
const levelSelect = document.getElementById('levelSelect');
const batchLevelSelect = document.getElementById('batchLevelSelect');
const batchCodesInput = document.getElementById('batchCodesInput');
const saveCodeBtn = document.getElementById('saveCodeBtn');
const saveBatchBtn = document.getElementById('saveBatchBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const cancelBatchBtn = document.getElementById('cancelBatchBtn');
const filterLevel = document.getElementById('filterLevel');
const filterStatus = document.getElementById('filterStatus');
const codesTableBody = document.getElementById('codesTableBody');
const totalCodesDisplay = document.getElementById('totalCodes');
const usedCodesDisplay = document.getElementById('usedCodes');
const unusedCodesDisplay = document.getElementById('unusedCodes');

// 登录功能
function login() {
    const password = passwordInput.value;
    
    if (password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        loginScreen.style.display = 'none';
        adminScreen.style.display = 'block';
        passwordInput.value = '';
        loginError.textContent = '';
        loadCodes();
    } else {
        loginError.textContent = '密码错误，请重试';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// 登出功能
function logout() {
    isLoggedIn = false;
    loginScreen.style.display = 'flex';
    adminScreen.style.display = 'none';
    passwordInput.value = '';
}

// 从JSONBin加载兑换码
async function loadCodes() {
    try {
        const response = await fetch(`${JSONBIN_CONFIG.apiUrl}${JSONBIN_CONFIG.binId}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch codes');
        }
        
        const data = await response.json();
        codesData = data.record.codes || [];
        
        updateStats();
        updateCategoryStats();
        renderCodes();
        
    } catch (error) {
        console.error('Error loading codes:', error);
        alert('加载兑换码失败，请检查网络连接');
        codesData = [];
        updateStats();
        updateCategoryStats();
        renderCodes();
    }
}

// 保存兑换码到JSONBin
async function saveCodes() {
    try {
        const response = await fetch(`${JSONBIN_CONFIG.apiUrl}${JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            },
            body: JSON.stringify({ codes: codesData })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save codes');
        }
        
        return true;
    } catch (error) {
        console.error('Error saving codes:', error);
        alert('保存失败，请重试');
        return false;
    }
}

// 更新总体统计信息
function updateStats() {
    const total = codesData.length;
    const used = codesData.filter(code => code.used).length;
    const unused = total - used;
    
    totalCodesDisplay.textContent = total;
    usedCodesDisplay.textContent = used;
    unusedCodesDisplay.textContent = unused;
}

// 更新分类统计信息
function updateCategoryStats() {
    REWARD_CATEGORIES.forEach(category => {
        const categoryData = codesData.filter(code => code.level === category);
        const total = categoryData.length;
        const used = categoryData.filter(code => code.used).length;
        const available = total - used;
        
        // 更新显示
        const totalElement = document.getElementById(`total-${category}`);
        const usedElement = document.getElementById(`used-${category}`);
        const availableElement = document.getElementById(`available-${category}`);
        const progressElement = document.getElementById(`progress-${category}`);
        
        if (totalElement) totalElement.textContent = total;
        if (usedElement) usedElement.textContent = used;
        if (availableElement) availableElement.textContent = available;
        
        // 更新进度条
        if (progressElement) {
            const percentage = total > 0 ? (used / total) * 100 : 0;
            progressElement.style.width = `${percentage}%`;
        }
    });
}

// 渲染兑换码列表
function renderCodes() {
    // 应用过滤器
    let filteredCodes = [...codesData];
    
    // 按等级过滤
    if (filterLevel.value !== 'all') {
        filteredCodes = filteredCodes.filter(code => code.level === filterLevel.value);
    }
    
    // 按状态过滤
    if (filterStatus.value === 'used') {
        filteredCodes = filteredCodes.filter(code => code.used);
    } else if (filterStatus.value === 'unused') {
        filteredCodes = filteredCodes.filter(code => !code.used);
    }
    
    // 清空表格
    codesTableBody.innerHTML = '';
    
    // 如果没有数据
    if (filteredCodes.length === 0) {
        codesTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                    暂无兑换码
                </td>
            </tr>
        `;
        return;
    }
    
    // 渲染每个兑换码
    filteredCodes.forEach(code => {
        const row = document.createElement('tr');
        
        const statusBadge = code.used 
            ? '<span class="status-badge used">已使用</span>'
            : '<span class="status-badge unused">未使用</span>';
        
        const usedTime = code.usedAt 
            ? new Date(code.usedAt).toLocaleString('zh-CN')
            : '-';
        
        row.innerHTML = `
            <td style="font-family: monospace;">${code.code}</td>
            <td>${code.level}</td>
            <td>${statusBadge}</td>
            <td>${usedTime}</td>
            <td>
                <button class="delete-btn" onclick="deleteCode('${code.id}')">删除</button>
            </td>
        `;
        
        codesTableBody.appendChild(row);
    });
}

// 显示添加兑换码表单
function showAddCodeForm() {
    addCodeForm.style.display = 'block';
    batchAddForm.style.display = 'none';
    codeInput.value = '';
    codeInput.focus();
}

// 显示批量添加表单
function showBatchAddForm() {
    batchAddForm.style.display = 'block';
    addCodeForm.style.display = 'none';
    batchCodesInput.value = '';
}

// 隐藏添加兑换码表单
function hideAddCodeForm() {
    addCodeForm.style.display = 'none';
    codeInput.value = '';
}

// 隐藏批量添加表单
function hideBatchAddForm() {
    batchAddForm.style.display = 'none';
    batchCodesInput.value = '';
}

// 添加新兑换码
async function addCode() {
    const code = codeInput.value.trim();
    const level = levelSelect.value;
    
    if (!code) {
        alert('请输入兑换码');
        codeInput.focus();
        return;
    }
    
    // 检查兑换码是否已存在
    if (codesData.some(c => c.code === code)) {
        alert('该兑换码已存在');
        codeInput.focus();
        return;
    }
    
    // 创建新兑换码对象
    const newCode = {
        id: generateId(),
        code: code,
        level: level,
        used: false,
        createdAt: new Date().toISOString(),
        usedAt: null
    };
    
    // 添加到数组
    codesData.push(newCode);
    
    // 保存到JSONBin
    const saved = await saveCodes();
    
    if (saved) {
        updateStats();
        updateCategoryStats();
        renderCodes();
        hideAddCodeForm();
        alert('兑换码添加成功');
    } else {
        // 如果保存失败，从数组中移除
        codesData.pop();
    }
}

// 批量添加兑换码
async function batchAddCodes() {
    const text = batchCodesInput.value.trim();
    const lines = text.split('\n').filter(line => line.trim());
    const level = batchLevelSelect.value;
    
    if (lines.length === 0) {
        alert('请输入兑换码');
        return;
    }
    
    // 获取现有兑换码列表
    const existingCodes = codesData.map(c => c.code);
    const newCodes = [];
    let skippedCount = 0;
    
    // 处理每个兑换码
    lines.forEach(line => {
        const code = line.trim();
        if (code && !existingCodes.includes(code)) {
            newCodes.push({
                id: generateId(),
                code: code,
                level: level,
                used: false,
                createdAt: new Date().toISOString(),
                usedAt: null
            });
            existingCodes.push(code); // 添加到临时列表，避免批量中的重复
        } else if (code && existingCodes.includes(code)) {
            skippedCount++;
        }
    });
    
    if (newCodes.length === 0) {
        alert('没有新的兑换码可以添加（全部重复）');
        return;
    }
    
    // 添加到数组
    codesData.push(...newCodes);
    
    // 保存到JSONBin
    const saved = await saveCodes();
    
    if (saved) {
        updateStats();
        updateCategoryStats();
        renderCodes();
        hideBatchAddForm();
        
        let message = `成功添加 ${newCodes.length} 个兑换码`;
        if (skippedCount > 0) {
            message += `\n跳过 ${skippedCount} 个重复兑换码`;
        }
        alert(message);
    } else {
        // 如果保存失败，从数组中移除
        codesData.splice(codesData.length - newCodes.length, newCodes.length);
    }
}

// 删除单个兑换码
async function deleteCode(id) {
    if (!confirm('确定要删除这个兑换码吗？')) {
        return;
    }
    
    // 找到并删除
    const index = codesData.findIndex(code => code.id === id);
    if (index === -1) return;
    
    const deletedCode = codesData.splice(index, 1)[0];
    
    // 保存到JSONBin
    const saved = await saveCodes();
    
    if (saved) {
        updateStats();
        updateCategoryStats();
        renderCodes();
        alert('兑换码已删除');
    } else {
        // 如果保存失败，恢复删除的项
        codesData.splice(index, 0, deletedCode);
    }
}

// 删除所有已使用的兑换码
async function deleteUsedCodes() {
    const usedCount = codesData.filter(code => code.used).length;
    
    if (usedCount === 0) {
        alert('没有已使用的兑换码');
        return;
    }
    
    if (!confirm(`确定要删除所有已使用的兑换码吗？\n将删除 ${usedCount} 个兑换码`)) {
        return;
    }
    
    // 备份当前数据
    const backup = [...codesData];
    
    // 过滤掉已使用的
    codesData = codesData.filter(code => !code.used);
    
    // 保存到JSONBin
    const saved = await saveCodes();
    
    if (saved) {
        updateStats();
        updateCategoryStats();
        renderCodes();
        alert(`成功删除 ${usedCount} 个已使用的兑换码`);
    } else {
        // 如果保存失败，恢复数据
        codesData = backup;
    }
}

// 清空所有兑换码
async function clearAllCodes() {
    if (codesData.length === 0) {
        alert('兑换码列表已经是空的');
        return;
    }
    
    if (!confirm(`⚠️ 危险操作！\n\n确定要清空所有兑换码吗？\n将删除 ${codesData.length} 个兑换码\n\n此操作不可恢复！`)) {
        return;
    }
    
    // 二次确认
    if (!confirm('请再次确认：真的要清空所有兑换码吗？')) {
        return;
    }
    
    // 备份当前数据
    const backup = [...codesData];
    
    // 清空数组
    codesData = [];
    
    // 保存到JSONBin
    const saved = await saveCodes();
    
    if (saved) {
        updateStats();
        updateCategoryStats();
        renderCodes();
        alert('所有兑换码已清空');
    } else {
        // 如果保存失败，恢复数据
        codesData = backup;
    }
}

// 生成唯一ID
function generateId() {
    return 'code_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 刷新列表
async function refreshList() {
    refreshBtn.textContent = '刷新中...';
    refreshBtn.disabled = true;
    
    await loadCodes();
    
    refreshBtn.textContent = '刷新列表';
    refreshBtn.disabled = false;
}

// 初始化事件监听器
function initEventListeners() {
    // 登录
    loginBtn.addEventListener('click', login);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    
    // 登出
    logoutBtn.addEventListener('click', logout);
    
    // 兑换码操作
    addCodeBtn.addEventListener('click', showAddCodeForm);
    batchAddBtn.addEventListener('click', showBatchAddForm);
    saveCodeBtn.addEventListener('click', addCode);
    saveBatchBtn.addEventListener('click', batchAddCodes);
    cancelAddBtn.addEventListener('click', hideAddCodeForm);
    cancelBatchBtn.addEventListener('click', hideBatchAddForm);
    deleteUsedBtn.addEventListener('click', deleteUsedCodes);
    clearAllBtn.addEventListener('click', clearAllCodes);
    refreshBtn.addEventListener('click', refreshList);
    
    // 过滤器
    filterLevel.addEventListener('change', renderCodes);
    filterStatus.addEventListener('change', renderCodes);
    
    // 禁用右键菜单
    document.addEventListener('contextmenu', e => e.preventDefault());
}

// 初始化
function init() {
    initEventListeners();
    
    // 自动聚焦密码输入框
    passwordInput.focus();
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);

// 将删除函数暴露到全局作用域（供表格中的按钮调用）
window.deleteCode = deleteCode;
