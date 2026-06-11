from database import engine, SessionLocal
from models import Base, BrandFeature, MarketPrice
from datetime import datetime

Base.metadata.create_all(bind=engine)
db = SessionLocal()

brand_features = [
    BrandFeature(brand="Louis Vuitton", feature_type="五金刻字", title="LV五金刻字特征",
                 description="Louis Vuitton的五金件刻字工艺精湛，字体清晰有立体感。",
                 key_points="1. 字母L的竖线较短\n2. 字母O为正圆形\n3. 字母S有特殊倾斜角度\n4. 刻字深浅均匀，边缘清晰",
                 common_fakes="1. 刻字模糊不清\n2. 字体比例不对\n3. 刻字太浅或太深\n4. 字母间距不均",
                 sort_order=1),
    BrandFeature(brand="Louis Vuitton", feature_type="内标走线", title="LV内标与走线",
                 description="LV内标有特定的字体和位置，走线工整均匀。",
                 key_points="1. 内标字体为特定衬线体\n2. MADE IN U.S.A 或 FRANCE等字样\n3. 走线针脚均匀，每英寸约8-9针\n4. 边角处理干净利落",
                 common_fakes="1. 内标字体错误\n2. 走线歪扭\n3. 针脚密度不对\n4. 内衬材质不符",
                 sort_order=2),
    BrandFeature(brand="Louis Vuitton", feature_type="防尘袋烫金", title="LV防尘袋烫金",
                 description="正品LV防尘袋烫金清晰，有光泽感。",
                 key_points="1. 烫金颜色为暖金色\n2. 字体清晰有凹凸感\n3. 防尘袋材质为棉质\n4. LOGO比例正确",
                 common_fakes="1. 烫金颜色偏黄或偏暗\n2. 字体模糊\n3. 材质为化纤\n4. LOGO变形",
                 sort_order=3),

    BrandFeature(brand="Chanel", feature_type="五金刻字", title="Chanel五金刻字特征",
                 description="Chanel双C标志和五金刻字有严格的工艺标准。",
                 key_points="1. 双C标志右C在上左C在下\n2. 双C交叠处比例精确\n3. 刻字字体为特定无衬线体\n4. 五金件质感厚重",
                 common_fakes="1. 双C方向错误\n2. 交叠比例不对\n3. 刻字粗糙\n4. 五金偏轻",
                 sort_order=1),
    BrandFeature(brand="Chanel", feature_type="内标走线", title="Chanel内标与走线",
                 description="Chanel内标有独特的防伪设计，走线极为工整。",
                 key_points="1. 内标背后有防伪镭射标\n2. 镭射标有编号且不易撕下\n3. 走线为菱格纹，每格大小均匀\n4. 内里皮革柔软有香味",
                 common_fakes="1. 镭射标可轻易撕下\n2. 菱格大小不一\n3. 内标字体不对\n4. 没有皮革香味",
                 sort_order=2),
    BrandFeature(brand="Chanel", feature_type="防尘袋烫金", title="Chanel防尘袋烫金",
                 description="Chanel防尘袋采用高品质材质，烫金工艺考究。",
                 key_points="1. 防尘袋为山茶花图案或简约款\n2. 烫金清晰有光泽\n3. 双C标志比例标准\n4. 抽绳设计精致",
                 common_fakes="1. 烫金模糊\n2. 材质偏薄\n3. 双C变形\n4. 抽绳粗糙",
                 sort_order=3),

    BrandFeature(brand="Hermes", feature_type="五金刻字", title="Hermes五金刻字特征",
                 description="Hermes的五金件工艺精湛，是鉴定的重要依据。",
                 key_points="1. H标志有特定的厚度和比例\n2. 刻字字体是Hermes专属字体\n3. 五金件镀层均匀有质感\n4. 螺丝为一字型特殊设计",
                 common_fakes="1. H标志比例失真\n2. 刻字深浅不一\n3. 五金颜色偏黄或偏白\n4. 螺丝为普通十字型",
                 sort_order=1),
    BrandFeature(brand="Hermes", feature_type="内标走线", title="Hermes内标与走线",
                 description="Hermes的手工缝线是其标志性特征。",
                 key_points="1. 马鞍针法，手工缝制\n2. 线迹有轻微倾斜角度\n3. 内标烫金清晰\n4. 皮革边缘封边均匀",
                 common_fakes="1. 机器缝线过于规整\n2. 线迹无倾斜\n3. 烫金模糊\n4. 封边粗糙",
                 sort_order=2),
    BrandFeature(brand="Hermes", feature_type="防尘袋烫金", title="Hermes防尘袋烫金",
                 description="Hermes防尘袋设计简约但工艺考究。",
                 key_points="1. 橘色防尘袋为经典款\n2. 烫金为暗金色\n3. 字体为衬线体\n4. 袋子有一定厚度",
                 common_fakes="1. 颜色过于鲜艳\n2. 烫金太亮\n3. 材质太薄\n4. 字体不对",
                 sort_order=3),

    BrandFeature(brand="Gucci", feature_type="五金刻字", title="Gucci五金刻字特征",
                 description="Gucci五金件有其独特的设计风格和工艺特点。",
                 key_points="1. 双G标志相互交叠\n2. 字母G有特定的弧度\n3. 刻字清晰有深度\n4. 五金件质感好",
                 common_fakes="1. 双G比例错误\n2. G的弧度不对\n3. 刻字太浅\n4. 五金质感差",
                 sort_order=1),
    BrandFeature(brand="Gucci", feature_type="内标走线", title="Gucci内标与走线",
                 description="Gucci内标有数字编号和品牌标识。",
                 key_points="1. 内标皮革质感好\n2. 烫金或压印清晰\n3. 有款号和尺码编号\n4. 走线工整",
                 common_fakes="1. 内标材质差\n2. 编号位数不对\n3. 字体错误\n4. 走线歪扭",
                 sort_order=2),
    BrandFeature(brand="Gucci", feature_type="防尘袋烫金", title="Gucci防尘袋烫金",
                 description="Gucci防尘袋设计有品牌特色。",
                 key_points="1. 通常为棕色或米白色\n2. 双G标志清晰\n3. 抽绳设计\n4. 材质为棉质",
                 common_fakes="1. 颜色偏差大\n2. LOGO模糊\n3. 材质太薄\n4. 做工粗糙",
                 sort_order=3),

    BrandFeature(brand="Dior", feature_type="五金刻字", title="Dior五金刻字特征",
                 description="Dior五金件设计优雅，工艺精良。",
                 key_points="1. Dior字母有特定字体\n2. 五金件镀层均匀\n3. 刻字深浅一致\n4. 细节处理精致",
                 common_fakes="1. 字体不对\n2. 刻字粗糙\n3. 五金颜色偏差\n4. 细节模糊",
                 sort_order=1),
    BrandFeature(brand="Dior", feature_type="内标走线", title="Dior内标与走线",
                 description="Dior内标设计独特，走线工整。",
                 key_points="1. 内标有品牌标识\n2. 有产地标注\n3. 走线均匀细密\n4. 内里材质高级",
                 common_fakes="1. 内标设计错误\n2. 走线稀疏\n3. 材质低劣\n4. 做工粗糙",
                 sort_order=2),
    BrandFeature(brand="Dior", feature_type="防尘袋烫金", title="Dior防尘袋烫金",
                 description="Dior防尘袋设计典雅。",
                 key_points="1. 通常为米白色\n2. Dior字体烫金清晰\n3. 材质柔软\n4. 设计简约",
                 common_fakes="1. 烫金模糊\n2. 材质偏硬\n3. 字体不对\n4. 颜色偏黄",
                 sort_order=3),
]

