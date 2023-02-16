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
		player_position: {
			type: DataTypes.STRING(256),
			allowNull: false
		},
		school_year: {
			type: DataTypes.STRING(256),
			allowNull: false
		},
		sport: {
			type: DataTypes.STRING(256),
			allowNull: false
		},
		gender: {
			type: DataTypes.STRING(256),
			allowNull: false
		},
		rookie_season: {
			type: DataTypes.STRING(256),
			allowNull: false
		},
		password: {
			type: DataTypes.STRING(256),
			allowNull: false
		},
		arm_length_left: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		arm_length_right: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		forearm_length_left: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		forearm_length_right: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		weight: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		height: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		date_birth: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		user_type_ID: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: false
		},
		player_number: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: false
		},
		customer_ID: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: false
		}
	}, {
		tableName: 'users',
		timestamps: false
	});
};

export default users_db