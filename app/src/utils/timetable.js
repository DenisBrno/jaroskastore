/**
 * Formátování času HH:mm
 */
function formatTime(date) {
    return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Pomocná funkce pro výpočet času před hodinou
 */
function odectiMinuty(casStr, minuty) {
    let [h, m] = casStr.split(':').map(Number);
    m -= minuty;
    while (m < 0) {
        m += 60;
        h -= 1;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Získá informaci o právě probíhající nebo nadcházející hodině/přestávce.
 */
function getNadchazejiciHodina(rozvrh) {
    const ted = new Date();
    const dnyMap = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    const dnesZkratka = dnyMap[ted.getDay()];
    
    const nyni = ted.getHours().toString().padStart(2, '0') + ":" + 
                 ted.getMinutes().toString().padStart(2, '0');

    const dnesniLekce = rozvrh[dnesZkratka] || [];

    // 1. Právě probíhá
    const probihajici = dnesniLekce.find(lekce => {
        const [start, konec] = lekce.hodina.split(' - ');
        return nyni >= start && nyni <= konec;
    });

    if (probihajici) {
        probihajici.stav = "Právě probíhá";
        return probihajici;
    }

    // 2. Nadcházející
    const budouci = dnesniLekce.find(lekce => {
        const start = lekce.hodina.split(' - ')[0];
        return start > nyni;
    });

    if (budouci) {
        budouci.stav = "Nadcházející přestávka";
        return budouci;
    }

    return null;
}

module.exports = {
    formatTime,
    odectiMinuty,
    getNadchazejiciHodina
};
