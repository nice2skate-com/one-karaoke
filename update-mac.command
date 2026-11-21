#!/bin/bash
# DJ KOLJA ONE · Karaoke — auf den freigegebenen Stand bringen (Doppelklick).
# Lädt den Zweig "stable" von GitHub und ersetzt die App-Dateien in diesem Ordner.
# Eigene Inhalte in "videos" und "quiz" bleiben unberührt. Es wird nichts gelöscht.
cd "$(dirname "$0")" || exit 1
DIR="$(pwd)"
URL="https://github.com/nice2skate-com/one-karaoke/archive/refs/heads/stable.zip"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
fertig() { echo; read -r -p "Zum Schließen Enter drücken " _; exit "$1"; }

echo "DJ KOLJA ONE · Karaoke – Aktualisierung"
echo "Lade den freigegebenen Stand …"
if ! curl -fsSL --retry 3 -o "$TMP/stand.zip" "$URL"; then
  echo "Der Download hat nicht geklappt – bitte die Internetverbindung prüfen. Es wurde nichts geändert."
  fertig 1
fi
if ! unzip -q "$TMP/stand.zip" -d "$TMP/neu"; then
  echo "Die geladene Datei ist beschädigt. Es wurde nichts geändert."
  fertig 1
fi
SRC="$(find "$TMP/neu" -mindepth 1 -maxdepth 1 -type d | head -1)"
if [ ! -f "$SRC/index.html" ] || [ ! -f "$SRC/js/ui.js" ] || [ ! -f "$SRC/server.py" ]; then
  echo "Der Download ist unvollständig. Es wurde nichts geändert."
  fertig 1
fi
STAND="$(unzip -z "$TMP/stand.zip" 2>/dev/null | tail -1 | cut -c1-7)"

# App-Dateien ersetzen; eigene Videos und Quiz-Musik nicht anfassen
for f in "$SRC"/* "$SRC"/.[!.]*; do
  [ -e "$f" ] || continue
  case "$(basename "$f")" in videos|quiz|.git) continue ;; esac
  cp -R "$f" "$DIR/" || { echo "Kopieren fehlgeschlagen."; fertig 1; }
done
mkdir -p "$DIR/videos" "$DIR/quiz"
[ -f "$DIR/videos/LIESMICH.txt" ] || cp "$SRC/videos/LIESMICH.txt" "$DIR/videos/" 2>/dev/null
[ -f "$DIR/quiz/LIESMICH.txt" ] || cp "$SRC/quiz/LIESMICH.txt" "$DIR/quiz/" 2>/dev/null
chmod +x "$DIR"/*.command 2>/dev/null
# Falls macOS Dateien als „aus dem Internet geladen“ markiert hat: Markierung entfernen
command -v xattr >/dev/null && xattr -dr com.apple.quarantine "$DIR" 2>/dev/null

echo "Fertig – jetzt ist der Stand ${STAND:-?} installiert."
echo "Läuft die Karaoke-App gerade: im Browser mit Cmd+Shift+R neu laden."
fertig 0
