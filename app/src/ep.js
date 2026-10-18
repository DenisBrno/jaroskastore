const https = require('https');
const fs = require('fs').promises;

// Importy z vlastních modulů
const { formatTime, odectiMinuty } = require('./utils/timetable');

const EDUPAGE_URL = "https://jaroska.edupage.org/webcal?pwd=6F62500CAA9A1E9B&type=plan&studentid=-2741";

const MAPA_UCEBEN = {
    "1D": "201", "2B": "309", "Ch1": "214", "M": "305", "4B": "401",
    "N": "501", "A": "502", "J2": "510", "Bi1": "401", "1Az": "410",
    "D": "411", "F1": "301", "Hv": "514", "Tv1": "pouze po domluvě",
    "2Csv": "416", "3Amf": "316", "1C": "407", "J1": "513", "2Ač": "405", "T1": "313"
};

function cleanText(text) {
    if (!text) return "";
    return text.split('\n')[0].split('\r')[0].replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\/g, '').trim();
}

function parseICalDate(dateStr) {
    const rok = dateStr.substring(0, 4);
    const mesic = dateStr.substring(4, 6) - 1;
    const den = dateStr.substring(6, 8);
    const hod = dateStr.substring(9, 11);
    const min = dateStr.substring(11, 13);
    return new Date(Date.UTC(rok, mesic, den, hod, min));
}

function prevodNaMinuty(cas) {
    if (!cas) return 0;
    const [h, m] = cas.split(':').map(Number);
    return h * 60 + m;
}

// Kontrola, zda přestávka zasahuje do rozmezí 11:30 - 12:00
function jeVRozmeziToustu(startCas, konecCas) {
    const startM = prevodNaMinuty(startCas);
    const konecM = prevodNaMinuty(konecCas);
    // Rozmezí 11:30 (690 min) až 12:00 (720 min)
    return (startM >= 690 && startM < 720) || (konecM > 690 && konecM <= 720) || (startM <= 690 && konecM >= 720);
}

function generujPrestavky(rozvrh) {
    const prestavky = {};
    for (let den in rozvrh) {
        prestavky[den] = [];
        const lekce = rozvrh[den];
        if (lekce.length > 0) {
            const startPrvni = lekce[0].hodina.split(' - ')[0];
            const startRanniPrestavky = odectiMinuty(startPrvni, 10);
            const cistaUcebnaRano = lekce[0].trida.split('->').pop().trim();
            
            let formatovanaUcebnaRano = MAPA_UCEBEN[cistaUcebnaRano] ? `${cistaUcebnaRano} - ${MAPA_UCEBEN[cistaUcebnaRano]}` : cistaUcebnaRano;
            
            if (den !== "Po" && jeVRozmeziToustu(startRanniPrestavky, startPrvni)) {
                formatovanaUcebnaRano = "TOUSTU V KLUBU";
            }

            prestavky[den].push({
                hodina: `${startRanniPrestavky} - ${startPrvni}`,
                ucebna: formatovanaUcebnaRano
            });

            for (let i = 0; i < lekce.length - 1; i++) {
                const konecAktualni = lekce[i].hodina.split(' - ')[1];
                const startDalsi = lekce[i + 1].hodina.split(' - ')[0];
                
                if (konecAktualni !== startDalsi && prevodNaMinuty(konecAktualni) < prevodNaMinuty(startDalsi)) {
                    const cistaUcebna = lekce[i + 1].trida.split('->').pop().trim();
                    
                    let formatovanaUcebna = MAPA_UCEBEN[cistaUcebna] ? `${cistaUcebna} - ${MAPA_UCEBEN[cistaUcebna]}` : cistaUcebna;
                    
                    if (den !== "Po" && jeVRozmeziToustu(konecAktualni, startDalsi)) {
                        formatovanaUcebna = "TOUSTU V KLUBU";
                    }

                    prestavky[den].push({
                        hodina: `${konecAktualni} - ${startDalsi}`,
                        ucebna: formatovanaUcebna
                    });
                }
            }
        }
    }
    return prestavky;
}

