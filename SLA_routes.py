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