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

## 4a. Eigene Videodateien (ohne Internet, ohne Werbung)

- Gekaufte Karaoke-Videos (MP4 oder WebM) in den Ordner **`videos`** neben der App legen. Dateiname am besten `Interpret - Titel.mp4`.
- Die App über **`start-mac.command`** starten (nicht über die Internet-Adresse) – nur dann sieht sie den Ordner.
- In der Konsole erscheint der Reiter **Dateien**. Im Songbuch verknüpft **„Eigene Dateien zuordnen“** passende Dateinamen automatisch mit den Titeln.
- Der QR-Code für die Handy-Anmeldung funktioniert auch im lokalen Betrieb; er zeigt auf die Adresse aus `config.js` (`publicUrl`).
- Alternativ lässt sich im Reiter **Link** die direkte https-Adresse einer Videodatei einfügen (z. B. vom eigenen Server).
- Der Ordner `videos` ist von der Versionsverwaltung ausgenommen – die Dateien landen nicht im Internet.

**MP3+G (CDG):** Viele Karaoke-Shops liefern Titel als Paar aus `Interpret - Titel.cdg` (Textgrafik) und `Interpret - Titel.mp3` (Musik), oft in einer ZIP-Datei.
- ZIP entpacken und **beide** Dateien mit gleichem Namen in den Ordner `videos` legen. Neben MP3 gehen auch M4A, OGG, WAV und AAC.
- Im Reiter **Dateien** erscheint nur die `.cdg`. Die App zeichnet die Liedtext-Grafik im Takt der Musik, Vor- und Zurückspulen funktioniert.
- Die Tonart-Verschiebung (4b) funktioniert auch hier, weil die Musik eine eigene Datei ist.
- **KFN (KaraFun-Dateien) geht nicht:** Das ist das hauseigene, teilweise verschlüsselte Format von KaraFun und nur für den KaraFun-Player gedacht. Solche Titel über den KaraFun-Modus (4c) abspielen oder als MP4/CDG kaufen (z. B. bei Karaoke Version).

## 4b. Tonart ändern (Key Shift)

- Funktioniert bei **eigenen Videodateien** im Ordner `videos` (lokaler Start über `start-mac.command`). Bei YouTube-Videos ist es technisch nicht möglich, weil der Browser keinen Zugriff auf deren Ton gibt.
- **Vorher einstellen:** Stift am Eintrag in der Warteschlange → „Tonart“ (−6 bis +6 Halbtöne). Der Eintrag zeigt dann z. B. „Tonart +2“.
- **Während des Songs:** in der Konsole unter dem laufenden Titel mit − und +. Im Kiosk hat die singende Person dieselben Knöpfe.
- Das Tempo bleibt gleich. Mit geänderter Tonart ist der Ton etwa eine Zehntelsekunde verzögert; bei „Original“ läuft er unverändert durch.
- Größere Sprünge (ab etwa ±4) klingen hörbar bearbeitet.

### Tonart bei YouTube (Versuch)

Die Konsole kann den Ton des Bühnenbild-Fensters abgreifen, verschieben und selbst ausgeben. Das geht nur in Chrome auf dem Mac und ist nicht mit echtem YouTube erprobt.

1. Bühnenbild öffnen und einmal anklicken, wie gewohnt.
2. In der Konsole rechts unter „Tonart für YouTube (Versuch)“ auf **Ton des Bühnenbilds abgreifen**.
3. Im Chrome-Dialog den Reiter „Chrome-Tab“ wählen, den Tab **Bühnenbild** anklicken, „Tab-Audio freigeben“ angehakt lassen, **Teilen**.
4. Ab jetzt haben auch YouTube-Titel die Tonart-Knöpfe. Bei „Original“ läuft der Ton unverändert durch.

