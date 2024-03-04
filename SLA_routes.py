#!/usr/bin/env python3
#
#  IRIS Source Code
#  Copyright (C) 2021 - Airbus CyberSecurity (SAS)
#  ir@cyberactionlab.net
#
#  This program is free software; you can redistribute it and/or
#  modify it under the terms of the GNU Lesser General Public
#  License as published by the Free Software Foundation; either
#  version 3 of the License, or (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
#  Lesser General Public License for more details.
#
#  You should have received a copy of the GNU Lesser General Public License
#  along with this program; if not, write to the Free Software Foundation,
#  Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

# IMPORTS ------------------------------------------------
from flask import Blueprint
from flask import redirect
from flask import render_template
from flask import request
from flask import url_for
from sqlalchemy import and_
from flask import jsonify


from app.forms import SearchForm
from app.iris_engine.utils.tracker import track_activity
from app.models import Comments
from app.models.authorization import Permissions
from app.models.cases import Cases
from app.models.models import Client
from app.models.models import Ioc
from app.models.models import IocLink
from app.models.models import IocType
from app.models.models import Notes
from app.models.models import Tlp
from app.models.models import TestTable
from app.models import SLA
from app.models import SLA_type
from app.util import ac_api_requires
from app.util import ac_requires
from app.util import response_success
from app import db  


SLA_blueprint = Blueprint('GestioneSLA',
                             __name__,
                             template_folder='templates')

@SLA_blueprint.route('/GestioneSLA', methods=['GET'])
@ac_requires(Permissions.server_administrator)
def test_file_get(caseid, url_redir):
    return render_template('SLA.html')


@SLA_blueprint.route('/SLA/api/string', methods=['POST'])
def create_string():
    data = request.json
    string_value = data.get('string_value')

    if not string_value:
        return {'error': 'Missing string_value parameter'}, 400

    new_entry = TestTable(string_value=string_value)
    db.session.add(new_entry)
    db.session.commit()

    return {'message': 'String created successfully', 'string_id': new_entry.id}, 201


@SLA_blueprint.route('/SLA/api/GetAll', methods=['GET'])
def get_all_strings():
    entries = SLA.query.all()

    if not entries:
        return {'error': 'No strings found'}, 404

    strings = [{'ID': entry.id_SLA,
                'Client ID': entry.client_id,
                'SLA Type': entry.SLA_type_id,
                'CRITICAL': entry.CRITICAL,  
                'HIGH': entry.HIGH,          
                'MEDIUM': entry.MEDIUM,      
                'LOW': entry.LOW}            
               for entry in entries]

    return {'strings': strings}, 200


@SLA_blueprint.route('/SLA/api/get_client_name/<int:client_id>', methods=['GET'])
def get_client_name(client_id):
    client = Client.query.filter_by(client_id=client_id).first()
    if client:
        return jsonify({'client_name': client.name, 'client_id': client.client_id})
    else:
        return jsonify({'error': 'Client not found'}), 404

@SLA_blueprint.route('/SLA/api/get_sla_type_name/<int:sla_type_id>', methods=['GET'])
def get_sla_type_name(sla_type_id):
    sla_type = SLA_type.query.filter_by(id_type=sla_type_id).first()
    if sla_type:
        return jsonify({'sla_type_name': sla_type.piano_ore})
    else:
        return jsonify({'error': 'SLA type not found'}), 404

