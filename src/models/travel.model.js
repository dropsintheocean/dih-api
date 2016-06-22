import { TRAVEL_STATUSES } from '../components/constants';
import _ from 'lodash';

export default function (sequelize, DataTypes) {
    const Travel = sequelize.define('travel', {
        status: {
            type: DataTypes.ENUM,
            values: _.values(TRAVEL_STATUSES),
            defaultValue: TRAVEL_STATUSES.PENDING
        }
    }, {
        classMethods: {
            associate(models) {
                Travel.belongsTo(models.User, {
                    foreignKey: {
                        name: 'userId',
                        allowNull: false
                    }
                });
                Travel.belongsTo(models.Destination, {
                    foreignKey: {
                        name: 'destinationId',
                        allowNull: false
                    }
                });
            }
        }
    });
    return Travel;
}
