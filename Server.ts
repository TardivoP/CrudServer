"use strict"

// A. Import delle librerie
import http from "http";
import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import { MongoClient, MongoError, ObjectId } from "mongodb";
import queryStringParser from "./queryStringParser";
import cors from "cors";

// PARAMETRI GET: req.query
// PARAMETRI POST: req.body
// PARAMETRI PASSATI COME RISORSA: req.params

// B. Configurazioni
// Funzione di callback richiamata in corrispondenza di ogni richiesta al server
const app: express.Express = express();
dotenv.config(
    {
        path: ".env"
    }
)
const connectionString: string = process.env.connectionStringRemote!;
const dbName: string = process.env.dbName!;
const port: number = parseInt(process.env.port!);

// C. Creazione e avvio del server http
const server = http.createServer(app);
let paginaErrore: string = "";

server.listen(port, function () {
    console.log("Server in ascolto sulla porta: " + port);
    fs.readFile("./static/error.html", function (err, content) {
        if (err)
            paginaErrore = "<h1>Risorsa non trovata</h1>";
        else
            paginaErrore = content.toString();
    });
});

// D. Middleware

// 1. Request log
// Si può anche omettere la risorsa (significa /)
app.use("/", function (req, res, next) {
    console.log(req.method + ": " + req.originalUrl);
    next();
});

// 2. Gestione delle risorse statiche
app.use("/", express.static("./static"));

// 3. Lettura dei parametri POST
// limit permette di accettare post con una dimensione massima di 5MB.
// I parametri POST sono restituiti come JSON all'interno di req.body
// I parametri GET, invece, sono restituiti come JSON all'interno di req.query
// (agganciati automaticamente perché in coda alla url)
app.use("/", express.json({ "limit": "5mb" }));


// 4. Parsing dei parametri GET
// A questa funzione viene direttamente passato req, res, next
app.use("/", queryStringParser);

// 5. Log dei parametri 
app.use("/", function (req:any, res, next) {
    // N.B. In una and, se la prima condizione è falsa, esce subito
    if (req["parsedQuery"] && Object.keys(req["parsedQuery"]).length > 0)
        console.log("       Parametri body: " + JSON.stringify(req.body));

    if (req["body"] && Object.keys(req["body"]).length > 0)
        console.log("       Parametri body: " + JSON.stringify(req.body));
    next();
});



// 6. Vincoli CORS
// Accettiamo richieste da qualunque client
const corsOptions = {
    origin: function (origin: any, callback: any) {
        return callback(null, true);
    },
    credentials: true
};

app.use("/", cors(corsOptions));

// E. Gestione delle risorse dinamiche

// Elenco delle collezioni
app.get("/api/getCollections", async function (req, res, next) {
    const client: MongoClient = new MongoClient(connectionString);
    await client.connect().catch(function (err) {
        res.status(503).send("Errore di connessione al db");
        return;
    });

    const db = client.db(dbName);
    const cmd = db.listCollections().toArray();

    cmd.then(function (data) {
        res.send(data);
    });
    cmd.catch(function (err: MongoError) {
        res.status(500).send("Errore lettura collezioni: " + err);
    });
    cmd.finally(function () {
        client.close();
    });
});

// inviaRichiesta("GET", "/unicorns", {filters})
app.get("/api/:collection", async function (req:any, res, next) {
    const selectedCollection = req.params.collection;
    const filters = req["parsedQuery"] ;
    const client: MongoClient = new MongoClient(connectionString);

    await client.connect().catch(function (err: MongoError) {
        res.status(503).send("Errore di connessione al db");
        return;
    });

    const collection = client.db(dbName).collection(selectedCollection);
    const cmd = collection.find(filters).toArray();

    cmd.then(function (data) {
        res.send(data);
    });
    cmd.catch(function (err: MongoError) {
        res.status(500).send("Errore esecuzione query: " + err);
    });
    cmd.finally(function () {
        client.close();
    });
});

// inviaRichiesta("GET", "/unicorns/id"})
app.get("/api/:collection/:id", async function (req, res, next) {
    const selectedCollection = req.params.collection;
    const selectedId = req.params.id;

    const client: MongoClient = new MongoClient(connectionString);

    await client.connect().catch(function (err: MongoError) {
        res.status(503).send("Errore di connessione al db");
        return;
    });

    const collection = client.db(dbName).collection(selectedCollection);
    const cmd = collection.findOne({ "_id": new ObjectId(selectedId) });

    cmd.then(function (data) {
        res.send(data);
    });
    cmd.catch(function (err: MongoError) {
        res.status(500).send("Errore esecuzione query: " + err);
    });
    cmd.finally(function () {
        client.close();
    });
});

// inviaRichiesta("POST", "/unicorns" {newRecord})
app.post("/api/:collection", async function (req, res, next) {
    const selectedCollection = req.params.collection;
    const newRecord = req.body;

    const client: MongoClient = new MongoClient(connectionString);

    await client.connect().catch(function (err: MongoError) {
        res.status(503).send("Errore di connessione al db");
        return;
    });

    const collection = client.db(dbName).collection(selectedCollection);
    const cmd = collection.insertOne(newRecord);

    cmd.then(function (data) {
        res.send(data);
    });
    cmd.catch(function (err: MongoError) {
        res.status(500).send("Errore esecuzione query: " + err);
    });
    cmd.finally(function () {
        client.close();
    });
});

