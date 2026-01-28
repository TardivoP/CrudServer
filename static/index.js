"use strict"



// inizializzazione puntatori
const divIntestazione = document.getElementById("divIntestazione");
const divFilters = document.querySelector(".card");
const lstHair = document.getElementById("lstHair");
const divCollections = document.getElementById("divCollections");
const table = document.getElementById("mainTable");
const thead = table.querySelector("thead");
const tbody = table.querySelector("tbody");
const divDettagli = document.getElementById("divDettagli");
const chkGender = divFilters.querySelectorAll("input[type=checkbox]");

// avvio
let currentCollection = "";
divFilters.style.display = "none";

btnAdd.disabled = true;
btnUpdate.disabled = true;

getCollections();

chkGender[0].addEventListener("click", function () {
    chkGender[1].checked = false;
});

chkGender[1].addEventListener("click", function () {
    chkGender[0].checked = false;
})

async function getCollections() {
    const response = await inviaRichiesta("GET", "/getCollections");

    if (response.status == 200) {
        console.log(response.data);
        const collections = response.data;
        const label = divCollections.querySelector("label");

        for (const collection of collections) {
            // Clona la label, con true clona anche discendenti della label, altrimenti no
            const clonedLabel = label.cloneNode(true);
            clonedLabel.querySelector("span").textContent = collection.name;
            clonedLabel.querySelector("input[type=radio]").addEventListener("click", function () {
                currentCollection = collection.name;
                btnAdd.disabled = false;
                btnUpdate.disabled = false;
                getData();
            });
            divCollections.appendChild(clonedLabel);
        }
        // Rimuoviamo la label originale
        label.remove();
    }
}

// Se non passiamo i filters viene impostato a JSON vuoto
async function getData(filters = {}) {
    const response = await inviaRichiesta("GET", `/${currentCollection}`, filters);

    if (response.status == 200) {
        console.log(response.data);
        const strongs = divIntestazione.querySelectorAll("strong");
        strongs[0].textContent = currentCollection;
        strongs[1].textContent = response.data.length;
        tbody.innerHTML = "";

        for (const item of response.data) {
            const tr = document.createElement("tr");
            // append() permette di appendere più elementi insieme, a differenza di appendChild()
            tbody.append(tr);

            let td = document.createElement("td");
            td.addEventListener("click", function () {
                getCurrent(item._id);
            });
            td.textContent = item._id;
            tr.append(td);

            td = document.createElement("td");
            td.addEventListener("click", function () {
                getCurrent(item._id);
            })
            // Prendo la prima chiave dopo _id
            const secondKey = Object.keys(item)[1];
            // item["secondKey"] equivale a item.secondKey. In questo caso cerco la chiave
            // uguale al valore di secondKey (non il nome della variabile ma il valore!)
            td.textContent = item[secondKey];
            tr.append(td);

            // querySelector e querySelectorAll prende figli e nipoti
            // thead.querySelector("th:nth-of-type(2)");
            thead.querySelectorAll("th")[1].textContent = secondKey;

            td = document.createElement("td");
            // Patch
            let div = document.createElement("div");
            div.addEventListener("click", function () { patchCurrent(item._id) })
            td.append(div);
            // Put
            div = document.createElement("div");
            div.addEventListener("click", function () { putCurrent(item.id) })
            td.append(div);
            // Delete
            div = document.createElement("div");
            div.addEventListener("click", function () {
                deleteCurrent(item._id);
            });
            td.append(div);

            tr.append(td);
        }
        if (currentCollection == "unicorns") {
            divFilters.style.display = "";
        }
        else
            divFilters.style.display = "none";
        divDettagli.innerHTML = "";
    }
    else
        alert(response.status + ": " + response.err);
}

async function getCurrent(_id) {
    const response = await inviaRichiesta("GET", `/${currentCollection}/${_id}`);

    if (response.status == 200) {
        console.log(response.data);
        const currentItem = response.data;

        divDettagli.innerHTML = "";
        for (const key in currentItem) {
            const strong = document.createElement("strong");
            strong.textContent = key + ": ";
            divDettagli.append(strong);

            const span = document.createElement("span");
            span.textContent = JSON.stringify(currentItem[key]);
            divDettagli.append(span);

            divDettagli.append(document.createElement("br"));
        }
    }
    else
        alert(response.status + ": " + response.err);
}

