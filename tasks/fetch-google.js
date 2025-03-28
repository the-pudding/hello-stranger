import fs from "fs";
import archieml from "archieml";
import docs from "../google.config.js";
import csv from 'csvtojson';

const CWD = process.cwd();

const fetchGoogle = async ({ id, gid }) => {
    console.log(`fetching...${id}`);

    const base = "https://docs.google.com";
    const post = gid
        ? `spreadsheets/u/1/d/${id}/export?format=csv&id=${id}&gid=${gid}`
        : `document/d/${id}/export?format=txt`;
    const url = `${base}/${post}`;

    try {
        const response = await fetch(url);
        const text = await response.text();

        if (gid) return text;

        const parsed = archieml.load(text);
        const str = JSON.stringify(parsed);
        return str;
    } catch (err) {
        throw new Error(err);
    }
};

async function makeJSON(f, group) {
    const colParser = {
        'colors': (item) => processColumn(item),
        'labels': (item) => processColumn(item)
    };

    function processColumn(item) {
        if (item) {
            try {
                return JSON.parse(item).map(el => cleanString(el));
            } catch (e) {
                return item.split(',').map(el => cleanString(el));
            }
        } else {
            return null;
        }
    }

    function cleanString(str) {
        return str.trim().replace(/^["\\]+|["\\]+$/g, '').replace("[\"","").replace("\"]","").replace("[","").replace("]","");
    }

    const checkType = (item) => {
        if (!isNaN(item)) return parseFloat(item);
        if (item.startsWith('[') && item.endsWith(']')) {
            try {
                return JSON.parse(item.replace(/\\'/g, "'"));
            } catch (e) {
                return item;
            }
        }
        return item;
    };

    if (f.endsWith('.csv')) {
        try {
            const jsonArray = await csv({ colParser, checkType }).fromFile(f);

            if (group) {
                const grouped = {};

                for (let row of jsonArray) {
                    const groupKey = row[group.group];

                    if (group.id) {
                        const idKey = row[group.id];
                        if (!grouped[groupKey]) grouped[groupKey] = {};
                        grouped[groupKey][idKey] = row;
                    } else {
                        grouped[groupKey] = row;
                    }
                }

                return JSON.stringify(grouped, null, 2);
            }

            return JSON.stringify(jsonArray, null, 2);
        } catch (error) {
            console.error("Error converting CSV to JSON:", error);
            throw error;
        }
    }
}



(async () => {
    for (let d of docs) {
        try {
            const str = await fetchGoogle(d);
            const file = `${CWD}/${d.filepath}`;
            fs.writeFileSync(file, str);
            if (file.indexOf("csv") != -1) {
                const jsonStr = await makeJSON(file, d.group);
                fs.writeFileSync(file.replace("csv", "json"), jsonStr);
            }
        } catch (err) {
            console.log(err);
        }
    }
})();
