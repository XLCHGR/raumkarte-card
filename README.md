# Raumkarte · Soft Dark Glass

Kompakte Raumkarte für das Etagen-Dashboard am Handy. Du wählst nur den **Bereich**, die Karte findet Lichter, bis zu 3 Rollos/Raffstores, Temperatur und Luftfeuchte selbst. Tipp auf die Kopfzeile öffnet den ganzen Raum als Bottom-Sheet.

Keine weiteren HACS-Karten nötig.

| Datei | Wofür |
|---|---|
| `raumkarte-card.js` | Die Karte inkl. grafischem Editor |
| `demo/index.html` | Testseite ohne Home Assistant (simulierte Daten) |
| `theme_soft_dark_glass.yaml` | Optionales Theme (dunkler Grund, Schrift) |
| `hacs.json` | HACS-Metadaten |

## Installation über HACS

1. HACS → ⋮ → **Benutzerdefinierte Repositories**
2. Repository: `https://github.com/XLCHGR/raumkarte-card`, Typ: **Dashboard** → Hinzufügen
3. „Raumkarte“ in HACS suchen → **Herunterladen**. HACS legt die Ressource automatisch an.
4. App bzw. Browser neu laden.

## Installation von Hand

1. `raumkarte-card.js` nach `/config/www/raumkarte-card.js` kopieren (z. B. mit dem File-Editor- oder Samba-Add-on).
2. Einstellungen → Dashboards → ⋮ → **Ressourcen** → *Ressource hinzufügen*
   - URL: `/local/raumkarte-card.js?v=1.0.2`
   - Typ: **JavaScript-Modul**
3. App bzw. Browser neu laden.

Nach einem Update der Datei die Zahl hinter `?v=` erhöhen, sonst lädt die Companion-App die alte Version aus dem Cache.

## Karte hinzufügen (grafisch)

Dashboard bearbeiten → *Karte hinzufügen* → **Raumkarte** suchen → Bereich wählen. Fertig.

Unter **Entitäten anpassen (optional)** kannst du die automatische Auswahl übersteuern:

| Feld | Leer gelassen |
|---|---|
| Name, Symbol | Name und Symbol des Bereichs |
| Lichter | Alle Lichter im Bereich (ohne Lichtgruppen) |
| Rollos / Raffstores | Bis zu 3 Covers im Bereich (ohne Garagentor, Tür, Tor) |
| Temperatursensor / Feuchtesensor | Erster passender Sensor im Bereich (ohne Diagnose-Sensoren) |
| Ausschließen | – hier wählst du Entitäten, die nicht automatisch übernommen werden sollen |

Ein Gerät kommt in die Karte, sobald es (oder seine Entität) im Bereich liegt: Einstellungen → Bereiche → Raum → Gerät hinzufügen.

Dasselbe in YAML:

```yaml
type: custom:raumkarte-card
area: wohnzimmer
# optional:
# name: Wohnen
# icon: mdi:sofa
# covers: [cover.raffstore_sued, cover.raffstore_west, cover.rollo_terrasse]
# exclude: [light.vitrine]
```

## Bedienung

| Wo | Geste | Wirkung |
|---|---|---|
| Kopfzeile | Tippen | Raum öffnen |
| Licht-Leiste | Wischen / Tippen auf Position | Alle Lichter des Raums dimmen |
| Licht-Leiste, Glühbirne | Tippen | Alle an / aus |
| Blaue Rollo-Leiste | ▲ / ▼ | Alle Rollos des Raums auf / zu |
| Licht-Kachel im Raum | Wischen | Dimmen |
| Licht-Kachel, Icon | Tippen / Halten | Ein-aus / Details |
| Rollo-Kachel | ▲ ■ ▼ · Tippen auf den Namen | Fahren · Positions-Slider |
| Lamelle | Offen · Halb · Zu | Tilt 100 / 50 / 0 % |
| Klima-Kacheln | Tippen | Verlauf |

- Die Lamellen-Zeile erscheint nur bei Covers, die eine Tilt-Position unterstützen.
- Nicht dimmbare Lichter haben keinen Slider, ein Tipp auf die Kachel schaltet sie.
- Luftfeuchte unter 35 % oder über 60 % wird orange markiert.
- Das Pop-up schließt mit ✕, Tipp daneben, Escape oder der Zurück-Geste.

## Demo ansehen

Im Repository-Ordner einen Webserver starten und `http://localhost:8765/demo/` öffnen:

```bash
python3 -m http.server 8765
```
