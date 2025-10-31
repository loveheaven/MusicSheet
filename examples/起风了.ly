\version "2.22.2"
\pointAndClickOff

\header {
    title =  "起风了" 
    encodingdate =  "2019-06-09"
    composer = "Wei Zheng"
    }

#(set-global-staff-size 20.158742857142858)
\paper {
    #(set-paper-size "a4") 
    top-margin = 1.0\cm
    bottom-margin = 2.0\cm
    left-margin = 1.0\cm
    right-margin = 1.0\cm
    indent = 0
    
    print-page-number = ##t
    print-first-page-number = ##t
    oddHeaderMarkup = \markup \null
    evenHeaderMarkup = \markup \null
    oddFooterMarkup = \markup {
      \fill-line {
        \fromproperty #'page:page-number-string
      }
    }
    evenFooterMarkup = \oddFooterMarkup
    }


LeftHandChord = \fixed c {
    c8 g c' e' g'2
}

LeftHandChordLong = \fixed c {
    c8 g c' e' g' e' c' g
}

\include "jianpu.ly"
scaleC = \relative c'{ c d e f g a b }
PartPOneVoiceOne = \fixed c' {
    \clef "treble" 
    \time 4/4 
    \key f \major | % 1
    \tempo 4=70 
     
    e16 f g a8 c16 c' a2 r16 | % 2
    e16 f g a8 c16 c' a g a f g e f c8 | % 3
    e16 f g a8 c16 c' a2 r16 | % 2
    e16 f g a8 c16 c' a g a f g e f c8 | % 5

    <e e'>16 <f f'> <g g'> <a a'>8 <c c'>16 <c' c''> <a a'>2 r16 | % 6
    <e e'>16 <f f'> <g g'> <a a'>8 <c c'>16 <c' c''> <a a'> <g g'> <a a'> <f f'> <g g'> <e e'> <f f'> <c c'>8 | % 7
    <e e'>16 <f f'> <g g'> <a a'>8 <c c'>16 <c' c''> <a a'>2 r16 | % 8
    <d g>2 <d fis>2 |%9

    g8. f16 g8. f16 g8 a8 c'8 a8 | % 10 这一路上
    g8. f16 g8. f16 g16 a g f c4 | % 11
    g8. f16 g8. f16 g8 a8 c'8 a8 | % 12
    g8. a16 g8 f g2 | % 13

    g8. f16 g8. f16 g8 a8 c'8 a8 | % 14
    g8. a16 g8 f d4 a16 g f g | % 15
    f8 r8 a16 g f g f8 r8 a16 g f g| % 16
    f2 f8 g a f|%17

    d'8 c'16 d'8. r16 f16  e'8 d'16 e'4 r16| % 18
    e'8 d'16 e'8. a8 f'16 g' f' (e') d'8 c' |%19
    d'8 c'16 d'8 c'16 d' c' d'8 c'16 g8 c'8. |%20
    a2 f8 g a f|%21

    d'8 c'16 d'8. r16 f16  e'8 d'16 e'4 r16| % 22
    <a cis' e'>8 d'16 e'8. a8 f'16 g' f' (e') d'8 c' |%23
    d'8 a'16 a'8. c'8 d'8 a'16 a'8 c'8 d'16( |%24 
    d'2.) f'8 g'|%25

    a'8 d''16 c''8. d''16 c''8. d''16 c''8.  g'16 a'( | %26
    a'8) d''16 c''8. d''16 c''8. d''16 c''8 a'8. | %27
    g'8 f'16 d'8 f'8 d'16 g'8 f'16 d'8 f'8. | %28
    a'4 (a'16) bes' (a'8) g'4 f'8 g' |%29

    a'8 d''16 c''8. d''16 c''8. d''16 c''8. g'8 | %30
    a'8 d''16 c''8. d''16 c''8. d''16 c''8 a'8. | %31
    g'8 f'16 d'8 a'8. g'8 f'16 d'8 f'8. | %32
    f'2. d'16 a'8.|%33

    g'8 f'16 d'8 a'8. g'8 f'16 d'8 f'8. | %34
    <e e'>16 <f f'> <g g'> <a a'>8 <c c'>16 <c' c''> <a a'>2 r16 | % 35
    <e e'>16 <f f'> <g g'> <a a'>8 <c c'>16 <c' c''> <a a'> <g g'> <a a'> <f f'> <g g'> <e e'> <f f'> <c c'>8 | % 36
    <e e'>16 <f f'> <g g'> <a a'>8 <c c'>16 <c' c''> <a a'>2 r16 | % 37
    <d g>2 <d fis>2 |% 38

    g8. f16 g8. f16 g8 a8 c'8 a8 | % 39 短短的路
    g8. f16 g8. f16 g16 a g (f) c4 | % 40
    g8. f16 g8. f16 g8 a8 c'8 a8 | % 41
    g8. a16 g8 f g2 | % 42

    g8. f16 g8. f16 g8 a8 c'8 a8 | % 43
    g8. a16 g8 f d4 a16 g f g | % 44
    f8 r8 a16 g f g f8 r8 a16 g f g| % 45
    f2 f8 g a f|%46

    d'8 c'16 d'8. r16 f16  e'8 d'16 e'4 r16| % 47
    e'8 d'16 e'8. a8 f'16 g' f' (e') d'8 c' |%48
    d'8 c'16 d'8 c'16 d' c' d'8 c'16 g8 c'8. |%49
    a2 f8 g a f|%50

    d'8 c'16 d'8. r16 f16  e'8 d'16 e'4 r16| % 51
    <a cis' e'>8 d'16 e'8. a8 f'16 g' f' (e') d'8 c' |%52
    d'8 a'16 a'8. c'8 d'8 a'16 a'8 c'8 d'16( |%53
    d'2.) f'8 g'|%54

    a'8 d''16 c''8. d''16 c''8. d''16 c''8.  g'16 a'( | %55
    a'8) d''16 c''8. d''16 c''8. d''16 c''8 a'8. | %56
    g'8 f'16 d'8 f'8 d'16 g'8 f'16 d'8 f'8. | %57
    a'4 (a'16) bes' (a'8) g'4 f'8 g' |%58

    a'8 d''16 c''8. d''16 c''8. d''16 c''8. g'8 | %59
    a'8 d''16 c''8. d''16 c''8. d''16 c''8 a'8. | %60
    g'8 f'16 d'8 a'8. g'8 f'16 d'8 f'8. | %61
    f'2. d'16 a'8.|%62

    g'8 f'16 d'8 a'8. g'8 f'16 d'8 f'8. | %63
    f'1 | %64

    \ottava #1
    e'16 f' g' a'8 c'16 c'' a'2 r16 | % 65
    e'16 f' g' a'8 c'16 c'' a' g' a' f' g' e' f' c'8 | % 66
    e'16 f' g' a'8 c'16 c'' a'4 \ottava #0 r16 f'8 g'| % 67 晚风
    % <d' g'>2 <d' fis'>2  | % 68
    


     
    a'8 d''16 c''8. d''16 c''8. d''16 c''8.  g'16 a'( | %55
    a'8) d''16 c''8. d''16 c''8. d''16 c''8 a'8. | %56
    g'8 f'16 d'8 f'8 d'16 g'8 f'16 d'8 f'8. | %57
    a'4 (a'16) bes' (a'8) g'4 f'8 g' |%58

    a'8 d''16 c''8. d''16 c''8. d''16 c''8. g'8 | %59
    a'8 d''16 c''8. d''16 c''8. d''16 c''8 a'8. | %60
    g'8 f'16 d'8 a'8. g'8 f'16 d'8 f'8. | %61
    f'2.  f'8 g'|%54

    a'8 d''16 c''8. d''16 c''8. d''16 c''8.  (g'16) a'( | %55 我仍感叹于
    a'8) d''16 c''8. d''16 c''8. d''16 c''8 a'8. | %56
    g'8 f'16 d'8 f'8 d'16 g'8 f'16 d'8 f'8. | %57
    a'4 (a'16) bes' (a'8) g'4 f'8 g' |%58

    a'8 d''16 c''8. d''16 c''8. d''16 c''8. g'8 | %59
    a'8 d''16 c''8. d''16 c''8. d''16 c''8 a'8. | %60
    g'8 f'16 d'8 a'8. g'8 f'16 d'8 d'16 f'8( | %61
    f'2.) d'16 a'8.|%33
    g'8 (f'16) d'8 a'8. g'8 f'16 d'8 f'8.( | %34

    f'1)\bar "|."
     

    }

