\version "2.22.0"
\language "deutsch"

myTitel = "Alla Turca"
%mycomp=\markup \line \fontsize #-1.5 { "mozart" "♫" \hspace #-1 "♫" \hspace #-1 "♫" }

bparen =
#(define-event-function (parser location dyn) (ly:event?)
   (make-dynamic-script
    #{ \markup \concat {
      \normal-text \italic \fontsize #2 (
      \pad-x #0.2 #(ly:music-property dyn 'text)
      \normal-text \italic \fontsize #2 )
       }
    #}))

lparen =
#(define-event-function (parser location dyn) (ly:event?)
   (make-dynamic-script
    #{ \markup \concat {
      \normal-text \italic \fontsize #2 (
      \pad-x #0.2 #(ly:music-property dyn 'text)
       }
    #}))

rparen =
#(define-event-function (parser location dyn) (ly:event?)
   (make-dynamic-script
    #{ \markup \concat {
      \pad-x #0.2 #(ly:music-property dyn 'text)
      \normal-text \italic \fontsize #2 )
       }
    #}))

#(define (make-parenthesis-stencil
          y-extent thickness width angularity orientation)
   "Create a parenthesis stencil.
@var{y-extent} is the Y extent of the markup inside the parenthesis.
@var{half-thickness} is the half thickness of the parenthesis.
@var{width} is the width of a parenthesis.
@var{orientation} is the orientation of a parenthesis.
The higher the value of number @var{angularity},
the more angular the shape of the parenthesis."
   (let* ((start (cons 0 (car y-extent)))
          (stop (cons 0 (cdr y-extent)))
          (line-width 0.1)
          (bow-stil
           (make-bow-stencil
            start stop thickness angularity width orientation))
          (x-extent (ly:stencil-extent bow-stil X)))
     (ly:make-stencil
      (ly:stencil-expr bow-stil)
      (interval-widen x-extent (/ line-width 2))
      (interval-widen y-extent (/ line-width 2)))))

#(define-public (parenthesize-stencil
                 stencil half-thickness width angularity padding size)
   "Add parentheses around @var{stencil}, returning a new stencil."
   (let* ((y-extent (interval-widen (ly:stencil-extent stencil Y) size))
          (lp (make-parenthesis-stencil
               y-extent half-thickness width angularity 1))
          (rp (make-parenthesis-stencil
               y-extent half-thickness width angularity -1)))
     (ly:stencil-combine-at-edge
      (ly:stencil-combine-at-edge stencil X LEFT lp padding)
      X RIGHT rp padding)))

parenthesizeHairpin =
\override Hairpin.stencil =
#(lambda (grob)
   (parenthesize-stencil
    (ly:hairpin::print grob) ;; stencil
    0.05 ;; half-thickness
    0.4  ;; width
    0    ;; angularity
    0.2  ;; padding
    0.5  ;; additional size
    ))


RH= \relative c'' {
  \time 2/4
  \set Timing.beatStructure = #'(2 )
  \tempo "Allegretto"
  \partial 4
  h16-4( a gis a-1 |%1
  c8-.-3) r d16-3( c h c |%2
  e8-.-4) r f16-4 ( e dis e-1 |%3
  h'-4 a gis a h  a gis a  |%4
  c4)\accent a8-.-2 c-.-4 |%5
  \grace { g32( a) } h8-.-> <fis a>-.-2-4 <e g>-. <fis a>-.|%6
  \grace { g32( a) } h8-.-> <fis a>-.-2-4 <e g>-. <fis a>-. |%7
  \grace { g32( a) } h8-.-> <fis a>-.-4 <e g>-. <dis fis>-.-2-4 |%8
  e4-- |%9
  \bar ":..:"
}