// inviaRichiesta("DELETE", "/unicorns/id")
app.delete("/api/:collection/:id", async function (req, res, next) {
    const selectedCollection = req.params.collection;
    const _id = req.params.id;

    const client: MongoClient = new MongoClient(connectionString);

    await client.connect().catch(function (err: MongoError) {
        res.status(503).send("Errore di connessione al db");
        return;
    });

    const collection = client.db(dbName).collection(selectedCollection);
    const cmd = collection.deleteOne({ "_id": new ObjectId(_id) });

    cmd.then(function (data) {
        res.send(data);
    });
    cmd.catch(function (err: MongoError) {
        res.status(500).send("Errore esecuzione query: " + err);
    });
    cmd.finally(function () {
        client.close();
    });
});

app.get("/api/richiestaParams/:gender/:id", function (req, res, next) {
    const gender = req.params.gender;
    const id = req.params.id;

    if (isNaN(parseInt(id)))
        res.status(422).send("Formato valore id non valido.\nAtteso valore numerico");
    else {
        // Dovrei cercarli nel db
        res.send({ id, gender });
    }
});

// inviaRichiesta("DELETE", "/unicorns/")
app.delete("/api/:collection", async function (req: any, res, next) {
    const selectedCollection = req.params.collection;
    const filter = req["parsedQuery"]

    const client: MongoClient = new MongoClient(connectionString);

    await client.connect().catch(function (err: MongoError) {
        res.status(503).send("Errore di connessione al db");
        return;
    });

    const collection = client.db(dbName).collection(selectedCollection);
    const cmd = collection.deleteMany(filter);

    cmd.then(function (data) {
        res.send(data);
    });
    cmd.catch(function (err: MongoError) {
        res.status(500).send("Errore esecuzione query: " + err);
    });
    cmd.finally(function () {
        client.close();
    });
});

/// inviaRichiesta("PATCH", "/unicorns/id", {fieldsToUpdate})
app.patch("/api/:collection/:id", async function (req, res, next) {

    const selectedCollection = req.params.collection;
    const id =new ObjectId (req.params.id)
    const action = req.body;

    const client: MongoClient = new MongoClient(connectionString);

    await client.connect().catch(function (err: MongoError) {
        res.status(503).send("Errore di connessione al db");
        return;
    });

    const collection = client.db(dbName).collection(selectedCollection);
    const cmd = collection.updateOne({"_id":id},{"$set":action});

    cmd.then(function (data) {
        res.send(data);
    });
    cmd.catch(function (err: MongoError) {
        res.status(500).send("Errore esecuzione query: " + err);
    });
    cmd.finally(function () {
        client.close();
    });
});


/// inviaRichiesta("PUT", "/unicorns/id", {mongoActions})
app.put("/api/:collection/:id", async function (req, res, next) {

    const selectedCollection = req.params.collection;
    const id =new ObjectId (req.params.id)
    const action = req.body;

    const client: MongoClient = new MongoClient(connectionString);

    await client.connect().catch(function (err: MongoError) {
        res.status(503).send("Errore di connessione al db");
        return;
    });

    const collection = client.db(dbName).collection(selectedCollection);
    const cmd = collection.updateOne({"_id":id},action);

    cmd.then(function (data) {
        res.send(data);
    });
    cmd.catch(function (err: MongoError) {
        res.status(500).send("Errore esecuzione query: " + err);
    });
    cmd.finally(function () {
        client.close();
    });
});


/// inviaRichiesta("PUT", "/unicorns/", {"filter":{filters}, "action":{mongoActions}})
app.put("/api/:collection/", async function (req, res, next) {

    const selectedCollection = req.params.collection;
    const filter = req.body.filter;
    const action = req.body.action

    const client: MongoClient = new MongoClient(connectionString);

    await client.connect().catch(function (err: MongoError) {
        res.status(503).send("Errore di connessione al db");
        return;
    });

    const collection = client.db(dbName).collection(selectedCollection);
    const cmd = collection.updateMany(filter,action);

    cmd.then(function (data) {
        res.send(data);
    });
    cmd.catch(function (err: MongoError) {
        res.status(500).send("Errore esecuzione query: " + err);
    });
    cmd.finally(function () {
        client.close();
    });
});

// F. Default route
app.use("/", function (req, res, next) {
    // Se non viene res.status il codice di default è 200
    res.status(404);
    if (!req.originalUrl.startsWith("/api/")) {
        // Risorsa statica
        res.send(paginaErrore);
    }
    else
        res.send("Risorsa non trovata");
});

// G. Gestione degli errori
app.use("/", function (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
    // err.stack dà lo stack completo degli errori
    console.log("** Errore **\n" + err.stack);
    res.status(500).send(err.message);
});