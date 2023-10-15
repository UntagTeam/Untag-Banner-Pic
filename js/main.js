console.log("题图生成器 By #UNTAG");

// 禁用 Dropzone 的自动发现功能
Dropzone.autoDiscover = false;

// 1. 当用户上传图片时，将图片作为图标在 SVG 中显示。
// 获取 SVG
const svg = d3.select("#mainSVG > svg");

// 将base64编码的字体数据添加到SVG中
// 读取字体数据
fetch('https://cdn.utgd.net/fonts/SmileySans-Oblique.otf.woff2.txt')
    .then(response => response.text())
    .then(fontData => {
        // 假设你已经有一个SVG选择器
        // 将base64编码的字体数据添加到SVG中
        svg.append("defs")
            .append("style")
            .attr("type", "text/css")
            .html(`
            @font-face {
                font-family: '得意黑';
                src: url(data:font/woff2;base64,${fontData}) format('woff2');
            }
       `);
    });


// 存储已上传的图标数据
let icons = [];
let userInputText = "";

// 设置 SVG 的基本属性
svg.attr('width', '1024')
    .attr('height', '640');

// 创建图标组
const iconGroup = svg.append("g")
    .attr("id", "iconGroup");

// 创建文字组
const textGroup = svg.append("g")
    .attr("id", "textGroup");

// 创建内容组（包含图标组和文字组）
const contentGroup = svg.append("g")
    .attr("id", "contentGroup");

// 创建图标容器组
const iconContainer = iconGroup.append("g")
    .attr("id", "iconContainer");

contentGroup.node().appendChild(iconGroup.node());
contentGroup.node().appendChild(textGroup.node());

// 创建用户文本的初始元素
textGroup.append("text")
    .attr("id", "userText")
    .attr("x", 1024 / 2)
    .attr("text-anchor", "middle");

// 预留一个元素来存放背景图片
const backgroundLayer = svg.insert("g", ":first-child")
    .attr("id", "backgroundLayer");

// 定义滤镜：模糊和阴影
const defs = svg.append("defs");

// 定义渐变
const gradient = defs.append("linearGradient")
    .attr("id", "defaultGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "100%");

gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#5E6B89"); // 左上角的颜色

gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#0F1327"); // 右下角的颜色

// 将默认的渐变背景应用于SVG
backgroundLayer.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "url(#defaultGradient)");

// 定义模糊
const filterBlur = defs.append("filter")
    .attr("id", "blur")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", "100%")
    .attr("height", "100%");
filterBlur.append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", "5");

// 定义阴影
const filterShadow = defs.append("filter")
    .attr("id", "shadow")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");
filterShadow.append("feOffset")
    .attr("result", "offOut")
    .attr("in", "SourceAlpha")
    .attr("dx", "0") // 水平偏移
    .attr("dy", "10"); // 垂直偏移
filterShadow.append("feGaussianBlur")
    .attr("result", "blurOut")
    .attr("in", "offOut")
    .attr("stdDeviation", "20");
filterShadow.append("feBlend")
    .attr("in", "SourceGraphic")
    .attr("in2", "blurOut")
    .attr("mode", "normal");

// 根据图标数量动态调整其样式和位置
// 1 个图标时，所有图标用 iconStyle[0]
// 2 个图标时，所有图标用 iconStyle[1]
// 以此类推
const iconStyles = [
    { size: 200, borderRadius: 50, spacing: 0 },
    { size: 200, borderRadius: 50, spacing: 200 },
    { size: 150, borderRadius: 50, spacing: 100 },
    { size: 150, borderRadius: 50, spacing: 75 }
];