PartPOneVoiceFive = \fixed c {
    \clef "bass" 
    \time 4/4 
    \key f \major | % 1
     
    bes,8 f a4 c8 e g4| % 2
    a,8 e g4 d8 f a4| % 3
    bes,8 f a4 c8 e g4| % 4
    a,8 e g4 d8 f a4| % 5
    bes,8 f a4 c8 e g4| % 6
    a,8 e g4 d8 f a4| % 7
    bes,8 f a4 c8 e g4| % 8
    <d a>2 <d a>2|%9

    f8 c' f' c'4 c'8 f' c'|%10
    e8 c' e' c'2 r8|%11
    ees8 c' ees' c'4 c'8 ees' c'|%12
    bes,8 f bes f bes,2 |%13
    g,8 d g d c g c' g |%14

    d8 a d' a d2 | % 15
    bes,8 f bes f c g c' g|%16
    f8 c' f' c' d2 |%17
    bes,8 f bes f c g c' g|%18
    a,8 e a e d a d' a|%19
    bes,8 f bes f c g c' g|%20
    f8 c' f' c' <ees ees'>4 c|%21
    bes,8 f bes f c g c' g|%22
    <a, a>4 <cis cis'> d8 a d' a|%23
    bes,8 f bes f c g c' g|%24
    <d a d'>8 <d a d'> <d a d'> <d a d'> <d a d'> <d a d'> <d a d'> <d a d'>|%25
    
    bes,8 f bes f c g c' g|%26
    a,8 e a e d a d' a|%27
    bes,8 f bes f c g c' g|%28
    f8 c' f' c' <a, a>4 <cis cis'>|%29

    bes,8 f bes f c g c' g|%30
    a,8 e a e d a d' a|%31
    bes,8 f bes f c g c' g|%32
    f8 c' f' c' f'2|%33
    bes,8 f bes f c g c' g|%34

    bes,8 f a4 c8 e g4| % 35
    a,8 e g4 d8 f a4| % 36
    bes,8 f a4 c8 e g4| % 37
    <d a>2 <d a>2|%38

    f8 c' f' c'4 c'8 f' c'|%39
    e8 c' e' c'2 r8|%40
    ees8 c' ees' c'4 c'8 ees' c'|%41
    bes,8 f bes f bes,2 |%42
    g,8 d g d c g c' g |%43

    d8 a d' a d2 | % 44
    bes,8 f bes f c g c' g|%45
    f8 c' f' c' d2 |%46
    bes,8 f bes f c g c' g|%47
    a,8 e a e d a d' a|%48
    bes,8 f bes f c g c' g|%49
    f8 c' f' c' <ees ees'>4 c|%50
    bes,8 f bes f c g c' g|%51
    <a, a>4 <cis cis'> d8 a d' a|%52
    bes,8 f bes f c g c' g|%53
    <d a d'>8 <d a d'> <d a d'> <d a d'> <d a d'> <d a d'> <d a d'> <d a d'>|%54
    
    bes,8 f bes f c g c' g|%55
    a,8 e a e d a d' a|%56
    bes,8 f bes f c g c' g|%57
    f8 c' f' c' <a, a>4 <cis cis'>|%58

    bes,8 f bes f c g c' g|%59
    a,8 e a e d a d' a|%60
    bes,8 f bes f c g c' g|%61
    f8 c' f' c' f'2|%62

    bes,8 f a4 c8 e g4| % 63
    f8 c' g'4 g'2| % 64
    
    bes,8 f a4 c8 e g4| % 65
    a,8 e g4 d8 f a4| % 66
    bes,8 f a4 c8 e g4| % 67


     bes,8 f bes f c g c' g|%68
    a,8 e a e d a d' a|%56
    bes,8 f bes f c g c' g|%57
    f8 c' f' c' <a, a>4 <cis cis'>|%58

    bes,8 f bes f c g c' g|%72
    a,8 e a e d a d' a|%60
    bes,8 f bes f c g c' g|%61
    f8 c' f' c' <d a d'> <d a d'> <d a d'> <d a d'>|%75

    bes,8 f bes f c g c' g|%76
    a,8 e a e d a d' a|%56
    bes,8 f bes f c g c' g|%57
    f8 c' f' c' <a, a>4 <cis cis'>|%58

    bes,8 f bes f c g c' g|%59
    a,8 e a e d a d' a|%60
    bes,8 f bes f c g c' g|%61
    f8 c' f' c' f'2|%62

    bes,8 f bes f c g c' g|%61
    f8 c' f' c' f'2|%62



    

    }

    geci = \lyricmode { 
                        _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
                        _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
                        _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
                        _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
                        这 一 路 上 走 走 停 停，
                        顺 着 少 年 漂 流 的 痕 迹。
                        迈 出 车 站 的 前 一 刻 竟 有 些 犹 豫。
                        不 禁 笑 这 近 乡 情 怯，
                        仍 无 可 避 免。
                        而 长 野 的 天 依 旧 那 么 暖，
                        吹 起 了 从 前。

                        从 前 初 识 这 世 间，
                        万 般 流 连，
                        看 着 天 边 似 在 眼 前。
                        也 甘 愿 赴 汤 蹈 火 去 走 它 一 遍。
                        如 今 走 过 这 世 间，
                        万 般 流 连，
                        翻 过 岁 月 不 同 侧 脸。
                        措 不 及 防 闯 入 你 的 笑 颜。
                        
                        我 曾 难 自 拔 于 世 界 之 大，
                        也 沉 溺 于 其 中 梦 话，
                        不 得 真 假， 不 做 挣 扎， 不 惧 笑 话。
                        我 曾 将 青 春 翻 涌 成 她，
                        也 曾 指 尖 弹 出 盛 夏。
                        心 之 所 动 且 就 随 缘 去 吧。
                        逆 着 光 行 走 任 风 吹 雨 打。


                        _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
                        _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
                        短 短 的 路 走 走 停 停，
                        也 有 了 几 分 的 距 离。
                        不 知 抚 摸 的 是 故 事 还 是 段 心 情，
                        也 许 期 待 的 不 过 是 与 时 间 为 敌。
                        再 次 看 到 你 微 凉 晨 光 里，
                        笑 的 很 甜 蜜。
                        
                        从 前 初 识 这 世 间，
                        万 般 流 连，
                        看 着 天 边 似 在 眼 前。
                        也 甘 愿 赴 汤 蹈 火 去 走 它 一 遍。
                        如 今 走 过 这 世 间，
                        万 般 流 连，
                        翻 过 岁 月 不 同 侧 脸。
                        措 不 及 防 闯 入 你 的 笑 颜。
                        
                        我 曾 难 自 拔 于 世 界 之 大，
                        也 沉 溺 于 其 中 梦 话，
                        不 得 真 假， 不 做 挣 扎， 不 惧 笑 话。
                        我 曾 将 青 春 翻 涌 成 她，
                        也 曾 指 尖 弹 出 盛 夏。
                        心 之 所 动 且 就 随 缘 去 吧。

                        _ _ _ _ _ _ _ _ _ _ 
                        _ _ _ _ _ _ _ _ _ _    
                        _ _ _ _ _ _ _ _ _ _    
                        _ _ _ _ _ _ _ _ _     
                        晚 风 吹 起 你 鬓 间 的 白 发，
                        抚 平 回 忆 留 下 的 疤。
                        你 的 眼 中 明 暗 交 杂，
                        一 笑 生 花。
                        暮 色 遮 住 你 蹒 跚 的 步 伐，
                        走 进 床 头 藏 起 的 画。
                        画 中 的 你，
                        低 着 头 说 话。
                        我 仍 感 叹 于 世 界 之 大，
                        也 沉 醉 于 儿 时 情 话。
                        不 剩 真 假， 不 做 挣 扎， 无 谓 笑 话。
                        我 终 将 青 春 还 给 了 她，
                        连 同 指 尖 弹 出 的 盛 夏。
                        心 之 所 动 就 随 风 去 了，
                        以 爱 之 名 你 还 愿 意 吗？

    } 


% The score definition
\score {
        
        \new PianoStaff
        <<
            
            \new Staff = "1" {
                \mergeDifferentlyDottedOn\mergeDifferentlyHeadedOn
                \new Voice = "PartPOneVoiceOne" {  \PartPOneVoiceOne }
                \new Lyrics   \lyricsto  "PartPOneVoiceOne" { 
                    \override Lyrics.LyricText.font-name = "Kai"
                    \geci
                    }
            } 
            %\new JianpuStaff \with {
            %\remove "Key_engraver"
            %\remove "Time_signature_engraver"
            %}  
            %\jianpuMusic { 
            %    \new Voice = "PartPOneVoiceOnef" {  \PartPOneVoiceOne }
            %}
            \new Staff = "2" {
                \mergeDifferentlyDottedOn\mergeDifferentlyHeadedOn
                \set Staff.midiInstrument = "acoustic grand"
                \new Voice = "PartPOneVoiceFive" {  \PartPOneVoiceFive }
                }
            >>
            
        
    \layout {}
    % To create MIDI output, uncomment the following line:
      \midi {\tempo 4 = 70 }
    }