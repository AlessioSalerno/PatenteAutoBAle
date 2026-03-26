// Variabili globali per il Quiz
let domandeSelezionate = [];
let indiceCorrente = 0;
let errori = 0;

// Eseguito al caricamento della pagina (Connessione Database)
window.onload = function() {
    if (typeof database !== 'undefined' && database.length > 0) {
        console.log("Database connesso! Quiz:", database.length);
        caricaArchivio(); // Popola subito la tabella archivio
        switchTab('quiz'); // Mostra subito l'area studente
    } else {
        console.error("ERRORE: database.js non trovato o vuoto. Controlla il file.");
        alert("Errore nel caricamento del database!");
    }
};

// --- GESTIONE TAB ---
function switchTab(tabId) {
    // Nasconde tutti i contenuti
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));

    // Mostra il contenuto selezionato
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    document.getElementById('btn-tab-' + tabId).classList.add('active');

    // Azioni specifiche per tab
    if (tabId === 'archivio') caricaArchivio();
    
    // Se esce da aggiungi, annulla la modifica in corso
    if (tabId !== 'aggiungi') {
        annullaModifica(); // Pulisce il form
    }
}

// --- LOGICA QUIZ (STUDENTE) ---
function iniziaQuiz(modalita) {
    document.getElementById('menu-scelta').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');

    if (modalita === 'esame') {
        domandeSelezionate = [...database].sort(() => 0.5 - Math.random()).slice(0, 30);
    } else {
        domandeSelezionate = [...database]; // MODALITÀ STUDIO: Carica TUTTO
    }

    indiceCorrente = 0;
    errori = 0;
    document.getElementById('errori-count').innerText = 0;
    mostraDomanda();
}

function mostraDomanda() {
    const d = domandeSelezionate[indiceCorrente];
    document.getElementById('corrente').innerText = indiceCorrente + 1;
    document.getElementById('totale').innerText = domandeSelezionate.length;
    document.getElementById('testo-domanda').innerText = d.testo;
    
    // GESTIONE IMMAGINE NEL QUIZ
    const imgCont = document.getElementById('immagine-quiz-container');
    const imgTag = document.getElementById('immagine-quiz');

    if (d.immagine && d.immagine !== "") {
        imgTag.src = d.immagine; // Imposta il percorso locale o web
        imgCont.classList.remove('hidden');
    } else {
        imgCont.classList.add('hidden'); // Nasconde se non c'è foto
    }

    document.getElementById('feedback').innerText = "";
}

function rispondi(valoreUtente) {
    const corretta = domandeSelezionate[indiceCorrente].rispostaCorretta;
    const f = document.getElementById('feedback');
    
    if (valoreUtente === corretta) {
        f.innerText = "CORRETTO! ✅";
        f.style.color = "green";
    } else {
        f.innerText = "ERRORE! ❌";
        f.style.color = "red";
        errori++;
        document.getElementById('errori-count').innerText = errori;
    }

    setTimeout(() => {
        indiceCorrente++;
        if (indiceCorrente < domandeSelezionate.length) {
            mostraDomanda();
        } else {
            finalizzaTest();
        }
    }, 1000);
}

function finalizzaTest() {
    alert("Test completato!\nErrori totali: " + errori);
    location.reload(); // Ricarica per tornare al menu
}

