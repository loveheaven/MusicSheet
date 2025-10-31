\version "2.24.0"

\header {
  title = "Ode to Joy"
  composer = "Ludwig van Beethoven"
  tagline = ""
}

\score {
  \new Staff {
    \clef treble
    \key d \major
    \time 4/4
    \tempo 4 = 120
    
    b'4 b' cis'' d'' | d'' cis'' b' a' |
    g'4 g' a' b' | b'4. a'8 a'2 |
    b'4 b' cis'' d'' | d'' cis'' b' a' |
    g'4 g' a' b' | a'4. g'8 g'2 |
  }
  \layout { }
  \midi { 
    \tempo 4 = 120
  }
}