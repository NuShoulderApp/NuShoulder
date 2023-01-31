const users_db = function(sequelize, DataTypes) {
	return sequelize.define('users', {
		user_ID: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		first_name: {
			type: DataTypes.STRING(256),
			allowNull: false
		},
		last_name: {
			type: DataTypes.STRING(256),
			allowNull: false
		},
		user_type_ID: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: false
		}
	}, {
		tableName: 'users',
		timestamps: false
	});
};

export default users_db