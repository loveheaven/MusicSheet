\version "2.24.0"

\header {
  title = "Slur Marker Test"
  composer = "Example"
}

\score {
  \new Staff {
    \clef treble
    \key c \major
    \time 4/4
    
    % Basic slur with ~ marker
    c'4~ d'4 e'4 f'4 |
    
    % Consecutive slurs
    g'4~ a'4 b'4~ c''4 |
    
    % Mixed slurs and regular notes
    d''4~ e''4 f''4 g''4  |
    
    % Slurs with different durations
    a''2 c'2~|
    d'8 e'4~ f'8 c'2 g'1 |
    
    % Comparison with parentheses slur (also supported)
    c'4 (d'4 e'4) f'4 |

     % Test slur across measure lines
    c'4 d'4 e'2~ | f'2 g'4 a'4 |

    % Test slur with different note values
    f''2 (a''2 | f''4 g''4 a''2 | a''1) |

  }
  \layout { }
}
