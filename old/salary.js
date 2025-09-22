import fs from 'node:fs';
import path from 'node:path';
import xlsx from 'xlsx';
import { create } from 'xmlbuilder2';

// Meta variables
const FORMAT = "LÖNIN";
const VERSION = "2.1";
const LAND = "Sverige";
const PROGRAMNAMN = "Lönekörning";
const EXCEL_FILE = "./lönefiler/input/testfil2.xlsx";
const OUTPUT_FILE = "./lönefiler/output/visa_david2.pax";
const DATE = "2024-03-12";

function createHeader(parent) {
    const header = parent.ele("header");
    header.ele("format").txt(FORMAT);
    header.ele("version").txt(VERSION);
    header.ele("land").txt(LAND);
    header.ele("programnamn").txt(PROGRAMNAMN);
    return header;
}

function createTransaction(wrapper, persnr, lonart, benamning, antal, apris, kommentar, datum) {
    const lonetrans = wrapper.ele("lonetrans").att("persnr", String(persnr));
    lonetrans.ele("lonart").txt(String(lonart));
    lonetrans.ele("benamning").txt(benamning);
    lonetrans.ele("antal").txt(String(antal));
    lonetrans.ele("apris").txt(String(apris));
    const belopp = Number(antal) * Number(apris);
    lonetrans.ele("belopp").txt(String(belopp));
    lonetrans.ele("kommentar").txt(kommentar);
    lonetrans.ele("datum").txt(datum);
    return lonetrans;
}

function createRoot() {
    const root = create().ele("paxml");
    root.att("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    root.att("xsi:noNamespaceSchemaLocation", "http://www.paxml.se/2.1/paxml.xsd");
    return root;
}

function readFileAndBuildXml() {
    const workbook = xlsx.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { raw: true });

    const parent = createRoot();
    createHeader(parent);

    const wrapper = parent.ele("lonetransaktioner");

    for (const row of rows) {
        const lon = row["Lön"];
        const fastLon = row["Fast lön"];

        if ((lon ?? 0) !== 0 && fastLon !== "JA") {
            const personnummer = row["Personnummer"];
            const lonTraning = row["Tr"];
            const lonMatch = row["ma"];
            const lonCup = row["Cu/lä"];
            // Log just like Python
            console.log(`${personnummer} ${lonTraning} ${lonMatch} ${lonCup}`);

            let totalen = 0;

            // Träning
            const trN = Number(row["TrN"] || 0);
            if (trN > 0) {
                const apris = Number(row["Tr"]);
                totalen += trN * apris;
                createTransaction(
                    wrapper,
                    personnummer,
                    "112",
                    "Ersättning träning (antal tillfällen)",
                    trN,
                    apris,
                    "test",
                    DATE
                );
            }

            // Match
            const maN = Number(row["MaN"] || 0);
            if (maN > 0) {
                const apris = Number(row["ma"]);
                totalen += maN * apris;
                createTransaction(
                    wrapper,
                    personnummer,
                    "113",
                    "Ersättning match (antal tillfällen)",
                    maN,
                    apris,
                    "test",
                    DATE
                );
            }

            // Cup/läger
            const cupN = Number(row["CupN"] || 0);
            const lagerN = Number(row["LägerN"] || 0);
            if (cupN > 0 || lagerN > 0) {
                const totalNumber = cupN + lagerN;
                const apris = Number(row["Cu/lä"]);
                totalen += totalNumber * apris;
                createTransaction(
                    wrapper,
                    personnummer,
                    "114",
                    "Ersättning cup/läger (antal dagar)",
                    totalNumber,
                    apris,
                    "test",
                    DATE
                );
            }

            // Optional (commented out in Python): semesterersättning
            // const semesterers = Math.round(totalen * 0.12 * 10) / 10;
            // createTransaction(wrapper, personnummer, "224", "Semesterersättning i anslutning till lön", 1, semesterers, "test", DATE);
        }
    }

    return parent;
}

function writeOutput(root) {
    const dir = path.dirname(OUTPUT_FILE);
    fs.mkdirSync(dir, { recursive: true });

    // Mirror Python: write explicit XML declaration (utf-8, newline) then the XML body
    const metatag = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
    const xmlBody = root.doc().end({ headless: true, prettyPrint: false });
    fs.writeFileSync(OUTPUT_FILE, metatag + xmlBody, "utf8");
}

function main() {
    const root = readFileAndBuildXml();
    writeOutput(root);
    console.log(`Wrote PAXML to ${OUTPUT_FILE}`);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}


