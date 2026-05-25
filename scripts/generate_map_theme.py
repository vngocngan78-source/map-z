#!/usr/bin/env python3
"""
generate_map_theme.py
根据用户指定的主色，自动生成完整的 map-z 配色主题

使用方法:
  python generate_map_theme.py --color "#ff6b6b" --name coral
  python generate_map_theme.py --color "#00d4aa" --name mint
"""

import argparse
import json
import colorsys

def hex_to_rgb(hex_color: str) -> tuple:
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(r: int, g: int, b: int) -> str:
    return '#{:02x}{:02x}{:02x}'.format(int(r), int(g), int(b))

def rgb_to_hsv(r, g, b):
    return colorsys.rgb_to_hsv(r/255, g/255, b/255)

def hsv_to_rgb(h, s, v):
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return int(r*255), int(g*255), int(b*255)

def generate_theme(main_color: str, name: str) -> dict:
    """根据主色生成完整配色方案"""
    r, g, b = hex_to_rgb(main_color)
    h, s, v = rgb_to_hsv(r, g, b)

    # 中间色：降低亮度
    mid_r, mid_g, mid_b = hsv_to_rgb(h, min(s+0.1, 1), max(v-0.2, 0))
    mid_color = rgb_to_hex(mid_r, mid_g, mid_b)

    # 暗色：极低亮度，用作最低值颜色
    dark_r, dark_g, dark_b = hsv_to_rgb(h, min(s+0.2, 1), max(v-0.7, 0.05))
    dark_color = rgb_to_hex(dark_r, dark_g, dark_b)

    theme = {
        'name': name,
        'main':  main_color,
        'mid':   mid_color,
        'dark':  dark_color,
        'rgb':   [r, g, b],
        'bar':   f'linear-gradient(to right,{dark_color},{main_color})',
        'css_vars': {
            '--map-color-main': main_color,
            '--map-color-mid':  mid_color,
            '--map-color-dark': dark_color,
            '--map-border-glow': f'rgba({r},{g},{b},0.4)',
            '--map-shadow': f'rgba({r},{g},{b},0.15)',
        }
    }

    print(f"\n✅ 生成配色主题: {name}")
    print(f"   主色:   {main_color}")
    print(f"   中间色: {mid_color}")
    print(f"   暗色:   {dark_color}")
    print(f"\n// 添加到 SKILL.md 的配色表：")
    print(f"""  {name}: {{
    glow: '{main_color}',
    mid:  '{mid_color}',
    dark: '{dark_color}',
    bar:  'linear-gradient(to right,{dark_color},{main_color})'
  }},""")

    return theme

def list_presets():
    presets = {
        'cyan':   '#00c9ff',
        'orange': '#ff8c00',
        'green':  '#39ff14',
        'purple': '#bf5fff',
        'red':    '#ff4757',
        'gold':   '#ffd700',
        'pink':   '#ff6b9d',
        'teal':   '#00d4aa',
    }
    print("\n内置预设主题：")
    for name, color in presets.items():
        r, g, b = hex_to_rgb(color)
        print(f"  {name:10} {color}  RGB({r},{g},{b})")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='生成 map-z 配色主题')
    parser.add_argument('--color', help='主色（十六进制，如 #ff6b6b）')
    parser.add_argument('--name',  help='主题名称')
    parser.add_argument('--list',  action='store_true', help='列出内置主题')

    args = parser.parse_args()

    if args.list:
        list_presets()
    elif args.color and args.name:
        generate_theme(args.color, args.name)
    else:
        parser.print_help()
