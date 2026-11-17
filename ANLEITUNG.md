# DJ KOLJA ONE · Karaoke

Karaoke-System im Branddesign für zwei Einsatzfälle:

- **Mainstage** – du steuerst vom DJ-Pult: Konsole auf dem Laptop, Bühnenbild auf dem Beamer.
- **Nebenraum** – autarker Kiosk: Gäste suchen sich Songs selbst aus und starten sie selbst.

Die App ist eine reine Web-App ohne Installation. Die Karaoke-Videos kommen per offiziellem YouTube-Player.

---

## 1. Schnellstart auf dem Mac (Mainstage)

1. Ordner `kolja-karaoke` auf den Mac kopieren.
2. Doppelklick auf **`start-mac.command`** (beim ersten Mal: Rechtsklick → Öffnen). Chrome öffnet `http://localhost:8777/`.
3. **DJ-Konsole öffnen** → oben **Bühnenbild öffnen**. Das neue Fenster auf den Beamer ziehen (Beamer als *erweiterter* Bildschirm, nicht gespiegelt) und einmal hineinklicken – das schaltet Ton und Vollbild frei.
4. Song aufnehmen: Name eintragen, dann Songbuch / Suche / Link.
5. Großer Knopf (oder Leertaste): *Nächsten ankündigen* → *Start* → *Pause*.

Zum Ausprobieren ohne Internet: auf der Startseite unten **Demo-Modus**.

**Browser:** Chrome auf dem Mac. Wer in Chrome mit einem YouTube-Premium-Konto angemeldet ist, bekommt in der Regel keine Werbung vor den Videos.

## 2. Nebenraum (Kiosk)

- Startseite → **Kiosk starten**. Links läuft das Video, rechts suchen die Gäste aus.
- Ablauf für Gäste: Namen eintragen → Song wählen → wenn sie dran sind, **Start** tippen.
- „Song beenden“ funktioniert nur mit langem Druck – kein versehentliches Abbrechen.
- **DJ-Bedienung:** fünfmal auf das Logo tippen, PIN eingeben (steht in den Einstellungen des Raums). Dort: Weiter, Stopp, Lautstärke, Einstellungen, Songbuch.
- Im Kiosk sehen Gäste nur Songbuch-Titel **mit geprüftem Video** – oder alles, wenn auf dem Gerät ein YouTube-API-Schlüssel hinterlegt ist (freie Suche).

Auf dem **iPad** muss die App im Internet liegen (siehe 5.), weil das iPad keinen lokalen Server starten kann. iPadOS verlangt außerdem für jeden Videostart ein Tippen – genau dafür ist der Start-Knopf da; falls nötig, weist die App darauf hin, direkt ins Video zu tippen.

## 3. Verkabelung

**Mainstage**
- Mac → HDMI → Beamer (erweiterter Bildschirm).
- Mac-Audio → eigener Kanal am Mixer → Bose/Pronomic. Kabel, kein Bluetooth (sonst laufen Text und Ton auseinander).
- Kabelmikro → Mikrofoneingang am Mixer. Etwas Hall hilft ungeübten Stimmen.

**Nebenraum**
- iPad (oder zweiter Laptop) → per Kabel an die JBL PartyBox (AUX), Mikro direkt in den Mikrofoneingang der Box.
- Bild: Es gibt nur einen Beamer. Für den zweiten Raum einen Fernseher der Location nutzen (HDMI-Adapter) – oder das iPad auf einem Stativ als Textmonitor.

## 4. Songs: Songbuch, Suche, Link

- **Songbuch:** rund 170 Titel sind vorbereitet (Klassiker, Rock, 90er, Pop, Duette, Deutsch, Weihnachten). Jedem Titel wird einmalig ein Karaoke-Video zugeordnet: Konsole → **Songbuch** → *Video wählen*. Das ist die Qualitätskontrolle vor dem Auftritt – Tonart, Bildqualität und lange Intros vorab prüfen.
- **Suche in der App:** benötigt einen kostenlosen YouTube-API-Schlüssel (Einstellungen). Limit: rund 100 Suchen pro Tag. Wiederholte Suchen kosten nichts (Zwischenspeicher).
- **Link:** auf youtube.com suchen, Link kopieren, im Reiter *Link* einfügen. Braucht keinen Schlüssel.
- **Ohne Video:** Titel vormerken und extern abspielen (z. B. KaraFun). Das Bühnenbild kündigt die Person trotzdem an.
- **Export/Import:** das gepflegte Songbuch als Datei sichern und aufs iPad übertragen.