function setBackground(file) {
    // 设置背景
    // console.log("设置背景")
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();

            img.src = e.target.result;
            // 定义 img.onload 事件处理器
            img.onload = function () {
                // 获取图片的原始宽度和高度
                const imgWidth = img.width;
                const imgHeight = img.height;

                // 计算画布和图片的宽高比
                const canvasRatio = 1024 / 640;
                const imgRatio = imgWidth / imgHeight;

                let width, height, x, y;

                // 如果图片的宽高比大于画布的宽高比
                if (imgRatio > canvasRatio) {
                    height = 640;
                    width = imgRatio * height;
                    x = (1024 - width) / 2;
                    y = 0;
                } else {
                    width = 1024;
                    height = width / imgRatio;
                    x = 0;
                    y = (640 - height) / 2;
                }

                // 使用d3更新或插入图像
                const backgroundImage = backgroundLayer.select("#backgroundImage");

                if (backgroundImage.empty()) {
                    backgroundLayer.append("image")
                        .attr("id", "backgroundImage")
                        .attr("xlink:href", e.target.result)
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", width)
                        .attr("height", height)
                        .attr("filter", "url(#blur)");
                } else {
                    backgroundImage
                        .attr("xlink:href", e.target.result)
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", width)
                        .attr("height", height)
                        .attr("filter", "url(#blur)");
                }
                adjustContent();

                // 显示删除按钮
                document.getElementById('removeBackgroundBtn').style.display = 'block';


                // console.log("图片选择完成")
            };
            // 设置 img.src
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// 监听背景图片的上传
document.getElementById('backgroundInput').addEventListener('change', function (event) {
    // console.log("背景图片选择已更改");
    const file = event.target.files[0];
    setBackground(file)
});


// 拖拽上传
// document.addEventListener('DOMContentLoaded', function () {
//     const dropzoneElement = document.querySelector('.dropzone');

//     // 初始化 Dropzone
//     const myDropzone = new Dropzone(dropzoneElement, {
//         url: "#",  // 虽然我们不会实际上传文件，但 Dropzone 仍然需要一个 URL
//         autoProcessQueue: false,  // 禁用自动上传
//         clickable: true,  // 允许点击选择文件
//         previewsContainer: false,  // 禁用预览
//         acceptedFiles: 'image/*',  // 只接受图像文件
//         dictDefaultMessage: ""  // 这行将移除默认消息
//     });

//     myDropzone.on("addedfile", function (file) {
//         setBackground(file)
//     });
// });

// // 监听删除背景图片的按钮
// function removeImage(imageId, inputId, buttonId) {
//     // 使用D3从SVG中删除指定ID的图片或图标
//     const svg = d3.select("#mainSVG > svg");
//     svg.select(`#${imageId}`).remove();

//     // 重置input字段
//     const inputElem = document.getElementById(inputId);
//     if (inputElem) {
//         inputElem.value = '';  // 清除选定的文件
//     }

//     // 隐藏删除按钮
//     const removeBtn = document.getElementById(buttonId);
//     if (removeBtn) {
//         removeBtn.style.display = 'none';
//     }
// }


// 根据图标数量动态调整其样式和位置
function drawIcons() {
    // 清空图标容器
    iconContainer.selectAll("*").remove();

    // 清除与图标相关的所有 clipPath
    defs.selectAll("clipPath[id^='iconClip']").remove();

    // 获取当前图标数量
    const currentIconCount = icons.length;

    // 根据图标数量选择样式
    const style = icons.length > 0 ? iconStyles[Math.min(icons.length, 4) - 1] : { size: 0, borderRadius: 0, spacing: 0 };

    // 计算图标的总宽度
    const totalWidth = style.size * currentIconCount + style.spacing * Math.max(0, currentIconCount - 1);

    // 计算第一个图标的 x 坐标
    const xOffset = (1024 - totalWidth) / 2;

    icons.forEach((icon, idx) => {

        const x = xOffset + idx * (style.size + style.spacing);

        // 计算圆角大小，随着图标尺寸的变化而变化
        const borderRadius = (style.size / 2) * (style.borderRadius / 100);

        // 创建一个clipPath，定义圆角的裁剪区域
        const clipPath = defs.append("clipPath")
            .attr("id", `iconClip${idx}`); // 使用不同的id以避免冲突

        // 向clipPath中添加圆角矩形
        clipPath.append("rect")
            .attr("width", style.size)
            .attr("height", style.size)
            .attr("rx", borderRadius)
            .attr("ry", borderRadius)

        // 创建图标的容器组
        const iconGroup = iconContainer.append("g")
            .attr("transform", `translate(${x}, 0)`);

        // 添加用于生成阴影的圆角矩形
        iconGroup.append("rect")
            .attr("width", style.size)
            .attr("height", style.size)
            .attr("rx", borderRadius)
            .attr("ry", borderRadius)
            .attr("fill", "#373737")  // 在不规则图标外围，添加底色
            .attr("filter", "url(#shadow)");  // 添加阴影效果

        // 向容器组中添加图标，应用裁剪
        iconGroup.append("image")
            .attr("xlink:href", icon.src)
            .attr("width", style.size)
            .attr("height", style.size)
            .attr("clip-path", `url(#iconClip${idx})`) // 应用裁剪
            .attr("filter", "url(#shadow)"); // 在不规则图标外围，添加阴影效果
    });

}


// 监听文件输入框的变化事件
['iconInput1', 'iconInput2', 'iconInput3', 'iconInput4'].forEach(id => {
    document.getElementById(id).addEventListener('change', function (event) {
        // console.log(`${id} 发生了变化`);
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                // 检查图标是否已经存在
                const existingIconIndex = icons.findIndex(icon => icon.id === id);
                const iconData = {
                    id: id,
                    src: e.target.result
                };

                if (existingIconIndex !== -1) {
                    // 如果图标已经存在，替换它
                    icons[existingIconIndex] = iconData;
                } else {
                    // 否则，添加新图标
                    icons.push(iconData);
                }

                // 对图标按照ID进行排序
                icons.sort((a, b) => {
                    return parseInt(a.id.replace('iconInput', '')) - parseInt(b.id.replace('iconInput', ''));
                });

                drawIcons();
                adjustContentPosition();

                // 显示删除按钮
                const btnId = 'remove' + id.charAt(0).toUpperCase() + id.slice(1).replace('Input', 'Btn');
                if (document.getElementById(btnId)) {
                    document.getElementById(btnId).style.display = 'block';
                } else {
                    console.error("Button with ID:", btnId, "not found!");
                }
            };
            reader.readAsDataURL(file);
        }
        adjustContent();
    });
});

