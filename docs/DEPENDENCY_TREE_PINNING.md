# Dependency Tree Pinning

## What It Does

Pins the dependency tree to a specific file so it doesn’t change when you navigate to other files.

## How to Use

### Pin a File

Click the pin icon next to the file name in the Dependencies view.

The file name will become bold and show “PINNED” on the right.

### Unpin a File

Click the pinned icon next to the file name.

The file name returns to normal and the tree follows your active file again.

## Why Use It?

Problem: When you click on a dependency, the tree changes to show that file’s dependencies. You lose track of your original file’s structure.

Solution: Pin your original file. Now you can click through dependencies while the tree stays locked to your original file.

##

## Notes

Only one file can be pinned at a time

Pin stays active until you unpin (no timeout)

Pin doesn’t persist after closing VS CodeWorks from toolbar, inline action, or right-click menu

## Structure Breakdown:

Root Level:

_Demo.ahk the main file being analyzed, locked as root)

Anything inside of the {} is the darker grey text.

Dependency Chain:

_Demo.ahk {1 includes}└─ #includes Library_lvl1.ahk {2 includes}├─ #includes Library_lvl2a.ahk└─ #includes Library_lvl2b.ahk {2 includes}├─ #includes Library_lvl3a.ahk└─ #includes Library_lvl3b.ahkLegend:

📚 = File with children (collapsible/expandable)

📄 = Leaf file (no children)

(X includes) = Number of direct child dependencies

Visual Indicators:Indentation = Dependency level depth

“2 includes” = Count of direct #include statements in that file

“Pinned” badge = This file is locked as the dependency tree root and shows the icon all the way to the right at all times if it’s pinned. If it’s unpinned do not show the unpinned icon unless you mouse over the unpinned icon.

