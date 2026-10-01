# Recorded 2026-09-17. Syntax: https://github.com/charmbracelet/vhs
# All fixtures and temporary browser files stay under this lane.
# VHS 0.12.0 keeps raw frames here; scripts/render-gate-2026-09-17.py encodes them
# when the installed VHS cancels its encoder context before spawning ffmpeg.
# Run from /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/process-media.
Output "/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/process-media/gate-red-green.mp4"
Output ".runtime/gate-frames/"
Require python3
Set Shell bash
Set Width 1440
Set Height 900
Set FontSize 18
Set FontFamily "Menlo"
Set LetterSpacing 0
Set LineHeight 1.2
Set Padding 28
Set Theme "Dracula"
Set Framerate 30
Set TypingSpeed 8 ms
Set CursorBlink false
Hide
Type `cd /Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/process-media`
Enter
Sleep 200 ms
Type "clear"
Enter
Sleep 200 ms
Show
Type "python3 scripts/gate-replay-2026-09-17.py --record"
Enter
Sleep 7 s
Screenshot "/Users/ls/Claude-Workspace/personal/sigouin-net/fleet-r13-assets/process-media/.runtime/gate-final-2026-09-17.png"
Sleep 100 ms
