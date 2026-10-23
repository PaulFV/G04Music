/* ============================================================
   G04Musik — Sprache: Deutsch / Englisch
   Die App ist auf Deutsch geschrieben. Bei Englisch übersetzt diese
   Datei alle angezeigten Texte (auch Knopf-Beschriftungen, Hinweise und
   Meldungen) beim Erscheinen – ohne Neuladen, die Musik läuft weiter.
   Eigene Inhalte (Songtitel, Sendernamen …) bleiben unverändert.
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u;

  /* ---------- Feste Texte ---------- */
  var D = {
    /* Navigation, Kopfzeile */
    'Musik':'Music', 'Radio':'Radio', 'YouTube':'YouTube', 'Mehr':'More', 'Einstellungen':'Settings', 'Start':'Home',
    'Eigene Songs, Alben, Videos und Listen':'Your songs, albums, videos and lists',
    'Sender aus aller Welt, live':'Stations from around the world, live',
    'Suchen, merken, abspielen':'Search, save, play',
    'Wiedergabe, Bibliothek, Über':'Playback, library, about',
    'Nichts läuft':'Nothing playing', 'Was gerade läuft':'Now playing',
    'Als Liste anzeigen':'Show as list', 'Als Kacheln anzeigen':'Show as tiles',
    'Hauptnavigation':'Main navigation', 'Navigation':'Navigation', 'Schließen':'Close', 'schließen':'close',
    'Sprache wechseln':'Change language',

    /* Bühne & Bedienfeld */
    'Wähle einen Song, einen Sender oder ein Video.':'Choose a song, a station or a video.',
    'Das ließ sich nicht abspielen':'This could not be played', 'Noch einmal':'Try again',
    'Jetzt läuft':'Now playing', 'Angehalten':'Paused', 'Lädt …':'Loading …', 'Fehler':'Error', 'Fehler – antippen':'Error – tap',
    'Abspielen':'Play', 'Pause':'Pause', 'Zurück':'Previous', 'Weiter':'Next', 'Zufall':'Shuffle', 'Wiederholen':'Repeat',
    'Favorit':'Favourite', 'Zu Liste hinzufügen':'Add to list', 'Einschlaf-Timer':'Sleep timer', 'Lautstärke':'Volume',
    'Beenden':'Stop', 'Mehr':'More', 'Position':'Position', 'Danach:':'Up next:', 'Vollbild':'Full screen',
    'Mini-Fenster':'Mini player', 'Mini-Fenster: bleibt über anderen Apps sichtbar':'Mini player: stays on top of other apps',
    'Mini-Fenster (bleibt über anderen Apps sichtbar)':'Mini player (stays on top of other apps)',
    'Bild-in-Bild':'Picture-in-picture',
    'Meine Musik':'My music', 'Musikvideo':'Music video', 'Eigener Song':'Own song',
    'Nichts läuft':'Nothing playing', 'Noch nichts gewählt':'Nothing selected yet',
    'Tippe auf einen Song oder Play.':'Tap a song or Play.', 'Tippe auf einen Sender oder Play.':'Tap a station or Play.',
    'Suche ein Video oder tippe auf einen Treffer.':'Search for a video or tap a result.',
    'Alle Songs gemischt':'All songs shuffled', 'Alle Songs gemischt abspielen':'Play all songs shuffled',
    'Alle Songs der Reihe nach abspielen':'Play all songs in order',
    'Guten Morgen':'Good morning', 'Guten Tag':'Good afternoon', 'Guten Abend':'Good evening', 'Gute Nacht':'Good night',
    'Zur Bühne':'To the player', 'Wiedergabe beenden':'Stop playback',

    /* Willkommen, Menü */
    'Willkommen bei G04Musik':'Welcome to G04Musik', 'Womit möchtest du anfangen?':'Where would you like to start?',
    'Eigene Musik hinzufügen':'Add your own music', 'Songs und Videos von diesem Gerät':'Songs and videos from this device',
    'Radio hören':'Listen to radio', 'Tausende Sender, ganz ohne Dateien':'Thousands of stations, no files needed',
    'Suchen und direkt abspielen':'Search and play right away', 'Nicht mehr anzeigen':'Do not show again',
    'Füge Musik hinzu oder wechsle zu Radio.':'Add music or switch to Radio.',
    'Tipp: Halte einen Titel gedrückt oder tippe auf ⋯ für mehr Möglichkeiten.':'Tip: press and hold a track or tap ⋯ for more options.',

    /* Reiter */
    'Songs':'Songs', 'Alben':'Albums', 'Videos':'Videos', 'Listen':'Lists', 'Favoriten':'Favourites',
    'Sender':'Stations', 'Zuletzt':'Recent', 'Suche':'Search', 'Gemerkt':'Saved', 'Verlauf':'History',
    'Musikvideos':'Music videos', 'Album':'Album', 'ALBUM':'ALBUM', 'LISTE':'LIST', 'FAVORITEN':'FAVOURITES',

    /* Musik */
    'Suchen':'Search', 'Dateien':'Files', 'Ordner':'Folder', 'Dateien hinzufügen':'Add files', 'Ordner hinzufügen':'Add folder',
    'Bibliothek wird geladen …':'Loading library …', 'Deine Bibliothek ist leer':'Your library is empty',
    'Wähle Musik- oder Videodateien von diesem Gerät. Titel, Künstler, Album und Cover werden automatisch gelesen.':'Choose music or video files from this device. Title, artist, album and cover are read automatically.',
    'Kein Treffer':'No match', 'Versuch es mit einem anderen Wort.':'Try another word.',
    'Noch keine Songs':'No songs yet', 'Füge Musikdateien hinzu.':'Add music files.',
    'Noch keine Musikvideos':'No music videos yet', 'Füge MP4-, WebM-, MOV- oder MKV-Dateien hinzu.':'Add MP4, WebM, MOV or MKV files.',
    'Alle Alben':'All albums', 'Singles':'Singles', 'Verschiedene':'Various', 'Unbekannter Künstler':'Unknown artist', 'Unbekannt':'Unknown',
    'Wird eingelesen …':'Importing …', 'Single':'Single', 'Video':'Video',

    /* Listen */
    'Deine Listen':'Your lists', 'Neue Liste':'New list', 'Liste importieren':'Import list',
    'Alles exportieren':'Export everything', 'Alles exportieren (alle Listen und Favoriten)':'Export everything (all lists and favourites)',
    'Noch keine Listen':'No lists yet',
    'Lege mit + eine Liste an oder importiere eine. Songs fügst du per langem Drücken hinzu.':'Create a list with + or import one. Add songs with a long press.',
    'Import: G04Musik (.json), M3U/M3U8, PLS, XSPF, CSV und TXT. Eigene Songs werden über den Dateinamen in deiner Bibliothek wiedergefunden.':'Import: G04Musik (.json), M3U/M3U8, PLS, XSPF, CSV and TXT. Your songs are matched to your library by file name.',
    'Gemischt abspielen':'Play shuffled', 'Exportieren':'Export', 'Umbenennen':'Rename', 'Liste löschen':'Delete list',
    'Noch leer':'Still empty', 'Favoriten exportieren':'Export favourites',
    'Tippe auf den Stern bei einem Song, Sender oder Video.':'Tap the star on a song, station or video.',
    'Lang drücken auf einen Song, Sender oder ein Video und „Zu Liste hinzufügen“ wählen – oder beim Abspielen auf das Listen-Symbol tippen.':'Long-press a song, station or video and choose "Add to list" – or tap the list icon while playing.',
    'Lang drücken auf einen Eintrag: verschieben oder aus der Liste entfernen.':'Long-press an entry to move it or remove it from the list.',
    'Name der Liste':'List name', 'Liste umbenennen':'Rename list', 'Speichern':'Save',
    'Neue Liste anlegen':'Create new list', 'Anlegen und hinzufügen':'Create and add',
    'Noch keine Favoriten':'No favourites yet',
    'Tippe auf den Stern ☆ bei einem Song oder Musikvideo.':'Tap the star ☆ on a song or music video.',
    'Tippe auf den Stern ☆ bei einem Sender.':'Tap the star ☆ on a station.',
    'Tippe auf den Stern ☆ bei einem Video oder Suchtreffer.':'Tap the star ☆ on a video or search result.',
    'Tippe auf den Stern ☆ auf einem Song, Sender oder Video.':'Tap the star ☆ on a song, station or video.',
    'Zuletzt gehört':'Recently played', 'Noch nichts':'Nothing yet', 'Hier erscheint, was zuletzt lief.':'What you played last appears here.',
    'Liste löschen?':'Delete list?', 'Löschen':'Delete', 'Löschen?':'Delete?', 'Abbrechen':'Cancel',
    'Zu Favoriten':'Add to favourites', 'Aus Favoriten entfernen':'Remove from favourites',
    'Als Nächstes spielen':'Play next', 'Nach oben':'Move up', 'Nach unten':'Move down',
    'Aus dieser Liste entfernen':'Remove from this list', 'Aus der Bibliothek löschen':'Delete from library',
    'Aus der Liste entfernen':'Remove from list', 'Auf YouTube öffnen':'Open on YouTube',
    /* Export */
    'G04Musik-Datei (.json)':'G04Musik file (.json)',
    'Zum Sichern oder für ein anderes Gerät mit G04Musik – alles bleibt erhalten':'For backup or another device with G04Musik – nothing is lost',
    'Für die meisten Player (VLC, Winamp, Handy-Apps), Umlaute sicher':'For most players (VLC, Winamp, phone apps), safe for special characters',
    'Ältere Variante von M3U8 für sehr alte Player':'Older variant of M3U8 for very old players',
    'Für VLC & Co. – mit Titel, Künstler, Album und Länge':'For VLC & co. – with title, artist, album and length',
    'Älteres Format, gut für Radiosender und Internetradio-Programme':'Older format, good for radio stations and internet radio programs',
    'CSV-Tabelle':'CSV spreadsheet', 'Zum Öffnen in Excel oder Google Tabellen':'To open in Excel or Google Sheets',
    'Textliste (.txt)':'Text list (.txt)', '„Künstler – Titel“ zum Verschicken oder Ausdrucken':'"Artist – Title" to send or print',
    'Sender und YouTube werden mit Adresse gespeichert, eigene Songs mit dem Dateinamen – die Musikdateien selbst sind nicht enthalten.':'Stations and YouTube are saved with their address, your songs with the file name – the music files themselves are not included.',

    /* Radio */
    'Sender suchen':'Search stations', 'Land':'Country', 'Welt':'World', 'Weltweit':'Worldwide',
    'Deutschland':'Germany', 'Österreich':'Austria', 'Schweiz':'Switzerland',
    'Beliebt':'Popular', 'Pop':'Pop', 'Rock':'Rock', 'Nachrichten':'News', 'Electronic':'Electronic', 'Chill':'Chill', 'Jazz':'Jazz',
    'Klassik':'Classical', 'Schlager':'Schlager', 'Hip-Hop':'Hip-hop', '80er':'80s', '90er':'90s',
    'Suchergebnis':'Search results', 'über radio-browser.info':'via radio-browser.info',
    'Sender werden geladen …':'Loading stations …', 'Keine Verbindung':'No connection',
    'Die Senderliste ließ sich nicht laden. Bist du online?':'The station list could not be loaded. Are you online?',
    'Keine Sender gefunden':'No stations found', 'Versuch einen anderen Namen oder ein anderes Land.':'Try another name or country.',
    'Eigener Sender':'Custom station', 'LIVE':'LIVE',

    /* YouTube */
    'YouTube durchsuchen oder Link einfügen':'Search YouTube or paste a link',
    'YouTube durchsuchen':'Search YouTube',
    'Gib oben einen Künstler oder Song ein. Einen kopierten YouTube-Link legt die App direkt in deine Favoriten.':'Enter an artist or song above. A copied YouTube link goes straight to your favorites.',
    'Ist schon in deinen Favoriten':'Already in your favorites', 'Zu Favoriten hinzugefügt':'Added to favorites',
    'Suche auf YouTube …':'Searching YouTube …', 'Suche gerade nicht möglich':'Search not available right now',
    'Auf YouTube suchen':'Search on YouTube', 'auf YouTube öffnen ›':'open on YouTube ›',
    'Nichts gefunden':'Nothing found', 'Versuch es mit anderen Wörtern.':'Try other words.',
    'Noch nichts gemerkt':'Nothing saved yet',
    'Füge bei „Suche“ einen YouTube-Link ein – zum Beispiel zu deinem eigenen Kanal-Video.':'Paste a YouTube link under "Search" – for example to a video from your own channel.',
    'Die freien Suchserver antworten gerade nicht. Du kannst direkt auf YouTube suchen und den Link hier einfügen – oder in den Einstellungen einen eigenen Suchschlüssel hinterlegen.':'The free search servers are not responding. You can search directly on YouTube and paste the link here – or add your own search key in Settings.',
    'YouTube-Video':'YouTube video', 'YouTube-Playlist':'YouTube playlist',

    /* Einstellungen */
    'Feedback & Ideen':'Feedback & ideas',
    'Fehler gefunden, eine Idee oder etwas, das dir fehlt? Schick es direkt an mich – ganz ohne Konto.':'Found a bug, have an idea or miss something? Send it straight to me – no account needed.',
    'Deine Nachricht*':'Your message*', 'Was möchtest du mir mitteilen?':'What would you like to tell me?',
    'Deine E-Mail (optional, für eine Antwort)':'Your e-mail (optional, for a reply)', 'name@beispiel.de':'name@example.com', 'Senden':'Send',
    'Beim Senden geht dein Text über formsubmit.co als E-Mail an mich. Mitgeschickt werden außerdem die App-Version, die Sprache und dein Browser- und Gerätetyp – keine Songs, Listen oder Favoriten. Deine E-Mail-Adresse nur, wenn du sie einträgst.':'Your text is sent to me by e-mail via formsubmit.co. The app version, the language and your browser and device type are included as well – no songs, lists or favourites. Your e-mail address only if you enter it.',
    'Oder als öffentliches Issue auf':'Or as a public issue on',
    'Bitte schreibe zuerst eine Nachricht.':'Please write a message first.', 'Bitte gib eine gültige E-Mail-Adresse an.':'Please enter a valid e-mail address.',
    'Keine Internetverbindung. Bitte versuche es später noch einmal.':'No internet connection. Please try again later.',
    'Wird gesendet …':'Sending …', 'Danke! Deine Nachricht ist unterwegs.':'Thank you! Your message is on its way.',
    'Senden hat nicht geklappt. Bitte versuche es noch einmal oder schreibe an fodorpaul@web.de.':'Sending failed. Please try again or write to fodorpaul@web.de.',
    'Allgemein':'General', 'Sprache':'Language', 'Design':'Appearance', 'Hell oder dunkel':'Light or dark', 'Dunkel':'Dark', 'Hell':'Light',
    'Hellen Modus aktivieren':'Switch to light mode', 'Dunklen Modus aktivieren':'Switch to dark mode', 'Deutsch / English':'Deutsch / English', 'Deutsch':'Deutsch', 'English':'English',
    'Wiedergabe':'Playback', 'Klangbalken':'Sound bars', 'Bewegte Balken im Abspielfenster':'Moving bars in the player',
    'Bildschirm bleibt an':'Keep screen on', 'Solange ein Video läuft':'While a video is playing',
    '15 bis 90 Minuten, am Ende wird es leiser':'15 to 90 minutes, fades out at the end',
    'Aus, alle oder einen Titel':'Off, all or one track', 'Reihenfolge mischen':'Shuffle the order',
    'YouTube-Suchschlüssel':'YouTube search key', 'Optional, für zuverlässigere Suche':'Optional, for more reliable search',
    'keiner':'none', 'gespeichert':'saved', 'aus':'off', 'alle':'all', 'ein Titel':'one track', 'Umschalten':'Toggle',
    'Bibliothek':'Library', 'Eigene Titel':'Your tracks', 'Musik und Musikvideos von diesem Gerät':'Music and music videos from this device',
    'Bibliothek leeren':'Clear library', 'Entfernt alle eigenen Titel von diesem Gerät':'Removes all your tracks from this device',
    'Alles zurücksetzen':'Reset everything', 'Favoriten, Verlauf, Einstellungen':'Favourites, history, settings',
    'Als App installieren':'Install as app', 'Installiert':'Installed',
    'iPhone / iPad':'iPhone / iPad', 'Android':'Android', 'Computer':'Computer',
    'Safari · Teilen · Zum Home-Bildschirm':'Safari · Share · Add to Home Screen',
    'Chrome · Menü ⋮ · App installieren':'Chrome · Menu ⋮ · Install app',
    'Chrome/Edge · Symbol in der Adressleiste':'Chrome/Edge · icon in the address bar',
    'Jetzt installieren':'Install now', 'So geht’s':'How to',
    'Läuft als App – ohne Adressleiste, mit eigenem Icon.':'Running as an app – no address bar, with its own icon.',
    'Version & Copyright':'Version & copyright', 'Version':'Version', 'Copyright':'Copyright',
    'Datenschutz':'Privacy', 'Kein Konto, kein Tracking. Deine Musikdateien bleiben auf dem Gerät. Radio, YouTube und die Suche fragen dafür fremde Dienste an.':'No account, no tracking. Your music files stay on the device. Radio, YouTube and search use outside services for this.',
    'Bibliothek leeren?':'Clear library?', 'Leeren':'Clear', 'Alles zurücksetzen?':'Reset everything?', 'Zurücksetzen':'Reset',
    'Alle eigenen Songs und Musikvideos werden von diesem Gerät entfernt. Die Originaldateien bleiben, wo sie waren.':'All your songs and music videos will be removed from this device. The original files stay where they are.',
    'Favoriten, Verlauf, YouTube-Liste und Einstellungen werden gelöscht. Deine Bibliothek bleibt.':'Favourites, history, YouTube list and settings will be deleted. Your library stays.',
    'YouTube-Suchschlüssel':'YouTube search key', 'API-Schlüssel einfügen':'Paste API key', 'Entfernen':'Remove',
    'Optional. Mit einem eigenen, kostenlosen Schlüssel von Google sucht die App direkt bei YouTube. Ohne Schlüssel nutzt sie freie Ersatz-Server.':'Optional. With your own free key from Google the app searches YouTube directly. Without a key it uses free fallback servers.',
    'So bekommst du ihn: console.cloud.google.com → Projekt anlegen → „YouTube Data API v3“ aktivieren → Anmeldedaten → API-Schlüssel erstellen. Der Schlüssel bleibt nur auf diesem Gerät.':'How to get one: console.cloud.google.com → create project → enable "YouTube Data API v3" → credentials → create API key. The key stays on this device only.',
    'Nach Ablauf wird es leiser, dann endet die Wiedergabe.':'At the end it fades out, then playback stops.',
    'Wiederholen':'Repeat', 'jetzt: aus':'now: off', 'jetzt: alle':'now: all', 'jetzt: ein Titel':'now: one track',
    'App, Name, Icon und Gestaltung sind urheberrechtlich geschützt. Weitergabe, Veränderung oder Veröffentlichung nur mit Erlaubnis von PaulFV.':'App, name, icon and design are protected by copyright. Sharing, modifying or publishing only with permission from PaulFV.',
    'Eigene Songs und Musikvideos gehören ihren Urhebern. Radiosender über radio-browser.info, Videos über YouTube – es gelten deren Bedingungen.':'Your songs and music videos belong to their creators. Radio stations via radio-browser.info, videos via YouTube – their terms apply.',
    /* Installieren-Anleitung */
    'Diese Seite in':'Open this page in', 'öffnen.':'.', 'Unten auf':'Tap', 'tippen.':'at the bottom.',
    'wählen und':'and', 'Hinzufügen':'Add', 'Oben rechts das Menü':'Open the menu', 'wählen.':'.',
    'bzw.':'or', 'oder':'or', 'Rechts in der Adressleiste auf das Symbol':'Click the', 'Installieren':'Install',
    'klicken (oder Menü → „App installieren“).':'icon on the right of the address bar (or Menu → "Install app").',
    'G04Musik startet danach wie ein eigenes Programm.':'G04Musik then starts like its own program.',
    'Teilen':'Share', '„Zum Home-Bildschirm“':'"Add to Home Screen"', '„App installieren“':'"Install app"',
    '„Zum Startbildschirm hinzufügen“':'"Add to Home screen"',

    /* Meldungen */
    'Zu Favoriten hinzugefügt':'Added to favourites', 'Aus Favoriten entfernt':'Removed from favourites',
    'Kommt als Nächstes':'Plays next', 'Aus der Liste entfernt':'Removed from list', 'Gelöscht':'Deleted', 'Entfernt':'Removed',
    'Hinzugefügt':'Added', 'Ist schon in deiner Liste':'Already in your list', 'Umbenannt':'Renamed', 'Liste gelöscht':'List deleted',
    'Bibliothek geleert':'Library cleared', 'Zufall an':'Shuffle on', 'Zufall aus':'Shuffle off',
    'Wiederholen aus':'Repeat off', 'Alle wiederholen':'Repeat all', 'Diesen Titel wiederholen':'Repeat this track',
    'Einschlaf-Timer aus':'Sleep timer off', 'Einschlaf-Timer: Wiedergabe beendet. Gute Nacht.':'Sleep timer: playback stopped. Good night.',
    'Das war der letzte Titel.':'That was the last track.', 'Nichts Neues hinzugefügt':'Nothing new added', 'Nichts Neues gefunden':'Nothing new found',
    'Keine Musik- oder Videodateien gefunden.':'No music or video files found.', 'Nichts ausgewählt.':'Nothing selected.',
    'Der Speicher ist voll. Lösche Titel oder gib in den Einstellungen mehr frei.':'Storage is full. Delete tracks or free up space.',
    'Die echten Klangbalken starten mit dem nächsten Song.':'The real sound bars start with the next song.',
    'Die Datei ließ sich nicht lesen.':'The file could not be read.', 'Schlüssel gespeichert':'Key saved', 'Kein Schlüssel':'No key', 'Schlüssel entfernt':'Key removed',
    'Favoriten und alle Listen exportiert':'Favourites and all lists exported', 'Exportiert':'Exported',
    'G04Musik ist installiert':'G04Musik is installed', 'Wird installiert …':'Installing …',
    'Mini-Fenster offen – wechsle jetzt in eine andere App':'Mini player open – now switch to another app',
    'YouTube erlaubt kein Mini-Fenster außerhalb der App.':'YouTube does not allow a mini player outside the app.',
    'Das Mini-Fenster ließ sich hier nicht öffnen. Titel und Steuerung findest du auf dem Sperrbildschirm und im Kontrollzentrum.':'The mini player could not be opened here. You will find title and controls on the lock screen and in Control Center.',
    'Dein Browser kann für Musik kein Mini-Fenster zeigen. Titel und Steuerung findest du auf dem Sperrbildschirm.':'Your browser cannot show a mini player for music. You will find title and controls on the lock screen.',
    'Das ist kein YouTube-Link. Erwartet wird z. B. youtube.com/watch?v=… oder youtu.be/…':'That is not a YouTube link. Expected e.g. youtube.com/watch?v=… or youtu.be/…',
    'Das ist keine G04Musik-Listendatei.':'This is not a G04Musik list file.', 'Die XSPF-Datei ist beschädigt.':'The XSPF file is damaged.',
    'In der Datei wurden keine Einträge gefunden.':'No entries were found in the file.',
    'In der CSV-Datei fehlt eine Spalte „Titel“ oder „Adresse“.':'The CSV file is missing a "Title" or "Address" column.',
    'Unbekanntes Format. Erwartet: G04Musik (.json), M3U/M3U8, PLS, XSPF, CSV oder TXT.':'Unknown format. Expected: G04Musik (.json), M3U/M3U8, PLS, XSPF, CSV or TXT.',
    /* Fehler der Wiedergabe */
    'Die Datei fehlt in der Bibliothek. Bitte neu hinzufügen.':'The file is missing from the library. Please add it again.',
    'Die Datei ließ sich nicht laden.':'The file could not be loaded.', 'Die Datei ließ sich nicht abspielen.':'The file could not be played.',
    'Dieses Format kann dein Browser nicht abspielen. MP3, M4A, MP4 und WebM gehen überall; MKV, AVI und WMV oft nicht.':'Your browser cannot play this format. MP3, M4A, MP4 and WebM work everywhere; MKV, AVI and WMV often do not.',
    'Der Sender antwortet gerade nicht oder sendet in einem Format, das dein Browser nicht kann.':'The station is not responding or uses a format your browser cannot play.',
    'Der Sender antwortet gerade nicht.':'The station is not responding.',
    'Dieser Sender sendet im HLS-Format, das dein Browser nicht kann.':'This station uses HLS, which your browser cannot play.',
    'Der HLS-Abspieler ließ sich nicht laden. Bist du online?':'The HLS player could not be loaded. Are you online?',
    'Dieses Video darf nicht eingebettet werden. Öffne es direkt auf YouTube.':'This video cannot be embedded. Open it directly on YouTube.',
    'Das Video ließ sich nicht abspielen.':'The video could not be played.'
  };

  /* ---------- Texte mit Zahlen oder Namen ---------- */
  var R = [
    [/^Ergebnisse für „(.*)“$/, 'Results for "$1"'],
    [/^(\d+) Titel · (\d+) min$/, function(m,a,b){ return a+(a==='1'?' track':' tracks')+' · '+b+' min'; }],
    [/^(\d+) Titel$/, function(m,a){ return a+(a==='1'?' track':' tracks'); }],
    [/^(.*) · (\d+) Titel$/, function(m,a,b){ return tr(a)+' · '+b+(b==='1'?' track':' tracks'); }],
    [/^Favoriten ·$/, 'Favourites ·'],
    [/^(.*) · (\d+) Titel · (\d+) min$/, function(m,a,b,c){ return tr(a)+' · '+b+(b==='1'?' track':' tracks')+' · '+c+' min'; }],
    [/^(\d+) Einträge · (\d+) min$/, function(m,a,b){ return a+(a==='1'?' entry':' entries')+' · '+b+' min'; }],
    [/^(\d+) Eintrag$/, '$1 entry'], [/^(\d+) Einträge$/, '$1 entries'],
    [/^(\d+) Eintrag(?:e)? · (\d+) min$/, function(m,a,b){ return a+(a==='1'?' entry':' entries')+' · '+b+' min'; }],
    [/^(\d+) Einträg?e? · schon drin$/, '$1 entries · already in it'],
    [/^(\d+) Einträge · schon drin$/, '$1 entries · already in it'], [/^(\d+) Eintrag · schon drin$/, '$1 entry · already in it'],
    [/^(\d+) Songs fehlen auf diesem Gerät$/, '$1 songs missing on this device'],
    [/^(\d+) Songs · (\d+) Musikvideos$/, '$1 songs · $2 music videos'],
    [/^(\d+) von (\d+)$/, '$1 of $2'],
    [/^noch (\d+) min$/, '$1 min left'], [/^Noch (\d+) Minuten\.$/, '$1 minutes left.'],
    [/^Einschlaf-Timer: (\d+) Minuten$/, 'Sleep timer: $1 minutes'],
    [/^Wiederholen: (aus|alle|ein Titel)$/, function(m,a){ return 'Repeat: '+tr(a); }],
    [/^jetzt: (aus|alle|ein Titel)$/, function(m,a){ return 'now: '+tr(a); }],
    [/^Liste „(.*)“ angelegt$/, 'List "$1" created'],
    [/^Zu „(.*)“ hinzugefügt$/, 'Added to "$1"'],
    [/^„(.*)“ zu Favoriten hinzugefügt$/, '"$1" added to favourites'],
    [/^„(.*)“ exportieren$/, 'Export "$1"'],
    [/^„(.*)“ wird gelöscht\. Die Songs selbst bleiben in deiner Bibliothek\.$/, '"$1" will be deleted. The songs stay in your library.'],
    [/^„(.*)“ wird von diesem Gerät entfernt\.$/, '"$1" will be removed from this device.'],
    [/^„(.*)“$/, '"$1"'],
    [/^Als (\w+) exportiert$/, 'Exported as $1'],
    [/^(\d+) Titel hinzugefügt(.*)$/, function(m,a,b){ return a+(a==='1'?' track':' tracks')+' added'+b.replace(/ · (\d+) schon vorhanden/,' · $1 already there'); }],
    [/^Nichts Neues hinzugefügt · (\d+) schon vorhanden$/, 'Nothing new added · $1 already there'],
    [/^(\d+) Datei kann dieser Browser vermutlich nicht abspielen.*$/, '1 file probably cannot be played in this browser (e.g. AVI, WMV or MKV with a rare codec).'],
    [/^(\d+) Dateien können dieser Browser vermutlich nicht abspielen.*$/, '$1 files probably cannot be played in this browser (e.g. AVI, WMV or MKV with a rare codec).'],
    [/^(.*) importiert(?: · (\d+) Songs fehlen auf diesem Gerät)?$/, function(m,a,b){
      a=a.replace(/(\d+) Listen?/,function(x,n){ return n+(n==='1'?' list':' lists'); }).replace(/(\d+) Favoriten/,'$1 favourites').replace(' und ',' and ');
      return a+' imported'+(b?' · '+b+' songs missing on this device':''); }],
    [/^Nichts Neues gefunden · (\d+) Songs fehlen auf diesem Gerät$/, 'Nothing new found · $1 songs missing on this device'],
    [/^Eigener Song · (\d{4})$/, 'Own song · $1'],
    [/^© (\d{4}) PaulFV · Alle Rechte vorbehalten$/, '© $1 PaulFV · All rights reserved'],
    [/^© (\d{4}) PaulFV\. Alle Rechte vorbehalten\.$/, '© $1 PaulFV. All rights reserved.'],
    [/^Alle Rechte vorbehalten\.$/, 'All rights reserved.'],
    [/^G04Musik · Version (.*)$/, 'G04Musik · Version $1'],
    [/^(\d+) min$/, '$1 min'],
    [/^(spielt|angehalten|bereit)$/, function(m,a){ return {spielt:'playing',angehalten:'paused',bereit:'ready'}[a]; }],
    [/^Eigener Sender$/, 'Custom station']
  ];

  function tr(s){
    if (G.lang !== 'en' || !s) return s;
    var t = s.trim(); if (!t) return s;
    var out = null;
    if (Object.prototype.hasOwnProperty.call(D, t)) out = D[t];
    else for (var i = 0; i < R.length; i++) { if (R[i][0].test(t)) { out = t.replace(R[i][0], R[i][1]); break; } }
    if (out == null) return s;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    return lead + out + trail;
  }
  G.t = tr;

  /* ---------- Anwenden auf die Seite ---------- */
  var orig = new WeakMap();          /* Textknoten → deutscher Original-Text */
  var ATTR = ['title', 'aria-label', 'placeholder'];
  var busy = false;
  function skip(el){ return !el || el.closest('script,style,textarea,[data-noi18n]'); }
  function skipAttr(el){ return !el || el.closest('script,style,[data-noi18n]'); }
  function doText(n){
    if (skip(n.parentElement)) return;
    var cur = n.nodeValue, o = orig.get(n);
    if (o == null || (cur !== o && cur !== tr(o))) { o = cur; orig.set(n, o); }   /* neuer Text vom Programm */
    var want = G.lang === 'en' ? tr(o) : o;
    if (cur !== want) n.nodeValue = want;
  }
  function doAttrs(el){
    if (skipAttr(el)) return;
    ATTR.forEach(function(a){
      if (!el.hasAttribute(a)) return;
      var key = 'data-de-' + a, cur = el.getAttribute(a), o = el.getAttribute(key);
      if (o == null || (cur !== o && cur !== tr(o))) { o = cur; el.setAttribute(key, o); }
      var want = G.lang === 'en' ? tr(o) : o;
      if (cur !== want) el.setAttribute(a, want);
    });
  }
  function apply(root){
    busy = true;
    try {
      root = root || document.body;
      if (root.nodeType === 3) { doText(root); return; }
      if (root.nodeType !== 1) return;
      doAttrs(root);
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), n;
      while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
    } finally { busy = false; }
  }
  G.i18nApply = apply;

  new MutationObserver(function(list){
    if (busy) return;
    busy = true;
    try {
      list.forEach(function(m){
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttrs(m.target);
        else m.addedNodes.forEach(function(n){ busy = false; apply(n); busy = true; });
      });
    } finally { busy = false; }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });

  /* ---------- Sprache wählen ---------- */
  var nav = (navigator.language || 'de').toLowerCase();
  G.lang = u.ls.get('lang', nav.indexOf('de') === 0 ? 'de' : 'en');
  G.setLang = function(l){
    G.lang = l === 'en' ? 'en' : 'de'; u.ls.set('lang', G.lang);
    document.documentElement.lang = G.lang;
    document.title = G.lang === 'en' ? 'G04Musik — Music, Radio, YouTube' : 'G04Musik — Musik, Radio, YouTube';
    apply(document.body);
    G.store && G.store.emit('lang');
  };
  document.documentElement.lang = G.lang;
  if (G.lang === 'en') document.addEventListener('DOMContentLoaded', function(){ G.setLang('en'); });
})();