RHI = \relative c'' {
  \set Staff.beatStructure = #'(1 1 )
  <c e>8-.-1-3 <d f>-. |%10
  <e g>-.-1-3 <e g>-. a16-4( g f e)
  << { d4\accent-4 } \\ { h8-2( g) } >> <c e>8-. <d f>-.
  <e g>-. <e g>-. a16-4( g f e)
  <h d>4\accent---2-4 <a c>8-.-1-3 <h d>-.
  <c e>-.-1-3 <c e>-. f16-4( e d c)
  << { h4\accent-4 } \\ { gis8-2( e) } >> <a c>8-. <h d>-.
  <c e>-. <c e>-. f16( e d c)
  <gis h>4\accent---2-4
  h16( a gis a
  c8)-. r d16( c h c
  e8)-. r f16( e dis e
  h' a gis a h a gis a
  c4*1/2) s8 a8-.-2 h-.
  c-.\accent h-. a-.-1  gis-.-2 a-. e-. f-.-4 d-.-2
  c4-- h8.-2\trill( a32 h |%25
  a4)--
  \bar ":..:"
}

RHII = \relative c''' {
  \key a \major
  \set Staff.beatStructure = #'(2 )
  <a a,>8-. <h h,>-. \grace { s32( s s) } |%27 
  <cis cis,>4\accent\tenuto <a a,>8-. <h h,>-. 
  <cis cis,>-.\accent <h h,>-. <a a,>-. <gis gis,>-. |%29
  <fis fis,>-. <gis gis,>-. <a a,>-. <h h,>-. 
  <gis gis,>-4( <e e,>)-. <a a,>8-. <h h,>-. |%31
  <cis cis,>4\accent\tenuto <a a,>8-. <h h,>-. 
  <cis cis,>-.\accent <h h,>-. <a a,>-. <gis gis,>-. \break
  <fis fis,>-. <h h,>-. <gis gis,>-. <e e,>-.
  <a a,>4\tenuto
  \bar ":..:"
}

RHIII=  \relative c''' {
  \set Staff.beatStructure = #'(1 1 )
  \override Fingering.avoid-slur = #'inside
  cis16-3( d cis h a h a gis-3 fis a gis fis
  eis-2 fis gis eis cis-1 dis eis cis
  fis-4 eis-1 fis gis a-4 gis-3 a-1 h
  cis his cis his cis d cis h)
  a( h a gis-3 fis a gis fis
  e! fis gis e cis-1 dis e cis
  dis-2 e fis dis his-1 cis dis his
  cis4--)
  \bar ":..:"
}

RHIV=  \relative c'' {
  \override Fingering.avoid-slur = #'inside
  e16-5( d! cis h!
  a h cis d-1 e fis gis a)
  a\accent-4( gis fis e) e-2 ( d-1 cis-3 h
  a-1 h cis d-1 e fis gis-4 a-1 )
  ais8\accent-4 ( h-.-5 ) e,16-5( d cis h
  a h cis d-1 e fis gis a)
  a\accent-4( gis fis e) e-2 ( d-1 cis-3 h
  cis-3 e a,-1 cis-4 h d gis,-2 h-4
  a4)-- cis'16-3 ( d cis h a h-5 a gis fis-2 a-5 gis fis
  eis-2 fis gis eis-2 cis-1 dis eis cis)
  fis-4 ( eis-1 fis gis a gis a h
  cis-3 his cis his cis his cis ais-2
  d)-4( cis d cis d cis d cis
  d cis h a gis-2 a h gis
  a h cis fis,-2 eis fis gis eis fis4)--
  \bar ":..:"
}

