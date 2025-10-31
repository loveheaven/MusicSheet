\version "2.24.0"

\header {
  title = "Mary Had a Little Lamb"
  composer = "Traditional"
  tagline = ""
}

\score {
  \new Staff {
    \clef treble
    \key c \major
    \time 4/4
    \tempo 4 = 100
    
    e'4 d' c' d' | e' e' e'2 |
    d'4 d' d'2 | e'4 g' g'2 |
    e'4 d' c' d' | e' e' e'2 |
    d'4 d' e' d' | c'1 |
  }
  \layout { }
  \midi { 
    \tempo 4 = 100
  }
}