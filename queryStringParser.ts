/// req.query è in sola lettura e neanche le singole chiavi


function parseQueryString(req: any, res: any, next: any) {
    // Con questa funzione andiamo a modificare req.query parsificando ogni valore

    req["parsedQuery"] = {}
    // !obj per verificare che obj == null
    if (req["query"] && typeof req["query"] == "object") {
        for (const key in req["query"]) {
            const value = req["query"][key];
            req["parsedQuery"][key] = parseValue(value);
        }
    }

    next();
}

function parseValue(value: any) {
    if (value == "true" || value == "false")
        return value as boolean;

    // parseInt() si ferma al primo carattere non numerico che incontra. Number restituisce
    // il numero solo se la stringa è totalmente numerica. Number accetta sia interi che decimali
    // Stringa = "15a":
    //      parseInt("15a") ==> 15
    //      Number("15a") ==> NaN
    const num = Number(value);

    if (!isNaN(num)) // Se è un numero valido
        return num;

    // Non funziona perché NaN è sempre un numero di tipo Number (che significa che non è un numero valido)
    // Di conseguenza la if avrebbe esito positivo
    // if (typeof num == "number")
    //     return num;

    // Controllo se value è un vettore o un JSON
    if (typeof value == "string" && (value.startsWith("{") || value.startsWith("["))) {
        try {
            return JSON.parse(value);
        }
        catch (error) {
            return value;
        }
    }

    // Ultimo caso: value è una stringa
    return value;
}

export default parseQueryString;