@SLA_blueprint.route('/SLA/api/get_clients', methods=['GET'])
def get_clients():
    try:
        clients = Client.query.all()
        clients_list = [{'id': client.client_id, 'name': client.name} for client in clients]
        return jsonify({'clients': clients_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@SLA_blueprint.route('/SLA/api/get_all_sla_types', methods=['GET'])
def get_all_sla_types():
    try:
        sla_types = SLA_type.query.all()
        sla_types_list = [{'id': sla_type.id_type, 'name': sla_type.piano_ore} for sla_type in sla_types]
        return jsonify({'sla_types': sla_types_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@SLA_blueprint.route('/SLA/api/put_sla/<int:client_id>', methods=['PUT'])
def put_sla(client_id):
    try:
        # Ottieni i dati inviati nella richiesta
        data = request.json

        # Trova il cliente nel database
        client = Client.query.get(client_id)

        if not client:
            return jsonify({'error': 'Cliente non trovato'}), 404

        # Aggiorna i dati del cliente
        if 'name' in data:
            client.name = data['name']
        if 'description' in data:
            client.description = data['description']
        # Aggiorna l'SLA solo se è presente nei dati inviati
        if 'sla_id' in data:
            sla_id = data['sla_id']
            # Verifica se l'SLA esiste
            sla = SLA.query.get(sla_id)
            if not sla:
                return jsonify({'error': 'SLA non trovata'}), 404
            # Aggiorna l'SLA del cliente
            client.sla = sla_id

        # Aggiorna il cliente nel database
        db.session.commit()

        return jsonify({'message': 'Cliente aggiornato con successo'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@SLA_blueprint.route('/SLA/api/get_sla_id_by_client/<int:client_id>', methods=['GET'])
def get_sla_id_by_client(client_id):
    try:
        # Trova la SLA corrispondente al client_id
        sla = SLA.query.filter_by(client_id=client_id).first()

        if not sla:
            return jsonify({'error': 'SLA non trovata per il cliente specificato'}), 404

        # Ottieni l'ID della SLA associata al cliente
        sla_id = sla.id_SLA

        return jsonify({'sla_id': sla_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@SLA_blueprint.route('/SLA/api/get_sla_by_id/<int:sla_id>', methods=['GET'])
def get_sla_by_id(sla_id):
    try:
        # Trova lo SLA con l'ID specificato
        sla = SLA.query.get(sla_id)

        if not sla:
            return jsonify({'error': 'SLA non trovata'}), 404

        # Crea un dizionario con i dettagli dello SLA
        sla_details = {
            'id': sla.id_SLA,
            'client_id': sla.client_id,
            'sla_type_id': sla.SLA_type_id,
            'critical': sla.CRITICAL,
            'high': sla.HIGH,
            'medium': sla.MEDIUM,
            'low': sla.LOW
        }

        return jsonify(sla_details), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@SLA_blueprint.route('/SLA/api/update_sla/<int:sla_id>', methods=['PUT'])
def update_sla(sla_id):
    try:
        # Trova lo SLA con l'ID specificato
        sla = SLA.query.get(sla_id)

        if not sla:
            return jsonify({'error': 'SLA non trovata'}), 404

        # Ottieni i nuovi dati dello SLA dalla richiesta
        data = request.json

        # Aggiorna i valori dello SLA se presenti nei dati della richiesta
        if 'client_id' in data:
            sla.client_id = data['client_id']
        if 'sla_type_id' in data:
            sla.SLA_type_id = data['sla_type_id']
        if 'critical' in data:
            sla.CRITICAL = data['critical']
        if 'high' in data:
            sla.HIGH = data['high']
        if 'medium' in data:
            sla.MEDIUM = data['medium']
        if 'low' in data:
            sla.LOW = data['low']

        # Aggiorna lo SLA nel database
        db.session.commit()

        return jsonify({'message': 'SLA aggiornata con successo'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@SLA_blueprint.route('/SLA/api/delete_sla/<int:sla_id>', methods=['DELETE'])
def delete_sla(sla_id):
    try:
        # Trova lo SLA con l'ID specificato
        sla = SLA.query.get(sla_id)

        if not sla:
            return jsonify({'error': 'SLA non trovata'}), 404

        # Elimina lo SLA dal database
        db.session.delete(sla)
        db.session.commit()

        return jsonify({'message': 'SLA eliminata con successo'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@SLA_blueprint.route('/SLA/api/get_sla_details/<int:sla_id>', methods=['GET'])
def get_sla_details(sla_id):
    try:
        # Trova lo SLA con l'ID specificato
        sla = SLA.query.get(sla_id)

        if not sla:
            return jsonify({'error': 'SLA non trovata'}), 404

        # Crea un dizionario con i dettagli dello SLA
        sla_details = {
            'id': sla.id_SLA,
            'client_id': sla.client_id,
            'sla_type_id': sla.SLA_type_id,
            'critical': sla.CRITICAL,
            'high': sla.HIGH,
            'medium': sla.MEDIUM,
            'low': sla.LOW
        }

        return jsonify(sla_details), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# API per recuperare i clienti senza SLA
@SLA_blueprint.route('/SLA/api/clients_without_sla', methods=['GET'])
def get_clients_without_sla():
    try:
        clients = Client.query.filter_by(sla=None).all()
        client_list = [{'id': client.client_id, 'name': client.name} for client in clients]
        return jsonify({'clients': client_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API per recuperare i clienti con SLA associata
@SLA_blueprint.route('/SLA/api/clients_with_sla', methods=['GET'])
def get_clients_with_sla():
    try:
        clients = Client.query.filter(Client.sla.isnot(None)).all()
        client_list = [{'id': client.client_id, 'name': client.name} for client in clients]
        return jsonify({'clients': client_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
