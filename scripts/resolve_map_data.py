#!/usr/bin/env python3
"""
resolve_map_data.py
检查用户数据与地图数据的匹配情况，找出未能匹配的地区名称

使用方法:
  python resolve_map_data.py --data '[{"name":"北京","value":98}]'
  python resolve_map_data.py --file my_data.json
"""

import json
import argparse

# 标准省份名称列表
CHINA_PROVINCES = [
    '北京','天津','上海','重庆',
    '河北','山西','辽宁','吉林','黑龙江',
    '江苏','浙江','安徽','福建','江西','山东',
    '河南','湖北','湖南','广东','海南',
    '四川','贵州','云南','陕西','甘肃','青海',
    '内蒙古','广西','西藏','宁夏','新疆',
    '台湾','香港','澳门',
]

def normalize(name: str) -> str:
    return name.replace('省','').replace('市','').replace(
        '壮族自治区','').replace('回族自治区','').replace(
        '维吾尔自治区','').replace('自治区','').replace(
        '特别行政区','').strip()

def resolve(data: list) -> dict:
    matched   = []
    unmatched = []

    for item in data:
        name = normalize(item.get('name',''))
        found = False
        for province in CHINA_PROVINCES:
            if name in province or province in name:
                matched.append({'input': item['name'], 'matched': province, 'value': item.get('value')})
                found = True
                break
        if not found:
            unmatched.append(item['name'])

    print(f"\n📊 匹配结果")
    print(f"   总计: {len(data)} 条")
    print(f"   匹配: {len(matched)} 条 ✅")
    print(f"   未匹配: {len(unmatched)} 条 ❌")

    if unmatched:
        print(f"\n❌ 以下地区名称未能匹配，请检查拼写：")
        for name in unmatched:
            print(f"   - {name}")
        print(f"\n💡 建议：使用标准省份名称，如"广东"而非"粤"")

    if matched:
        print(f"\n✅ 已匹配的地区：")
        for m in matched:
            print(f"   {m['input']:10} → {m['matched']:8} (值: {m['value']})")

    return {'matched': matched, 'unmatched': unmatched}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='检查地区数据匹配情况')
    parser.add_argument('--data', help='JSON 格式的数据字符串')
    parser.add_argument('--file', help='JSON 数据文件路径')
    parser.add_argument('--sample', action='store_true', help='用示例数据测试')

    args = parser.parse_args()

    if args.sample:
        sample = [
            {'name':'广东省','value':135000},
            {'name':'江苏','value':122000},
            {'name':'粤港澳','value':99999},  # 故意错误
            {'name':'北京市','value':43000},
        ]
        resolve(sample)
    elif args.data:
        data = json.loads(args.data)
        resolve(data)
    elif args.file:
        with open(args.file, encoding='utf-8') as f:
            data = json.load(f)
        resolve(data)
    else:
        parser.print_help()