- Der Ton kommt dann aus dem Konsolen-Fenster. Das Fenster muss offen bleiben; die Freigabe ist nach jedem Neuladen neu nötig.
- Der Ton ist leicht verzögert, der Liedtext läuft minimal voraus.
- Chrome zeigt die Freigabe an (Hinweisleiste, eventuell ein Rahmen um das Bühnenbild). Vor dem Auftritt auf dem Beamer prüfen.
- Meldet die Konsole, dass der Originalton zusätzlich weiterläuft, ist der Abgriff auf diesem Rechner nicht brauchbar.

## 4c. KaraFun-Modus

KaraFun lässt sich vom Mac oder iPad aus nicht fernsteuern. Die App übernimmt deshalb Anmeldung, Reihenfolge und Ankündigung, abgespielt wird von Hand in KaraFun.

- Einschalten: Einstellungen → **KaraFun-Modus**. Titel ohne Video gelten dann als KaraFun-Titel statt als offener Wunsch.
- Ablauf pro Song: „Nächsten ankündigen“ → Bühnenbild zeigt Name und Titel → **Titel kopieren** und in KaraFun suchen, dort starten → nach dem Song in der Konsole **Fertig**.
- Tonart: am Eintrag einstellbar (Stift) als Merkhilfe. Die Konsole erinnert daran, eingestellt wird in KaraFun.
- Auf dem Beamer muss während des Songs das KaraFun-Fenster vorn liegen, davor und danach das Bühnenbild.

## 4d. Battle und Musik-Quiz

Beides startest du in der Konsole über **Spiele**. Mitgemacht wird am Handy über den QR-Code der Anmeldung.