// 监听删除图标的按钮
function removeImage(imageId, inputId, buttonId) {
    // 使用D3从SVG中删除指定ID的图片或图标
    const svg = d3.select("#mainSVG > svg");
    svg.select(`#${imageId}`).remove();

    // 重置input字段
    const inputElem = document.getElementById(inputId);
    if (inputElem) {
        inputElem.value = '';  // 清除选定的文件
    }

    // 隐藏删除按钮
    const removeBtn = document.getElementById(buttonId);
    if (removeBtn) {
        removeBtn.style.display = 'none';
    }

    // 更新icons数组
    const index = icons.findIndex(icon => icon.id === inputId);
    if (index !== -1) {
        icons.splice(index, 1);
    }

    drawIcons();
    adjustContentPosition();
}


// 文字输入框
document.getElementById("textInput").addEventListener("input", function () {
    userInputText = this.value;
    adjustContent();
});

// 根据文字宽度自动换行

function splitTextToFitWidth(text, fontSize, width, fontFamily) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    document.body.appendChild(svg);

    const textElem = document.createElementNS(svgNS, "text");
    textElem.setAttribute("font-size", fontSize);
    textElem.setAttribute("font-family", fontFamily);
    svg.appendChild(textElem);

    const chars = Array.from(text);
    const lines = [];
    let currentLine = chars[0];

    for (let i = 1; i < chars.length; i++) {
        textElem.textContent = currentLine + chars[i];
        if (textElem.getBBox().width > width) {
            lines.push(currentLine);
            currentLine = chars[i];
        } else {
            currentLine += chars[i];
        }
    }

    lines.push(currentLine);

    document.body.removeChild(svg);
    return lines;
}

