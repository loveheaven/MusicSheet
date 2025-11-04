\version "2.24.0"

\header {
  title = "Ottava Test"
  composer = "Test"
  tagline = ""
}

\score {
  \new Staff {
    \clef treble
    \key c \major
    \time 4/4
    \tempo 4 = 120
    
    c'4 d' e' f' |
    \ottava #1
    g' a' b' c'' |
    d'' e'' f'' g'' |
    
    a' b' c'' d'' |
    \ottava #0
    e'' f'' g'' a'' |
  }
  \layout { }
  \midi { 
    \tempo 4 = 120
  }
}
