# 我们不能失去大肥鱼

[在线播放](https://ludeng1966.github.io/we-cannot-lose-dafeiyu/) · [下载素材工程包](https://github.com/ludeng1966/we-cannot-lose-dafeiyu/releases/tag/v1.0.0)

在线播放版为 1920 × 1080、60 fps，时长 41 分 36 秒。仓库里的 `project/` 是分层播放工程，包含片头、正片、字幕、配音与配乐时间轴和动画渲染代码。下载的素材包包含这些代码及播放所需的音频、视频、图片、字体和角色素材。

## 在本地运行工程

1. 下载 Release 的 `project-assets.zip`，完整解压到一个文件夹。
2. 在解压目录运行 `python serve.py`，需要 Python 3.9 或以上。Windows 若使用 Python Launcher，可以运行 `py serve.py`。
3. 用 Chrome 或 Edge 打开 [从片头播放](http://127.0.0.1:8760/) 或 [正片播放器](http://127.0.0.1:8760/feature-index-v4.html)。点击播放后即可启用浏览器音频。

`project/feature-narration-refresh.json` 记录配音单元，`project/feature-music-cues.json` 记录配乐入点和淡变。工程使用网页脚本渲染，修改后可直接刷新预览。第三方音乐、影像、字体及角色素材的署名见片尾与工程内的来源记录，各素材权利归相应权利人。
