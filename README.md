# G04Musik v0.7.0

![G04Musik](art/social-preview.png)

**Eigene Musik, Musikvideos, Radio und YouTube in einer App** – als installierbare Web-App für
**Handy, Tablet und Desktop**. Ohne Backend, ohne Konto, ohne Tracking. Deine Dateien bleiben auf dem Gerät.

**Live:** https://paulfv.github.io/G04Music/

Gebaut wie [G04TV](https://github.com/PaulFV/G04TV): reines HTML, CSS und JavaScript, kein Framework.

---

## Was G04Musik kann

| Bereich | Beschreibung |
|:--|:--|
| **Abspielfenster** | Steht fest oben in Musik, Radio und YouTube – der Inhalt scrollt darunter. Auf dem Handy kompakt, Zusatzknöpfe hinter „⋯“ |
| **Musik** | Reiter **Songs**, **Alben**, **Videos**, **Listen**, **Favoriten** – eigene Songs und Musikvideos, eigene Listen, Musik-Favoriten |
| **Radio** | Reiter **Sender**, **Favoriten**, **Zuletzt** – über 30.000 Sender über [radio-browser.info](https://www.radio-browser.info), nach Land, Genre oder Namen. Zeigt **Künstler, Titel, Cover, Album und Jahr** des laufenden Lieds, wenn der Sender den Titel meldet (aufklappbare Infos, auf dem Handy über „⋯“ → Songinfos) |
| **YouTube** | Reiter **Suche**, **Favoriten**, **Zuletzt** – direkt suchen und abspielen; ein eingefügter YouTube-Link landet in den Favoriten |
| **Einstellungen** | **Sprache** Deutsch/English und **Hell/Dunkel** (auch per Knopf in der Kopfzeile), **Feedback & Ideen** (direkt an den Entwickler), **Als App installieren** (wie in G04TV: Wege für iPhone/iPad, Android, Computer, „Jetzt installieren“), Klangbalken, Bildschirm an, Einschlaf-Timer, Wiederholen, Zufall, Bibliothek |
| **Erster Start** | Bei leerer Bibliothek zeigt Musik einen Willkommens-Bereich mit drei großen Knöpfen: eigene Musik hinzufügen, Radio hören, YouTube durchsuchen |

### Eigene Dateien
* **Musik:** MP3, M4A/AAC, FLAC, WAV, OGG, Opus (je nach Browser auch AIFF, WMA)
* **Musikvideos:** MP4, M4V, WebM, MOV; MKV meist in Chrome und Edge. AVI und WMV können Browser in der Regel nicht.
* Titel, Künstler, Album, Nummer und **Cover** werden aus den Tags gelesen (ID3 bei MP3, iTunes-Tags bei M4A/MP4). Ohne Tags
  hilft der Dateiname („Künstler - Titel.mp3“). Videos bekommen automatisch ein Vorschaubild.
* Ganze **Ordner** auf einmal (Desktop-Browser). Gespeichert wird in der **IndexedDB** des Browsers.

### Vom DS-Server (Synology DiskStation)
Musik → Songs → **DS-Server** (oder Einstellungen → Bibliothek). Zwei Wege:
* **Audio Station:** alle Titel der Musikbibliothek mit Künstler und Album, durchsuchen, einzeln oder alle auswählen.
* **DS File (Ordner):** freigegebene Ordner durchblättern, einzelne Dateien oder einen **ganzen Ordner samt Unterordnern** importieren.

Die Titel werden auf das Gerät geladen und laufen danach ohne Verbindung. Schon vorhandene Titel werden übersprungen.
Anmeldung mit Benutzername und Passwort, auch mit 2-Faktor-Code. Das Passwort wird nicht gespeichert, nur Adresse und Benutzername.

**Einrichtung auf der DiskStation (einmalig):** Browser erlauben einer Web-App den Zugriff nur, wenn die DiskStation es freigibt.
1. DiskStation über **https** erreichbar machen (z. B. `https://name.synology.me`, DDNS + Let’s-Encrypt-Zertifikat).
2. DSM → Systemsteuerung → Anmeldeportal → Erweitert → **Reverse Proxy** → Erstellen:
   Quelle HTTPS, deine Adresse, freier Port (z. B. `5443`) → Ziel HTTP, `localhost`, Port `5000`.
3. Reiter **Benutzerdefinierte Kopfzeile** → Erstellen: `Access-Control-Allow-Origin` = `https://paulfv.github.io`.
4. In der App `https://name.synology.me:5443` eintragen.

Ohne Einrichtung: den Musik-Ordner als Netzlaufwerk verbinden (Windows-Explorer, Mac-Finder, iPhone/iPad-Dateien-App „Mit Server verbinden“) und über **Dateien** / **Ordner** hinzufügen.

### Eigene Listen und Favoriten
* **Listen mit Namen** anlegen; Songs, Musikvideos, Radiosender und YouTube-Videos hinzufügen (lang drücken → „Zu Liste hinzufügen“ oder beim Abspielen das Listen-Symbol).
* In der Liste: abspielen, gemischt abspielen, umbenennen, löschen; Einträge verschieben oder entfernen (lang drücken).
* **Favoriten je Bereich:** Musik, Radio und YouTube haben jeweils eigene Favoriten (eigener Reiter), jede Favoritenliste lässt sich einzeln exportieren.
* **Export:** einzelne Liste oder Favoriten als G04Musik-Datei (`.g04musik.json`), **M3U8**, **M3U**, **XSPF** (VLC), **PLS**, **CSV** (Excel/Google Tabellen) oder **TXT**; „Alles exportieren“ sichert Favoriten und alle Listen in einer Datei. Auf dem Handy über „Teilen“.
* **Import:** G04Musik-Dateien, M3U/M3U8, PLS, XSPF, CSV und TXT. Eigene Songs werden über Dateiname und Größe (sonst Titel und Künstler) in der Bibliothek wiedergefunden; fehlende werden angezeigt und tauchen auf, sobald die Datei hinzugefügt ist.

### Wiedergabe
* **Abspielfenster** mit echten Klangbalken (Web Audio) für eigene Songs; bei Radio nachgebildet. Videos laufen direkt im Abspielfenster,
  mit **Vollbild** und **Bild-in-Bild**.
* **Antippen des Abspielfensters** pausiert bzw. spielt weiter; pausiert steht ein großes Pause-Zeichen in der Mitte (Vollbild bei Videos über den Knopf oben rechts).
* **Mini-Player** unten rechts in den Einstellungen – die Musik läuft weiter.
* **Mini-Fenster (Bild-in-Bild):** bleibt über anderen Apps sichtbar – Musikvideos als Video, eigene Songs und Radio mit Cover, Titel und Fortschritt (Knopf in der Bedienzeile unter dem Bild; in Chrome/Android auch automatisch beim App-Wechsel). YouTube erlaubt das nicht.
* **Sperrbildschirm, Kontrollzentrum, Auto** (Media Session): Titel, Cover, Weiter/Zurück.
* **Einschlaf-Timer** 15–90 Minuten, am Ende wird es leiser. **Wiederholen** (alle/einen), **Zufall**,
  **Als Nächstes spielen**.
* **Kacheln oder Liste:** ein Knopf oben in der Kopfzeile wechselt die Ansicht für die ganze App, die Wahl wird gemerkt.
* **Stern** oben rechts auf jeder Kachel (Songs, Videos, Radiosender, YouTube): Favorit an/aus, ohne abzuspielen.
* **„⋯“-Knopf** auf jeder Kachel und Zeile – oder **lang drücken** (Rechtsklick am Rechner): Favorit, als Nächstes, Zu Liste hinzufügen, Infos, löschen.
* Tastatur am Rechner: Leertaste = Pause, N/P = weiter/zurück, F = Vollbild, M = Ton aus/an. Lautstärke und Ton aus: Lautsprecher-Knopf oben rechts im Abspielfenster, Regler am Rechner unter den Knöpfen, am Handy unter „⋯“.

### Bildschirmgrößen
* **Desktop** (ab 1200 px): volle Seitenleiste, Abspielfenster und Bedienfeld nebeneinander.
* **Tablet/iPad** (768–1199 px): schmale Leiste; **quer** geteilt – Player links, Inhalt rechts; **hochkant** Player oben mit Bild und Steuerung nebeneinander.
* **Handy** (unter 768 px): untere Leiste mit Musik, Radio, YouTube, Mehr; Abspielfenster kompakt und fest oben; **quer** scrollt es mit.

### Gut zu wissen
* **iPhone/iPad:** Dort sind die Klangbalken nachgebildet, weil iOS die Musik sonst im Hintergrund stummschaltet.
* **YouTube-Suche:** ohne Schlüssel über freie Server (Piped/Invidious), mit eigenem Schlüssel (YouTube Data API v3, in den Einstellungen) direkt bei YouTube.
* **YouTube** spielt nicht weiter, wenn der Bildschirm gesperrt ist (Vorgabe von YouTube). Manche Videos erlauben kein Einbetten.
* **Radio-Sender** mit HLS (`.m3u8`) laufen über [hls.js](https://github.com/video-dev/hls.js), das bei Bedarf nachgeladen wird. Bei HLS-Sendern gibt es keinen Songtitel.
* **Songtitel im Radio:** Ein Browser darf den Titel bei den meisten Sendern nicht selbst aus dem Stream lesen. Darum gibt es den kleinen **Songtitel-Server** (unten, optional). Ohne ihn zeigen nur die Sender einen Titel, die es erlauben, bei den anderen siehst du Sendername, Genre, Land und Qualität. Cover, Album und Jahr kommen von Apples iTunes-Suche und lassen sich in den Einstellungen abschalten.
* Auf HTTPS werden nur Sender mit HTTPS-Stream angezeigt (Browser blockieren sonst den Ton).

---

## Aufbau

```
index.html            Rahmen, Abspielfenster, Mini-Player, Dialog
manifest.webmanifest  Installation als App
sw.js                 Service Worker (App-Dateien offline)
css/  theme · layout · components · player · responsive · theme-light
js/   util · i18n (Deutsch/English) · db (IndexedDB) · id3 (Tags) · store · library · radio · youtube · playlists · player · pip (Mini-Fenster) · views · app
img/                App-Icons (rote Kopfhörer mit Klangwelle)
```

## Songtitel-Server (optional)

Ein kleines Skript bei Cloudflare (kostenlos), das den Titel eines Radiosenders aus dem Stream liest und der App gibt. Getestet mit 30 deutschen Top-Sendern: bei etwa der Hälfte kommt ein Titel oder eine Sendungsinfo an.

1. Konto auf [dash.cloudflare.com](https://dash.cloudflare.com) anlegen (kostenlos).
2. **Workers & Pages** → **Create** → **Create Worker** → Namen vergeben (z. B. `g04musik-titel`) → **Deploy**.
3. **Edit code**: den ganzen Inhalt durch [`tools/nowplaying-worker.js`](tools/nowplaying-worker.js) ersetzen → **Deploy**.
4. Die Adresse des Workers kopieren (`https://g04musik-titel.<dein-name>.workers.dev`).
5. In G04Musik: **Einstellungen → Erweitert → Songtitel-Server** und die Adresse einfügen.
   Für alle Benutzer der App: die Adresse in `js/nowplaying.js` bei `DEFAULT_PROXY` eintragen.

Der Worker erlaubt nur Aufrufe von `https://paulfv.github.io` und von `localhost` (Liste `ALLOWED_ORIGINS` oben im Skript). Er speichert nichts.

## Starten

* **Online:** GitHub Pages → Einstellungen des Repos → *Pages* → Branch `main`, Ordner `/ (root)`.
* **Lokal:** im Ordner `python -m http.server 8000` und `http://localhost:8000` öffnen.
  (Direkt per Doppelklick geht vieles auch, YouTube und der Offline-Modus brauchen aber eine richtige Adresse.)

## Nächste Schritte (Phase 2)
Liedtexte (.lrc) mitlaufend, Crossfade, Play-Store-Version (TWA).
(Eigene Listen, Hell/Dunkel und Englisch gibt es bereits.)

---

© PaulFV
