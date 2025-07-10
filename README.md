# 网页笔记本（Web Notebook）

一个支持网页划词保存、同步、管理和高亮的全平台笔记系统，包含 Node.js 后端、React Web 管理端和 Chrome 浏览器扩展。

---

## 目录结构

```
webnotebook/
  backend/         # Node.js + MySQL 后端服务
  web-admin/       # React Web 管理端
  extension/       # Chrome 浏览器扩展
```

---

## 安装与启动

### 1. 后端服务（backend）
```bash
cd backend
npm install
npm start
```
- 默认监听 http://localhost:3001
- 数据库配置见 `backend/src/utils/db.js`，需提前准备好 MySQL 数据库。

### 2. Web 管理端（web-admin）
```bash
cd web-admin
npm install
npm start
```
- 默认访问 http://localhost:3000
- 支持注册、登录、笔记管理、批量删除、导出、全字段模糊搜索。

### 3. Chrome 扩展（extension）
1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"，选择 `extension/` 目录

---

## 主要功能

- **网页划词保存**：在任意网页选中文本，保存为笔记并高亮下划线。
- **笔记同步**：扩展端与 Web 管理端数据实时同步。
- **全字段搜索**：支持内容、标签、网址模糊搜索，无需前缀。
- **批量管理**：支持批量删除、导出 Excel。
- **高亮恢复**：网页刷新或内容异步加载后，自动恢复下划线高亮。
- **详情查看**：点击列表可查看笔记详情。
- **美观提示**：保存成功、悬停下划线等均有美观提示浮层。

---

## 使用说明

### Web 管理端
- 访问 http://localhost:3000
- 注册/登录后可管理所有笔记，支持搜索、编辑、删除、导出。
- 搜索框直接输入关键词即可全字段模糊搜索。

### Chrome 扩展
- 在网页选中文本，右键或点击扩展图标保存为笔记。
- 扩展弹窗可查看、搜索、分页管理笔记。
- 下划线高亮内容，鼠标悬停显示"已保存"，点击可查看详情。
- 支持全字段模糊搜索。

---

## 常见问题

1. **刷新后下划线消失？**
   - 已集成自动恢复和 DOM 监听，无论页面如何变化，下划线都会自动恢复。

2. **详情页打不开/ERR_BLOCKED_BY_CLIENT？**
   - 请关闭广告拦截插件或将扩展加入白名单。

3. **搜索无效？**
   - 已支持全字段模糊搜索，确保后端服务正常运行。

---

## 开发与维护建议

- 所有前后端接口均有鉴权，需登录后操作。
- 数据库表结构需与 models 代码一致。
- 扩展 manifest.json 已声明 web_accessible_resources，确保详情页可访问。

---

## License

MIT 