RHV= \relative c'' {
  \key a \major
  \set Staff.beatStructure = #'(1 1 )
  \repeat volta 2 {
    a16( a' h, h'
    cis,\accent cis') r8 a,16( a' h, h' cis, cis' h, h' a, a' gis, gis')
    fis,( fis' gis, gis' a, a' h, h' gis, gis' e, e') a,16( a' h, h'
    cis,\accent cis') r8 a,16( a' h, h' cis, cis' h, h' a, a' gis, gis')
    fis,( fis' h, h' gis, gis' e, e' ) \pageBreak
  }

  \alternative
  {
    \relative c'' {
      <a a'>4--
    }
    \relative c'' {
      \grace { s32 s32 s32 }
      <a a'>4
      << { cis'8. cis16 } \\ { cis,4 } >>
    }
  }
  \bar ""
}

strum = \relative c''' {
  \grace { s32 s32 s32 }
  <<
    {  cis2-> } \\
    {  <cis, e a>4\arpeggio }
  >>
}

RHVI= \relative c'' {
  \override Score.RehearsalMark.self-alignment-X = #-1
  \override Score.RehearsalMark.extra-offset = #'(-13 . 0 )
  \mark "Coda"
  \strum
  \strum
  \grace { s32 * 3 } d'16-4( cis)-. h-. cis-. d( cis)-. h-. cis
  \grace { s32 * 3 } <d a fis>2->
  \repeat unfold 4 { \grace { s16 d16*1/2 } <cis a e>8-. }
  \grace { s32 s32 s32 } << { h4.-3( e8)-. } \\ { <gis, e>2 } >>
  \strum
  \strum
  d'16( cis)-. h-. cis-. d( cis)-. h-. cis
  <d a fis>2->
  \grace d32( <cis a e>2)-.
  \repeat unfold 4 { \grace { s16 cis16*1/2 } <h gis e>8-. }

  a4-- \grace { e16( a) } cis8.-.-4 cis16
  \repeat unfold 2 { \grace { e,16( a) } cis2-> }
  d16( cis)-. h-. cis-. d( cis)-. h-. cis
  d2->
  \repeat unfold 4 { \grace { d32 } cis8-. }
  h4.-2( e8)-.
  << \strum \\ s4 >>
  \strum
  d16( cis)-. h-. cis-. d( cis)-. h-. cis
  \grace { s32 s32 s32 } <d a fis>2->
  \grace {
    s16
    %\once \override Stem.X-offset = #3
    %\once \override NoteHead.X-offset = #3
    d16*1/2
  } <cis a e>2-.
  {
    \grace {
      s16
      %\override NoteHead.X-offset = #1
      % \override Stem.X-offset = #3
      %\override Flag.X-offset = #1
      %\override Beam.X-offset = #1
      %\once \override GraceSpacing.
      cis16*1/2
    } <h gis e>8-.
  }
  \repeat unfold 3 { \grace { cis16 } <h gis e>8-. }
  <a,  a'>4.-- <cis cis'>8-.
  \grace { s32 * 3 } <a a'>4.-- <e' e'>8-.
  \grace { s32 * 3 } <a, a'>4.-- <cis cis'>8-.
  <a a'>-. <cis cis'>8-. <a a'>-. <e' e'>8-.
  <a, a'>4-. <a cis e a >4-.(
  <a cis e a >4)-. r4
  \bar "|."
}

LH =  \relative c' {
  r4
  a8(-5 <c e>)-. <c e>-. <c e>-.
  a8( <c e>)-. <c e>-. <c e>-.
  a8-. <c e>-. a8-. <c e>-.
  a8( <c e>)-. <c e>-. <c e>-.
  \grace { s32( s) } e,8-.-> <h' e>-. <h e>-. <h e>-.
  e,-.-> <h' e>-. <h e>-. <h e>-.
  e,-.-> <h' e>-. h,-. h'-.
  e,4--
}

LHI = \relative c {
  \repeat unfold 2 { r4  c8-. c'-. e,-. e'-.  g,4 }
  \repeat unfold 2 { r4  a,8-. a'-. c,-. c'-.  e,4 }
  r4 a8( <c e>)-. <c e>-. <c e>-.
  a8( <c e>)-. <c e>-. <c e>-.
  a8-. <c e>-. a8-. <c e>-.
  f,8( <a dis>)-. <a dis>-. <a dis>-.
  e-. <a e'>-.  d,!-. <f h>-.
  c-. <e a>-. d-. <f h>-.
  <e a>-.-4-1 <e a>-. <e gis>-.-4-2 <e gis>-.
  <a, a'>4--
}

stra = \relative c {
  \grace { a32( cis  e) }
  a8-.-> a-. a-. a-.
}

strd = \relative c, {
  \grace { d32( fis  a) }
  d8-.-> d-.
}

strdd = \relative c, {
  \grace { d32( fis  a) }
  d8-.-> d-. d-. d-.
}

strdis = \relative c, {
  \grace { dis32( fis  a) }
  dis8-.-> dis-.
}

strdisdis = \relative c, {
  \grace { dis32( fis  a) }
  dis8-.-> dis-. dis-. dis-.
}

stre = \relative c, {
  \grace { e32( gis  h) }
  e8-.-> e-.
}

stree = \relative c, {
  \grace { e32( gis  h) }
  e8-.-> e-. e-. e-.
}

LHII = \relative c {
  \key a \major
  r4
  \stra \stra
  \strd \strdis
  \stre e8-. e-. \stra \stra \strd \stre
  a,4
}

LHIII=  \relative c {
  r4
  fis8-5( <a cis>)-. <a cis>-. <a cis>-.
  gis8-4( <h cis>)-. <h cis>-. <h cis>-.
  fis8( <a cis>)-. <a cis>-. <a cis>-.
  eis8( <gis cis>)-. <gis cis>-. <gis cis>-.
  fis8( <a cis>)-. <a cis>-. <a cis>-.
  gis8( <cis e!>)-. <cis e>-. <cis e>-.
  gis8( <dis' fis>)-. <dis fis>-. <dis fis>-.
  <cis e>4--
}

LHIV=  \relative c' {
  r4
  a8( <cis e>)-. <cis e>-. <cis e>-.
  h-. <d e>-. gis,-. <d' e>-.
  a8( <cis e>)-. <cis e>-. <cis e>-.
  e,8( <gis d'>)-. <gis d'>-. <gis d'>-.
  a8( <cis e>)-. <cis e>-. <cis e>-.
  h-. <d e>-. gis,-. <d' e>-.
  a-.-1 fis-.-2 d-. e-. a,-. a'-. r4

  fis8( <a cis>)-. <a cis>-. <a cis>-.
  gis8( <h cis>)-. <h cis>-. <h cis>-.
  fis8( <a cis>)-. <a cis>-. <a cis>-.
  cis,( <gis' cis>)-. <g cis>-. <fis cis'>-.
  h,8( <fis' h>)-. <fis h>-. <fis h>-.
  h,8( <gis'! h>)-. <gis h>-. <gis h>-.
  cis,-. <fis a>-. cis-. <gis' h>-. <fis a>4--
}

LHV = \relative c' {
  \repeat unfold 4 \stra
  \strdd \stra
  \stree  \repeat unfold 3 \stra
  \strdd \stra \stree
  \set Voice.beatStructure = #'(1 1 )
  a16( e' cis e a, e' cis  e)
  \repeat unfold 6 { a,16 e' cis e }
  \repeat unfold 2 { a,16 fis' d fis }
  \repeat unfold 2 { a,16 e' cis e }
  \repeat unfold 2 { e,16 e' gis, e' }
  \repeat unfold 3 \stra \strdd
  \stra \stree \repeat unfold 3 \stra
  \grace { a,,32( cis  e) }
  a8-.-> a-.
  \grace { a,32( cis  e) }
  a8-.-> a-.
  a,4 <a cis e a >-.(q )r
}

semp=\markup { \dynamic f \normal-text \italic "sempre" }
fsemp = #(make-dynamic-script semp)
crpar=\markup {\normal-text \italic "(cresc)" }
ccrpar = #(make-dynamic-script crpar)
Dyn= {
  \override DynamicTextSpanner.style = #'none
  s4\p s2 s4 s4\cresc
  s2*2 s2\bparen \mf
  s2 \parenthesizeHairpin { s2\> s4 s4\!\bparen \f }
  s2 s4 s4\bparen \p
  s4 s4\bparen \f s2 s4 s4\bparen \p
  s2 * 4
  s4\ccrpar
  s4\f s4\p
  s2 * 2 s4 s4\f
  s2 * 7 s4 s4\p
  s2 * 5 s4 s4\bparen \mf
}

Struktur =
{
  %\override Score.NonMusicalPaperColumn.page-break-permission = ##f
  \override Score.NonMusicalPaperColumn.line-break-permission = ##f
  s4
  s2 * 4 \grace s16 s2 \break
  \grace s16 s2 \grace s16 s2
  s2 * 4 \break
  s2 * 6 \break
  s2 * 6 \grace s16. s2 \break
  \grace s16. s2 s2 * 6 \break
  s2 * 5 \break
  s2 * 5 \break
  s2 * 5 \break
  s2 * 5 \break
  s2 * 5 \break
  \grace s16. s2 s2 * 5 \break
  \grace s16. s2 s2 * 5 \break
  \grace s16 s2 s2 * 5 \break
  s2 * 6 \break
  s2 * 6 \break
  s2 * 4 \grace s16. s2 \break
  \grace s16. s2 s2 * 3 \grace s16. s2 \break
  s4 s2 * 3 \grace s16. s2 \break
  \grace s16. s2 s2 s s \grace s16. s2 \break
  \grace s16. s2 s2 * 4 \grace s16 s2 \break
  s2 * 4 \grace s16. s2 \break
  \grace s16. s2 s2 * 4 \grace s16 s2 \break
  \grace s16. s2
}

  \header {
    title = \myTitel
    subtitle = "aus der Sonata KV 331"
    subsubtitle = ##f
    poet = ##f
    composer = "W. A. Mozart (1756-1791)"
    piece = ##f % "Allegretto"
  }
  
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

  % \context {
  %   \Score
  %   \accepts BarNumberStaff
  %   \remove "Bar_number_engraver"
  %   \override MetronomeMark.font-size = #1
  %   \override MetronomeMark.font-shape = #'caps
  %   \override BarLine.thick-thickness = 5
  %   barNumberVisibility = #all-bar-numbers-visible
  %   \override Timing.beamExceptions = #'()
  %   \override Timing.baseMoment = #(ly:make-moment 1/4)
  % }

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
    %min-systems-per-page = #6
  }

  \include "jianpu.ly"

  theMusic = {
    \new PianoStaff="leadsheet"
    <<
      \new Staff="Discant"
      <<
        \new Voice
        {
          \RH \RHI \RHII \RHIII \RHIV
          \RHII
          \RH \RHI \RHV \RHVI
        }        
      >>
      \new JianpuStaff \with {
            \remove "Key_engraver"
            \remove "Time_signature_engraver"
            }  \jianpuMusic { 
                \context Voice = "PartPOneVoiceOnef" { 
                  \omit Fingering
                   \RH \RHI \RHII \RHIII \RHIV
          \RHII
          \RH \RHI \RHV \RHVI }
            }
      \new Dynamics \Dyn
      \new Staff="Bass"
      <<
        \set Staff.midiInstrument = "acoustic grand"
        \new Voice
        {
          \clef bass
          \LH \LHI \LHII \LHIII \LHIV
          \LHII
          \LH
          \LHI \LHII \LHV
        }
        \new NullVoice \Struktur        
      >>
      \new JianpuStaff \with {
            \remove "Key_engraver"
            \remove "Time_signature_engraver"
            }  \jianpuMusic { 
                \context Voice = "PartPOneVoiceOnef" { 
                  \omit Fingering
                   \clef bass
          \LH \LHI \LHII \LHIII \LHIV
          \LHII
          \LH
          \LHI \LHII \LHV }
            }
    >>
  }

  \score
  {
    \theMusic    
  }

  \score
  {
    \unfoldRepeats { 
        \theMusic
    }
    \midi {}
  }