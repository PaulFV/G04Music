# G04Musik v0.4.6

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
| **Radio** | Reiter **Sender**, **Favoriten**, **Zuletzt** – über 30.000 Sender über [radio-browser.info](https://www.radio-browser.info), nach Land, Genre oder Namen |
| **YouTube** | Reiter **Suche**, **Gemerkt**, **Favoriten**, **Zuletzt** – direkt suchen und abspielen, Links merken |
| **Einstellungen** | **Als App installieren** (wie in G04TV: Wege für iPhone/iPad, Android, Computer, „Jetzt installieren“), Visualizer, Bildschirm an, Einschlaf-Timer, Wiederholen, Zufall, Bibliothek |

### Eigene Dateien
* **Musik:** MP3, M4A/AAC, FLAC, WAV, OGG, Opus (je nach Browser auch AIFF, WMA)
* **Musikvideos:** MP4, M4V, WebM, MOV; MKV meist in Chrome und Edge. AVI und WMV können Browser in der Regel nicht.
* Titel, Künstler, Album, Nummer und **Cover** werden aus den Tags gelesen (ID3 bei MP3, iTunes-Tags bei M4A/MP4). Ohne Tags
  hilft der Dateiname („Künstler - Titel.mp3“). Videos bekommen automatisch ein Vorschaubild.
* Ganze **Ordner** auf einmal (Desktop-Browser). Gespeichert wird in der **IndexedDB** des Browsers.

### Eigene Listen und Favoriten
* **Listen mit Namen** anlegen; Songs, Musikvideos, Radiosender und YouTube-Videos hinzufügen (lang drücken → „Zu Liste hinzufügen“ oder beim Abspielen das Listen-Symbol).
* In der Liste: abspielen, gemischt abspielen, umbenennen, löschen; Einträge verschieben oder entfernen (lang drücken).
* **Favoriten je Bereich:** Musik, Radio und YouTube haben jeweils eigene Favoriten (eigener Reiter), jede Favoritenliste lässt sich einzeln exportieren.
* **Export:** einzelne Liste oder Favoriten als G04Musik-Datei (`.g04musik.json`) oder **M3U** (für VLC & Co.); „Alles exportieren“ sichert Favoriten und alle Listen in einer Datei. Auf dem Handy über „Teilen“.
* **Import:** G04Musik-Dateien und M3U-Listen. Eigene Songs werden über Dateiname und Größe (sonst Titel und Künstler) in der Bibliothek wiedergefunden; fehlende werden angezeigt und tauchen auf, sobald die Datei hinzugefügt ist.

### Wiedergabe
* **Bühne** mit echtem Spektrum (Web Audio) für eigene Songs; bei Radio nachgebildet. Videos laufen direkt auf der Bühne,
  mit **Vollbild** und **Bild-in-Bild**.
* **Mini-Player** unten rechts in den Einstellungen – die Musik läuft weiter.
* **Mini-Fenster (Bild-in-Bild):** bleibt über anderen Apps sichtbar – Musikvideos als Video, eigene Songs und Radio mit Cover, Titel und Fortschritt (Knopf oben rechts auf der Bühne oder im „⋯“-Menü; in Chrome/Android auch automatisch beim App-Wechsel). YouTube erlaubt das nicht.
* **Sperrbildschirm, Kontrollzentrum, Auto** (Media Session): Titel, Cover, Weiter/Zurück.
* **Einschlaf-Timer** 15–90 Minuten, am Ende wird es leiser. **Wiederholen** (alle/einen), **Zufall**,
  **Als Nächstes spielen**.
* **Kacheln oder Liste:** ein Knopf oben in der Kopfzeile wechselt die Ansicht für die ganze App, die Wahl wird gemerkt.
* **Stern** oben rechts auf jeder Kachel (Songs, Videos, Radiosender, YouTube): Favorit an/aus, ohne abzuspielen.
* **Lang drücken** (oder Rechtsklick) auf eine Kachel: Favorit, als Nächstes, Infos, löschen.
* Tastatur am Rechner: Leertaste = Pause, N/P = weiter/zurück, F = Vollbild, M = Ton aus.

### Bildschirmgrößen
* **Desktop** (ab 1200 px): volle Seitenleiste, Bühne und Bedienfeld nebeneinander.
* **Tablet/iPad** (768–1199 px): schmale Leiste; **quer** geteilt – Player links, Inhalt rechts; **hochkant** Player oben mit Bild und Steuerung nebeneinander.
* **Handy** (unter 768 px): untere Leiste mit Musik, Radio, YouTube, Mehr; Abspielfenster kompakt und fest oben; **quer** scrollt es mit.

### Gut zu wissen
* **iPhone/iPad:** Dort ist das Spektrum nachgebildet, weil iOS die Musik sonst im Hintergrund stummschaltet.
* **YouTube-Suche:** ohne Schlüssel über freie Server (Piped/Invidious), mit eigenem Schlüssel (YouTube Data API v3, in den Einstellungen) direkt bei YouTube.
* **YouTube** spielt nicht weiter, wenn der Bildschirm gesperrt ist (Vorgabe von YouTube). Manche Videos erlauben kein Einbetten.
* **Radio-Sender** mit HLS (`.m3u8`) laufen über [hls.js](https://github.com/video-dev/hls.js), das bei Bedarf nachgeladen wird.
* Auf HTTPS werden nur Sender mit HTTPS-Stream angezeigt (Browser blockieren sonst den Ton).

---

## Aufbau

```
index.html            Rahmen, Bühne, Mini-Player, Blatt
manifest.webmanifest  Installation als App
sw.js                 Service Worker (App-Dateien offline)
css/  theme · layout · components · player · responsive
js/   util · db (IndexedDB) · id3 (Tags) · store · library · radio · youtube · player · views · app
img/                App-Icons (rote Kopfhörer mit Klangwelle)
```

## Starten

* **Online:** GitHub Pages → Einstellungen des Repos → *Pages* → Branch `main`, Ordner `/ (root)`.
* **Lokal:** im Ordner `python -m http.server 8000` und `http://localhost:8000` öffnen.
  (Direkt per Doppelklick geht vieles auch, YouTube und der Offline-Modus brauchen aber eine richtige Adresse.)

## Nächste Schritte (Phase 2)
Liedtexte (.lrc) mitlaufend, Crossfade, Playlisten selbst anlegen, Hell/Dunkel, Englisch, Play-Store-Version (TWA).

---

© PaulFV
