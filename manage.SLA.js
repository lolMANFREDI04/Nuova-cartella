function add_SLA() {
    // Esegui una richiesta AJAX per ottenere la lista dei clienti
    $.ajax({
        url: '/SLA/api/get_clients',
        type: 'GET',
        success: function(response) {
            // Se la richiesta ha successo, popola il dropdown dei clienti
            const clients = response.clients;
            const clientDropdown = document.getElementById('client_id');
            clientDropdown.innerHTML = ''; // Pulisci il dropdown

            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.text = client.name;
                clientDropdown.appendChild(option);
            });

            // Mostra il modale
            $('#modal_add_SLA').modal('show');
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante il recupero dei clienti, mostra un messaggio di errore
            alert("Si è verificato un errore durante il recupero dei clienti.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}

function saveSLA() {
    var client_id = $('#client_id').val();
    var sla_type_id = $('#sla_type_id').val();
    var critical = $('#critical').val();
    var high = $('#high').val();
    var medium = $('#medium').val();
    var low = $('#low').val();

    // Effettua la chiamata AJAX al backend includendo i valori degli ID
    $.ajax({
        url: '/manage/SLA/save',
        type: 'POST',
        data: {
            client_id: client_id,
            sla_type_id: sla_type_id,
            critical: critical,
            high: high,
            medium: medium,
            low: low
        },
        success: function(response) {
            // Se il salvataggio ha successo, chiudi il modale e mostra un messaggio di conferma
            $('#modal_add_SLA').modal('hide');
            alert(response); // Mostra la risposta ricevuta dal backend (potrebbe essere "SLA salvata con successo")
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante il salvataggio, mostra un messaggio di errore
            alert("Si è verificato un errore durante il salvataggio della SLA.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}
// Funzione per ottenere e visualizzare i dati dei tipi di SLA
function getAllSLATypes() {
    fetch('/SLA/api/get_all_sla_types', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); // Controlla i dati ottenuti dalla chiamata API
        const slaTypeDropdown = document.getElementById('sla_type_id');
        slaTypeDropdown.innerHTML = ''; // Pulisci il dropdown prima di popolarlo con i nuovi dati

        if (data && data.sla_types && data.sla_types.length > 0) {
            data.sla_types.forEach(slaType => {
                const option = document.createElement('option');
                option.value = slaType.id;
                option.text = slaType.name;
                slaTypeDropdown.appendChild(option);
            });
        } else {
            // Se non ci sono tipi di SLA disponibili, mostra un messaggio
            const option = document.createElement('option');
            option.text = 'Nessun tipo di SLA disponibile';
            slaTypeDropdown.appendChild(option);
        }
    })
    .catch(error => console.error('Errore:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    getAllSLATypes();
});

function getAllSLA() {
    fetch('/SLA/api/GetAll', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); // Controlla i dati ottenuti dalla chiamata API
        const slaTableBody = document.querySelector('#sla_table tbody');
        slaTableBody.innerHTML = ''; // Pulisce la tabella prima di aggiungere nuove righe

        if (data && data.strings && data.strings.length > 0) {
            data.strings.forEach(entry => {
                // Ottieni il nome del cliente corrispondente all'ID del cliente
                fetch(`/SLA/api/get_client_name/${entry["Client ID"]}`)
                    .then(response => response.json())
                    .then(clientData => {
                        const clientName = clientData.client_name;
                        const clientID = clientData.client_id;

                        // Ottieni il nome del tipo di SLA corrispondente all'ID del tipo di SLA
                        fetch(`/SLA/api/get_sla_type_name/${entry["SLA Type"]}`)
                            .then(response => response.json())
                            .then(slaTypeData => {
                                const slaTypeName = slaTypeData.sla_type_name;

                                // Aggiungi riga alla tabella
                                const row = slaTableBody.insertRow();
                                row.innerHTML = `
                                    <td>${entry.ID}</td>
                                    <td><a href="/manage/customers/${clientID}/view?cid={{session['current_case'].case_id}}"> ${clientName} </a></td> 
                                    <td>${slaTypeName}</td> 
                                    <td>${entry.CRITICAL}</td>
                                    <td>${entry.HIGH}</td>
                                    <td>${entry.MEDIUM}</td>
                                    <td>${entry.LOW}</td>
                                `;
                            });
                    });
            });
        } else {
            const row = slaTableBody.insertRow();
            row.innerHTML = '<td colspan="7">Nessuna SLA trovata</td>'; // Modifica il colspan in base al numero di colonne
        }
    })
    .catch(error => console.error('Errore:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    getAllSLA();
});

function refresh_sla_table(do_notify) {
getAllSLA();
if (do_notify !== undefined) {
    notify_success("Refreshed");
}
}