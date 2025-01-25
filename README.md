![Mk.IX-Client](https://socialify.git.ci/123summertime/Mk.IX-Client/image?&name=1&owner=1&pattern=Plus&theme=Dark)

## 介绍
`Mk.IX-Client` 是基于 `Vue3` 构建的即时通讯 (IM) 前端，支持传统功能和 E2E 加密。

后端[Mk.IX-Server](https://github.com/123summertime/Mk.IX-Server)


## 预览
<details>
    <summary>桌面端</summary>
    <div>
        <img src="./photos/desktop_dark.png">
        <img src="./photos/desktop_bright.png">
    </div>
</details>

<details>
    <summary>移动端</summary>
    <img src="./photos/mobile_left_dark.png" style="width: 24%;">
    <img src="./photos/mobile_right_dark.png" style="width: 24%;">
    <img src="./photos/mobile_left_bright.png" style="width: 24%;">
    <img src="./photos/mobile_right_bright.png" style="width: 24%;">
</details>


## 使用

> 保证后端[Mk.IX-Server](https://github.com/123summertime/Mk.IX-Server)正在运行

### 本地预览
1. 下载最新的 [Release](https://github.com/123summertime/Mk.IX-Client/releases)。
2. 启动本地服务器：
   ```bash
   cd dist
   python -m http.server 8080
   ```

### 生产环境

下载最新的[Release](https://github.com/123summertime/Mk.IX-Client/releases)

通过`nginx`部署

<details>
    <summary>nginx配置参考</summary>

    文件夹结构
    /etc/nginx
        |-- conf.d
        |   `-- default.conf
        |-- dist
        |   |-- assets
        |   |   |-- index-34d94241.js
        |   |   `-- index-c5e85733.css
        |   |-- favicon.ico
        |   `-- index.html
        |-- fastcgi_params
        |-- mime.types
        |-- modules -> /usr/lib/nginx/modules
        |-- nginx.conf
        |-- scgi_params
        |-- selfsigned.crt (https所需的证书)
        |-- selfsigned.key (https所需的证书)
        `-- uwsgi_params

    编辑conf.d/default.conf
    # https
    server {
        listen       443 ssl;
        listen  [::]:443 ssl;
        server_name  localhost;

        ssl_certificate /etc/nginx/selfsigned.crt;
        ssl_certificate_key /etc/nginx/selfsigned.key;

        location / {
            root   /etc/nginx/dist;
            try_files $uri /index.html
            index  index.html index.htm;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }

    # http
    server {
        listen       80;
        listen  [::]:80;
        server_name  localhost;

        location / {
            root   /etc/nginx/dist;
            try_files $uri /index.html
            index  index.html index.htm;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
</details>

### 开发环境

``` bash

# 克隆仓库
git clone https://github.com/123summertime/Mk.IX-Client.git

# 进入项目目录
cd Mk.IX-Client

# 安装依赖
npm install

# 启动
npm run dev
```

## 许可

本项目基于 [MIT License](LICENSE) 进行许可。