import Sequelize from 'sequelize';
import db from '../models';
import _ from 'lodash';
import { ResourceNotFoundError, ValidationError, DatabaseError } from '../components/errors';

export function list(req, res, next) {
    db.Trip.findAll()
        .then(res.json.bind(res))
        .catch(next);
}

export function create(req, res, next) {
    db.Trip.create(req.body)
        .then(savedObj => res.status(201).json(savedObj))
        .catch(Sequelize.ValidationError, err => {
            throw new ValidationError(err);
        })
        .catch(next);
}

export function destroy(req, res, next) {
    db.Trip.destroy({
        where: {
            id: req.params.id
        }
    })
    .then(count => {
        if (!count) throw new ResourceNotFoundError('trip');
        res.sendStatus(200);
    })
    .catch(next);
}

export function update(req, res, next) {
    db.Trip.update(req.body, {
        where: {
            id: req.params.id
        },
        fields: _.without(Object.keys(req.body), 'id')
    })
    .spread((count) => {
        if (!count) throw new ResourceNotFoundError('trip');
        res.sendStatus(204);
    })
    .catch(Sequelize.ValidationError, err => {
        throw new ValidationError(err);
    })
    .catch(Sequelize.DatabaseError, err => {
        throw new DatabaseError(err);
    })
    .catch(next);
}