- **Battle:** zwei Namen eintragen (vorgeschlagen sind die beiden letzten Auftritte) → „Abstimmung starten“. Das Publikum stimmt ab, jede Person hat eine Stimme und kann sie bis zur Auflösung ändern. „Auflösen“ zeigt Sieger und Prozente.
- **Schutz gegen Mehrfachstimmen:** Jedes Handy hat eine Stimme. Der DJ-Rechner merkt sich, wann sich ein Handy zum ersten Mal gemeldet hat. Stimmen von Geräten, die erst während der Abstimmung auftauchen (typisch für ein privates Fenster oder gelöschten Browser-Speicher), zeigt die Konsole getrennt an. Stimmen viele neue Geräte fast alle für dieselbe Seite, erscheint eine Warnung. Beim Auflösen wählst du „Auflösen mit allen Stimmen“ oder „Nur bekannte Geräte werten“. Bekannt ist ein Handy, das die Gäste-Seite schon vor dem Start des Battles geöffnet hatte.
- **Grenze:** Völlig verhindern lässt sich Mehrfachabstimmen ohne Anmeldung nicht. Wer schon vor dem Battle mehrere private Fenster öffnet, zählt als mehrere bekannte Geräte.
- **Quiz:** 20 Quizze mit je 8 Fragen. Die Frage steht auf dem Bühnenbild, vier Antworten am Handy. „Auflösen“ zeigt die richtige Antwort und die Rangliste, „Nächste Frage“ geht weiter, am Ende steht der Endstand.
- **Punkte nach Kahoot-Prinzip:** Eine richtige Antwort bringt 500 bis 1000 Punkte – sofort getippt fast 1000, nach 20 Sekunden 500. Falsche oder fehlende Antworten bringen nichts.
- **Serienbonus:** Ab der zweiten richtigen Antwort in Folge gibt es zusätzlich +100, dann +200 usw., höchstens +500 pro Frage. Eine falsche Antwort setzt die Serie zurück.
- **Genaue Zeitmessung:** Das Handy misst die Antwortzeit selbst, vom Erscheinen der Frage bis zum Tippen. So zählt die Funk-Verzögerung nicht. Gemeldete Zeiten werden nur übernommen, wenn sie höchstens 2 Sekunden unter der am DJ-Rechner gemessenen Zeit liegen.
- **Song erkennen (mit Musik):** eigene Musikdateien in den Ordner `quiz` legen, Dateiname `Interpret - Titel.mp3`, mindestens vier Stücke. Die App muss lokal laufen (`start-mac.command`, unter Windows `start-windows.bat` mit installiertem Python). Das Bühnenbild spielt je Frage 20 Sekunden aus der Mitte des Stücks, zur Wahl stehen der richtige Titel und drei andere. „Nochmal anspielen“ wiederholt den Ausschnitt.
- **Ablauf je Frage wie bei Kahoot:** Frage → Auflösung (richtige Antwort und Zahl der Tipps je Antwort) → eigene Seite „Zwischenstand“ (Top 5 mit Punkten der Runde, Serie und Platzwechsel ▲ ▼) → nächste Frage. In der Konsole heißen die Knöpfe „Auflösen“, „Zwischenstand zeigen“, „Nächste Frage“, nach der letzten Frage „Siegerpodest zeigen“.
- **Auf dem Handy:** während der Frage ein Zeitbalken (bei „Automatisch weiter“), bei der Auflösung groß „Richtig! +950 Punkte“ samt Serienbonus bzw. „Leider falsch“ mit der richtigen Antwort, dazu der eigene Platz und der Abstand („120 Punkte hinter Fiona“ oder „Du führst mit … Vorsprung“). Beim Zwischenstand die Top 5 mit der eigenen Zeile, auf Wunsch alle Plätze.
- **Alle haben geantwortet:** Im Automatik-Modus wird dann sofort aufgelöst statt die 20 Sekunden abzuwarten. Ohne Automatik zeigt die Konsole „alle haben geantwortet“.
- **Siegerpodest:** Am Ende erscheinen die ersten drei auf einem Podest, das nacheinander wächst (Platz 3, 2, 1). Auf dem Handy steht dazu „Du bist Platz …“. Bei Punktgleichstand stehen beide mit gleicher Platznummer auf dem Podest.
- **Automatisch weiter:** Schalter im Spiele-Dialog – 20 Sekunden pro Frage (oder bis alle geantwortet haben), 6 Sekunden Auflösung, 7 Sekunden Zwischenstand, dann die nächste Frage – ohne Knopfdruck.
- **Anmeldezeit:** Jedes Quiz beginnt mit einer Minute zum Anmelden: Countdown und QR-Code auf dem Bühnenbild, dazu Musik aus dem Ordner `quiz`, die zum Thema passt. „Jetzt starten“ (Konsole) bzw. „Sofort starten“ (Kiosk) kürzt ab.
- **Bilder:** eigene Bilder in `quiz/bilder` legen – `queen.jpg` für das ganze Quiz, `queen-3.jpg` für Frage 3. Die Kennungen stehen in `quiz/LIESMICH.txt`. Bilder erscheinen nur im lokalen Betrieb und nur auf Bühnenbild und Kiosk.
- **Im Kiosk:** Knopf „Quiz spielen“ rechts. Das Quiz läuft von selbst; geantwortet wird direkt am Bildschirm (als ein gemeinsames Team) oder per Handy über den QR-Code. „Quiz beenden“ bricht ab.
- Eigene Fragen: Datei `js/quiz.js`, Aufbau steht oben in der Datei.

## 4e. Songbuch schnell füllen und prüfen

Beides im Songbuch-Dialog der Konsole (als angemeldeter DJ).

- **Playlist importieren:** Link einer YouTube-Playlist einfügen (oder die Kanal-ID, die mit `UC` beginnt, dann werden alle Videos des Kanals gelesen). Die App sucht darin passende Videos zu den offenen Titeln, sortiert gesperrte vorher aus und zeigt eine Vorschau mit Haken. Danach „Ausgewählte übernehmen“. Das kostet etwa eine Kontingent-Einheit je 50 Videos, die Suche dagegen 100 je Titel – so lassen sich viele Titel an einem Tag zuordnen. Der Abgleich ist streng (alle Wörter des Titels und mindestens ein Wort des Interpreten), trotzdem die Vorschläge kurz ansehen.
- **Videos prüfen:** Ein Knopf prüft alle zugeordneten YouTube-Videos auf: Einbetten gesperrt, in Deutschland gesperrt, altersbeschränkt, privat oder gelöscht. Betroffene Titel bekommen eine Markierung und lassen sich mit „Nur Probleme“ filtern. „Problem-Zuordnungen lösen“ macht sie wieder offen. Vor jedem größeren Auftritt einmal laufen lassen.
- **Kontingent:** Der Dialog zeigt, wie viel vom Tageskontingent (10.000 Einheiten) dieses Gerät heute verbraucht hat. Verbrauch anderer Geräte oder der Google-Konsole wird nicht mitgezählt.