**YouTube-API-Schlüssel anlegen:** console.cloud.google.com → Projekt anlegen → „YouTube Data API v3“ aktivieren → Anmeldedaten → API-Schlüssel erstellen → auf die Adresse der App beschränken (HTTP-Referrer).

## 5. Ins Internet stellen (für iPad und Handy-Anmeldung)

Der Ordner ist eine statische Website. Geeignet ist jedes HTTPS-Hosting, z. B. ein Unterordner auf dem eigenen Webspace (`karaoke.deine-domain.de`), Netlify oder GitHub Pages. Den kompletten Ordnerinhalt hochladen – fertig.

## 6. Anmeldung per Handy (QR-Code) und Fernsteuerung

Dafür tauschen die Geräte Nachrichten über Supabase Realtime aus (kostenloser Tarif genügt):

1. Supabase-Projekt anlegen.
2. Projekt-URL und den öffentlichen Key (anon / publishable) in **`config.js`** eintragen und die Datei mit hochladen.
3. Ab dann zeigt das Bühnenbild einen QR-Code. Gäste scannen, tragen ihren Namen ein und wählen einen Song.

- Mainstage: Wünsche landen zuerst bei dir („Neue Wünsche“) und werden mit einem Klick aufgenommen. Abschaltbar.
- Fernsteuerung: Startseite → *Raum fernsteuern* → Raum-Code + PIN. So behältst du den Nebenraum vom Pult aus im Blick.
- Pro Veranstaltung einen neuen **Event-Code** erzeugen (Einstellungen) – alte QR-Codes sind dann wirkungslos.

Ohne Cloud funktioniert alles andere unverändert; die Gäste melden sich dann am Pult bzw. am Kiosk an.

## 7. Einstellungen im Überblick

| Einstellung | Wirkung |
|---|---|
| Faire Reihenfolge | Wer noch nicht gesungen hat, rückt vor Vielsänger. |
| Nächsten automatisch ankündigen | Nach jedem Song erscheint direkt die nächste Person. |
| Automatischer Start | Countdown nach der Ankündigung statt Knopfdruck. |
| Offene Songs pro Gast | Begrenzt Mehrfachanmeldungen. |
| Wünsche erst freigeben | Gästewünsche gehen zuerst an den DJ (Mainstage). |
| Förmliche Ansprache | „Sie“ statt „du“ für Firmenveranstaltungen. |
| Hinweiszeile | Kurzer Text im Bühnenbild („Buffet ist eröffnet“). |

## 8. Gut zu wissen

- **Recht:** YouTube ist laut Nutzungsbedingungen für private Nutzung gedacht; die GEMA-Anmeldung der Veranstaltung deckt das nicht ab. Für bezahlte Firmenveranstaltungen ist ein gewerblicher Karaoke-Dienst (KaraFun Pro) die saubere Lösung – die App kann solche Titel als „ohne Video“ führen und ankündigen.
- **Internet:** YouTube braucht eine stabile Leitung. Nie auf das Gäste-WLAN verlassen – eigenen LTE/5G-Router oder Handy-Hotspot einplanen.
- **Nicht möglich mit YouTube:** Tonart oder Tempo ändern, Offline-Betrieb.
- **Daten:** Warteschlange und Songbuch liegen im Browser des jeweiligen Geräts. „Neuer Abend“ in den Einstellungen leert alles.
- **Getestet** wurden alle Abläufe mit dem eingebauten Demo-Player. Vor dem ersten Einsatz bitte einmal mit echtem YouTube und – falls genutzt – echter Cloud-Verbindung durchspielen.
