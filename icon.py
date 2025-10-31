from PIL import Image
import cairosvg
import os

def svg_to_png(svg_path, png_path, size=None):
    """
    将SVG文件转换为PNG格式
    :param svg_path: SVG文件路径
    :param png_path: 输出的PNG文件路径
    :param size: 可选元组 (宽度, 高度)，用于调整输出尺寸
    """
    try:
        # 检查文件是否存在
        if not os.path.exists(svg_path):
            raise FileNotFoundError(f"SVG文件不存在: {svg_path}")
            
        # 设置输出选项
        output_options = {
            'write_to': png_path,
            'output_width': size[0] if size else 100,
            'output_height': size[1] if size else 100
        }
        svg_code = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="app-icon"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>'
        # 执行转换
        # cairosvg.svg2png(url=svg_path, **output_options)
        cairosvg.svg2png(bytestring=svg_code, **output_options)
        print(f"SVG已成功转换为PNG: {png_path}")
        
    except Exception as e:
        print(f"转换失败: {str(e)}")
        raise


def shrink_image(image_path):
    # 打开原始图片
    image = Image.open('sheetmusic.png')

    # 获取原始尺寸
    original_width, original_height = image.size
    print(f"原始尺寸: {original_width}x{original_height}")

    # 计算缩放比例，保持宽高比
    scale = min(32 / original_width, 32 / original_height)
    new_width = int(original_width * scale)
    new_height = int(original_height * scale)

    print(f"缩放后尺寸: {new_width}x{new_height}")

    # 等比例缩放
    resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # 创建32x32的画布，居中放置缩放后的图片
    final_image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))  # 透明背景

    # 计算居中位置
    x_offset = (32 - new_width) // 2
    y_offset = (32 - new_height) // 2

    # 将缩放后的图片粘贴到画布中心
    final_image.paste(resized_image, (x_offset, y_offset))

    # 保存为icon.png
    final_image.save('icon.png', 'PNG')
    print("图标已保存为 icon.png (32x32)")

svg_to_png('public/vite.svg', 'icon.png', (512, 512))