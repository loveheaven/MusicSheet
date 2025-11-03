\version "2.22.2"
\pointAndClickOff

\header {
    title =  "月亮代表我的心"
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
    \numericTimeSignature\time 4/4 
    \key c \major | % 1
    \tempo 4=70 
     
     g'2 (g'8) e'8 d'8 c'8 | % 2
     e'2 r8 a8 c'8 e'8 | % 3
     a'2 (a'8) f'8 d'8 c'8 | % 4
     b2.  r8 g8 \break | % 5

     %c'4.  e'8  g'4. c'8 | % 6
     %b4.  e'8  g'4. g'8 | % 7
     %a'4.  b'8  c''4. a'8 | % 8
     %g'2. r8 g8 |%9

     c'4.  e'8  g'4. c'8 | % 6
     b4.  e'8  g'4. g'8 | % 7
     a'4.  b'8  c''4. a'8 | % 8
     g'2. e'8 d' |%9
     c'4.  c'8  c'4 e'8 d' | \barNumberCheck #10
     c'4.  c'8  c'4 d'8 e'8 | % 11
     d'4.  c'8  a4  e'4 | % 12
     d'2. r8 g8  | % 13

     c'4.  e'8  g'4. c'8 | % 14
     b4.  e'8  g'4. g'8 | % 15
     a'4.  b'8  c''4. a'8 | % 16
     g'2. e'8 d'8 |%17
     c'4.  c'8  c'4 e'8 d' | \barNumberCheck #18
     c'4.  c'8  c'4 d'8 e'8 | % 19
     d'4. a8 b4 c'8 (d'8) | % 20
     c'2.  g'4  | % 21

     e'4.  d'8  c'4  g'4 | % 22
     b2. a8  b8 | % 23
     a4.  b8 a4 g4 | % 24
     e'2. g'4 | % 25
     e'4.  d'8  c'4  g'4 | % 26
     b2. a8  b8 | % 27
     c'4. c'8 c'4 d'8 (e'8)| %28
     d'2. r8 g8| %29

     c'4.  e'8  g'4. c'8 | % 30
     b4.  e'8  g'4. g'8 | % 31
     a'4.  b'8  c''4. a'8 | % 32
     g'2. e'8 d' |%33
        c'4.  c'8  c'4 e'8 d' | \barNumberCheck #34
     c'4.  c'8  c'4 d'8 e'8 | % 35
     d'4. a8 b4 c'8 (d'8) | % 36
        c'2. <e' e''>8 <d' d''>8 | % 37

        <c' c''>4.  <c' c''>8  <c' c''>4 <e' e''>8 <d' d''>| \barNumberCheck #38
        <c' c''>4.  <c' c''>8  <c' c''>4 <d' d''>8 <e' e''>8 | % 39
     <d' d''>4. <a a'>8 <b b'>4  <c' c''>8 (<d' d''>) | % 40
     <c' g' c''>1 \arpeggio\bar "|."
     

    }

PartPOneVoiceFive = \fixed c {
    \clef "bass" 
    \numericTimeSignature\time 4/4 
    \key c \major | % 1
     
    \LeftHandChord | % 2
    \modalTranspose c a, \scaleC \LeftHandChord  | % 3
    \modalTranspose c f \scaleC \LeftHandChord | % 4
    \modalTranspose c g, \scaleC \LeftHandChord | % 5

    %c8 g c'4 c8 g c' g
    %e8 b e'4 e8 b e' b
    %f8 c' f'4 f8 c' f' c'
    %c8 g c' d' e'2 

    \LeftHandChord | % 6
    \modalTranspose c e, \scaleC \LeftHandChord | % 7
    \modalTranspose c f, \scaleC \LeftHandChord | % 8
    \LeftHandChord | %9

    \modalTranspose c a, \scaleC \LeftHandChord | % 10
    \modalTranspose c f, \scaleC \LeftHandChord | % 11
    \modalTranspose c d, \scaleC \LeftHandChord | % 12
    \modalTranspose c g, \scaleC \LeftHandChord | % 13
    
    \LeftHandChordLong | % 14
    e,8 b,8 e b d' b e b, | % 15
    \modalTranspose c f, \scaleC \LeftHandChordLong | % 16
    \LeftHandChordLong | % 17

    \modalTranspose c a, \scaleC \LeftHandChordLong | % 18
    f,8 c f c' f' c' f c | % 19
    \modalTranspose c d \scaleC \LeftHandChordLong | % 20
    \LeftHandChordLong | % 21
    \LeftHandChordLong | % 22
    \modalTranspose c e, \scaleC \LeftHandChordLong | % 23
    f,8 c f c' f' c' f c | % 24
    \LeftHandChordLong | % 25
    \LeftHandChordLong | % 26
    \modalTranspose c e, \scaleC \LeftHandChordLong | % 27
    f,8 c f c' f' c' f c | % 28
    \modalTranspose c g, \scaleC \LeftHandChordLong | % 27

    \modalTranspose c c, \scaleC \LeftHandChord | % 28
    \modalTranspose c e, \scaleC \LeftHandChord | % 28
    \modalTranspose c f, \scaleC \LeftHandChord | % 29
    \LeftHandChord | % 30

    \modalTranspose c a, \scaleC \LeftHandChord | % 31
    \modalTranspose c f, \scaleC \LeftHandChord | % 32
    \modalTranspose c d, \scaleC \LeftHandChord | % 33
    \LeftHandChord | % 34

    \modalTranspose c a, \scaleC \LeftHandChordLong | % 35
    f,8 c f c' f' c' f c | % 36
    \modalTranspose c d, \scaleC \LeftHandChordLong | % 37
    \LeftHandChord | % 38
    \bar "|."

    }

geci = \lyricmode { 
                        _ _ _ _ _ _ _ _ _ _ _ _ _  
                        你 问 我 爱 你 有 多 深，
                        我 爱 你 有 几 分？
                        我 的 情 也 真，
                        我 的 爱 也 真，
                        月 亮 代 表 我 的 心。

                        你 问 我 爱 你 有 多 深，
                        我 爱 你 有 几 分？
                        我 的 情 不 移，
                        我 的 爱 不 移，
                        月 亮 代 表 我 的 心。

                        轻 轻 的 一 个 吻，
                        已 经 打 动 我 的 心。
                        深 深 的 一 段 情，
                        教 我 思 念 到 如 今。

                        你 问 我 爱 你 有 多 深，
                        我 爱 你 有 几 分？
                        你 去 想 一 想,
                        你 去 看 一 看,
                        月 亮 代 表 我 的 心。

                        你 去 想 一 想,
                        你 去 看 一 看,
                        月 亮 代 表 我 的 心。
    } 


% The score definition
\score {
        
        \new PianoStaff
        <<
            
            \new Staff = "1" {
                \new Voice = "PartPOneVoiceOne"   {\PartPOneVoiceOne }
                
            } 
            \new Lyrics  \lyricsto  "PartPOneVoiceOne" { 
                \override Lyrics.LyricText.font-name = "Kai"
                \geci
            }
            \new Staff = "2" {
                
                \set Staff.midiInstrument = "acoustic grand"
                \new Voice = "PartPOneVoiceFive" \PartPOneVoiceFive 
                }
            >>
            
        
        
    \layout {}
    % To create MIDI output, uncomment the following line:
      \midi {\tempo 4 = 70 }
    }