existing_features = db.query(BrandFeature).count()
if existing_features == 0:
    for feature in brand_features:
        db.add(feature)
    print("品牌特征数据初始化完成")
else:
    print(f"品牌特征数据已存在 ({existing_features}条)")

market_prices = [
    MarketPrice(brand="Louis Vuitton", model="Neverfull MM", new_price=14800, second_hand_price=9500, retention_rate=64.2, price_trend="stable"),
    MarketPrice(brand="Louis Vuitton", model="Speedy 25", new_price=11800, second_hand_price=7200, retention_rate=61.0, price_trend="stable"),
    MarketPrice(brand="Louis Vuitton", model="Alma BB", new_price=17500, second_hand_price=10800, retention_rate=61.7, price_trend="up"),
    MarketPrice(brand="Chanel", model="Classic Flap Medium", new_price=62000, second_hand_price=45000, retention_rate=72.6, price_trend="up"),
    MarketPrice(brand="Chanel", model="Boy Bag Medium", new_price=48000, second_hand_price=32000, retention_rate=66.7, price_trend="stable"),
    MarketPrice(brand="Chanel", model="2.55 Reissue", new_price=58000, second_hand_price=38000, retention_rate=65.5, price_trend="up"),
    MarketPrice(brand="Hermes", model="Birkin 30", new_price=85000, second_hand_price=120000, retention_rate=141.2, price_trend="up"),
    MarketPrice(brand="Hermes", model="Kelly 28", new_price=78000, second_hand_price=105000, retention_rate=134.6, price_trend="up"),
    MarketPrice(brand="Hermes", model="Lindy 26", new_price=52000, second_hand_price=45000, retention_rate=86.5, price_trend="stable"),
    MarketPrice(brand="Gucci", model="Dionysus Mini", new_price=15800, second_hand_price=8500, retention_rate=53.8, price_trend="down"),
    MarketPrice(brand="Gucci", model="Marmont Small", new_price=16500, second_hand_price=9200, retention_rate=55.8, price_trend="stable"),
    MarketPrice(brand="Gucci", model="Sylvie Medium", new_price=18800, second_hand_price=11500, retention_rate=61.2, price_trend="down"),
    MarketPrice(brand="Dior", model="Lady Dior Medium", new_price=38000, second_hand_price=22000, retention_rate=57.9, price_trend="stable"),
    MarketPrice(brand="Dior", model="Saddle Bag", new_price=28000, second_hand_price=18000, retention_rate=64.3, price_trend="up"),
    MarketPrice(brand="Dior", model="Book Tote", new_price=22000, second_hand_price=14500, retention_rate=65.9, price_trend="up"),
]

existing_prices = db.query(MarketPrice).count()
if existing_prices == 0:
    for price in market_prices:
        db.add(price)
    print("行情数据初始化完成")
else:
    print(f"行情数据已存在 ({existing_prices}条)")

db.commit()
db.close()
print("种子数据初始化完成！")
