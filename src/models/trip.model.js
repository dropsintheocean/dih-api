import _ from 'lodash';
import Promise from 'bluebird';
import { validateQuery } from '../components/queryValidator';
import { TRAVEL_METHODS, TRIP_STATUSES } from '../components/constants';
import db from './';

const ALLOWED_QUERY_PARAMS = ['destinationId', 'userId', 'status'];

export default function (sequelize, DataTypes) {
    const Trip = sequelize.define('trip', {
        status: {
            type: DataTypes.ENUM,
            values: _.values(TRIP_STATUSES),
            defaultValue: TRIP_STATUSES.PENDING
        },
        startDate: {
            type: DataTypes.DATE
        },
        endDate: {
            type: DataTypes.DATE
        },
        wishStartDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        wishEndDate: {
            type: DataTypes.DATE
        },
        hotel: {
            type: DataTypes.STRING
        },
        notes: {
            type: DataTypes.TEXT
        },
        travelMethod: {
            type: DataTypes.ENUM,
            values: _.values(TRAVEL_METHODS)
        },
        departureAirport: DataTypes.STRING,
        flightNumber: DataTypes.STRING,
        arrivalDate: DataTypes.DATE,
        departureDate: DataTypes.DATE,
        otherTravelInformation: DataTypes.TEXT
    }, {
        classMethods: {
            associate(models) {
                Trip.belongsTo(models.User, {
                    foreignKey: {
                        name: 'userId',
                        allowNull: false
                    }
                });
                Trip.belongsTo(models.Destination, {
                    foreignKey: {
                        name: 'destinationId',
                        allowNull: true
                    }
                });
            },
            validateQuery(query) {
                return validateQuery(query, ALLOWED_QUERY_PARAMS);
            },
            getQueryObject(req) {
                return new Promise(resolve => {
                    if (req.user.role === 'USER') {
                        return resolve({
                            userId: req.user.id
                        });
                    } else if (req.user.role === 'MODERATOR') {
                        return db.User.findOne({
                            where: req.user.id
                        })
                        .then(user => user.getDestinations())
                        .then(objects => objects.map(object => object.id))
                        .then(destinationIds => {
                            resolve({
                                destinationId: {
                                    in: destinationIds
                                }
                            });
                        });
                    } else if (req.user.role === 'ADMIN') return resolve(req.query);
                });
            }
        },
        hooks: {
            beforeUpdate: [
                trip => {
                    if (trip.changed('status')) {
                        if (trip.status === TRIP_STATUSES.ACCEPTED) {
                            return trip.userActionToUser(trip.id, trip.status);
                        }
                        if (trip.status === TRIP_STATUSES.REJECTED) {
                            return trip.userInfoToUser(trip.status);
                        }
                    }
                    return Promise.resolve();
                }
            ],
            afterCreate: trip => trip.userInfoToUser(trip.status)
        },
        instanceMethods: {
            userActionToUser(tripId, tripStatus) {
                return Promise.all([
                    db.Destination.findById(this.destinationId),
                    db.User.findById(this.userId)
                ])
                .spread((destination, user) =>
                    db.MailTemplate
                    .findById(destination[`${tripStatus.toLowerCase()}StatusMailTemplateId`])
                    .then(template => {
                        if (template) {
                            user.sendDestinationAction(tripId, tripStatus.toLowerCase(),
                            destination, template.html);
                        }
                    })
                );
            },
            userInfoToUser(tripStatus) {
                return Promise.all([
                    db.Destination.findById(this.destinationId),
                    db.User.findById(this.userId)
                ])
                .spread((destination, user) =>
                db.MailTemplate
                .findById(destination[`${tripStatus.toLowerCase()}StatusMailTemplateId`])
                .then(template => {
                    if (template) {
                        user.sendDestinationInfo(tripStatus.toLowerCase(),
                        destination, template.html);
                    }
                })
                );
            }
        }
    });
    return Trip;
}
