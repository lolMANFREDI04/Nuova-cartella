function add_SLA() {
    // Esegui una richiesta AJAX per ottenere la lista dei clienti senza SLA
    $.ajax({
        url: '/SLA/api/clients_without_sla',
        type: 'GET',
        success: function(response) {
            // Se la richiesta ha successo, popola il dropdown dei clienti senza SLA
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
            // Se si verifica un errore durante il recupero dei clienti senza SLA, mostra un messaggio di errore
            notify_error("Si è verificato un errore durante il recupero dei clienti senza SLA.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}


// Funzione per salvare un'istanza di SLA
function saveSLA() {
    var client_id = $('#client_id').val();
    var sla_type_id = $('#sla_type_id').val();
    var critical = $('#critical').val();
    var high = $('#high').val();
    var medium = $('#medium').val();
    var low = $('#low').val();

     // Controlla se uno dei campi è vuoto
     if (!client_id || !sla_type_id || !critical || !high || !medium || !low) {
        // Mostra un messaggio di errore se uno dei campi è vuoto
        notify_error("Per favore, riempi tutti i campi prima di salvare la SLA.");
        return; // Esce dalla funzione senza inviare la richiesta AJAX
    }

    // Effettua la chiamata AJAX al backend per salvare l'SLA
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
            refresh_sla_table()
            notify_success("Added")
            // Ottieni l'ID della SLA appena creata utilizzando l'API per ottenere l'ID
            getSLAIdByClient(client_id);
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante il salvataggio, mostra un messaggio di errore
            notify_error("Si è verificato un errore durante il salvataggio della SLA.");
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

// Funzione per ottenere e visualizzare i dati delle SLA
function getAllSLA() {
    fetch('/SLA/api/GetAll', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const slaTable = $('#sla_table').DataTable();
   
        // Rimuovi eventuali dati esistenti nella tabella
        slaTable.clear();
       
        // Funzione per ottenere il nome del tenant (client) dato l'ID del cliente
        function getClientName(clientId) {
            return fetch(`/SLA/api/get_client_name/${clientId}`)
                .then(response => response.json())
                .then(clientData => clientData.client_name)
                .catch(error => {
                    console.error('Errore nel recupero del nome del cliente:', error);
                    return ''; // Restituisci una stringa vuota in caso di errore
                });
        }
       
        // Funzione per ottenere il nome dello SLA type dato l'ID dello SLA type
        function getSLATypeName(slaTypeId) {
            return fetch(`/SLA/api/get_sla_type_name/${slaTypeId}`)
                .then(response => response.json())
                .then(slaTypeData => slaTypeData.sla_type_name)
                .catch(error => {
                    console.error('Errore nel recupero del nome dello SLA type:', error);
                    return ''; // Restituisci una stringa vuota in caso di errore
                });
        }
       
        // Map dei risultati delle chiamate API per ottenere i nomi del tenant (client) e dello SLA type
        Promise.all(data.strings.map(entry => Promise.all([
            getClientName(entry["Client ID"]),
            getSLATypeName(entry["SLA Type"])
        ])))
        .then(results => {
            // Aggiungi i nomi del tenant (client) e dello SLA type ai dati della tabella
            data.strings.forEach((entry, index) => {
                entry["Tenant Name"] = `<a href=''Client ID"]}/view?cid=${get_caseid()}">${results[index][0]}</a>`
                entry["SLA Type"] = results[index][1]; // Sostituisci l'ID con il nome dello SLA Type
            });
       
            // Aggiungi i nuovi dati alla tabella
            slaTable.rows.add(data.strings);
       
            // Aggiungi gestore di eventi per l'icona di modifica
            slaTable.rows().every(function () {
                var row = this.node();
                row.querySelector('.edit-icon-sla').addEventListener('click', function() {
                    const slaId = this.dataset.id;
                    editSLA(slaId);
                });
       
                // Aggiungi gestore di eventi per l'icona di eliminazione
                row.querySelector('.delete-icon-sla').addEventListener('click', function() {
                    const slaId = this.dataset.id;
                    deleteSLA(slaId);
                });
            });
       
            // Ridisegna la tabella
            slaTable.draw();
        })
        .catch(error => console.error('Errore nel recupero dei nomi del tenant (client) e dello SLA type:', error));
    })
    .catch(error => console.error('Errore:', error));
}




document.addEventListener('DOMContentLoaded', function() {
    // Chiamata alla funzione per popolare la tabella all'avvio della pagina
    getAllSLA();

    // Creazione del tag <style> per le regole CSS
    const styleTag = document.createElement('style');
    document.head.appendChild(styleTag);

    // Aggiunta delle regole CSS per l'hover delle icone
    styleTag.innerHTML = `
        .edit-icon-sla,
        .delete-icon{
            align-item:right;
        }
        .edit-icon-sla{
            16%;
        }
        .delete-icon-sla{
            18%;
        }
        .edit-icon-sla:hover,
        .delete-icon-sla:hover {
            color: red; /* Cambia il colore dell'icona quando ci passi sopra */
            cursor: pointer; /* Cambia il tipo di cursore quando ci passi sopra */
        }

        .edit-icon-sla:hover {
            color: blue; /* Cambia il colore specifico dell'icona di modifica quando ci passi sopra */
        }
    `;
});


function refresh_sla_table(do_notify) {
refreshPage()
getAllSLA();
if (do_notify !== undefined) {
    notify_success("Refreshed");
}
};

// Funzione per aggiornare il cliente associato alla SLA
function updateClientSLA(clientId, slaId) {
    // Dati da inviare nella richiesta
    const data = {
        sla_id: slaId
    };

    // Imposta l'URL della richiesta PUT per aggiornare il cliente
    const url = `/SLA/api/put_sla/${clientId}`;

    // Configura la richiesta
    const requestOptions = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    // Invia la richiesta al backend
    fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore durante l\'aggiornamento del cliente');
            }
            return response.json();
        })
        .then(data => {
            console.log('Cliente aggiornato con successo:', data);
            // Inserisci qui eventuali azioni da eseguire dopo l'aggiornamento del cliente
        })
        .catch(error => {
            console.error('Errore:', error);
            // Inserisci qui eventuali azioni da eseguire in caso di errore
        });
}
// Funzione per ottenere l'ID della SLA associata a un cliente e aggiornare il cliente
function getSLAIdByClient(clientId) {
    $.ajax({
        url: `/SLA/api/get_sla_id_by_client/${clientId}`,
        type: 'GET',
        success: function(response) {
            // Se la richiesta ha successo, ottieni l'ID della SLA
            var slaId = response.sla_id;
            console.log('ID della SLA associata al cliente:', slaId);
           
            // Ora puoi utilizzare l'ID della SLA per aggiornare il cliente
            updateClientSLA(clientId, slaId);
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore, mostra un messaggio di errore
            console.error('Errore durante il recupero dell\'ID della SLA:', error);
        }
    });
}

// Funzione per aprire la modale di modifica degli SLA
function editSLA(slaId) {
    $.ajax({
        url: '/SLA/api/get_all_sla_types',
        type: 'GET',
        success: function(response) {
            // Se la richiesta ha successo, popola il dropdown dei tipi di SLA
            const slaTypes = response.sla_types;
            const slaTypeDropdown = document.getElementById('edit_sla_type_id');
            slaTypeDropdown.innerHTML = ''; // Pulisci il dropdown

            slaTypes.forEach(slaType => {
                const option = document.createElement('option');
                option.value = slaType.id;
                option.text = slaType.name;
                slaTypeDropdown.appendChild(option);
            });
        }})
    $('#modal_edit_SLA').modal('show');
    populateEditModal(slaId);


}
// Funzione per aggiornare un' SLA
function updateSLA() {
    var slaId = $('#Hidden_Sla_Id').val();
    var clientId = $('#edit_client_id').val();
    var sla_type_id = $('#edit_sla_type_id').val();
    var critical = $('#edit_critical').val();
    var high = $('#edit_high').val();
    var medium = $('#edit_medium').val();
    var low = $('#edit_low').val();

    // Effettua la chiamata AJAX per aggiornare lo SLA con l'ID ottenuto
    $.ajax({
        url: `/SLA/api/update_sla/${slaId}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            client_id: clientId,
            sla_type_id: sla_type_id,
            critical: critical,
            high: high,
            medium: medium,
            low: low
        }),
        success: function(response) {
            // Se l'aggiornamento ha successo, mostra un messaggio di conferma
            notify_success("Updated");
            // Aggiorna la tabella SLA
            refresh_sla_table();
            // Chiudi la modale
            $('#modal_edit_SLA').modal('hide');
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante l'aggiornamento, mostra un messaggio di errore
            notify_error("Si è verificato un errore durante l'aggiornamento dell' SLA.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}

    // Funzione per popolare il modal di modifica con i valori dell'SLA
    function populateEditModal(slaId) {
        // Effettua una richiesta AJAX per ottenere i dettagli dell'SLA
        $.ajax({
            url: `/SLA/api/get_sla_by_id/${slaId}`,
            type: 'GET',
            success: function(response) {
                // Popola i campi del modal con i valori ottenuti dalla risposta
                $('#Hidden_Sla_Id').val(slaId);
                $('#edit_client_id').val(response.client_id);
                $('#edit_sla_type_id').val(response.sla_type_id);
                $('#edit_critical').val(response.critical);
                $('#edit_high').val(response.high);
                $('#edit_medium').val(response.medium);
                $('#edit_low').val(response.low);

                // Ora popola il campo del tipo di SLA associato
                $.ajax({
                    url: `/SLA/api/get_sla_type_name/${response.sla_type_id}`,
                    type: 'GET',
                    success: function(typeResponse) {
                        // Popola il campo del tipo di SLA con il nome ottenuto dalla risposta
                        $('#edit_sla_type_id').val(response.sla_type_id); // Imposta il valore del campo nascosto con l'ID
                        $('#edit_sla_type').text(typeResponse.sla_type_name); // Mostra il nome del tipo di SLA
                    },
                        error: function(xhr, status, error) {
                            console.error("Errore durante il recupero del tipo di SLA:", error);
                            notify_error("Si è verificato un errore durante il recupero del tipo di SLA.");
                        }
                    });
                },
                error: function(xhr, status, error) {
                    console.error("Errore durante il recupero dei dettagli dell'SLA:", error);
                    notify_error("Si è verificato un errore durante il recupero dei dettagli dell'SLA.");
                }
            });
};

function deleteSLA(slaId) {
    swal({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    })
    .then((willDelete) => {
        if (willDelete) {
            // Effettua la chiamata AJAX per eliminare lo SLA con l'ID passato come argomento
            $.ajax({
                url: `/SLA/api/delete_sla/${slaId}`,
                type: 'DELETE',
                success: function() {
                    notify_success("Deleted");
                    // Aggiorna la tabella SLA
                    refresh_sla_table();
                    // Chiudi la modale
                    $('#modal_edit_SLA').modal('hide');
                },
                error: function(xhr, status, error) {
                    // Se si verifica un errore durante l'eliminazione, mostra un messaggio di errore
                    notify_error("Si è verificato un errore durante l'eliminazione dell'SLA");
                    console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
                }
            });
        } else {
            swal("Pfew, that was close");
        }
    });
}

///////funzioni per il SLA type

// Funzione per ottenere e visualizzare i dati dei tipi di SLA
function getAllSlaType() {
    fetch('/SLA/api/get_all_sla_types', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const slaTableBody = document.querySelector('#users_table tbody');
        slaTableBody.innerHTML = ''; // Pulisce la tabella prima di aggiungere nuove righe

        if (data && data.sla_types && data.sla_types.length > 0) {
            data.sla_types.forEach(slaType => {
                // Aggiungi riga alla tabella
                const row = slaTableBody.insertRow();
                row.innerHTML = `
                    <td>${slaType.id}</td>
                    <td>${slaType.name}</td>
                    <td><i class="fas fa-pencil-alt edit-icon" data-id="${slaType.id}"></i><i class="fas fa-trash delete-icon" data-id="${slaType.id}"></i></td>
                `;
            });

            // Aggiungi gestore di eventi per l'icona di modifica
            document.querySelectorAll('.edit-icon').forEach(icon => {
                icon.addEventListener('click', function() {
                    const slaTypeId = this.dataset.id;
                    edit_SLA_type(slaTypeId)
                });
            });

            // Aggiungi gestore di eventi per l'icona di eliminazione
            document.querySelectorAll('.delete-icon').forEach(icon => {
                icon.addEventListener('click', function() {
                    const slaTypeId = this.dataset.id;
                    deleteSLAType(slaTypeId)
                });
            });
        } else {
            const row = slaTableBody.insertRow();
            row.innerHTML = '<td colspan="4">Nessuno SLA Type trovato</td>'; // Modifica il colspan in base al numero di colonne
        }
    })
    .catch(error => console.error('Errore:', error));
}


document.addEventListener('DOMContentLoaded', function() {

    // Creazione del tag <style> per le regole CSS
    const styleTag = document.createElement('style');
    document.head.appendChild(styleTag);

    // Aggiunta delle regole CSS per l'hover delle icone
    styleTag.innerHTML = `
        .edit-icon,
        .delete-icon{
            align-item:right;
        }
        .edit-icon{
            40%;
        }
        .delete-icon{
            7%;
        }
        .edit-icon:hover,
        .delete-icon:hover {
            color: red; /* Cambia il colore dell'icona quando ci passi sopra */
            cursor: pointer; /* Cambia il tipo di cursore quando ci passi sopra */
        }

        .edit-icon:hover {
            color: blue; /* Cambia il colore specifico dell'icona di modifica quando ci passi sopra */
        }
    `;

    getAllSlaType();
});

function refresh_sla_type_table(do_notify) {
    getAllSlaType();
    refreshPage();
    if (do_notify !== undefined) {
        notify_success("Refreshed");
    }
};


function add_SLA_type() {
    // Esegui una richiesta AJAX per ottenere la lista dei clienti
    $.ajax({
        url: '/SLA/api/get_all_sla_types',
        type: 'GET',
        success: function(response) {

            const Sla_Types = response.sla_types;

            $('#modal_access_control').modal('show');
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante il recupero dei clienti, mostra un messaggio di errore
            notify_error("Si è verificato un errore durante il recupero dei clienti.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}

function saveSLA_type() {
    var piano_ore = $('#piano_ore').val();

    // Controlla se il campo piano_ore è vuoto
    if (!piano_ore.trim()) {
        // Se il campo è vuoto, mostra un messaggio di errore
        notify_error("Il campo Piano Orario non può essere vuoto.");
        return; // Esce dalla funzione senza inviare la richiesta AJAX
    }

    // Effettua la chiamata AJAX per verificare se esiste già uno SLA type con il nome scelto
    $.ajax({
        url: '/SLA/api/save/existing',
        type: 'POST',
        data: {
            piano_ore: piano_ore
        },
        success: function(response) {
            // Se non esiste già uno SLA type con il nome scelto, procedi con il salvataggio
            if (!response.exists) {
                // Effettua la chiamata AJAX al backend per salvare l'SLA
                $.ajax({
                    url: '/manage/SLA_type/save',
                    type: 'POST',
                    data: {
                        piano_ore: piano_ore
                    },
                    success: function(response) {
                        // Se il salvataggio ha successo, chiudi il modale e mostra un messaggio di conferma
                        $('#modal_access_control').modal('hide');
                        refresh_sla_type_table();
                        notify_success("Added");
                    },
                    error: function(xhr, status, error) {
                        // Se si verifica un errore durante il salvataggio, mostra un messaggio di errore
                        notify_error("Si è verificato un errore durante il salvataggio della SLA type.");
                        console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
                    }
                });
            } else {
                // Se esiste già uno SLA type con il nome scelto, mostra un messaggio di errore
                notify_error("Esiste già uno SLA type con il nome scelto.");
            }
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante la verifica, mostra un messaggio di errore
            notify_error("Si è verificato un errore durante la verifica della presenza dello SLA type.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}

function populateSlaTypeEditModal(slaTypeId){

    // Ora esegui un'altra richiesta AJAX per ottenere i dettagli dell'SLA
    $.ajax({
        url: `/SLA/api/get_sla_type_name/${slaTypeId}`,
        type: 'GET',
        success: function(response) {
            debugger;
            // Se la richiesta ha successo, popola i campi della modale di modifica
            $('#Hidden_Sla_Type_Id').val(slaTypeId);
            $('#edit_piano_ore').val(response.sla_type_name);

        },
        error: function(xhr, status, error) {
            console.error("Errore durante il recupero dei dettagli dell'SLA:", error);
            notify_error("Si è verificato un errore durante il recupero dei dettagli dell'SLA.");
        }
    });
}

function edit_SLA_type(slaTypeId) {
    // Mostra il modale di modifica
    $('#modal_edit_SLA_type').modal('show');
    populateSlaTypeEditModal(slaTypeId);
}


function updateSLAType() {
    var slaTypeId = $('#Hidden_Sla_Type_Id').val();
    var piano_ore = $('#edit_piano_ore').val();

    // Controlla se il campo piano_ore è vuoto
    if (!piano_ore.trim()) {
        // Se il campo è vuoto, mostra un messaggio di errore
        notify_error("Il campo Piano Orario non può essere vuoto.");
        return; // Esce dalla funzione senza inviare la richiesta AJAX
    }

    // Effettua la chiamata AJAX per aggiornare lo SLA con l'ID ottenuto
    $.ajax({
        url: `/SLA/api/update_sla_type/${slaTypeId}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            id_type: slaTypeId,
            piano_ore: piano_ore,
        }),
        success: function(response) {
            // Se l'aggiornamento ha successo, mostra un messaggio di conferma
            notify_success("Updated");
            // Aggiorna la tabella SLA
            refresh_sla_type_table();
            refresh_sla_table();
            // Chiudi la modale
            $('#modal_edit_SLA_type').modal('hide');
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante l'aggiornamento, mostra un messaggio di errore
            if (xhr.status === 400) {
                notify_error(xhr.responseJSON.error); // Mostra il messaggio di errore restituito dal server
            } else {
                notify_error("Si è verificato un errore durante l'aggiornamento dello SLA Type.");
            }
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}


function deleteSLAType(slaTypeId) {
    swal({
        title: "Are you sure ?",
        text: "You won't be able to revert this !",
        icon: "warning",
        buttons: true,
        dangerMode: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    })
    .then((willDelete) => {
        if (willDelete) {
            $.ajax({
                url: `/SLA/api/delete_sla_type/${slaTypeId}`,
                type: 'DELETE',
                success: function(response) {
                    // Se l'eliminazione ha successo, mostra un messaggio di conferma
                    notify_success("Deleted");
                    // Aggiorna la tabella SLA
                    refresh_sla_type_table();
                    // Chiudi la modale
                    $('#modal_edit_SLA_type').modal('hide');
                },
                error: function(xhr, status, error) {
                    // Se si verifica un errore durante l'eliminazione, mostra un messaggio di errore
                    notify_error("Si è verificato un errore durante l'eliminazione dello SLA Type.");
                    console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
                }
            });
        } else {
            swal("Pfew, that was close");
        }
    });
}

//

$(document).ready(function() {
    refreshPage(); // Chiamata alla funzione refreshPage() all'avvio della pagina
});

function refreshPage() {
    // Verifica se la variabile slaTable non è già stata definita
    if (typeof slaTable === 'undefined' || slaTable === null) {
        // Inizializzazione della tabella DataTable solo se slaTable non è ancora definita
        slaTable = $('#sla_table').DataTable({
            dom: 'Blfrtip',
            ajax: {
                url: '/SLA/api/GetAll', // URL per la chiamata AJAX
                dataSrc: '', // Proprietà dei dati nell'oggetto di risposta da utilizzare come origine dei dati
                error: function(xhr, error, thrown) {
                    // Se c'è un errore nella chiamata AJAX, visualizza il messaggio "Nessuna SLA trovata"
                    $('#sla_table tbody').html('<tr><td colspan="8">Nessuna SLA trovata</td></tr>');
                }
            },
            columns: [
                { title: "ID", data: "ID" },
                { title: "Tenant Name", data: "Tenant Name" },
                { title: "SLA Type", data: "SLA Type" },
                { title: "CRITICAL", data: "CRITICAL" },
                { title: "HIGH", data: "HIGH" },
                { title: "MEDIUM", data: "MEDIUM" },
                { title: "LOW", data: "LOW" },
                {
                    data: null,
                    render: function (data, type, row) {
                        return '<i class="fas fa-pencil-alt edit-icon-sla" data-id="' + data.ID + '"></i><i class="fas fa-trash delete-icon-sla" data-id="' + data.ID + '"></i>';
                    }
                }
            ],
            ordering: false,
            buttons: [],
            initComplete: function () {
                addFilterFields('sla_table');
                tableFiltering(this.api(), 'sla_table', [7]); // Passa l'API della tabella, l'id della tabella e gli indici delle colonne da escludere dal filtraggio
            }
        });
    } else {
        // Se slaTable è già definita, esegui semplicemente il reload dei dati
        slaTable.ajax.reload(); // Ricarica i dati della tabella tramite la chiamata AJAX
    }

    // Funzione per rimuovere il filtro
    function removeFilter(clickedObject) {
        var inputObject = $(clickedObject)
            .parents("table")
            .find("input")[$(clickedObject).parents("th").index()];
        inputObject.value = ""; // Clear input
        $(inputObject).trigger("change"); // trigger change event
    }

    // Funzione per aggiungere campi di input per il filtraggio alle colonne della tabella
    function addFilterFields(tableId){
        $('#' + tableId + ' thead tr')
            .clone(true)
            .addClass('filters')
            .appendTo('#' + tableId + ' thead');
    }

    // Funzione di callback per attivare il filtraggio su una tabella DataTable
    function tableFiltering(api, table_anchor, exclude_columns=[]){
        // For each column
        api
            .columns()
            .eq(0)
            .each(function (colIdx) {
                // Set the header cell to contain the input element
                var cell = $('#'+table_anchor+' .filters th').eq(
                    $(api.column(colIdx).header()).index()
                );

                if (exclude_columns.includes(colIdx)) {
                    $(cell).html('<div class="form-group has-feedback" style="display: none;"><input type="text" class="form-control" placeholder="Filter"><i class="fas fa-times-circle form-control-feedback" onclick="removeFilter(this);"></i></div>');

                    return;
                }

                $(cell).html('<div class="form-group has-feedback"><input type="text" class="form-control" placeholder="Filter"><i class="fas fa-times-circle form-control-feedback" onclick="removeFilter(this);"></i></div>');
                // On every keypress in this input
                $(
                    'input',
                    $('#'+table_anchor+' .filters th').eq($(api.column(colIdx).header()).index())
                )
                    .off('keyup change')
                    .on('keyup change', function (e) {
                        e.stopPropagation();
                        // Get the search value
                        $(this).attr('title', $(this).val());
                        var regexr = '({search})';
                        var cursorPosition = this.selectionStart;
                        // Search the column for that value
                        api
                            .column(colIdx)
                            .search(
                                this.value != ''
                                    ? regexr.replace('{search}', '(((' + this.value + ')))')
                                    : '',
                                this.value != '',
                                this.value == ''
                            )
                            .draw();
                        $(this)
                            .focus()[0]
                            .setSelectionRange(cursorPosition, cursorPosition);
                    });
            });
    }
}