function zpracujData(icalRaw) {
    const dnyMap = { 1: "Po", 2: "Út", 3: "St", 4: "Čt", 5: "Pá" };
    const rozvrhRaw = { "Po": [], "Út": [], "St": [], "Čt": [], "Pá": [] };
    
    const dnes = new Date();
    let zakladniDatum = new Date(dnes);
    
    const denVTydu = dnes.getDay();
    const hodina = dnes.getHours();
    
    if ((denVTydu === 5 && hodina >= 13) || denVTydu === 6 || denVTydu === 0) {
        zakladniDatum.setDate(dnes.getDate() + 7);
    }

    const pondeli = new Date(zakladniDatum);
    pondeli.setDate(zakladniDatum.getDate() + (zakladniDatum.getDay() === 0 ? -6 : 1 - zakladniDatum.getDay()));
    pondeli.setHours(0, 0, 0, 0);
    
    const nedele = new Date(pondeli);
    nedele.setDate(pondeli.getDate() + 6);
    nedele.setHours(23, 59, 59, 999);

    const udalosti = icalRaw.split('BEGIN:VEVENT');
    udalosti.shift();

    udalosti.forEach(blok => {
        const summary = cleanText(blok.match(/SUMMARY:(.*)/)?.[1]);
        const location = cleanText(blok.match(/LOCATION:(.*)/)?.[1]);
        const dtstartRaw = blok.match(/DTSTART:(\d+T\d+Z)/)?.[1];
        const dtendRaw = blok.match(/DTEND:(\d+T\d+Z)/)?.[1];

        if (summary && dtstartRaw && dtendRaw) {
            const start = parseICalDate(dtstartRaw);
            const konec = parseICalDate(dtendRaw);
            if (start >= pondeli && start <= nedele) {
                const denZkratka = dnyMap[start.getDay()];
                if (denZkratka) {
                    rozvrhRaw[denZkratka].push({ start, konec, predmet: summary, trida: location });
                }
            }
        }
    });

    const finalniRozvrh = {};
    for (let den in rozvrhRaw) {
        rozvrhRaw[den].sort((a, b) => a.start - b.start);
        const sloucenyDen = [];
        rozvrhRaw[den].forEach(hodina => {
            if (sloucenyDen.length > 0) {
                const posledni = sloucenyDen[sloucenyDen.length - 1];
                if (posledni.predmet === hodina.predmet && posledni.trida === hodina.trida && posledni._rawKonec.getTime() === hodina.start.getTime()) {
                    posledni.hodina = `${posledni._rawStartStr} - ${formatTime(hodina.konec)}`;
                    posledni._rawKonec = hodina.konec;
                    return;
                }
            }
            sloucenyDen.push({
                hodina: `${formatTime(hodina.start)} - ${formatTime(hodina.konec)}`,
                predmet: hodina.predmet,
                trida: hodina.trida,
                _rawStartStr: formatTime(hodina.start),
                _rawKonec: hodina.konec
            });
        });
        finalniRozvrh[den] = sloucenyDen.map(({_rawStartStr, _rawKonec, ...rest}) => rest);
    }
    return finalniRozvrh;
}

function stahniEdupage() {
    return new Promise((resolve, reject) => {
        https.get(EDUPAGE_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function aktualizujRozvrh() {
    try {
        const data = await stahniEdupage();
        const zpracovaneHodiny = zpracujData(data);
        const pouzePrestavky = generujPrestavky(zpracovaneHodiny);
        await fs.writeFile('../rescources/rozvrh.json', JSON.stringify(pouzePrestavky, null, 2), 'utf8');
        console.log('✅ Rozvrh aktualizován.');
    } catch (err) {
        console.error('❌ Chyba:', err);
    }
}

aktualizujRozvrh();