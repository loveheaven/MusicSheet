\\version "2.24.0"

\\header {
  title = "Test Variables"
  composer = "Test"
}

upperVoice = \\relative c' { c4 d e f | g2 g }
lowerVoice = \\relative c { c4 d e f | g2 g }

\\score {
  \\new PianoStaff <<
    \\new Staff = "upper" { \\upperVoice }
    \\new Staff = "lower" { \\lowerVoice }
  >>
  \\layout { }
}
