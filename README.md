# HN-Mapper

中俄测井电缆型号映射工具。

这是一个基于 React + Vite 的前端原型，用统一的 `S1-S27` 参数空间对中国和俄罗斯测井电缆进行解析、筛选、对侧匹配和推理补全。

## 当前能力

- 中国型号名解析：`parseChinese()`
- 俄罗斯型号名解析：`parseRussian()`
- 统一参数空间：`S1-S27`
- 手动 S 参数筛选
- 直接匹配 / 推理匹配区分展示
- 悬停 2 秒查看完整参数卡片
- 部分高置信推理链
  - `S5 -> S15`
  - `S5 + S6 -> S19`
  - `S5 + S6 -> S20`
  - `S2 + S3 -> S21`
  - `S2 + S3 + S4 + S6 + S10 + S11 -> S12`
  - `S12 -> S17`
  - `S11 + S12 + S14 -> S18`
  - `S12 + S14 -> S11`
  - `S15 -> S5`

## 快速开始

要求：

- Node.js 18+

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建：

```bash
npm run build
```

## 目录说明

```text
src/
  CableMapper.jsx          主界面与核心推理逻辑
  data/
    s-schema.json          S1-S27 字段定义
    cn-products.json       中国产品数据
    ru-products.json       俄罗斯产品数据
docs/
  data-framework.md        数据框架与推理设计说明
scripts/
  *.py                     数据整理脚本
  data/                    脚本辅助输入/中间数据
```

## 数据公开策略

本仓库公开的是整理后的 JSON 产品数据与代码。

不公开内容包括：

- 中国电缆原始 Excel 资料
- 本地参考 PDF
- 本地开发环境与构建产物

对应忽略规则见 [`.gitignore`](./.gitignore)。

## 设计文档

详细数据框架、S 参数分类、推理链和交互规范见：

- [`docs/data-framework.md`](./docs/data-framework.md)

## 现状说明

当前仓库是前端原型，不是独立后端服务。产品数据会随前端构建进入浏览器端，因此“GitHub 不公开”不等于“运行时对访问者不可见”。

如果后续需要隐藏部分数据，应将敏感数据迁移到后端接口。