## 4g. Namensfilter, Impressum und Datenschutz

- **Namensfilter:** Namen und frei getippte Wünsche von Gästen werden geprüft, bevor sie auf dem Bildschirm erscheinen. Er erkennt Beleidigungen, Obszönes und rechtsextreme Begriffe, auch bei Tricks wie „f4ck“ oder „f u c k“, und lässt normale Namen durch. Der Gast sieht nur „Dieser Name ist hier leider nicht möglich“. Gilt auch für Quiz-Namen. Titel aus dem Songbuch sind ausgenommen, sie kommen vom DJ.
- **Einstellungen:** „Namen und Wünsche filtern“ lässt sich ausschalten. Unter „Eigene gesperrte Wörter“ ergänzt du Begriffe, z. B. Namen von Vorgesetzten. Die eingebaute Liste steht in `js/filter.js`.
- **Grenze:** Der Filter ist ein Hilfsmittel, kein Garant. Wer sich viel Mühe gibt, kommt durch. Bei Firmenfeiern bleibt die Freigabe von Wünschen auf der Mainstage die sicherste Einstellung.
- **Impressum und Datenschutz:** In `config.js` bei `legal` die vollständigen Adressen der beiden Seiten eintragen. Sie erscheinen dann unten auf der Gäste-Seite und der Startseite. Solange sie fehlen, erinnert die Konsole in den Einstellungen daran.
- **Hinweis zur Datenverarbeitung:** Auf der Gäste-Seite öffnet ein Link einen kurzen, sachlichen Text dazu, was die App mit Namen und Wünschen macht. Er ersetzt keine Datenschutzerklärung. In deiner eigenen Erklärung sollten Supabase (Nachrichtenkanal), Cloudflare (Auslieferung) und die YouTube-Vorschaubilder erwähnt sein.

## 4h. Eingefrorener Stand für Auftritte

Es gibt zwei Zweige im Repository:

- **`main`** ist die Werkbank. Hier landet jede Änderung sofort.
- **`stable`** ist der geprüfte Stand. Nur er ist unter `karaoke.dj-kolja-one.de` und `one-karaoke.pages.dev` erreichbar, wenn Cloudflare so eingestellt ist (Einstellung unten).

Ablauf:
1. Neue Funktionen kommen auf `main` und lassen sich dort in der Vorschau ausprobieren (Cloudflare erzeugt für `main` eine eigene Vorschau-Adresse, unter „Deployments“ zu finden).
2. Passt alles, gibst du frei: „Stand freigeben“ – dann kopiert Claude `main` nach `stable`. Erst danach ändert sich die Live-Seite.
3. **Vor einem Auftritt:** den Stand ein paar Tage vorher freigeben, auf allen Geräten testen und bis nach dem Auftritt nichts mehr freigeben.
4. **Zurück zum alten Stand:** im Cloudflare-Dashboard unter „Deployments“ beim gewünschten Eintrag „Rollback to this deployment“. Das geht in Sekunden und ohne Programmierung.

Einmalig in Cloudflare einstellen (Workers & Pages → one-karaoke → Settings → Build → Branch control): **Production branch** von `main` auf `stable` ändern und speichern.

Den lokalen Kiosk-Mac immer aus dem freigegebenen Stand laden: `https://github.com/nice2skate-com/one-karaoke/archive/refs/heads/stable.zip`

