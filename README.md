# CFSM Mock

这是一个用于 [CF Server Monitor](https://github.com/huilang-me/CF-Server-Monitor) 项目的演示数据 Worker。

项目通过单个 `index.js` 提供模拟后端接口，可用于快速预览 CF Server Monitor 的服务器列表、详情、历史数据和 WebSocket 更新效果。默认返回 40 台模拟服务器，可通过环境变量调整数量，最多 100 台。

## 部署方式

1. 登录 Cloudflare Dashboard，进入 **Workers & Pages**。
2. 新建一个 Cloudflare Worker。
3. 模板选择 **Hello World**。
4. 创建完成后进入 Worker 的代码编辑页面。
5. 删除默认代码，将本仓库 `index.js` 的完整内容粘贴进去。
6. 保存并部署。
7. 建议为该 Worker 绑定自定义域名，后续在 CF-Server-Monitor 中使用自定义域名作为接口地址。

## 域名绑定建议

虽然可以直接使用 Cloudflare 自动生成的 `workers.dev` 地址，但更建议绑定自己的域名，例如：

```text
https://cfsm-mock.example.com
```

这样国内访问会更方便。

## 环境变量

在 Worker 的 **Settings -> Variables** 中配置以下环境变量：

| 变量名 | 说明 | 示例 |
| --- | --- | --- |
| `NUMS` | 返回的模拟服务器数量，最大 100 | `40` |
| `CORS_ALLOWED_ORIGINS` | 允许访问该 Worker 的前端来源，多个地址用英文逗号分隔 | `https://demo.example.com,https://example.github.io` |

`CORS_ALLOWED_ORIGINS` 需要填写 CF Server Monitor 前端实际访问的 Origin，否则浏览器可能会因为 CORS 限制无法请求接口。

## 调用方式

部署完成后，复制当前 Worker 的 Origin，例如：

```text
https://cfsm-mock.example.workers.dev
```

如果已绑定自定义域名，建议优先使用自定义域名：

```text
https://cfsm-mock.example.com
```

然后在 CF-Server-Monitor 项目的环境变量中配置：

```env
API_BASE=https://cfsm-mock.example.com
```

如果你已经有原项目的 Worker Origin，也可以把当前演示数据 Worker Origin 一并加入 `API_BASE`，按 CF-Server-Monitor 项目的配置格式填写即可。

## 接口

常用接口包括：

- `GET /api/config`
- `GET /api/servers`
- `GET /api/server?id=mock-001`
- `GET /api/history/all?id=mock-001&hours=24`
- `GET /api/ws?subscribe=all`