// Procedura btnFind
btnFind.addEventListener("click", function () {

    let filters = {
        weight: 600,
        loves: [
            "carrot", "papaya"
        ],
        vampires: { $gt: 60 }
    }
    getData(getFilters());


});

btnAdd.addEventListener("click", function () {
    divDettagli.innerHTML = "";

    const textArea = document.createElement("textarea");
    divDettagli.append(textArea);
    textArea.style.height = "100px";
    textArea.value = '{\n "name": "Pippo",\n "example": "modify this"\n}';

    addTextAreaBtn("POST");
});

function addTextAreaBtn(method, _id = "") {
    let btn = document.createElement("button");

    divDettagli.append(btn);
    btn.textContent = "Salva";
    btn.classList.add("btn", "btn-success", "btn-sm");
    btn.style.margin = "10px";

    btn.addEventListener("click", async function () {
        let record = divDettagli.querySelector("textarea").value;

        try {
            record = JSON.parse(record);
        }
        catch (error) {
            alert("JSON non valido\n" + error);
            console.log(error);
            return;
        }


        let resource = "/" + currentCollection;


        /// se abbiamo un id (richieste patch o put) lo concateno
        if (_id) {
            resource += "/" + _id
        }



        const response = await inviaRichiesta(method, resource, record);

        if (response.status == 200) {
            console.log(response.data);
            alert("Operazione eseguita con successo");
            getData();
        }
        else
            alert(response.status + ": " + response.err);
    });

    btn = document.createElement("button");
    divDettagli.append(btn);
    btn.textContent = "Annulla";
    btn.classList.add("btn", "btn-secondary", "btn-sm");
    btn.addEventListener("click", function () {
        divDettagli.innerHTML = "";
    });
}

async function deleteCurrent(_id) {
    if (confirm("Vuoi veramente cancellare il record " + _id + "?")) {
        const resource = `/${currentCollection}/${_id}`;
        const response = await inviaRichiesta("DELETE", resource);

        if (response.status == 200) {
            console.log(response.data);
            alert("Record eliminato correttamente");
            getData();
        }
        else
            alert(response.status + ": " + response.err);
    }
}

btnDelete.addEventListener("click", async function () {

    let filters = {
        weight: 600,
        loves: [
            "carrot", "papaya"
        ],
        vampires: { $gt: 60 }
    }
    if (confirm("Vuoi veramente cancellare il record " + JSON.stringify(filters) + "?")) {
        const resource = `/${currentCollection}/${_id}`;
        const response = await inviaRichiesta("DELETE", resource, filters);

        if (response.status == 200) {
            console.log(response.data);
            alert("Record eliminato correttamente");
            getData();
        }
        else
            alert(response.status + ": " + response.err);
    }
});

function getFilters() {
    const hair = lstHair.value;
    let gender = "";
    const genderChecked = divFilters.querySelector("input[type=checkbox]:checked");

    if (genderChecked)
        gender = genderChecked.value;

    let filters = {};

    if (hair != "All")
        filters.hair = hair.toLowerCase();

    if (gender)
        filters.gender = gender.toLowerCase();
}


async function patchCurrent(id) {
    let resource = `${currentCollection}/${id}`
    const response = await inviaRichiesta("GET", resource);

    if (response.status == 200) {
        console.log(response.data);
        divDettagli.innerHTML = ""
        let current = response.data

        /// da usare solo su jsno altrimenti lascia il buco
        delete (current._id)

        const txtArea = document.createElement("textarea")
        divDettagli.append(txtArea)
        txtArea.value = JSON.stringify(current, null, 2)
        txtArea.style.height = txtArea.scrollHeight + "px"

        addTextAreaBtn("patch", _id)


    }

    else {

        alert(response.status + ": " + response.err);
    }
}


async function putCurrent(id) {

    divDettagli.innerHTML = ""
    let textArea = document.createElement("textarea")
    divDettagli.append(textArea)

    textArea.style.height = 100 + "px"

    /// es. istruzione mongo
    textArea.value = `{\n "$inc":{"vampires": 2}\n}`
    addTextAreaBtn("put", id)


}

btnUpdate.addEventListener("click", function () {

    divDettagli.innerHTML = ""
    let textArea = document.createElement("textarea")
    divDettagli.append(textArea)

    textArea.style.height = 100 + "px"

    /// es. istruzione mongo
    textArea.value = `{\n"filter":\n {"gender": "m"},\n"action": \n{"$inc": {"vampires": 2}}},`
    addTextAreaBtn("put")

})