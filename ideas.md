# TNFD優先地域マップ - デザインアイデア

<response>
<text>
## アイデア1: 「データ・カートグラフィー」 - 科学的地図表現

**Design Movement**: インフォメーション・デザイン / スイス・タイポグラフィ
**Core Principles**: 
1. データの正確性と視認性を最優先
2. 地図を中心としたフルスクリーンレイアウト
3. 情報の階層構造を明確に

**Color Philosophy**: ダークブルーの海洋色をベースに、優先地域をオレンジ〜赤のヒートマップ風グラデーションで表現。背景は深い紺色（#0A1628）で地図を際立たせる。

**Layout Paradigm**: 地図がビューポートの80%を占め、左側にフィルタリングパネル、右側にクリック時の詳細パネルがスライドイン。

**Signature Elements**: 
1. 地図上のパルスアニメーション付きマーカー
2. 企業カードのフローティングパネル

**Interaction Philosophy**: ホバーで企業名がツールチップ表示、クリックで詳細パネルが展開

**Animation**: マーカーの波紋アニメーション、パネルのスライドイン

**Typography System**: Noto Sans JP（本文）+ DM Sans（英数字・数値）
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## アイデア2: 「ネイチャー・ダッシュボード」 - 環境データ分析ツール

**Design Movement**: ニューモーフィズム + ダッシュボードUI
**Core Principles**:
1. 統計データと地図の融合
2. フィルタリングと分析機能の充実
3. 企業比較が容易なUI

**Color Philosophy**: 森林のグリーン（#1B4332）をプライマリに、アースカラーのパレット。背景はオフホワイト（#F8F6F0）でナチュラルな印象。

**Layout Paradigm**: 上部にサマリー統計カード、中央に地図、下部に企業一覧テーブル。サイドバーでフィルタリング。

**Signature Elements**:
1. 有機的な曲線を使ったセクション区切り
2. 葉脈パターンの装飾要素

**Interaction Philosophy**: ドラッグ&ドロップでフィルタ操作、地図とテーブルの連動

**Animation**: カードのフェードイン、地図マーカーのバウンス

**Typography System**: Zen Kaku Gothic New（本文）+ Space Grotesk（見出し・数値）
</text>
<probability>0.05</probability>
</response>

<response>
<text>
## アイデア3: 「グローバル・インパクト・アトラス」 - 没入型地図体験

**Design Movement**: データジャーナリズム / ストーリーテリングUI
**Core Principles**:
1. 地図への没入感を最大化
2. 企業ごとのストーリーを伝える
3. 視覚的インパクトと情報密度の両立

**Color Philosophy**: ミッドナイトブルー（#0F172A）の暗い背景に、ティール（#14B8A6）のアクセント。マーカーはカテゴリ別に色分け（直接操業: アンバー、バリューチェーン: シアン、両方: エメラルド）。

**Layout Paradigm**: フルスクリーン地図にオーバーレイUI。左上にタイトル・統計、右側にスクロール可能な企業リスト。地図は3Dチルト可能。

**Signature Elements**:
1. グロー効果付きのマーカー（夜景のような表現）
2. 接続線で企業本社と優先地域を結ぶビジュアル

**Interaction Philosophy**: マーカークリックで地図がズームイン＋詳細カードが浮上、企業リストからのクリックで地図が該当地域にパン

**Animation**: 地図の初期ロード時にマーカーが順次出現、ズーム時のスムーズトランジション

**Typography System**: Noto Sans JP（本文）+ JetBrains Mono（データ値）
</text>
<probability>0.07</probability>
</response>

## 選定: アイデア3「グローバル・インパクト・アトラス」

没入型の地図体験を提供し、65社の優先地域を視覚的にインパクトのある形で表現する。ダークテーマの地図にグロー効果のマーカーを配置し、カテゴリ別の色分けで直感的に理解できるUIを構築する。