## 4i. Kiosk-Mac aktualisieren

Im App-Ordner liegt **`update-mac.command`**. Doppelklick genügt:
- Das Skript lädt den freigegebenen Stand (`stable`) und ersetzt die Programmdateien.
- Die Ordner `videos` und `quiz` mit deinen eigenen Dateien bleiben unangetastet.
- Die macOS-Sperre (`xattr`) entfernt das Skript selbst. Am Ende steht, welcher Stand installiert ist.
- Danach `start-mac.command` neu starten bzw. das Browserfenster neu laden.

Nur beim allerersten Mal (das Skript ist noch nicht auf dem Mac): ZIP wie bisher laden, entpacken, einmal `xattr -dr com.apple.quarantine` auf den Ordner ausführen. Ab dann nur noch `update-mac.command`.

## 4j. Firmenfeiern: Name und Logo des Gastgebers

Konsole → Einstellungen → **Veranstaltung**:
- **Name der Veranstaltung** (z. B. „Sommerfest Musterfirma“): erscheint auf dem Bühnenbild, im Kiosk und auf den Handys.
- **Logo des Gastgebers**: PNG, JPG, WebP oder SVG wählen. Es wird verkleinert und auf diesem Rechner gespeichert, steht neben dem DJ-KOLJA-ONE-Logo (Startbild, Infoleiste, Kiosk, Handy).
- **Logo auf hellem Grund zeigen**: für dunkle Logos (an), für helle Logos mit transparentem Hintergrund aus.
- Nach der Feier: Logo **Entfernen** und Namen löschen.

Das Logo liegt auf dem Gerät, das den Raum führt (Konsole bzw. Kiosk). Für den Nebenraum also am Kiosk-Mac über die DJ-Bedienung eintragen.

## 4k. Abschluss des Abends

Konsole → **Abschluss**:
- **Abschlussfolie zeigen**: Das Bühnenbild zeigt „Danke fürs Mitsingen!“, die Zahlen des Abends (Auftritte, Stimmen, Songs) und die fünf meistgesungenen Songs. Ein laufender Song wird nicht verdeckt – die Folie erscheint danach.
- **Link zur Bewertung** (z. B. dein Google-Bewertungslink, muss mit `https://` beginnen): erscheint als QR-Code auf der Folie und als Knopf „Jetzt bewerten“ auf den Handys.
- **Abend als Datei speichern**: alle Songs des Raums als CSV-Tabelle (öffnet sich in Excel oder Numbers). Namen der Gäste nur bei Bedarf mit exportieren.
- Die **Statistik** (mit DJ-Anmeldung) lässt sich ebenfalls als CSV speichern.

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

## 6a. DJ-Anmeldung, Cloud-Songbuch und Statistik

- **Anmelden:** Konsole → Einstellungen → DJ-Anmeldung. Beim ersten Mal „Konto anlegen“, den Link in der Bestätigungs-E-Mail anklicken, danach anmelden. Das erste Konto wird automatisch DJ; weitere Konten haben keine Schreibrechte.
- **Cloud-Songbuch:** Als angemeldeter DJ gelten Video-Zuordnungen und eigene Titel für alle Geräte. Lesen kann jedes Gerät ohne Anmeldung, ändern nur der DJ. Was vorher nur lokal gespeichert war, wird beim Anmelden hochgeladen.
- **Statistik:** Knopf „Statistik“ in der Konsole. Gezählt wird jeder zu Ende gesungene oder nach dem Start beendete Titel – nur auf Geräten, an denen der DJ angemeldet ist, und ohne Namen der Gäste.
- **Eigene Dateien:** In der Cloud steht nur der Dateiname. Abspielen lässt sich die Datei nur dort, wo sie im Ordner `videos` liegt.
- **Kiosk-iPad:** Für die Statistik auch dort einmal anmelden (fünfmal aufs Logo → PIN → Einstellungen).

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
