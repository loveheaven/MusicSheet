\version "2.24.0"

\header {
  title = "Twinkle, Twinkle, Little Star"
  composer = "Traditional"
  tagline = ""
}

\score {
  \new Staff {
    \clef treble
    \key c \major
    \time 4/4
    \tempo 4 = 120
    
    c'4 c' g' g' | a' a' g'2 |
    f'4 f' e' e' | d' d' c'2 |
    g'4 g' f' f' | e' e' d'2 |
    g'4 g' f' f' | e' e' d'2 |
    c'4 c' g' g' | a' a' g'2 |
    f'4 f' e' e' | d' d' c'2 |
  }
  \layout { }
  \midi { 
    \tempo 4 = 120
  }
}