// 更新文字
function updateText() {
    // 移除旧的文本元素和其外描边
    textGroup.select("#userText").remove();
    textGroup.select("#userTextOutline").remove();

    if (userInputText) {

        let maxWidth = 1024 * 0.9;
        let maxHeight = 640 * 0.8;
        let fontSize = 70;
        let lines = userInputText.split("\n").flatMap(line => splitTextToFitWidth(line, fontSize, maxWidth, "得意黑"));
        let lineSpacing = 10; // 添加的行间距

        while (lines.length * fontSize > maxHeight && fontSize > 10) {
            fontSize -= 2;
        }

        // 添加文字描边
        const outlineElem = textGroup.append("text")
            .attr("id", "userTextOutline")
            .attr("x", 1024 / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", fontSize + "px")
            // .attr("font-family", "Noto Serif SC")
            .attr("font-family", "得意黑")
            .attr("stroke", "#373737")
            .attr("stroke-width", "10px")
            .attr("stroke-linejoin", "round")
            .attr("fill", "none");


        // 添加文字本体
        const textElem = textGroup.append("text")
            .attr("id", "userText")
            .attr("x", 1024 / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", fontSize + "px")
            // .attr("font-family", "Noto Serif SC")
            .attr("font-family", "得意黑")
            .attr("fill", "#FFF");

        lines.forEach((line, idx) => {
            textElem.append("tspan")
                .attr("x", 1024 / 2)
                .attr("dy", idx ? fontSize + lineSpacing : 0)
                .text(line);

            outlineElem.append("tspan")
                .attr("x", 1024 / 2)
                .attr("dy", idx ? fontSize + lineSpacing : 0)
                .text(line);
        });
    }
}

// 调整图标和文字组与边框的距离
function adjustContentPosition() {
    const canvasCenter = 640 / 2;
    const gapBetweenIconAndText = 50; // 图标和文字之间的间隔
    const singleTextHeight = 70; // 单行文字的高度

    const iconsBBox = iconContainer.node().getBBox();
    const textBBox = textGroup.node().getBBox();

    if (iconsBBox.height && textBBox.height) {
        // 同时有图标和文字
        const totalHeight = iconsBBox.height + gapBetweenIconAndText + textBBox.height;
        const contentTopY = (640 - totalHeight) / 2;

        iconContainer.attr("transform", `translate(0, ${contentTopY})`);
        // console.log("contentTopY", contentTopY)
        // console.log("gapBetweenIconAndText", gapBetweenIconAndText)
        textGroup.attr("transform", `translate(0, ${contentTopY + iconsBBox.height + singleTextHeight + gapBetweenIconAndText})`);
    } else if (iconsBBox.height) {
        // 只有图标
        iconContainer.attr("transform", `translate(0, ${canvasCenter - iconsBBox.height / 2})`);
        textGroup.attr("transform", `translate(0, 640)`); // 将文本移出视口
    } else if (textBBox.height) {
        // 只有文字
        iconContainer.attr("transform", `translate(0, 0)`); // 将图标移出视口
        textGroup.attr("transform", `translate(0, ${canvasCenter + singleTextHeight - textBBox.height / 2})`);
    } else {
        // 没有图标和文字
        iconContainer.attr("transform", `translate(0, 0)`); // 将图标移出视口
        textGroup.attr("transform", `translate(0, 640)`); // 将文本移出视口
    }
}


// 每次在添加/更新图标或文本时都重新计算它们的位置
function adjustContent() {
    drawIcons();
    updateText();
    adjustContentPosition();
}


// 5. 为背景图片添加模糊效果
// 定义模糊滤镜
const filter = defs.append("filter")
    .attr("id", "blur")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", "100%")
    .attr("height", "100%");
filter.append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", "5");  // 调整此值以增加/减少模糊效果

// 将模糊滤镜应用于背景图像
svg.select("#backgroundImage")
    .attr("filter", "url(#blur)");


function svgToPngDownload(svgElement, callback, filename = "exported_image.png") {
    // 获取 SVG 数据并转换为 Base64
    const xml = new XMLSerializer().serializeToString(svgElement);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const b64Start = 'data:image/svg+xml;base64,';
    const image64 = b64Start + svg64;

    // 加载 Base64 编码的 SVG
    const img = new Image();
    img.src = image64;

    img.onload = function () {
        // 创建 canvas 元素
        const canvas = document.createElement('canvas');
        canvas.width = svgElement.viewBox.baseVal.width;
        canvas.height = svgElement.viewBox.baseVal.height;
        const ctx = canvas.getContext('2d');

        // 绘制图像
        ctx.drawImage(img, 0, 0);

        // 导出为 PNG 并下载
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement('a');
        downloadLink.href = pngFile;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // 图像已完成，调用回调函数
        if (callback) {
            callback();
        }
    };
}

// 处理遮罩层
function showOverlay(message) {
    const overlay = document.getElementById("overlay");
    const overlayText = document.getElementById("overlay-text");

    overlayText.textContent = message;
    overlay.classList.remove("hidden");
}

function hideOverlay() {
    const overlay = document.getElementById("overlay");
    overlay.classList.add("hidden");
}

function generateImage() {
    const svgElement = document.querySelector("#mainSVG svg");

    // 显示遮罩层
    showOverlay("正在生成图片...");

    svgToPngDownload(svgElement, function () {

        // 更改遮罩层文本并稍后隐藏它
        showOverlay("图片生成完成！");
        setTimeout(hideOverlay, 2000);  // 2秒后隐藏
    });
}

