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
            alert("Si è verificato un errore durante il recupero dei clienti senza SLA.");
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
            refresh_sla_type_table(true)
            // Ottieni l'ID della SLA appena creata utilizzando l'API per ottenere l'ID
            getSLAIdByClient(client_id);
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
};

// Funzione per aggiornare il cliente associato alla SLA
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
function edit_SLA() {
    // Esegui una richiesta AJAX per ottenere la lista dei clienti con SLA
    $.ajax({
        url: '/SLA/api/clients_with_sla',
        type: 'GET',
        success: function(response) {
            // Se la richiesta ha successo, popola il dropdown dei clienti con SLA
            const clients = response.clients;
            const clientDropdown = document.getElementById('edit_client_id');
            clientDropdown.innerHTML = ''; // Pulisci il dropdown

            // Aggiungi una opzione vuota per consentire la selezione di default
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.text = 'Seleziona un Tenant';
            clientDropdown.appendChild(defaultOption);

            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.text = client.name;
                clientDropdown.appendChild(option);
            });

            // Ora esegui una seconda richiesta AJAX per ottenere la lista dei tipi di SLA
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

                    // Mostra il modale di modifica
                    $('#modal_edit_SLA').modal('show');

                    // Nascondi i campi di modifica SLA
                    $('#edit_sla_fields').hide();

                    // Esegui manualmente la funzione per aggiornare la visibilità dei campi SLA
                    toggleSLAFieldsVisibility();
                },
                error: function(xhr, status, error) {
                    // Se si verifica un errore durante il recupero dei tipi di SLA, mostra un messaggio di errore
                    alert("Si è verificato un errore durante il recupero dei tipi di SLA.");
                    console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
                }
            });
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante il recupero dei clienti, mostra un messaggio di errore
            alert("Si è verificato un errore durante il recupero dei clienti.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}


// Aggiungi un evento change al dropdown del cliente per gestire la visualizzazione dei campi SLA
$('#edit_client_id').change(function() {
    if ($(this).val() !== '') {
        // Se è stato selezionato un cliente, mostra i campi SLA
        $('#edit_sla_type_id, #edit_critical, #edit_high, #edit_medium, #edit_low, #edit_update_btn, #edit_delete_btn').show();
    } else {
        // Se non è stato selezionato un cliente, nascondi i campi SLA
        $('#edit_sla_type_id, #edit_critical, #edit_high, #edit_medium, #edit_low, #edit_update_btn, #edit_delete_btn').hide();
    }
});

// Chiudi la modale di modifica quando viene nascosta
$('#modal_edit_SLA').on('hidden.bs.modal', function() {
    // Resetta il valore del dropdown del cliente e nascondi i campi SLA
    $('#edit_client_id').val('');
    $('#edit_sla_type_id, #edit_critical, #edit_high, #edit_medium, #edit_low, #edit_update_btn, #edit_delete_btn').hide();
});


function populateEditModal(clientId) {
    // Esegui una richiesta AJAX per ottenere l'ID dello SLA corrispondente al cliente selezionato
    $.ajax({
        url: `/SLA/api/get_sla_id_by_client/${clientId}`,
        type: 'GET',
        success: function(response) {
            // Se la richiesta ha successo, ottieni l'ID dello SLA
            const slaId = response.sla_id;
            
            // Ora esegui un'altra richiesta AJAX per ottenere i dettagli dell'SLA
            $.ajax({
                url: `/SLA/api/get_sla_by_id/${slaId}`,
                type: 'GET',
                success: function(response) {
                    // Se la richiesta ha successo, popola i campi della modale di modifica
                    $('#edit_client_id').val(response.client_id);
                    $('#edit_sla_id').val(response.id);
                    $('#edit_critical').val(response.critical);
                    $('#edit_high').val(response.high);
                    $('#edit_medium').val(response.medium);
                    $('#edit_low').val(response.low);

                    // Ora ottieni e popola il tipo di SLA associato
                    $.ajax({
                        url: `/SLA/api/get_sla_type_name/${response.sla_type_id}`,
                        type: 'GET',
                        success: function(typeResponse) {
                            // Se la richiesta ha successo, popola il campo del tipo di SLA
                            $('#edit_sla_type').text(typeResponse.sla_type_name);

                            // Imposta il valore predefinito del campo "Tipo di SLA" sulla modale di modifica
                            $('#edit_sla_type_id').val(response.sla_type_id);

                            // Mostra i campi di modifica SLA
                            $('#edit_sla_fields').show();
                        },
                        error: function(xhr, status, error) {
                            console.error("Errore durante il recupero del tipo di SLA:", error);
                            alert("Si è verificato un errore durante il recupero del tipo di SLA.");
                        }
                    });
                },
                error: function(xhr, status, error) {
                    console.error("Errore durante il recupero dei dettagli dell'SLA:", error);
                    alert("Si è verificato un errore durante il recupero dei dettagli dell'SLA.");
                }
            });
        },
        error: function(xhr, status, error) {
            console.error("Errore durante il recupero dell'ID dello SLA:", error);
            alert("Si è verificato un errore durante il recupero dell'ID dello SLA.");
        }
    });
}




function updateSLA() {
    var client_id = $('#edit_client_id').val(); // Ottieni l'ID del cliente dalla modale
    var sla_type_id = $('#edit_sla_type_id').val();
    var critical = $('#edit_critical').val();
    var high = $('#edit_high').val();
    var medium = $('#edit_medium').val();
    var low = $('#edit_low').val();

    // Effettua la chiamata AJAX per ottenere l'ID dell'SLA associato al cliente
    $.ajax({
        url: `/SLA/api/get_sla_id_by_client/${client_id}`,
        type: 'GET',
        success: function(response) {
            var sla_id = response.sla_id; // Ottieni l'ID dell'SLA dalla risposta della chiamata API

            // Effettua la chiamata AJAX per aggiornare lo SLA con l'ID ottenuto
            $.ajax({
                url: `/SLA/api/update_sla/${sla_id}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    client_id: client_id,
                    sla_type_id: sla_type_id,
                    critical: critical,
                    high: high,
                    medium: medium,
                    low: low
                }),
                success: function(response) {
                    // Se l'aggiornamento ha successo, mostra un messaggio di conferma
                    alert(response.message);
                    // Aggiorna la tabella SLA
                    refresh_sla_table(true);
                    // Chiudi la modale
                    $('#modal_edit_SLA').modal('hide');
                },
                error: function(xhr, status, error) {
                    // Se si verifica un errore durante l'aggiornamento, mostra un messaggio di errore
                    alert("Si è verificato un errore durante l'aggiornamento dello SLA.");
                    console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
                }
            });
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante il recupero dell'ID dell'SLA, mostra un messaggio di errore
            alert("Si è verificato un errore durante il recupero dell'ID dell'SLA.");
            console.error("Errore durante il recupero dell'ID dell'SLA:", error);
        }
    });
}

function deleteSLA() {
    var client_id = $('#edit_client_id').val(); // Ottieni l'ID del cliente dalla modale

    // Effettua la chiamata AJAX per ottenere l'ID dell'SLA associato al cliente
    $.ajax({
        url: `/SLA/api/get_sla_id_by_client/${client_id}`,
        type: 'GET',
        success: function(response) {
            var sla_id = response.sla_id; // Ottieni l'ID dell'SLA dalla risposta della chiamata API

            // Effettua la chiamata AJAX per eliminare lo SLA con l'ID ottenuto
            $.ajax({
                url: `/SLA/api/delete_sla/${sla_id}`,
                type: 'DELETE',
                success: function(response) {
                    // Se l'eliminazione ha successo, mostra un messaggio di conferma
                    alert(response.message);
                    // Aggiorna la tabella SLA
                    refresh_sla_table(true);
                    // Chiudi la modale
                    $('#modal_edit_SLA').modal('hide');
                },
                error: function(xhr, status, error) {
                    // Se si verifica un errore durante l'eliminazione, mostra un messaggio di errore
                    alert("Si è verificato un errore durante l'eliminazione dello SLA.");
                    console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
                }
            });
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante il recupero dell'ID dell'SLA, mostra un messaggio di errore
            alert("Si è verificato un errore durante il recupero dell'ID dell'SLA.");
            console.error("Errore durante il recupero dell'ID dell'SLA:", error);
        }
    });
}
// Funzione per aggiornare la visibilità dei campi SLA in base alla selezione del cliente
function toggleSLAFieldsVisibility() {
    if ($('#edit_client_id').val() !== '') {
        // Se è stato selezionato un cliente, mostra i campi SLA
        $('#edit_sla_fields').show();

        // Aggiungi un evento change al dropdown del cliente per gestire il caricamento dei dati dell'SLA corrispondente
        $('#edit_client_id').change(function() {
            const clientId = $(this).val();
            if (clientId !== '') {
                // Se è stato selezionato un cliente, popola la modale con i dati dell'SLA corrispondente
                populateEditModal(clientId);
            } else {
                // Se non è stato selezionato un cliente, nascondi i campi di modifica SLA
                $('#edit_sla_fields').hide();
            }
        });
    } else {
        // Se non è stato selezionato un cliente, nascondi i campi di modifica SLA
        $('#edit_sla_fields').hide();
    }
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
        // debugger;

        console.log(data); // Controlla i dati ottenuti dalla chiamata API
        const slaTableBody = document.querySelector('#users_table tbody');
        slaTableBody.innerHTML = ''; // Pulisce la tabella prima di aggiungere nuove righe

        if (data && data.sla_types && data.sla_types.length > 0) {
            data.sla_types.forEach(slaType => {
                // Aggiungi riga alla tabella
                debugger;
                const row = slaTableBody.insertRow();
                row.innerHTML = `
                    <td>${slaType.id}</td>
                    <td>${slaType.name}</td>
                `;
            });
        } else {
            const row = slaTableBody.insertRow();
            row.innerHTML = '<td colspan="7">Nessuna SLA trovata</td>'; // Modifica il colspan in base al numero di colonne
        }
    })
    .catch(error => console.error('Errore:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    getAllSlaType();
});

function refresh_sla_type_table(do_notify) {
    getAllSlaType();
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
            alert("Si è verificato un errore durante il recupero dei clienti.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}

function saveSLA_type() {
    var piano_ore = $('#piano_ore').val();

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
            refresh_sla_type_table(true);
        
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante il salvataggio, mostra un messaggio di errore
            alert("Si è verificato un errore durante il salvataggio della SLA type.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}

function toggleSlaTypeFieldsVisibility(){
    debugger;
    if ($('#edit_id_sla_type').val() !== '') {
        // Se è stato selezionato un cliente, mostra i campi SLA
        $('#edit_sla_type_fields').show();

        // Aggiungi un evento change al dropdown del cliente per gestire il caricamento dei dati dell'SLA corrispondente
        $('#edit_id_sla_type').change(function() {
            const sla_type_Id = $(this).val();
            if (sla_type_Id !== '') {
                
                // Se è stato selezionato un cliente, popola la modale con i dati dell'SLA corrispondente
                populateSlaTypeEditModal(sla_type_Id);
            } else {
                // Se non è stato selezionato un cliente, nascondi i campi di modifica SLA
                $('#edit_sla_type_fields').hide();
            }
        });
    } else {
        // Se non è stato selezionato un cliente, nascondi i campi di modifica SLA
        $('#edit_sla_type_fields').hide();
    }
}

function populateSlaTypeEditModal(sla_type_Id){

    // Ora esegui un'altra richiesta AJAX per ottenere i dettagli dell'SLA
    $.ajax({
        url: `/SLA/api/get_sla_type_name/${sla_type_Id}`,
        type: 'GET',
        success: function(response) {
            debugger;
            // Se la richiesta ha successo, popola i campi della modale di modifica
            $('#edit_piano_ore').val(response.sla_type_name);

            // Mostra i campi di modifica SLA
            $('#edit_sla_type_fields').show();
        },
        error: function(xhr, status, error) {
            console.error("Errore durante il recupero dei dettagli dell'SLA:", error);
            alert("Si è verificato un errore durante il recupero dei dettagli dell'SLA.");
        }
    });
}

function edit_SLA_type() {
    // Ora esegui una seconda richiesta AJAX per ottenere la lista dei tipi di SLA
    $.ajax({
        url: '/SLA/api/get_all_sla_types',
        type: 'GET',
        success: function(response) {
            // Se la richiesta ha successo, popola il dropdown dei tipi di SLA
            const slaTypes = response.sla_types;
            const slaTypeDropdown = document.getElementById('edit_id_sla_type');
            slaTypeDropdown.innerHTML = ''; // Pulisci il dropdown

            // Aggiungi una opzione vuota per consentire la selezione di default
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.text = 'Seleziona un id';
            slaTypeDropdown.appendChild(defaultOption);

            slaTypes.forEach(slaType => {
                const option = document.createElement('option');
                option.value = slaType.id;
                option.text = slaType.name;
                slaTypeDropdown.appendChild(option);
            });
                        
            // Mostra il modale di modifica
            $('#modal_edit_SLA_type').modal('show');

            // Nascondi i campi di modifica SLA
            $('#edit_sla_type_fields').hide();
            

            // Esegui manualmente la funzione per aggiornare la visibilità dei campi SLA
            toggleSlaTypeFieldsVisibility();
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante il recupero dei tipi di SLA, mostra un messaggio di errore
            alert("Si è verificato un errore durante il recupero dei tipi di SLA.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}

// Aggiungi un evento change al dropdown del cliente per gestire la visualizzazione dei campi SLA
$('#edit_id_sla_type').change(function() {
    if ($(this).val() !== '') {
        // Se è stato selezionato un cliente, mostra i campi SLA
        $('#edit_piano_ore, #edit_update_btn, #edit_delete_btn').show();
    } else {
        // Se non è stato selezionato un cliente, nascondi i campi SLA
        $('#edit_piano_ore, #edit_update_btn, #edit_delete_btn').hide();
    }
});

// Chiudi la modale di modifica quando viene nascosta
$('#modal_edit_SLA_type').on('hidden.bs.modal', function() {
    // Resetta il valore del dropdown del cliente e nascondi i campi SLA
    $('#edit_id_sla_type').val('');
    $('#edit_piano_ore, #edit_update_btn, #edit_delete_btn').hide();
});


function updateSLAType() {
    var id_type = $('#edit_id_sla_type').val(); // Ottieni l'ID del cliente dalla modale
    var piano_ore = $('#edit_piano_ore').val();
    
    // Effettua la chiamata AJAX per aggiornare lo SLA con l'ID ottenuto
    $.ajax({
        url: `/SLA/api/update_sla_type/${id_type}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            id_type: id_type,
            piano_ore: piano_ore,
        }),
        success: function(response) {
            // Se l'aggiornamento ha successo, mostra un messaggio di conferma
            alert(response.message);
            // Aggiorna la tabella SLA
            refresh_sla_type_table(true);
            // Chiudi la modale
            $('#modal_edit_SLA_type').modal('hide');
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante l'aggiornamento, mostra un messaggio di errore
            alert("Si è verificato un errore durante l'aggiornamento dello SLA Type.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });   
}

function deleteSLAType() {
    var sla_type_id = $('#edit_id_sla_type').val(); // Ottieni l'ID del cliente dalla modale
    $.ajax({
        url: `/SLA/api/delete_sla_type/${sla_type_id}`,
        type: 'DELETE',
        success: function(response) {
            // Se l'eliminazione ha successo, mostra un messaggio di conferma
            alert(response.message);
            // Aggiorna la tabella SLA
            refresh_sla_type_table(true);
            // Chiudi la modale
            $('#modal_edit_SLA_type').modal('hide');
        },
        error: function(xhr, status, error) {
            // Se si verifica un errore durante l'eliminazione, mostra un messaggio di errore
            alert("Si è verificato un errore durante l'eliminazione dello SLA Type.");
            console.error(xhr.responseText); // Mostra i dettagli dell'errore nella console del browser
        }
    });
}