// --- LOGICA ARCHIVIO E GESTIONE (INSEGNANTE) ---
function caricaArchivio() {
    const tbody = document.getElementById('corpo-tabella');
    tbody.innerHTML = ""; // Pulisce tabella

    database.forEach((d, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${d.id}</td>
                
                <td>${d.immagine ? `<img src="${d.immagine}" class="mini-foto" title="${d.immagine}">` : 'Nessuna'}</td>
                
                <td><strong>${d.argomento}</strong></td>
                <td style="text-align: left;">${d.testo}</td>
                <td class="${d.rispostaCorretta ? 'txt-vero' : 'txt-falso'}">${d.rispostaCorretta ? 'VERO' : 'FALSO'}</td>
                
                <td class="action-buttons">
                    <button class="btn-edit" onclick="preparaModifica(${index})">Modifica</button>
                    <button class="btn-del" onclick="eliminaQuiz(${index})">Elimina</button>
                </td>
            </tr>
        `;
    });
}

function filtraArchivio() {
    let filter = document.getElementById('searchBar').value.toUpperCase();
    let rows = document.getElementById('corpo-tabella').getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        let text = rows[i].getElementsByTagName('td')[3].textContent; // Cerca nella colonna "Testo"
        rows[i].style.display = text.toUpperCase().indexOf(filter) > -1 ? "" : "none";
    }
}

// --- LOGICA INSERIMENTO / MODIFICA (La Parte Mancante) ---

function salvaNuovoQuiz() {
    const id = document.getElementById('new-id').value.trim();
    const text = document.getElementById('new-text').value.trim();
    const imgFile = document.getElementById('new-img').files[0];
    const imgPath = document.getElementById('new-img-path').value.trim();
    const isTrue = document.getElementById('new-ans').value === "true";
    const editIndex = parseInt(document.getElementById('edit-index').value); // Capisce se stiamo modificando

    if (!id || !text) return alert("Compila ID e Testo della domanda!");

    let percorsoImmagine = "";
    if (imgFile) {
        // Se si carica un file, ipotizziamo sia nella cartella 'immagini'
        percorsoImmagine = "immagini/" + imgFile.name; 
        alert("Sposta la foto '" + imgFile.name + "' nella cartella 'immagini' per vederla!");
    } else if (imgPath) {
        // Altrimenti prendiamo il percorso testuale scritto
        percorsoImmagine = imgPath;
    }

    const quizData = {
        id: id,
        argomento: document.getElementById('new-arg').value.trim(),
        testo: text,
        immagine: percorsoImmagine,
        rispostaCorretta: isTrue
    };

    if (editIndex > -1) {
        // --- SEZIONE MODIFICA ---
        database[editIndex] = quizData; // Aggiorna l'oggetto esistente nell'array
        alert("Quiz modificato con successo nell'archivio temporaneo!");
    } else {
        // --- SEZIONE NUOVO ---
        database.push(quizData); // Aggiunge nuovo quiz in coda
        alert("Quiz aggiunto all'archivio temporaneo.");
    }

    annullaModifica(); // Pulisce form e resetta stato
    switchTab('archivio'); // Torna all'archivio per vedere la modifica
}

function preparaModifica(index) {
    const quiz = database[index];
    switchTab('aggiungi'); // Mostra il form

    // Aggiorna Interfaccia Form
    document.getElementById('form-title').innerText = "Modifica Quiz ID: " + quiz.id;
    document.getElementById('btn-save').innerText = "Aggiorna Quiz";
    document.getElementById('btn-cancel').classList.remove('hidden'); // Mostra tasto annulla

    // Riempie i campi con i dati esistenti
    document.getElementById('new-id').value = quiz.id;
    document.getElementById('new-arg').value = quiz.argomento;
    document.getElementById('new-text').value = quiz.testo;
    document.getElementById('new-img-path').value = quiz.immagine; // Mostra il percorso attuale
    document.getElementById('new-ans').value = quiz.rispostaCorretta.toString();
    
    // Imposta l'indice nel campo nascosto (Importante!)
    document.getElementById('edit-index').value = index; 
}

function annullaModifica() {
    // Reset Interfaccia Form
    document.getElementById('form-title').innerText = "Aggiungi Nuovo Quiz";
    document.getElementById('btn-save').innerText = "Salva Quiz";
    document.getElementById('btn-cancel').classList.add('hidden'); // Nasconde tasto annulla

    // Pulisce tutti i campi
    document.getElementById('new-id').value = "";
    document.getElementById('new-arg').value = "";
    document.getElementById('new-text').value = "";
    document.getElementById('new-img').value = ""; // Pulisce file input
    document.getElementById('new-img-path').value = "";
    document.getElementById('new-ans').value = "true";
    document.getElementById('edit-index').value = "-1"; // Resetta l'indice di modifica
}

function eliminaQuiz(index) {
    if(confirm("Sei sicuro di voler eliminare DEFINITIVAMENTE questo quiz dall'archivio temporaneo?")) {
        database.splice(index, 1);
        caricaArchivio();
    }
}

function scaricaDatabase() {
    // Genera il codice JS per il file database.js aggiornato
    const jsContent = "const database = " + JSON.stringify(database, null, 4) + ";";
    const blob = new Blob([jsContent], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'database.js'; // Scarica il file aggiornato
    a.click();
    alert("Database scaricato. Sostituisci il vecchio file database.js nella cartella!");
}
