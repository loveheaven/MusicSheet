\version "2.22.0"
\language "deutsch"

%https://www.youtube.com/watch?v=jCu-T9E0MvM
%https://www.youtube.com/watch?v=4rs4IYUoI1Y


FSus = #(make-span-event 'SustainEvent STOP)
NSus = #(make-span-event 'SustainEvent START)

#(use-modules (ice-9 regex))

dynamictext =
#(define-event-function (text) (markup?)
   (if (string? text)
       (let* ((underscores-replaced
               (string-map
                (lambda (x) (if (eq? x #\_) #\space x))
                text))
              (split-text (string-split underscores-replaced #\space))
              (formatted (map
                          (lambda (word)
                            (if (string-match "^[mrzfps]*$" word)
                                (markup #:dynamic word)
                                (markup #:normal-text #:italic word)))
                          split-text)))
         #{
           #(make-dynamic-script (make-line-markup formatted))
         #})
       ;; user provided a full-blown markup, so we don't mess with it:
       #{
         #(make-dynamic-script (markup #:normal-text text))
       #}))


myOttava =
#(define-music-function (o) (integer?)
   (let ((text (case o
                 ((0) #f)
                 ((1 -1) "8")
                 ((2 -2) "15"))))
     #{
       \ottava #o
       \set Staff.ottavation = #text
     #}))

\layout {
  \context {
    \Voice
    beamExceptions = #'()
    \consists "Dot_column_engraver"
    \override BreathingSign.text =
    \markup { \musicglyph "scripts.lvarcomma" }
    \consists "Staff_performer"
    \override Stem.neutral-direction = #down
    \override Script.outside-staff-priority = #'()
    \override Script.padding = #1
  }
  \context {
    \Staff
    instrumentName = ##f
    shortInstrumentName = ##f
    \remove "Dot_column_engraver"
    beamExceptions = #'()
    \override BreathingSign.text =
    \markup { \musicglyph "scripts.lvarcomma" }
  }
  \context {
    \Staff
    \name BarNumberStaff
    \alias Staff
    \consists "Bar_number_engraver"
    \override BarNumber.color = #(rgb-color 0.7 0.7 0.7)
    \override BarNumber.layer = #-200
    \override BarNumber.outside-staff-priority =#'()
    \override BarNumber.padding = #1
    \override BarNumber.font-size = #-1.9
    \override BarNumber.font-series = #'bold
    \override BarNumber.self-alignment-X = #0
    \override BarNumber.break-visibility = #end-of-line-invisible
  }

%   \context {
%     \Score
%     \accepts BarNumberStaff
%     \remove "Bar_number_engraver"
%     \override MetronomeMark.font-size = #1
%     \override MetronomeMark.font-shape = #'caps
%     \override BarLine.thick-thickness = 5
%     barNumberVisibility = #all-bar-numbers-visible
%     \override Timing.beamExceptions = #'()
%     \override Timing.baseMoment = #(ly:make-moment 1/4)
%   }

  \context {
    \Dynamics
    \override Hairpin.to-barline = ##f
    \override TextSpanner.outside-staff-priority = ##f
    \override TextSpanner.padding = #'()
    \override DynamicText.outside-staff-priority = ##f
    \override DynamicText.padding = #4
  }
  \context {
    \PianoStaff
    \accepts BarNumberStaff
    instrumentName = ##f
    \consists #Span_stem_engraver
  }
}

\include "jianpu.ly"

RH=  \relative c'' {
  \clef treble
  \key a \minor
  \time 3/8
  \partial 8
  \set Timing.beamExceptions = #'()
  \set Timing.baseMoment = #(ly:make-moment 1/8)
  \set Timing.beatStructure = #'(3)  %% abhängig vom Takt
  \tempo "Poco moto."
  
  \repeat volta 2 {
    e16 ( dis e dis e h d c a8 )
    r16 c, ( e a h8 ) r16 e, ( gis h
    c8 ) r16 e, ( e' dis e dis e h d c a8 )
    r16 c, ( e a h8 ) r16 e, ( c' h
  }
  \alternative {
    { a4 ) }
    { a8\repeatTie r16 h ( c16 d }
  }
  \set fingeringOrientations = #'(up)
  \repeat volta 2 {
    e8. ) g,16 ( f' e
    d8.^\markup { \finger \overtie "34" } ) f,16 ( e' d
    c8.^\markup { \finger \overtie "34" } ) e,16 ( d' c
    h8 ) r16 e, ( e' ) r r e ( e' ) r r dis,  (
    e16 )  r r16 dis ( e dis e16 dis e h d c
    a8 ) r16 c, ( e a
    h8 ) r16 e, ( gis h c8 ) r16 e, ( e' dis
    e dis e h d c
    a8 ) r16 c, ( e a h8 ) r16 e, ( c' h
  }
  \alternative {
    { a8 ) r16 h ( c d ) }
    { a8\repeatTie r16 <e-1 c'-5>-"." ( <f-1 c'-5>-"." <e-1 g-2 c-5>-"." ) }
  }

  \grace { f16-1 ( a-2 } c4-3 f16.-4 e32-3
  \set Staff.beatStructure = #'(2 1)
  e8 d)  b'16.-4 a32-3 a16-3(  g f e-3 d c 
  b8-3 a )  \acciaccatura { b32-3 ( } a32-2 g-1 a-2 b-3 
  c4^\markup { \finger \overtie "41" }  ) (d16-2 dis ) | %27
  \set Staff.beatStructure = #'(3)
  e8. e16 ( f a, | %28
  c4 d16. h32 | %29
  \set Staff.beatStructure = #'(1 1 1)
  c32-2 ) g'-5 g,-1 g' a,-1 g' h,-1 g' c,-1 g' d-1 g | %30
  e-1 g-2 c-5 h a g f-1 e-3 d-2 g-5 f-4 d-2
  c32-2 g' g, g' a, g' h, g' c, g' d g 
  e g c h a g f e d g f d
  e32-3 f-4 e dis e h e dis e h e dis
  e8.
  \set Staff.beatStructure = #'(3)
  h16 (  e dis
  e8. ) h16( e)  r
  r dis( e) r r
  \set Staff.beatStructure = #'(3)
  dis ( e dis e h d c
  a8 ) r16 c, ( e a h8 )
  r16 e, ( gis h c8 )
  r16 e, ( e' dis e dis e h d c a8 )
  r16 c, ( e a h8 ) r16 e, ( c' h
  a8 ) r16 h16 ( c d
  e8. ) g,16 ( f' e
  d8.^\markup { \finger \overtie "34" } ) f,16 ( e' d
  c8.^\markup { \finger \overtie "34" } ) e,16 ( d' c
  h8 ) r16 e,(  e' ) r
  r16 e ( e' ) r r dis,( e) r r
  dis ( e dis
  e dis e h d c
  a8 ) r16 c, ( e a
  h8 ) r16 e, ( gis h
  c8 ) r16
  e, ( e' dis
  e dis e h d c
  a8 )
  r16 c, ( e a
  h8 ) r16 e, ( c' h
  a8 ) r r |%59
  <e-1 g-2 b-3 cis-5>4.-">" |%60
  <f-1 a-2 d-5>4-">" <cis'-2 e-4>16 <d-3 f-5> |%61
  <gis,-1 d'-3 f-5>4 <gis-1 d'-3 f-5>8|%62
  <a-1 c!-3 e-5>4.|%63
  <f-1 d'-5>4( <e-1 c'-5>16 <d-1 h'-5> |%64
  <c-1 fis-3 a-5>4) <c-1 a'-5>8 |%65
  <c a'>8( <e c'> <d h'> |%66
  <c a'>4.)
  <e g b cis>4.-">"
  <f a d>4-">" <cis' e>16 <d f>
  <d f>4 q8 q4.
  <g, es'>4( <f d'>16 <es c'>
  <d f b>4) <d f a>8 <d f gis>4 <d f gis>8
  <c e! a>4 r8 <e h'>8 r r
  \tupletSpan 8
  \set Staff.beatStructure = #'(1 1 1)
  \tuplet 3/2 {
    a,16-1 ( c-2 e-3 a-1 c-3 e-5 d-4 c-3 h-2 |%77
    \omit TupletNumber
    a c e a c e d c h |%78
    \ottava #1
    a c e a c e d c-3 h-1 |%79
    b-3 a-1 gis-3 g-1 fis-3 f-2 e-1 dis-3 d-1 |%80
    \ottava #0
    cis-3 c-2 h-1 b-3 a-1 gis-3 g-1 fis-3 f-2 |%81
  }
  \set Staff.beatStructure = #'(3)
  e16-1 )( dis-3 e-4 h-1 d-3 c-2 |%82
   a8 ) r16 c, ( e a h8 ) |%83
    r16 e, ( gis h
  c8 ) r16 e, ( e' dis e dis e h d c a8 )
  r16 c, ( e a h8 ) r16 e, ( c' h
  a8 ) r16 h16 ( c d
  e8. ) g,16 ( f' e
  d8. ) f,16 ( e' d
  c8. ) e,16 ( d' c
  h8 ) r16 e, ( e' ) r
  r16 e ( e' ) r r dis,( e) r r
  dis ( e dis e dis e h d c
  a8 ) r16 c, ( e a h8 ) r16
  e, ( gis h c8)  r16 e, ( e' dis e dis e h d c a8 )
  r16 c, ( e a h8 ) r16 e, ( c' h
  < a a, >4 ) \bar "|."
}

LH =  \relative c {
  \clef bass
  \key c \major
  \partial 8
  \set fingeringOrientations = #'(left) %% für Akkorde!
  \mergeDifferentlyHeadedOn
  \mergeDifferentlyDottedOn
  \override Fingering.direction = #UP  %% für Einzelnoten!
  \override Fingering.padding = #0.2
  \override Fingering.staff-padding = #'()
  \override Fingering.avoid-slur = #'inside
  \set Staff.baseMoment = #(ly:make-moment 1/16)
  \set Staff.beatStructure = #'(3 3)
  \repeat volta 2 {
    r8
    R4. a16 e' a r16 r8 e,16 e' gis r r8
    a,16 e' a r r8 R4. a,16 e' a r r8
    e,16 e' gis r r8
  }
  \alternative {
    { a,16 e' a r }
    {
      a,16  e' a16  r
      \set Timing.measurePosition = #(ly:make-moment -1 8) r8
    }
  }
  \set fingeringOrientations = #'(down)
  \repeat volta 2 {
    c,16 g' c r
    r8 g,16 g' h r
    r8
    a,16 e' a r r8 e,16-"." e' ( e' ) r r
    \clef treble e16_ ( e') 
    r r dis e r r16 dis e r r8 R4.
    \clef bass a,,,16 e' a r16
    r8 e,16 e' gis r r8
    a,16 e' a r r8 R4. a,16 e' a r r8
    e,16 e' gis r r8
  }
  %\set Staff.beatStructure = #'(1 1 1)
  \alternative {
    { a,16 e' a r r8 }
    { a,16 e' a <b-2 c-1> <a-3 c-1> <g-4 b-2 c-1> }
  }
  \set Staff.beatStructure = #'(6)
  \grace { s16 s }
  f16 a c a c a
  f b d b d b
  f e' <f,-5 g-4 b-2> e' <f,-5 g-4 b-2> e' |%25
  f, a c a c a |%26
  f a c a c a |%27
  e a c a <d,-5 d'-1> f-4 |%28
  g16-3 e'-1 g,-4 f' g, f' |%29
  \clef treble
  <c-5 e-3>8 r16 <f-2 g-1> <e-3 g-1> <d-4 f-2 g-1> |%30
  <c-5 e-3 g-1>8
  \clef bass
  <f,-5 a-3>8 <g-4 h-2>
  \clef treble
  c8 r16 <f g> <e g> <d f g>
  <c e g>8
  \clef bass
  <f, a>8 <g h>
  <gis h>8 r r R4.
  r4 r16
  \clef treble
  dis''16 (
  e  ) r r dis ( e ) r
  R4. \clef bass
  a,,,16 e' a r16 r8
  e,16 e' gis r r8
  a,16 e' a r r8
  R4.
  a,16 e' a r r8
  e,16 e' gis r r8
  a,16 e' a r r8
  c,16 g' c r r8
  g,16 g' h r r8
  a,16 e' a r r8
  e,16 e' e' r r
  \clef treble e16_(
  e') r r dis( e) r
  r dis( e) r r8 R4.
  \clef bass a,,,16 e' a r16 r8
  e,16 e' gis r r8 a,16 e' a r r8 R4. a,16 e' a r r8
  e,16 e' gis r r8

  \repeat unfold 5 { a,16-3-"." ( a-2-"." a-1-"." a-3-"." a-2-"." a-1-".") }
  <a d,>-"."( <a d,>-"." <a d,>-"." <a d,>-"." <a d,>-"." <a d,>-".") |%64
  <a dis,>-"."( q-"." q-"." q-"." q-"." q-".") |%65
  <e a>-"."( <e a>-"." <e a>-"." <e a>-"." <e gis>-"." <e gis>-".")|%66
  <a a,> a-"."( a-"." a-"." a-"." a-".")  |%67
  \repeat unfold 3 { a-"."( a-"." a-"." a-"." a-"." a-".") }
  \repeat unfold 18 {b}
  h! h h h h h |%74
  c4 r8 |%75
  <e gis>8 r r |% 76
  a,,8 r <a'' c e> |%77
  <a c e> r <a c e> |%78
  <a c e> r <a c e> |%79
  <a c e> r r |%80
  R4. |%81
  R4. |%82
  a,16 e' a r r8
  e,16 e' gis r r8
  a,16 e' a r r8 R4.
  a,16 e' a r r8
  e,16 e' gis r r8
  a,16 e' a r r8
  c,16 g' c r r8
  g,16 g' h r r8
  a,16 e' a r r8
  e,16 e'( e') r r
  \clef treble e16 (
  e') r r dis( e) r
  r dis( e) r r8 R4.
  \clef bass a,,,16 e' a r16 r8
  e,16 e' gis r r8
  a,16 e' a r r8 R4.
  a,16  e' a r r8
  e,16  e' gis r r8
  <a, a,>4
}

pedree = {
  \repeat unfold 3 { s4 \NSus s8 \FSus }
}
pedtwo = {
  \pedree
  s4.
  \repeat unfold 2 { s4 \NSus s8 \FSus }
}

ped = {
  s8 s4.
  \override SustainPedal.self-alignment-X = #-1
  \pedtwo
  s4 s4.
  \pedree
  s4.\NSus s8. s\FSus
  s4. s
  \pedtwo
  s4. * 18
  \pedtwo
  s4.
  \pedree
  s4. \NSus s8. s \FSus
  s4. s
  \pedree
  s4. \repeat unfold 2 { s4\NSus s8\FSus }
  \repeat unfold 16 { s4\NSus s16 s\FSus }
  s4. s
  \set Dynamics.pedalSustainStyle = #'mixed
  s\NSus s s s\FSus
  s4. s
  \set Dynamics.pedalSustainStyle = #'text
  \pedtwo
  s4.
  \pedree
  s4.\NSus s8. s\FSus
  s4. s
  \pedtwo
}

dymo = {
  s8\< s4\> s4.\!
}
din = \dynamictext "dimin."

Dyn = {
  \override Hairpin.to-barline = ##t
  \override Hairpin.shorten-pair = #'(0.8 . 0.8)
  s8\pp
  \dymo
  s4. s
  \dymo
  s4. s4
  s8 s16 s8.\<
  s4.\mf
  \override DynamicText.self-alignment-X = #-0.8
  s s\din
  s\p
  s8. s\din
  s s\pp
  \dymo
  s4. s
  \dymo
  s4.
  s8. s\<
  s\!
  s8.\<
  \grace { s16\! s } s4.\dynamictext "dolce"
  s s
  s8\> s4\!
  s4.\dynamictext "cresc."
  s s\din
  s\p
  \dymo
  s8\< s8\> s8
  s4.\p
  s
  s8. s\dynamictext "dim."
  \once \override DynamicText.self-alignment-X = #0
  s8.\dynamictext "poco rit."
  s8 s16\pp
  \dymo
  s4. s
  \dymo
  s4.
  s8. s\<
  s4.\mf
  s
  s\din
  s\p s8. s\dynamictext "dimin."
  s s\pp
  \dymo
  s4. s
  \dymo
  s4. s\p
  s s
  s\f s
  s\din
  s s
  s\p s\dynamictext "cresc."
  s s\f
  s s\din
  s s s\p
  s s\pp s8 s4\dynamictext "cresc."
  s4.
  s8 s4\din
  s4.
  \grace s8\pp \dymo
  s4. s
  \dymo s4.
  s8. s\<
  s4.\mf
  s s\din
  s4.\p
  s4 s8\din
  s8. s\pp
  \dymo s4. s \dymo
  s4.\dynamictext "mancando"
}

Struktur = {
  \override Score.NonMusicalPaperColumn.page-break-permission = ##f
  %\override Score.SpacingSpanner.common-shortest-duration = #(ly:make-moment 1/1)
  \override PianoStaff.VerticalAxisGroup.staff-staff-spacing.minimum-distance = #12
  s8
  s4. * 7
  s4 s4. * 22
  \newSpacingSection
  \override Score.SpacingSpanner.common-shortest-duration = #(ly:make-moment 1/40)
  s4. * 5
  \newSpacingSection
  \override Score.SpacingSpanner.common-shortest-duration = #(ly:make-moment 1/16)
  s4. * 42
  \newSpacingSection
  \override Score.SpacingSpanner.common-shortest-duration = #(ly:make-moment 1/32)
  s4. * 5
  \newSpacingSection
  \override Score.SpacingSpanner.common-shortest-duration = #(ly:make-moment 1/12)
}

StrukturI= {
  \override Score.NonMusicalPaperColumn.page-break-permission = ##f
  s8
  s4. * 7 s4 s4. * 20 \pageBreak
  s4. * 26 \pageBreak
  s4. * 25 \pageBreak
}

\header {
  title = "Für Elise"
  subtitle = "A-Moll WoO 59"
  subsubtitle = ##f
  poet =  "Wei Zheng"
  composer = "Ludwig van Beethoven (1770-1827)"
  piece = ##f
  opus = ##f
}

\paper {
    #(set-paper-size "a4") 
  top-margin = 1.0\cm
    bottom-margin = 2.0\cm
    left-margin = 1.0\cm
    right-margin = 1.0\cm

  indent = #0
  line-width = 170\mm
  print-all-headers = ##f
  #(include-special-characters)
%   print-first-page-number = ##f
%   first-page-number = #1

  %     markup-system-spacing.padding = #4
  %     system-system-spacing.padding = #6
  %     markup-markup-spacing.padding = #2
  tagline = ##f
%   evenFooterMarkup = \markup
%   \center-column { " "
%   \fill-line { \null \concat { \char #169 " Public Domain" } \null } }

%   oddFooterMarkup = #evenFooterMarkup
%   oddFooterMarkup =\markup 
%   \center-column { " "
%   \fill-line { \null \concat {  "Quelle: Edition W. Bessel & Co., Petersburg, Platte #6051" } \null }
%   }
%   print-first-page-number = ##f
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

  top-markup-spacing.basic-distance = #1
  top-markup-spacing =
  #'((basic-distance . 1)
     (minimum-distance . 0)
     (padding . 0)
     (stretchability . 0))
  system-system-spacing =
  #'((basic-distance . 15)
     (minimum-distance . 10)
     (padding . 5)
     (stretchability . 60))
  markup-system-spacing.padding = 4
  annotate-spacing = ##f
}



\score
{
    \new PianoStaff="leadsheet"
    <<
      \new Staff="Discant" {\new Voice \RH}
      
      \new Dynamics \Dyn
      
      \new Staff="Bass"
      {
        \set Staff.midiInstrument = "acoustic grand"
        \new Voice \LH
        \new NullVoice \Struktur
        \new NullVoice \StrukturI
      }
      \new Dynamics \ped
    >>
}

